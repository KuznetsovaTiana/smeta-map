import { Link } from 'react-router-dom'
import type { NodeContent } from '../../services/contentRepository.ts'
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs'
import { nodePath, regionalLocation } from '../../utils/contentRoutes.ts'
import { ChildNodeCard } from './ChildNodeCard'
import { DocumentPositionCard } from './DocumentPositionCard'

export function NodeContentView({ content }: { content: NodeContent }) {
  const chain = [...content.ancestors, content.node]
  const blocks = content.childSummaries.filter(summary => summary.node.kind === 'block')
  const operations = content.childSummaries.filter(summary => summary.node.kind === 'operation')
  const region = content.regionId === 'moscow' ? 'Москва' : 'Регионы'
  const kind = content.node.kind === 'process' ? 'Процесс' : content.node.kind === 'block' ? 'Блок' : 'Операция'
  const hasChildren = content.children.length > 0
  const showDocuments = content.availability.status !== 'no-direct-documents'
  const parentKind = content.ancestors.at(-1)?.kind === 'block' ? 'К блоку' : 'К процессу'
  return <article className={`node-view node-view--${content.node.kind}`}>
    <Breadcrumbs chain={chain} regionId={content.regionId} />
    <Link className="lifecycle-back node-back" to={regionalLocation(nodePath(content.ancestors), content.regionId)}>← {content.ancestors.length ? parentKind : 'На главную карту'}</Link>
    <header className="node-heading">
      <div className="node-heading-body"><p className="eyebrow">{kind} {String(content.node.data.order).padStart(2, '0')} · {region}</p>
        <h1>{content.node.data.title}</h1>
        {content.node.data.shortDescription && <p className="node-description">{content.node.data.shortDescription}</p>}
        {content.node.data.description && <p className="node-description">{content.node.data.description}</p>}
        {content.ancestors.length > 0 && <dl className="node-context">{content.ancestors.map((ancestor, index) => <div key={ancestor.data.id}>
          <dt>{ancestor.kind === 'process' ? 'Процесс' : 'Блок'}</dt><dd><Link to={regionalLocation(nodePath(content.ancestors.slice(0, index + 1)), content.regionId)}>{ancestor.data.title}</Link></dd>
        </div>)}</dl>}
      </div>
    </header>
    <div className={`node-content-layout${hasChildren && showDocuments ? ' node-content-layout--with-children' : ''}`}>
      {hasChildren && <div className="node-structure">
        {blocks.length > 0 && <section aria-label="Внутренние блоки" className="node-section">
          <header className="node-section-heading"><h2>Направления и блоки</h2><span>{String(blocks.length).padStart(2, '0')}</span></header>
          <ul className="node-blocks">{blocks.map(summary => <li key={summary.node.data.id}><ChildNodeCard summary={summary} chain={chain} regionId={content.regionId} /></li>)}</ul>
        </section>}
        {operations.length > 0 && <section aria-label="Операции" className="node-section">
          <header className="node-section-heading"><h2>Операции и элементы</h2><span>{String(operations.length).padStart(2, '0')}</span></header>
          <ol className="lifecycle-operations node-operations">{operations.map(summary => <li key={summary.node.data.id}><ChildNodeCard summary={summary} chain={chain} regionId={content.regionId} /></li>)}</ol>
        </section>}
      </div>}
      {showDocuments && <section aria-label="Документы текущего уровня" className="lifecycle-documents node-direct-documents">
        <header className="node-section-heading"><h2>Документы этого уровня</h2><span>{String(content.documents.length).padStart(2, '0')}</span></header>
        <p className="node-catalog-message" role="status" data-content-status={content.availability.status}>{content.availability.message}</p>
        {hasChildren && <p className="node-catalog-note">Документы дочерних разделов открываются внутри соответствующих блоков и операций.</p>}
        {content.documentSummaries.length > 0 && <ul className="node-document-list">{content.documentSummaries.map(summary => <li key={summary.document.id}>
          <DocumentPositionCard summary={summary} chain={chain} regionId={content.regionId} />
        </li>)}</ul>}
      </section>}
    </div>
  </article>
}
