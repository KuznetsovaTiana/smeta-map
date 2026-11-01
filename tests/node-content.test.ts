import assert from 'node:assert/strict'
import test from 'node:test'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'
import { LocalContentRepository } from '../src/services/localContentRepository.ts'
import { getDocumentAvailability } from '../src/utils/contentAvailability.ts'

test('сводки процессов 01, 03 и 06 описывают только непосредственных потомков', async () => {
  const first = await contentRepository.getProcess('pre-design', 'moscow')
  assert.ok(first.status === 'success')
  assert.equal(first.data.childSummaries.length, 2)
  assert.ok(first.data.childSummaries.every(summary => summary.childCount === 0 && summary.availability.status === 'not-defined'))
  const design = await contentRepository.getProcess('design', 'regions')
  assert.ok(design.status === 'success')
  assert.deepEqual(design.data.childSummaries.map(summary => [summary.node.data.id, summary.childCount]), [
    ['design-p', 8], ['design-r', 8], ['as-built-estimate', 0], ['estimate-expertise', 0],
  ])
  assert.equal(design.data.documents.length, 0)
  assert.equal(design.data.documentSummaries.length, 0)
  const demolition = await contentRepository.getProcess('demolition', 'moscow')
  assert.ok(demolition.status === 'success')
  assert.equal(demolition.data.childSummaries.length, 8)
  assert.ok(demolition.data.childSummaries.every(summary => summary.node.kind === 'operation'))
  const local = demolition.data.childSummaries.find(summary => summary.node.data.id === 'demolition-local-estimate')!
  assert.equal(local.availability.counts.documents, 1)
  assert.equal(local.availability.status, 'unavailable')
  assert.equal(demolition.data.availability.status, 'no-direct-documents')
})

test('пять форм блока учёта имеют собственные статусы, материалы не предполагаются', async () => {
  const result = await contentRepository.getBlock('work-accounting', 'moscow')
  assert.ok(result.status === 'success')
  assert.equal(result.data.childSummaries.length, 0)
  assert.equal(result.data.documentSummaries.length, 5)
  for (const summary of result.data.documentSummaries) {
    assert.equal(summary.availability.status, 'unavailable')
    assert.equal(summary.availability.counts.availableMaterials, 0)
    assert.equal(summary.typeTitle, undefined)
    assert.equal(summary.document.regionId, 'moscow')
  }
})

test('статус и тип каждой позиции вычисляются независимо, без межрегионального fallback', async () => {
  const data = structuredClone(lifecycleContent)
  const document = data.catalogs[0].documents.find(entry => entry.owner.id === 'design-p-vor')!
  data.documentTypes.push({ id: 'test-type', title: 'Тестовый тип позиции' })
  document.documentTypeId = 'test-type'
  data.catalogs[0].materials.push(
    { id: 'test-available', documentId: document.id, order: 1, title: 'Тестовый материал', typeId: 'example', url: 'https://disk.yandex.ru/d/node-test-only/view' },
    { id: 'test-pending', documentId: document.id, order: 2, title: 'Тестовый шаблон', typeId: 'template' },
  )
  const repository = new LocalContentRepository(data)
  const moscow = await repository.getOperation('design-p-vor', 'moscow')
  const regional = await repository.getOperation('design-p-vor', 'regions')
  assert.ok(moscow.status === 'success' && regional.status === 'success')
  assert.equal(moscow.data.documentSummaries[0].typeTitle, 'Тестовый тип позиции')
  assert.equal(moscow.data.documentSummaries[0].availability.status, 'partial')
  assert.equal(moscow.data.documentSummaries[0].availability.counts.availableMaterials, 1)
  assert.equal(regional.data.documentSummaries[0].availability.status, 'unavailable')
  assert.equal(regional.data.documentSummaries[0].typeTitle, undefined)
  assert.equal(regional.data.documentSummaries[0].availability.counts.availableMaterials, 0)
  const p = await repository.getBlock('design-p', 'moscow')
  const r = await repository.getBlock('design-r', 'moscow')
  assert.ok(p.status === 'success' && r.status === 'success')
  assert.equal(p.data.childSummaries.find(summary => summary.node.data.id === 'design-p-vor')!.availability.status, 'partial')
  assert.equal(r.data.childSummaries.find(summary => summary.node.data.id === 'design-r-vor')!.availability.status, 'unavailable')
  assert.equal(p.data.documentSummaries.length, 0)
})

test('позиции без файлов, с нерабочими ссылками, частичные и полные используют общие правила', () => {
  assert.equal(getDocumentAvailability([]).status, 'unavailable')
  const material = { id: 'test-only', documentId: 'test-document', order: 1, title: 'Тестовый материал', typeId: 'example' }
  assert.equal(getDocumentAvailability([{ ...material, url: '#' }]).counts.availableMaterials, 0)
  const working = { ...material, url: 'https://disk.yandex.ru/d/node-test-only/view' }
  assert.equal(getDocumentAvailability([working]).status, 'complete')
  assert.equal(getDocumentAvailability([working, { ...material, id: 'test-second', order: 2 }]).status, 'partial')
  assert.equal(getDocumentAvailability([{ ...working, linkCheck: 'broken' }]).status, 'unavailable')
})
