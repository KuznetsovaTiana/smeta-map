import { act, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import App, { AppRoutes } from '../../src/App'
import { lifecycleContent } from '../../src/data/lifecycleContent'
import { contentRepository } from '../../src/services/contentRepositoryInstance'
import { LocalContentRepository } from '../../src/services/localContentRepository'
import type { ContentRepository, ContentRequestOptions } from '../../src/services/contentRepository'
import type { NodeRef } from '../../src/types/lifecycle'
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
function heading(title: string) { assert(host.querySelector('main h1')?.textContent === title, `Ожидался заголовок: ${title}`) }
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

await check('Шесть процессов на главной, заголовки из репозитория', async () => {
  await mount('/schema?region=moscow')
  assert(host.querySelectorAll('.lifecycle-processes > li').length === 6, 'Не шесть карточек')
  for (const process of lifecycleContent.processes) assert(host.querySelector(`[data-process-id="${process.id}"] button`)?.getAttribute('aria-label')?.includes(process.title), 'Нет полного доступного названия')
  assert(host.querySelector('.lifecycle-process-info'), 'Нет информации о процессе при открытии карты')
  assert(!host.querySelector('.process-map'), 'Старая карта всё ещё активна')
})

await check('Открытие каждого из шести процессов', async () => {
  for (const process of lifecycleContent.processes) {
    await mount('/schema?region=moscow')
    const card = host.querySelector<HTMLElement>(`[data-process-id="${process.id}"] button`)
    assert(card, `Нет карточки ${process.title}`)
    await act(async () => { card.click() })
    assert(host.querySelector('[data-location]')?.textContent === '/schema?region=moscow', 'Выбор карточки изменил маршрут')
    assert(host.querySelector('.lifecycle-process-info h2')?.textContent === process.title, 'Не обновлена информация')
    await click('Открыть процесс ↗', '.lifecycle-open-process')
    heading(process.title)
    contains('Документы этого уровня')
  }
})

await check('Переходы процесс → П → ВОР → документ, кликабельные breadcrumbs', async () => {
  await mount('/schema/processes/design?region=moscow')
  await click('Стадия «П» — разработка проектной документации', '.node-card')
  heading('Стадия «П» — разработка проектной документации')
  await click('Ведомость объёмов работ (ВОР)', '.lifecycle-operations a')
  heading('Ведомость объёмов работ (ВОР)')
  assert(host.querySelectorAll('.lifecycle-breadcrumbs a').length === 4, 'Неполная цепочка операции')
  const card = host.querySelector<HTMLElement>('.lifecycle-documents .lifecycle-card')
  assert(card, 'Нет документной позиции')
  await act(async () => { card.click() })
  heading('Ведомость объёмов работ (ВОР)')
  contains('Файлы и ссылки отсутствуют')
  assert(host.querySelectorAll('.lifecycle-breadcrumbs a').length === 5, 'Неполная цепочка документа')
  await click('Стадия «П» — разработка проектной документации', '.lifecycle-breadcrumbs a')
  heading('Стадия «П» — разработка проектной документации')
})

await check('Снос: восемь прямых операций без пустого блока', async () => {
  await mount('/schema/processes/demolition?region=regions')
  assert(host.querySelectorAll('.lifecycle-operations li').length === 8, 'Нет восьми операций')
  assert(!host.querySelector('[aria-label="Внутренние блоки"]'), 'Лишний блок')
  await click('Локальная смета', '.lifecycle-operations a')
  heading('Локальная смета')
  assert(host.querySelectorAll('.lifecycle-breadcrumbs a').length === 3, 'Лишний уровень')
})

await check('Учёт работ: пять прямых документов, без операций-обёрток', async () => {
  await mount('/schema/processes/construction/blocks/work-accounting?region=moscow')
  assert(host.querySelectorAll('.lifecycle-documents .lifecycle-card').length === 5, 'Нет пяти форм')
  assert(!host.querySelector('.lifecycle-operations'), 'Созданы лишние операции')
  contains('КС-2'); contains('КС-3'); contains('КС-6а'); contains('М-29'); contains('М-15')
})

await check('Документы процесса, блока и операции не смешиваются', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs[0].documents.push(
    { id: 'test-process-document', regionId: 'moscow', owner: { kind: 'process', id: 'design' }, order: 1, title: 'Тестовый документ процесса' },
    { id: 'test-block-document', regionId: 'moscow', owner: { kind: 'block', id: 'design-p' }, order: 1, title: 'Тестовый документ блока' },
  )
  const repository = new LocalContentRepository(snapshot)
  await mount('/schema/processes/design?region=moscow', repository)
  contains('Тестовый документ процесса')
  assert(!host.querySelector('.lifecycle-documents')?.textContent?.includes('Тестовый документ блока'), 'Смешаны уровни')
  await go('/schema/processes/design/blocks/design-p?region=moscow')
  contains('Тестовый документ блока')
  assert(!host.querySelector('.lifecycle-documents')?.textContent?.includes('Тестовый документ процесса'), 'Смешаны уровни')
  await go('/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow')
  assert(host.querySelectorAll('.lifecycle-documents .lifecycle-card').length === 1, 'Неверный прямой каталог операции')
})

