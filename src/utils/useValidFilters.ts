import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Не оставляет в URL фильтр, который select не способен отобразить. */
export function useValidFilters(stageIds: string[], typeIds: string[]) {
  const [params, setParams] = useSearchParams()
  const invalidStage = params.has('stage') && !stageIds.includes(params.get('stage')!)
  const invalidType = params.has('type') && !typeIds.includes(params.get('type')!)
  useEffect(() => {
    if (!invalidStage && !invalidType) return
    const next = new URLSearchParams(params)
    if (invalidStage) next.delete('stage')
    if (invalidType) next.delete('type')
    setParams(next, { replace: true })
  }, [invalidStage, invalidType, params, setParams])
}
