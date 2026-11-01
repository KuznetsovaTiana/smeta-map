/** Ссылки размечены типом: одинаковые названия П и Р не объединяют узлы. */
export type NodeRef =
  | { kind: 'process'; id: string }
  | { kind: 'block'; id: string }
  | { kind: 'operation'; id: string }

export interface StructuralFields {
  id: string
  order: number
  title: string
  shortDescription?: string
  description?: string
  abbreviations?: string[]
  keywords?: string[]
}

export interface Process extends StructuralFields {
  iconKey?: string
}

export interface Block extends StructuralFields {
  processId: string
}

export interface Operation extends StructuralFields {
  parent: Exclude<NodeRef, { kind: 'operation' }>
}

export interface LifecycleStructure {
  processes: Process[]
  blocks: Block[]
  operations: Operation[]
}
