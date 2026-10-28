/** Возвращает только пригодный внешний адрес; пустые и placeholder URL недоступны. */
export function getResourceHref(url?: string): string | null {
  const value = url?.trim()
  if (!value || value.startsWith('#')) return null
  try {
    const parsed = new URL(value)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    if (parsed.username || parsed.password) return null
    if (['example.com', 'example.org', 'example.net', 'localhost'].includes(parsed.hostname)) return null
    if (/(\.\.\.|…|\{[^}]*\}|<[^>]*>)/.test(decodeURIComponent(value))) return null
    return parsed.href
  } catch { return null }
}
