import { FileText } from 'lucide-react'
import { useId, useRef } from 'react'
import { usePanelFocus } from '../../utils/usePanelFocus'
import { ItemFields } from './ItemFields'
import { itemTypeLabels } from '../../data/itemTypes'
import type { ProcessItem } from '../../types/process'
import type { Region } from '../../types/region'
import { ResourceMaterials } from '../Resources/ResourceMaterials'
import { NormativeLinks } from './NormativeLinks'
import { RelatedFields } from './RelatedFields'
import { ConditionFields } from './ConditionFields'
import './DocumentSidebar.css'

interface DocumentSidebarProps {
  item: ProcessItem
  region: Region
  onClose: () => void
}

export function DocumentSidebar({ item, region, onClose }: DocumentSidebarProps) {
  const root = useRef<HTMLElement>(null)
  const titleId = useId()
  usePanelFocus(root, item.id, onClose)
  return (
    <aside className="document-sidebar" ref={root} tabIndex={-1} aria-labelledby={titleId}>
      <div className="document-sidebar-content" key={item.id}>
      <div className="document-sidebar-heading"><h3 id={titleId} className="document-sidebar-title"><FileText size={24} strokeWidth={1.5} aria-hidden="true" />{item.title}</h3><button className="details-close" type="button" onClick={onClose}>Закрыть</button></div>
      {item.abbreviation && item.abbreviation !== item.title && <p className="document-sidebar-type">{item.abbreviation}</p>}
      {item.relatedDetails ? <RelatedFields item={item} /> : item.conditionDetails ? <ConditionFields item={item} /> : <ItemFields item={item} />}
      {!item.conditionDetails && !item.relatedDetails && <p className="document-sidebar-type">Тип: {itemTypeLabels[item.type]}</p>}
      <NormativeLinks itemId={item.id} region={region} />
      <ResourceMaterials itemId={item.id} region={region} title={item.conditionDetails || item.relatedDetails ? 'Связанные материалы' : 'Материалы'} />
      </div>
    </aside>
  )
}
