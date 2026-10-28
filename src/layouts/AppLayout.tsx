import { getRegion } from '../utils/routing'
import { Outlet, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header/Header'

export function AppLayout() {
  const [params] = useSearchParams()
  return <div className="app-layout" data-region={getRegion(params)}>
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <Header />
    <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
    <footer className="footer"><span className="footer-credit">made by Кильдеева Татьяна Игоревна</span></footer>
  </div>
}
