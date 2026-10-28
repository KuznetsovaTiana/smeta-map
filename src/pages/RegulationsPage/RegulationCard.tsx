import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Regulation } from '../../types/regulation'
import type { Region } from '../../types/region'
import { items } from '../../data/items'
import { stages } from '../../data/stages'
import { regulationTypes } from '../../data/regulations'
import { useItemResources } from '../../utils/useItemResources'
import { getResourceHref } from '../../utils/resourceLinks'

export function RegulationCard({ regulation, region, search }: { regulation: Regulation; region: Region; search: string }) {
  const links = new URLSearchParams(search)
  links.set('item', regulation.id)
  const { resources, loading, error } = useItemResources(regulation.id, region)
  const available = resources.filter(resource => getResourceHref(resource.url)).length
  return <li><Link className="catalog-card regulation-card" to={{ search: `?${links}` }}>
    <span className="catalog-type"><BookOpen size={20} strokeWidth={1.5} aria-hidden="true" />{regulationTypes.find(type => type.id === regulation.type)?.title}</span>
    <h3>{regulation.title}</h3>
    {regulation.shortTitle && <span className="catalog-abbreviation">{regulation.shortTitle}</span>}
    {regulation.documentNumber && <p className="catalog-stage">№ {regulation.documentNumber}</p>}
    <p className="catalog-description">{regulation.description}</p>
    <p className="catalog-stage">Этапы: {regulation.relatedStages.map(id => stages.find(stage => stage.id === id)?.title).filter(Boolean).join('; ') || 'Не указаны'}</p>
    <p className="catalog-stage">Документы и элементы: {regulation.relatedItems.map(id => items.find(item => item.id === id)?.title).filter(Boolean).join(', ') || 'Не указаны'}</p>
    <p className="catalog-materials">{loading ? 'Материалы: загрузка…' : error ? 'Материалы: не удалось загрузить' : `Материалы: ${available} · Готовится: ${resources.length - available}`}</p>
  </Link></li>
}
