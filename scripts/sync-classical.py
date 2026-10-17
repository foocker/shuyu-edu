"""Rebuild the bilingual readers from a pinned public upstream and local translations.

Usage: python scripts/sync-classical.py [--source-dir DIR] [--check]
The optional directory contains upstream index.html / arithmetica.html snapshots.
No translation service is called by this build. Missing translations fail the build.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'
FIELDS = {'title', 'statement', 'text', 'note', 'remarks', 'q', 'hint', 'answer', 'aka', 'kid', 'term',
          'euclidTitle', 'euclidNote', 'courseTitle', 'courseSubtitle', 'elementsTitle', 'companionLabel'}
STORE = re.compile(r'window\.STORE=(.*?);window\.CONTENT=window\.STORE\.course;', re.S)


def json_script(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def localize(value, dictionary, missing, key=''):
    if isinstance(value, dict):
        return {k: localize(v, dictionary, missing, k) for k, v in value.items()}
    if isinstance(value, list):
        return [localize(v, dictionary, missing, key) for v in value]
    if isinstance(value, str) and key in FIELDS:
        if value in dictionary:
            return dictionary[value]
        if re.search('[a-z]{2}', value):
            missing.add(value)
    return value


def build(source, name, dictionary, ui_dictionary, ui_layer):
    old_studio = r'if (/^(thm:|b\d+:prop:)/.test(k))'
    if source.count(old_studio) != 1:
        raise ValueError('Upstream studio registration needs review')
    source = source.replace(old_studio, r'if (/^(thm:|ch\d+:thm:|b\d+:prop:)/.test(k))', 1)
    old_enabled = 'window.FSX_ENABLED = new Set((window.CONTENT.theorems || []).map(t => t.id));'
    if source.count(old_enabled) != 1:
        raise ValueError('Upstream chapter studio registration needs review')
    source = source.replace(old_enabled,
        'window.FSX_ENABLED = new Set((window.CONTENT.theorems || [])\n'
        '  .concat(...((window.STORE && window.STORE.courseChapters) || []).map(ch => ch.theorems || []))\n'
        '  .map(t => t.id));', 1)
    old_checks = "FS.alter && FS.mode === 'free' ? ' · all lines hold' : ''"
    if source.count(old_checks) != 1:
        raise ValueError('Upstream free-edit check status needs review')
    source = source.replace(old_checks, "FS.alter && FS.mode === 'free' ? (spec ? ' · all lines hold' : ' · no live checks for this theorem') : ''", 1)
    # Upstream passes vector objects where the label renderer expects [x, y].
    # Its two schematic circumscribed polygons also need R = r / cos(pi/n)
    # so their edges actually touch the incircle.
    if name == 'index.html':
        for old, new in [
            ('{ dir: n, show: i === 0 }', '{ dir: [n.x, n.y], show: i === 0 }'),
            ('{ dir: n });', '{ dir: [n.x, n.y] });'),
            ('const angs = [18, 90, 162, 234, 306];', 'const angs = [54, 126, 198, 270, 342];'),
            ('const P = add(Q, mul(n, 28));', 'const P = add(C, mul(n, 48 / Math.cos(Math.PI / 5)));'),
            ('const pts = [90, 210, 330].map((d, i) => {', 'const pts = [30, 150, 270].map((d, i) => {'),
            ("return b.at('P' + i, add(Q, mul(n, 36)),", "return b.at('P' + i, add(C, mul(n, 84)),")
        ]:
            if source.count(old) != 1:
                raise ValueError(f'Upstream figure patch needs review: {old}')
            source = source.replace(old, new, 1)
    match = STORE.search(source)
    if not match:
        raise ValueError(f'{name}: upstream STORE not found')
    data = json.loads(match[1])
    missing = set()
    localized = localize(data, dictionary, missing)
    def normalize_arithmetic(value, key=''):
        if isinstance(value, dict):
            return {k: normalize_arithmetic(v, k) for k, v in value.items()}
        if isinstance(value, list):
            return [normalize_arithmetic(v, key) for v in value]
        if isinstance(value, str) and key in FIELDS:
            for before, after in [('正方形', '平方数'), ('产品', '乘积'), ('平均比例', '比例中项'),
                                  ('完美数', '完满数'), ('完全数', '完满数'), ('质数', '素数'), ('相对素数', '互素'), ('测量', '整除')]:
                value = value.replace(before, after)
        return value
    if data['app'] == 'arithmetica':
        localized = normalize_arithmetic(localized)
    reviewed = json.loads((SCRIPTS / 'classical-reviewed-zh.json').read_text(encoding='utf-8'))
    def apply_reviewed(value):
        if isinstance(value, dict):
            if value.get('id') in reviewed:
                value.update(reviewed[value['id']])
            for child in value.values():
                apply_reviewed(child)
        elif isinstance(value, list):
            for child in value:
                apply_reviewed(child)
    apply_reviewed(localized)
    for book in localized['corpus']['books']:
        titles = reviewed['_propositionTitles'][str(book['n'])]
        if len(titles) != len(book['propositions']):
            raise ValueError(f"Book {book['n']}: reviewed title count mismatch")
        for item, title in zip(book['propositions'], titles):
            item['title'] = title
    if missing:
        raise ValueError(f'{name}: {len(missing)} untranslated strings, e.g. {sorted(missing)[:3]}')
    localized['brand']['companionHref'] = 'arithmetica-zh.html' if name == 'index.html' else 'index-zh.html'
    localized['course']['labels'] = {'def': '定义', 'post': '公设', 'cn': '公理', 'thm': '定理', 'prin': '原则', 'hook': '拓展'}
    # Every current proposition has a complete stepped proof. Preserve the duplicate
    # English prose as source metadata, along with all Greek text and citation IDs.
    for book in data['corpus']['books']:
        for item in book['propositions']:
            if not item.get('steps'):
                raise ValueError(f"{item['id']}: add a prose translation before syncing this upstream")
    shared = source.replace('<body>', '<body class="classical-reader">', 1).replace('</head>', '<link rel="stylesheet" href="site-nav.css">\n'
                            '<script src="site-nav.js?v=4" defer></script>\n</head>', 1)
    en = shared
    if name == 'index.html':
        en = en.replace('<title>', '<script>\nif (window.location.pathname.endsWith(\'/\')) {\n'
                        '  window.location.replace(\'index-zh.html\' + window.location.search + window.location.hash);\n'
                        '}\n</script>\n<title>', 1)
    replacement = 'window.STORE=' + json_script(localized) + ';window.CONTENT=window.STORE.course;'
    zh = STORE.sub(lambda _: replacement, shared, count=1)
    zh = zh.replace('<html lang="en"', '<html lang="zh-CN"', 1)
    zh = re.sub(r'<title>.*?</title>', '<title>' + localized['brand']['courseTitle'] + '</title>', zh, count=1)
    layer = '<script>\nwindow.__SHUYU_UI_ZH__=' + json_script(ui_dictionary) + ';\n' + ui_layer + '\n</script>\n'
    zh = zh.replace('</body>', layer + '</body>', 1)
    return {name: en, name.replace('.html', '-zh.html'): zh}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((SCRIPTS / 'classical-upstream.json').read_text(encoding='utf-8'))
    dictionary = json.loads((SCRIPTS / 'classical-zh.json').read_text(encoding='utf-8'))
    dictionary.update(json.loads((SCRIPTS / 'classical-zh-overrides.json').read_text(encoding='utf-8')))
    ui_dictionary = json.loads((SCRIPTS / 'classical-ui-zh.json').read_text(encoding='utf-8'))
    ui_dictionary.update(json.loads((SCRIPTS / 'classical-zh-overrides.json').read_text(encoding='utf-8')))
    ui_layer = (SCRIPTS / 'classical-zh-ui.js').read_text(encoding='utf-8')
    outputs = {}
    for name, digest in manifest['files'].items():
        cache = ROOT / '.cache' / 'classical-mathematics' / manifest['commit'] / name
        if args.source_dir:
            raw = (args.source_dir / name).read_bytes()
        elif cache.exists():
            raw = cache.read_bytes()
        else:
            url = f"https://raw.githubusercontent.com/gcrastinus/Classical-Mathematics/{manifest['commit']}/{name}"
            with urllib.request.urlopen(url, timeout=45) as response:
                raw = response.read()
        if hashlib.sha256(raw).hexdigest() != digest:
            raise ValueError(f'{name}: upstream checksum mismatch')
        if not args.source_dir and not cache.exists():
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_bytes(raw)
        outputs.update(build(raw.decode('utf-8').replace('\r\n', '\n'), name, dictionary, ui_dictionary, ui_layer))
    for name, content in outputs.items():
        target = ROOT / name
        if args.check:
            if not target.exists() or target.read_text(encoding='utf-8') != content:
                raise ValueError(f'{name}: generated page is out of date')
        else:
            target.write_text(content, encoding='utf-8', newline='\n')
        print(('Verified ' if args.check else 'Built ') + name)


if __name__ == '__main__':
    main()
