import type { ProcessItem } from '../../types/process'
import { stages } from '../../data/stages'

export function RelatedFields({ item }: { item: ProcessItem }) {
  const details = item.relatedDetails
  if (!details) return null
  return <div className="condition-fields related-fields">
    <h4>Что это</h4><p>{item.shortDescription}</p>
    <h4>Зачем сметчику</h4><p>{details.purpose}</p>
    <h4>На каком этапе используется</h4>
    {details.stageIds.length ? <ul>{details.stageIds.map(id => <li key={id}>{stages.find(stage => stage.id === id)?.title}</li>)}</ul> : <p>Отдельный контур материального учёта, без привязки к последовательности этапов.</p>}
    {!!details.relationships.length && <><h4>С чем связан</h4><ul>{details.relationships.map(text => <li key={text}>{text}</li>)}</ul></>}
    <h4>Какие данные подтверждает или формирует</h4><p>{details.dataMeaning}</p>
    {!!details.steps?.length && <><h4>Краткая логика</h4><ol className="related-steps">{details.steps.map(text => <li key={text}>{text}</li>)}</ol></>}
    {!!details.documents?.length && <><h4>В составе группы</h4><ul>{details.documents.map(text => <li key={text}>{text}</li>)}</ul></>}
    {details.note && <p className="related-note">{details.note}</p>}
    {!!item.commonErrors?.length && <><h4>Типичные ошибки</h4><ul>{item.commonErrors.map(text => <li key={text}>{text}</li>)}</ul></>}
  </div>
}
