import assert from 'node:assert/strict'
import test from 'node:test'
import type { ContentSnapshot, ContentStatus } from '../src/types/catalog.ts'
import type { NodeRef } from '../src/types/lifecycle.ts'
import { getContentAvailability, getRegionalMaterialHref } from '../src/utils/contentAvailability.ts'
import { isContentSnapshot, validateContentSnapshot } from '../src/utils/contentValidation.ts'
import { getMaterialHref } from '../src/utils/materialLinks.ts'

// Изолированные синтетические данные. Не импортируются приложением, сеть не используется.
const owner = { kind: 'process', id: 'test-process' } satisfies NodeRef
const child = { kind: 'block', id: 'test-p' } satisfies NodeRef
const testUrl = 'https://disk.yandex.ru/d/test-fixture-only/view'

function fixture(): ContentSnapshot {
  return {
    regions: [{ id: 'moscow', title: 'Москва' }, { id: 'regions', title: 'Регионы' }],
    processes: [{ id: owner.id, title: 'Тестовый процесс', order: 1 }],
    blocks: [
      { id: child.id, title: 'П', processId: owner.id, order: 1 },
      { id: 'test-r', title: 'Р', processId: owner.id, order: 2 },
    ],
    operations: [
      { id: 'test-p-operation', title: 'Одинаковое название', parent: child, order: 1 },
      { id: 'test-r-operation', title: 'Одинаковое название', parent: { kind: 'block', id: 'test-r' }, order: 1 },
      { id: 'test-direct-operation', title: 'Прямая операция', parent: owner, order: 3 },
    ],
    materialTypes: [{ id: 'custom-type', title: 'Произвольный тип' }],
    documentTypes: [],
    catalogs: ['moscow', 'regions'].map(regionId => ({
      regionId,
      nodeContent: [owner, child, { kind: 'block' as const, id: 'test-r' },
        ...['test-p-operation', 'test-r-operation', 'test-direct-operation'].map(id => ({ kind: 'operation' as const, id })),
      ].map(node => ({ regionId, owner: node, definition: 'defined' as const })),
      documents: [], materials: [],
    })),
  }
}

function addDocument(data: ContentSnapshot, node: NodeRef = owner, region = 'moscow') {
  const catalog = data.catalogs.find(entry => entry.regionId === region)!
  const id = `${region}-document-${catalog.documents.length}`
  const order = catalog.documents.filter(document => document.owner.id === node.id && document.owner.kind === node.kind).length + 1
  catalog.documents.push({ id, regionId: region, owner: node, order, title: 'Тестовая позиция' })
  return id
}

function addMaterial(data: ContentSnapshot, documentId: string, url: string | undefined = testUrl) {
  const catalog = data.catalogs.find(entry => entry.documents.some(document => document.id === documentId))!
  const id = `${catalog.regionId}-material-${catalog.materials.length}`
  catalog.materials.push({ id, documentId, order: catalog.materials.filter(material => material.documentId === documentId).length + 1, title: 'Тестовый материал', typeId: 'custom-type', description: 'Только для проверки модели', url })
  return id
}

function availability(data: ContentSnapshot, expected: ContentStatus, node: NodeRef = owner, region = 'moscow') {
  const result = getContentAvailability(data, node, region)
  assert.equal(result.ok, true, JSON.stringify(result))
  if (!result.ok) throw new Error('Некорректная фикстура')
  assert.equal(result.status, expected)
  return result
}

function hasError(data: unknown, code: string) {
  const result = validateContentSnapshot(data)
  assert.equal(result.valid, false)
  const issue = result.issues.find(entry => entry.code === code && entry.severity === 'error')
  assert.ok(issue, JSON.stringify(result))
  assert.ok(issue.path)
  assert.ok(issue.message)
  return issue
}

