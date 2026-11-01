import { useId, useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LifecycleStructure } from '../../types/lifecycle.ts'
import { compactProcessTitle, nextProcessIndex, processMapSummary } from '../../utils/lifecycleMap.ts'
import { nodePath, regionalLocation } from '../../utils/contentRoutes.ts'

interface Props {
  structure: LifecycleStructure
  regionId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function LifecycleMap({ structure, regionId, selectedId, onSelect }: Props) {
  const processes = [...structure.processes].sort((a, b) => a.order - b.order)
  // Информация всегда есть при непустой структуре, в том числе после загрузки
  // или устаревшего выбранного ID. Повторный выбор не сворачивает область.
  const summary = (selectedId ? processMapSummary(structure, selectedId) : null)
    ?? (processes[0] ? processMapSummary(structure, processes[0].id) : null)
  const activeId = summary?.process.id ?? null
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const id = useId()
  const panelId = `${id}-panel`
  const headingId = `${id}-heading`

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (activeId) buttons.current.get(activeId)?.focus({ preventScroll: true })
      return
    }
    const next = nextProcessIndex(event.key, index, processes.length)
    if (next === null) return
    event.preventDefault()
    onSelect(processes[next].id)
    buttons.current.get(processes[next].id)?.focus({ preventScroll: true })
  }

  return <section className="lifecycle-map" aria-label="Карта жизненного цикла">
    <header className="lifecycle-map-heading"><h2>Жизненный цикл объекта</h2><span>{String(processes.length).padStart(2, '0')} процессов</span></header>
    <div className="lifecycle-map-viewport" role="region" aria-label="Последовательность процессов">
      <ol className={`lifecycle-processes lifecycle-map-track${activeId ? ' has-selection' : ''}`} style={{ '--lifecycle-columns': processes.map(process => `minmax(0, ${process.id === activeId ? 3.2 : .85}fr)`).join(' ') } as CSSProperties}>
        {processes.map((process, index) => {
          const selected = process.id === activeId
          return <li key={process.id} data-process-id={process.id} data-active={selected} className="lifecycle-map-step">
            <button type="button" className="lifecycle-process-button"
              ref={element => { if (element) buttons.current.set(process.id, element); else buttons.current.delete(process.id) }}
              aria-label={`Процесс ${String(process.order).padStart(2, '0')}: ${process.title}`}
              aria-pressed={selected} aria-expanded={selected} aria-controls={selected ? panelId : undefined}
              title={process.title} onClick={() => onSelect(process.id)} onKeyDown={event => onKeyDown(event, index)}>
              <span className="lifecycle-process-top"><span className="lifecycle-number">{String(process.order).padStart(2, '0')}</span><span aria-hidden="true">{selected ? '−' : '+'}</span></span>
              <svg className="lifecycle-process-mark" viewBox="0 0 64 28" aria-hidden="true" fill="none"><path d="M1 26h62M10 26V12h14V3h19v23M24 12h29v14M29 8h9M29 14h9M29 20h9M15 18h4" /></svg>
              <span className="lifecycle-process-title">{selected ? process.title : compactProcessTitle(process.title)}</span>
            </button>
          </li>
        })}
      </ol>
    </div>
    {summary && <section className="lifecycle-process-info" id={panelId} aria-labelledby={headingId} key={summary.process.id}>
      <div className="lifecycle-process-info-heading"><p className="eyebrow">Процесс {String(summary.process.order).padStart(2, '0')} · {regionId === 'moscow' ? 'Москва' : 'Регионы'}</p>
        <h2 id={headingId}>{summary.process.title}</h2>
        {summary.process.shortDescription && <p>{summary.process.shortDescription}</p>}
        {summary.process.description && <p>{summary.process.description}</p>}
        <Link className="lifecycle-open-process" to={regionalLocation(nodePath([{ kind: 'process', data: summary.process }]), regionId)}>Открыть процесс <span aria-hidden="true">↗</span></Link>
      </div>
      {(summary.blocks.length > 0 || summary.directOperations.length > 0) && <div className="lifecycle-process-composition"><h3>Состав процесса</h3><ul>
        {summary.blocks.map(block => <li key={block.id}>{block.title}</li>)}
        {summary.directOperations.map(operation => <li key={operation.id}>{operation.title}</li>)}
      </ul></div>}
    </section>}
    <span className="visually-hidden" role="status" aria-live="polite">{summary ? `Выбран процесс ${summary.process.order}: ${summary.process.title}` : 'Процесс не выбран'}</span>
  </section>
}
