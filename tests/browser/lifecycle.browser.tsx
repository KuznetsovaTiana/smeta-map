import { act, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { AppRoutes } from '../../src/App'
import { lifecycleContent } from '../../src/data/lifecycleContent'
import { contentRepository } from '../../src/services/contentRepositoryInstance'
import { LocalContentRepository } from '../../src/services/localContentRepository'
import type { ContentRepository, ContentRequestOptions } from '../../src/services/contentRepository'

import '../../src/index.css'
import '../../src/styles/editorial.css'
import '../../src/styles/region-theme.css'
import '../../src/styles/lifecycle.css'
import '../../src/styles/lifecycle-map.css'
import '../../src/styles/lifecycle-node.css'

// Только dev-страница тестов. Фикстуры и тестовые ссылки не входят в production entry.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.getElementById('fixture')!
const results = document.getElementById('results')!
let root: Root | undefined
let navigate: NavigateFunction
let failures = 0
let checks = 0
const errors: string[] = []
window.addEventListener('error', event => { errors.push(event.message) })
window.addEventListener('unhandledrejection', event => { errors.push(String(event.reason)) })

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function contains(text: string) { assert(host.textContent?.includes(text), `Не найден текст: ${text}`) }

export function Probe() {
  const currentNavigate = useNavigate()
  useEffect(() => { navigate = currentNavigate }, [currentNavigate])
  return <output data-location>{useLocation().pathname}{useLocation().search}</output>
}
async function unmount() {
  if (root) await act(async () => { root!.unmount() })
  root = undefined
  host.replaceChildren()
}
async function mount(path: string, repository: ContentRepository = contentRepository) {
  await unmount()
  root = createRoot(host)
  await act(async () => {
    root!.render(<StrictMode><MemoryRouter initialEntries={[path]}><AppRoutes repository={repository} /><Probe /></MemoryRouter></StrictMode>)
  })
}
async function click(text: string, selector = 'a,button') {
  const element = [...host.querySelectorAll<HTMLElement>(selector)].find(entry => entry.textContent?.trim() === text || entry.querySelector('.node-card-title')?.textContent === text)
  assert(element, `Нет элемента: ${text}`)
  await act(async () => { element.click() })
}
async function go(path: string | number) {
  await act(async () => { if (typeof path === 'number') navigate(path); else navigate(path) })
}
async function check(name: string, action: () => Promise<void>) {
  const row = document.createElement('li')
  checks++
  try { await action(); row.textContent = `PASS ${name}` }
  catch (error) { failures++; row.textContent = `FAIL ${name}: ${error instanceof Error ? error.message : String(error)}` }
  results.append(row)
}

async function press(selector: string) {
  const element = host.querySelector<HTMLButtonElement>(selector)
  assert(element, `Нет кнопки: ${selector}`)
  await act(async () => { element.click() })
}
const processButton = (id: string) => `[data-process-id="${id}"] button`
const nodeButton = (id: string) => `[data-node-id="${id}"] > button`
const documentButton = (id: string) => `[data-document-id="${id}"] > button`

await check('Все шесть процессов открываются на карте и повторно сворачиваются', async () => {
  await mount('/schema?region=moscow')
  assert(host.querySelectorAll('.lifecycle-process-button').length === 6, 'Не шесть процессов')
  for (const process of lifecycleContent.processes) {
    await press(processButton(process.id))
    assert(host.querySelector('.lifecycle-tree-panel h2')?.textContent === process.title, 'Неверный процесс')
    assert(!host.querySelector('.lifecycle-open-process'), 'Остался переход на отдельную страницу')
    assert(host.querySelector('[data-location]')?.textContent?.startsWith('/schema?'), 'Произошёл переход на страницу')
    await press(processButton(process.id))
    assert(!host.querySelector('.lifecycle-tree-panel'), 'Процесс не свернулся')
  }
})

await check('Независимое раскрытие П и Р, операций и документов', async () => {
  await mount('/schema?region=moscow&process=design')
  await press(nodeButton('design-p'))
  await press(nodeButton('design-r'))
  assert(host.querySelector(nodeButton('design-p-vor')) && host.querySelector(nodeButton('design-r-vor')), 'Соседняя ветвь скрылась')
  await press(nodeButton('design-p-vor'))
  await press(documentButton('moscow-design-p-vor-document'))
  contains('Материалы пока не добавлены')
  await press(nodeButton('design-r-vor'))
  assert(host.querySelector(documentButton('moscow-design-p-vor-document'))?.getAttribute('aria-expanded') === 'true', 'Состояние соседнего документа потеряно')
  await press(nodeButton('design-r'))
  assert(host.querySelector(documentButton('moscow-design-p-vor-document'))?.getAttribute('aria-expanded') === 'true', 'Закрытие Р закрыло П')
  await press(documentButton('moscow-design-p-vor-document'))
  assert(!host.querySelector('.lifecycle-materials'), 'Материалы не свернулись')
})

await check('Операции прямо у процесса и документы прямо у блока', async () => {
  await mount('/schema?region=moscow&process=demolition')
  assert(host.querySelectorAll('.lifecycle-tree-branch--operation').length === 8, 'Нет прямых операций сноса')
  assert(!host.querySelector('.lifecycle-tree-branch--block'), 'Навязан лишний блок')
  await press(nodeButton('demolition-local-estimate'))
  assert(host.querySelector(documentButton('moscow-demolition-local-estimate-document')), 'Нет документа операции')
  await press(processButton('construction'))
  await press(nodeButton('work-accounting'))
  assert(host.querySelectorAll('.lifecycle-tree-branch--document').length === 5, 'Нет пяти прямых документов блока')
})

await check('Документы на трёх уровнях, тип и несколько материалов', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.documentTypes.push({ id: 'test-type', title: 'Тестовый тип' })
  const catalog = snapshot.catalogs[0]
  for (const [kind, id] of [['process', 'design'], ['block', 'design-p'], ['operation', 'design-p-vor']] as const) {
    catalog.documents.push({ id: `test-${kind}`, regionId: 'moscow', owner: { kind, id }, order: 90, title: `test-position-${kind}`, documentTypeId: 'test-type' })
  }
  catalog.materials.push(
    { id: 'test-material-one', documentId: 'test-process', order: 1, typeId: 'example', title: 'Тестовый образец', url: 'https://disk.yandex.ru/d/test-only', format: 'PDF', description: 'Тестовое описание' },
    { id: 'test-material-two', documentId: 'test-process', order: 2, typeId: 'template', title: 'Тестовый шаблон', url: 'https://yadi.sk/i/test-only' },
    { id: 'test-material-empty', documentId: 'test-process', order: 3, typeId: 'reference', title: 'Тестовый материал без файла' },
  )
  await mount('/schema?region=moscow&process=design', new LocalContentRepository(snapshot))
  await press(documentButton('test-process'))
  const materials = host.querySelector('[data-document-id="test-process"]')!
  const links = [...materials.querySelectorAll<HTMLAnchorElement>('a')]
  assert(links.length === 2 && links.every(link => link.target === '_blank' && ['disk.yandex.ru', 'yadi.sk'].includes(new URL(link.href).hostname)), 'Неверные внешние ссылки')
  assert(!materials.querySelector('#material-test-material-empty a'), 'Есть открытие отсутствующего файла')
  contains('Тестовое описание'); contains('PDF'); contains('Тестовый тип'); contains('Материалов: 3 · доступно: 2')
  await press(nodeButton('design-p'))
  await press(documentButton('test-block'))
  await press(nodeButton('design-p-vor'))
  await press(documentButton('test-operation'))
  for (const kind of ['process', 'block', 'operation']) assert(host.querySelector(documentButton(`test-${kind}`))?.getAttribute('aria-expanded') === 'true', 'Документ уровня не раскрыт')
})

