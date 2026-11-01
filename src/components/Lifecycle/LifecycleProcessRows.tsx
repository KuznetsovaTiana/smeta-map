import type { ReactNode } from 'react'
import type { Process } from '../../types/lifecycle.ts'
import { groupProcessRows } from '../../utils/lifecycleMap.ts'

interface Props {
  processes: Process[]
  columns: 2 | 3
  activeId: string | null
  renderCard: (process: Process, index: number) => ReactNode
  panel: ReactNode
}

/** Панель находится после законченной строки, а не становится ячейкой сетки. */
export function LifecycleProcessRows({ processes, columns, activeId, renderCard, panel }: Props) {
  return <div className="lifecycle-map-rows" data-columns={columns}>
    {groupProcessRows(processes, columns).map((row, rowIndex) => <div className="lifecycle-map-row-group" data-map-row={rowIndex} key={row[0].id}>
      <ol className={`lifecycle-processes lifecycle-map-track${activeId ? ' has-selection' : ''}`} start={rowIndex * columns + 1}>
        {row.map((process, index) => renderCard(process, rowIndex * columns + index))}
      </ol>
      {row.some(process => process.id === activeId) && panel}
    </div>)}
  </div>
}
