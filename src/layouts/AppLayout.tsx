import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header/Header'

export function AppLayout() {
  return <div className="app-layout">
    <a className="skip-link" href="#main-content">Перейти к содержимому</a>
    <Header />
    <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
    <footer className="footer"><span>Сметное дело · Учебные материалы</span><span>Этапы / документы / нормативы</span></footer>
  </div>
}
