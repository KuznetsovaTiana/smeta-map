import { ArrowDownToLine, ArrowUpFromLine, ListChecks, TriangleAlert } from 'lucide-react'
import type { ProcessItem } from '../../types/process'
import { items } from '../../data/items'

export function ItemFields({ item }: { item: ProcessItem }) {
  const lists = [
    { title: 'Входные данные', icon: ArrowDownToLine, values: item.inputs },
    { title: 'Результат', icon: ArrowUpFromLine, values: item.outputs },
    { title: 'Что проверить', icon: ListChecks, values: item.checklist },
    { title: 'Типичные ошибки', icon: TriangleAlert, values: item.commonErrors },
  ]
  return <div className="item-fields">
    {(item.description || item.shortDescription) && <p>{item.description ?? item.shortDescription}</p>}
    {lists.filter(group => group.values?.length).map(group => <section key={group.title}>
      <h4><group.icon size={16} strokeWidth={1.5} aria-hidden="true" />{group.title}</h4><ul>{group.values!.map(value => <li key={value}>{items.find(candidate => candidate.id === value)?.title ?? value}</li>)}</ul>
    </section>)}
  </div>
}
