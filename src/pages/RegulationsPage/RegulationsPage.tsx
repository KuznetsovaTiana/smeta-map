import { useSearchParams } from 'react-router-dom'
import { PageIntro } from '../../components/PageIntro/PageIntro'
import { regulations, regulationCategories, regulationTypes } from '../../data/regulations'
import { stages } from '../../data/stages'
import { getRegion } from '../../utils/routing'
import { isRegulationVisible, searchRegulations } from '../../utils/regulations'
import { useValidFilters } from '../../utils/useValidFilters'
import { useMobileLayout } from '../../utils/useMobileLayout'
import { RegulationCard } from './RegulationCard'
import { RegulationDetails } from './RegulationDetails'
import '../DocumentsPage/DocumentsPage.css'
import './RegulationsPage.css'

export function RegulationsPage() {
  const [params, setParams] = useSearchParams()
  useValidFilters(stages.map(stage => stage.id), regulationTypes.map(type => type.id))
  const region = getRegion(params)
  const query = params.get('q') ?? ''
  const type = params.get('type') ?? ''
  const stage = params.get('stage') ?? ''
  const mobile = useMobileLayout()
  const selected = regulations.find(regulation => regulation.id === params.get('item'))
  const selectedVisible = selected && isRegulationVisible(selected, region)
  const matches = query.trim() ? new Set(searchRegulations(query, region).map(result => result.regulationId)) : null
  const filtered = regulations.filter(regulation => isRegulationVisible(regulation, region) && (!type || regulation.type === type) && (!stage || regulation.relatedStages.includes(stage)) && (!matches || matches.has(regulation.id)))
  const categories = regulationCategories.filter(category => !category.regions || category.regions.includes(region))
  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace })
  }
  function reset() {
    const next = new URLSearchParams(params)
    for (const key of ['q', 'type', 'stage']) next.delete(key)
    setParams(next)
  }
  const filters = <div className="catalog-filter-fields">
    <label>Тип документа<select aria-label="Тип документа" value={type} onChange={event => update('type', event.target.value)}><option value="">Все типы</option>{regulationTypes.map(type => <option value={type.id} key={type.id}>{type.title}</option>)}</select></label>
    <label>Связанный этап<select aria-label="Связанный этап" value={stage} onChange={event => update('stage', event.target.value)}><option value="">Все этапы</option>{stages.map(stage => <option value={stage.id} key={stage.id}>{stage.order}. {stage.title}</option>)}</select></label>
    <button type="button" className="catalog-reset" onClick={reset}>Сбросить фильтры</button>
  </div>
  return <section>
    <PageIntro number="03" title="Нормативная база" description="Нормативные, методические и справочные материалы, используемые при определении стоимости строительства" />
    <div className="document-catalog">
      <div className="catalog-controls">
        <label className="catalog-search">Поиск в нормативной базе<input type="search" value={query} placeholder="Название, номер, сокращение или тег…" onChange={event => update('q', event.target.value, true)} /></label>
        {mobile ? <details className="catalog-filter-toggle"><summary>Фильтры</summary>{filters}</details> : filters}
      </div>
      {selectedVisible && <RegulationDetails regulation={selected} region={region} onClose={() => update('item', '')} />}
      {selected && !selectedVisible && <p className="regulation-region-empty">Выбранный материал не относится к текущему региону.</p>}
      {params.has('item') && !selected && <p className="regulation-region-empty">Нормативный материал не найден.</p>}
      <p className="catalog-count" role="status">Найдено: {filtered.length} · {region === 'moscow' ? 'Москва' : 'Регионы'}</p>
      {categories.map(category => {
        const entries = filtered.filter(regulation => regulation.categoryId === category.id)
        if (!entries.length && (query || type || stage)) return null
        if (!entries.length) return <details className="regulation-category regulation-category--empty" key={category.id}><summary>{category.title}</summary><p className="regulation-category-empty">Материалы категории пока не добавлены.</p></details>
        return <section className="regulation-category" key={category.id} aria-labelledby={`regulation-category-${category.id}`}>
          <h2 id={`regulation-category-${category.id}`}>{category.title}</h2>
          {entries.length ? <ul className="catalog-grid">{entries.map(regulation => <RegulationCard key={regulation.id} regulation={regulation} region={region} search={params.toString()} />)}</ul> : <p className="regulation-category-empty">Материалы категории пока не добавлены.</p>}
        </section>
      })}
      {!filtered.length && <div className="catalog-empty"><h2>Нормативные материалы не найдены</h2><p>Попробуйте изменить поисковый запрос или фильтры.</p><button type="button" className="catalog-reset" onClick={reset}>Сбросить фильтры</button></div>}
    </div>
  </section>
}
