import type { Material } from '../types/document.ts'

/** Допустимый адрес, а не гарантия прав доступа к удалённому файлу. */
export function getMaterialHref(material: Pick<Material, 'url' | 'linkCheck'>): string | null {
  if (material.linkCheck === 'broken') return null
  if (typeof material.url !== 'string') return null
  const value = material.url.trim()
  if (!value || /\s/.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (!['disk.yandex.ru', 'yadi.sk'].includes(host) || url.pathname === '/') return null
    if (/(\.\.\.|…|\{[^}]*\}|<[^>]*>)/.test(decodeURIComponent(value))) return null
    return url.href
  } catch { return null }
}
