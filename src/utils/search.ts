import { searchScore } from './searchMatching'
import type { ProcessItem, Stage } from '../types/process'
import { influenceLayers } from '../data/influenceLayers'
import { relatedBlock } from '../data/relatedItems'

export interface SearchResult {
  id: string
  title: string
  abbreviation?: string
  kind: 'Этап' | 'Документ' | 'Понятие' | 'Нормативный документ'
  regulationId?: string
  layerId?: string
  stageId?: string
  stageTitle: string
  itemId?: string
}

export function searchProcess(query: string, stages: Stage[], items: ProcessItem[]): SearchResult[] {
  if (!query.trim()) return []
  const ranked: { result: SearchResult; score: number }[] = []

  function add(result: SearchResult, description: string | undefined, tags: string[] = [], keywords: string[] = []) {
    const score = searchScore(query, result.title, result.abbreviation, [description, ...tags, ...keywords])
    if (score === null) return
    ranked.push({ result, score })
  }

  for (const stage of stages) {
    add({ id: `stage-${stage.id}`, title: stage.title, kind: 'Этап', stageId: stage.id, stageTitle: stage.title }, stage.shortDescription, stage.tags, stage.keywords)
  }
  for (const item of items) {
    const stage = stages.find(stage => stage.id === item.stageId)
    if (!stage && !item.layerId) continue
    add({ id: `item-${item.id}`, title: item.title, abbreviation: item.abbreviation, kind: item.type === 'document' || item.type === 'related' ? 'Документ' : 'Понятие', layerId: item.layerId, stageId: item.layerId ? undefined : stage?.id, stageTitle: item.layerId === 'related' ? relatedBlock.title : influenceLayers.find(layer => layer.id === item.layerId)?.title ?? stage!.title, itemId: item.id }, item.shortDescription, item.tags, item.keywords)
  }
  return ranked.sort((a, b) => a.score - b.score).map(({ result }) => result)
}
