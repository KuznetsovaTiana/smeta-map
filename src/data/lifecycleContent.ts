import type { ContentSnapshot } from '../types/catalog.ts'
import { processes } from './lifecycle/processes.ts'
import { blocks } from './lifecycle/blocks.ts'
import { operations } from './lifecycle/operations.ts'
import { regions } from './catalogs/regions.ts'
import { materialTypes } from './catalogs/materialTypes.ts'
import { documentTypes } from './catalogs/documentTypes.ts'
import { nodeContent as moscowNodeContent } from './regions/moscow/nodeContent.ts'
import { documents as moscowDocuments } from './regions/moscow/documents.ts'
import { materials as moscowMaterials } from './regions/moscow/materials.ts'
import { nodeContent as regionalNodeContent } from './regions/regions/nodeContent.ts'
import { documents as regionalDocuments } from './regions/regions/documents.ts'
import { materials as regionalMaterials } from './regions/regions/materials.ts'
import { supplementalDocuments as moscowSupplementalDocuments } from './regions/moscow/supplementalDocuments.ts'
import { supplementalDocuments as regionalSupplementalDocuments } from './regions/regions/supplementalDocuments.ts'

/** Снимок для проверки данных. Пока не подключается к UI или старому репозиторию. */
export const lifecycleContent: ContentSnapshot = {
  processes,
  blocks,
  operations,
  regions,
  materialTypes,
  documentTypes,
  catalogs: [
    { regionId: 'moscow', nodeContent: moscowNodeContent, documents: [...moscowDocuments, ...moscowSupplementalDocuments], materials: moscowMaterials },
    { regionId: 'regions', nodeContent: regionalNodeContent, documents: [...regionalDocuments, ...regionalSupplementalDocuments], materials: regionalMaterials },
  ],
}

