import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { stages } from '../../data/stages'
import { items } from '../../data/items'
import { searchProcess } from '../../utils/search'
import type { SearchResult } from '../../utils/search'
import { searchRegulations } from '../../utils/regulations'
import { getRegion } from '../../utils/routing'
import './Search.css'

export function Search() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const listId = `${id}-results`
  const region = getRegion(params)
  const results = useMemo(() => [...searchProcess(query, stages, items), ...searchRegulations(query, region)], [query, region])
  const expanded = open && query.trim().length > 0
  const active = expanded && activeIndex >= 0 ? results[activeIndex] : undefined
  const activeId = active?.id

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])

  useEffect(() => {
    const option = activeId ? document.getElementById(`${id}-${activeId}`) : null
    const list = option?.parentElement
    if (option && list) {
      if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight
    }
  }, [activeId, id])

  function choose(result: SearchResult) {
    const next = new URLSearchParams({ region: getRegion(params) })
    if (result.regulationId) {
      next.set('item', result.regulationId)
      navigate({ pathname: '/regulations', search: `?${next}` })
      setQuery(''); setOpen(false); setActiveIndex(-1)
      return
    }
    if (result.stageId) next.set('stage', result.stageId)
    if (result.itemId) next.set('item', result.itemId)
    next.set('mode', result.layerId ? 'detailed' : params.get('mode') === 'detailed' ? 'detailed' : 'overview')
    navigate({ pathname: '/schema', search: `?${next}` }, { state: { fromSearch: true } })
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActiveIndex(-1) }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (results.length) setActiveIndex(current => event.key === 'ArrowDown' ? (current + 1) % results.length : current <= 0 || current >= results.length ? results.length - 1 : current - 1)
    }
    if (event.key === 'Enter' && expanded && results.length) {
      event.preventDefault()
      choose(active ?? results[0])
    }
  }

  return (
    <div className="search" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
      <label className="visually-hidden" htmlFor={id}>Поиск по документам и этапам</label>
      <input id={id} ref={input} type="search" role="combobox" autoComplete="off" placeholder="Поиск по документам и этапам…"
        value={query} aria-expanded={expanded} aria-controls={expanded && results.length ? listId : undefined} aria-autocomplete="list"
        aria-activedescendant={active ? `${id}-${active.id}` : undefined}
        onChange={event => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true) }}
        onFocus={() => setOpen(true)} onKeyDown={onKeyDown} />
      {query && <button type="button" className="search-clear" aria-label="Очистить поиск" onClick={() => { setQuery(''); setOpen(false); setActiveIndex(-1); input.current?.focus() }}>×</button>}
      {expanded && <div className="search-dropdown" key={location.key}>
        {results.length ? <ul className="search-results" id={listId} role="listbox" aria-label="Результаты поиска">
          {results.map((result, index) => <li id={`${id}-${result.id}`} key={result.id} role="option" aria-selected={activeIndex === index}
            className="search-result" onPointerDown={event => event.preventDefault()} onMouseMove={() => setActiveIndex(index)} onClick={() => choose(result)}>
            <span className="search-result-heading">{result.title}{result.abbreviation && <small>{result.abbreviation}</small>}</span>
            <span className="search-result-meta">{result.kind} · {result.stageTitle}</span>
          </li>)}
        </ul> : <p className="search-empty" role="status">Ничего не найдено</p>}
      </div>}
    </div>
  )
}

