import { useParams, useSearchParams } from 'react-router-dom'
import { NodeContentView } from '../../components/Lifecycle/NodeContentView'
import { QueryFeedback } from '../../components/Lifecycle/QueryFeedback'
import { useNodeContent } from '../../hooks/useNodeContent'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { getRegion } from '../../utils/routing'
import { matchesContentRoute, nodeReference } from '../../utils/contentRoutes.ts'

export function LifecycleNodePage({ repository }: { repository?: ContentRepository }) {
  const params = useParams()
  const [search] = useSearchParams()
  const regionId = getRegion(search)
  const owner = nodeReference(params) ?? { kind: 'process', id: '' }
  const state = useNodeContent(owner, regionId, repository)
  if (state.status !== 'success') return <section className="lifecycle-page node-page"><QueryFeedback state={state} regionId={regionId} /></section>
  const chain = [...state.data.ancestors, state.data.node]
  if (!matchesContentRoute(chain, params)) return <section className="lifecycle-page node-page"><QueryFeedback state={{ status: 'not-found', message: 'Раздел не принадлежит указанному родителю.', reload: state.reload }} regionId={regionId} /></section>
  return <section className="lifecycle-page node-page"><NodeContentView content={state.data} /></section>
}
