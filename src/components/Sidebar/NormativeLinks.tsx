import { LibraryBig } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Region } from '../../types/region'
import { getRegulationsForItem } from '../../utils/regulations'

export function NormativeLinks({ itemId, region }: { itemId: string; region: Region }) {
  const regulations = getRegulationsForItem(itemId, region)
  if (!regulations.length) return null
  return <section className="document-materials normative-links" aria-label="Нормативная база">
    <h4><LibraryBig size={18} strokeWidth={1.5} aria-hidden="true" />Нормативная база</h4>
    {regulations.length ? <ul>{regulations.map(regulation => <li key={regulation.id}><Link to={{ pathname: '/regulations', search: `?${new URLSearchParams({ region, item: regulation.id })}` }}>{regulation.shortTitle ?? regulation.title}</Link></li>)}</ul> : <p>Связанные нормативные материалы пока не добавлены.</p>}
  </section>
}