test('1–2: not-defined без позиций допустим; с позицией — противоречие с ID', () => {
  const data = fixture()
  data.catalogs[0].nodeContent[0].definition = 'not-defined'
  availability(data, 'not-defined')
  const id = addDocument(data)
  assert.equal(hasError(data, 'definition-conflict').elementId, id)
  assert.equal(getContentAvailability(data, owner, 'moscow').ok, false)
})

test('3: позиции без материалов не создают фиктивный знаменатель', () => {
  const data = fixture()
  addDocument(data); addDocument(data)
  assert.deepEqual(availability(data, 'unavailable').counts, { documents: 2, totalMaterials: 0, availableMaterials: 0, documentsWithoutMaterials: 2 })
})

test('4: недопустимые ссылки — предупреждения и отсутствие доступности', () => {
  const data = fixture()
  const document = addDocument(data)
  for (const url of ['', '#', 'javascript:alert(1)']) addMaterial(data, document, url)
  const result = validateContentSnapshot(data)
  assert.equal(result.valid, true)
  assert.ok(result.issues.some(issue => issue.code === 'invalid-url' && issue.severity === 'warning'))
  assert.equal(availability(data, 'unavailable').counts.totalMaterials, 3)
  for (const material of data.catalogs[0].materials) assert.equal(getRegionalMaterialHref(data, material.id, 'moscow'), null)
})

test('5–6: частичное 2/3 и полное 3/3 наполнение', () => {
  const data = fixture()
  const document = addDocument(data)
  addMaterial(data, document); addMaterial(data, document); addMaterial(data, document, '')
  assert.equal(availability(data, 'partial').message, 'Доступно 2 из 3 материалов')
  data.catalogs[0].materials[2].url = testUrl
  availability(data, 'complete')
})

test('7: A = T, но есть позиция без материалов — всё ещё частичное наполнение', () => {
  const data = fixture()
  const document = addDocument(data)
  addMaterial(data, document); addMaterial(data, document); addDocument(data)
  const result = availability(data, 'partial')
  assert.equal(result.counts.documentsWithoutMaterials, 1)
  assert.match(result.message, /2 из 2.*без материалов: 1/)
})

test('8–10: прямое наполнение независимо от дочернего', () => {
  const data = fixture()
  addMaterial(data, addDocument(data, child))
  availability(data, 'no-direct-documents')
  availability(data, 'complete', child)
  data.catalogs[0].nodeContent[0].definition = 'not-defined'
  availability(data, 'not-defined')
  data.catalogs[0].nodeContent[0].definition = 'defined'
  addMaterial(data, addDocument(data))
  data.catalogs[0].documents = data.catalogs[0].documents.filter(document => document.owner.id !== child.id)
  data.catalogs[0].materials = data.catalogs[0].materials.filter(material => data.catalogs[0].documents.some(document => document.id === material.documentId))
  data.catalogs[0].nodeContent[1].definition = 'not-defined'
  availability(data, 'complete')
  availability(data, 'not-defined', child)
})

test('11–12: отсутствующая, дублированная и неверная региональная запись — ошибки', () => {
  const missing = fixture()
  missing.catalogs[0].nodeContent.pop()
  hasError(missing, 'missing-node-content')
  const duplicate = fixture()
  duplicate.catalogs[0].nodeContent.push(duplicate.catalogs[0].nodeContent[0])
  hasError(duplicate, 'duplicate-node-content')
  const invalid = fixture()
  Object.assign(invalid.catalogs[0].nodeContent[0], { definition: 'complete' })
  hasError(invalid, 'invalid-definition')
})

test('13–14: нет fallback; чужой материал невозможно открыть', () => {
  const data = fixture()
  const material = addMaterial(data, addDocument(data))
  availability(data, 'complete')
  const result = availability(data, 'no-direct-documents', owner, 'regions')
  assert.equal(result.counts.availableMaterials, 0)
  assert.equal(getRegionalMaterialHref(data, material, 'regions'), null)
  assert.equal(getRegionalMaterialHref(data, material, 'moscow'), testUrl)
  assert.equal(getRegionalMaterialHref(data, material, 'unknown'), null)
  assert.equal(getContentAvailability(data, owner, 'unknown').ok, false)
})

