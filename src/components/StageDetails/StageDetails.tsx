import type { CSSProperties } from 'react'
import { Files, SlidersHorizontal, FileSpreadsheet, FileText, ArrowDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getRegion } from '../../utils/routing'
import { DocumentSidebar } from '../Sidebar/DocumentSidebar'
import { items } from '../../data/items'
import { estimateDevelopmentDetails as diagram } from '../../data/stageDetails'
import type { ProcessItem, Stage } from '../../types/process'
import './StageDetails.css'

const itemById = new Map(items.map(item => [item.id, item]))

interface StageDetailsProps {
  stage: Stage
  onClose: () => void
}

function FlowArrow() {
  return <div className="details-arrow" aria-hidden="true"><ArrowDown size={22} strokeWidth={1.5} /></div>
}

export function StageDetails({ stage, onClose }: StageDetailsProps) {
  const [params, setParams] = useSearchParams()
  const selectedItemId = params.get('item')
  const region = getRegion(params)
  function setSelectedItemId(id: string | null) {
    const next = new URLSearchParams(params)
    if (id) next.set('item', id)
    else next.delete('item')
    setParams(next)
  }
  const candidate = selectedItemId ? itemById.get(selectedItemId) : undefined
  const selectedItem = candidate && !candidate.layerId && (candidate.stageId === stage.id || (stage.id === diagram.stageId && diagram.inputIds.includes(candidate.id))) ? candidate : undefined

  const stageItems = items.filter(item => item.stageId === stage.id && !item.layerId)
  const documents = stageItems.filter(item => item.type === 'document' || item.type === 'regulation')
  const actions = stageItems.filter(item => ['method', 'calculation', 'condition'].includes(item.type))
  const results = stageItems.filter(item => item.type === 'result')
  function renderItem(id: string) {
    const item: ProcessItem | undefined = itemById.get(id)
    if (!item) return null
    return (
      <button key={id} type="button" className={`details-item${item.type === 'condition' ? ' details-item--condition' : ''}`}
        style={{ '--item-delay': Math.min([...diagram.inputIds, ...diagram.calculationIds, ...diagram.documentIds].indexOf(id) * 50, 350) + 'ms' } as CSSProperties}
        aria-pressed={id === selectedItemId} onClick={() => setSelectedItemId(id)}>
        <FileText className="details-item-icon" size={18} strokeWidth={1.5} aria-hidden="true" /><span>{item.title}</span>
        {diagram.optionalIds.includes(id) && <span className="details-optional">при необходимости</span>}
      </button>
    )
  }

  return (
    <section className="stage-details" id={`stage-details-${stage.id}`} aria-labelledby={`details-title-${stage.id}`}>
      <div className="stage-details-heading">
        <div><p className="eyebrow">Этап {String(stage.order).padStart(2, '0')}</p><h2 id={`details-title-${stage.id}`}>{stage.title}</h2></div>
        <button type="button" className="details-close" onClick={onClose}>Свернуть этап</button>
      </div>
      <div className="stage-summary">
        <section><h3>Что делает сметчик</h3><p>{stage.description ?? stage.shortDescription}</p></section>
        <section><h3>Основные действия</h3>{actions.length ? <ul>{actions.map(item => <li key={item.id}>{item.title}</li>)}</ul> : <p>{stage.shortDescription}</p>}</section>
      </div>
      <h3 className="stage-documents-heading">Ключевые документы{documents.length ? '' : ' и понятия'}</h3>
      <div className={`stage-details-body${selectedItem ? ' stage-details-body--with-item' : ''}`}><div>
      {stage.id === diagram.stageId ? <>
        <p className="details-explanation">Объёмы, нормы, цены и условия совместно определяют стоимость. Расчётные факторы рассматриваются вместе; объектный расчёт составляется при необходимости.</p>
        <div className="details-flow">
          <section className="details-group" aria-label="Исходные данные"><h3><Files size={16} strokeWidth={1.5} aria-hidden="true" />Исходные данные</h3><div className="details-inputs">{diagram.inputIds.map(renderItem)}</div></section>
          <FlowArrow />
          <section className="details-group" aria-label="Расчёт"><h3><SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />Расчёт</h3><div className="details-calculation">{diagram.calculationIds.map(renderItem)}</div></section>
          <FlowArrow />
          <section className="details-group" aria-label="Документы"><h3><FileSpreadsheet size={16} strokeWidth={1.5} aria-hidden="true" />Документы</h3><div className="details-documents">
            {diagram.documentIds.map((id, index) => <div className="details-document" key={id}>{index > 0 && <FlowArrow />}{renderItem(id)}</div>)}
          </div></section>
        </div>
        {!selectedItem && <p className="details-explanation">Выберите элемент схемы, чтобы увидеть его описание и материалы.</p>}
      </> : <div className="stage-owned-items">{(documents.length ? documents : stageItems).map(item => renderItem(item.id))}</div>}
      </div>{selectedItem && <DocumentSidebar item={selectedItem} region={region} onClose={() => setSelectedItemId(null)} />}</div>
      <section className="stage-outcome"><h3>Результат этапа</h3>{results.length ? <ul>{results.map(item => <li key={item.id}>{item.shortDescription ?? item.title}</li>)}</ul> : <p>{documents.length ? 'Подготовлены документы: ' + documents.map(item => item.abbreviation ?? item.title).join(', ') + '.' : stage.shortDescription}</p>}</section>
    </section>
  )
}

