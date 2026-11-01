import { Link } from 'react-router-dom'
import type { ContentNode, DocumentPositionSummary } from '../../services/contentRepository.ts'
import { documentPath, regionalLocation } from '../../utils/contentRoutes.ts'
import { ContentStatus } from './ContentStatus'

export function DocumentPositionCard({ summary, chain, regionId }: { summary: DocumentPositionSummary; chain: ContentNode[]; regionId: string }) {
  const { document, availability } = summary
  return <Link className="lifecycle-card node-document-card" data-document-id={document.id} to={regionalLocation(documentPath(chain, document.id), regionId)}>
    <span className="node-document-top"><span className="node-document-number">{String(document.order).padStart(2, '0')}</span>{summary.typeTitle && <span className="node-document-type">{summary.typeTitle}</span>}</span>
    <h3>{document.title}</h3>{document.description && <p>{document.description}</p>}
    <ContentStatus availability={availability} />
    <span className="node-document-materials">Доступно материалов: <strong>{availability.counts.availableMaterials}</strong> из {availability.counts.totalMaterials}</span>
    <span className="node-document-action">Карточка документа <span aria-hidden="true">↗</span></span>
  </Link>
}
