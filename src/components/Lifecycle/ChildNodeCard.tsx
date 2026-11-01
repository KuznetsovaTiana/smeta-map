import { Link } from 'react-router-dom'
import type { ChildContentSummary, ContentNode } from '../../services/contentRepository.ts'
import { nodePath, regionalLocation } from '../../utils/contentRoutes.ts'
import { ContentStatus } from './ContentStatus'

export function ChildNodeCard({ summary, chain, regionId }: { summary: ChildContentSummary; chain: ContentNode[]; regionId: string }) {
  const { node, availability, childCount } = summary
  return <Link className={`lifecycle-card node-card node-card--${node.kind}`} to={regionalLocation(nodePath([...chain, node]), regionId)}>
    <span className="node-card-number">{String(node.data.order).padStart(2, '0')}</span>
    <div className="node-card-body"><h3 className="node-card-title">{node.data.title}</h3>
      {node.data.shortDescription && <p className="node-card-description">{node.data.shortDescription}</p>}
      <div className="node-card-metadata">
        {childCount > 0 && <span>Дочерних элементов: <strong>{childCount}</strong></span>}
        {availability.status !== 'not-defined' && <span>Документных позиций на этом уровне: <strong>{availability.counts.documents}</strong></span>}
        <ContentStatus availability={availability} />
      </div>
    </div>
    <svg className="node-card-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
  </Link>
}
