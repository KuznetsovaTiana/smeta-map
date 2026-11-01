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

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const root = createRoot(document.getElementById('root')!)

try {
  await act(async () => { root.render(<StrictMode><MemoryRouter initialEntries={['/schema?region=moscow']}><AppRoutes /></MemoryRouter></StrictMode>) })
  const cards = [...document.querySelectorAll<HTMLButtonElement>('.lifecycle-process-button')]
  assert(cards.length === 6, 'Ожидалось шесть процессов')
  function checkLayout() {
    const region = document.querySelector('.lifecycle-map-viewport')!
    const bounds = region.getBoundingClientRect()
    assert(region.scrollWidth <= region.clientWidth + 1, 'Внутри карты есть горизонтальная прокрутка')
    assert(document.documentElement.scrollWidth <= innerWidth + 1, 'Переполнение страницы')
    const rectangles = cards.map(card => card.getBoundingClientRect())
    for (const [index, rect] of rectangles.entries()) {
      assert(rect.width > 0 && rect.height > 0, `Карточка ${index + 1} скрыта`)
      assert(rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1, `Карточка ${index + 1} вне области навигации`)
      assert(cards[index].scrollHeight <= cards[index].clientHeight + 1, 'Текст карточки обрезан')
      assert(cards[index].scrollWidth <= cards[index].clientWidth + 1, 'Текст карточки выходит по ширине')
      for (const other of rectangles.slice(index + 1)) {
        const overlap = Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1 && Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1
        assert(!overlap, 'Карточки накладываются друг на друга')
      }
    }
    if (innerWidth < 1366) {
      const grid = document.querySelector('.lifecycle-map-track')!
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length
      assert(columns === (innerWidth < 768 ? 1 : 3), 'Неверное количество колонок')
      const track = grid.getBoundingClientRect()
      assert(Math.abs((track.left + track.right) / 2 - (bounds.left + bounds.right) / 2) < 2, 'Сетка не центрирована')
    }
  }
  checkLayout()
  function checkInfo() {
    const panel = document.querySelector<HTMLElement>('.lifecycle-process-info')
    assert(panel, 'Отсутствует информационная область')
    const style = getComputedStyle(panel)
    assert(style.display !== 'none' && style.visibility === 'visible' && panel.getBoundingClientRect().height > 0, 'Информация скрыта')
    const region = document.querySelector('.lifecycle-map-viewport')!.getBoundingClientRect()
    const box = panel.getBoundingClientRect()
    assert(box.top >= region.bottom - 1 && box.top - region.bottom <= 12, 'Лишняя пустота между картой и информацией')
    const selected = document.querySelector('.lifecycle-process-button[aria-pressed="true"]')!
    assert(panel.querySelector('h2')?.textContent === selected.getAttribute('title'), 'Неполное название в сведениях')
    assert(!panel.querySelector('.lifecycle-process-totals'), 'Остались удалённые счётчики')
    assert(panel.querySelector('.lifecycle-process-composition'), 'Нет состава процесса')
    assert(panel.querySelector('.lifecycle-open-process'), 'Нет кнопки перехода')
    assert(getComputedStyle(document.querySelector('.main-content')!).flexGrow === '0', 'Содержимое растягивается ради футера')
  }
  checkInfo()
  if (innerWidth >= 1366) {
    const centres = cards.map(button => { const rect = button.getBoundingClientRect(); return rect.top + rect.height / 2 })
    assert(Math.max(...centres) - Math.min(...centres) < 2, 'Карточки не в одну линию')
    assert(cards[5].getBoundingClientRect().right <= innerWidth, 'Шестая карточка за экраном')
  }
  for (let index = 0; index < cards.length; index++) {
    await act(async () => { cards[index].click() })
    checkLayout()
    await act(async () => { await wait(120) })
    checkLayout()
    await act(async () => { await wait(160) })
    checkLayout()
    await act(async () => { await wait(220) })
    checkLayout()
    checkInfo()
    assert(cards[index].getAttribute('aria-pressed') === 'true', 'Выбор не обновлён')
    assert(document.querySelectorAll('.lifecycle-process-button[aria-pressed="true"]').length === 1, 'Несколько выбранных процессов')
    const selected = cards[index].getBoundingClientRect()
    const inactive = cards[(index + 1) % cards.length].getBoundingClientRect()
    assert(selected.width > inactive.width + (innerWidth >= 1366 ? 10 : 5), 'Активная карточка не расширилась')
    if (innerWidth >= 1366) {
      assert(selected.width > inactive.width * 3, 'Недостаточно выраженное увеличение активной карточки')
      const compact = cards.filter((_card, cardIndex) => cardIndex !== index).map(card => card.getBoundingClientRect().width)
      assert(Math.max(...compact) - Math.min(...compact) < 2, 'Неактивные карточки сжаты непропорционально')
    }
    assert(cards[index].querySelector('.lifecycle-process-title')?.textContent === cards[index].getAttribute('title'), 'Полное название активной карточки отсутствует')
    assert(cards.filter((_card, cardIndex) => cardIndex !== index).every(card => !card.querySelector('.lifecycle-process-counts')), 'В неактивных карточках остались подробности')
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      assert(getComputedStyle(cards[index]).transitionDuration.split(',').every(value => parseFloat(value) === 0), 'Переходы не отключены при reduced motion')
      const panel = document.querySelector('.lifecycle-process-info')!
      assert(getComputedStyle(panel).animationDuration.split(',').every(value => parseFloat(value) === 0), 'Анимация сведений не отключена')
    }
    const link = document.querySelector('.lifecycle-open-process')
    assert(link?.getAttribute('href')?.includes('region=moscow'), 'Нет перехода выбранного региона')
  }
  await act(async () => { cards[5].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })) })
  assert(cards[0].getAttribute('aria-pressed') === 'true', 'Home не выбирает первый процесс')
  const regionButton = [...document.querySelectorAll<HTMLButtonElement>('.region-switch button')].find(button => button.textContent === 'Регионы')!
  await act(async () => { regionButton.click() })
  assert(document.querySelector('.lifecycle-process-button[aria-pressed="true"]')?.getAttribute('aria-label') === cards[0].getAttribute('aria-label'), 'Выбор потерян при смене региона')
  assert(document.querySelector('.lifecycle-open-process')?.getAttribute('href')?.includes('region=regions'), 'Не обновлён регион перехода')
  assert(document.querySelector('.app-layout')?.getAttribute('data-region') === 'regions', 'Не обновлена тема')
  parent.postMessage({ type: 'lifecycle-map-layout', width: innerWidth, ok: true, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }, location.origin)
} catch (error) {
  parent.postMessage({ type: 'lifecycle-map-layout', width: innerWidth, ok: false, message: error instanceof Error ? error.message : String(error) }, location.origin)
} finally {
  await act(async () => { root.unmount() })
}
