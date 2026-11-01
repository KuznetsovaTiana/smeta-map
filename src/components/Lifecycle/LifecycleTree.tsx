import { useId, useState } from 'react'
import { FileText, Layers, ListTree, Minus, Plus } from 'lucide-react'
import type { NodeRef } from '../../types/lifecycle.ts'
import type { ContentRepository, DocumentPositionSummary, NodeContent } from '../../services/contentRepository.ts'
import { useNodeContent } from '../../hooks/useNodeContent'
import { useDocument } from '../../hooks/useDocument'
import { QueryFeedback } from './QueryFeedback'
import { ContentStatus } from './ContentStatus'
import { MaterialList } from './MaterialList'

interface TreeContext {
  regionId: string
  repository?: ContentRepository
  initialOpen?: readonly string[]
}

/** Each mounted branch owns its disclosure; siblings never replace one another. */
function NodeBranch({ owner, title, ...context }: TreeContext & { owner: NodeRef; title: string }) {
  const [open, setOpen] = useState(context.initialOpen?.includes(owner.id) ?? false)
  const id = useId()
  const Icon = owner.kind === 'block' ? Layers : ListTree
  return <li className={`lifecycle-tree-branch lifecycle-tree-branch--${owner.kind}`} data-node-id={owner.id} data-open={open}>
    <button type="button" className="lifecycle-tree-trigger" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <Icon size={18} aria-hidden="true" /><span><small>{owner.kind === 'block' ? 'Блок' : 'Операция'}</small><strong>{title}</strong></span>
      {open ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
    </button>
    {open && <div id={id} className="lifecycle-tree-nested"><LifecycleTree owner={owner} {...context} /></div>}
  </li>
}

function DocumentMaterials({ documentId, regionId, repository }: TreeContext & { documentId: string }) {
  const state = useDocument(documentId, regionId, repository)
  return <><QueryFeedback state={state} regionId={regionId} />{state.status === 'success' && <MaterialList materials={state.data.materials} types={state.data.materialTypes} />}</>
}

function DocumentBranch({ summary, ...context }: TreeContext & { summary: DocumentPositionSummary }) {
  const [open, setOpen] = useState(context.initialOpen?.includes(summary.document.id) ?? false)
  const id = useId()
  return <li className="lifecycle-tree-branch lifecycle-tree-branch--document" data-document-id={summary.document.id} data-open={open}>
    <button type="button" className="lifecycle-tree-trigger" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <FileText size={18} aria-hidden="true" /><span><small>{summary.typeTitle ?? 'Тип документа не указан'}</small><strong>{summary.document.title}</strong>
        <span className="lifecycle-tree-document-meta"><ContentStatus availability={summary.availability} /><span>Материалов: {summary.availability.counts.totalMaterials} · доступно: {summary.availability.counts.availableMaterials}</span></span>
      </span>{open ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
    </button>
    {open && <div id={id} className="lifecycle-tree-nested">{summary.document.description && <p>{summary.document.description}</p>}<DocumentMaterials documentId={summary.document.id} {...context} /></div>}
  </li>
}

/** Presentation consumes repository summaries, never source catalogs or descendant documents. */
export function LifecycleTreeContent({ content, ...context }: TreeContext & { content: NodeContent }) {
  return <div className="lifecycle-tree-content">
    {content.node.data.description && <p>{content.node.data.description}</p>}
    {content.children.length > 0 && <ul className="lifecycle-tree-level" aria-label="Структура раздела">{content.children.map(child =>
      <NodeBranch key={`${child.kind}:${child.data.id}`} owner={{ kind: child.kind, id: child.data.id }} title={child.data.title} {...context} />)}</ul>}
    {content.documentSummaries.length > 0 && <ul className="lifecycle-tree-level lifecycle-tree-documents" aria-label="Документные позиции">{content.documentSummaries.map(summary =>
      <DocumentBranch key={summary.document.id} summary={summary} {...context} />)}</ul>}
    {content.definition === 'not-defined' && <p className="lifecycle-tree-empty" role="status">Состав документов и материалов ещё не определён.</p>}
    {content.definition === 'defined' && !content.children.length && !content.documents.length && <p className="lifecycle-tree-empty" role="status">Документы на этом уровне не размещены.</p>}
  </div>
}

export function LifecycleTree({ owner, ...context }: TreeContext & { owner: NodeRef }) {
  const state = useNodeContent(owner, context.regionId, context.repository)
  return <><QueryFeedback state={state} regionId={context.regionId} />{state.status === 'success' && <LifecycleTreeContent content={state.data} {...context} />}</>
}
