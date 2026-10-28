import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { stages } from '../data/stages'
import { items } from '../data/items'
import { estimateDevelopmentDetails as diagram } from '../data/stageDetails'
import type { ViewMode } from '../types/process'

/** URL — единственный источник выбора. ВОР может быть входом этапа разработки. */
export function useSchemaState() {
  const [params, setParams] = useSearchParams()
  const linkedItem = items.find(item => item.id === params.get('item'))
  const requestedStage = stages.find(stage => stage.id === params.get('stage'))
  const belongs = !linkedItem || linkedItem.layerId || requestedStage?.items.includes(linkedItem.id)
    || (requestedStage?.id === diagram.stageId && diagram.inputIds.includes(linkedItem.id))
  const selectedStage = linkedItem && !linkedItem.layerId && (!requestedStage || !belongs)
    ? stages.find(stage => stage.id === linkedItem.stageId) : requestedStage
  const mode: ViewMode = params.get('mode') === 'detailed' || (params.get('mode') !== 'overview' && !!linkedItem?.layerId) ? 'detailed' : 'overview'

  useEffect(() => {
    const next = new URLSearchParams(params)
    if (linkedItem && !linkedItem.layerId && selectedStage) next.set('stage', selectedStage.id)
    if (params.has('mode') && !['overview', 'detailed'].includes(params.get('mode')!)) next.set('mode', mode)
    if (linkedItem?.layerId && !params.has('mode')) next.set('mode', 'detailed')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [params, setParams, linkedItem, selectedStage, mode])

  function changeMode(value: ViewMode) {
    const next = new URLSearchParams(params)
    next.set('mode', value)
    setParams(next)
  }
  function selectDocument(stageId: string, itemId: string) {
    const next = new URLSearchParams(params)
    next.set('stage', stageId); next.set('item', itemId)
    setParams(next, { state: { fromSearch: true } })
  }
  function closeItem() {
    const next = new URLSearchParams(params)
    next.delete('item'); setParams(next)
  }
  function selectStage(stageId: string) {
    const next = new URLSearchParams(params)
    if (selectedStage?.id === stageId) next.delete('stage')
    else next.set('stage', stageId)
    next.delete('item'); setParams(next)
  }
  function closeStage() {
    const next = new URLSearchParams(params)
    next.delete('stage'); next.delete('item'); setParams(next)
    document.getElementById(`stage-card-${selectedStage?.id}`)?.focus({ preventScroll: true })
  }
  const invalidSelection = (params.has('item') && !linkedItem) || (params.has('stage') && !requestedStage && !selectedStage)
  return { params, linkedItem, selectedStage, mode, detailed: mode === 'detailed', invalidSelection, changeMode, selectDocument, closeItem, selectStage, closeStage }
}
