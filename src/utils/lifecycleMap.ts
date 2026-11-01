import type { LifecycleStructure } from '../types/lifecycle.ts'

/** Группирует представление, не меняя порядок и не копируя исходные сущности. */
export function groupProcessRows<T>(processes: T[], columns: number): T[][] {
  if (!Number.isSafeInteger(columns) || columns < 1) throw new RangeError('Количество колонок должно быть положительным целым числом.')
  const rows: T[][] = []
  for (let start = 0; start < processes.length; start += columns) rows.push(processes.slice(start, start + columns))
  return rows
}

/** Краткая подпись — производное представление, исходное название не меняется. */
export function compactProcessTitle(title: string): string {
  const words = title.replace(/\s*\([^)]*\)/g, '').replace(/\s+стадия$/u, '').trim().split(/\s+/)
  return words.length > 3 ? `${words.slice(0, 3).join(' ')}…` : words.join(' ')
}

export function processMapSummary(structure: LifecycleStructure, processId: string) {
  const process = structure.processes.find(entry => entry.id === processId)
  if (!process) return null
  const blocks = structure.blocks.filter(entry => entry.processId === processId).sort((a, b) => a.order - b.order)
  const blockIds = new Set(blocks.map(block => block.id))
  const directOperations = structure.operations.filter(operation => operation.parent.kind === 'process' && operation.parent.id === processId).sort((a, b) => a.order - b.order)
  const operationCount = structure.operations.filter(operation => operation.parent.kind === 'process'
    ? operation.parent.id === processId : blockIds.has(operation.parent.id)).length
  return { process, blocks, directOperations, blockCount: blocks.length, operationCount }
}

export function nextProcessIndex(key: string, current: number, count: number): number | null {
  if (count < 1) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current - 1 + count) % count
  return null
}
