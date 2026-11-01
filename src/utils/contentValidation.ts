import type { ContentIssue, ContentSnapshot, ContentValidation } from '../types/catalog.ts'
import { getMaterialHref } from './materialLinks.ts'

type Row = Record<string, unknown>
const isRow = (value: unknown): value is Row => typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const key = (kind: unknown, id: unknown) => JSON.stringify([kind, id])

/** Проверяет также нетипизированный JSON. Ошибки всегда содержат путь и ID, если он известен. */
export function validateContentSnapshot(input: unknown): ContentValidation {
  const issues: ContentIssue[] = []
  function issue(code: string, path: string, message: string, row?: Row, severity: ContentIssue['severity'] = 'error') {
    issues.push({ severity, code, path, elementId: typeof row?.id === 'string' ? row.id : undefined, message })
  }
  function rows(value: unknown, path: string): Row[] {
    if (!Array.isArray(value)) { issue('required-array', path, 'Ожидается обязательный массив.'); return [] }
    return value.map((entry, index) => {
      if (isRow(entry)) return entry
      // Сохраняем индекс, чтобы последующая диагностика указывала на исходный JSON.
      issue('invalid-record', `${path}[${index}]`, 'Ожидается объект.'); return {}
    })
  }
  function text(row: Row, field: string, path: string, optional = false) {
    if (optional && row[field] === undefined) return
    if (!isText(row[field])) issue('required-field', `${path}.${field}`, 'Ожидается непустая строка.', row)
  }
  function collection(value: unknown, path: string, ordered = false): Row[] {
    const entries = rows(value, path)
    const seen = new Set<unknown>()
    entries.forEach((row, index) => {
      const at = `${path}[${index}]`
      text(row, 'id', at); text(row, 'title', at)
      if (seen.has(row.id)) issue('duplicate-id', `${at}.id`, `Повтор идентификатора: ${String(row.id)}.`, row)
      seen.add(row.id)
      if (ordered && !(typeof row.order === 'number' && Number.isSafeInteger(row.order) && row.order > 0)) {
        issue('invalid-order', `${at}.order`, 'Порядок должен быть положительным целым числом.', row)
      }
      for (const field of ['description', 'shortDescription', 'iconKey', 'themeKey', 'responsible', 'format', 'documentTypeId']) text(row, field, at, true)
      for (const field of ['abbreviations', 'keywords', 'tags']) {
        if (row[field] !== undefined && (!Array.isArray(row[field]) || !row[field].every(isText))) issue('invalid-field', `${at}.${field}`, 'Ожидается массив непустых строк.', row)
      }
      if (row.updatedAt !== undefined && !(typeof row.updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.updatedAt) && Number.isFinite(Date.parse(row.updatedAt)) && new Date(row.updatedAt).toISOString().slice(0, 10) === row.updatedAt)) {
        issue('invalid-date', `${at}.updatedAt`, 'Ожидается существующая дата YYYY-MM-DD.', row)
      }
    })
    return entries
  }
  if (!isRow(input)) return { valid: false, issues: [{ severity: 'error', code: 'invalid-snapshot', path: '$', message: 'Ожидается объект каталога.' }] }
  const regions = collection(input.regions, 'regions')
  const processes = collection(input.processes, 'processes', true)
  const blocks = collection(input.blocks, 'blocks', true)
  const operations = collection(input.operations, 'operations', true)
  const materialTypes = collection(input.materialTypes, 'materialTypes')
  const documentTypes = collection(input.documentTypes, 'documentTypes')
  const catalogs = rows(input.catalogs, 'catalogs')
  const regionIds = new Set(regions.map(row => row.id))
  const processIds = new Set(processes.map(row => row.id))
  const nodes = new Set([
    ...processes.map(row => key('process', row.id)),
    ...blocks.map(row => key('block', row.id)),
    ...operations.map(row => key('operation', row.id)),
  ])
  function ref(value: unknown, path: string, allowed: string[], row?: Row): string | null {
    if (!isRow(value) || !allowed.includes(String(value.kind)) || !isText(value.id) || !nodes.has(key(value.kind, value.id))) {
      issue('invalid-parent', path, 'Родитель отсутствует или имеет недопустимый тип.', row); return null
    }
    return key(value.kind, value.id)
  }
  function uniqueOrders(entries: Row[], path: string, group: (row: Row) => unknown) {
    const seen = new Set<string>()
    entries.forEach((row, i) => {
      const orderKey = JSON.stringify([group(row), row.order])
      if (seen.has(orderKey)) issue('duplicate-order', `${path}[${i}].order`, 'Порядок соседних элементов должен быть уникальным.', row)
      seen.add(orderKey)
    })
  }
  uniqueOrders(processes, 'processes', () => 'root')
  blocks.forEach((row, i) => {
    if (!isText(row.processId) || !processIds.has(row.processId)) issue('invalid-parent', `blocks[${i}].processId`, 'Процесс блока не найден.', row)
  })
  operations.forEach((row, i) => ref(row.parent, `operations[${i}].parent`, ['process', 'block'], row))
  uniqueOrders(blocks, 'blocks', row => row.processId)
  uniqueOrders(operations, 'operations', row => isRow(row.parent) ? key(row.parent.kind, row.parent.id) : null)
  // Порядок прямых операций и блоков одного процесса также не должен конфликтовать.
  for (const process of processes) {
    const children = [...blocks.filter(row => row.processId === process.id), ...operations.filter(row => isRow(row.parent) && row.parent.kind === 'process' && row.parent.id === process.id)]
    const orders = new Set<unknown>()
    for (const child of children) {
      if (orders.has(child.order)) issue('duplicate-child-order', 'structure', 'Блок и прямая операция процесса имеют одинаковый порядок.', child)
      orders.add(child.order)
    }
  }
  const seenCatalogs = new Set<unknown>()
  const documentIds = new Set<unknown>()
  const materialIds = new Set<unknown>()
  catalogs.forEach((catalog, ci) => {
    const path = `catalogs[${ci}]`
    if (!isText(catalog.regionId) || !regionIds.has(catalog.regionId)) issue('unknown-region', `${path}.regionId`, 'Регион каталога не зарегистрирован.')
    if (seenCatalogs.has(catalog.regionId)) issue('duplicate-catalog', path, 'Для региона допускается только один каталог.')
    seenCatalogs.add(catalog.regionId)
    const documents = collection(catalog.documents, `${path}.documents`, true)
    const materials = collection(catalog.materials, `${path}.materials`, true)
    const content = rows(catalog.nodeContent, `${path}.nodeContent`)
    const definitions = new Map<string, Row>()
    content.forEach((row, i) => {
      const at = `${path}.nodeContent[${i}]`
      const owner = ref(row.owner, `${at}.owner`, ['process', 'block', 'operation'])
      if (row.regionId !== catalog.regionId) issue('region-mismatch', `${at}.regionId`, 'Регион записи не совпадает с каталогом.')
      if (!['defined', 'not-defined'].includes(String(row.definition))) issue('invalid-definition', `${at}.definition`, 'Допускается только defined или not-defined.')
      if (owner) {
        if (definitions.has(owner)) issue('duplicate-node-content', at, `Повтор региональной записи узла ${owner}.`)
        definitions.set(owner, row)
      }
    })
    for (const node of nodes) if (!definitions.has(node)) issue('missing-node-content', `${path}.nodeContent`, `Отсутствует обязательная запись узла ${node} для региона ${String(catalog.regionId)}.`)
    const localDocuments = new Set(documents.map(row => row.id))
    documents.forEach((row, i) => {
      const at = `${path}.documents[${i}]`
      if (documentIds.has(row.id)) issue('duplicate-document-id', `${at}.id`, 'ID документа повторяется в каталогах.', row)
      documentIds.add(row.id)
      if (row.regionId !== catalog.regionId) issue('region-mismatch', `${at}.regionId`, 'Документ принадлежит другому региону.', row)
      const owner = ref(row.owner, `${at}.owner`, ['process', 'block', 'operation'], row)
      if (owner && definitions.get(owner)?.definition === 'not-defined') issue('definition-conflict', `${at}.owner`, 'При not-defined непосредственные документные позиции запрещены.', row)
      if (row.documentTypeId !== undefined && !documentTypes.some(type => type.id === row.documentTypeId)) issue('unknown-document-type', `${at}.documentTypeId`, 'Тип документа отсутствует в справочнике.', row)
    })
    materials.forEach((row, i) => {
      const at = `${path}.materials[${i}]`
      if (materialIds.has(row.id)) issue('duplicate-material-id', `${at}.id`, 'ID материала повторяется в каталогах.', row)
      materialIds.add(row.id)
      if (!isText(row.documentId) || !localDocuments.has(row.documentId)) issue('invalid-document', `${at}.documentId`, 'Документ материала отсутствует в этом региональном каталоге.', row)
      if (row.regionId !== undefined && row.regionId !== catalog.regionId) issue('region-mismatch', `${at}.regionId`, 'Материал не может принадлежать другому региону.', row)
      if (!isText(row.typeId) || !materialTypes.some(type => type.id === row.typeId)) issue('unknown-material-type', `${at}.typeId`, 'Тип материала отсутствует в справочнике.', row)
      if (row.linkCheck !== undefined && !['unchecked', 'working', 'broken'].includes(String(row.linkCheck))) issue('invalid-link-check', `${at}.linkCheck`, 'Неизвестный результат проверки ссылки.', row)
      if (row.url !== undefined && typeof row.url !== 'string') issue('invalid-field', `${at}.url`, 'URL должен быть строкой или отсутствовать.', row)
      if (typeof row.url === 'string' && row.url.trim() && !getMaterialHref({ url: row.url })) issue('invalid-url', `${at}.url`, 'Адрес недопустим: материал недоступен для открытия.', row, 'warning')
      if (row.linkCheck === 'working' && !getMaterialHref({ url: typeof row.url === 'string' ? row.url : undefined })) issue('link-check-conflict', `${at}.linkCheck`, 'Нельзя подтвердить рабочую ссылку без допустимого URL.', row)
    })
    uniqueOrders(documents, `${path}.documents`, row => isRow(row.owner) ? key(row.owner.kind, row.owner.id) : null)
    uniqueOrders(materials, `${path}.materials`, row => row.documentId)
  })
  for (const region of regions) if (!seenCatalogs.has(region.id)) issue('missing-catalog', 'catalogs', `Каталог региона ${String(region.id)} отсутствует.`, region)
  return { valid: !issues.some(entry => entry.severity === 'error'), issues }
}

/** Уточнение unknown для последующих чистых селекторов, только после проверки. */
export function isContentSnapshot(input: unknown): input is ContentSnapshot {
  return validateContentSnapshot(input).valid
}
