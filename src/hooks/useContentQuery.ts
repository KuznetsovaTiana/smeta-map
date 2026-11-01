import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { LifecycleStructure, NodeRef } from '../types/lifecycle.ts'
import type { RegionalCatalog } from '../types/catalog.ts'
import type { ContentRepository, ContentRequestOptions, ContentResult, DocumentContent, NodeContent } from '../services/contentRepository.ts'
import { contentRepository } from '../services/contentRepositoryInstance.ts'
import { createContentRequest } from '../services/contentRequest.ts'

export type ContentQuery =
  | { kind: 'structure'; regionId: string }
  | { kind: 'node'; regionId: string; owner: NodeRef }
  | { kind: 'document'; regionId: string; documentId: string }
  | { kind: 'catalog'; regionId: string }

export type ContentQueryData<Q extends ContentQuery> = Q extends { kind: 'structure' } ? LifecycleStructure
  : Q extends { kind: 'node' } ? NodeContent
  : Q extends { kind: 'document' } ? DocumentContent : RegionalCatalog

/** Тип результата определяется видом запроса, без привязки к локальному источнику. */
function execute<Q extends ContentQuery>(repository: ContentRepository, query: Q, options: ContentRequestOptions): Promise<ContentResult<ContentQueryData<Q>>> {
  const result = query.kind === 'structure' ? repository.getStructure(query.regionId, options)
    : query.kind === 'node' ? repository.getNodeContent(query.owner, query.regionId, options)
    : query.kind === 'document' ? repository.getDocument(query.documentId, query.regionId, options)
    : repository.getRegionalCatalog(query.regionId, options)
  return result as Promise<ContentResult<ContentQueryData<Q>>>
}

export function useContentQuery<Q extends ContentQuery>(query: Q, repository: ContentRepository = contentRepository) {
  // Ключ содержит регион и полный выбор. Новый контроллер уже в первом render не имеет старых данных.
  const key = JSON.stringify(query)
  const request = useMemo(() => {
    const selection = JSON.parse(key) as Q
    return createContentRequest<ContentQueryData<Q>>(options => execute(repository, selection, options))
  }, [repository, key])
  const state = useSyncExternalStore(request.subscribe, request.getSnapshot, request.getSnapshot)
  useEffect(() => {
    void request.reload()
    return request.cancel
  }, [request])
  return { ...state, loading: state.status === 'loading', reload: request.reload }
}
