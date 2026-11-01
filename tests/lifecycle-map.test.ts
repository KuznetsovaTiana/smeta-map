import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { contentRepository } from '../src/services/contentRepositoryInstance.ts'
import { compactProcessTitle, groupProcessRows, nextProcessIndex, processMapSummary } from '../src/utils/lifecycleMap.ts'

test('состав всех процессов вычисляется из структуры репозитория, включая вложенные операции', async () => {
  const result = await contentRepository.getStructure('moscow')
  assert.equal(result.status, 'success')
  if (result.status !== 'success') throw new Error('Нет структуры')
  const summaries = result.data.processes.map(process => processMapSummary(result.data, process.id)!)
  assert.deepEqual(summaries.map(summary => [summary.blockCount, summary.operationCount]), [[2, 0], [2, 0], [4, 16], [3, 3], [3, 13], [0, 8]])
  assert.equal(summaries[5].directOperations.length, 8)
  assert.equal(summaries[2].directOperations.length, 0)
  assert.equal(processMapSummary(result.data, 'missing'), null)
})

test('расширение процесса данными меняет сводку без нового массива процессов или описаний', async () => {
  const result = await contentRepository.getStructure('regions')
  if (result.status !== 'success') throw new Error('Нет структуры')
  result.data.blocks.push({ id: 'test-only-extension', processId: 'operation-and-repair', order: 4, title: 'Изолированное расширение' })
  result.data.operations.push({ id: 'test-only-operation', parent: { kind: 'block', id: 'test-only-extension' }, order: 1, title: 'Изолированная операция' })
  const summary = processMapSummary(result.data, 'operation-and-repair')!
  assert.equal(summary.blockCount, 4)
  assert.equal(summary.operationCount, 14)
})

test('компактные подписи производны от полного названия, модель не меняется', () => {
  const full = 'Проектная стадия (архитектурно-строительное проектирование)'
  assert.equal(compactProcessTitle(full), 'Проектная')
  assert.equal(compactProcessTitle('Инженерные изыскания и проектные работы'), 'Инженерные изыскания и…')
  assert.equal(compactProcessTitle('Снос'), 'Снос')
  assert.equal(full, 'Проектная стадия (архитектурно-строительное проектирование)')
})

test('клавиатура: стрелки, Home, End, пустой список и неизвестная клавиша', () => {
  assert.equal(nextProcessIndex('ArrowRight', 5, 6), 0)
  assert.equal(nextProcessIndex('ArrowLeft', 0, 6), 5)
  assert.equal(nextProcessIndex('Home', 4, 6), 0)
  assert.equal(nextProcessIndex('End', 1, 6), 5)
  assert.equal(nextProcessIndex('Enter', 2, 6), null)
  assert.equal(nextProcessIndex('ArrowRight', 0, 0), null)
})

test('карта не содержит механизмов прокрутки, свайпов или центрирования скроллом', () => {
  const component = readFileSync(new URL('../src/components/Lifecycle/LifecycleMap.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/styles/lifecycle-map.css', import.meta.url), 'utf8')
  assert.doesNotMatch(component, /scrollTo|scrollLeft|onScroll|onPointerDown|onWheel|ResizeObserver/)
  assert.doesNotMatch(styles, /scroll-snap|overflow-x:\s*(auto|scroll)|width:\s*max-content|flex-basis/)
  assert.match(styles, /repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styles, /repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /overflow-x:\s*clip/)
})

test('desktop-шаблон использует CSS-переменную, стили поддерживают вложенную панель', () => {
  const component = readFileSync(new URL('../src/components/Lifecycle/LifecycleMap.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/styles/lifecycle-map.css', import.meta.url), 'utf8')
  assert.match(component, /'--lifecycle-columns'/)
  assert.doesNotMatch(component, /gridTemplateColumns|matchMedia|innerWidth/)
  assert.match(styles, /grid-template-columns: var\(--lifecycle-columns\)/)
  assert.match(styles, /max-width: 1365px/)
  assert.match(styles, /max-width: 767px/)
  assert.match(styles, /flex: 0 0 auto/)
  assert.match(styles, /\.lifecycle-map \.lifecycle-process-info \{ display: grid; visibility: visible/)
})

test('каждый процесс попадает в пару на телефоне и в тройку на планшете', async () => {
  const result = await contentRepository.getStructure('moscow')
  assert.ok(result.status === 'success')
  const processes = result.data.processes
  for (const columns of [2, 3]) {
    const rows = groupProcessRows(processes, columns)
    assert.equal(rows.length, 6 / columns)
    assert.deepEqual(rows.flat().map(process => process.id), processes.map(process => process.id))
    processes.forEach((process, index) => {
      assert.equal(rows.findIndex(row => row.some(entry => entry.id === process.id)), Math.floor(index / columns))
      assert.equal(rows[Math.floor(index / columns)][index % columns], process)
    })
  }
  assert.deepEqual(groupProcessRows([], 2), [])
  assert.deepEqual(groupProcessRows([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.throws(() => groupProcessRows(processes, 0), RangeError)
})
