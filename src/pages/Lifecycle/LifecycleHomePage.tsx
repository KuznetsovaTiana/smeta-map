import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { SchemaHero } from '../../components/SchemaHero/SchemaHero'
import { QueryFeedback } from '../../components/Lifecycle/QueryFeedback'
import { useContentQuery } from '../../hooks/useContentQuery'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { getRegion } from '../../utils/routing'
import { LifecycleMap } from '../../components/Lifecycle/LifecycleMap'

export function LifecycleHomePage({ repository }: { repository?: ContentRepository }) {
  const [params] = useSearchParams()
  const regionId = getRegion(params)
  const state = useContentQuery({ kind: 'structure', regionId }, repository)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  return <section className="lifecycle-page lifecycle-home">
    <SchemaHero />
    {(params.has('stage') || params.has('item')) && <p className="lifecycle-status">Структура сайта обновлена. Для прежнего адреса этапа или элемента выберите соответствующий раздел новой карты.</p>}
    <QueryFeedback state={state} regionId={regionId} />
    {state.status === 'success' && (state.data.processes.length
      ? <LifecycleMap structure={state.data} regionId={regionId} selectedId={selectedId} onSelect={setSelectedId} />
      : <p role="status">Процессы пока не добавлены.</p>)}
  </section>
}
