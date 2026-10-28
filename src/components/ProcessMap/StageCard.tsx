import { items } from '../../data/items'
import type { Stage } from '../../types/process'
import { Calculator, Files, Ruler, FileSpreadsheet, SearchCheck, Handshake, RefreshCw, ClipboardList, FileCheck, Receipt, ArrowUpRight } from 'lucide-react'
import { stageLabels } from './stageLabels'

interface StageCardProps {
  mobile: boolean
  selectedItemId: string | null
  onSelectDocument: (stageId: string, itemId: string) => void
  influence?: 'related' | 'muted'
  stage: Stage
  selected: boolean
  onSelect: (stageId: string) => void
}

export function StageCard({ stage, selected, onSelect, influence, mobile, selectedItemId, onSelectDocument }: StageCardProps) {
  const related = items.filter(item => item.stageId === stage.id && !item.layerId)
  const documents = related.filter(item => item.type === 'document' || item.type === 'regulation')
  const keyItems = documents.length ? documents : related
  const visible = keyItems.slice(0, keyItems.length > 3 ? 2 : 3)
  const Icon = [Calculator, Files, Ruler, FileSpreadsheet, SearchCheck, Handshake, RefreshCw, ClipboardList, FileCheck, Receipt][stage.order - 1] ?? Files
  // Подготовка → определение стоимости → выполнение и расчёты.
  const phase = stage.order <= 3 ? 'preparation' : stage.order <= 6 ? 'estimate' : 'execution'
  return (
    <div tabIndex={-1}
      className={`stage-card stage-card--${phase}${selected ? ' stage-card--selected' : ''}${influence === 'related' ? ' stage-card--influenced' : influence === 'muted' ? ' stage-card--muted' : ''}`}
      id={`stage-card-${stage.id}`}
      title={`${stage.title}\n${stage.shortDescription}`}
      >
      <button type="button" className="stage-card-trigger"
      aria-expanded={selected}
      aria-controls={selected ? `stage-details-${stage.id}` : undefined}
      aria-labelledby={`stage-title-${stage.id}`}
      aria-describedby={`stage-description-${stage.id}`}
      onClick={() => onSelect(stage.id)} />
      <Icon className="stage-card-icon" size={22} strokeWidth={1.5} aria-hidden="true" />
      <span className="stage-card-number">{String(stage.order).padStart(2, '0')}</span>
      <span className="stage-card-title" aria-hidden="true">{stageLabels[stage.id] ?? stage.title}</span>
      {!mobile && <div className="stage-card-items">{visible.map(item => <button key={item.id} type="button" title={item.title} aria-pressed={selectedItemId === item.id} onClick={() => onSelectDocument(stage.id, item.id)}>{item.abbreviation ?? item.title}</button>)}{keyItems.length > visible.length && <button type="button" onClick={() => { if (!selected) onSelect(stage.id) }} aria-label={`Все элементы этапа: ${stage.title}`}>+{keyItems.length - visible.length}</button>}</div>}
      <span className="stage-card-more" aria-hidden="true">Подробнее <ArrowUpRight size={14} strokeWidth={1.5} /></span>
      <span className="visually-hidden" id={`stage-title-${stage.id}`}>{stage.title}</span>
      <span className="visually-hidden" id={`stage-description-${stage.id}`}>{stage.shortDescription}</span>
    </div>
  )
}

