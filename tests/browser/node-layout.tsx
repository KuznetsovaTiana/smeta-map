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
    assert(host.querySelector('.lifecycle-tree-panel'), `Не раскрыта карта: ${path}`)
    assert(!host.querySelector('.node-view'), 'Открыта отдельная страница')
    assert(document.documentElement.scrollWidth <= innerWidth + 1, `Переполнение страницы ${path}`)
    for (const element of host.querySelectorAll<HTMLElement>('.lifecycle-tree-trigger,.lifecycle-tree-panel h2,.lifecycle-tree-nested')) {
      const rect = element.getBoundingClientRect()
      assert(rect.width > 0 && rect.left >= -1 && rect.right <= innerWidth + 1, `Элемент вне экрана: ${path}`)
      assert(element.scrollWidth <= element.clientWidth + 1, `Текст выходит за границы: ${path}`)
    }
    for (const button of host.querySelectorAll<HTMLButtonElement>('.lifecycle-tree-trigger')) assert(button.getBoundingClientRect().height >= 44, 'Малая область нажатия')
  }
  parent.postMessage({ type: 'lifecycle-node-layout', width: innerWidth, ok: true }, location.origin)
} catch (error) {
  parent.postMessage({ type: 'lifecycle-node-layout', width: innerWidth, ok: false, message: error instanceof Error ? error.message : String(error) }, location.origin)
} finally {
  await act(async () => { root.unmount() })
}
