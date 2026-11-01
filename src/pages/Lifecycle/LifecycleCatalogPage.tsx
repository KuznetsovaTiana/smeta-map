import { Link, useSearchParams } from 'react-router-dom'
import { QueryFeedback } from '../../components/Lifecycle/QueryFeedback'
import { useContentQuery } from '../../hooks/useContentQuery'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { regionalLocation } from '../../utils/contentRoutes.ts'
import { getRegion } from '../../utils/routing'

export function LifecycleCatalogPage({ repository, normative = false }: { repository?: ContentRepository; normative?: boolean }) {
  const [params] = useSearchParams()
  const regionId = getRegion(params)
  const state = useContentQuery({ kind: 'catalog', regionId }, repository)
  if (state.status !== 'success') return <section className="lifecycle-page"><QueryFeedback state={state} regionId={regionId} /></section>
  const normativeDocumentIds = new Set(state.data.materials.filter(material => material.typeId === 'regulation').map(material => material.documentId))
  const documents = normative ? state.data.documents.filter(document => normativeDocumentIds.has(document.id)) : state.data.documents
  return <section className="lifecycle-page">
    <Link className="lifecycle-back" to={regionalLocation('/schema', regionId)}>← На главную карту</Link>
    <header className="lifecycle-heading"><p className="eyebrow">{regionId === 'moscow' ? 'Москва' : 'Регионы'}</p><h1>{normative ? 'Нормативная база' : 'Документы'}</h1>
      <p>{normative ? 'Подтверждённые нормативные материалы выбранного региона.' : 'Документные позиции выбранного региона, связанные с процессами жизненного цикла объекта.'}</p>
    </header>
    {documents.length ? <><p role="status">Документных позиций: {documents.length}</p><ul className="lifecycle-grid">{documents.map(document => <li key={document.id}>
      <Link className="lifecycle-card" to={regionalLocation(`/documents/${encodeURIComponent(document.id)}`, regionId)}><h2>{document.title}</h2>{document.description && <p>{document.description}</p>}<span>Документ и материалы →</span></Link>
    </li>)}</ul></> : <p className="lifecycle-status" role="status">{normative ? 'Подтверждённые нормативные материалы для этого региона пока не добавлены.' : 'Документы для этого региона пока не добавлены.'}</p>}
  </section>
}