await check('Переключение региона сохраняет раздел; документ возвращает к владельцу', async () => {
  await mount('/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow')
  await click('Регионы', 'button')
  heading('Ведомость объёмов работ (ВОР)')
  assert(host.querySelector('[data-location]')?.textContent?.includes('region=regions'), 'Не обновлён регион')
  assert(host.querySelector('.app-layout')?.getAttribute('data-region') === 'regions', 'Не обновлена тема')
  const card = host.querySelector<HTMLAnchorElement>('.lifecycle-documents .lifecycle-card')!
  assert(card.getAttribute('href')?.includes('regions-design-p-vor-document'), 'Чужой документ')
  await act(async () => { card.click() })
  await click('Москва', 'button')
  assert(host.querySelector('[data-location]')?.textContent === '/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow', 'Не вернулись к владельцу')
})

await check('Отсутствующий материал региона не заменяется московским', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs[1].documents = []
  await mount('/schema/processes/construction/blocks/work-accounting?region=moscow', new LocalContentRepository(snapshot))
  assert(host.querySelectorAll('.lifecycle-documents .lifecycle-card').length === 5, 'Нет Москвы')
  await click('Регионы', 'button')
  assert(host.querySelectorAll('.lifecycle-documents .lifecycle-card').length === 0, 'Подставлены чужие документы')
  contains('Документы непосредственно на этом уровне не размещены')
})

await check('Прямая ссылка чужого региона и неверный родитель дают понятное отсутствие', async () => {
  await mount('/documents/moscow-design-p-vor-document?region=regions')
  contains('Документ не найден в выбранном регионе')
  await go('/schema/processes/construction/blocks/design-p?region=moscow')
  contains('Раздел не принадлежит указанному родителю')
  await go('/schema/processes/design/blocks/design-p/operations/missing?region=moscow')
  contains('Раздел или материал не найден')
})

await check('Состояние not-defined и отсутствие вымышленных открытий', async () => {
  await mount('/schema/processes/pre-design/blocks/ncs?region=moscow')
  contains('Состав документов и материалов ещё не определён')
  assert(host.querySelectorAll('a[target="_blank"]').length === 0, 'Фиктивная ссылка')
})

await check('Ошибки источника, отсутствующего каталога и повторная загрузка', async () => {
  let broken = true
  const repository = new LocalContentRepository(() => { if (broken) throw new Error('Тестовая ошибка источника'); return lifecycleContent })
  await mount('/schema?region=moscow', repository)
  contains('Тестовая ошибка источника')
  broken = false
  await click('Повторить загрузку', 'button')
  assert(host.querySelectorAll('.lifecycle-processes > li').length === 6, 'Повтор не сработал')
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs.pop()
  await mount('/schema?region=regions', new LocalContentRepository(snapshot))
  contains('Отсутствует обязательный региональный каталог')
})

