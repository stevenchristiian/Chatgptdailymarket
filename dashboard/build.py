"""Build a dependency-free Cloudflare Pages dashboard from the Markdown archive."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parent.parent

def inline(text):
    text = html.escape(text)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    return text

def render(md):
    lines = md.splitlines()
    out, i = [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\-\s]+', c) for c in cells):
                    rows.append(cells)
                i += 1
            table = '<div class="table-wrap"><table>'
            for n, row in enumerate(rows):
                tag = 'th' if n == 0 else 'td'
                table += '<tr>' + ''.join(f'<{tag}>{inline(c)}</{tag}>' for c in row) + '</tr>'
            out.append(table + '</table></div>')
            continue
        heading = re.match(r'^(#{1,6})\s+(.+)', line)
        if heading:
            level = min(len(heading[1]) + 1, 6)
            out.append(f'<h{level}>{inline(heading[2])}</h{level}>')
        elif line.startswith('>'):
            out.append('<blockquote>' + inline(line.lstrip('> ')) + '</blockquote>')
        elif re.match(r'^([-*] |\d+\. )', line):
            items = []
            while i < len(lines) and re.match(r'^([-*] |\d+\. )', lines[i].strip()):
                items.append('<li>' + inline(re.sub(r'^([-*] |\d+\. )', '', lines[i].strip())) + '</li>')
                i += 1
            out.append('<ul>' + ''.join(items) + '</ul>')
            continue
        elif line == '---':
            out.append('<hr>')
        else:
            out.append('<p>' + inline(line) + '</p>')
        i += 1
    return '\n'.join(out)

def extract(md):
    prices = []
    for line in md.splitlines():
        cells = [re.sub(r'[*`]', '', c).strip() for c in line.strip().strip('|').split('|')]
        if len(cells) >= 3 and cells[0] in ('BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'QNT', 'LINK', 'ONDO') and '$' in cells[1] and '%' in cells[2]:
            if cells[0] not in [p['asset'] for p in prices]:
                prices.append({'asset': cells[0], 'price': cells[1], 'change': cells[2]})
    snapshot = next((re.sub(r'[*#]', '', l).strip() for l in md.splitlines() if 'WITA' in l), 'Lihat waktu snapshot dalam laporan.')
    return prices, snapshot

reports = []
for path in sorted((ROOT / 'crypto-recaps').glob('????-??-??.md'), reverse=True):
    md = path.read_text(encoding='utf-8')
    prices, snapshot = extract(md)
    reports.append({'date': path.stem, 'html': render(md), 'prices': prices, 'snapshot': snapshot})
if not reports:
    raise SystemExit('No recap files found; refusing to publish an empty dashboard.')

PAGE = r'''<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="theme-color" content="#111815"><meta name="description" content="Recap harian kripto: harga, ETF, geopolitik, agenda ekonomi, dan level teknikal.">
<title>Market Notes — Daily Crypto Brief</title>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=1">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=1">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/stories.css">
<script src="/stories.js" defer></script>
<meta name="apple-mobile-web-app-title" content="Market Notes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>
:root{--bg:#f5f5ef;--ink:#17251d;--muted:#647065;--line:#dce1d6;--green:#166c43;--red:#aa3838}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,-apple-system,sans-serif}header{background:#111815;color:#fff;padding:25px max(5vw,20px);display:flex;align-items:center;justify-content:space-between;gap:20px}header b{letter-spacing:.14em;font-size:14px}header span{color:#a4b6a7;font-size:12px}main{max-width:1200px;margin:auto;padding:48px 24px}a{color:var(--green);text-underline-offset:3px}header a{color:#c4ddaf;font-size:13px}.eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}h1{font-size:clamp(34px,5vw,60px);letter-spacing:-.055em;line-height:1.1;margin:14px 0} .intro{max-width:630px;color:var(--muted)}.controls{display:flex;align-items:end;flex-wrap:wrap;gap:18px;margin:30px 0 14px}label{font-size:12px;font-weight:600;display:grid;gap:6px}select{font:inherit;font-size:14px;color:var(--ink);padding:11px 38px 11px 13px;border:1px solid var(--line);border-radius:8px;background:white}select:focus-visible,a:focus-visible{outline:3px solid #7fac6b;outline-offset:3px}.status{font-size:12px;color:var(--muted);margin-bottom:20px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{background:white;border:1px solid var(--line);padding:20px 16px;border-radius:12px}.asset{font-size:12px;font-weight:700;color:var(--muted)}.price{font-size:21px;font-weight:650;letter-spacing:-.04em;margin:8px 0}.change{font-size:13px}.negative{color:var(--red)}.positive{color:var(--green)}.compare{font-size:11px;color:var(--muted);margin-top:9px;border-top:1px solid var(--line);padding-top:9px}.layout{display:grid;grid-template-columns:1fr 235px;gap:32px;margin-top:32px}article{min-width:0;background:white;border:1px solid var(--line);border-radius:14px;padding:30px}article h2{font-size:28px;line-height:1.3;letter-spacing:-.03em}article h3{font-size:22px;line-height:1.4;margin-top:40px}article h4{font-size:17px;margin-top:30px}article p,article li{font-size:14px}article li{margin:8px 0}blockquote{margin:25px 0;background:#edf3e8;border-left:3px solid #6c954b;padding:20px;font-size:16px}.table-wrap{overflow:auto;margin:22px 0}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top;min-width:80px}th{background:#f3f5ef;font-weight:650}aside{font-size:13px}aside section{border-top:1px solid var(--line);padding:20px 0}aside h2{font-size:14px}aside p{color:var(--muted)}#toc a{display:block;margin:12px 0;text-decoration:none;font-size:12px}hr{border:0;border-top:1px solid var(--line);margin:30px 0}footer{font-size:12px;color:var(--muted);padding:30px 0}noscript{display:block;padding:30px} @media(max-width:1000px){.cards{grid-template-columns:repeat(3,1fr)}.layout{grid-template-columns:1fr}aside{order:-1}#toc{display:none}aside section{display:inline-block;max-width:360px;vertical-align:top;margin-right:25px}article{padding:24px}}@media(max-width:550px){main{padding:30px 16px}.cards{grid-template-columns:repeat(2,1fr)}header span{display:none}.price{font-size:23px}article{padding:18px}header{padding:20px}.controls{gap:12px}select{max-width:170px}aside{display:none}}
/* Keep mobile layout within the viewport; wide tables scroll locally. */
html{width:100%;overflow-x:hidden;overscroll-behavior-x:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{width:100%;overflow-x:hidden;overflow-wrap:anywhere}
@supports(overflow:clip){html,body{overflow-x:clip}}
header{flex-wrap:wrap}
main,.controls>* ,.card,.layout>*{min-width:0}
.cards{grid-template-columns:repeat(3,minmax(0,1fr))}
.layout{grid-template-columns:minmax(0,1fr) 235px}
.table-wrap{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
select{font-size:16px;max-width:100%}
@media(pointer:coarse){html,body{touch-action:pan-x pan-y}}
@media(max-width:1000px){.layout{grid-template-columns:minmax(0,1fr)}}
@media(max-width:550px){
  .cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end}
  .controls label{min-width:0}
  .controls select{width:100%;min-width:0;max-width:100%;padding-right:22px}
  #source{grid-column:1/-1}
  .price{font-size:clamp(18px,5.6vw,23px)}
}
</style></head><body>
<header><b>MARKET NOTES<span> / DAILY CRYPTO BRIEF</span></b><a href="https://github.com/stevenchristiian/Chatgptdailymarket" target="_blank" rel="noopener">Arsip GitHub ↗</a></header>
<main><div class="eyebrow">Riset harian · WITA / UTC+8</div><h1>Market, made clearer.</h1><p class="intro">Harga, cerita di balik pergerakan, dan level yang perlu diperhatikan. Satu briefing untuk membaca pasar dengan lebih tenang.</p>
<div class="controls"><label>Laporan<select id="date" aria-label="Tanggal laporan"></select></label><label>Bandingkan dengan<select id="comparison" aria-label="Tanggal pembanding"></select></label><a id="source" target="_blank" rel="noopener">Buka laporan asli ↗</a></div>
<div id="status" class="status" role="status"></div><section class="cards" id="cards" aria-label="Harga snapshot"></section>
<div class="layout"><article id="report"></article><aside><section><div class="eyebrow">Panduan membaca</div><h2>Snapshot, bukan harga live.</h2><p>Perubahan 24 jam berasal dari sumber laporan. Perbandingan tanggal memakai dua snapshot terpilih, sehingga rentangnya bisa berbeda dari 24 jam.</p></section><section><h2>Daftar isi</h2><nav id="toc" aria-label="Daftar isi"></nav></section><section><h2>Kelola ketidakpastian</h2><p>Level teknikal adalah zona pantauan. Periksa tanggal sumber, status ETF parsial, dan syarat skenario sebelum mengambil keputusan.</p></section></aside></div>
<footer>Market Notes · Laporan diperbarui melalui arsip GitHub. Data dan analisis mengikuti laporan bertanggal; dashboard tidak memverifikasi ulang isi laporan.</footer></main><noscript>Aktifkan JavaScript untuk memilih laporan atau buka arsip GitHub.</noscript>
<script id="data" type="application/json">__DATA__</script><script>
// Safari gesture fallback: lock touch zoom while retaining one-finger scrolling.
const touchLayout=window.matchMedia('(pointer: coarse)');
function blockTouchZoom(event){
  if(touchLayout.matches && event.cancelable) event.preventDefault();
}
document.addEventListener('gesturestart',blockTouchZoom,{passive:false});
document.addEventListener('gesturechange',blockTouchZoom,{passive:false});
document.addEventListener('touchmove',event=>{
  if(event.touches.length>1) blockTouchZoom(event);
},{passive:false});
const reports=JSON.parse(document.getElementById('data').textContent), date=document.getElementById('date'), comparison=document.getElementById('comparison');
const formatDate=d=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Makassar'}).format(new Date(d+'T00:00:00+08:00'));
for(const r of reports){date.add(new Option(formatDate(r.date),r.date));comparison.add(new Option(formatDate(r.date),r.date));}
comparison.add(new Option('Tanpa perbandingan',''),0);comparison.value=reports[1]?.date||'';
const q=new URLSearchParams(location.search).get('date');if(reports.some(r=>r.date===q))date.value=q;
function amount(s){let x=s.replace(/[^\d.,-]/g,'');if(x.includes(',')){x=x.replace(/\./g,'').replace(',','.');}else if(/^\d{1,3}(\.\d{3})+$/.test(x)){x=x.replace(/\./g,'');}return Number(x);}
function textNode(tag,cls,value){const n=document.createElement(tag);n.className=cls;n.textContent=value;return n;}
function show(){const r=reports.find(r=>r.date===date.value), prev=reports.find(r=>r.date===comparison.value);document.getElementById('report').innerHTML=r.html;document.getElementById('status').textContent=r.snapshot+' · '+reports.length+' laporan tersedia';document.getElementById('source').href='https://github.com/stevenchristiian/Chatgptdailymarket/blob/main/crypto-recaps/'+r.date+'.md';const cards=document.getElementById('cards');cards.replaceChildren();for(const p of r.prices){const card=textNode('div','card','');card.append(textNode('div','asset',p.asset),textNode('div','price',p.price),textNode('div','change '+(/[−-]/.test(p.change)?'negative':/\+/.test(p.change)?'positive':''),p.change+' / 24 jam'));const before=prev?.prices.find(x=>x.asset===p.asset);if(before){const base=amount(before.price),current=amount(p.price);if(base>0&&Number.isFinite(current)){const delta=(current/base-1)*100;card.append(textNode('div','compare',(delta>=0?'+':'')+delta.toLocaleString('id-ID',{maximumFractionDigits:2})+'% vs '+prev.date));}}cards.append(card);}if(!r.prices.length)cards.append(textNode('p','status','Format harga laporan ini berbeda. Lihat tabel lengkap di bawah.'));const toc=document.getElementById('toc');toc.replaceChildren();document.querySelectorAll('#report h3').forEach((h,i)=>{h.id='section-'+i;const a=textNode('a','',h.textContent);a.href='#'+h.id;toc.append(a);});const url=new URL(location.href);url.searchParams.set('date',r.date);history.replaceState(null,'',url);}
date.addEventListener('change',show);comparison.addEventListener('change',show);show();
</script></body></html>'''
payload = json.dumps(reports, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
output = ROOT / 'dist'
output.mkdir(exist_ok=True)
(output / 'index.html').write_text(PAGE.replace('__DATA__', payload), encoding='utf-8')
for asset in ('stories.css', 'stories.js'):
    (output / asset).write_text((ROOT / 'dashboard' / asset).read_text(encoding='utf-8'), encoding='utf-8')
print(f'Built dashboard: {len(reports)} reports -> dist/index.html')



# Opaque PNG icons, rendered using only the Python standard library.
# iOS applies its own corner mask; keep the artwork inside the safe area.
import struct
import zlib

def icon_png(size):
    segments = [(0.23, 0.58, 0.40, 0.41), (0.40, 0.41, 0.54, 0.50),
                (0.54, 0.50, 0.76, 0.27), (0.60, 0.27, 0.76, 0.27),
                (0.76, 0.27, 0.76, 0.43)]
    def color(x, y):
        bg = (17, 24, 21)
        for left, top, right in [(0.22, 0.69, 0.33), (0.445, 0.61, 0.555), (0.67, 0.53, 0.78)]:
            if left <= x <= right and top <= y <= 0.79:
                bg = (58, 87, 61)
        for x1,y1,x2,y2 in segments:
            dx,dy=x2-x1,y2-y1
            t=max(0,min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)))
            if (x-x1-t*dx)**2+(y-y1-t*dy)**2 <= 0.025**2:
                return (196, 221, 175)
        return bg
    pixels=bytearray()
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            samples=[color((x+dx)/size,(y+dy)/size) for dx,dy in [(0.25,0.25),(0.75,0.25),(0.25,0.75),(0.75,0.75)]]
            pixels.extend(sum(c[k] for c in samples)//4 for k in range(3))
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    return bytes([137,80,78,71,13,10,26,10])+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(pixels),9))+chunk(b'IEND',b'')

for filename,size in [('apple-touch-icon.png',180),('icon-192.png',192),('icon-512.png',512)]:
    (output/filename).write_bytes(icon_png(size))
manifest={'id':'/','name':'Market Notes','short_name':'Market Notes','lang':'id','start_url':'/','scope':'/','display':'standalone','background_color':'#f5f5ef','theme_color':'#111815','icons':[{'src':f'/icon-{size}.png','sizes':f'{size}x{size}','type':'image/png','purpose':'any'} for size in (192,512)]}
(output/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
print('Built Safari home-screen icon and web app manifest')
