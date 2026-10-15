/* Native read-only BTC panel. Private endpoints are called only on the owner Site. */
(() => {
'use strict';
const HOST='btc-risk-desk-steven.steven-wijaya966391.chatgpt.site';
const privateHub=location.hostname===HOST && !!document.querySelector('meta[name="btc-hub"][content="private"]');
const url='https://'+HOST+'/hub?view=btc';
const publicHub=location.hostname==='chatgptdailymarket.steven-wijaya.workers.dev';
const canRead=privateHub||publicHub;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>Number.isFinite(n)?'$'+n.toLocaleString('id-ID',{maximumFractionDigits:2}):'Belum tersedia';
const time=t=>Number.isFinite(Date.parse(t))?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Makassar'}).format(new Date(t))+' WITA':'Belum tersedia';
let data=null,error='',busy=false;
function state(d,now=Date.now()) {
 const r=d?.report,m=d?.market,t=d?.tracker;
 if(!r||!d.persisted)return 'SNAPSHOT AWAL · TUNGGU VERIFIKASI';
 if(!Number.isFinite(Date.parse(r.asOf))||!Number.isFinite(Date.parse(r.validUntil))||Date.parse(r.asOf)>now||Date.parse(r.validUntil)<=now)return 'ANALISIS KEDALUWARSA / TIDAK VALID';
 if(!m||!Number.isFinite(m.mark)||m.mark<=0||Math.abs(now-Date.parse(m.exchangeAt))>180000||!Number.isFinite(Date.parse(m.exchangeAt)))return 'FEED BELUM SEGAR · TUNGGU';
 if((r.events||[]).some(e=>e.impact==='high'&&Math.abs(Date.parse(e.at)-now)<=1800000))return 'JENDELA EVENT · TUNGGU';
 if(!t||t.reportAsOf!==r.asOf||Math.abs(now-Date.parse(t.checkedAt))>180000||!Number.isFinite(Date.parse(t.checkedAt)))return 'TRACKER BELUM SEGAR · TUNGGU';
 if(t.status!=='confirmed')return (t.label||'TRACKER BELUM TERKONFIRMASI').toUpperCase();
 return 'SYARAT MEKANIS TERPENUHI · REVIEW ANALIS';
}
function body() {
 if(!canRead)return `<section class="panel btc-gateway"><span class="pill">BTC RISK DESK</span><h2>Recap dan sinyal BTC.<br>Satu dashboard.</h2><p>Buka dashboard gabungan dengan login Risk Desk. Setelah masuk, menu BTC menampilkan analisis terbaru, mark Hyperliquid, level, tracker, dan agenda langsung di Market Notes.</p><a class="button primary" href="${url}" target="_top">Masuk ke dashboard gabungan →</a><p class="note">Recap publik tetap terbuka. Sinyal privat, jurnal, dan pengaturan risiko tetap terlindungi oleh akses semula.</p></section>`;
 const r=data?.report,m=data?.market,t=data?.tracker;
 const notice=error?`<div class="quality-note" role="status"><p>${esc(error)} Data lama, bila ada, tetap memakai timestamp aslinya.</p></div>`:'';
 if(!r)return `${notice}<section class="panel"><h2>BTC Risk Desk</h2><p>${busy?'Mengambil analisis tersimpan dan feed pasar…':'Data belum tersedia. Coba perbarui.'}</p><button class="button" data-btc-refresh ${busy?'disabled':''}>${busy?'Memuat…':'Perbarui BTC'}</button></section>`;
 const status=error?'PEMBARUAN GAGAL · TUNGGU':state(data);
 return `${notice}<div class="report-tools"><span class="pill">BTC PERPETUAL · HYPERLIQUID</span><button class="button" data-btc-refresh ${busy?'disabled':''}>${busy?'Memperbarui…':'↻ Perbarui BTC'}</button><a class="button" href="https://btc-risk-desk-steven.steven-wijaya966391.chatgpt.site/">Kelola Risk Desk · privat ↗</a></div><section class="panel brief-hero btc-brief"><div class="eyebrow">${esc(status)}</div><h2>${esc(r.headline)}</h2><p>${esc(r.reason)}</p><div class="btc-meta"><span>Bias analis: <b>${esc(r.signal)}</b></span><span>Analisis: ${time(r.asOf)}</span><span>Berlaku sampai: ${time(r.validUntil)}</span></div></section><div class="quick-grid btc-stats"><section class="panel"><h3>Mark BTC perpetual</h3><h2>${usd(m?.mark)}</h2><p>Feed: ${time(m?.exchangeAt)}</p><p>24 jam: ${Number.isFinite(m?.change24h)?esc(m.change24h.toFixed(2))+'%':'—'} · OI: ${usd(m?.oi)}</p></section><section class="panel"><h3>Konfirmasi setup</h3><h2>${esc(t?.label||'Belum tersedia')}</h2><p>${esc(t?.detail||'Tunggu tracker yang terverifikasi.')}</p><p>Diperiksa: ${time(t?.checkedAt)}</p></section><section class="panel"><h3>Jendela event</h3><h2>${data.event?'Entry ditahan':'Lihat agenda'}</h2><p>${data.event?esc(data.event.title)+' · ±30 menit dari rilis utama':'Tidak ada jendela event ±30 menit pada daftar analisis ini; ini bukan izin entry.'}</p><p>Feed diminta saat membuka panel dan setiap 60 detik saat tab aktif.</p></section></div><div class="panel"><h3>Level dari analisis terbaru</h3><div class="table-container"><table><thead><tr><th>Jenis</th><th>Zona USD</th><th>Dasar</th></tr></thead><tbody>${(r.levels||[]).map(l=>`<tr><td>${esc(l.kind)}</td><td>${usd(l.low)} – ${usd(l.high)}</td><td>${esc(l.note)}</td></tr>`).join('')}</tbody></table></div></div><div class="overview-bottom"><section class="panel"><h3>Teknikal · candle selesai</h3><div class="table-container"><table><thead><tr><th>TF</th><th>Close</th><th>RSI</th><th>Ditutup WITA</th></tr></thead><tbody>${(m?.technicals||[]).map(x=>`<tr><td>${esc(x.tf)}</td><td>${usd(x.close)}</td><td>${Number.isFinite(x.rsi)?x.rsi.toFixed(1):'—'}</td><td>${time(x.closedAt)}</td></tr>`).join('')}</tbody></table></div></section><section class="panel"><h3>Agenda analisis</h3>${(r.events||[]).map(e=>`<p><strong>${time(e.at)}</strong><br>${esc(e.title)} · ${esc(e.impact)}</p>`).join('')||'<p>Belum ada agenda.</p>'}</section></div><div class="quality-note"><p>Bias LONG/SHORT adalah analisis perpetual, bukan BUY/SELL spot pada recap. Tracker mekanis tidak mengganti keputusan analis. Analisis dan harga mempunyai timestamp berbeda; tanggal arsip di atas tidak mengubah feed BTC ini. Tidak ada order dieksekusi dari panel ini.</p></div><section class="panel"><h3>Invalidasi & sumber</h3>${(r.invalidations||[]).map(x=>`<p>${esc(x)}</p>`).join('')}<div class="source-grid">${(r.sources||[]).filter(s=>/^https:\/\//.test(s.url)).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('')}</div></section>`;
}
function paint(){const el=document.getElementById('btc-panel');if(el)el.innerHTML=body();}
async function refresh(){
 if(!canRead||busy||!document.getElementById('btc-panel'))return;
 busy=true;paint();
 try{const res=await fetch(privateHub?'/api/hub-btc':'/api/btc',{cache:'no-store',signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error();const next=await res.json();if(!next.report?.asOf)throw Error();data=next;error='';}catch{error='Pembaruan gagal. Konfirmasi baru tidak tersedia.';}finally{busy=false;paint();}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-btc-refresh]'))refresh();});
setInterval(()=>{if(document.visibilityState==='visible'){paint();refresh();}},60000);
window.btcHub={render:()=>`<div id="btc-panel">${body()}</div>`,mount:refresh,state};
})();