await check('Реальные эффекты хуков: loading, смена региона и поздний ответ', async () => {
  let resolve!: () => void
  const gate = new Promise<void>(accept => { resolve = accept })
  class DelayedRepository extends LocalContentRepository {
    override getNodeContent(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
      if (regionId === 'moscow') {
        const old = super.getNodeContent(owner, regionId)
        return gate.then(() => old) // Намеренно игнорируем AbortSignal старого запроса.
      }
      return super.getNodeContent(owner, regionId, options)
    }
  }
  await mount('/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow', new DelayedRepository(lifecycleContent))
  contains('Загрузка содержимого')
  assert(!host.querySelector('.lifecycle-documents'), 'Показаны старые данные во время loading')
  await click('Регионы', 'button')
  const link = () => host.querySelector('.lifecycle-documents .lifecycle-card')?.getAttribute('href')
  assert(link()?.includes('regions-design-p-vor-document'), 'Нет нового ответа')
  await act(async () => { resolve(); await gate })
  assert(link()?.includes('regions-design-p-vor-document'), 'Старый ответ заменил актуальный')
})

await check('Размонтирование React во время загрузки не публикует поздний результат', async () => {
  let resolve!: (value: unknown) => void
  const source = new Promise<unknown>(accept => { resolve = accept })
  await mount('/schema?region=moscow', new LocalContentRepository(() => source))
  contains('Загрузка содержимого')
  await unmount()
  await act(async () => { resolve(lifecycleContent); await source })
  assert(host.childElementCount === 0, 'Поздний ответ после размонтирования')
})

await check('Частичное и полное наполнение; типы материалов из репозитория', async () => {
  const snapshot = structuredClone(lifecycleContent)
  const catalog = snapshot.catalogs[0]
  const document = catalog.documents.find(entry => entry.owner.id === 'design-p-vor')!
  snapshot.materialTypes.push({ id: 'test-type', title: 'Тестовый дополнительный тип' })
  catalog.materials.push(
    { id: 'test-material-one', documentId: document.id, order: 1, typeId: 'test-type', title: 'Тестовый материал', url: 'https://drive.google.com/file/d/test-browser-fixture/view' },
    { id: 'test-material-two', documentId: document.id, order: 2, typeId: 'template', title: 'Тестовый шаблон' },
  )
  await mount('/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow', new LocalContentRepository(snapshot))
  contains('Доступно 1 из 2 материалов')
  await go(`/documents/${document.id}?region=moscow`)
  contains('Доступно: 1 из 2 материалов'); contains('Тестовый дополнительный тип')
  assert(host.querySelectorAll('a[target="_blank"]').length === 1, 'Открывается недоступный материал')
  catalog.materials[1].url = 'https://drive.google.com/file/d/test-browser-fixture-two/view'
  await mount('/schema/processes/design/blocks/design-p/operations/design-p-vor?region=moscow', new LocalContentRepository(snapshot))
  contains('Все материалы доступны: 2 из 2')
})

await check('Назад/вперёд, прямая ссылка и повторное монтирование', async () => {
  await mount('/schema/processes/design?region=regions')
  await go('/schema/processes/design/blocks/design-r?region=regions')
  await go('/schema/processes/design/blocks/design-r/operations/design-r-local-estimate?region=regions')
  heading('Локальная смета')
  await go(-1); heading('Стадия «Р» — разработка рабочей документации')
  await go(1); heading('Локальная смета')
  await mount('/schema/processes/design/blocks/design-r/operations/design-r-local-estimate?region=regions')
  heading('Локальная смета')
})

await check('Каталоги используют новый репозиторий, старый поиск не подключён', async () => {
  await mount('/documents?region=moscow')
  assert(host.querySelectorAll('.lifecycle-card').length === 33, 'Не 33 позиции')
  assert(!host.querySelector('[role="combobox"]'), 'Активен старый поиск')
  await go('/regulations?region=regions')
  contains('Подтверждённые нормативные материалы для этого региона пока не добавлены')
})

