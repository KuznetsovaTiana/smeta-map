import type { ProcessItem } from '../../types/process'
import { influenceLayers } from '../../data/influenceLayers'
import { stages } from '../../data/stages'

export function ConditionFields({ item }: { item: ProcessItem }) {
  const details = item.conditionDetails
  if (!details) return null
  const layer = influenceLayers.find(layer => layer.id === item.layerId)
  return <div className="condition-fields">
    <h4>Что это</h4><p>{item.description ?? item.shortDescription}</p>
    <h4>Почему влияет на стоимость</h4><p>{details.costImpact}</p>
    {layer && <><h4>На каких этапах учитывается</h4><ul>{layer.stageIds.map(id => <li key={id}>{stages.find(stage => stage.id === id)?.title}</li>)}</ul></>}
    <h4>Как может учитываться</h4><p>{details.accounting}</p>
    {!!details.requiredInputs.length && <><h4>Какие исходные данные нужны</h4><ul>{details.requiredInputs.map(text => <li key={text}>{text}</li>)}</ul></>}
    {!!item.commonErrors?.length && <><h4>Типичные ошибки</h4><ul>{item.commonErrors.map(text => <li key={text}>{text}</li>)}</ul></>}
  </div>
}
