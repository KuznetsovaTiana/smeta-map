import type { Material } from '../types/document.ts'

/** Допустимый адрес, а не гарантия прав доступа к удалённому файлу. */
export function getMaterialHref(material: Pick<Material, 'url' | 'linkCheck'>): string | null {
  if (material.linkCheck === 'broken') return null
  if (typeof material.url !== 'string') return null
  const value = material.url.trim()
  if (!value || /\s/.test(value)) return null
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (['example.com', 'example.org', 'example.net', 'localhost'].some(name => host === name || host.endsWith(`.${name}`))) return null
    if (/(\.\.\.|…|\{[^}]*\}|<[^>]*>)/.test(decodeURIComponent(value))) return null
    return url.href
  } catch { return null }
}
