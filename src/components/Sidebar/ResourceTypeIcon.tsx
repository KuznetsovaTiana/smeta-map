import type { ResourceType } from '../../types/process'

const types: Record<ResourceType, { label: string; path: string }> = {
  example: { label: 'Пример', path: 'M5 3h10l4 4v14H5z M9 11h6 M9 15h6' },
  template: { label: 'Шаблон', path: 'M4 4h16v16H4z M4 9h16 M10 9v11' },
  regulation: { label: 'Нормативная база', path: 'M4 5h7l1 2 1-2h7v15h-7l-1 1-1-1H4z M12 7v14' },
  methodology: { label: 'Методические материалы', path: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5' },
  instruction: { label: 'Инструкция', path: 'M8 4H5v17h14V4h-3 M8 3h8v4H8z M8 12h8 M8 16h8' },
  folder: { label: 'Папка', path: 'M3 6h7l2 3h9v11H3z' },
  'external-link': { label: 'Внешняя ссылка', path: 'M14 3h7v7 M21 3 10 14 M10 5H3v16h16v-7' },
  video: { label: 'Видео', path: 'M3 5h18v14H3z M10 9l5 3-5 3z' },
}

export function ResourceTypeIcon({ type }: { type: ResourceType }) {
  const icon = types[type]
  return <span className="resource-type" title={icon.label}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d={icon.path} /></svg>
    <span className="visually-hidden">{icon.label}</span>
  </span>
}
