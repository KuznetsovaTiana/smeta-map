import { Link } from 'react-router-dom'
import type { ContentRepositoryError } from '../../services/contentRepository.ts'
import { regionalLocation } from '../../utils/contentRoutes.ts'

interface Props {
  state: { status: string; message?: string; error?: ContentRepositoryError; reload: () => Promise<void> }
  regionId: string
}

export function QueryFeedback({ state, regionId }: Props) {
  if (state.status === 'success') return null
  if (state.status === 'loading') return <p className="lifecycle-status" role="status" aria-live="polite">Загрузка содержимого…</p>
  return <section className="lifecycle-status" role={state.status === 'error' ? 'alert' : 'status'}>
    <h1>{state.status === 'error' ? 'Не удалось получить данные' : 'Раздел или материал не найден'}</h1>
    <p>{state.error?.message ?? state.message ?? 'Проверьте адрес раздела.'}</p>
    <div className="lifecycle-actions">
      <button type="button" onClick={() => { void state.reload() }}>Повторить загрузку</button>
      <Link to={regionalLocation('/schema', regionId)}>На главную карту</Link>
    </div>
  </section>
}
