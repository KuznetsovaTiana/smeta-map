import { resources } from '../data/resources'
import type { Resource } from '../types/process'
import type { Region } from '../types/region'

export interface ResourceRepository {
  getByItem(itemId: string, region: Region): Promise<Resource[]>
}

/** Здесь статический источник можно заменить API, сохранив контракт для UI. */
export const resourceRepository: ResourceRepository = {
  async getByItem(itemId, region) {
    return getResourcesForItem(itemId, region)
  },
}

export function getResourcesForItem(itemId: string, region: Region): Resource[] {
  return resources[itemId]?.[region] ?? []
}
