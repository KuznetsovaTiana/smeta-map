import assert from 'node:assert/strict'
import test from 'node:test'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import type { ContentResult } from '../src/services/contentRepository.ts'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'
import { LocalContentRepository } from '../src/services/localContentRepository.ts'

function data<T>(result: ContentResult<T>): T {
  assert.equal(result.status, 'success', JSON.stringify(result))
  if (result.status !== 'success') throw new Error('Ожидалось успешное чтение')
  return result.data
}

test('репозиторий по умолчанию возвращает 6 процессов и общий список регионов', async () => {
  assert.equal(data(await contentRepository.getStructure('moscow')).processes.length, 6)
  assert.deepEqual(data(await contentRepository.getRegions()).map(region => region.id), ['moscow', 'regions'])
  assert.deepEqual(data(await contentRepository.getStructure('moscow')), data(await contentRepository.getStructure('regions')))
})

test('процесс и вложенные блоки/операции, сортировка и родительский контекст', async () => {
  const process = data(await contentRepository.getProcess('design', 'moscow'))
  assert.equal(process.node.kind, 'process')
  assert.equal(process.children.length, 4)
  assert.deepEqual(process.ancestors, [])
  assert.equal(process.availability.status, 'no-direct-documents')
  assert.equal(data(await contentRepository.getBlocks('design', 'moscow')).length, 4)
  const block = data(await contentRepository.getBlock('design-p', 'regions'))
  assert.equal(block.children.length, 8)
  assert.deepEqual(block.ancestors.map(entry => entry.data.id), ['design'])
  const operations = data(await contentRepository.getOperations({ kind: 'block', id: 'design-p' }, 'regions'))
  assert.equal(operations.length, 8)
  assert.deepEqual(operations.map(operation => operation.order), [1, 2, 3, 4, 5, 6, 7, 8])
  const operation = data(await contentRepository.getOperation('design-p-vor', 'moscow'))
  assert.deepEqual(operation.ancestors.map(entry => entry.data.id), ['design', 'design-p'])
  assert.equal(operation.documents.length, 1)
  assert.equal(operation.documents[0].regionId, 'moscow')
  assert.equal(operation.availability.status, 'unavailable')
  assert.deepEqual(operation.children, [])
})

test('снос не требует блока; лист не имеет потомков; пустые списки — успех', async () => {
  assert.deepEqual(data(await contentRepository.getBlocks('demolition', 'moscow')), [])
  assert.equal(data(await contentRepository.getOperations({ kind: 'process', id: 'demolition' }, 'moscow')).length, 8)
  assert.deepEqual(data(await contentRepository.getChildren({ kind: 'operation', id: 'demolition-local-estimate' }, 'moscow')), [])
  assert.deepEqual(data(await contentRepository.getAncestors({ kind: 'operation', id: 'demolition-local-estimate' }, 'moscow')).map(entry => entry.data.id), ['demolition'])
  assert.equal(data(await contentRepository.getNode({ kind: 'block', id: 'technical-maintenance' }, 'moscow')).kind, 'block')
})

test('документы на уровне блока, получение позиции и её материалов', async () => {
  const documents = data(await contentRepository.getDocuments({ kind: 'block', id: 'work-accounting' }, 'moscow'))
  assert.equal(documents.length, 5)
  const document = data(await contentRepository.getDocument(documents[0].id, 'moscow'))
  assert.equal(document.regionId, 'moscow')
  assert.equal(document.document.id, documents[0].id)
  assert.deepEqual(document.ancestors.map(entry => entry.data.id), ['construction', 'work-accounting'])
  assert.deepEqual(document.materials, [])
  assert.deepEqual(data(await contentRepository.getMaterials(documents[0].id, 'moscow')), [])
})

test('оба региона изолированы; чужие ID дают not-found без fallback', async () => {
  const moscow = data(await contentRepository.getRegionalCatalog('moscow'))
  const regions = data(await contentRepository.getRegionalCatalog('regions'))
  assert.equal(moscow.documents.length, 36)
  assert.equal(regions.documents.length, 45)
  assert.ok(moscow.documents.every(document => document.regionId === 'moscow'))
  assert.ok(regions.documents.every(document => document.regionId === 'regions'))
  assert.equal((await contentRepository.getDocument(moscow.documents[0].id, 'regions')).status, 'not-found')
  assert.equal((await contentRepository.getMaterials(moscow.documents[0].id, 'regions')).status, 'not-found')
  assert.equal((await contentRepository.getDocument(regions.documents[0].id, 'moscow')).status, 'not-found')
})

test('отсутствующие процессы, блоки, операции и документы отличаются от пустых каталогов', async () => {
  for (const result of await Promise.all([
    contentRepository.getProcess('missing', 'moscow'), contentRepository.getBlock('missing', 'moscow'),
    contentRepository.getOperation('missing', 'moscow'), contentRepository.getDocument('missing', 'moscow'),
    contentRepository.getBlocks('missing', 'moscow'), contentRepository.getOperations({ kind: 'block', id: 'missing' }, 'moscow'),
    contentRepository.getDocuments({ kind: 'process', id: 'missing' }, 'moscow'),
    contentRepository.getAncestors({ kind: 'process', id: 'missing' }, 'moscow'),
    contentRepository.getChildren({ kind: 'process', id: 'missing' }, 'moscow'),
    contentRepository.getNode({ kind: 'process', id: 'missing' }, 'moscow'),
  ])) assert.equal(result.status, 'not-found')
})

