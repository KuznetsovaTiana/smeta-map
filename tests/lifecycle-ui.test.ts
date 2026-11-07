import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import type { ComponentProps, ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'
import { LocalContentRepository } from '../src/services/localContentRepository.ts'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import type { NodeContent } from '../src/services/contentRepository.ts'
import type { Material, MaterialType } from '../src/types/document.ts'
import type { LifecycleStructure, Process } from '../src/types/lifecycle.ts'
import type { ReactNode } from 'react'

// Существующий Vite трансформирует TSX для node:test, зависимости не добавляются.
let server: ViteDevServer
let NodeContentView: ComponentType<{ content: NodeContent }>
let MaterialList: ComponentType<{ materials: Material[]; types: MaterialType[] }>
let QueryFeedback: ComponentType<{ state: { status: string; message?: string; error?: { code: 'source-error'; message: string }; reload: () => Promise<void> }; regionId: string }>
let LifecycleMap: ComponentType<{ structure: LifecycleStructure; regionId: string; selectedId: string | null; onSelect: (id: string | null) => void }>
let LifecycleProcessRows: ComponentType<{ processes: Process[]; columns: 2 | 3; activeId: string | null; renderCard: (process: Process, index: number) => ReactNode; panel: ReactNode }>

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
  NodeContentView = (await server.ssrLoadModule('/src/components/Lifecycle/NodeContentView.tsx')).NodeContentView
  MaterialList = (await server.ssrLoadModule('/src/components/Lifecycle/MaterialList.tsx')).MaterialList
  QueryFeedback = (await server.ssrLoadModule('/src/components/Lifecycle/QueryFeedback.tsx')).QueryFeedback
  LifecycleMap = (await server.ssrLoadModule('/src/components/Lifecycle/LifecycleMap.tsx')).LifecycleMap
  LifecycleProcessRows = (await server.ssrLoadModule('/src/components/Lifecycle/LifecycleProcessRows.tsx')).LifecycleProcessRows
})
after(async () => { await server?.close() })

test('публичные материалы открываются в новой вкладке; недоступные не получают фиктивных ссылок', () => {
  for (const catalog of lifecycleContent.catalogs) {
    const html = renderToStaticMarkup(createElement(MaterialList, { materials: catalog.materials, types: lifecycleContent.materialTypes }))
    const links = html.match(/<a\s[^>]*>/g) ?? []
    assert.equal(links.length, catalog.materials.length)
    assert.ok(links.every(link => link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"')))
    assert.ok(!html.includes('href="#"'))
  }
  const unavailable = renderToStaticMarkup(createElement(MaterialList, { materials: [], types: lifecycleContent.materialTypes }))
  assert.ok(!unavailable.includes('<a '))
  assert.ok(unavailable.includes('Файлы и ссылки отсутствуют'))
})

async function content(kind: 'process' | 'block' | 'operation', id: string, region = 'moscow') {
  const result = await contentRepository.getNodeContent({ kind, id }, region)
  assert.equal(result.status, 'success')
  if (result.status !== 'success') throw new Error('Нет содержимого')
  return result.data
}

function renderNode(data: NodeContent) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(NodeContentView, { content: data })))
}

test('представления всех шести процессов открывают реальные дочерние узлы', async () => {
  const structure = await contentRepository.getStructure('moscow')
  assert.equal(structure.status, 'success')
  if (structure.status !== 'success') throw new Error('Нет структуры')
  for (const process of structure.data.processes) {
    const data = await content('process', process.id)
    const html = renderNode(data)
    assert.ok(html.includes(`<h1>${process.title}</h1>`))
    assert.equal(html.includes('Документы этого уровня'), data.availability.status !== 'no-direct-documents')
    if (process.id === 'demolition') {
      assert.ok(html.includes('/schema/processes/demolition/operations/demolition-local-estimate?region=moscow'))
      assert.ok(!html.includes('aria-label="Внутренние блоки"'))
    }
  }
})

