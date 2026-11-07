"""Preparation-only audit; never imported by the site. Uses anonymous curl requests.

python scripts/check-yandex-links.py [inventory.json] [report.json]
Verifies the actual preview resource ID, not just an HTTP 200 or folder listing.
"""
import concurrent.futures
import json
import pathlib
import re
import subprocess
import sys
import urllib.parse

ROOT = 'https://disk.yandex.ru/d/OAUtZcIwS94DDg'


def preview_url(path):
    return ROOT + urllib.parse.quote(path, safe='/')


def check(item):
    url = preview_url(item['path'])
    response = subprocess.run(
        ['curl.exe' if sys.platform == 'win32' else 'curl', '-fsSL',
         '--max-time', '30', '--retry', '2', '-A', 'Mozilla/5.0', url],
        capture_output=True, encoding='utf-8', errors='replace',
    )
    # Yandex embeds escaped JSON state in the public HTML. The slider must
    # point to this specific file; showing its parent folder is insufficient.
    match = re.search(r'sliderResourceId\\?":\\?"([^"\\]+)', response.stdout)
    actual = match.group(1) if match else None
    expected = item['resource_id'].split(':', 1)[1]
    return {'path': item['path'], 'url': url,
            'previewVerified': response.returncode == 0 and actual == expected,
            'resourceId': expected, 'previewResourceId': actual}


if __name__ == '__main__':
    inventory = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/yandex-disk-inventory.json')
    items = json.loads(inventory.read_text(encoding='utf-8-sig'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, (item for item in items if item['type'] == 'file')))
    report = json.dumps(results, ensure_ascii=False, indent=2) + '\n'
    if len(sys.argv) > 2:
        pathlib.Path(sys.argv[2]).write_text(report, encoding='utf-8')
        print(f'{sum(row["previewVerified"] for row in results)}/{len(results)} previews verified')
    else:
        print(report)
    sys.exit(0 if all(row['previewVerified'] for row in results) else 1)