test('16–19: изменения ссылки, состава и подтверждённый broken пересчитываются', () => {
  const data = fixture()
  const document = addDocument(data)
  addMaterial(data, document); addMaterial(data, document); addMaterial(data, document)
  availability(data, 'complete')
  delete data.catalogs[0].materials[0].url
  assert.equal(availability(data, 'partial').counts.availableMaterials, 2)
  data.catalogs[0].materials[0].url = testUrl
  addMaterial(data, document, '')
  assert.equal(availability(data, 'partial').counts.totalMaterials, 4)
  data.catalogs[0].materials.pop()
  addDocument(data)
  assert.equal(availability(data, 'partial').counts.documentsWithoutMaterials, 1)
  data.catalogs[0].materials[0].linkCheck = 'broken'
  assert.equal(availability(data, 'partial').counts.availableMaterials, 2)
  assert.equal(getRegionalMaterialHref(data, data.catalogs[0].materials[0].id, 'moscow'), null)
})

test('20: дубли ID, осиротевшие материалы и неверные родители', () => {
  const duplicate = fixture()
  duplicate.processes.push({ ...duplicate.processes[0], order: 2 })
  hasError(duplicate, 'duplicate-id')
  const orphan = fixture()
  addMaterial(orphan, addDocument(orphan))
  orphan.catalogs[0].materials[0].documentId = 'missing'
  hasError(orphan, 'invalid-document')
  const parent = fixture()
  parent.blocks[0].processId = 'missing'
  hasError(parent, 'invalid-parent')
  Object.assign(parent.operations[0], { parent: { kind: 'operation', id: 'test-r-operation' } })
  hasError(parent, 'invalid-parent')
})

test('неизвестный/отсутствующий регион, каталог и несовпадение региона документа', () => {
  const data = fixture()
  addDocument(data)
  data.catalogs[0].documents[0].regionId = 'regions'
  hasError(data, 'region-mismatch')
  data.catalogs[0].documents[0].regionId = 'moscow'
  data.catalogs.pop()
  hasError(data, 'missing-catalog')
  data.catalogs[0].regionId = 'unknown'
  hasError(data, 'unknown-region')
})

test('материал не может ссылаться на документ другого каталога; ID глобальны', () => {
  const data = fixture()
  const doc = addDocument(data)
  const material = addMaterial(data, doc)
  data.catalogs[1].materials.push({ ...data.catalogs[0].materials[0] })
  hasError(data, 'invalid-document')
  hasError(data, 'duplicate-material-id')
  data.catalogs[1].documents.push({ ...data.catalogs[0].documents[0], regionId: 'regions' })
  hasError(data, 'duplicate-document-id')
  assert.equal(getRegionalMaterialHref(data, material, 'regions'), null)
})

test('документы на любом уровне; независимые П/Р; новые процессы и типы — данными', () => {
  const data = fixture()
  for (const node of [owner, child, { kind: 'operation' as const, id: 'test-p-operation' }]) addMaterial(data, addDocument(data, node))
  availability(data, 'complete', { kind: 'operation', id: 'test-p-operation' })
  availability(data, 'no-direct-documents', { kind: 'operation', id: 'test-r-operation' })
  data.processes.push({ id: 'extension', title: 'Расширение', order: 2 })
  for (const catalog of data.catalogs) catalog.nodeContent.push({ regionId: catalog.regionId, owner: { kind: 'process', id: 'extension' }, definition: 'not-defined' })
  assert.equal(isContentSnapshot(data), true)
})

