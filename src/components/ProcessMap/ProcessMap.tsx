import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RelatedDocuments } from '../RelatedDocuments/RelatedDocuments'
import { InfluenceLayers } from '../InfluenceLayers/InfluenceLayers'
import { connections } from '../../data/connections'
import { stages } from '../../data/stages'
import { useMobileLayout } from '../../utils/useMobileLayout'
import { StageDetails } from '../StageDetails/StageDetails'
import { StageCard } from './StageCard'
import { ViewModeSwitch } from '../ViewModeSwitch/ViewModeSwitch'
import { useSchemaState } from '../../utils/useSchemaState'
import { DocumentSidebar } from '../Sidebar/DocumentSidebar'
import { getRegion } from '../../utils/routing'
import './ProcessMap.css'

const orderedStages = [...stages].sort((a, b) => a.order - b.order)

export function ProcessMap() {
  const { params, linkedItem, selectedStage, mode, detailed, invalidSelection, changeMode, selectDocument, closeItem, selectStage, closeStage } = useSchemaState()
  const location = useLocation()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const activeFactor = previewId ?? (linkedItem?.layerId ? linkedItem.id : null)
  const influenced = detailed ? connections.filter(connection => connection.type !== 'sequence' && connection.source === activeFactor).map(connection => connection.target) : []
  const mobile = useMobileLayout()
  const pendingStageScroll = useRef<string | null>(null)
  function selectStageFromCard(stageId: string) {
    pendingStageScroll.current = selectedStage?.id === stageId ? null : stageId
    selectStage(stageId)
  }
  const selectedStageId = selectedStage?.id
  useEffect(() => {
    if (!selectedStageId || pendingStageScroll.current !== selectedStageId) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`stage-details-${selectedStageId}`)
      if (!target) return
      pendingStageScroll.current = null
      const rect = target.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const header = document.querySelector<HTMLElement>('.header')
      const headerPosition = header ? getComputedStyle(header).position : ''
      const visibleTop = header && ['sticky', 'fixed'].includes(headerPosition)
        ? Math.max(0, header.getBoundingClientRect().bottom) : 0
      if (rect.top >= visibleTop && rect.top < viewportHeight) return
      const desiredTop = Math.max(visibleTop, viewportHeight * (mobile ? .3 : .55))
      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - desiredTop),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedStageId, mobile])
  useEffect(() => {
    if (!location.state?.fromSearch || !selectedStage) return
    const frame = requestAnimationFrame(() => {
      const target = params.has('item')
        ? document.querySelector<HTMLElement>('.document-sidebar')
        : document.getElementById(`stage-details-${selectedStage.id}`)
      target?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.key, selectedStage, mobile, params, location.state])

  const details = selectedStage ? <StageDetails key={selectedStage.id} stage={selectedStage} onClose={closeStage} /> : null

  return (
    <section className="process-map" aria-label="Карта этапов работы сметчика">
      <div className="process-map-toolbar">
        <span className="process-map-count">Процесс / {orderedStages.length} этапов</span>
        <ViewModeSwitch mode={mode} onChange={value => { setPreviewId(null); changeMode(value) }} />
      </div>
      <p className="process-map-hint" id="process-map-hint">
        <span className="process-map-hint-desktop">Последовательность этапов — от оценки стоимости до закрытия проекта.</span>
        <span className="process-map-hint-mobile">Этапы расположены сверху вниз.</span>
        {' '}Нажмите на карточку, чтобы раскрыть этап.
      </p>
      <div className="process-map-scroll" role="region" aria-label="Последовательность этапов" aria-describedby="process-map-hint">
        <div className={`process-map-track${selectedStage ? ' process-map-track--focused' : ''}`} role="list" style={{ '--process-progress': selectedStage ? `${(selectedStage.order + .5) / 12 * 100}%` : '0%', '--single-columns': orderedStages.map(stage => `minmax(0, ${stage.id === selectedStageId ? 3 : 1}fr)`).join(' ') } as CSSProperties}>
          {[orderedStages.slice(0, 5), orderedStages.slice(5)].map((row, rowIndex) => {
            const selectedColumn = selectedStage && row.some(stage => stage.id === selectedStage.id) ? (rowIndex === 0 ? selectedStage.order - 1 : 10 - selectedStage.order) : -1
            const columns = Array.from({ length: 5 }, (_, col) => `minmax(0, ${col === selectedColumn ? 1.25 : selectedColumn >= 0 ? .9375 : 1}fr)`).join(' ')
            return <div className="process-map-row" key={rowIndex} style={{ '--row-columns': columns } as CSSProperties}>
          {row.map(stage => (
            <div className="process-map-step" role="listitem" data-order={stage.order} data-reached={selectedStage ? stage.order <= selectedStage.order : false} key={stage.id} style={{ '--desktop-column': rowIndex === 0 ? stage.order : 11 - stage.order } as CSSProperties}>
              <StageCard compact={!!selectedStage && selectedStage.id !== stage.id} mobile={mobile} selectedItemId={params.get('item')} onSelectDocument={selectDocument} influence={influenced.length ? influenced.includes(stage.id) ? 'related' : 'muted' : undefined} stage={stage} selected={selectedStage?.id === stage.id} onSelect={selectStageFromCard} />
              {mobile && selectedStage?.id === stage.id && details}
              {stage.order < orderedStages.length && (
                <span className="process-map-connector" aria-hidden="true">
                  <svg viewBox="0 0 40 16" fill="none"><path d="M1 8h36m-6-6 6 6-6 6" /></svg>
                </span>
              )}
            </div>
          ))}
          </div>})}
        </div>
      </div>
      {!mobile && details}
      {invalidSelection && <p className="selection-empty" role="status">Указанный этап или элемент не найден. Выберите этап на карте или воспользуйтесь поиском.</p>}
      {detailed ? <>
        <InfluenceLayers onPreview={setPreviewId} />
        <RelatedDocuments onPreview={setPreviewId} />
      </> : linkedItem?.layerId && <div className="overview-selected-item"><DocumentSidebar item={linkedItem} region={getRegion(params)} onClose={closeItem} /></div>}
    </section>
  )
}


