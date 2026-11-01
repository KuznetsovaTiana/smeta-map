import type { ContentAvailability, ContentDefinition, ContentIssue, RegionDefinition, RegionalCatalog } from '../types/catalog.ts'
import type { DocumentPosition, Material, MaterialType } from '../types/document.ts'
import type { Block, LifecycleStructure, NodeRef, Operation, Process } from '../types/lifecycle.ts'

export interface ContentRequestOptions {
  signal?: AbortSignal
}

export interface ContentRepositoryError {
  code: 'unknown-region' | 'missing-catalog' | 'invalid-data' | 'source-error' | 'aborted'
  message: string
  issues?: ContentIssue[]
}

export type ContentResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not-found'; message: string }
  | { status: 'error'; error: ContentRepositoryError }

export type ContentNode =
  | { kind: 'process'; data: Process }
  | { kind: 'block'; data: Block }
  | { kind: 'operation'; data: Operation }

export interface NodeContent {
  regionId: string
  node: ContentNode
  /** От корневого процесса до непосредственного родителя, без самого узла. */
  ancestors: ContentNode[]
  /** Только непосредственные структурные потомки. */
  children: ContentNode[]
  /** Вычисляемые сведения, а не документы потомков в прямом каталоге. */
  childSummaries: ChildContentSummary[]
  definition: ContentDefinition
  documents: DocumentPosition[]
  documentSummaries: DocumentPositionSummary[]
  materials: Material[]
  availability: Extract<ContentAvailability, { ok: true }>
}

export interface ChildContentSummary {
  node: ContentNode
  childCount: number
  availability: Extract<ContentAvailability, { ok: true }>
}

export interface DocumentPositionSummary {
  document: DocumentPosition
  typeTitle?: string
  availability: Extract<ContentAvailability, { ok: true }>
}

export interface DocumentContent {
  regionId: string
  document: DocumentPosition
  materials: Material[]
  materialTypes: MaterialType[]
  /** Включает владельца документа. */
  ancestors: ContentNode[]
}

/** Контракт не зависит от локальных массивов, React и будущего транспорта API. */
export interface ContentRepository {
  getRegions(options?: ContentRequestOptions): Promise<ContentResult<RegionDefinition[]>>
  getStructure(regionId: string, options?: ContentRequestOptions): Promise<ContentResult<LifecycleStructure>>
  getProcess(id: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<NodeContent>>
  getBlock(id: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<NodeContent>>
  getOperation(id: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<NodeContent>>
  getNodeContent(owner: NodeRef, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<NodeContent>>
  getNode(owner: NodeRef, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<ContentNode>>
  getAncestors(owner: NodeRef, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<ContentNode[]>>
  getChildren(owner: NodeRef, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<ContentNode[]>>
  getBlocks(processId: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<Block[]>>
  getOperations(parent: Exclude<NodeRef, { kind: 'operation' }>, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<Operation[]>>
  getDocuments(owner: NodeRef, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<DocumentPosition[]>>
  getDocument(id: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<DocumentContent>>
  getMaterials(documentId: string, regionId: string, options?: ContentRequestOptions): Promise<ContentResult<Material[]>>
  getRegionalCatalog(regionId: string, options?: ContentRequestOptions): Promise<ContentResult<RegionalCatalog>>
}
