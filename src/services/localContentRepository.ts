import type { ContentSnapshot, RegionalCatalog } from '../types/catalog.ts'
import type { NodeRef } from '../types/lifecycle.ts'
import { getContentAvailability, getDocumentAvailability } from '../utils/contentAvailability.ts'
import { validateContentSnapshot } from '../utils/contentValidation.ts'
import type { ChildContentSummary, ContentNode, ContentRepository, ContentRequestOptions, ContentResult, NodeContent } from './contentRepository.ts'

export type LocalContentSource = (options: ContentRequestOptions) => unknown | Promise<unknown>

const success = <T>(data: T): ContentResult<T> => ({ status: 'success', data })
const missing = (message: string): ContentResult<never> => ({ status: 'not-found', message })
const aborted = (): ContentResult<never> => ({ status: 'error', error: { code: 'aborted', message: 'Запрос отменён.' } })
const sameOwner = (a: NodeRef, b: NodeRef) => a.kind === b.kind && a.id === b.id
const ordered = <T extends { order: number }>(entries: T[]): T[] => [...entries].sort((a, b) => a.order - b.order)

/** Отмена не зависит от того, поддерживает ли её физический источник. */
async function loadSource(source: LocalContentSource, options: ContentRequestOptions): Promise<unknown> {
  const { signal } = options
  signal?.throwIfAborted()
  if (!signal) return source(options)
  return new Promise((resolve, reject) => {
    const cancel = () => { cleanup(); reject(new Error('Запрос отменён.')) }
    const cleanup = () => signal.removeEventListener('abort', cancel)
    signal.addEventListener('abort', cancel, { once: true })
    Promise.resolve().then(() => {
      signal.throwIfAborted()
      return source(options)
    }).then(value => { cleanup(); resolve(value) }, error => { cleanup(); reject(error) })
  })
}

function findNode(data: ContentSnapshot, ref: NodeRef): ContentNode | undefined {
  switch (ref.kind) {
    case 'process': {
      const value = data.processes.find(entry => entry.id === ref.id)
      return value ? { kind: 'process', data: value } : undefined
    }
    case 'block': {
      const value = data.blocks.find(entry => entry.id === ref.id)
      return value ? { kind: 'block', data: value } : undefined
    }
    case 'operation': {
      const value = data.operations.find(entry => entry.id === ref.id)
      return value ? { kind: 'operation', data: value } : undefined
    }
  }
}

function ancestors(data: ContentSnapshot, node: ContentNode): ContentNode[] {
  const parent: NodeRef | undefined = node.kind === 'block' ? { kind: 'process', id: node.data.processId }
    : node.kind === 'operation' ? node.data.parent : undefined
  if (!parent) return []
  const value = findNode(data, parent)!
  return [...ancestors(data, value), value]
}

function children(data: ContentSnapshot, ref: NodeRef): ContentNode[] {
  const entries: ContentNode[] = []
  if (ref.kind === 'process') {
    entries.push(...data.blocks.filter(block => block.processId === ref.id).map(block => ({ kind: 'block' as const, data: block })))
  }
  if (ref.kind !== 'operation') {
    entries.push(...data.operations.filter(operation => sameOwner(operation.parent, ref)).map(operation => ({ kind: 'operation' as const, data: operation })))
  }
  return entries.sort((a, b) => a.data.order - b.data.order)
}

/** Чтение снимка, валидация и выдача изолированной копии при каждом запросе. */
export class LocalContentRepository implements ContentRepository {
  private readonly source: LocalContentSource

  constructor(source: ContentSnapshot | LocalContentSource) {
    this.source = typeof source === 'function' ? source : () => source
  }

  private async read<T>(regionId: string | undefined, options: ContentRequestOptions | undefined,
    select: (snapshot: ContentSnapshot, catalog: RegionalCatalog) => ContentResult<T>): Promise<ContentResult<T>> {
    const request = options ?? {}
    try {
      if (request.signal?.aborted) return aborted()
      const input = await loadSource(this.source, request)
      if (request.signal?.aborted) return aborted()
      const validation = validateContentSnapshot(input)
      if (!validation.valid) {
        const missingCatalog = validation.issues.some(issue => issue.code === 'missing-catalog')
        return { status: 'error', error: {
          code: missingCatalog ? 'missing-catalog' : 'invalid-data',
          message: missingCatalog ? 'Отсутствует обязательный региональный каталог.' : 'Нарушена целостность данных каталога.',
          issues: validation.issues,
        } }
      }
      // Копия не позволяет клиенту изменить общую структуру или соседний регион.
      const snapshot = structuredClone(input as ContentSnapshot)
      if (regionId !== undefined && !snapshot.regions.some(region => region.id === regionId)) {
        return { status: 'error', error: { code: 'unknown-region', message: `Регион «${regionId}» не зарегистрирован.` } }
      }
      const catalog = snapshot.catalogs.find(entry => entry.regionId === regionId)
      // getRegions не использует каталог; региональные методы всегда получают его явно.
      if (regionId !== undefined && !catalog) return { status: 'error', error: { code: 'missing-catalog', message: `Каталог региона «${regionId}» отсутствует.` } }
      return select(snapshot, catalog!)
    } catch (error) {
      if (request.signal?.aborted) return aborted()
      return { status: 'error', error: { code: 'source-error', message: error instanceof Error ? error.message : 'Не удалось загрузить данные.' } }
    }
  }

