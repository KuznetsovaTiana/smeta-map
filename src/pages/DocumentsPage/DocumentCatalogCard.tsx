import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { stages } from '../../data/stages'
import type { ProcessItem } from '../../types/process'
import type { Region } from '../../types/region'
import { documentCategories, getDocumentCategory, getDocumentStages } from '../../utils/documentCatalog'
import { useItemResources } from '../../utils/useItemResources'
import { getResourceHref } from '../../utils/resourceLinks'

export function DocumentCatalogCard({ item, region }: { item: ProcessItem; region: Region }) {
  const itemStages = getDocumentStages(item, stages)
  const { resources, loading, error } = useItemResources(item.id, region)
  const available = resources.filter(resource => getResourceHref(resource.url)).length
  const pending = resources.length - available
  const params = new URLSearchParams({ region, mode: 'detailed' })
  if (itemStages[0]) params.set('stage', itemStages[0].id)
  params.set('item', item.id)
  const category = documentCategories.find(category => category.id === getDocumentCategory(item))

  return <li className="catalog-entry">
    <Link className="catalog-card" to={{ pathname: '/schema', search: `?${params}` }} state={{ fromSearch: true }}>
      <span className="catalog-type"><FileText size={20} strokeWidth={1.5} aria-hidden="true" />{category?.title}</span>
      <h2>{item.title}</h2>
      {item.abbreviation && <span className="catalog-abbreviation">{item.abbreviation}</span>}
      <p className="catalog-stage">Этап: {itemStages.length ? itemStages.map(stage => `${stage.order}. ${stage.title}`).join('; ') : 'Отдельный контур материального учёта'}</p>
      <p className="catalog-description">{item.shortDescription}</p>
      <p className="catalog-materials" aria-live="polite">{loading ? 'Материалы: загрузка…' : error ? 'Материалы: не удалось загрузить' : `Материалы: ${available}${pending ? ` · Готовится: ${pending}` : ''}`}</p>
    </Link>
  </li>
}
