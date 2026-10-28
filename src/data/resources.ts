import { regulations } from './regulations'
import type { ItemResources, Resource } from '../types/process'

function placeholders(itemId: string, label: string, region: 'moscow' | 'regions'): Resource[] {
  const territory = region === 'moscow' ? 'Москвы' : 'регионов'
  return [
    { id: `${itemId}-${region}-example`, title: `Пример ${label} для ${territory}`, type: 'example', description: 'Образец заполнения. Файл пока не добавлен.', url: '#', source: 'google-drive' },
    { id: `${itemId}-${region}-template`, title: `Шаблон ${label} для ${territory}`, type: 'template', description: 'Форма для заполнения. Файл пока не добавлен.', url: '#', source: 'google-drive' },
    { id: `${itemId}-${region}-regulation`, title: `Нормативная база: ${label} для ${territory}`, type: 'regulation', description: 'Ссылка на нормативный материал пока не добавлена.', url: '#', source: 'external' },
  ]
}

/** Независимые наборы материалов каждого элемента для двух территорий. */
export const resources: ItemResources = Object.fromEntries(
  [['vor', 'ВОР'], ['lsr', 'ЛСР'], ['osr', 'ОСР'], ['ssrss', 'ССРСС'], ['ks-2', 'КС-2']].map(([id, label]) => [id, {
    moscow: placeholders(id, label, 'moscow'),
    regions: placeholders(id, label, 'regions'),
  }]),
)


// Ссылки нормативных карточек используют тот же каталог ресурсов.

for (const regulation of regulations) {
  resources[regulation.id] = { moscow: [], regions: [] }
  for (const region of regulation.regions ?? ['moscow', 'regions'] as const) {
    resources[regulation.id]![region] = [{ id: regulation.id + '-' + region + '-material', title: 'Материал: ' + (regulation.shortTitle ?? regulation.title), type: 'regulation', url: '#', source: 'external', description: 'Ссылка пока не добавлена.' }]
  }
}
