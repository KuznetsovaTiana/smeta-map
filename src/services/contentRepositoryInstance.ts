import { lifecycleContent } from '../data/lifecycleContent.ts'
import type { ContentRepository } from './contentRepository.ts'
import { LocalContentRepository } from './localContentRepository.ts'

/** Единственная точка выбора источника. Компоненты получают контракт репозитория. */
export const contentRepository: ContentRepository = new LocalContentRepository(lifecycleContent)
