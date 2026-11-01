import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../../src/App'
import '../../src/index.css'
import '../../src/styles/editorial.css'
import '../../src/styles/technical-motion.css'
import '../../src/styles/micro-interactions.css'
import '../../src/styles/stage-content.css'
import '../../src/styles/region-theme.css'
import '../../src/styles/viewport-overview.css'
import '../../src/styles/stage-focus.css'
import '../../src/styles/single-row-map.css'
import '../../src/styles/process-composition.css'
import '../../src/styles/lifecycle.css'
import '../../src/styles/lifecycle-map.css'
import '../../src/styles/lifecycle-node.css'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
const host = document.getElementById('root')!
const root = createRoot(host)
const paths = [
  '/schema/processes/pre-design',
  '/schema/processes/design',
  '/schema/processes/demolition',
  '/schema/processes/design/blocks/design-p',
  '/schema/processes/design/blocks/design-r',
  '/schema/processes/design/blocks/design-p/operations/design-p-vor',
  '/schema/processes/construction/blocks/work-accounting',
]

try {
  for (const path of paths) {
    await act(async () => { root.render(<StrictMode><MemoryRouter key={path} initialEntries={[`${path}?region=moscow`]}><AppRoutes /></MemoryRouter></StrictMode>) })
    assert(host.querySelector('.node-view'), `Не смонтирована страница: ${path}`)
    assert(host.querySelectorAll('.node-heading h1').length === 1, 'Нет единственного заголовка')
    assert(document.documentElement.scrollWidth <= innerWidth + 1, `Переполнение страницы ${path}`)
    for (const element of host.querySelectorAll<HTMLElement>('.node-card,.node-document-card,.node-heading h1,.lifecycle-breadcrumbs')) {
      const rect = element.getBoundingClientRect()
      assert(rect.width > 0 && rect.left >= -1 && rect.right <= innerWidth + 1, `Элемент вне экрана: ${path}`)
      assert(element.scrollWidth <= element.clientWidth + 1, `Текст выходит за границы: ${path}`)
    }
    const body = host.querySelector('.node-content-layout')!
    if (innerWidth < 768) {
      assert(getComputedStyle(body).gridTemplateColumns.split(' ').length === 1 || !body.classList.contains('node-content-layout--with-children'), 'На телефоне не одна колонка')
      const main = host.querySelector('.main-content')!.getBoundingClientRect()
      assert(Math.abs(main.left - (innerWidth - main.right)) < 2, 'Содержимое не центрировано')
    }
    assert(host.querySelector('.lifecycle-breadcrumbs a')?.getAttribute('href')?.includes('region=moscow'), 'Регион потерян в breadcrumbs')
    if (path.endsWith('work-accounting')) assert(host.querySelectorAll('.node-document-card').length === 5, 'Нет пяти форм учёта')
    if (path.endsWith('demolition')) assert(host.querySelectorAll('.node-operations .node-card').length === 8, 'Нет прямых операций сноса')
  }
  const regionButton = [...host.querySelectorAll<HTMLButtonElement>('.region-switch button')].find(button => button.textContent === 'Регионы')!
  await act(async () => { regionButton.click() })
  assert(host.querySelectorAll('.node-document-card').length === 5, 'Не обновлён региональный каталог')
  assert([...host.querySelectorAll('.node-document-card')].every(card => card.getAttribute('data-document-id')?.startsWith('regions-')), 'Подставлены московские документы')
  parent.postMessage({ type: 'lifecycle-node-layout', width: innerWidth, ok: true }, location.origin)
} catch (error) {
  parent.postMessage({ type: 'lifecycle-node-layout', width: innerWidth, ok: false, message: error instanceof Error ? error.message : String(error) }, location.origin)
} finally {
  await act(async () => { root.unmount() })
}
