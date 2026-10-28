import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { SchemaPage } from './pages/SchemaPage/SchemaPage'
import { DocumentsPage } from './pages/DocumentsPage/DocumentsPage'
import { RegulationsPage } from './pages/RegulationsPage/RegulationsPage'

function SchemaRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/schema', search }} replace />
}

export default function App() {
  return <HashRouter><Routes><Route element={<AppLayout />}>
    <Route index element={<SchemaRedirect />} />
    <Route path="schema" element={<SchemaPage />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="regulations" element={<RegulationsPage />} />
    <Route path="*" element={<section><h1>Страница не найдена</h1><p>Выберите раздел в верхнем меню.</p></section>} />
  </Route></Routes></HashRouter>
}
