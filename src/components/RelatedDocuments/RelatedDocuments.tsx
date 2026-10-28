import { Files } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { relatedBlock, relatedItems } from '../../data/relatedItems'
import { DocumentSidebar } from '../Sidebar/DocumentSidebar'
import { getRegion } from '../../utils/routing'
import './RelatedDocuments.css'

export function RelatedDocuments({ onPreview }: { onPreview: (id: string | null) => void }) {
  const [params, setParams] = useSearchParams()
  const selected = relatedItems.find(item => item.id === params.get('item'))
  const [expanded, setExpanded] = useState(false)
  const open = expanded || !!selected
  function select(id: string | null) {
    const next = new URLSearchParams(params)
    if (id) next.set('item', id)
    else next.delete('item')
    setParams(next)
    onPreview(null)
  }
  return <section className="related-documents" aria-labelledby="related-title">
    <div className="influence-layer-heading"><div><h2 id="related-title">{relatedBlock.title}</h2><p>{relatedBlock.description}</p></div>
      {<button type="button" className="details-close" aria-expanded={open} aria-controls="related-content" onClick={() => {
        if (open) { setExpanded(false); if (selected) select(null) }
        else setExpanded(true)
      }}>{open ? 'Свернуть' : 'Раскрыть'}</button>}
    </div>
    <div id="related-content" hidden={!open}>
      <div className="related-grid">{relatedItems.map(item => <button key={item.id} type="button" className="related-card" id={`related-${item.id}`}
        aria-pressed={selected?.id === item.id} onClick={() => select(selected?.id === item.id ? null : item.id)}
        onMouseEnter={() => onPreview(item.id)} onMouseLeave={() => onPreview(null)} onFocus={() => onPreview(item.id)} onBlur={() => onPreview(null)}>
        <span className="related-card-title"><Files size={18} strokeWidth={1.5} aria-hidden="true" />{item.title}</span><small>{item.shortDescription}</small>
      </button>)}</div>
      {selected && <DocumentSidebar item={selected} region={getRegion(params)} onClose={() => select(null)} />}
    </div>
  </section>
}
