import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { addFileToVectorStore, createVectorStore, OpenAIRequestError, uploadKnowledgeFile } from '../../../../../lib/openai';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../../../lib/billing';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'json', 'html', 'pptx']);

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { agentId } = await params;
  const agent = await prisma.aiAgent.findFirst({ where: { id: agentId, workspaceId: account.workspaceId } });
  if (!agent) return NextResponse.json({ error: 'AI-агент не найден' }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Выберите документ' }, { status: 400 });
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(extension)) return NextResponse.json({ error: 'Поддерживаются PDF, DOC/DOCX, TXT, MD, CSV, JSON, HTML и PPTX' }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Размер документа должен быть от 1 байта до 20 МБ' }, { status: 400 });
  try {
    await assertWorkspaceQuota(account.workspaceId, 'KNOWLEDGE_BYTES', file.size);
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }

  const document = await prisma.knowledgeDocument.create({
    data: {
      workspaceId: account.workspaceId,
      aiAgentId: agent.id,
      title: file.name.slice(0, 240),
      mimeType: file.type || null,
      sizeBytes: file.size,
      textPreview: ['txt', 'md', 'csv', 'json'].includes(extension) ? (await file.text()).slice(0, 500) : null
    }
  });

  try {
    let vectorStoreId = agent.vectorStoreId;
    if (!vectorStoreId) {
      const vectorStore = await createVectorStore(`Virale AI — ${account.workspaceName} — ${agent.name}`);
      vectorStoreId = vectorStore.id;
      await prisma.aiAgent.update({ where: { id: agent.id }, data: { vectorStoreId } });
    }
    const uploaded = await uploadKnowledgeFile(file);
    const attached = await addFileToVectorStore(vectorStoreId, uploaded.id);
    const updated = await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { openaiFileId: uploaded.id, status: attached.status === 'completed' ? 'READY' : 'PROCESSING' }
    });
    return NextResponse.json({ document: updated }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обработать документ';
    await prisma.knowledgeDocument.update({ where: { id: document.id }, data: { status: 'FAILED', error: message.slice(0, 1_000) } });
    const status = error instanceof OpenAIRequestError ? error.status : 500;
    return NextResponse.json({ error: message, documentId: document.id }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}
