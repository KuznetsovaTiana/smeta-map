"""Read DOCX text for matching only; temporary download URLs are never saved."""
import concurrent.futures
import io
import json
import pathlib
import subprocess
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile


def fetch(url):
    return subprocess.check_output(['curl.exe' if sys.platform == 'win32' else 'curl', '-fsSL', '--max-time', '30', url])


def inspect(item):
    query = urllib.parse.urlencode({'public_key': 'https://disk.yandex.ru/d/OAUtZcIwS94DDg', 'path': item['path']})
    try:
        address = json.loads(fetch('https://cloud-api.yandex.net/v1/disk/public/resources?' + query))['file']
        with zipfile.ZipFile(io.BytesIO(fetch(address))) as archive:
            xml = ET.fromstring(archive.read('word/document.xml'))
        paragraphs = [''.join(p.itertext()) for p in xml.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')]
        return {'path': item['path'], 'excerpt': '\n'.join(paragraphs)[:4500]}
    except Exception as error:
        return {'path': item['path'], 'error': str(error)}


items = json.loads(pathlib.Path('docs/yandex-disk-inventory.json').read_text(encoding='utf-8-sig'))
selected = [item for item in items if item['type'] == 'file' and item['name'].endswith('.docx') and
            (item['name'].startswith('Модуль') or item['name'] == 'ПНР.docx' or item['name'] == 'ОБЗОР МЕТОДИК.docx')]
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    print(json.dumps(list(pool.map(inspect, selected)), ensure_ascii=False, indent=2))
