"""Build Market Notes from the dated Markdown archive, without network or packages."""
from pathlib import Path
from datetime import datetime, timezone
import html
import json
import re
import shutil
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ('BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'QNT', 'LINK', 'ONDO')


def plain(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    return re.sub(r'[*`_]', '', text).strip()


def inline(text):
    """Escape all author HTML; only generate safe HTTP(S) links and simple emphasis."""
    escaped = html.escape(text, quote=True)
    escaped = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',
                     r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', escaped)
    escaped = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped)
    escaped = re.sub(r'`([^`]+)`', r'<code>\1</code>', escaped)
    return escaped


def cells(line):
    return [c.strip().replace('\\|', '|') for c in re.split(r'(?<!\\)\|', line.strip().strip('|'))]


def parse_blocks(md):
    lines, out, i = md.splitlines(), [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = cells(lines[i])
                if not all(re.fullmatch(r'[:\-\s]+', c or ' ') for c in row):
                    rows.append(row)
                i += 1
            if rows:
                out.append({'type': 'table', 'headers': rows[0], 'rows': rows[1:]})
            continue
        m = re.match(r'^(#{1,6})\s+(.+)', line)
        if m:
            out.append({'type': 'heading', 'level': len(m[1]), 'text': m[2]})
        elif line.startswith('>'):
            out.append({'type': 'quote', 'text': line.lstrip('> ')})
        elif re.match(r'^([-*] |\d+[.)] )', line):
            ordered = bool(re.match(r'^\d', line))
            items = []
            while i < len(lines) and re.match(r'^([-*] |\d+[.)] )', lines[i].strip()):
                item = re.sub(r'^([-*] |\d+[.)] )', '', lines[i].strip())
                i += 1
                while i < len(lines) and lines[i].startswith(('  ', '\t')) and lines[i].strip() and not lines[i].strip().startswith('|'):
                    item += ' ' + lines[i].strip()
                    i += 1
                items.append(item)
            out.append({'type': 'list', 'ordered': ordered, 'items': items})
            continue
        elif re.fullmatch(r'[-*_]{3,}', line):
            out.append({'type': 'rule'})
        else:
            para = line
            i += 1
            while i < len(lines) and lines[i].strip() and not lines[i-1].endswith('  ') and not re.match(r'^(?:#{1,6} |\||>|[-*] |\d+[.)] |---)', lines[i].strip()):
                para += ' ' + lines[i].strip()
                i += 1
            out.append({'type': 'paragraph', 'text': para})
            continue
        i += 1
    return out


def render_blocks(blocks):
    out = []
    for b in blocks:
        kind = b['type']
        if kind == 'heading':
            level = min(6, max(3, b['level'] + 1))
            out.append(f'<h{level}>{inline(b["text"])}</h{level}>')
        elif kind in ('paragraph', 'quote'):
            tag = 'p' if kind == 'paragraph' else 'blockquote'
            out.append(f'<{tag}>{inline(b["text"])}</{tag}>')
        elif kind == 'list':
            tag = 'ol' if b['ordered'] else 'ul'
            out.append(f'<{tag}>' + ''.join('<li>' + inline(x) + '</li>' for x in b['items']) + f'</{tag}>')
        elif kind == 'table':
            headers = ''.join('<th scope="col">' + inline(c) + '</th>' for c in b['headers'])
            rows = ''.join('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in row) + '</tr>' for row in b['rows'])
            out.append('<div class="table-scroll" tabindex="0" role="region" aria-label="Tabel laporan, geser untuk kolom lain"><table><thead><tr>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>')
        elif kind == 'rule':
            out.append('<hr>')
    return '\n'.join(out)


def number(value, locale=None):
    """Read Indonesian and English numbers. Never convert missing values into zero."""
    s = plain(value).replace('−', '-').replace('–', '-')
    m = re.search(r'[+\-]?\d[\d.,]*', s)
    if not m:
        return None
    s = m[0].rstrip('.,')
    if ',' in s and '.' in s:
        decimal = ',' if s.rfind(',') > s.rfind('.') else '.'
        s = s.replace('.' if decimal == ',' else ',', '').replace(decimal, '.')
    elif ',' in s:
        suffix = s.split(',')[-1]
        if locale == 'en' or (locale is None and len(suffix) == 3 and not s.lstrip('+-').startswith('0,')):
            s = s.replace(',', '')
        else:
            s = s.replace(',', '.')
    elif '.' in s:
        if locale == 'id' and re.fullmatch(r'[+\-]?\d{1,3}(\.\d{3})+', s):
            s = s.replace('.', '')
    try:
        return float(s)
    except ValueError:
        return None


def table_locale(table):
    for row in table['rows']:
        for val in row[1:3]:
            s = plain(val)
            if ',' in s and '.' in s:
                return 'id' if s.rfind(',') > s.rfind('.') else 'en'
    for row in table['rows']:
        if len(row) > 2 and ',' in row[2] and '%' in row[2]:
            return 'id'
    return 'en'


def find_sections(blocks):
    sections, intro = [], []
    for b in blocks:
        if b['type'] == 'heading' and b['level'] == 2:
            sections.append({'id': f'section-{len(sections)}', 'title': plain(b['text']), 'blocks': []})
        elif sections:
            sections[-1]['blocks'].append(b)
        elif not (b['type'] == 'heading' and b['level'] == 1):
            intro.append(b)
    for s in sections:
        s['html'] = render_blocks(s['blocks'])
        s['text'] = '\n'.join(plain(b.get('text', ' '.join(b.get('items', [])))) for b in s['blocks'] if b['type'] not in ('table', 'rule'))
    return sections, intro


def extract_report(path):
    md = path.read_text(encoding='utf-8')
    blocks = parse_blocks(md)
    sections, intro = find_sections(blocks)
    tables = [b for s in sections for b in s['blocks'] if b['type'] == 'table']
    prices = []
    for t in tables:
        h = [plain(x).lower() for x in t['headers']]
        if not h or 'aset' not in h[0] or not any('harga' in x and 'usd' in x for x in h) or not any('24' in x for x in h):
            continue
        pi = next(i for i, x in enumerate(h) if 'harga' in x and 'usd' in x)
        ci = next(i for i, x in enumerate(h) if '24' in x)
        si = next((i for i, x in enumerate(h) if 'sinyal' in x), None)
        locale = table_locale(t)
        for row in t['rows']:
            asset = plain(row[0])
            if asset not in ASSETS or len(row) <= max(pi, ci):
                continue
            signal = re.search(r'\b(BUY|SELL|HOLD)\b', plain(row[si]))[1] if si is not None and len(row) > si and re.search(r'\b(BUY|SELL|HOLD)\b', plain(row[si])) else None
            prices.append({'asset': asset, 'price': number(row[pi], locale), 'change': number(row[ci]), 'rawPrice': plain(row[pi]), 'rawChange': plain(row[ci]), 'signal': signal})
        break
    levels = []
    for t in tables:
        h = [plain(x).lower() for x in t['headers']]
        if 'sinyal' in h and any('support' in x for x in h) and any('resistance' in x for x in h):
            for row in t['rows']:
                if plain(row[0]) not in ASSETS:
                    continue
                d = {'asset': plain(row[0])}
                for key, word in [('support', 'support'), ('resistance', 'resistance'), ('signal', 'sinyal'), ('reason', 'pemicu'), ('invalidation', 'invalidasi'), ('horizon', 'horizon')]:
                    ix = next((i for i, x in enumerate(h) if word in x), None)
                    d[key] = plain(row[ix]) if ix is not None and len(row) > ix else None
                sig = re.search(r'\b(BUY|SELL|HOLD)\b', d.get('signal') or '')
                d['signal'] = sig[1] if sig else None
                levels.append(d)
            break
    for p in prices:
        lev = next((x for x in levels if x['asset'] == p['asset']), None)
        if lev:
            p['signal'] = lev['signal']
    snapshot = next((plain(line) for line in md.splitlines() if 'WITA' in line), 'Waktu snapshot belum terbaca; lihat laporan asli.')
    oil = []
    oil_name = None
    for t in tables:
        h = [plain(x) for x in t['headers']]
        if len(h) == 2 and h[0] == 'Tanggal' and h[1] in ('Brent (USD/barel)', 'WTI (USD/barel)'):
            oil_name = h[1]
            for row in t['rows']:
                if len(row) == 2 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', plain(row[0])) and re.fullmatch(r'\d+(?:\.\d+)?', plain(row[1])):
                    oil.append({'date': plain(row[0]), 'value': float(plain(row[1]))})
            break
    links = []
    for label, url in re.findall(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', md):
        if not any(x['url'] == url for x in links):
            links.append({'label': plain(label), 'url': url})
    return {'date': path.stem, 'snapshot': snapshot, 'intro': render_blocks(intro), 'sections': sections, 'prices': prices, 'levels': levels, 'oil': oil, 'oilName': oil_name, 'sources': links, 'source': f'https://github.com/stevenchristiian/Chatgptdailymarket/blob/main/crypto-recaps/{path.name}'}


def icon_png(size):
    # Keep the established Safari mark; the new site uses the same identity.
    segments = [(0.23, 0.58, 0.40, 0.41), (0.40, 0.41, 0.54, 0.50), (0.54, 0.50, 0.76, 0.27), (0.60, 0.27, 0.76, 0.27), (0.76, 0.27, 0.76, 0.43)]
    def color(x, y):
        bg = (17, 24, 21)
        for left, top, right in [(0.22, 0.69, 0.33), (0.445, 0.61, 0.555), (0.67, 0.53, 0.78)]:
            if left <= x <= right and top <= y <= 0.79:
                bg = (58, 87, 61)
        for x1, y1, x2, y2 in segments:
            dx, dy = x2 - x1, y2 - y1
            t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
            if (x-x1-t*dx)**2 + (y-y1-t*dy)**2 <= 0.025**2:
                return (202, 242, 113)
        return bg
    pixels = bytearray()
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            samples = [color((x+dx)/size, (y+dy)/size) for dx, dy in [(0.25,0.25),(0.75,0.25),(0.25,0.75),(0.75,0.75)]]
            pixels.extend(sum(c[k] for c in samples)//4 for k in range(3))
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind+data) & 0xffffffff)
    return bytes([137,80,78,71,13,10,26,10]) + chunk(b'IHDR', struct.pack('>IIBBBBB',size,size,8,2,0,0,0)) + chunk(b'IDAT',zlib.compress(bytes(pixels),9)) + chunk(b'IEND',b'')


def build():
    reports = [extract_report(p) for p in sorted((ROOT/'crypto-recaps').glob('????-??-??.md'), reverse=True)]
    if not reports:
        raise SystemExit('No reports: refusing to replace the dashboard with an empty build.')
    output = ROOT/'dist'
    output.mkdir(exist_ok=True)
    payload = json.dumps({'version': 2, 'reports': reports}, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    page = (ROOT/'dashboard/index.html').read_text(encoding='utf-8').replace('__REPORT_DATA__', payload)
    (output/'index.html').write_text(page, encoding='utf-8')
    for name in ('app.js', 'styles.css', 'logo.svg'):
        shutil.copyfile(ROOT/'dashboard'/name, output/name)
    # Expose the original UTF-8 report as a portable download as well as GitHub.
    (output/'reports').mkdir(exist_ok=True)
    for path in (ROOT/'crypto-recaps').glob('????-??-??.md'):
        shutil.copyfile(path, output/'reports'/path.name)
    for name, size in [('apple-touch-icon.png',180),('icon-192.png',192),('icon-512.png',512)]:
        (output/name).write_bytes(icon_png(size))
    manifest = {'id':'/', 'name':'Market Notes', 'short_name':'Market Notes', 'lang':'id', 'start_url':'/', 'scope':'/', 'display':'standalone', 'background_color':'#f5f6f2', 'theme_color':'#111a17', 'icons':[{'src':f'/icon-{s}.png','sizes':f'{s}x{s}','type':'image/png','purpose':'any'} for s in (192,512)]}
    (output/'manifest.webmanifest').write_text(json.dumps(manifest), encoding='utf-8')
    print(f'Built Market Notes v2: {len(reports)} reports, {sum(len(r["prices"]) for r in reports)} price snapshots -> dist/')


if __name__ == '__main__':
    build()
