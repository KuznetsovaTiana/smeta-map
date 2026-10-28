import type { ProcessItem } from '../types/process'

export const itemTypeLabels: Record<ProcessItem['type'], string> = {
  document: 'Документ', method: 'Метод', calculation: 'Расчёт', result: 'Результат',
  condition: 'Условие', regulation: 'Нормативный материал', related: 'Смежный элемент',
}