test('отсутствующий каталог — явная ошибка с диагностикой, неизвестный регион — другая ошибка', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs = snapshot.catalogs.filter(catalog => catalog.regionId !== 'regions')
  const repository = new LocalContentRepository(snapshot)
  const result = await repository.getRegionalCatalog('regions')
  assert.equal(result.status, 'error')
  if (result.status === 'error') {
    assert.equal(result.error.code, 'missing-catalog')
    assert.ok(result.error.issues?.some(issue => issue.code === 'missing-catalog'))
  }
  const unknown = await contentRepository.getStructure('unknown')
  assert.ok(unknown.status === 'error' && unknown.error.code === 'unknown-region')
})

test('ошибки источника и целостности возвращаются, а не маскируются пустыми данными', async () => {
  const broken = new LocalContentRepository(async () => { throw new Error('Источник временно недоступен') })
  const failure = await broken.getStructure('moscow')
  assert.ok(failure.status === 'error' && failure.error.code === 'source-error')
  if (failure.status === 'error') assert.equal(failure.error.message, 'Источник временно недоступен')
  const malformed = new LocalContentRepository(() => null)
  const result = await malformed.getStructure('moscow')
  assert.ok(result.status === 'error' && result.error.code === 'invalid-data')
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs[0].nodeContent.pop()
  const incomplete = await new LocalContentRepository(snapshot).getProcess('design', 'moscow')
  assert.ok(incomplete.status === 'error' && incomplete.error.issues?.some(issue => issue.code === 'missing-node-content'))
})

test('выданные данные не позволяют изменить источник или другой регион', async () => {
  const repository = new LocalContentRepository(lifecycleContent)
  const catalog = data(await repository.getRegionalCatalog('moscow'))
  const structure = data(await repository.getStructure('moscow'))
  catalog.documents[0].title = 'Изменено клиентом'
  structure.processes[0].title = 'Изменено клиентом'
  assert.notEqual(data(await repository.getRegionalCatalog('moscow')).documents[0].title, catalog.documents[0].title)
  assert.notEqual(data(await repository.getStructure('regions')).processes[0].title, structure.processes[0].title)
})

test('несколько материалов одной позиции извлекаются по порядку только в её регионе', async () => {
  const snapshot = structuredClone(lifecycleContent)
  const catalog = snapshot.catalogs[0]
  const document = catalog.documents[0]
  // Изолированная фикстура без внешних ссылок, не меняет рабочие каталоги.
  catalog.materials.push(
    { id: 'test-second', documentId: document.id, order: 2, title: 'Тестовый шаблон', typeId: 'template' },
    { id: 'test-first', documentId: document.id, order: 1, title: 'Тестовый образец', typeId: 'example' },
  )
  const repository = new LocalContentRepository(snapshot)
  assert.deepEqual(data(await repository.getMaterials(document.id, 'moscow')).map(material => material.id), ['test-first', 'test-second'])
  const node = data(await repository.getNodeContent(document.owner, 'moscow'))
  assert.equal(node.materials.length, 2)
  assert.equal(node.availability.counts.availableMaterials, 0)
  assert.equal((await repository.getMaterials(document.id, 'regions')).status, 'not-found')
})

test('асинхронный источник: повторное чтение после ошибки не требует пересоздания репозитория', async () => {
  let attempts = 0
  const repository = new LocalContentRepository(async () => {
    if (++attempts === 1) throw new Error('Повторите запрос')
    return lifecycleContent
  })
  assert.equal((await repository.getStructure('moscow')).status, 'error')
  assert.equal(data(await repository.getStructure('moscow')).processes.length, 6)
  assert.equal(attempts, 2)
})

test('AbortSignal: отмена до старта и во время зависшего источника', async () => {
  const before = new AbortController()
  before.abort()
  const first = await contentRepository.getStructure('moscow', { signal: before.signal })
  assert.ok(first.status === 'error' && first.error.code === 'aborted')
  const repository = new LocalContentRepository(() => new Promise(() => {}))
  const during = new AbortController()
  const pending = repository.getStructure('regions', { signal: during.signal })
  await Promise.resolve()
  during.abort()
  const second = await pending
  assert.ok(second.status === 'error' && second.error.code === 'aborted')
})

test('пустой каталог выбранного региона не подменяется заполненным соседним', async () => {
  const snapshot = structuredClone(lifecycleContent)
  snapshot.catalogs[0].documents = []
  snapshot.catalogs[0].materials = []
  const repository = new LocalContentRepository(snapshot)
  const owner = { kind: 'block' as const, id: 'work-accounting' }
  assert.deepEqual(data(await repository.getDocuments(owner, 'moscow')), [])
  assert.equal(data(await repository.getDocuments(owner, 'regions')).length, 5)
  const node = data(await repository.getNodeContent(owner, 'moscow'))
  assert.equal(node.availability.status, 'no-direct-documents')
  assert.deepEqual(node.materials, [])
})