await check('Переключение региона не подставляет документ другого каталога', async () => {
  await mount('/schema?region=moscow&process=design&block=design-p&operation=design-p-vor&document=moscow-design-p-vor-document')
  assert(host.querySelector(documentButton('moscow-design-p-vor-document'))?.getAttribute('aria-expanded') === 'true', 'Прямая ссылка не раскрыла ветвь')
  await click('Регионы', '.region-switch button')
  assert(!host.querySelector('[data-document-id^="moscow-"]'), 'Остался документ Москвы')
  assert(host.querySelector(documentButton('regions-design-p-vor-document')), 'Не загружен региональный документ')
  assert(host.querySelector(documentButton('regions-design-p-vor-document'))?.getAttribute('aria-expanded') === 'false', 'Чужой документ автоматически раскрыт')
  assert(!host.querySelector('[data-location]')?.textContent?.includes('document=moscow-'), 'Чужой ID остался в адресе')
})

await check('Поздний ответ Москвы не заменяет дерево регионов', async () => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const slow = new Proxy(contentRepository, {
    get(target, property) {
      if (property === 'getNodeContent') return async (owner: Parameters<ContentRepository['getNodeContent']>[0], regionId: string, options?: ContentRequestOptions) => {
        if (regionId === 'moscow') await gate
        return target.getNodeContent(owner, regionId, options)
      }
      const value = Reflect.get(target, property)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  await mount('/schema?region=moscow&process=design&block=design-p&operation=design-p-vor', slow)
  contains('Загрузка содержимого')
  await click('Регионы', '.region-switch button')
  assert(host.querySelector(documentButton('regions-design-p-vor-document')), 'Нет регионального документа')
  await act(async () => { release(); await gate })
  assert(!host.querySelector('[data-document-id^="moscow-"]'), 'Поздний ответ заменил регион')
  assert(host.querySelector(documentButton('regions-design-p-vor-document')), 'Актуальные данные пропали')
})

await check('Ошибка каталога и повторная загрузка', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs = snapshot.catalogs.filter(catalog => catalog.regionId !== 'regions')
  await mount('/schema?region=regions', new LocalContentRepository(snapshot))
  assert(host.querySelector('[role="alert"]'), 'Нет явной ошибки каталога')
  await click('Повторить загрузку')
  assert(!host.querySelector('[data-document-id^="moscow-"]'), 'Ошибка подставила московский каталог')
})

await check('Старые ссылки раскрывают карту; неверная родительская цепочка отклоняется', async () => {
  await mount('/schema/processes/design/blocks/design-p/operations/design-p-vor/documents/moscow-design-p-vor-document?region=moscow')
  assert(host.querySelector(documentButton('moscow-design-p-vor-document'))?.getAttribute('aria-expanded') === 'true', 'Старая ссылка не раскрыла документ')
  assert(!host.querySelector('.node-view'), 'Открыта отдельная страница')
  await go('/schema/processes/construction/blocks/design-p?region=moscow')
  contains('Раздел не принадлежит указанной родительской структуре')
  await go('/documents/regions-design-p-vor-document?region=regions')
  assert(host.querySelector(documentButton('regions-design-p-vor-document')), 'Короткая ссылка документа не раскрыла карту')
})

await check('Назад/вперёд восстанавливает выбор процесса', async () => {
  await mount('/schema?region=moscow')
  await press(processButton('design')); await press(processButton('construction'))
  await go(-1)
  assert(host.querySelector(processButton('design'))?.getAttribute('aria-expanded') === 'true', 'Назад не восстановил процесс')
  await go(1)
  assert(host.querySelector(processButton('construction'))?.getAttribute('aria-expanded') === 'true', 'Вперёд не восстановил процесс')
})

await unmount()
for (const width of [375, 390, 768, 1024, 1366, 1440]) {
  await check(`Адаптивная карта и дерево: ${width}px`, async () => {
    for (const [page, type] of [['map-layout.html', 'lifecycle-map-layout'], ['node-layout.html', 'lifecycle-node-layout']]) {
      const frame = document.createElement('iframe')
      frame.style.cssText = `width:${width}px;height:900px;border:0;display:block`
      const outcome = new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('Таймаут iframe')) }, 30000)
        function receive(event: MessageEvent) {
          if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== type) return
          cleanup(); resolve(event.data)
        }
        function cleanup() { clearTimeout(timer); window.removeEventListener('message', receive) }
        window.addEventListener('message', receive)
      })
      frame.src = `./${page}`; host.append(frame)
      try { const result = await outcome; assert(result.ok, result.message ?? 'Ошибка layout') }
      finally { frame.remove() }
    }
  })
}
assert(!errors.length, errors.join('; '))
document.getElementById('summary')!.textContent = `Проверок: ${checks}; ошибок: ${failures}`
