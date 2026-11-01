import { useId, useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { LifecycleStructure, Process } from '../../types/lifecycle.ts'
import { compactProcessTitle, nextProcessIndex, processMapSummary } from '../../utils/lifecycleMap.ts'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { LifecycleTree } from './LifecycleTree'
import { useLifecycleMapLayout } from '../../hooks/useLifecycleMapLayout.ts'
import { LifecycleProcessRows } from './LifecycleProcessRows'

interface Props {
  structure: LifecycleStructure
  regionId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  repository?: ContentRepository
  initialOpen?: readonly string[]
}

export function LifecycleMap({ structure, regionId, selectedId, onSelect, repository, initialOpen }: Props) {
  const processes = [...structure.processes].sort((a, b) => a.order - b.order)
  const summary = (selectedId ? processMapSummary(structure, selectedId) : null)
  const activeId = summary?.process.id ?? null
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const id = useId()
  const panelId = `${id}-panel`
  const headingId = `${id}-heading`
  const columns = useLifecycleMapLayout()

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (activeId) buttons.current.get(activeId)?.focus({ preventScroll: true })
      onSelect(null)
      return
    }
    const next = nextProcessIndex(event.key, index, processes.length)
    if (next === null) return
    event.preventDefault()
    onSelect(processes[next].id)
    buttons.current.get(processes[next].id)?.focus({ preventScroll: true })
  }

  function renderCard(process: Process, index: number) {
    const selected = process.id === activeId
    return <li key={process.id} data-process-id={process.id} data-active={selected} className="lifecycle-map-step">
      <button type="button" className="lifecycle-process-button"
        ref={element => { if (element) buttons.current.set(process.id, element); else buttons.current.delete(process.id) }}
        aria-label={`Процесс ${String(process.order).padStart(2, '0')}: ${process.title}`}
        aria-pressed={selected} aria-expanded={selected} aria-controls={selected ? panelId : undefined}
        title={process.title} onClick={() => onSelect(selected ? null : process.id)} onKeyDown={event => onKeyDown(event, index)}>
        <span className="lifecycle-process-top"><span className="lifecycle-number">{String(process.order).padStart(2, '0')}</span><span aria-hidden="true">{selected ? '−' : '+'}</span></span>
        <svg className="lifecycle-process-mark" viewBox="0 0 64 28" aria-hidden="true" fill="none"><path d="M1 26h62M10 26V12h14V3h19v23M24 12h29v14M29 8h9M29 14h9M29 20h9M15 18h4" /></svg>
        <span className="lifecycle-process-title"><span className="lifecycle-process-title-full">{process.title}</span><span className="lifecycle-process-title-short" aria-hidden="true">{compactProcessTitle(process.title)}</span></span>
      </button>
    </li>
  }

  const panel = summary && <section className="lifecycle-process-info lifecycle-tree-panel" id={panelId} aria-labelledby={headingId} key={`${regionId}:${summary.process.id}`}>
      <div className="lifecycle-process-info-heading"><p className="eyebrow">Процесс {String(summary.process.order).padStart(2, '0')} · {regionId === 'moscow' ? 'Москва' : 'Регионы'}</p>
        <h2 id={headingId}>{summary.process.title}</h2>
        {summary.process.shortDescription && <p>{summary.process.shortDescription}</p>}
      </div>
      <LifecycleTree owner={{ kind: 'process', id: summary.process.id }} regionId={regionId} repository={repository} initialOpen={initialOpen} />
    </section>

  return <section className="lifecycle-map" aria-label="Карта жизненного цикла">
    <header className="lifecycle-map-heading"><h2>Жизненный цикл объекта</h2><span>{String(processes.length).padStart(2, '0')} процессов</span></header>
    <div className="lifecycle-map-viewport" role="region" aria-label="Последовательность процессов">
      {columns ? <LifecycleProcessRows processes={processes} columns={columns} activeId={activeId} renderCard={renderCard} panel={panel} />
        : <ol className={`lifecycle-processes lifecycle-map-track${activeId ? ' has-selection' : ''}`} style={{ '--lifecycle-columns': processes.map(process => `minmax(0, ${process.id === activeId ? 3.2 : .85}fr)`).join(' ') } as CSSProperties}>
          {processes.map(renderCard)}
        </ol>}
    </div>
    {!columns && panel}
    <span className="visually-hidden" role="status" aria-live="polite">{summary ? `Выбран процесс ${summary.process.order}: ${summary.process.title}` : 'Процесс не выбран'}</span>
  </section>
}
