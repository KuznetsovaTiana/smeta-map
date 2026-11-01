import type { NodeRef } from '../types/lifecycle.ts'
import type { ContentRepository } from '../services/contentRepository.ts'
import { useContentQuery } from './useContentQuery.ts'

/** Для процесса передаётся { kind: 'process', id: processId }; блоки и операции аналогично. */
export function useNodeContent(owner: NodeRef, regionId: string, repository?: ContentRepository) {
  return useContentQuery({ kind: 'node', owner, regionId }, repository)
}
