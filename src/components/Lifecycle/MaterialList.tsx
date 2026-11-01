import type { Material, MaterialType } from '../../types/document.ts'
import { getMaterialHref } from '../../utils/materialLinks.ts'

export function MaterialList({ materials, types }: { materials: Material[]; types: MaterialType[] }) {
  if (!materials.length) return <p className="lifecycle-status">Материалы пока не добавлены. Файлы и ссылки отсутствуют.</p>
  return <ul className="lifecycle-materials">{materials.map(material => {
    const href = getMaterialHref(material)
    return <li key={material.id} id={`material-${material.id}`}>
      <h3>{material.title}</h3>
      <p>{types.find(type => type.id === material.typeId)?.title ?? 'Материал'}{material.format ? ` · ${material.format}` : ''}</p>
      {material.description && <p>{material.description}</p>}
      {href ? <a href={href} target="_blank" rel="noopener noreferrer">Открыть: {material.title}<span className="lifecycle-material-url">{href}</span></a> : <p>Файл пока отсутствует или ссылка недоступна.</p>}
    </li>
  })}</ul>
}
