import type { ContentRepositoryError, ContentRequestOptions, ContentResult } from './contentRepository.ts'

export type ContentRequestState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'not-found'; message: string }
  | { status: 'error'; error: ContentRepositoryError }

/** Общий механизм хуков. Результат устаревшей загрузки никогда не публикуется. */
export function createContentRequest<T>(load: (options: ContentRequestOptions) => Promise<ContentResult<T>>) {
  let state: ContentRequestState<T> = { status: 'loading' }
  let generation = 0
  let controller: AbortController | undefined
  const listeners = new Set<() => void>()

  function publish(next: ContentRequestState<T>) {
    state = next
    for (const listener of listeners) listener()
  }

  function cancel() {
    generation++
    controller?.abort()
    controller = undefined
  }

  async function reload(): Promise<void> {
    cancel()
    const requestGeneration = generation
    const current = new AbortController()
    controller = current
    publish({ status: 'loading' })
    try {
      const result = await load({ signal: current.signal })
      if (requestGeneration !== generation || current.signal.aborted) return
      publish(result)
    } catch (error) {
      if (requestGeneration !== generation || current.signal.aborted) return
      publish({ status: 'error', error: { code: 'source-error', message: error instanceof Error ? error.message : 'Не удалось загрузить данные.' } })
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    reload,
    /** Вызывается при размонтировании/смене запроса, без публикации в отключённый UI. */
    cancel,
  }
}
