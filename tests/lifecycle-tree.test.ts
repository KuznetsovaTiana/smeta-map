import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { LocalContentRepository } from '../src/services/localContentRepository.ts'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import type { NodeContent } from '../src/services/contentRepository.ts'
import type { NodeRef } from '../src/types/lifecycle.ts'
import { getMaterialHref } from '../src/utils/materialLinks.ts'

let server: ViteDevServer
let TreeContent: ComponentType<{ content: NodeContent; regionId: string }>
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
  TreeContent = (await server.ssrLoadModule('/src/components/Lifecycle/LifecycleTree.tsx')).LifecycleTreeContent
})
after(async () => { await server?.close() })

const repository = new LocalContentRepository(lifecycleContent)
async function render(owner: NodeRef, regionId = 'moscow', source = repository) {
  const result = await source.getNodeContent(owner, regionId)
  assert.ok(result.status === 'success')
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TreeContent, { content: result.data, regionId })))
}

test('дерево всех шести процессов показывает прямых потомков без внутренних ссылок', async () => {
  for (const process of lifecycleContent.processes) {
    const html = await render({ kind: 'process', id: process.id })
    for (const block of lifecycleContent.blocks.filter(block => block.processId === process.id)) assert.ok(html.includes(`data-node-id="${block.id}"`))
    for (const operation of lifecycleContent.operations.filter(operation => operation.parent.kind === 'process' && operation.parent.id === process.id)) assert.ok(html.includes(`data-node-id="${operation.id}"`))
    assert.ok(!html.includes('<a '))
    assert.ok(!html.includes('Открыть процесс'))
  }
})

test('блоки П и Р независимы; операции блока и прямые операции процесса не смешиваются', async () => {
  const p = await render({ kind: 'block', id: 'design-p' })
  assert.ok(p.includes('data-node-id="design-p-vor"'))
  assert.ok(!p.includes('data-node-id="design-r-vor"'))
  const r = await render({ kind: 'block', id: 'design-r' })
  assert.ok(r.includes('data-node-id="design-r-vor"'))
  assert.ok(!r.includes('data-node-id="design-p-vor"'))
  const direct = await render({ kind: 'process', id: 'demolition' })
  assert.ok(direct.includes('data-node-id="demolition-local-estimate"'))
  assert.ok(!direct.includes('lifecycle-tree-branch--block'))
})

test('документы поддерживаются на каждом уровне; потомки не подмешиваются к прямому каталогу', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.documentTypes.push({ id: 'test-tree-type', title: 'Тестовый тип документа' })
  for (const [kind, id] of [['process', 'design'], ['block', 'design-p'], ['operation', 'design-p-vor']] as const) {
    snapshot.catalogs[0].documents.push({ id: `test-tree-${kind}`, owner: { kind, id }, regionId: 'moscow', order: 99, title: `test-position-${kind}`, documentTypeId: 'test-tree-type' })
  }
  const source = new LocalContentRepository(snapshot)
  for (const [kind, id] of [['process', 'design'], ['block', 'design-p'], ['operation', 'design-p-vor']] as const) {
    const html = await render({ kind, id }, 'moscow', source)
    assert.ok(html.includes(`test-position-${kind}`))
    for (const other of ['process', 'block', 'operation'].filter(value => value !== kind)) assert.ok(!html.includes(`test-position-${other}`))
    assert.ok(html.includes('Тестовый тип документа'))
    assert.ok(html.includes('Материалов: 0'))
    assert.ok(html.includes('data-content-status="unavailable"'))
  }
})

test('каталоги изолированы; незаданный состав не заменяется пустым определённым', async () => {
  const moscow = await render({ kind: 'operation', id: 'design-p-vor' })
  const regions = await render({ kind: 'operation', id: 'design-p-vor' }, 'regions')
  assert.ok(moscow.includes('data-document-id="moscow-design-p-vor-document"'))
  assert.ok(!moscow.includes('regions-design-p-vor-document'))
  assert.ok(regions.includes('data-document-id="regions-design-p-vor-document"'))
  assert.ok(!regions.includes('moscow-design-p-vor-document'))
  assert.ok((await render({ kind: 'block', id: 'ncs' })).includes('Состав документов и материалов ещё не определён'))
  assert.ok(!(await render({ kind: 'process', id: 'design' })).includes('Документы на этом уровне не размещены'))
})

test('Яндекс Диск: только допустимые HTTPS-адреса, без поддоменов-двойников и чужих сервисов', () => {
  // Synthetic URLs are confined to tests, never copied to production catalogs.
  for (const url of ['https://disk.yandex.ru/d/test-only', 'https://yadi.sk/i/test-only']) assert.equal(getMaterialHref({ url }), url)
  for (const url of [undefined, '', '#', 'https://disk.yandex.ru/', 'http://disk.yandex.ru/d/test', 'https://disk.yandex.ru.evil.test/d/test', 'https://evil.disk.yandex.ru/d/test', 'https://yadi.sk.evil.test/test', 'https://drive.google.com/file/d/test', 'https://yandex.ru/d/test', 'https://user@disk.yandex.ru/d/test', 'https://disk.yandex.ru:444/d/test', 'javascript:alert(1)']) assert.equal(getMaterialHref({ url }), null, String(url))
  assert.equal(getMaterialHref({ url: 'https://yadi.sk/i/test-only', linkCheck: 'broken' }), null)
})