test('breadcrumbs, возврат и ссылки документов сохраняют регион и полный путь', async () => {
  const html = renderNode(await content('operation', 'design-p-vor', 'regions'))
  assert.ok(html.includes('aria-label="Навигационная цепочка"'))
  assert.ok(html.includes('/schema/processes/design?region=regions'))
  assert.ok(html.includes('/schema/processes/design/blocks/design-p?region=regions'))
  assert.ok(html.includes('/schema/processes/design/blocks/design-p/operations/design-p-vor/documents/regions-design-p-vor-document?region=regions'))
  assert.ok(!html.includes('moscow-design-p-vor-document'))
})

test('прямые документы не смешиваются с вложенными; неизвестный состав отображается', async () => {
  const parent = renderNode(await content('process', 'construction'))
  assert.ok(!parent.includes('moscow-work-accounting-ks-2'))
  const block = renderNode(await content('block', 'work-accounting'))
  assert.ok(block.includes('moscow-work-accounting-ks-2'))
  assert.ok(block.includes('data-content-status="unavailable"'))
  assert.ok(!block.includes('class="lifecycle-operations"'))
  assert.ok(renderNode(await content('block', 'ncs')).includes('Состав документов и материалов ещё не определён'))
})

test('материал без допустимой ссылки не имеет открытия; новый тип отображается по справочнику', () => {
  const html = renderToStaticMarkup(createElement(MaterialList, {
    types: [{ id: 'new-type', title: 'Тестовый новый тип' }],
    materials: [{ id: 'test-only', documentId: 'test-document', title: 'Тестовый материал', order: 1, typeId: 'new-type', url: '#' }],
  }))
  assert.ok(html.includes('Тестовый новый тип'))
  assert.ok(html.includes('ссылка недоступна'))
  assert.ok(!html.includes('<a '))
})

test('несколько материалов: отдельные названия, типы, форматы, описания и только ссылки Яндекс Диска', () => {
  const html = renderToStaticMarkup(createElement(MaterialList, {
    types: [{ id: 'custom', title: 'Новый тип материала' }],
    materials: [
      { id: 'test-yandex-one', documentId: 'test-document', title: 'Первый тестовый материал', order: 1, typeId: 'custom', format: 'PDF', description: 'Описание первого материала', url: 'https://disk.yandex.ru/d/test-only' },
      { id: 'test-yandex-two', documentId: 'test-document', title: 'Второй тестовый материал', order: 2, typeId: 'custom', url: 'https://yadi.sk/i/test-only' },
      { id: 'test-missing', documentId: 'test-document', title: 'Файл отсутствует', order: 3, typeId: 'custom' },
      { id: 'test-prohibited', documentId: 'test-document', title: 'Недопустимый сервис', order: 4, typeId: 'custom', url: 'https://drive.google.com/file/d/test-only' },
    ],
  }))
  assert.equal((html.match(/target="_blank"/g) ?? []).length, 2)
  assert.equal((html.match(/rel="noopener noreferrer"/g) ?? []).length, 2)
  assert.ok(html.includes('Описание первого материала'))
  assert.ok(html.includes('Новый тип материала · PDF'))
  assert.ok(html.includes('https://disk.yandex.ru/d/test-only'))
  assert.ok(html.includes('https://yadi.sk/i/test-only'))
  assert.ok(!html.includes('href="https://drive.google.com'))
  assert.equal((html.match(/Файл пока отсутствует или ссылка недоступна/g) ?? []).length, 2)
})

test('загрузка, отсутствие результата и ошибка — разные состояния UI', () => {
  const render = (state: ComponentProps<typeof QueryFeedback>) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(QueryFeedback, state)))
  const loading = render({ state: { status: 'loading', reload: async () => {} }, regionId: 'regions' })
  assert.ok(loading.includes('Загрузка содержимого'))
  const missing = render({ state: { status: 'not-found', message: 'Нет выбранного документа', reload: async () => {} }, regionId: 'regions' })
  assert.ok(missing.includes('Нет выбранного документа'))
  const error = render({ state: { status: 'error', error: { code: 'source-error', message: 'Тестовая ошибка' }, reload: async () => {} }, regionId: 'regions' })
  assert.ok(error.includes('role="alert"'))
  assert.ok(error.includes('Повторить загрузку'))
})

