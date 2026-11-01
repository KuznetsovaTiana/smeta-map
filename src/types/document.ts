import type { NodeRef } from './lifecycle.ts'

export interface DocumentPosition {
  id: string
  regionId: string
  owner: NodeRef
  order: number
  title: string
  documentTypeId?: string
  description?: string
  abbreviations?: string[]
  tags?: string[]
  updatedAt?: string
  responsible?: string
}

export interface Material {
  id: string
  documentId: string
  order: number
  title: string
  /** Открытый справочник, новые типы не требуют изменения компонентов. */
  typeId: string
  description?: string
  url?: string
  format?: string
  /** Результат внешней проверки; отсутствие означает, что доступ не подтверждён. */
  linkCheck?: 'unchecked' | 'working' | 'broken'
}

export interface MaterialType {
  id: string
  title: string
  iconKey?: string
}

export interface DocumentType {
  id: string
  title: string
}
