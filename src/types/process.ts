import type { Region } from './region'

export type ViewMode = 'overview' | 'detailed'

export interface Stage {
  shortTitle: string
  id: string
  order: number
  title: string
  shortDescription: string
  description?: string
  /** Идентификаторы элементов из items.ts. */
  items: string[]
  previous: string[]
  next: string[]
  relatedStages?: string[]
  tags: string[]
  keywords?: string[]
}

export type ResourceType =
  | 'template'
  | 'example'
  | 'regulation'
  | 'methodology'
  | 'instruction'
  | 'video'
  | 'folder'
  | 'external-link'

export interface Resource {
  id: string
  title: string
  type: ResourceType
  url?: string
  source?: 'google-drive' | 'external'
  description?: string
}

/** Ресурсы сгруппированы по территории, независимо от источника хранения. */
export type RegionalResources = Record<Region, Resource[]>
export type ItemResources = Partial<Record<string, RegionalResources>>

export interface ProcessItem {
  layerId?: 'conditions' | 'pricing' | 'related'
  relatedDetails?: {
    purpose: string
    stageIds: string[]
    relationships: string[]
    dataMeaning: string
    steps?: string[]
    documents?: string[]
    note?: string
  }
  conditionDetails?: {
    costImpact: string
    accounting: string
    requiredInputs: string[]
  }
  id: string
  title: string
  abbreviation?: string
  type: 'document' | 'method' | 'calculation' | 'result' | 'condition' | 'regulation' | 'related'
  stageId?: string
  shortDescription?: string
  description?: string
  inputs?: string[]
  outputs?: string[]
  checklist?: string[]
  commonErrors?: string[]
  tags?: string[]
  keywords?: string[]
}

export interface ProcessConnection {
  id: string
  source: string
  target: string
  type: 'sequence' | 'input' | 'output' | 'influence' | 'correction' | 'related'
  label?: string
  required?: boolean
}