test('прямые документы процесса и блока поддерживаются без смешивания с операциями', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs[0].documents.push(
    { id: 'test-process-position', regionId: 'moscow', owner: { kind: 'process', id: 'design' }, order: 1, title: 'Тестовая позиция процесса' },
    { id: 'test-block-position', regionId: 'moscow', owner: { kind: 'block', id: 'design-p' }, order: 1, title: 'Тестовая позиция блока' },
  )
  const repository = new LocalContentRepository(snapshot)
  for (const [kind, id, included, excluded] of [
    ['process', 'design', 'Тестовая позиция процесса', 'Тестовая позиция блока'],
    ['block', 'design-p', 'Тестовая позиция блока', 'Тестовая позиция процесса'],
  ] as const) {
    const result = await repository.getNodeContent({ kind, id }, 'moscow')
    assert.equal(result.status, 'success')
    if (result.status !== 'success') throw new Error('Нет содержимого')
    const html = renderNode(result.data)
    assert.ok(html.includes(included))
    assert.ok(!html.includes(excluded))
    assert.ok(!html.includes('moscow-design-p-vor-document'))
  }
})

test('частичное и полное наполнение отображаются по вычисленному статусу репозитория', async () => {
  const snapshot = structuredClone(lifecycleContent)
  const catalog = snapshot.catalogs[0]
  const document = catalog.documents.find(entry => entry.owner.id === 'design-p-vor')!
  catalog.materials.push(
    { id: 'test-one', documentId: document.id, typeId: 'example', order: 1, title: 'Тестовый образец', url: 'https://disk.yandex.ru/d/test-ui-only/view' },
    { id: 'test-two', documentId: document.id, typeId: 'template', order: 2, title: 'Тестовый шаблон' },
  )
  const repository = new LocalContentRepository(snapshot)
  const first = await repository.getOperation('design-p-vor', 'moscow')
  assert.equal(first.status, 'success')
  if (first.status !== 'success') throw new Error('Нет содержимого')
  assert.ok(renderNode(first.data).includes('data-content-status="partial"'))
  assert.ok(renderNode(first.data).includes('Доступно 1 из 2 материалов'))
  catalog.materials.find(material => material.id === 'test-two')!.url = 'https://disk.yandex.ru/d/test-ui-only-two/view'
  const second = await repository.getOperation('design-p-vor', 'moscow')
  assert.equal(second.status, 'success')
  if (second.status !== 'success') throw new Error('Нет содержимого')
  assert.ok(renderNode(second.data).includes('data-content-status="complete"'))
  assert.ok(renderNode(second.data).includes('Все материалы доступны: 2 из 2'))
})

test('карта: шесть процессов, раскрытие выбранного без перехода на страницу', async () => {
  const result = await contentRepository.getStructure('moscow')
  if (result.status !== 'success') throw new Error('Нет структуры')
  const renderMap = (selectedId: string | null, regionId = 'moscow') => renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(LifecycleMap, { structure: result.data, regionId, selectedId, onSelect: () => {} })))
  const initial = renderMap(null)
  assert.equal((initial.match(/aria-pressed="false"/g) ?? []).length, 6)
  assert.equal((initial.match(/aria-pressed="true"/g) ?? []).length, 0)
  assert.ok(!initial.includes('lifecycle-tree-panel'))
  assert.ok(!initial.includes('Открыть процесс'))
  assert.ok(!renderMap('missing').includes('lifecycle-tree-panel'))
  for (const process of result.data.processes) {
    const html = renderMap(process.id, 'regions')
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
    assert.ok(html.includes(process.title))
    assert.ok(!html.includes('/schema/processes/'))
    assert.ok(html.includes('lifecycle-tree-panel'))
    assert.ok(!html.includes('lifecycle-process-junction'))
    assert.ok(html.includes('minmax(0, 3.2fr)'))
    assert.equal((html.match(/minmax\(0, 0.85fr\)/g) ?? []).length, 5)
  }
  const design = renderMap('design')
  assert.ok(!design.includes('lifecycle-process-counts'))
  assert.ok(!design.includes('lifecycle-process-totals'))
})

