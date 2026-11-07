import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { lifecycleContent } from '../src/data/lifecycleContent.ts'
import { getRegionalMaterialHref } from '../src/utils/contentAvailability.ts'
import { getResourceHref } from '../src/utils/resourceLinks.ts'
import { referenceMaterials as moscowReferences } from '../src/data/regions/moscow/referenceMaterials.ts'
import { referenceMaterials as regionalReferences } from '../src/data/regions/regions/referenceMaterials.ts'

interface InventoryEntry { path: string; type: string; resource_id: string }
interface PreviewCheck { path: string; previewVerified: boolean; resourceId: string; previewResourceId: string; url: string }
const inventory: InventoryEntry[] = JSON.parse(readFileSync(new URL('../docs/yandex-disk-inventory.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''))
const checks: PreviewCheck[] = JSON.parse(readFileSync(new URL('../docs/yandex-link-checks.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''))
const operationFolders: Record<string, string> = {
  'source-data': '01_Сбор и анализ исходных данных',
  vor: '02_ВОР',
  'local-estimate-calculation': '03_Локальный сметный расчёт',
  'local-estimate': '03_Локальная смета',
  'market-analysis': '04_Конъюнктурный анализ цен',
  'object-estimate-calculation': '05_Объектный сметный расчёт',
  'consolidated-estimate': '06_Сводный сметный расчёт',
}

test('100 привязок ведут на проверенный просмотр точного файла, без повторов и смешения регионов', () => {
  const urls = new Set<string>()
  const ids = new Set<string>()
  for (const catalog of lifecycleContent.catalogs) {
    assert.equal(catalog.materials.length, catalog.regionId === 'moscow' ? 13 : 83)
    const references = catalog.regionId === 'moscow' ? moscowReferences : regionalReferences
    assert.equal(references.length, 2)
    const entries = [...catalog.materials, ...references.map(resource => ({ ...resource, documentId: null }))]
    for (const material of entries) {
      const href = material.documentId === null ? getResourceHref(material.url) : getRegionalMaterialHref(lifecycleContent, material.id, catalog.regionId)
      assert.ok(href)
      const url = new URL(href)
      assert.equal(url.origin, 'https://disk.yandex.ru')
      assert.equal(url.search, '')
      assert.equal(url.hash, '')
      const path = decodeURIComponent(url.pathname.replace('/d/OAUtZcIwS94DDg', ''))
      assert.ok(path.startsWith(catalog.regionId === 'moscow' ? '/01_Москва/' : '/02_Регионы/'))
      const file = inventory.find(item => item.path === path)
      assert.ok(file && file.type === 'file')
      assert.ok(material.id.endsWith(file.resource_id.split(':')[1]))
      const checked = checks.find(check => check.path === path)
      assert.ok(checked?.previewVerified)
      assert.equal(checked.resourceId, checked.previewResourceId)
      assert.equal(checked.url, href)
      assert.equal(getRegionalMaterialHref(lifecycleContent, material.id, catalog.regionId === 'moscow' ? 'regions' : 'moscow'), null)
      assert.ok(!urls.has(href), `Повторная привязка ${href}`)
      assert.ok(!ids.has(material.id))
      urls.add(href); ids.add(material.id)
      if (material.documentId === null) {
        assert.ok(path.includes('/Нормативно-техническая документация/'))
        continue
      }
      const document = catalog.documents.find(doc => doc.id === material.documentId)
      assert.ok(document)
      // Check the complete process context, including П versus Р.
      if (document.owner.id.startsWith('design-p-')) assert.ok(path.includes('/03_Проектная стадия/01_Стадия П/'))
      if (document.owner.id.startsWith('design-r-')) assert.ok(path.includes('/03_Проектная стадия/02_Стадия Р/'))
      if (/^design-[pr]-/.test(document.owner.id)) {
        const suffix = document.owner.id.replace(/^design-[pr]-/, '')
        assert.ok(path.includes(`/${operationFolders[suffix]}/`), document.id)
      }
      if (document.owner.id.startsWith('capital-repair-')) assert.ok(path.includes('/05_Эксплуатация, ремонт и реконструкция/01_Капитальный ремонт/'))
    }
  }
})

test('все 100 файлов подключены; фактическая папка определяет назначение', () => {
  assert.equal(inventory.filter(item => item.type === 'dir').length, 135)
  assert.equal(inventory.filter(item => item.type === 'file').length, 100)
  assert.equal(checks.length, 100)
  assert.ok(checks.every(check => check.previewVerified && check.resourceId === check.previewResourceId))
  const all = [...lifecycleContent.catalogs.flatMap(catalog => catalog.materials), ...moscowReferences, ...regionalReferences]
  assert.equal(all.length, 100)
  assert.deepEqual(new Set(all.map(material => material.url)), new Set(checks.map(check => check.url)))
  const unfilled = lifecycleContent.catalogs.flatMap(catalog => catalog.documents.filter(document => !catalog.materials.some(material => material.documentId === document.id)))
  assert.equal(unfilled.length, 60)
  const regional = lifecycleContent.catalogs.find(catalog => catalog.regionId === 'regions')!
  for (const [name, documentId] of [
    ['Приказ _ВОР_Москва.pdf', 'regions-design-p-vor-document'],
    ['Шаблон_ТСН Смета.xls', 'regions-design-p-local-estimate-calculation-document'],
    ['Модуль 9.docx', 'regions-as-built-estimate-materials-document'],
    ['Модуль 9. Приложение 1.pdf', 'regions-as-built-estimate-materials-document'],
    ['Модуль 15.docx', 'regions-design-r-local-estimate-document'],
  ]) {
    assert.equal(regional.materials.find(material => material.title === name)?.documentId, documentId)
  }
})
