/* Market Notes v2. All market information is derived from the selected archive.
   No quotes, candles, orders, or external APIs are synthesized in the client. */
(() => {
'use strict';
const payload = JSON.parse(document.getElementById('market-data').textContent);
const reports = payload.reports;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = v => String(v ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*`_]/g,'').trim();
const inline = v => esc(v).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const clip = (s,n=210) => {s=plain(s);return s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s;};
const fmtDate = (d,short=false) => new Intl.DateTimeFormat('id-ID',{day:'numeric',month:short?'short':'long',year:short?undefined:'numeric',timeZone:'Asia/Makassar'}).format(new Date(d+'T12:00:00+08:00'));
const num = (n,d=2) => Number.isFinite(n)?n.toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const usd = n => Number.isFinite(n)?'$'+num(n,n<2?4:2):'Belum tersedia';
const pct = (n,d=2) => Number.isFinite(n)?(n>0?'+':n<0?'−':'')+num(Math.abs(n),d)+'%':'—';
const signClass = n => Number.isFinite(n)?n<0?'negative':n>0?'positive':'muted':'muted';
const signal = s => s?`<span class="signal ${esc(s.toLowerCase())}">${esc(s)}</span>`:'<span class="pill">BELUM ADA LABEL</span>';
const names = {BTC:'Bitcoin',ETH:'Ethereum',SOL:'Solana',BNB:'BNB',XRP:'XRP',HYPE:'Hyperliquid',QNT:'Quant',LINK:'Chainlink',ONDO:'Ondo'};
const glyphs={BTC:'₿',ETH:'♦',SOL:'≋',BNB:'◇',XRP:'×',HYPE:'H',QNT:'Q',LINK:'⬡',ONDO:'O'};
const paths={btc:'M12 3v18M8 5h6a4 4 0 0 1 0 8H8m0-8v14h7a3 3 0 0 0 0-6H8',overview:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',market:'M4 20V10m5 10V4m6 16v-7m5 7V7M2 21h20',rotation:'M4 7h14l-4-4m4 4-4 4M20 17H6l4 4m-4-4 4-4',macro:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a16 16 0 0 1 0 18 16 16 0 0 1 0-18Z',research:'M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3V4ZM21 4h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h5V4Z',library:'M4 5h16v15H4zM8 2v6m8-6v6M4 10h16M8 14h3m3 0h3M8 17h3',arrow:'M5 12h14m-6-6 6 6-6 6',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',shield:'m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Zm-4 9 3 3 5-6',info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v1',dollar:'M12 2v20m5-16H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H5',check:'m5 12 4 4L19 6',chart:'M3 3v18h18M6 16l5-5 4 3 6-9',play:'m9 5 11 7-11 7V5Z',portfolio:'M3 7h18v12H3zM3 7l3-4h12l3 4M8 12h8',link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
const coin = a => `<span class="coin-icon coin-${a.toLowerCase()}" aria-hidden="true">${glyphs[a]||esc(a[0])}</span>`;
const assetLabel = a => `<span class="asset-name">${coin(a)}<span><b>${esc(a)}</b><small class="name-full">${esc(names[a]||a)}</small></span></span>`;
const views={btc:{nav:'BTC Risk Desk',mobile:'BTC',title:'Bitcoin, dengan konteks.<br><span>Konfirmasi sebelum aksi.</span>',subtitle:'Analisis terbaru dan tracker BTC, terpisah dari snapshot spot harian.'},overview:{nav:'Overview',mobile:'Ringkasan',title:'Baca pasar.<br><span>Pahami alasannya.</span>',subtitle:'Sinyal, cerita, dan risiko. Semua dalam satu pandangan.'},market:{nav:'Pasar & sinyal',mobile:'Pasar',title:'Lihat pergerakan.<br><span>Pahami pemicunya.</span>',subtitle:'Harga, struktur, dan syarat sinyal spot pada edisi terpilih.'},rotation:{nav:'Radar rotasi',mobile:'Rotasi',title:'Rotasi dengan alasan.<br><span>Bukan ikut keramaian.</span>',subtitle:'Cari keunggulan relatif, pahami pemicu dan batasnya.'},macro:{nav:'Makro & geopolitik',mobile:'Makro',title:'Baca dunia.<br><span>Hubungkan ke pasar.</span>',subtitle:'ETF, energi, kurs, dan agenda ekonomi dalam konteks.'},research:{nav:'Riset fundamental',mobile:'Riset',title:'Bedah bisnisnya.<br><span>Uji manfaat tokennya.</span>',subtitle:'Adopsi, value capture, dan risiko suplai dipisahkan dengan jelas.'},library:{nav:'Laporan & arsip',mobile:'Arsip',title:'Semua konteks.<br><span>Semua sumber.</span>',subtitle:'Baca laporan utuh, telusuri bukti, dan bandingkan edisi.'},portfolio:{nav:'Portofolio',mobile:'Porto',title:'Posisimu sendiri.<br><span>Terpisah dari riset.</span>',subtitle:'Area pribadi berkunci PIN. Tidak ikut terbit bersama laporan publik.'}};
const initial = new URL(location.href);
let selected = reports.find(r=>r.date===initial.searchParams.get('date')) || reports[0];
let view = views[initial.searchParams.get('view')]?initial.searchParams.get('view'):'overview';
let compare = reports[reports.indexOf(selected)+1]?.date || '';
let filter='all', sort='original', query='', chartAsset='BTC', chartRange=21, storyIndex=0, slides=[], lastFocus=null;
const dateSelect=$('#date'), content=$('#content');
for(const r of reports) dateSelect.add(new Option(fmtDate(r.date),r.date));
dateSelect.value=selected.date;
for(const [id,v] of Object.entries(views)){
  $('#desktop-nav').insertAdjacentHTML('beforeend',`<button type="button" class="nav-link" data-view="${id}">${icon(id)}<span>${v.nav}</span><span class="nav-arrow">↗</span></button>`);
  $('#mobile-nav').insertAdjacentHTML('beforeend',`<button type="button" data-view="${id}">${icon(id)}<span>${v.mobile}</span></button>`);
}
try{const theme=localStorage.getItem('mn-theme');if(theme==='dark')document.documentElement.dataset.theme='dark';}catch(e){/* Storage may be disabled. */}
const section = pattern => selected.sections.find(s=>pattern.test(s.title));
const paragraphs = s => s?.blocks.filter(b=>b.type==='paragraph').map(b=>b.text)||[];
const listItems = s => s?.blocks.filter(b=>b.type==='list').flatMap(b=>b.items)||[];
const summary = () => section(/Tiga hal|Ringkas/i);
const leadParts = text => {const m=String(text||'').match(/^\*\*(.+?)\*\*\s*(.*)$/s);return m?{title:plain(m[1]),body:plain(m[2])}:{title:clip(text,100),body:plain(text)};};
const openButton = (s,label='Baca konteks lengkap') => s?`<button type="button" class="text-button" data-section="${s.id}">${label} ↗</button>`:'';
const sourceChips = (s,max=5) => {
 const urls=[...new Set((s?.html.match(/href="https?:\/\/[^\"]+/g)||[]).map(v=>v.slice(6)))].slice(0,max);
 return urls.map(url=>{let domain;try{domain=new URL(url.replace(/&amp;/g,'&')).hostname.replace(/^www\./,'');}catch(e){return '';}
 return `<a class="source-chip" href="${esc(url.replace(/&amp;/g,'&'))}" target="_blank" rel="noopener noreferrer">${esc(domain)} ↗</a>`;}).join('');
};
function sectionHead(title,sub='',action='') {return `<div class="section-head"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${action}</div>`;}
function empty(message='Bagian ini belum tersedia pada edisi ini. Buka laporan asli untuk konteks yang tersedia.') {return `<div class="section-empty">${esc(message)}</div>`;}
function infoNote(text){return `<div class="quality-note">${icon('info')}<p>${text}</p></div>`;}
function renderSection(s,heading=true){return s?`<section class="report-section" id="${s.id}">${heading?`<h2>${esc(s.title)}</h2>`:''}${s.html}</section>`:empty();}
function pointsFor(asset,range=21){const end=Date.parse(selected.date+'T12:00:00Z');return reports.filter(r=>r.date<=selected.date && (end-Date.parse(r.date+'T12:00:00Z'))/86400000<=range).slice().reverse().flatMap(r=>{const p=r.prices.find(p=>p.asset===asset);return Number.isFinite(p?.price)?[{date:r.date,value:p.price}]:[];});}
function chart(points,{label='',color='var(--green)',small=false,id=''}={}){
 if(points.length<2)return empty('Grafik belum tersedia: perlu sedikitnya dua observasi yang dapat dibaca.');
 const w=small?112:600,h=small?35:215,pad=small?3:38,bottom=small?2:27;
 const vals=points.map(p=>p.value),lo=Math.min(...vals),hi=Math.max(...vals),spread=hi-lo||Math.abs(hi)*.02||1;
 const min=lo-spread*.15,max=hi+spread*.15;
 const d0=Date.parse(points[0].date),d1=Date.parse(points.at(-1).date),span=d1-d0||1;
 const xy=points.map(p=>({x:pad+(Date.parse(p.date)-d0)/span*(w-pad*2),y:pad+(1-(p.value-min)/(max-min))*(h-pad-bottom)}));
 const line=xy.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
 const grid=small?'':[0,.5,1].map(f=>{const y=pad+f*(h-pad-bottom),v=max-f*(max-min);return `<line class="gridline" x1="${pad}" x2="${w-pad}" y1="${y}" y2="${y}"/><text x="${pad-7}" y="${y+3}" text-anchor="end">${esc(v>=1000?num(v/1000,1)+'k':num(v,v<2?3:1))}</text>`;}).join('');
 const circles=points.map((p,i)=>`<circle class="chart-point" cx="${xy[i].x}" cy="${xy[i].y}" r="${small?1.5:3}" fill="${color}" ${small?'':`tabindex="0" data-chart="${id}" data-date="${p.date}" data-value="${p.value}"`}><title>${p.date}: ${p.value}</title></circle>`).join('');
 return `<svg viewBox="0 0 ${w} ${h}" class="${small?'sparkline':''}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${grid}<path d="${line} L${xy.at(-1).x},${h-bottom} L${xy[0].x},${h-bottom} Z" fill="${color}" opacity=".045"/><path d="${line}" fill="none" stroke="${color}" stroke-width="${small?1.5:2}" stroke-linecap="round" stroke-linejoin="round" ${small?'':'stroke-dasharray="4 3"'}/>${circles}${small?'':`<text x="${pad}" y="${h-6}">${esc(fmtDate(points[0].date,true))}</text><text x="${w-pad}" y="${h-6}" text-anchor="end">${esc(fmtDate(points.at(-1).date,true))}</text>`}</svg>`;
}
function getEtf(){
 const s=section(/ETF/i);if(!s)return {section:null};
 const t=s.blocks.find(b=>b.type==='table' && /sesi/i.test(plain(b.headers[0])) && b.headers.some(h=>/^BTC\b/.test(plain(h))));
 if(!t)return {section:s};
 const status=t.headers.findIndex(h=>/status|kelengkapan/i.test(h));
 if(status<0)return {section:s,table:t};
 const complete=t.rows.filter(r=>/lengkap/i.test(plain(r[status])) && !/parsial|belum|tidak lengkap/i.test(plain(r[status])));
 const row=complete.find(r=>/terbaru/i.test(plain(r[status])))||complete.at(-1);
 const partial=t.rows.findLast(r=>/parsial/i.test(plain(r[status])));
 const numeric = v => {
  const s=plain(v).replace(/−/g,'-').replace(/(?:USD|US\$|\$|juta|subtotal|\s)/gi,'');
  if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(s))return null;
  return Number(s.replace(',','.'));
 };
 const million = t.headers.some(h=>/juta/i.test(h)) || /USD\s*juta|juta|\$.*juta/i.test(s.text) || row?.some(v=>/juta/i.test(v));
 const flows={};if(row&&million)for(const asset of ['BTC','ETH','SOL']){const i=t.headers.findIndex(h=>plain(h).startsWith(asset));if(i>=0)flows[asset]=numeric(row[i]);}
 return {section:s,table:t,row,partial,flows,date:row?plain(row[0]):null};
}
function getFx(){
 const s=section(/Kurs USD/i),p=paragraphs(s)[0]||'',text=plain(p),m=text.match(/1\s*USD\s*=\s*Rp\s*([\d.,]+)/i);
 const observation=text.match(/(?:tanggal|observasi)\s+(\d{1,2}\s+\w+\s+20\d{2})/i)?.[1]||text.match(/JISDOR.{0,90}?(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+20\d{2})/i)?.[1]||null;
 return {section:s,text:p,rate:m?m[1].replace(/[.,]+$/,''):null,observation,kind:/JISDOR/i.test(text)?'JISDOR':'Kurs sumber'};
}
function getRotation(){const s=section(/^Rotasi dalam sektor/i);return {section:s,paras:paragraphs(s).filter(p=>!/^(?:Sumber|Pembanding|Catatan)/i.test(plain(p)))};}
function statusFrom(text,type='sector'){
 const s=plain(text).toUpperCase();
 const phrases=type==='btc'?['ROTASI BERTAHAP LAYAK DIPERTIMBANGKAN','TETAP DI BTC','PANTAU BTC → ETH','PANTAU BTC','DATA BELUM CUKUP']:['ROTASI BERTAHAP LAYAK DIPERTIMBANGKAN','PANTAU ROTASI','DATA BELUM CUKUP','TETAP'];
 return phrases.find(p=>s.includes(p)) || 'LIHAT ANALISIS';
}
function getAgenda(){const s=section(/Agenda/i);const table=s?.blocks.find(b=>b.type==='table'&&/Waktu|WITA|Jam/i.test(plain(b.headers[0])));return {section:s,table};}
const monthMap={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
function eventTimes(text){
 const s=plain(text),m=s.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)(?:\s+(20\d{2}))?\s+(\d{1,2})[.:](\d{2})/i);
 if(!m)return [];
 const day=`${m[3]||selected.date.slice(0,4)}-${String(monthMap[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 return [...s.matchAll(/\b(\d{1,2})[.:](\d{2})\b/g)].filter(t=>Number(t[1])<24&&Number(t[2])<60).map(t=>Date.parse(`${day}T${t[1].padStart(2,'0')}:${t[2]}:00+08:00`)).sort((a,b)=>a-b);
}
function eventBadge(text){const times=eventTimes(text);if(!times.length)return '<span class="pill">JADWAL LAPORAN</span>';const now=Date.now(),today=new Date(now+8*3600000).toISOString().slice(0,10);if(selected.date!==today)return '<span class="pill">AGENDA ARSIP</span>';const future=times.filter(t=>t>now),ts=future[0];if(!ts)return '<span class="pill">WAKTU TERLEWATI</span>';return '<span class="pill amber">'+(ts-now<3600000?'&lt;1 jam lagi':Math.ceil((ts-now)/3600000)+' jam lagi')+(times.length>1?' · berikutnya':'')+'</span>';}
function agendaCard(limit=4){
 const {section:s,table}=getAgenda();if(!s)return empty('Agenda belum tersedia pada edisi ini.');
 if(!table)return `<div class="prose">${s.html}</div>`;
 return `<div class="timeline">${table.rows.slice(0,limit).map(r=>`<div class="timeline-item"><div class="time">${esc(plain(r[0]))} WITA ${eventBadge(r[0])}</div><strong>${inline(r[1]||'')}</strong>${r[2]?`<p>${inline(r[2])}</p>`:''}</div>`).join('')}</div>`;
}
function miniMarket(){return `${sectionHead('Market watch','Harga USD & perubahan 24 jam dari laporan.',`<button class="text-button" type="button" data-view="market">Semua sinyal ↗</button>`)}<div class="panel market-panel"><div class="table-container">${marketTable(false)}</div></div>`;}
function marketTable(full=true){
 let rows=selected.prices.filter(p=>(filter==='all'||(filter==='up'&&p.change>0)||(filter==='down'&&p.change<0)||p.signal?.toLowerCase()===filter)&&(!query||(`${p.asset} ${names[p.asset]}`).toLowerCase().includes(query.toLowerCase())));
 if(!full)rows=selected.prices;
 if(full&&sort==='change')rows.sort((a,b)=>(b.change??-Infinity)-(a.change??-Infinity));
 if(full&&sort==='asset')rows.sort((a,b)=>a.asset.localeCompare(b.asset));
 const previous=reports.find(r=>r.date===compare);
 return `<table class="market-table"><thead><tr><th><button type="button" data-sort="asset">Aset ${full?'↕':''}</button></th><th>Harga USD</th><th><button type="button" data-sort="change">24 jam ${full?'↕':''}</button></th>${full?'<th class="compare-col">Δ antar-snapshot</th>':''}<th class="spark-col">Jejak snapshot</th><th>Sinyal spot</th><th><span class="sr-only">Detail</span></th></tr></thead><tbody>${rows.length?rows.map(p=>{
 const before=previous?.prices.find(x=>x.asset===p.asset);const delta=before?.price>0&&Number.isFinite(p.price)?(p.price/before.price-1)*100:null;
 const points=pointsFor(p.asset,21);return `<tr data-asset="${p.asset}"><td>${assetLabel(p.asset)}</td><td class="price-cell">${usd(p.price)}</td><td class="change-cell ${signClass(p.change)}">${pct(p.change)}</td>${full?`<td class="compare-col ${signClass(delta)}">${pct(delta)}<small class="muted" style="display:block;font-size:8px">${previous?esc(fmtDate(previous.date,true)):'Pilih pembanding'}</small></td>`:''}<td class="spark-col">${points.length>1?chart(points,{small:true,color:p.change<0?'var(--red)':'var(--green)',label:`Jejak ${p.asset}, ${points.length} snapshot arsip`}):'—'}</td><td>${signal(p.signal)}</td><td><button type="button" class="row-open" data-action="asset" data-asset="${p.asset}" aria-label="Analisis ${p.asset}">↗</button></td></tr>`;
 }).join(''):`<tr><td colspan="7">Tidak ada aset yang cocok. Ubah filter atau kata kunci.</td></tr>`}</tbody></table>`;
}
function overview(){
 const s=summary(),items=listItems(s),paras=paragraphs(s),lead=leadParts(items[0]||paras[0]||'Baca snapshot pasar dan konteks lengkap pada laporan.');
 const up=selected.prices.filter(p=>p.change>0).length,down=selected.prices.filter(p=>p.change<0).length,flat=selected.prices.length-up-down;
 const counts={BUY:0,HOLD:0,SELL:0};selected.prices.forEach(p=>{if(p.signal in counts)counts[p.signal]++;});
 const fx=getFx(),etf=getEtf(),btcRot=section(/^Rotasi BTC/i),btcStatus=statusFrom(paragraphs(btcRot)[0],'btc');
 const changes=section(/Yang berubah|Perubahan penting/i),changeItems=listItems(changes);
 const mainCards=(items.length?items:paras.filter(p=>!/^Sumber/i.test(plain(p)))).slice(0,3);
 return `<div class="btc-entry-strip"><div><strong>BTC Risk Desk kini satu tempat.</strong><span>Analisis terbaru, tracker setup, dan agenda BTC.</span></div><button class="button" type="button" data-view="btc">Buka BTC Desk →</button></div><div class="overview-top"><section class="panel brief-hero"><div><div class="eyebrow">THE DAILY READ <span style="padding:0 7px">/</span> ${esc(fmtDate(selected.date,true).toUpperCase())}</div><h2>${esc(lead.title)}</h2><p>${esc(clip(lead.body,235))}</p></div><div class="hero-bottom"><span class="hero-signal-note">${counts.BUY?`${counts.BUY} label BUY pada laporan. Periksa pemicu dan invalidasi.`:'Belum ada label BUY pada data yang terbaca. Periksa alasan dan invalidasi.'}</span><button class="button primary" type="button" data-view="market">Buka signal desk ${icon('arrow')}</button></div></section><section class="panel pulse-panel"><h3>Sebaran pergerakan</h3><div class="pulse-main"><strong class="${down>up?'negative':'positive'}">${down>up?down:up}<span style="font-size:21px;color:var(--muted);font-weight:450">/${selected.prices.length}</span></strong><span>aset ${down>up?'turun':'naik'} / 24j</span></div><div class="breadth-bar"><span style="width:${up/Math.max(1,selected.prices.length)*100}%;background:var(--green)"></span><span style="width:${down/Math.max(1,selected.prices.length)*100}%;background:var(--red)"></span>${flat?`<span style="width:${flat/selected.prices.length*100}%;background:var(--muted)"></span>`:''}</div><div class="breadth-key"><span><i style="background:var(--green)"></i>${up} naik</span><span><i style="background:var(--red)"></i>${down} turun</span>${flat?`<span>${flat} datar</span>`:''}</div><div class="pulse-signals"><span><b class="positive">${counts.BUY}</b>BUY</span><span><b style="color:var(--amber)">${counts.HOLD}</b>HOLD</span><span><b class="negative">${counts.SELL}</b>SELL</span></div><p class="pulse-note">Hanya aset pantauan, bukan keseluruhan pasar. Sinyal terpisah dari perubahan 24 jam.</p></section></div>
 <div class="quick-grid"><button type="button" class="quick-card" ${fx.section?`data-section="${fx.section.id}"`:''}><span class="quick-icon">${icon('dollar')}</span><div><span class="eyebrow">USD / IDR</span><strong>${fx.rate?'Rp '+esc(fx.rate):'Belum terbaca'}</strong><p>${fx.rate?'1 USD · '+esc(fx.kind)+(fx.observation?'<br>'+esc(fx.observation):' / lihat tanggal'):'Kurs mengikuti sumber laporan'}</p></div><span class="card-arrow">↗</span></button><button type="button" class="quick-card" ${etf.section?`data-section="${etf.section.id}"`:''}><span class="quick-icon">${icon('chart')}</span><div><span class="eyebrow">ETF BTC · LENGKAP</span><strong class="${signClass(etf.flows?.BTC)}">${Number.isFinite(etf.flows?.BTC)?(etf.flows.BTC>0?'+':'−')+'$'+num(Math.abs(etf.flows.BTC),1)+' jt':'Lihat laporan'}</strong><p>${etf.date?'Sesi AS '+esc(etf.date):'Tanggal & status di sumber'}${etf.partial?'<br>'+esc(plain(etf.partial[0]))+' masih parsial':''}</p></div><span class="card-arrow">↗</span></button><button type="button" class="quick-card" data-view="rotation"><span class="quick-icon">${icon('rotation')}</span><div><span class="eyebrow">BTC → ETH</span><strong style="font-size:14px">${esc(btcStatus==='TETAP DI BTC'?'Tetap di BTC':btcStatus==='LIHAT ANALISIS'?'Lihat analisis':btcStatus)}</strong><p>Penilaian relatif, bukan BUY BTC</p></div><span class="card-arrow">↗</span></button></div>
 ${sectionHead('Tiga hal yang perlu kamu tahu','Inti laporan, sebelum masuk ke angka.')}<div class="insight-grid">${mainCards.length?mainCards.map((x,i)=>{const p=leadParts(x);return `<article class="insight-card"><span class="insight-number">0${i+1}</span><h3>${esc(p.title)}</h3><p>${esc(clip(p.body,260))}</p>${openButton(s,'Baca selengkapnya')}</article>`;}).join(''):empty()}</div>
 ${miniMarket()}
 <div class="overview-bottom"><section class="panel"><div class="panel-head"><div><h3>Yang berubah</h3><p>${changes?esc(changes.title):'Perubahan dari edisi sebelumnya'}</p></div>${openButton(changes,'Detail ↗')}</div><div class="changes-list">${changeItems.length?changeItems.slice(0,4).map(x=>`<div class="change-item">${inline(x)}</div>`).join(''):empty('Belum ada ringkasan perubahan yang terpisah pada edisi ini.')}</div></section><section class="panel"><div class="panel-head"><div><h3>Agenda yang dipantau</h3><p>Waktu Indonesia Tengah · UTC+8</p></div><span class="pill">WITA</span></div>${agendaCard(3)}<div style="margin-top:18px">${openButton(getAgenda().section,'Semua agenda')}</div></section></div>
 <section class="story-banner"><div><div class="eyebrow">SWITCH THE PERSPECTIVE</div><h3>Pasar, satu cerita tiap tap.</h3><p>Versi singkat untuk menangkap inti. Kamu yang atur temponya.</p></div><div class="story-art" aria-hidden="true"><span>BTC</span><span>↗</span><span>ETH</span></div><button type="button" class="button dark" data-action="stories">${icon('play')} Buka Stories</button></section>`;
}
function signalContext(){const s=section(/Level pantauan|Zona teknikal/i);return s?paragraphs(s).filter(p=>/konfirmasi|penilaian|masa berlaku|timeframe|4H|4 jam|BUY.*SELL|SELL.*HOLD/i.test(plain(p))).slice(0,4):[];}
function market(){
 const lev=section(/Level pantauan|Zona teknikal/i);
 return `<div class="market-toolbar"><div class="segmented" aria-label="Filter aset">${[['all','Semua'],['buy','BUY'],['hold','HOLD'],['sell','SELL'],['up','Naik'],['down','Turun']].map(([id,label])=>`<button type="button" data-filter="${id}" class="${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><label class="compare-control">Bandingkan snapshot<select id="comparison" aria-label="Tanggal pembanding"><option value="">Tanpa perbandingan</option>${reports.filter(r=>r!==selected).map(r=>`<option value="${r.date}" ${compare===r.date?'selected':''}>${esc(fmtDate(r.date))}</option>`).join('')}</select></label><input class="table-search" id="asset-search" placeholder="Cari BTC, Ethereum, HYPE…" value="${esc(query)}" aria-label="Cari aset"></div><div class="panel market-panel"><div class="table-container" id="market-table">${marketTable()}</div></div><p class="note">Δ antar-snapshot = perubahan dari harga edisi pembanding ke edisi terpilih; bukan perubahan 24 jam. Jejak grafik berasal dari snapshot arsip bertanggal dengan waktu dan penyedia yang dapat berbeda, bukan candle bursa.</p>
 ${sectionHead('Konteks di balik pergerakan','Pilih aset untuk menelusuri jejak snapshot dan alasan sinyal.')}<div class="chart-grid"><section class="panel"><div class="chart-header"><div><div class="eyebrow">JEJAK SNAPSHOT ARSIP</div><h3 style="margin:8px 0">${esc(names[chartAsset])} <span class="muted">/ USD</span></h3></div><select id="chart-asset" class="chart-asset-select" aria-label="Aset grafik">${Object.keys(names).map(a=>`<option ${a===chartAsset?'selected':''}>${a}</option>`).join('')}</select></div><div class="chart-value">${usd(selected.prices.find(p=>p.asset===chartAsset)?.price)}</div><div class="segmented" style="margin-top:12px"><button type="button" data-range="7" class="${chartRange===7?'active':''}">7 hari kalender</button><button type="button" data-range="21" class="${chartRange===21?'active':''}">21 hari kalender</button></div><div class="chart-wrap">${chart(pointsFor(chartAsset,chartRange),{label:`${chartAsset}: jejak snapshot arsip`,id:'asset'})}</div><div class="chart-tooltip" id="chart-tooltip-asset"><span>Arahkan / sentuh titik untuk melihat observasi</span><b>${pointsFor(chartAsset,chartRange).length} snapshot</b></div><p class="note">Titik adalah harga di setiap laporan. Garis putus-putus hanya menghubungkan titik; tidak mengisi candle atau harga yang hilang.</p></section><section class="panel"><div class="panel-head"><div><h3>Peta pergerakan 24 jam</h3><p>Sebaran aset pantauan pada edisi ini</p></div></div><div class="heatmap">${selected.prices.map(p=>`<button type="button" class="heat-cell ${signClass(p.change)}" data-action="asset" data-asset="${p.asset}"><b>${p.asset}</b><span>${pct(p.change)}</span></button>`).join('')}</div><p class="note">Warna menunjukkan perubahan harga, bukan penilaian murah/mahal atau konfirmasi sinyal.</p></section></div>
 ${sectionHead('Signal desk','Alasan, pemicu perubahan, dan invalidasi. Label mengikuti edisi.',openButton(lev,'Metode & konteks'))}<div class="signal-legend"><span>${signal('BUY')} Setup spot terkonfirmasi</span><span>${signal('SELL')} Bias mengurangi risiko spot</span><span>${signal('HOLD')} Tunggu / tidak menambah transaksi</span></div>${infoNote('SELL bukan instruksi short. HOLD bukan jaminan aman menahan posisi. Sinyal berlaku sampai laporan berikutnya atau invalidasi, mana lebih dahulu; periksa timestamp sumber.')}<div class="level-grid" style="margin-top:17px">${selected.levels.length?selected.levels.map(l=>`<article class="panel level-card"><div class="panel-head">${assetLabel(l.asset)}${signal(l.signal)}</div><div class="level-block"><small>SUPPORT · SESUAI MATA UANG LAPORAN</small><p>${esc(l.support||'Belum terverifikasi')}</p></div><div class="level-block"><small>RESISTANCE</small><p>${esc(l.resistance||'Belum terverifikasi')}</p></div><div class="level-block"><small>PEMICU & ALASAN</small><p>${esc(l.reason||'Belum terverifikasi')}</p></div><div class="level-block"><small>INVALIDASI / PERUBAHAN LABEL</small><p>${esc(l.invalidation||'Belum terverifikasi')}</p></div><div class="level-block"><small>HORIZON</small><p>${esc(l.horizon||'Lihat sumber')}</p></div><button type="button" class="text-button" data-action="asset" data-asset="${l.asset}">Analisis ${l.asset} ↗</button></article>`).join(''):empty('Format edisi lama belum memuat tabel sinyal lengkap. Baca zona teknikal pada laporan asli; dashboard tidak membuat label baru.')}</div><div class="signal-definition">${signalContext().map(inline).join('<br><br>')}</div>${sectionHead('Drawdown & pengukuran','Ukuran rolling hanya mengikuti histori dan metode dalam laporan.')}<div class="panel prose">${renderSection(section(/Drawdown|puncak rolling/i),false)}</div>`;
}
function rotation(){
 const r=getRotation(),perp=r.paras.find(p=>/perpetual|perp DEX|HYPE\s*[→-]/i.test(plain(p))),rwa=r.paras.find(p=>/RWA|ONDO\s*[→-]/i.test(plain(p))),btc=section(/^Rotasi BTC/i),b=paragraphs(btc)[0];
 const card=(kicker,route,p,s,wide=false)=>`<article class="panel rotation-card ${wide?'rotation-btc':''}"><div class="panel-head"><span class="eyebrow">${kicker}</span><span class="pill ${/PANTAU/.test(statusFrom(p,wide?'btc':'sector'))?'amber':''}">${esc(statusFrom(p,wide?'btc':'sector'))}</span></div><div class="route">${route}</div><p class="rotation-body">${p?inline(p):'Analisis pasangan belum tersedia pada edisi ini.'}</p>${openButton(s,'Pemicu, invalidasi & bukti')}${sourceChips(s,3)?`<div style="margin-top:12px">${sourceChips(s,3)}</div>`:''}</article>`;
 return `${infoNote('Status rotasi menilai keunggulan relatif, terpisah dari sinyal BUY/SELL aset. Kandidat dan aset asal tetap bisa sama-sama turun dalam USD.')}<div class="rotation-grid" style="margin-top:20px">${card('01 / PERPETUAL DEX','HYPE <span class="route-arrow">→</span> ASTER / LIT',perp,r.section)}${card('02 / RWA','ONDO <span class="route-arrow">→</span> RWA lain',rwa,r.section)}${card('03 / ROTASI LINTAS ASET','BTC <span class="route-arrow">→</span> ETH',b,btc,true)}</div><p class="rotation-disclaimer">Rotasi bertahap baru layak dipertimbangkan bila pemicu terkonfirmasi dan keunggulannya bertahan setelah fees, spread, slippage, dan pajak relevan. Label adalah heuristik analitis; tidak mengasumsikan kepemilikan atau memindahkan aset apa pun.</p>${sectionHead('Riset pembanding sektor','Valuasi, likuiditas, penggunaan, dan value capture — baca satu paket.')}<div class="panel prose">${renderSection(r.section,false)}</div>${sectionHead('BTC → ETH: konteks lengkap','Rasio ETH/BTC, ETF pada sesi yang sama, dan risiko makro.')}<div class="panel prose">${renderSection(btc,false)}</div>`;
}
function oilPanel(){
 const s=section(/Minyak.*bulan/i),points=selected.oil;
 if(!points.length)return `<section class="panel"><h3>Minyak — 1 bulan</h3>${empty('Grafik belum tersedia: observasi harian belum terbaca pada edisi ini.')}${openButton(s)}</section>`;
 const first=points[0],last=points.at(-1),change=(last.value/first.value-1)*100,delay=Math.round((Date.parse(selected.date)-Date.parse(last.date))/86400000);
 return `<section class="panel"><div class="panel-head"><div><h3>Minyak — 1 bulan</h3><p>${esc(selected.oilName)} · observasi dalam laporan</p></div><span class="pill ${delay>3?'amber':''}">${delay>0?'TERTINGGAL '+delay+' HARI':'AS OF LAPORAN'}</span></div><div class="oil-stats"><div><small>Observasi terakhir · ${esc(fmtDate(last.date,true))}</small><strong>$${num(last.value)}</strong></div><div><small>Pertama → terakhir</small><strong class="${signClass(change)}">${pct(change)}</strong></div></div><div class="chart-wrap">${chart(points,{label:`${selected.oilName}: ${first.date} sampai ${last.date}`,id:'oil',color:'var(--amber)'})}</div><div class="chart-tooltip" id="chart-tooltip-oil"><span>${esc(fmtDate(first.date,true))}–${esc(fmtDate(last.date,true))}</span><b>${points.length} observasi tersedia</b></div><p class="note">Garis hanya penghubung; hari tanpa observasi tidak diisi. Perubahan dihitung antar-observasi pertama dan terakhir, bukan otomatis return 30 hari penuh. Spot dan futures tidak digabung.</p>${openButton(s,'Seri, tabel harian & sumber')}<div style="margin-top:10px">${sourceChips(s,4)}</div></section>`;
}
function macro(){
 const etf=getEtf(),fx=getFx(),geo=section(/Skenario geopolitik/i),t=geo?.blocks.find(b=>b.type==='table'&&/skenario/i.test(b.headers[0]));
 return `${sectionHead('Arus ETF','Sesi AS lengkap dan parsial dibedakan; kosong bukan nol.',openButton(etf.section))}<section class="panel"><div class="panel-head"><div><h3>${etf.date?'Sesi lengkap · '+esc(etf.date):'Kelengkapan mengikuti laporan'}</h3><p>Arus bersih ETF · USD juta</p></div><span class="pill green">${etf.row?'LENGKAP':'LIHAT SUMBER'}</span></div>${etf.row&&Object.keys(etf.flows||{}).length?`<div class="etf-grid">${['BTC','ETH','SOL'].map(a=>`<div class="etf-stat">${assetLabel(a)}<strong class="${signClass(etf.flows[a])}">${Number.isFinite(etf.flows[a])?(etf.flows[a]>=0?'+':'−')+'$'+num(Math.abs(etf.flows[a]),1):'—'}</strong><small>juta USD · sesi ${esc(etf.date)}</small></div>`).join('')}</div>`:''}${etf.partial?infoNote('Sesi '+esc(plain(etf.partial[0]))+' masih <strong>parsial</strong> pada cutoff laporan. Subtotal tidak menggantikan total sesi lengkap.') : ''}<div class="prose" style="margin-top:18px">${renderSection(etf.section,false)}</div></section>
 ${sectionHead('Energi, dolar, dan konteks','Baca tanggal observasi sebelum menghubungkannya dengan berita.')}<div class="macro-grid">${oilPanel()}<section class="panel"><div class="panel-head"><div><h3>Kurs USD/IDR</h3><p>Acuan konversi dan konteks rupiah</p></div>${icon('dollar')}</div><div class="chart-value" style="margin:22px 0 20px">${fx.rate?'Rp '+esc(fx.rate):'Belum terverifikasi'}</div><div class="prose">${renderSection(fx.section,false)}</div></section></div>
 ${sectionHead('Skenario geopolitik','Kemungkinan bersyarat — bukan ramalan atau probabilitas.')}<div class="panel prose" style="margin-bottom:16px">${paragraphs(geo).slice(0,2).map(p=>`<p>${inline(p)}</p>`).join('')||empty()}</div>${t?`<div class="scenario-grid">${t.rows.map(r=>`<article class="panel scenario-card"><h3>${inline(r[0])}</h3>${r.slice(1).map((c,i)=>`<div class="scenario-cell"><small>${esc(plain(t.headers[i+1])).toUpperCase()}</small><p>${inline(c)}</p></div>`).join('')}</article>`).join('')}</div>`:`<div class="panel prose">${renderSection(geo,false)}</div>`}<div style="margin-top:15px">${openButton(geo,'Berita aktual, pembatal skenario & sumber')}</div>
 ${sectionHead('Agenda berikutnya','Jadwal sesuai edisi, seluruhnya WITA / UTC+8.')}<section class="panel">${agendaCard(12)}<div style="margin-top:20px">${openButton(getAgenda().section,'Konteks & sumber kalender')}</div></section>`;
}
function researchSection(asset){
 let s=selected.sections.find(s=>new RegExp('(?:Fundamental|Riset).*\\b'+asset+'\\b','i').test(s.title) && !/QNT.*HYPE.*LINK/.test(s.title));
 if(s)return s;
 const grouped=selected.sections.find(s=>/Fundamental/i.test(s.title));
 if(!grouped)return null;
 const start=grouped.blocks.findIndex(b=>b.type==='heading'&&new RegExp('^'+asset+'\\b').test(plain(b.text)));
 if(start<0)return null;
 let end=grouped.blocks.findIndex((b,i)=>i>start&&b.type==='heading'&&b.level===grouped.blocks[start].level);if(end<0)end=grouped.blocks.length;
 const blocks=grouped.blocks.slice(start+1,end);return {...grouped,title:asset+' — riset fundamental',blocks};
}
function research(){
 const unlock=section(/Unlock/i),others=section(/Fundamental aset (?:utama |lain)/i),macroMove=section(/Mengapa|Apa yang sedang terjadi/i);
 return `${infoNote('Bisnis yang berkembang belum tentu meningkatkan permintaan token. TVL/AUM, volume, fees, revenue, buyback, burn, dan locking adalah metrik berbeda.')}<div class="research-grid" style="margin-top:20px">${['QNT','HYPE','LINK','ONDO'].map(a=>{
 const s=researchSection(a),paras=paragraphs(s);return `<article class="panel research-card"><div class="panel-head"><div class="asset-name">${coin(a)}<span><h3>${a}</h3><small>${names[a]}</small></span></div>${signal(selected.prices.find(p=>p.asset===a)?.signal)}</div><div class="research-text">${paras.length?paras.slice(0,2).map(p=>`<p>${inline(p)}</p>`).join(''):empty('Riset terpisah belum tersedia; buka laporan lengkap.')}</div>${openButton(s,'Audit lengkap: adopsi, token & supply')}<div style="margin-top:12px">${sourceChips(s,3)}</div></article>`;
 }).join('')}</div>${sectionHead('Suplai & unlock watch','Jendela dan jumlah hanya mengikuti bukti pada laporan.',openButton(unlock))}<div class="panel prose">${renderSection(unlock,false)}</div>${sectionHead('Fundamental aset lainnya','Konteks BTC, ETH, SOL, BNB, dan XRP.')}<div class="panel prose">${renderSection(others,false)}</div>${sectionHead('Fakta & interpretasi pasar','Peristiwa yang terverifikasi dipisahkan dari dugaan sebab pergerakan.')}<div class="panel prose">${renderSection(macroMove,false)}</div>${sectionHead('Perbandingan Signal Deck','Baseline bertanggal, bukan data hari ini.')}<div class="panel prose">${renderSection(section(/Signal Deck/i),false)}</div>`;
}
function library(){
 return `<div class="report-tools"><button type="button" class="button primary" data-action="stories">${icon('play')} Buka Stories</button><a class="button" href="${location.pathname==='/hub'?'/hub-assets':''}/reports/${selected.date}.md" download>Unduh Markdown ↓</a><a class="button" href="${esc(selected.source)}" target="_blank" rel="noopener noreferrer">Laporan GitHub ↗</a><button type="button" class="button" data-action="share">${icon('link')} Salin tautan</button></div>${sectionHead('Arsip briefing',reports.length+' edisi tersedia · pilih tanggal untuk membuka konteks saat itu.')}<div class="archive-grid">${reports.map(r=>`<button type="button" class="archive-card ${r===selected?'active':''}" data-date="${r.date}" aria-pressed="${r===selected}"><strong>${esc(fmtDate(r.date))}</strong><span>${r.prices.length} aset · ${r.sources.length} tautan sumber ${r===selected?'· DIPILIH':''}</span></button>`).join('')}</div>${sectionHead('Laporan lengkap',esc(selected.snapshot))}<div class="read-layout"><nav class="toc-panel" aria-label="Daftar isi laporan"><h3>DALAM LAPORAN INI</h3>${selected.sections.map(s=>`<a href="#${s.id}" data-jump="${s.id}">${esc(s.title)}</a>`).join('')}</nav><article class="panel prose" id="full-report"><div class="report-intro">${selected.intro}</div>${selected.sections.map(s=>renderSection(s)).join('')}</article></div>${sectionHead('Sumber & jejak riset','Tautan yang dicantumkan laporan. Keberadaan tautan bukan audit ulang oleh dashboard.')}<div class="source-grid">${selected.sources.map(s=>{let host;try{host=new URL(s.url).hostname.replace(/^www\./,'');}catch(e){return '';}return `<a class="source-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗<small>${esc(host)}</small></a>`;}).join('')}</div>`;
}
function btc(){return window.btcHub?window.btcHub.render():empty('BTC Risk Desk belum dimuat. Muat ulang halaman.');}
function portfolio(){return window.portfolioHub?window.portfolioHub.render():empty();}
function render({url=true,scroll=false}={}){
 const v=views[view];dateSelect.value=selected.date;
 $('#page-title').innerHTML=v.title;$('#page-subtitle').textContent=v.subtitle;$('#view-name').textContent=v.nav;
 $('#edition').textContent=`MARKET INTELLIGENCE / ${fmtDate(selected.date,true).toUpperCase()}`;
 $('#snapshot-time').textContent=selected.snapshot.match(/\d{1,2}[.:]\d{2}(?:[–-]\d{1,2}[.:]\d{2})?\s*WITA/)?.[0] || 'Waktu terperinci di laporan';
 $('#snapshot-label').textContent=fmtDate(selected.date)+' · '+(selected===reports[0]?'Edisi terbaru di arsip':'Edisi arsip')+' · Harga bukan live';
 $('#source-footer').href=selected.source;
 $('#older').disabled=reports.indexOf(selected)===reports.length-1;$('#newer').disabled=selected===reports[0];
 $$('[data-view]').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 content.innerHTML=({overview,market,rotation,macro,research,library,btc,portfolio}[view])();
 if(view==='portfolio'){ $('#snapshot-label').textContent='Area pribadi · Terkunci PIN · Tidak ikut arsip publik'; window.portfolioHub?.mount(); }
 if(view==='btc'){ $('#snapshot-label').textContent='BTC terbaru · Tidak mengikuti tanggal arsip · Periksa timestamp feed'; window.btcHub?.mount(); }
 content.classList.remove('content-enter');void content.offsetWidth;content.classList.add('content-enter');
 document.title=`${v.nav} · ${fmtDate(selected.date)} — Market Notes`;
 if(url){const u=new URL(location.href);u.searchParams.set('date',selected.date);if(view!=='overview')u.searchParams.set('view',view);else u.searchParams.delete('view');u.hash='';history[url==='push'?'pushState':'replaceState']({},'',u);}
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function navigate(next){if(!views[next]||next===view)return;view=next;filter='all';query='';render({scroll:true,url:'push'});}
function changeDate(d){const r=reports.find(r=>r.date===d);if(!r||r===selected)return;selected=r;compare=reports[reports.indexOf(r)+1]?.date||'';filter='all';query='';render({scroll:true,url:'push'});}
function showModal(dialog){lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');}
function closeModal(d){d.close();document.body.classList.toggle('modal-open',$$('dialog[open]').length>0);if(lastFocus?.isConnected)lastFocus.focus();}
function detail(title,html,sub=''){
 $('#detail-content').innerHTML=`<h2 id="detail-title">${esc(title)}</h2>${sub?`<p class="detail-sub">${esc(sub)}</p>`:''}${html}`;
 if(!$('#detail-dialog').open)showModal($('#detail-dialog'));else $('#detail-dialog').scrollTop=0;
}
function openSection(id){const s=selected.sections.find(s=>s.id===id);if(!s)return;const open=$('#search-dialog');if(open.open)closeModal(open);detail(s.title,`<div class="prose">${s.html}</div><div class="detail-sub" style="margin-top:24px">${esc(fmtDate(selected.date))} · <a href="${esc(selected.source)}" target="_blank" rel="noopener noreferrer">Laporan asli ↗</a></div>`,selected.snapshot);}
function openAsset(a){
 const p=selected.prices.find(p=>p.asset===a);if(!p)return;const l=selected.levels.find(l=>l.asset===a),before=reports.find(r=>r.date===compare)?.prices.find(p=>p.asset===a),change=before?.price>0?(p.price/before.price-1)*100:null;
 const rs=researchSection(a),lev=section(/Level pantauan|Zona teknikal/i);
 detail(`${names[a]} / ${a}`,`<div>${signal(p.signal)}</div><div class="detail-stats"><div class="detail-stat"><small>HARGA USD</small><strong>${usd(p.price)}</strong></div><div class="detail-stat"><small>PERUBAHAN 24 JAM</small><strong class="${signClass(p.change)}">${pct(p.change)}</strong></div><div class="detail-stat"><small>VS ${compare?esc(fmtDate(compare,true).toUpperCase()):'PEMBANDING'}</small><strong class="${signClass(change)}">${pct(change)}</strong></div></div><p class="note">Perubahan antar-snapshot terpisah dari 24 jam penyedia. Grafik berikut adalah sampel arsip, bukan candle teknikal.</p><div class="chart-wrap">${chart(pointsFor(a,21),{label:`${a}: jejak snapshot 21 hari kalender`,id:'detail'})}</div><div class="chart-tooltip" id="chart-tooltip-detail"><span>Arahkan / sentuh titik untuk observasi</span><b>${pointsFor(a,21).length} snapshot</b></div><h3 style="margin-top:25px">Mengapa label ini?</h3>${l?`<div class="detail-levels">${[['SUPPORT',l.support],['RESISTANCE',l.resistance],['PEMICU & ALASAN',l.reason],['INVALIDASI / PERUBAHAN LABEL',l.invalidation],['HORIZON',l.horizon]].map(([k,v])=>`<div><small>${k}</small><p>${esc(v||'Belum terverifikasi')}</p></div>`).join('')}</div>`:empty('Tabel label teknikal lengkap belum tersedia pada edisi ini. Dashboard tidak membuat sinyal baru.')}<div class="signal-definition">SELL = bias mengurangi risiko spot, bukan membuka short. HOLD = tunggu / tidak menambah transaksi, bukan jaminan aman. BUY hanya mengikuti setup terkonfirmasi dalam laporan. Berlaku sampai laporan berikutnya atau invalidasi, mana lebih dahulu.</div><div class="prose">${signalContext().slice(0,2).map(x=>`<p>${inline(x)}</p>`).join('')}</div><div class="report-tools">${openButton(lev,'Metode & masa berlaku')}${rs?openButton(rs,'Riset fundamental'):''}<a class="text-button" href="${esc(selected.source)}" target="_blank" rel="noopener noreferrer">Sumber laporan ↗</a></div>`,selected.snapshot);
}
function quality(){
 const etf=getEtf(),fx=getFx(),oil=selected.oil.at(-1),intro=selected.intro;
 detail('Kualitas & umur data',`<div class="data-quality"><div class="quality-metric"><div class="eyebrow">HARGA</div><strong>${selected.prices.length} aset</strong><p>Snapshot laporan. Memuat ulang dashboard tidak mengambil harga baru.</p></div><div class="quality-metric"><div class="eyebrow">ETF</div><strong>${etf.partial?'Ada data parsial':etf.date?'Sesi bertanggal':'Lihat laporan'}</strong><p>${etf.date?'Sesi lengkap '+esc(etf.date)+'. ':''}Blank tidak diasumsikan nol; setiap seri bisa berbeda cutoff.</p></div><div class="quality-metric"><div class="eyebrow">MINYAK</div><strong>${oil?esc(fmtDate(oil.date,true)):'Belum tersedia'}</strong><p>${oil?'Observasi terakhir dalam tabel. Tidak mewakili harga spot terkini.':'Tidak membuat titik grafik tanpa data.'}</p></div></div><h3 style="margin-top:25px">Timestamp & batas dalam sumber</h3><div class="prose">${intro}</div>${fx.section?`<h3 style="margin-top:20px">Kurs referensi</h3><div class="prose"><p>${inline(fx.text)}</p></div>`:''}<div class="signal-definition">Angka yang tidak dapat dibaca ditampilkan sebagai tidak tersedia, bukan nol. Grafik kripto memakai snapshot laporan dan tidak menggantikan histori candle untuk konfirmasi teknikal. Seluruh ringkasan dashboard mengikuti isi arsip, tanpa verifikasi ulang otomatis.</div>`,fmtDate(selected.date));
}
function guide(){
 const terms=[['BUY / SELL / HOLD','BUY berarti setup beli spot terkonfirmasi pada laporan. SELL adalah bias mengurangi atau keluar dari risiko spot, bukan instruksi short. HOLD berarti menunggu atau tidak menambah transaksi, bukan jaminan aman menahan posisi. Semua label bertanggal dan bisa terinvalidasi.'],['Support, resistance & invalidasi','Support adalah area yang dipantau untuk respons pembeli; resistance untuk hambatan pemulihan. Keduanya bukan kepastian. Invalidasi menjelaskan kondisi yang membatalkan analisis, dengan candle dan timeframe yang disebut laporan.'],['24 jam vs antar-snapshot vs drawdown','Perubahan 24 jam berasal dari penyedia harga. Antar-snapshot membandingkan dua harga laporan yang waktunya bisa berbeda lebih atau kurang dari 24 jam. Drawdown mengukur jarak dari puncak pada jendela tertentu; sampled high tidak sama dengan tick high atau ATH.'],['Rotasi & relative strength','Rotasi membandingkan kinerja kandidat terhadap aset asal. ETH naik dalam USD belum tentu unggul terhadap BTC. Rasio ETH/BTC harus menguat untuk menunjukkan keunggulan relatif. Keduanya tetap bisa turun dalam USD.'],['ETF lengkap vs parsial','Sesi lengkap dan subtotal parsial tidak boleh dicampur. Kolom penerbit yang kosong bukan nol. Perbandingan BTC/ETH lebih bermakna pada sesi lengkap yang sama dan terhadap AUM jika tersedia.'],['Bisnis vs manfaat token','TVL/AUM mengukur aset; volume mengukur aktivitas; fees dan revenue punya definisi berbeda. Pertumbuhan produk hanya mendukung permintaan token bila ada mekanisme yang terbukti. Buyback-held, staking/locking, dan burn tidak sama.'],['Supply, unlock & FDV','Unlock dapat menambah token yang dapat beredar, tetapi tidak otomatis langsung dijual. FDV adalah valuasi pada basis supply yang dinyatakan. Net supply pressure perlu angka release, burn, dan perubahan net locking pada periode yang sama.'],['Cara membaca dashboard','Mulai dari Ringkasan, buka Pasar untuk alasan sinyal, Rotasi untuk pasangan relatif, Makro untuk konteks, Riset untuk fundamental, dan Arsip untuk laporan utuh. Cari topik lewat tombol pencarian atau Ctrl/⌘ K. Stories memakai tap, swipe, atau tombol panah tanpa timer.']];
 detail('Panduan membaca pasar',`<div class="glossary-list">${terms.map(([a,b])=>`<div><h3>${a}</h3><p>${b}</p></div>`).join('')}</div>`,'Istilah singkat, konteks tetap lengkap.');
}
function searchResults(q){
 const term=q.trim().toLowerCase();const matches=selected.sections.filter(s=>!term || (s.title+' '+s.text+' '+s.html.replace(/<[^>]*>/g,' ')).toLowerCase().includes(term));
 $('#search-results').innerHTML=matches.length?matches.map(s=>{
 const text=s.text.replace(/\n/g,' ');const pos=term?text.toLowerCase().indexOf(term):0;const excerpt=pos>80?'…'+text.slice(pos-55,pos+130):text.slice(0,190);
 return `<button type="button" class="search-result" data-section="${s.id}"><strong>${esc(s.title)} ↗</strong><span>${esc(clip(excerpt,190))}</span></button>`;
 }).join(''):empty('Tidak ada hasil pada edisi ini. Coba istilah lain atau ganti tanggal laporan.');
}
function search(){searchResults('');showModal($('#search-dialog'));$('#search-input').value='';$('#search-input').focus();}
function makeSlides(){
 const s=summary(),items=listItems(s),paras=paragraphs(s),rot=getRotation(),btc=section(/^Rotasi BTC/i),fx=getFx(),geo=section(/Skenario geopolitik/i),agenda=getAgenda(),etf=getEtf();
 const out=[{kicker:'YOUR DAILY MARKET BRIEF',title:'Baca pasar.\nPahami alasannya.',html:`<div class="story-number">${selected.prices.length}<span style="font-size:24px;letter-spacing:-1px"> aset</span></div><p>${esc(fmtDate(selected.date))}<br>${esc($('#snapshot-time').textContent)}</p><p>Harga dan analisis mengikuti edisi laporan. Bukan harga live.</p>`}];
 (items.length?items:paras.filter(p=>!/^Sumber/i.test(plain(p)))).slice(0,3).forEach((x,i)=>{const l=leadParts(x);out.push({kicker:`INTI BRIEF / 0${i+1}`,title:l.title,html:`<p>${esc(l.body)}</p>`,section:s?.id});});
 out.push({kicker:'MARKET WATCH / USD',title:'Pergerakan dalam\n24 jam.',html:`<div class="story-prices">${selected.prices.map(p=>`<div class="story-price"><b>${p.asset}</b><strong>${usd(p.price)}</strong><span class="${signClass(p.change)}">${pct(p.change)}</span></div>`).join('')}</div><p class="story-note">Harga agregat snapshot; perubahan 24 jam terpisah dari sinyal teknikal.</p>`});
 const lev=section(/Level pantauan|Zona teknikal/i);
 out.push({kicker:'SIGNAL DESK / SPOT',title:'Label perlu\nalasan & invalidasi.',html:`<p>${selected.prices.map(p=>`${esc(p.asset)} ${signal(p.signal)}`).join(' &nbsp; ')}</p><p>SELL = bias mengurangi risiko spot, bukan short.<br>HOLD = tunggu / tidak menambah transaksi.<br>BUY = setup terkonfirmasi pada laporan.</p><p class="story-note">Sinyal bertanggal. Berlaku sampai laporan berikutnya atau invalidasi, mana lebih dahulu. Buka detail untuk candle dan pemicunya.</p>`,section:lev?.id});
 for(const [pattern,kicker,title] of [[/perpetual|perp DEX|HYPE\s*[→-]/i,'ROTASI / PERPETUAL DEX','HYPE → ASTER / LIT'],[/RWA|ONDO\s*[→-]/i,'ROTASI / RWA','ONDO → RWA lain']]){const p=rot.paras.find(p=>pattern.test(plain(p)));if(p)out.push({kicker,title,html:`<p>${inline(p)}</p>`,section:rot.section?.id});}
 if(btc)out.push({kicker:'ROTASI / BTC → ETH',title:statusFrom(paragraphs(btc)[0],'btc'),html:`<p>${inline(paragraphs(btc)[0])}</p><p class="story-note">Penilaian relatif. Tidak sama dengan BUY BTC. ETH bisa unggul saat keduanya turun dalam USD.</p>`,section:btc.id});
 if(etf.section)out.push({kicker:'INSTITUTIONAL FLOWS',title:etf.date?'ETF · sesi '+etf.date:'Arus ETF',html:`${etf.row?`<p>${['BTC','ETH','SOL'].map(a=>Number.isFinite(etf.flows[a])?`${a}: <strong>${pct(etf.flows[a]).replace('%','')} juta USD</strong>`:'').filter(Boolean).join('<br>')}</p>`:''}<p>${etf.partial?'Sesi '+esc(plain(etf.partial[0]))+' masih parsial pada cutoff. Kolom kosong bukan nol.':'Tanggal dan kelengkapan mengikuti laporan.'}</p>`,section:etf.section.id});
 if(fx.section)out.push({kicker:'USD / IDR',title:fx.rate?'1 USD =\nRp '+fx.rate:'Kurs referensi',html:`<p>${inline(fx.text)}</p>`,section:fx.section.id});
 if(geo)out.push({kicker:'SCENARIO WATCH',title:'Energi → inflasi\n→ likuiditas.',html:paragraphs(geo).slice(0,2).map(p=>`<p>${inline(p)}</p>`).join(''),section:geo.id});
 if(agenda.section)out.push({kicker:'NEXT TO WATCH / WITA',title:'Agenda, bukan\nhasil yang sudah pasti.',html:agenda.table?agenda.table.rows.slice(0,4).map(r=>`<p><strong>${inline(r[0])} WITA</strong><br>${inline(r[1]||'')}</p>`).join(''):'<p>Buka laporan untuk jadwal lengkap.</p>',section:agenda.section.id});
 out.push({kicker:'GO DEEPER',title:'Bawa konteksnya.\nBukan cuma angkanya.',html:'<p>Pemicu, invalidasi, supply, sumber, dan keterbatasan data tersedia pada laporan lengkap.</p><button type="button" class="button" data-action="story-report">Baca laporan lengkap ↗</button><p class="story-note">Briefing ini bukan eksekusi order atau janji hasil investasi.</p>'});
 return out;
}
function showSlide(){
 const s=slides[storyIndex];$('#story-progress').innerHTML=slides.map((_,i)=>`<span class="${i<=storyIndex?'done':''}"></span>`).join('');
 $('#story-slide').innerHTML=`<div class="story-kicker">${esc(s.kicker)}</div><h2>${esc(s.title).replace(/\n/g,'<br>')}</h2>${s.html}${s.section?`<button type="button" class="button small" data-story-section="${s.section}">Buka konteks lengkap ↗</button>`:''}`;
 $('#story-slide').scrollTop=0;$('#story-counter').textContent=String(storyIndex+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
 $('#story-prev').disabled=storyIndex===0;$('#story-next').disabled=storyIndex===slides.length-1;
}
function stories(){slides=makeSlides();storyIndex=0;$('#story-edition').textContent=fmtDate(selected.date)+' · snapshot laporan';showSlide();showModal($('#stories-dialog'));}
function stepStory(n){const next=Math.max(0,Math.min(slides.length-1,storyIndex+n));if(next!==storyIndex){storyIndex=next;showSlide();}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
async function share(){try{await navigator.clipboard.writeText(location.href);toast('Tautan edisi dan halaman disalin.');}catch(e){detail('Tautan laporan',`<p>Salin tautan berikut:</p><input aria-label="Tautan laporan" value="${esc(location.href)}" readonly style="width:100%;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)">`);}}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a[data-jump]');
 if(!b){const row=e.target.closest('tr[data-asset]');if(row)openAsset(row.dataset.asset);return;}
 if(b.hasAttribute('data-close')){closeModal(b.closest('dialog'));return;}
 if(b.dataset.view){navigate(b.dataset.view);return;}
 if(b.dataset.date){changeDate(b.dataset.date);return;}
 if(b.dataset.section){openSection(b.dataset.section);return;}
 if(b.dataset.storySection){closeModal($('#stories-dialog'));openSection(b.dataset.storySection);return;}
 if(b.dataset.filter){filter=b.dataset.filter;render();return;}
 if(b.dataset.sort){if(view!=='market')return;sort=sort===b.dataset.sort?'original':b.dataset.sort;$('#market-table').innerHTML=marketTable();return;}
 if(b.dataset.range){chartRange=Number(b.dataset.range);render();return;}
 if(b.dataset.jump){e.preventDefault();$('#'+b.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState({},'',location.pathname+location.search+'#'+b.dataset.jump);return;}
 if(b.id==='older'){changeDate(reports[reports.indexOf(selected)+1]?.date);return;}
 if(b.id==='newer'){changeDate(reports[reports.indexOf(selected)-1]?.date);return;}
 if(b.id==='story-next'){stepStory(1);return;}
 if(b.id==='story-prev'){stepStory(-1);return;}
 switch(b.dataset.action){case 'asset':openAsset(b.dataset.asset);break;case 'quality':quality();break;case 'guide':guide();break;case 'search':search();break;case 'stories':stories();break;case 'share':share();break;case 'story-report':closeModal($('#stories-dialog'));navigate('library');break;case 'theme':{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('mn-theme',next);}catch(e){}break;}}
});
document.addEventListener('change',e=>{if(e.target.id==='date')changeDate(e.target.value);if(e.target.id==='comparison'){compare=e.target.value;$('#market-table').innerHTML=marketTable();}if(e.target.id==='chart-asset'){chartAsset=e.target.value;render();}});
document.addEventListener('input',e=>{if(e.target.id==='search-input')searchResults(e.target.value);if(e.target.id==='asset-search'){query=e.target.value;$('#market-table').innerHTML=marketTable();}});
for(const d of $$('dialog')){
 d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal(d);}});
 d.addEventListener('cancel',e=>{e.preventDefault();closeModal(d);});
}
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!$('#search-dialog').open)search();return;}
 if($('#stories-dialog').open){if(e.key==='ArrowRight'){e.preventDefault();stepStory(1);}if(e.key==='ArrowLeft'){e.preventDefault();stepStory(-1);}}
});
function pointInfo(e){const t=e.target.closest?.('[data-chart]');if(!t)return;const out=$('#chart-tooltip-'+t.dataset.chart);if(out)out.innerHTML=`<span>${esc(fmtDate(t.dataset.date))}</span><b>${t.dataset.chart==='oil'?'$'+num(Number(t.dataset.value))+' / barel':usd(Number(t.dataset.value))}</b>`;}
document.addEventListener('pointerover',pointInfo);document.addEventListener('focusin',pointInfo);document.addEventListener('pointerdown',pointInfo);
let touchStart=null,lastSwipeAt=0;
$('#story-slide').addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY,at:Date.now(),target:e.target};},{passive:true});
$('#story-slide').addEventListener('touchend',e=>{if(!touchStart||touchStart.target.closest('button,a'))return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;if(Math.abs(dx)>55&&Math.abs(dy)<60){stepStory(dx<0?1:-1);lastSwipeAt=Date.now();}touchStart=null;},{passive:true});
$('#story-slide').addEventListener('click',e=>{if(Date.now()-lastSwipeAt<500||e.target.closest('button,a')||window.getSelection()?.toString())return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX-r.left<r.width*.25)stepStory(-1);else if(e.clientX-r.left>r.width*.75)stepStory(1);});
window.addEventListener('popstate',()=>{const u=new URL(location.href);selected=reports.find(r=>r.date===u.searchParams.get('date'))||reports[0];view=views[u.searchParams.get('view')]?u.searchParams.get('view'):'overview';compare=reports[reports.indexOf(selected)+1]?.date||'';filter='all';query='';render({url:false,scroll:true});});
const initialHash=location.hash;
if(initialHash.startsWith('#section-'))view='library';
render();
if(initialHash.startsWith('#section-')){const target=document.getElementById(initialHash.slice(1));if(target){target.scrollIntoView();history.replaceState({},'',location.pathname+location.search+initialHash);}}
if(initial.searchParams.get('date')&&!reports.some(r=>r.date===initial.searchParams.get('date')))toast('Edisi tersebut belum tersedia. Menampilkan arsip terbaru.');
})();