test('шаблон блока и операции явно показывает процесс и контекст П/Р', async () => {
  const p = renderNode(await content('operation', 'design-p-local-estimate-calculation'))
  const r = renderNode(await content('operation', 'design-r-local-estimate'))
  assert.ok(p.includes('class="node-context"'))
  assert.ok(p.includes('Локальный сметный расчёт'))
  assert.ok(p.includes('Стадия «П» — разработка проектной документации'))
  assert.ok(!p.includes('design-r-local-estimate-document'))
  assert.ok(r.includes('Локальная смета'))
  assert.ok(r.includes('Стадия «Р» — разработка рабочей документации'))
  const direct = renderNode(await content('operation', 'demolition-local-estimate'))
  assert.ok(direct.includes('class="node-context"'))
  assert.ok(!direct.includes('<dt>Блок</dt>'))
})

test('карточки разделов показывают доступные сводки, а позиции — тип, статус и количество материалов', async () => {
  const design = renderNode(await content('process', 'design'))
  assert.ok(design.includes('node-card--block'))
  assert.ok(design.includes('Дочерних элементов: <strong>8</strong>'))
  const ncs = renderNode(await content('process', 'pre-design'))
  assert.ok(ncs.includes('Состав не определён'))
  const snapshot = structuredClone(lifecycleContent)
  const document = snapshot.catalogs[0].documents.find(entry => entry.owner.id === 'design-p-vor')!
  snapshot.documentTypes.push({ id: 'test-only-form', title: 'Тестовый тип' })
  document.documentTypeId = 'test-only-form'
  snapshot.catalogs[0].materials.push({ id: 'test-only-material', documentId: document.id, order: 1, title: 'Тестовый файл', typeId: 'template' })
  const result = await new LocalContentRepository(snapshot).getOperation('design-p-vor', 'moscow')
  assert.ok(result.status === 'success')
  const html = renderNode(result.data)
  assert.ok(html.includes('Тестовый тип'))
  assert.ok(html.includes('Файлы не добавлены'))
  assert.ok(html.includes('Доступно материалов: <strong>0</strong> из 1'))
  assert.ok(!html.includes('target="_blank"'))
})

test('панель вставлена ровно один раз после завершённой выбранной строки для каждого процесса', async () => {
  const result = await contentRepository.getStructure('moscow')
  assert.ok(result.status === 'success')
  const processes = result.data.processes
  for (const columns of [2, 3] as const) {
    for (const [selectedIndex, process] of processes.entries()) {
      const html = renderToStaticMarkup(createElement(LifecycleProcessRows, {
        processes, columns, activeId: process.id,
        renderCard: (entry, index) => createElement('li', { key: entry.id, 'data-card-index': index }, entry.title),
        panel: createElement('section', { 'data-test-panel': true }, 'Выбранный процесс'),
      }))
      assert.equal((html.match(/data-test-panel/g) ?? []).length, 1)
      const row = Math.floor(selectedIndex / columns)
      const endIndex = Math.min(processes.length - 1, (row + 1) * columns - 1)
      const rowStart = html.indexOf(`data-map-row="${row}"`)
      const lastCard = html.indexOf(`data-card-index="${endIndex}"`)
      const panel = html.indexOf('data-test-panel')
      const nextRow = html.indexOf(`data-map-row="${row + 1}"`)
      assert.ok(rowStart < lastCard && lastCard < panel)
      assert.ok(html.slice(lastCard, panel).includes('</ol>'))
      if (nextRow >= 0) assert.ok(panel < nextRow)
      assert.equal((html.match(/data-card-index/g) ?? []).length, 6)
    }
  }
})
