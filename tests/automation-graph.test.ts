import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAutomationGraph } from '../apps/web/lib/automation-graph.ts';

test('accepts a valid Telegram automation graph', () => {
  const result = validateAutomationGraph({
    nodes: [
      { id: 'trigger', type: 'trigger.telegram.message', position: { x: 0, y: 0 }, config: { keyword: 'ПРАЙС' } },
      { id: 'message', type: 'message.send', position: { x: 100, y: 0 }, config: { text: 'Здравствуйте' } }
    ],
    edges: [{ id: 'edge', source: 'trigger', target: 'message' }]
  });
  assert.equal(result.error, undefined);
  assert.equal(result.graph?.nodes.length, 2);
});

test('rejects duplicate node ids and dangling edges', () => {
  const duplicate = validateAutomationGraph({ nodes: [
    { id: 'same', type: 'message.send', position: {}, config: {} },
    { id: 'same', type: 'message.send', position: {}, config: {} }
  ], edges: [] });
  assert.match(duplicate.error || '', /уникальными/);

  const dangling = validateAutomationGraph({
    nodes: [{ id: 'one', type: 'message.send', position: {}, config: {} }],
    edges: [{ id: 'bad', source: 'one', target: 'missing' }]
  });
  assert.match(dangling.error || '', /несуществующий/);
});

test('rejects unsupported blocks and oversized graphs', () => {
  const unsupported = validateAutomationGraph({ nodes: [{ id: 'x', type: 'shell.execute', position: {}, config: {} }], edges: [] });
  assert.match(unsupported.error || '', /недопустимый/);
  const oversized = validateAutomationGraph({
    nodes: Array.from({ length: 201 }, (_, index) => ({ id: String(index), type: 'message.send', position: {}, config: {} })),
    edges: []
  });
  assert.match(oversized.error || '', /превышает/);
});
