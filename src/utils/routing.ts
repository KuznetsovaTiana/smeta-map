import type { Region } from '../types/region'

export function getRegion(params: URLSearchParams): Region {
  return params.get('region') === 'regions' ? 'regions' : 'moscow'
}

export function getRegionSearch(region: Region): string {
  return `?${new URLSearchParams({ region })}`
}