await check('Карта: клавиатура, постоянная область сведений и сохранение выбора при смене региона', async () => {
  await mount('/schema?region=moscow')
  const cards = [...host.querySelectorAll<HTMLButtonElement>('.lifecycle-process-button')]
  await act(async () => { cards[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })) })
  assert(cards[5].getAttribute('aria-pressed') === 'true', 'End не выбирает последний процесс')
  assert(host.querySelector('.lifecycle-process-info h2')?.textContent === 'Снос', 'Нет информации о сносе')
  await click('Регионы', 'button')
  assert(host.querySelector('[data-process-id="demolition"] button')?.getAttribute('aria-pressed') === 'true', 'Выбор потерян')
  assert(host.querySelector('.lifecycle-open-process')?.getAttribute('href')?.includes('region=regions'), 'Ссылка другого региона')
  const active = host.querySelector<HTMLButtonElement>('[data-process-id="demolition"] button')!
  await act(async () => { active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
  assert(host.querySelector('.lifecycle-process-info h2')?.textContent === 'Снос', 'Esc скрыл информацию о процессе')
  await act(async () => { active.click() })
  assert(host.querySelector('.lifecycle-process-info h2')?.textContent === 'Снос', 'Повторное нажатие скрыло информацию')
})

for (const width of [375, 390, 768, 991, 1024, 1366, 1440, 1839]) {
  await check(`Геометрия карты ${width}×768: все процессы, без прокрутки и наложений во время выбора`, async () => {
    await unmount()
    const frame = document.createElement('iframe')
    frame.width = String(width); frame.height = '768'
    frame.style.cssText = 'position:fixed;left:0;top:0;border:0;opacity:0;pointer-events:none;'
    const result = new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Истекло время проверки геометрии')) }, 20000)
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'lifecycle-map-layout') return
        cleanup(); resolve(event.data)
      }
      function cleanup() { clearTimeout(timeout); window.removeEventListener('message', receive) }
      window.addEventListener('message', receive)
    })
    frame.src = './map-layout.html'
    document.body.append(frame)
    try { const output = await result; assert(output.ok, output.message ?? 'Ошибка геометрии') }
    finally { frame.remove() }
  })
}

for (const width of [375, 390, 768, 1024, 1366, 1440]) {
  await check(`Внутренние страницы ${width} px: процессы 01/03/06, блоки, операции, документы и регион`, async () => {
    await unmount()
    const frame = document.createElement('iframe')
    frame.width = String(width); frame.height = '768'
    frame.style.cssText = 'position:fixed;left:0;top:0;border:0;opacity:0;pointer-events:none;'
    const result = new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Истекло время проверки внутренних страниц')) }, 20000)
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'lifecycle-node-layout') return
        cleanup(); resolve(event.data)
      }
      function cleanup() { clearTimeout(timeout); window.removeEventListener('message', receive) }
      window.addEventListener('message', receive)
    })
    frame.src = './node-layout.html'
    document.body.append(frame)
    try { const output = await result; assert(output.ok, output.message ?? 'Ошибка внутренних страниц') }
    finally { frame.remove() }
  })
}

await check('HashRouter: реальное приложение открывает вложенный hash-адрес', async () => {
  await unmount()
  window.history.replaceState(null, '', '#/schema/processes/demolition?region=regions')
  root = createRoot(host)
  await act(async () => { root!.render(<StrictMode><App /></StrictMode>) })
  heading('Снос')
  assert(host.querySelectorAll('.lifecycle-operations li').length === 8, 'Не восстановлен hash-адрес')
})

await unmount()
if (errors.length) { failures++; const row = document.createElement('li'); row.textContent = `FAIL Необработанные ошибки: ${errors.join('; ')}`; results.append(row) }
document.getElementById('summary')!.textContent = failures ? `FAIL: ${failures}; проверок: ${checks}` : `PASS: ${checks}/${checks}. Смонтированные компоненты, эффекты и навигация проверены.`
document.title = failures ? 'FAIL — браузерные проверки' : `PASS ${checks}/${checks} — браузерные проверки`
