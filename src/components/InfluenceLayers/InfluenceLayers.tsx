import { Settings2, ChartNoAxesCombined } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { items } from '../../data/items'
import { influenceLayers } from '../../data/influenceLayers'
import { DocumentSidebar } from '../Sidebar/DocumentSidebar'
import { getRegion } from '../../utils/routing'
import './InfluenceLayers.css'

export function InfluenceLayers({ onPreview }: { onPreview: (id: string | null) => void }) {
  const [params, setParams] = useSearchParams()
  const selected = items.find(item => item.id === params.get('item') && (item.layerId === 'conditions' || item.layerId === 'pricing'))
  const [expanded, setExpanded] = useState<string[]>([])
  function select(id: string | null) {
    const next = new URLSearchParams(params)
    if (id) next.set('item', id)
    else next.delete('item')
    setParams(next)
    onPreview(null)
  }
  return <div className="influence-layers">
    {influenceLayers.map(layer => {
      const open = expanded.includes(layer.id) || selected?.layerId === layer.id
      return <section className={`influence-layer influence-layer--${layer.id}`} id={`layer-${layer.id}`} key={layer.id} aria-labelledby={`layer-title-${layer.id}`}>
        <div className="influence-layer-heading">
          <div><h2 id={`layer-title-${layer.id}`}>{layer.id === 'conditions' ? <Settings2 size={20} strokeWidth={1.5} aria-hidden="true" /> : <ChartNoAxesCombined size={20} strokeWidth={1.5} aria-hidden="true" />}{layer.title}</h2><p>{layer.description}</p></div>
          {<button type="button" className="details-close" aria-expanded={open} aria-controls={`layer-content-${layer.id}`} onClick={() => {
            if (open) { setExpanded(expanded.filter(id => id !== layer.id)); if (selected?.layerId === layer.id) select(null) }
            else setExpanded([...expanded, layer.id])
          }}>{open ? 'Свернуть' : 'Раскрыть'}</button>}
        </div>
        <div id={`layer-content-${layer.id}`} hidden={!open}>
          <div className="influence-pills">
            {items.filter(item => item.layerId === layer.id).map(item => <button id={`factor-${item.id}`} key={item.id} type="button" className="influence-pill" aria-pressed={selected?.id === item.id}
              onMouseEnter={() => onPreview(item.id)} onMouseLeave={() => onPreview(null)} onFocus={() => onPreview(item.id)} onBlur={() => onPreview(null)} onClick={() => select(selected?.id === item.id ? null : item.id)}>{layer.id === 'conditions' ? <Settings2 size={15} strokeWidth={1.5} aria-hidden="true" /> : <ChartNoAxesCombined size={15} strokeWidth={1.5} aria-hidden="true" />}{item.title}</button>)}
          </div>
          {selected?.layerId === layer.id && <DocumentSidebar item={selected} region={getRegion(params)} onClose={() => select(null)} />}
        </div>
      </section>
    })}
  </div>
}
