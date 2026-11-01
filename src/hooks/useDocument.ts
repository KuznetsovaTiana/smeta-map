import type { ContentRepository } from '../services/contentRepository.ts'
import { useContentQuery } from './useContentQuery.ts'

export function useDocument(documentId: string, regionId: string, repository?: ContentRepository) {
  return useContentQuery({ kind: 'document', documentId, regionId }, repository)
}
