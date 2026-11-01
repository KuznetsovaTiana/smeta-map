import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import type { NodeRef } from '../src/types/lifecycle.ts'
import { getContentAvailability, getRegionalMaterialHref } from '../src/utils/contentAvailability.ts'
import { validateContentSnapshot } from '../src/utils/contentValidation.ts'

const specification = readFileSync(new URL('../ТЗ_сметное_дело.md', import.meta.url), 'utf8')
const normalize = (text: string) => text.replace(/\s+/g, ' ').replace(/---/g, '—').trim().replace(/\.$/, '')

/** Ожидаемые названия и порядок читаются из первичного ТЗ, а не копируются из данных. */
function section(heading: string): string {
  const start = specification.indexOf(heading)
  assert.ok(start >= 0, `Заголовок ТЗ не найден: ${heading}`)
  const rest = specification.slice(start + heading.length)
  const nextHeading = rest.search(/^#{3,4} /m)
  return nextHeading < 0 ? rest : rest.slice(0, nextHeading)
}

function list(heading: string): string[] {
  return [...section(heading).matchAll(/^\d+\.\s+(.+(?:\r?\n(?!\s*$|\d+\.|#).+)*)/gm)]
    .map(match => normalize(match[1]))
}

const operationSections = [
  ['block', 'design-p', '#### Блок 3.1.'],
  ['block', 'design-r', '#### Блок 3.2.'],
  ['block', 'contract-estimate', '#### Блок 4.2.'],
  ['block', 'capital-repair', '#### Блок 5.1.'],
  ['block', 'current-repair', '#### Блок 5.2.'],
  ['process', 'demolition', '### ПРОЦЕСС 06.'],
] as const

test('полный снимок проходит существующий валидатор без ошибок и предупреждений', () => {
  assert.deepEqual(validateContentSnapshot(lifecycleContent), { valid: true, issues: [] })
})

test('все шесть процессов имеют точные названия и порядок из ТЗ', () => {
  const expected = [...specification.matchAll(/^### ПРОЦЕСС (\d+)\. (.+)$/gm)]
    .map(match => ({ order: Number(match[1]), title: normalize(match[2]) }))
  assert.equal(expected.length, 6)
  assert.deepEqual(lifecycleContent.processes.map(({ order, title }) => ({ order, title })), expected)
})

test('14 блоков: правильные названия, родители и порядок; экспертиза с полным названием', () => {
  const expected: [string, string[]][] = [
    ['pre-design', [
      'Расчёт смет по укрупнённым показателям (НЦС)',
      'Расчёт с применением объектов-аналогов',
    ]],
    ['surveys-and-design', [
      'Расчёт смет на проведение инженерных изысканий',
      'Расчёт смет на проектные работы',
    ]],
    ['design', [
      'Стадия «П» — разработка проектной документации',
      'Стадия «Р» — разработка рабочей документации',
      'Исполнительная смета',
      'Проверка достоверности определения сметной стоимости строительства, реконструкции и капитального ремонта ОКС (экспертиза)',
    ]],
    ['construction', [
      'Определение начальной максимальной цены контракта (НМЦК)',
      'Смета контракта',
      'Учёт выполненных работ',
    ]],
    ['operation-and-repair', [
      'Комплект проектно-сметной документации для капитального ремонта',
      'Комплект сметной документации для текущего ремонта',
      'Сметы на техническую эксплуатацию и техническое обслуживание',
    ]],
    ['demolition', []],
  ]
  assert.equal(lifecycleContent.blocks.length, 14)
  for (const [processId, titles] of expected) {
    const actual = lifecycleContent.blocks.filter(block => block.processId === processId)
    assert.deepEqual(actual.map(block => block.title), titles)
    assert.deepEqual(actual.map(block => block.order), titles.map((_, index) => index + 1))
    for (const title of titles) assert.ok(normalize(specification).includes(title), title)
  }
})

test('40 операций: полные списки и точная последовательность непосредственно из ТЗ', () => {
  assert.equal(lifecycleContent.operations.length, 40)
  for (const [kind, id, heading] of operationSections) {
    const expected = list(heading)
    assert.ok(expected.length > 0, heading)
    const actual = lifecycleContent.operations.filter(operation => operation.parent.kind === kind && operation.parent.id === id)
    assert.deepEqual(actual.map(operation => operation.title), expected, heading)
    assert.deepEqual(actual.map(operation => operation.order), expected.map((_, index) => index + 1))
  }
})

test('П и Р: 8 самостоятельных операций и по 6 независимых документных позиций', () => {
  const p = lifecycleContent.operations.filter(operation => operation.parent.id === 'design-p')
  const r = lifecycleContent.operations.filter(operation => operation.parent.id === 'design-r')
  assert.equal(p.length, 8); assert.equal(r.length, 8)
  assert.ok(p.every(operation => !r.some(other => other.id === operation.id)))
  assert.equal(p[2].title, 'Локальный сметный расчёт')
  assert.equal(r[2].title, 'Локальная смета')
  for (const catalog of lifecycleContent.catalogs) {
    const docsP = catalog.documents.filter(document => p.some(operation => operation.id === document.owner.id))
    const docsR = catalog.documents.filter(document => r.some(operation => operation.id === document.owner.id))
    assert.equal(docsP.length, 6); assert.equal(docsR.length, 6)
    assert.ok(docsP.every(document => !docsR.some(other => other.id === document.id || other === document)))
  }
})

test('33 позиции на регион: только именованные документы ТЗ, без придуманных перечней', () => {
  // Индексы документных элементов внутри первичных списков ТЗ. Остальные элементы — действия.
  const documentIndices: Record<string, number[]> = {
    'design-p': [1, 2, 4, 5, 6, 7],
    'design-r': [1, 2, 4, 5, 6, 7],
    'contract-estimate': [0, 1, 2],
    'capital-repair': [2, 3, 5, 6, 7],
    'current-repair': [1, 2, 4],
    demolition: [2, 3, 5, 6, 7],
  }
  for (const catalog of lifecycleContent.catalogs) {
    const expectedOwners = new Set<string>()
    assert.equal(catalog.documents.length, 33)
    for (const [kind, id, heading] of operationSections) {
      const titles = list(heading)
      const operations = lifecycleContent.operations.filter(operation => operation.parent.kind === kind && operation.parent.id === id)
      for (const [index, operation] of operations.entries()) {
        const docs = catalog.documents.filter(document => document.owner.kind === 'operation' && document.owner.id === operation.id)
        if (documentIndices[id].includes(index)) {
          expectedOwners.add(operation.id)
          assert.equal(docs.length, 1)
          assert.equal(docs[0].title, titles[index])
        } else assert.equal(docs.length, 0, operation.id)
      }
    }
    const accounting = catalog.documents.filter(document => document.owner.kind === 'block' && document.owner.id === 'work-accounting')
    assert.deepEqual(accounting.map(document => document.title), list('#### Блок 4.3.'))
    assert.deepEqual(accounting.map(document => document.order), [1, 2, 3, 4, 5])
    assert.equal(catalog.documents.filter(document => document.owner.kind === 'process').length, 0)
    assert.ok(catalog.documents.every(document => expectedOwners.has(document.owner.id) || document.owner.id === 'work-accounting'))
    assert.ok(catalog.documents.every(document => document.regionId === catalog.regionId))
  }
})

test('снос без искусственного блока; учёт работ без операций-обёрток', () => {
  assert.equal(lifecycleContent.blocks.filter(block => block.processId === 'demolition').length, 0)
  assert.equal(lifecycleContent.operations.filter(operation => operation.parent.kind === 'process' && operation.parent.id === 'demolition').length, 8)
  assert.equal(lifecycleContent.operations.filter(operation => operation.parent.id === 'work-accounting').length, 0)
})

test('для каждого из 60 узлов ровно одна запись на регион; ожидаемые статусы', () => {
  for (const catalog of lifecycleContent.catalogs) {
    assert.equal(catalog.nodeContent.length, 60)
    const totals = { 'not-defined': 0, 'no-direct-documents': 0, unavailable: 0, partial: 0, complete: 0 }
    for (const content of catalog.nodeContent) {
      const result = getContentAvailability(lifecycleContent, content.owner, catalog.regionId)
      assert.ok(result.ok, JSON.stringify(result))
      if (!result.ok) throw new Error('Недопустимый снимок')
      totals[result.status]++
      assert.equal(result.counts.totalMaterials, 0)
      assert.equal(result.counts.availableMaterials, 0)
      const directDocs = catalog.documents.filter(document => document.owner.kind === content.owner.kind && document.owner.id === content.owner.id)
      assert.equal(result.counts.documents, directDocs.length)
      if (directDocs.length) {
        assert.equal(content.definition, 'defined')
        assert.equal(result.status, 'unavailable')
      }
    }
    assert.deepEqual(totals, { 'not-defined': 20, 'no-direct-documents': 11, unavailable: 29, partial: 0, complete: 0 })
  }
})

test('неуточнённые направления без вымышленных операций, документов и материалов', () => {
  const unknown = ['ncs', 'analog-objects', 'engineering-surveys', 'design-works', 'as-built-estimate', 'estimate-expertise', 'nmck', 'technical-maintenance']
  for (const id of unknown) {
    assert.equal(lifecycleContent.operations.filter(operation => operation.parent.id === id).length, 0)
    for (const catalog of lifecycleContent.catalogs) {
      const result = getContentAvailability(lifecycleContent, { kind: 'block', id }, catalog.regionId)
      assert.ok(result.ok && result.status === 'not-defined')
      assert.equal(catalog.documents.filter(document => document.owner.id === id).length, 0)
    }
  }
  for (const catalog of lifecycleContent.catalogs) assert.deepEqual(catalog.materials, [])
  const repairBlocks = lifecycleContent.blocks.filter(block => block.processId === 'operation-and-repair')
  assert.deepEqual(repairBlocks.map(block => block.id), ['capital-repair', 'current-repair', 'technical-maintenance'])
})

test('региональные каталоги независимы, документы не разделяют ID или изменяемые объекты', () => {
  const [moscow, regional] = lifecycleContent.catalogs
  assert.notEqual(moscow.documents, regional.documents)
  assert.notEqual(moscow.materials, regional.materials)
  assert.notEqual(moscow.nodeContent, regional.nodeContent)
  assert.ok(moscow.documents.every(document => !regional.documents.some(other => other.id === document.id || other === document || other.owner === document.owner)))
  const changed = structuredClone(lifecycleContent)
  changed.catalogs[0].documents[0].title = 'Изменено только в тестовой копии'
  assert.notEqual(changed.catalogs[0].documents[0].title, changed.catalogs[1].documents[0].title)
  changed.catalogs[0].documents = []
  const result = getContentAvailability(changed, { kind: 'operation', id: 'design-p-vor' }, 'moscow')
  assert.ok(result.ok && result.status === 'no-direct-documents')
  assert.equal(changed.catalogs[1].documents.length, 33)
  assert.equal(getRegionalMaterialHref(lifecycleContent, 'missing', 'moscow'), null)
  assert.equal(getRegionalMaterialHref(lifecycleContent, 'missing', 'regions'), null)
  assert.deepEqual(moscow.documents.map(({ owner, order, title }) => ({ owner, order, title })), regional.documents.map(({ owner, order, title }) => ({ owner, order, title })))
})

test('расширение процесса 05 только данными; обязательные региональные записи проверяются', () => {
  const changed = structuredClone(lifecycleContent)
  // Только изолированный тест, не содержимое пользовательского каталога.
  changed.blocks.push({ id: 'test-extension', processId: 'operation-and-repair', order: 4, title: 'Тест расширения' })
  assert.ok(validateContentSnapshot(changed).issues.some(issue => issue.code === 'missing-node-content'))
  for (const catalog of changed.catalogs) catalog.nodeContent.push({ regionId: catalog.regionId, owner: { kind: 'block', id: 'test-extension' }, definition: 'not-defined' })
  assert.deepEqual(validateContentSnapshot(changed), { valid: true, issues: [] })
})

test('все ID уникальны; все родители существуют, включая региональных владельцев', () => {
  const collections = [lifecycleContent.processes, lifecycleContent.blocks, lifecycleContent.operations, ...lifecycleContent.catalogs.map(catalog => catalog.documents)]
  const allIds = collections.flatMap(collection => collection.map(entry => entry.id))
  assert.equal(new Set(allIds).size, allIds.length)
  const nodeKeys = new Set([
    ...lifecycleContent.processes.map(process => `process:${process.id}`),
    ...lifecycleContent.blocks.map(block => `block:${block.id}`),
    ...lifecycleContent.operations.map(operation => `operation:${operation.id}`),
  ])
  const exists = (node: NodeRef) => nodeKeys.has(`${node.kind}:${node.id}`)
  assert.ok(lifecycleContent.operations.every(operation => exists(operation.parent)))
  for (const catalog of lifecycleContent.catalogs) assert.ok(catalog.documents.every(document => exists(document.owner)))
})
