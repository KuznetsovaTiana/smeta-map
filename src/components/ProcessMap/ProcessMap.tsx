import { useEffect, useState } from 'react'
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
        <span className="process-map-count">{orderedStages.length} основных этапов</span>
        <ViewModeSwitch mode={mode} onChange={value => { setPreviewId(null); changeMode(value) }} />
      </div>
      <p className="process-map-hint" id="process-map-hint">
        <span className="process-map-hint-desktop">Последовательность этапов — от оценки стоимости до закрытия проекта.</span>
        <span className="process-map-hint-mobile">Этапы расположены сверху вниз.</span>
        {' '}Нажмите на карточку, чтобы раскрыть этап.
      </p>
      <div className="process-map-scroll" role="region" aria-label="Последовательность этапов" aria-describedby="process-map-hint">
        <ol className="process-map-track">
          {orderedStages.map((stage, index) => (
            <li className="process-map-step" key={stage.id}>
              <StageCard mobile={mobile} selectedItemId={params.get('item')} onSelectDocument={selectDocument} influence={influenced.length ? influenced.includes(stage.id) ? 'related' : 'muted' : undefined} stage={stage} selected={selectedStage?.id === stage.id} onSelect={selectStage} />
              {mobile && selectedStage?.id === stage.id && details}
              {index < orderedStages.length - 1 && (
                <span className="process-map-connector" aria-hidden="true">
                  <svg viewBox="0 0 40 16" fill="none"><path d="M1 8h36m-6-6 6 6-6 6" /></svg>
                </span>
              )}
            </li>
          ))}
        </ol>
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


