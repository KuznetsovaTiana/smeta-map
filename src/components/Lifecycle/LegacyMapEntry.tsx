import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { useContentQuery } from '../../hooks/useContentQuery'
import { getRegion } from '../../utils/routing'
import { matchesContentRoute, nodeReference } from '../../utils/contentRoutes'
import { QueryFeedback } from './QueryFeedback'

/** Compatibility entry only: resolve and validate old addresses before opening the map. */
export function LegacyMapEntry({ repository }: { repository?: ContentRepository }) {
  const route = useParams()
  const [params] = useSearchParams()
  const regionId = getRegion(params)
  const state = useContentQuery(route.documentId
    ? { kind: 'document', documentId: route.documentId, regionId }
    : { kind: 'node', owner: nodeReference(route) ?? { kind: 'process', id: '' }, regionId }, repository)
  if (state.status !== 'success') return <QueryFeedback state={state} regionId={regionId} />
  const chain = 'node' in state.data ? [...state.data.ancestors, state.data.node] : state.data.ancestors
  if (route.processId && !matchesContentRoute(chain, route)) return <p role="alert">Раздел не принадлежит указанной родительской структуре.</p>
  const next = new URLSearchParams({ region: regionId })
  for (const node of chain) next.set(node.kind, node.data.id)
  if (route.documentId) next.set('document', route.documentId)
  return <Navigate to={{ pathname: '/schema', search: `?${next}` }} replace />
}
