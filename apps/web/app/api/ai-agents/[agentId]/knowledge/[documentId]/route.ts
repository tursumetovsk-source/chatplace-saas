import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../../lib/auth-context';
import { deleteKnowledgeFile, getVectorStoreFile, OpenAIRequestError } from '../../../../../../lib/openai';

async function findDocument(workspaceId: string, agentId: string, documentId: string) {
  return prisma.knowledgeDocument.findFirst({
    where: { id: documentId, aiAgentId: agentId, workspaceId },
    include: { aiAgent: { select: { vectorStoreId: true } } }
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ agentId: string; documentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { agentId, documentId } = await params;
  const document = await findDocument(account.workspaceId, agentId, documentId);
  if (!document) return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
  if (!document.openaiFileId || !document.aiAgent.vectorStoreId || document.status === 'FAILED') return NextResponse.json({ document });
  try {
    const remote = await getVectorStoreFile(document.aiAgent.vectorStoreId, document.openaiFileId);
    const status = remote.status === 'completed' ? 'READY' : remote.status === 'failed' ? 'FAILED' : 'PROCESSING';
    const updated = await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status, error: remote.last_error?.message?.slice(0, 1_000) || null }
    });
    return NextResponse.json({ document: updated });
  } catch (error) {
    const status = error instanceof OpenAIRequestError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось проверить документ' }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ agentId: string; documentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { agentId, documentId } = await params;
  const document = await findDocument(account.workspaceId, agentId, documentId);
  if (!document) return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
  if (document.openaiFileId && document.aiAgent.vectorStoreId) {
    try {
      await deleteKnowledgeFile(document.aiAgent.vectorStoreId, document.openaiFileId);
    } catch (error) {
      if (!(error instanceof OpenAIRequestError) || error.status !== 404) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось удалить документ из базы знаний' }, { status: 502 });
      }
    }
  }
  await prisma.knowledgeDocument.delete({ where: { id: document.id } });
  return NextResponse.json({ ok: true });
}
