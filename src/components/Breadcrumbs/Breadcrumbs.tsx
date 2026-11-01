import { Link } from 'react-router-dom'
import type { ContentNode } from '../../services/contentRepository.ts'
import { documentPath, nodePath, regionalLocation } from '../../utils/contentRoutes.ts'

interface Props {
  chain: ContentNode[]
  regionId: string
  document?: { id: string; title: string }
}

export function Breadcrumbs({ chain, regionId, document }: Props) {
  return <nav className="lifecycle-breadcrumbs" aria-label="Навигационная цепочка"><ol>
    <li><Link to={regionalLocation('/schema', regionId)}>Главная</Link></li>
    {chain.map((node, index) => <li key={`${node.kind}:${node.data.id}`}>
      <Link to={regionalLocation(nodePath(chain.slice(0, index + 1)), regionId)} aria-current={!document && index === chain.length - 1 ? 'page' : undefined}>{node.data.title}</Link>
    </li>)}
    {document && <li><Link to={regionalLocation(documentPath(chain, document.id), regionId)} aria-current="page">{document.title}</Link></li>}
  </ol></nav>
}
