"""Explicit, preparation-only mapping of the audited inventory to existing nodes.

Run after check-yandex-links.py; this script never makes network requests.
"""
import json
import pathlib
import urllib.parse

BASE = pathlib.Path('src/data/regions')
ROOT = 'https://disk.yandex.ru/d/LiLSJN83d9vs6Q'
items = json.loads(pathlib.Path('docs/yandex-disk-inventory.json').read_text(encoding='utf-8-sig'))
checks = {row['path']: row for row in json.loads(pathlib.Path('docs/yandex-link-checks.json').read_text(encoding='utf-8-sig'))}


def verified_url(item):
    url = ROOT + urllib.parse.quote(item['path'], safe='/')
    check = checks.get(item['path'])
    resource_id = item['resource_id'].split(':', 1)[1]
    if not check or not check['previewVerified'] or check['url'] != url or check['resourceId'] != resource_id or check['previewResourceId'] != resource_id:
        raise ValueError(f"Unverified file preview: {item['path']}")
    return url

# Each rule uses the territory AND complete process/block/operation folder chain.
# No fuzzy filename matching, no fallback between territories, no folder links.
stage_operations = {
    '01_Сбор и анализ исходных данных': ('source-data', 'Учебные материалы: сбор и анализ исходных данных'),
    '02_ВОР': ('vor', None),
    '03_Локальный сметный расчёт': ('local-estimate-calculation', None),
    '03_Локальная смета': ('local-estimate', None),
    '04_Конъюнктурный анализ цен': ('market-analysis', 'Учебные материалы: конъюнктурный анализ цен'),
    '05_Объектный сметный расчёт': ('object-estimate-calculation', None),
    '06_Сводный сметный расчёт': ('consolidated-estimate', None),
}
block_folders = {
    ('01_Предпроектная стадия', '01_НЦС'): ('ncs', 'Учебные материалы по НЦС'),
    ('03_Проектная стадия', '03_Исполнительная смета'): ('as-built-estimate', 'Учебные материалы: исполнительная смета'),
    ('03_Проектная стадия', '04_Проверка достоверности сметной стоимости'): ('estimate-expertise', 'Учебные материалы по проверке достоверности сметной стоимости'),
    ('04_Стадия строительства', '01_НМЦК'): ('nmck', 'Учебные материалы по НМЦК'),
}


def destination(parts):
    process, folder = parts[1:3]
    if process == '02_Инженерные изыскания и проектные работы':
        # The source has a spelling mistake in the regional folder. Preserve it.
        if folder not in ['Сметы на проектные и изыскательские работы', 'Сметы на проектные и изыскательсике работы']:
            return None
        if parts[-1].startswith('Практическое задание № 1.'):
            return 'block', 'engineering-surveys', 'Практическое задание: расчёт стоимости изысканий'
        if parts[-1].startswith('Практическое задание № 2.'):
            return 'block', 'design-works', 'Практическое задание: расчёт стоимости проектных работ'
        # Joint PIR course belongs to the existing common process, not to both blocks.
        return 'process', 'surveys-and-design', 'Учебные материалы по проектным и изыскательским работам'
    if process == '01_Предпроектная стадия' and len(parts) == 3:
        return 'process', 'pre-design', 'Учебные материалы по предпроектной стадии'
    if (process, folder) in block_folders:
        owner, title = block_folders[process, folder]
        return 'block', owner, title
    if process == '03_Проектная стадия' and folder in ['01_Стадия П', '02_Стадия Р']:
        suffix, title = stage_operations[parts[3]]
        stage = 'p' if folder == '01_Стадия П' else 'r'
        return 'operation', f'design-{stage}-{suffix}', title
    if parts[1:4] == ['05_Эксплуатация, ремонт и реконструкция', '01_Капитальный ремонт', '04_Локальная смета']:
        return 'operation', 'capital-repair-local-estimate', None
    return None


unmapped = []
for region, folder in [('moscow', '01_Москва'), ('regions', '02_Регионы')]:
    documents = []
    materials = []
    references = []
    orders = {}
    for item in items:
        if item['type'] != 'file' or item['path'].split('/')[1] != folder:
            continue
        parts = item['path'].lstrip('/').split('/')
        # User-confirmed rule: the actual folder determines the destination,
        # including files whose names or content previously seemed ambiguous.
        if parts[1] == 'Нормативно-техническая документация':
            references.append(dict(id=f"{region}-disk-{item['resource_id'].split(':')[1]}",
                                   title=item['name'], type='methodology' if item['name'].endswith('.docx') else 'instruction',
                                   url=verified_url(item), source='external'))
            continue
        match = destination(parts)
        if not match:
            unmapped.append(item['path'])
            continue
        kind, owner, title = match
        document_id = f'{region}-{owner}-' + ('materials-document' if title else 'document')
        if title and not any(doc['id'] == document_id for doc in documents):
            documents.append(dict(id=document_id, regionId=region, owner=dict(kind=kind, id=owner), order=1, title=title))
        orders[document_id] = orders.get(document_id, 0) + 1
        name = item['name']
        material_type = 'template' if 'шаблон' in name.lower() else 'example' if 'пример' in name.lower() else 'regulation' if name.startswith('Приказ ') else 'reference'
        materials.append(dict(id=f"{region}-disk-{item['resource_id'].split(':')[1]}", documentId=document_id,
                              order=orders[document_id], title=name, typeId=material_type,
                              url=verified_url(item), format=name.rsplit('.', 1)[-1].upper(), linkCheck='working'))
    def write(name, type_name, export, rows):
        (BASE / region / name).write_text(f"import type {{ {type_name} }} from '../../../types/document.ts'\n\n"
            + '/** Подготовлено по публичному каталогу; ID и ссылки на конкретные файлы проверены 07.11.2026. */\n'
            + f'export const {export}: {type_name}[] = ' + json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write('materials.ts', 'Material', 'materials', materials)
    write('supplementalDocuments.ts', 'DocumentPosition', 'supplementalDocuments', documents)
    (BASE / region / 'referenceMaterials.ts').write_text(
        "import type { Resource } from '../../../types/process.ts'\n\n"
        + '/** Материалы корневой папки нормативно-технической документации этого режима. */\n'
        + 'export const referenceMaterials: Resource[] = ' + json.dumps(references, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    node_file = BASE / region / 'nodeContent.ts'
    text = node_file.read_text(encoding='utf-8')
    prefix, data = text.split('= ', 1)
    nodes = json.loads(data)
    for node in nodes:
        if node['owner']['id'] == 'as-built-estimate':
            node['definition'] = 'not-defined'
        if any(doc['owner'] == node['owner'] for doc in documents):
            node['definition'] = 'defined'
    node_file.write_text(prefix + '= ' + json.dumps(nodes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(region, len(materials) + len(references), 'links;', len(documents), 'supplemental document positions')
print('Unmapped:', json.dumps(unmapped, ensure_ascii=False, indent=2))
