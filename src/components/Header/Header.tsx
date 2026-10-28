import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { RegionSwitch } from '../RegionSwitch/RegionSwitch'
import { Search } from '../Search/Search'
import { getRegion, getRegionSearch } from '../../utils/routing'

const navigation = [
  { path: '/schema', label: 'Схема' },
  { path: '/documents', label: 'Документы' },
  { path: '/regulations', label: 'Нормативная база' },
]

export function Header() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigationParams = new URLSearchParams(getRegionSearch(getRegion(params)))
  if (params.has('mode')) navigationParams.set('mode', params.get('mode') === 'detailed' ? 'detailed' : 'overview')
  const search = `?${navigationParams}`
  return <header className="header"><div className="header-inner">
    <nav className="navigation" aria-label="Основная навигация">
      {navigation.map(({ path, label }) => <NavLink key={path} to={{ pathname: path, search: location.pathname === path ? location.search : search }} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>{label}</NavLink>)}
    </nav>
    <div className="header-tools"><RegionSwitch /><Search /></div>
  </div></header>
}
