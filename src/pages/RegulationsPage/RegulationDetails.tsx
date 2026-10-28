import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Regulation } from '../../types/regulation'
import type { Region } from '../../types/region'
import { stages } from '../../data/stages'
import { items } from '../../data/items'
import { regulationTypes } from '../../data/regulations'
import { usePanelFocus } from '../../utils/usePanelFocus'
import { ResourceMaterials } from '../../components/Resources/ResourceMaterials'

export function RegulationDetails({ regulation, region, onClose }: { regulation: Regulation; region: Region; onClose: () => void }) {
  const root = useRef<HTMLElement>(null)
  usePanelFocus(root, regulation.id, onClose)
  useEffect(() => { root.current?.scrollIntoView({ block: 'start' }) }, [regulation.id])
  function schemaLink(stageId?: string, itemId?: string) {
    const params = new URLSearchParams({ region, mode: 'detailed' })
    if (stageId) params.set('stage', stageId)
    if (itemId) params.set('item', itemId)
    return { pathname: '/schema', search: `?${params}` }
  }
  return <article className="regulation-details" tabIndex={-1} ref={root} aria-labelledby="regulation-details-title">
    <div className="stage-details-heading"><h2 id="regulation-details-title">{regulation.title}</h2><button className="details-close" type="button" onClick={onClose}>Закрыть карточку</button></div>
    <dl><dt>Тип</dt><dd>{regulationTypes.find(type => type.id === regulation.type)?.title}</dd>
      <dt>Реквизиты</dt><dd>{regulation.documentNumber ? `№ ${regulation.documentNumber}` : 'Номер пока не указан'}{regulation.documentDate ? ` · ${regulation.documentDate}` : ' · Дата пока не указана'}</dd>
      <dt>Что регулирует</dt><dd>{regulation.scope ?? 'Описание содержания и сведения о редакции пока не добавлены.'}</dd>
      <dt>Где используется</dt><dd>{regulation.description}</dd>
    </dl>
    {!!regulation.relatedStages.length && <><h3>Связанные этапы</h3><ul className="regulation-relations">{regulation.relatedStages.map(id => {
      const stage = stages.find(stage => stage.id === id)
      return stage && <li key={id}><Link to={schemaLink(id)} state={{ fromSearch: true }}>{stage.order}. {stage.title}</Link></li>
    })}</ul></>}
    {!!regulation.relatedItems.length && <><h3>Связанные документы и элементы</h3><ul className="regulation-relations">{regulation.relatedItems.map(id => {
      const item = items.find(item => item.id === id)
      return item && <li key={id}><Link to={schemaLink(item.layerId ? undefined : item.stageId, item.id)} state={{ fromSearch: true }}>{item.title}</Link></li>
    })}</ul></>}
    <ResourceMaterials itemId={regulation.id} region={region} title="Ссылки и материалы" />
  </article>
}
