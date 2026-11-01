import type { ContentAvailability, ContentCounts, ContentSnapshot, ContentStatus } from '../types/catalog.ts'
import type { NodeRef } from '../types/lifecycle.ts'
import type { Material } from '../types/document.ts'
import { validateContentSnapshot } from './contentValidation.ts'
import { getMaterialHref } from './materialLinks.ts'

const sameOwner = (a: NodeRef, b: NodeRef) => a.kind === b.kind && a.id === b.id

/** Только прямой каталог. Потомки не влияют на счётчики и полноту. */
export function getContentAvailability(input: unknown, owner: NodeRef, regionId: string): ContentAvailability {
  const validation = validateContentSnapshot(input)
  if (!validation.valid) return { ok: false, issues: validation.issues }
  const snapshot = input as ContentSnapshot
  const catalog = snapshot.catalogs.find(entry => entry.regionId === regionId)
  const content = catalog?.nodeContent.find(entry => sameOwner(entry.owner, owner))
  if (!catalog || !content) return { ok: false, issues: [{ severity: 'error', code: 'selection-not-found', path: 'selection', elementId: owner.id, message: `Узел или регион ${regionId} не найден.` }] }
  const documents = catalog.documents.filter(document => sameOwner(document.owner, owner))
  const documentIds = new Set(documents.map(document => document.id))
  const materials = catalog.materials.filter(material => documentIds.has(material.documentId))
  const counts: ContentCounts = {
    documents: documents.length,
    totalMaterials: materials.length,
    availableMaterials: materials.filter(material => getMaterialHref(material) !== null).length,
    documentsWithoutMaterials: documents.filter(document => !materials.some(material => material.documentId === document.id)).length,
  }
  return describeAvailability(content.definition, counts)
}

function describeAvailability(definition: 'defined' | 'not-defined', counts: ContentCounts): Extract<ContentAvailability, { ok: true }> {
  let status: ContentStatus
  let message: string
  if (definition === 'not-defined') {
    status = 'not-defined'; message = 'Состав документов и материалов ещё не определён'
  } else if (!counts.documents) {
    status = 'no-direct-documents'; message = 'Документы непосредственно на этом уровне не размещены'
  } else if (!counts.availableMaterials) {
    status = 'unavailable'; message = 'Документы определены, файлы пока не загружены или ссылки недоступны'
  } else if (counts.availableMaterials < counts.totalMaterials || counts.documentsWithoutMaterials > 0) {
    status = 'partial'; message = `Доступно ${counts.availableMaterials} из ${counts.totalMaterials} материалов`
    if (counts.documentsWithoutMaterials) message += `. Документных позиций без материалов: ${counts.documentsWithoutMaterials}`
  } else {
    status = 'complete'; message = `Все материалы доступны: ${counts.availableMaterials} из ${counts.totalMaterials}`
  }
  return { ok: true, status, counts, message }
}

/** Для проверенных материалов одной существующей документной позиции. */
export function getDocumentAvailability(materials: Material[]): Extract<ContentAvailability, { ok: true }> {
  return describeAvailability('defined', {
    documents: 1,
    totalMaterials: materials.length,
    availableMaterials: materials.filter(material => getMaterialHref(material) !== null).length,
    documentsWithoutMaterials: materials.length ? 0 : 1,
  })
}

/** Публичная проверка открытия учитывает и регион, и целостность каталога. */
export function getRegionalMaterialHref(input: unknown, materialId: string, regionId: string): string | null {
  if (!validateContentSnapshot(input).valid) return null
  const snapshot = input as ContentSnapshot
  const catalog = snapshot.catalogs.find(entry => entry.regionId === regionId)
  const material = catalog?.materials.find(entry => entry.id === materialId)
  if (!material || !catalog?.documents.some(document => document.id === material.documentId && document.regionId === regionId)) return null
  return getMaterialHref(material)
}
