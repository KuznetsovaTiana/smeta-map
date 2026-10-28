function normalize(value: string) {
  return value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[–—‑−]/g, '-').replace(/\s+/g, ' ').trim()
}

/** Общий алгоритм частичного совпадения для схемы и обоих каталогов. */
export function searchScore(query: string, title: string, abbreviation = '', fields: (string | undefined)[] = []): number | null {
  const normalized = normalize(query)
  if (!normalized) return null
  const text = normalize([title, abbreviation, ...fields].join(' '))
  if (!normalized.split(' ').every(token => text.includes(token))) return null
  const name = normalize(title)
  return normalize(abbreviation) === normalized || name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3
}
