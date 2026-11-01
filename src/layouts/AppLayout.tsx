import { getRegion } from '../utils/routing'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from '../components/Header/Header'

export function AppLayout() {
  const [params] = useSearchParams()
  const location = useLocation()
  const region = getRegion(params)
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, region])
  return <div className="app-layout" data-region={getRegion(params)}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Перейти к содержимому</a>
    <Header />
    <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
    <footer className="footer"><span className="footer-credit">made by Кильдеева Татьяна Игоревна</span></footer>
  </div>
}
