import { useSearchParams } from 'react-router-dom'
import { SchemaHero } from '../../components/SchemaHero/SchemaHero'
import { QueryFeedback } from '../../components/Lifecycle/QueryFeedback'
import { useContentQuery } from '../../hooks/useContentQuery'
import type { ContentRepository } from '../../services/contentRepository.ts'
import { getRegion } from '../../utils/routing'
import { LifecycleMap } from '../../components/Lifecycle/LifecycleMap'
import { ResourceMaterials } from '../../components/Resources/ResourceMaterials'

export function LifecycleHomePage({ repository }: { repository?: ContentRepository }) {
  const [params, setParams] = useSearchParams()
  const regionId = getRegion(params)
  const state = useContentQuery({ kind: 'structure', regionId }, repository)
  const selectedId = params.get('process')
  const initialOpen = ['block', 'operation', 'document'].flatMap(key => params.get(key) ? [params.get(key)!] : [])
  function selectProcess(id: string | null) {
    const next = new URLSearchParams(params)
    for (const key of ['process', 'block', 'operation', 'document', 'material']) next.delete(key)
    if (id) next.set('process', id)
    setParams(next)
  }
  return <section className="lifecycle-page lifecycle-home">
    <SchemaHero />
    {(params.has('stage') || params.has('item')) && <p className="lifecycle-status">Структура сайта обновлена. Для прежнего адреса этапа или элемента выберите соответствующий раздел новой карты.</p>}
    <QueryFeedback state={state} regionId={regionId} />
    {state.status === 'success' && (state.data.processes.length
      ? <><LifecycleMap key={`${regionId}:${initialOpen.join(':')}`} structure={state.data} regionId={regionId} selectedId={selectedId} onSelect={selectProcess} repository={repository} initialOpen={initialOpen} />{selectedId && !state.data.processes.some(process => process.id === selectedId) && <p role="status">Процесс не найден. Выберите процесс на карте.</p>}</>
      : <p role="status">Процессы пока не добавлены.</p>)}
    {state.status === 'success' && <details className="lifecycle-card">
      <summary>Нормативно-техническая документация</summary>
      <ResourceMaterials key={regionId} itemId="regulatory-reference" region={regionId} title="Учебные и справочные материалы" />
    </details>}
  </section>
}
