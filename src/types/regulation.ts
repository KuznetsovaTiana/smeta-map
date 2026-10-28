import type { Region } from './region'

export type RegulationType = 'law' | 'government-decree' | 'ministry-order' | 'methodology' | 'standard' | 'estimate-standard' | 'regional' | 'reference'

export interface Regulation {
  id: string
  title: string
  shortTitle?: string
  documentNumber?: string
  documentDate?: string
  type: RegulationType
  categoryId: string
  description?: string
  scope?: string
  regions?: Region[]
  relatedStages: string[]
  relatedItems: string[]
  tags?: string[]
}
