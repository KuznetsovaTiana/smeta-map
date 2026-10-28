import { useEffect, useState } from 'react'
import { resourceRepository } from '../services/resourceRepository'
import type { Resource } from '../types/process'
import type { Region } from '../types/region'

export function useItemResources(itemId: string, region: Region) {
  const key = `${itemId}:${region}`
  const [state, setState] = useState<{ key: string; resources: Resource[]; error: boolean } | null>(null)
  useEffect(() => {
    let active = true
    resourceRepository.getByItem(itemId, region).then(
      resources => { if (active) setState({ key, resources, error: false }) },
      () => { if (active) setState({ key, resources: [], error: true }) },
    )
    return () => { active = false }
  }, [itemId, region, key])
  return { resources: state?.key === key ? state.resources : [], loading: state?.key !== key, error: state?.key === key && state.error }
}
