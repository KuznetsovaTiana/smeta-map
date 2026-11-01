import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs'
import { MaterialList } from '../../components/Lifecycle/MaterialList'
import { QueryFeedback } from '../../components/Lifecycle/QueryFeedback'
import { useDocument } from '../../hooks/useDocument'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { documentPath, matchesContentRoute, nodePath, regionalLocation } from '../../utils/contentRoutes.ts'
import { getRegion } from '../../utils/routing'
import { getMaterialHref } from '../../utils/materialLinks.ts'

export function LifecycleDocumentPage({ repository }: { repository?: ContentRepository }) {
  const params = useParams()
  const [search] = useSearchParams()
  const regionId = getRegion(search)
  const state = useDocument(params.documentId ?? '', regionId, repository)
  if (state.status !== 'success') return <section className="lifecycle-page"><QueryFeedback state={state} regionId={regionId} /></section>
  const content = state.data
  if (!params.processId) return <Navigate to={regionalLocation(documentPath(content.ancestors, content.document.id), regionId)} replace />
  if (!matchesContentRoute(content.ancestors, params)) return <section className="lifecycle-page"><QueryFeedback state={{ status: 'not-found', message: 'Документ не принадлежит указанному разделу.', reload: state.reload }} regionId={regionId} /></section>
  const available = content.materials.filter(material => getMaterialHref(material) !== null)
  return <section className="lifecycle-page">
    <Breadcrumbs chain={content.ancestors} regionId={regionId} document={content.document} />
    <Link className="lifecycle-back" to={regionalLocation(nodePath(content.ancestors), regionId)}>← К разделу документа</Link>
    <header className="lifecycle-heading"><p className="eyebrow">Документ · {regionId === 'moscow' ? 'Москва' : 'Регионы'}</p><h1>{content.document.title}</h1>{content.document.description && <p>{content.document.description}</p>}</header>
    <section aria-label="Связанные материалы"><h2>Материалы</h2>
      {content.materials.length > 0 && <p role="status">{available.length === content.materials.length ? 'Все материалы доступны' : 'Доступно'}: {available.length} из {content.materials.length} материалов</p>}
      <MaterialList materials={content.materials} types={content.materialTypes} />
    </section>
  </section>
}
