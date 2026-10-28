import { useSearchParams } from 'react-router-dom'
import { PageIntro } from '../../components/PageIntro/PageIntro'
import { stages } from '../../data/stages'
import { items } from '../../data/items'
import { getRegion } from '../../utils/routing'
import { documentCategories, getCatalogDocuments } from '../../utils/documentCatalog'
import { useValidFilters } from '../../utils/useValidFilters'
import { useMobileLayout } from '../../utils/useMobileLayout'
import { DocumentCatalogCard } from './DocumentCatalogCard'
import './DocumentsPage.css'

export function DocumentsPage() {
  const [params, setParams] = useSearchParams()
  useValidFilters(stages.map(stage => stage.id), documentCategories.map(type => type.id))
  const region = getRegion(params)
  const query = params.get('q') ?? ''
  const stage = params.get('stage') ?? ''
  const category = params.get('type') ?? ''
  const mobile = useMobileLayout()
  const documents = getCatalogDocuments(items, stages, { query, stage, category })

  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace })
  }
  function reset() {
    const next = new URLSearchParams(params)
    for (const key of ['q', 'stage', 'type']) next.delete(key)
    setParams(next)
  }

  const filters = <div className="catalog-filter-fields">
    <label>Этап<select aria-label="Этап" value={stage} onChange={event => update('stage', event.target.value)}>
      <option value="">Все этапы</option>
      {stages.map(stage => <option value={stage.id} key={stage.id}>{stage.order}. {stage.title}</option>)}
    </select></label>
    <label>Тип<select aria-label="Тип" value={category} onChange={event => update('type', event.target.value)}>
      <option value="">Все</option>
      {documentCategories.map(category => <option value={category.id} key={category.id}>{category.title}</option>)}
    </select></label>
    <button type="button" className="catalog-reset" onClick={reset}>Сбросить фильтры</button>
  </div>

  return <section>
    <PageIntro number="02" title="Документы" description="Единый справочник документов и элементов процесса. Выберите материал, чтобы открыть его карточку на схеме." />
    <div className="document-catalog">
      <div className="catalog-controls">
        <label className="catalog-search">Поиск в документах<input type="search" value={query} placeholder="Название, сокращение или описание…" onChange={event => update('q', event.target.value, true)} /></label>
        {mobile ? <details className="catalog-filter-toggle"><summary>Фильтры{stage || category ? ' · применены' : ''}</summary>{filters}</details> : filters}
      </div>
      <p className="catalog-count" role="status">Найдено: {documents.length} · Материалы: {region === 'moscow' ? 'Москва' : 'Регионы'}</p>
      {documents.length ? <ul className="catalog-grid">{documents.map(item => <DocumentCatalogCard item={item} region={region} key={item.id} />)}</ul> : <div className="catalog-empty">
        <h2>Документы не найдены</h2><p>Попробуйте изменить поисковый запрос или фильтры.</p>
        <button type="button" className="catalog-reset" onClick={reset}>Сбросить фильтры</button>
      </div>}
    </div>
  </section>
}