  getRegions(options?: ContentRequestOptions) {
    return this.read(undefined, options, data => success(data.regions))
  }

  getStructure(regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => success({ processes: ordered(data.processes), blocks: ordered(data.blocks), operations: ordered(data.operations) }))
  }

  getNodeContent(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
    return this.read<NodeContent>(regionId, options, (data, catalog) => {
      const node = findNode(data, owner)
      if (!node) return missing(`Узел ${owner.kind} «${owner.id}» не найден.`)
      const content = catalog.nodeContent.find(entry => sameOwner(entry.owner, owner))!
      const documents = ordered(catalog.documents.filter(document => sameOwner(document.owner, owner)))
      const ids = new Set(documents.map(document => document.id))
      const availability = getContentAvailability(data, owner, regionId)
      if (!availability.ok) return { status: 'error', error: { code: 'invalid-data', message: 'Не удалось определить наполнение узла.', issues: availability.issues } }
      const directChildren = children(data, owner)
      const childSummaries: ChildContentSummary[] = []
      for (const child of directChildren) {
        const childRef = { kind: child.kind, id: child.data.id } as NodeRef
        const childAvailability = getContentAvailability(data, childRef, regionId)
        if (!childAvailability.ok) return { status: 'error', error: { code: 'invalid-data', message: 'Не удалось определить наполнение дочернего раздела.', issues: childAvailability.issues } }
        childSummaries.push({ node: child, childCount: children(data, childRef).length, availability: childAvailability })
      }
      return success({
        regionId, node, ancestors: ancestors(data, node), children: directChildren, childSummaries,
        documentSummaries: documents.map(document => ({
          document,
          typeTitle: data.documentTypes.find(type => type.id === document.documentTypeId)?.title,
          availability: getDocumentAvailability(catalog.materials.filter(material => material.documentId === document.id)),
        })),
        definition: content.definition, documents, materials: ordered(catalog.materials.filter(material => ids.has(material.documentId))), availability,
      })
    })
  }

  getProcess(id: string, regionId: string, options?: ContentRequestOptions) {
    return this.getNodeContent({ kind: 'process', id }, regionId, options)
  }

  getBlock(id: string, regionId: string, options?: ContentRequestOptions) {
    return this.getNodeContent({ kind: 'block', id }, regionId, options)
  }

  getOperation(id: string, regionId: string, options?: ContentRequestOptions) {
    return this.getNodeContent({ kind: 'operation', id }, regionId, options)
  }

  getNode(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => {
      const node = findNode(data, owner)
      return node ? success(node) : missing(`Узел «${owner.id}» не найден.`)
    })
  }

  getAncestors(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => {
      const node = findNode(data, owner)
      return node ? success(ancestors(data, node)) : missing(`Узел «${owner.id}» не найден.`)
    })
  }

  getChildren(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => findNode(data, owner) ? success(children(data, owner)) : missing(`Узел «${owner.id}» не найден.`))
  }

  getBlocks(processId: string, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => data.processes.some(process => process.id === processId)
      ? success(ordered(data.blocks.filter(block => block.processId === processId))) : missing(`Процесс «${processId}» не найден.`))
  }

  getOperations(parent: Exclude<NodeRef, { kind: 'operation' }>, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, data => findNode(data, parent)
      ? success(ordered(data.operations.filter(operation => sameOwner(operation.parent, parent)))) : missing(`Родитель «${parent.id}» не найден.`))
  }

  getDocuments(owner: NodeRef, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, (data, catalog) => findNode(data, owner)
      ? success(ordered(catalog.documents.filter(document => sameOwner(document.owner, owner)))) : missing(`Узел «${owner.id}» не найден.`))
  }

  getDocument(id: string, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, (data, catalog) => {
      const document = catalog.documents.find(entry => entry.id === id)
      if (!document) return missing('Документ не найден в выбранном регионе.')
      const owner = findNode(data, document.owner)!
      return success({ regionId, document, materials: ordered(catalog.materials.filter(material => material.documentId === id)), materialTypes: data.materialTypes, ancestors: [...ancestors(data, owner), owner] })
    })
  }

  getMaterials(documentId: string, regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, (_data, catalog) => catalog.documents.some(document => document.id === documentId)
      ? success(ordered(catalog.materials.filter(material => material.documentId === documentId))) : missing('Документ не найден в выбранном регионе.'))
  }

  getRegionalCatalog(regionId: string, options?: ContentRequestOptions) {
    return this.read(regionId, options, (_data, catalog) => success(catalog))
  }
}
