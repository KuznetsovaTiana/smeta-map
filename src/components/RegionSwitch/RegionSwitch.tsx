import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getRegion } from '../../utils/routing'
import type { Region } from '../../types/region'
import { regionChangePath } from '../../utils/contentRoutes'

export function RegionSwitch() {
  const [params, setParams] = useSearchParams()
  const region = getRegion(params)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const value = params.get('region')
    if (value && !['moscow', 'regions'].includes(value)) {
      const next = new URLSearchParams(params)
      next.set('region', 'moscow'); setParams(next, { replace: true })
    }
  }, [params, setParams])
  function selectRegion(value: Region) {
    const next = new URLSearchParams(params)
    next.set('region', value)
    if (value === region) return
    // Document IDs are regional. Preserve structural selection, never a foreign document.
    next.delete('document')
    next.delete('material')
    const pathname = regionChangePath(location.pathname)
    if (pathname !== location.pathname) {
      next.delete('material')
      navigate({ pathname, search: `?${next}` })
    } else setParams(next)
  }
  return <div className="region-control"><div className="region-switch" role="group" aria-label="Территория строительства">
    <button type="button" aria-pressed={region === 'moscow'} onClick={() => selectRegion('moscow')}>Москва</button>
    <button type="button" aria-pressed={region === 'regions'} onClick={() => selectRegion('regions')}>Регионы</button>
  </div><span className="region-caption">{region === 'moscow' ? 'Московская нормативная база и материалы' : 'Федеральные и региональные материалы'}</span></div>
}
