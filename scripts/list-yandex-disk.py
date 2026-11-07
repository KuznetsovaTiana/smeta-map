"""Preparation-only recursive inventory with pagination; excludes expiring URLs.

python scripts/list-yandex-disk.py [output.json]
"""
import collections
import json
import pathlib
import subprocess
import sys
import urllib.parse

queue = collections.deque(['/'])
entries = []
while queue:
    path = queue.popleft()
    offset = 0
    while True:
        query = urllib.parse.urlencode(dict(public_key='https://disk.yandex.ru/d/LiLSJN83d9vs6Q', path=path, limit=100, offset=offset))
        response = subprocess.check_output([
            'curl.exe' if sys.platform == 'win32' else 'curl', '-fsSL', '--max-time', '30',
            '--retry', '2', 'https://cloud-api.yandex.net/v1/disk/public/resources?' + query,
        ])
        page = json.loads(response)['_embedded']
        for item in page['items']:
            entries.append({key: item.get(key) for key in ['path', 'type', 'name', 'public_url', 'mime_type', 'size', 'resource_id']})
            if item['type'] == 'dir':
                queue.append(item['path'])
        offset += len(page['items'])
        if offset >= page['total']:
            break
        if not page['items']:
            raise RuntimeError(f'Incomplete pagination: {path} at {offset}')
output = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/yandex-disk-inventory.json')
output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(entries)} entries saved to {output}')
