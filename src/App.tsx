import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LifecycleHomePage } from './pages/Lifecycle/LifecycleHomePage'
import { LegacyMapEntry } from './components/Lifecycle/LegacyMapEntry'
import type { ContentRepository } from './services/contentRepository'

function SchemaRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/schema', search }} replace />
}

const nodeRoutes = [
  'schema/processes/:processId',
  'schema/processes/:processId/blocks/:blockId',
  'schema/processes/:processId/operations/:operationId',
  'schema/processes/:processId/blocks/:blockId/operations/:operationId',
]

export function AppRoutes({ repository }: { repository?: ContentRepository }) {
  return <Routes><Route element={<AppLayout />}>
    <Route index element={<SchemaRedirect />} />
    <Route path="schema" element={<LifecycleHomePage repository={repository} />} />
    {nodeRoutes.map(path => <Route key={path} path={path} element={<LegacyMapEntry repository={repository} />} />)}
    {nodeRoutes.map(path => <Route key={`${path}/documents`} path={`${path}/documents/:documentId`} element={<LegacyMapEntry repository={repository} />} />)}
    <Route path="documents" element={<SchemaRedirect />} />
    <Route path="documents/:documentId" element={<LegacyMapEntry repository={repository} />} />
    <Route path="regulations" element={<SchemaRedirect />} />
    <Route path="*" element={<section><h1>Страница не найдена</h1><p>Выберите раздел в верхнем меню.</p></section>} />
  </Route></Routes>
}

export default function App() {
  return <HashRouter><AppRoutes /></HashRouter>
}
