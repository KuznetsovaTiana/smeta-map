import type { ProcessItem, Stage } from '../types/process'
import { searchProcess } from './search'

const visibleTypes = new Set<ProcessItem['type']>(['document', 'regulation', 'related'])

export const documentCategories = [
  { id: 'estimate', title: 'Сметные документы' },
  { id: 'project', title: 'Проектные документы' },
  { id: 'contract', title: 'Договорные документы' },
  { id: 'execution', title: 'Исполнительные документы' },
  { id: 'accounting', title: 'Учётные документы' },
  { id: 'regulation', title: 'Нормативные документы' },
  { id: 'related', title: 'Смежные документы' },
]

export function getDocumentCategory(item: ProcessItem): string {
  if (item.type === 'regulation') return 'regulation'
  if (item.relatedDetails?.documents) return 'execution'
  if (['m29', 'm15'].includes(item.id)) return 'accounting'
  if (item.type === 'related') return 'related'
  if (item.stageId === 'estimate-development') return 'estimate'
  if (['source-data', 'quantity-takeoff', 'construction-support'].includes(item.stageId ?? '')) return 'project'
  if (item.stageId === 'tender-contract') return 'contract'
  return 'accounting'
}

export function getDocumentStages(item: ProcessItem, stages: Stage[]): Stage[] {
  return stages.filter(stage => stage.id === item.stageId || item.relatedDetails?.stageIds.includes(stage.id))
    .sort((a, b) => a.order - b.order)
}

export function getCatalogDocuments(items: ProcessItem[], stages: Stage[], filters: { query: string; stage: string; category: string }): ProcessItem[] {
  const matches = filters.query.trim() ? new Set(searchProcess(filters.query, stages, items).map(result => result.itemId)) : null
  return items.filter(item => visibleTypes.has(item.type)
    && (!matches || matches.has(item.id))
    && (!filters.stage || getDocumentStages(item, stages).some(stage => stage.id === filters.stage))
    && (!filters.category || getDocumentCategory(item) === filters.category))
    .sort((a, b) => {
      const stageA = getDocumentStages(a, stages)[0]
      const stageB = getDocumentStages(b, stages)[0]
      const order = (stageA?.order ?? Infinity) - (stageB?.order ?? Infinity)
      if (order && Number.isFinite(order)) return order
      if (stageA && !stageB) return -1
      if (!stageA && stageB) return 1
      const indexA = stageA?.items.indexOf(a.id) ?? -1
      const indexB = stageB?.items.indexOf(b.id) ?? -1
      return (indexA < 0 ? Infinity : indexA) - (indexB < 0 ? Infinity : indexB) || a.title.localeCompare(b.title, 'ru')
    })
}
