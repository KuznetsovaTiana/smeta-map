import { regulations, regulationCategories, regulationTypes } from '../data/regulations'
import type { Region } from '../types/region'
import type { Regulation } from '../types/regulation'
import type { SearchResult } from './search'
import { searchScore } from './searchMatching'

export function isRegulationVisible(regulation: Regulation, region: Region) {
  return !regulation.regions?.length || regulation.regions.includes(region)
}

export function getRegulationsForItem(itemId: string, region: Region) {
  return regulations.filter(regulation => regulation.relatedItems.includes(itemId) && isRegulationVisible(regulation, region))
}

export function searchRegulations(query: string, region: Region): SearchResult[] {
  return regulations.filter(regulation => isRegulationVisible(regulation, region)).map(regulation => ({
    regulation,
    score: searchScore(query, regulation.title, regulation.shortTitle, [regulation.documentNumber, regulation.type, regulationTypes.find(type => type.id === regulation.type)?.title, ...(regulation.tags ?? [])]),
  })).filter(entry => entry.score !== null).sort((a, b) => a.score! - b.score!).map(({ regulation }) => ({
    id: `regulation-${regulation.id}`, title: regulation.title, abbreviation: regulation.shortTitle, kind: 'Нормативный документ', regulationId: regulation.id,
    stageTitle: regulationCategories.find(category => category.id === regulation.categoryId)?.title ?? '',
  }))
}
