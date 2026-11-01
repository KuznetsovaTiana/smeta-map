import type { ContentNode } from '../services/contentRepository.ts'
import type { NodeRef } from '../types/lifecycle.ts'

export interface ContentRouteParams {
  processId?: string
  blockId?: string
  operationId?: string
}

export function nodeReference(params: ContentRouteParams): NodeRef | null {
  if (params.operationId) return { kind: 'operation', id: params.operationId }
  if (params.blockId) return { kind: 'block', id: params.blockId }
  return params.processId ? { kind: 'process', id: params.processId } : null
}

/** Цепочка из репозитория — единственный источник канонического структурного пути. */
export function nodePath(chain: ContentNode[]): string {
  return '/schema' + chain.map(node => `/${node.kind === 'process' ? 'processes' : node.kind === 'block' ? 'blocks' : 'operations'}/${encodeURIComponent(node.data.id)}`).join('')
}

export function documentPath(chain: ContentNode[], documentId: string): string {
  return `${nodePath(chain)}/documents/${encodeURIComponent(documentId)}`
}

export function regionalLocation(pathname: string, regionId: string) {
  return { pathname, search: `?${new URLSearchParams({ region: regionId })}` }
}

export function matchesContentRoute(chain: ContentNode[], params: ContentRouteParams): boolean {
  const actual = chain.map(node => [node.kind, node.data.id])
  const expected = [
    ...(params.processId ? [['process', params.processId]] : []),
    ...(params.blockId ? [['block', params.blockId]] : []),
    ...(params.operationId ? [['operation', params.operationId]] : []),
  ]
  return JSON.stringify(actual) === JSON.stringify(expected)
}

/** При смене региона документ возвращает к владельцу, без подбора чужого аналога. */
export function regionChangePath(pathname: string): string {
  const documentAt = pathname.lastIndexOf('/documents/')
  if (documentAt < 0) return pathname
  return documentAt === 0 ? '/documents' : pathname.slice(0, documentAt)
}
