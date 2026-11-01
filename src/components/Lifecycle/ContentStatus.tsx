import type { ContentAvailability, ContentStatus as Status } from '../../types/catalog.ts'

const labels: Record<Status, string> = {
  'not-defined': 'Состав не определён',
  'no-direct-documents': 'Без прямых документов',
  unavailable: 'Файлы не добавлены',
  partial: 'Доступно частично',
  complete: 'Материалы доступны',
}

export function ContentStatus({ availability }: { availability: Extract<ContentAvailability, { ok: true }> }) {
  return <span className={`node-status node-status--${availability.status}`} data-content-status={availability.status} title={availability.message}>
    <span aria-hidden="true" className="node-status-dot" />{labels[availability.status]}
  </span>
}
