import { FolderOpen } from 'lucide-react'
import { useId } from 'react'
import type { Region } from '../../types/region'
import { useItemResources } from '../../utils/useItemResources'
import { getResourceHref } from '../../utils/resourceLinks'
import { ResourceTypeIcon } from '../Sidebar/ResourceTypeIcon'
import '../Sidebar/DocumentSidebar.css'

export function ResourceMaterials({ itemId, region, title = 'Материалы' }: { itemId: string; region: Region; title?: string }) {
  const id = useId()
  const { resources, loading, error } = useItemResources(itemId, region)
  return (<section className="document-materials" aria-labelledby={id} aria-busy={loading}>
        <h4 id={id}><FolderOpen size={18} strokeWidth={1.5} aria-hidden="true" />{title}</h4>
        <p className="document-materials-region">Материалы: {region === 'moscow' ? 'Москва' : 'Регионы'}</p>
        <div aria-live="polite">
          {loading ? <p>Загрузка материалов…</p> : error ? <p>Не удалось загрузить материалы. Попробуйте позже.</p> : resources.length ? (
            <ul>{resources.map(resource => {
              const href = getResourceHref(resource.url)
              return <li className="resource-entry" key={resource.id}>
                <div className="resource-entry-heading"><ResourceTypeIcon type={resource.type} /><span>{resource.title}</span></div>
                {resource.description && <p>{resource.description}</p>}
                <div className="resource-entry-actions">
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Открыть: ${resource.title}`}>Открыть</a> : <><button type="button" disabled aria-label={`Открыть: ${resource.title}`}>Открыть</button><span className="resource-status">Скоро</span></>}
                </div>
              </li>
            })}</ul>
          ) : <p>Материалы для этого региона пока не добавлены.</p>}
        </div>
      </section>)
}
