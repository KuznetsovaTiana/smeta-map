import assert from 'node:assert/strict'
import test from 'node:test'
import { createContentRequest } from '../src/services/contentRequest.ts'
import type { ContentRequestOptions, ContentResult } from '../src/services/contentRepository.ts'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import { LocalContentRepository } from '../src/services/localContentRepository.ts'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

test('loading → success; reload немедленно скрывает старые данные', async () => {
  let id = 0
  const request = createContentRequest(async () => ({ status: 'success', data: ++id }))
  assert.equal(request.getSnapshot().status, 'loading')
  await request.reload()
  assert.deepEqual(request.getSnapshot(), { status: 'success', data: 1 })
  const reload = request.reload()
  assert.deepEqual(request.getSnapshot(), { status: 'loading' })
  await reload
  assert.deepEqual(request.getSnapshot(), { status: 'success', data: 2 })
})

test('not-found и error не содержат прежние data; повтор после ошибки успешен', async () => {
  let next: ContentResult<string> = { status: 'success', data: 'Первый ответ' }
  const request = createContentRequest(async () => next)
  await request.reload()
  next = { status: 'not-found', message: 'Не найдено' }
  await request.reload()
  assert.deepEqual(request.getSnapshot(), next)
  next = { status: 'error', error: { code: 'source-error', message: 'Ошибка источника' } }
  await request.reload()
  assert.deepEqual(request.getSnapshot(), next)
  next = { status: 'success', data: 'Повтор успешен' }
  await request.reload()
  assert.deepEqual(request.getSnapshot(), next)
})

test('поздний ответ предыдущего запроса игнорируется, даже если источник не поддерживает abort', async () => {
  const old = deferred<ContentResult<string>>()
  const latest = deferred<ContentResult<string>>()
  let calls = 0
  const signals: AbortSignal[] = []
  const request = createContentRequest(options => {
    signals.push(options.signal!)
    return ++calls === 1 ? old.promise : latest.promise
  })
  const first = request.reload()
  const second = request.reload()
  assert.equal(signals[0].aborted, true)
  latest.resolve({ status: 'success', data: 'Регионы' })
  await second
  old.resolve({ status: 'success', data: 'Москва' })
  await first
  assert.deepEqual(request.getSnapshot(), { status: 'success', data: 'Регионы' })
})

test('поздняя ошибка не заменяет актуальный успех', async () => {
  const old = deferred<ContentResult<string>>()
  let calls = 0
  const request = createContentRequest(() => ++calls === 1 ? old.promise : Promise.resolve({ status: 'success', data: 'Актуально' }))
  const first = request.reload()
  await request.reload()
  old.reject(new Error('Поздняя ошибка'))
  await first
  assert.deepEqual(request.getSnapshot(), { status: 'success', data: 'Актуально' })
})

test('смена региона: новый контроллер не выдаёт старые данные до запуска эффекта', async () => {
  const source = deferred<unknown>()
  const repository = new LocalContentRepository(() => source.promise)
  const moscow = createContentRequest(options => repository.getRegionalCatalog('moscow', options))
  const previous = moscow.reload()
  moscow.cancel()
  const regions = createContentRequest(options => repository.getRegionalCatalog('regions', options))
  assert.deepEqual(regions.getSnapshot(), { status: 'loading' })
  const current = regions.reload()
  source.resolve(lifecycleContent)
  await Promise.all([previous, current])
  const result = regions.getSnapshot()
  assert.ok(result.status === 'success' && result.data.regionId === 'regions')
  if (result.status === 'success') assert.ok(result.data.documents.every(document => document.regionId === 'regions'))
  assert.deepEqual(moscow.getSnapshot(), { status: 'loading' })
})

test('размонтирование: отмена и отписка исключают поздние публикации', async () => {
  const pending = deferred<ContentResult<string>>()
  let notifications = 0
  let signal: AbortSignal | undefined
  const request = createContentRequest((options: ContentRequestOptions) => {
    signal = options.signal
    return pending.promise
  })
  const unsubscribe = request.subscribe(() => { notifications++ })
  const running = request.reload()
  assert.equal(notifications, 1)
  unsubscribe()
  request.cancel()
  assert.equal(signal?.aborted, true)
  pending.resolve({ status: 'success', data: 'После размонтирования' })
  await running
  assert.equal(notifications, 1)
  assert.deepEqual(request.getSnapshot(), { status: 'loading' })
})

test('StrictMode setup/cleanup/setup: отменённый контроллер можно безопасно запустить вновь', async () => {
  const old = deferred<ContentResult<string>>()
  let count = 0
  const request = createContentRequest(() => ++count === 1 ? old.promise : Promise.resolve({ status: 'success', data: 'После повторного setup' }))
  const first = request.reload()
  request.cancel()
  await request.reload()
  old.resolve({ status: 'success', data: 'Отменённый setup' })
  await first
  assert.deepEqual(request.getSnapshot(), { status: 'success', data: 'После повторного setup' })
})

test('неожиданное исключение адаптера преобразуется в состояние ошибки', async () => {
  const request = createContentRequest<string>(() => { throw new Error('Исключение') })
  await request.reload()
  assert.deepEqual(request.getSnapshot(), { status: 'error', error: { code: 'source-error', message: 'Исключение' } })
})
