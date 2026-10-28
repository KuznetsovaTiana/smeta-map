import type { ProcessConnection } from '../types/process'
import { stages } from './stages'
import { items } from './items'
import { influenceLayers } from './influenceLayers'
import { relatedConnections } from './relatedItems'

/** Основная последовательность и влияния сквозных факторов. */
export const connections: ProcessConnection[] = stages.flatMap((stage) =>
  stage.next.map((target) => ({
    id: `sequence-${stage.id}-${target}`,
    source: stage.id,
    target,
    type: 'sequence',
  })),
)

for (const layer of influenceLayers) {
  for (const item of items.filter(item => item.layerId === layer.id)) {
    for (const target of layer.stageIds) connections.push({ id: `influence-${item.id}-${target}`, source: item.id, target, type: 'influence' })
  }
}

connections.push(...relatedConnections)