test('неправильные значения обязательных полей возвращают диагностику, а не исключение', () => {
  for (const value of [null, [], {}, { regions: [null] }]) assert.equal(validateContentSnapshot(value).valid, false)
  const data = fixture()
  const document = addDocument(data)
  addMaterial(data, document)
  data.catalogs[0].documents[0].title = ' '
  hasError(data, 'required-field')
  data.catalogs[0].documents[0].updatedAt = '2026-99-99'
  hasError(data, 'invalid-date')
  data.catalogs[0].documents[0].updatedAt = '2026-02-30'
  hasError(data, 'invalid-date')
  data.catalogs[0].materials[0].typeId = 'missing'
  hasError(data, 'unknown-material-type')
  data.catalogs[0].documents[0].documentTypeId = 'missing'
  hasError(data, 'unknown-document-type')
})

test('порядок соседей и уникальность регионов и каталогов', () => {
  const data = fixture()
  data.blocks[1].order = data.blocks[0].order
  hasError(data, 'duplicate-order')
  data.catalogs.push(data.catalogs[0])
  hasError(data, 'duplicate-catalog')
  data.regions.push(data.regions[0])
  hasError(data, 'duplicate-id')
})

test('ссылки: отсутствующие, заглушки, схемы, credentials, malformed encoding и broken', () => {
  for (const url of [undefined, '', ' ', '#', '/file', 'javascript:alert(1)', 'data:text/plain,test', 'https://example.com/a', 'https://sub.example.org/a', 'https://localhost/a', 'https://user:password@drive.google.com/a', 'https://drive.google.com/%ZZ', 'https://drive.google.com/{id}', 'https://drive.google.com/a b']) {
    assert.equal(getMaterialHref({ url }), null, String(url))
  }
  assert.equal(getMaterialHref({ url: testUrl, linkCheck: 'broken' }), null)
  assert.equal(getMaterialHref({ url: testUrl }), testUrl)
})

test('рабочая отметка не компенсирует отсутствие ссылки; ручные счётчики не используются', () => {
  const data = fixture()
  addMaterial(data, addDocument(data), '')
  data.catalogs[0].materials[0].linkCheck = 'working'
  hasError(data, 'link-check-conflict')
  delete data.catalogs[0].materials[0].linkCheck
  Object.assign(data.catalogs[0], { availableMaterials: 999, status: 'complete' })
  assert.equal(availability(data, 'unavailable').counts.availableMaterials, 0)
})

test('проверка нетипизированного ввода сохраняет путь проблемного элемента', () => {
  const data = fixture()
  Object.assign(data, { processes: [null, { id: 'second', title: '', order: 2 }] })
  const issues = validateContentSnapshot(data).issues
  assert.ok(issues.some(issue => issue.path === 'processes[0]' && issue.code === 'invalid-record'))
  assert.ok(issues.some(issue => issue.path === 'processes[1].title' && issue.elementId === 'second'))
})

test('новый регион подключается данными; заполнение прежних регионов не наследуется', () => {
  const data = fixture()
  addMaterial(data, addDocument(data))
  data.regions.push({ id: 'new-region', title: 'Новый регион' })
  hasError(data, 'missing-catalog')
  data.catalogs.push({ regionId: 'new-region', nodeContent: data.catalogs[1].nodeContent.map(entry => ({ ...entry, regionId: 'new-region' })), documents: [], materials: [] })
  availability(data, 'no-direct-documents', owner, 'new-region')
})

test('ошибка данных не превращается в статус отсутствия файлов', () => {
  assert.equal(getContentAvailability(undefined, owner, 'moscow').ok, false)
  const data = fixture()
  data.catalogs[0].nodeContent = []
  assert.equal(getContentAvailability(data, owner, 'moscow').ok, false)
})

test('недопустимые типы полей, owner и результаты проверки URL диагностируются', () => {
  const data = fixture()
  addMaterial(data, addDocument(data))
  Object.assign(data.catalogs[0].documents[0], { owner: { kind: 'document', id: 'missing' }, tags: [12], updatedAt: null })
  hasError(data, 'invalid-parent')
  hasError(data, 'invalid-field')
  Object.assign(data.catalogs[0].materials[0], { url: 123, linkCheck: 'complete', order: -1 })
  hasError(data, 'invalid-link-check')
  hasError(data, 'invalid-order')
})
