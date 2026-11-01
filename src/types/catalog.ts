import type { DocumentPosition, DocumentType, Material, MaterialType } from './document.ts'
import type { LifecycleStructure, NodeRef } from './lifecycle.ts'

/** Первая версия использует moscow/regions; справочник допускает новые территории. */
export interface RegionDefinition {
  id: string
  title: string
  themeKey?: string
}

export type ContentDefinition = 'not-defined' | 'defined'

/** Уникальный ключ записи — (regionId, owner.kind, owner.id). */
export interface RegionalNodeContent {
  regionId: string
  owner: NodeRef
  definition: ContentDefinition
}

export interface RegionalCatalog {
  regionId: string
  nodeContent: RegionalNodeContent[]
  documents: DocumentPosition[]
  /** Регион материала наследуется от документа, а не дублируется. */
  materials: Material[]
}

export interface ContentSnapshot extends LifecycleStructure {
  regions: RegionDefinition[]
  materialTypes: MaterialType[]
  documentTypes: DocumentType[]
  catalogs: RegionalCatalog[]
}

export interface ContentIssue {
  severity: 'error' | 'warning'
  code: string
  path: string
  elementId?: string
  message: string
}

export interface ContentValidation {
  valid: boolean
  issues: ContentIssue[]
}

export interface ContentCounts {
  documents: number
  totalMaterials: number
  availableMaterials: number
  documentsWithoutMaterials: number
}

export type ContentStatus = 'not-defined' | 'no-direct-documents' | 'unavailable' | 'partial' | 'complete'

export type ContentAvailability =
  | { ok: false; issues: ContentIssue[] }
  | { ok: true; status: ContentStatus; counts: ContentCounts; message: string }
