/* Market Notes — panel portofolio pribadi.
   Tidak ada angka portofolio di dalam bundle statis. Semua data diambil saat
   runtime dari RPC Supabase yang dijaga PIN; tabelnya sendiri tertutup untuk anon. */
(() => {
'use strict';
const API = 'https://xrrzzibifputgesnnbjh.supabase.co/rest/v1/rpc/';
const KEY = 'sb_publishable_mHZzDGNol4GJIcB3JOK6Ig_J4xrYeI4';
const SKEY = 'mn-pf-pin';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n2 = (v,d=2) => Number.isFinite(v) ? v.toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
const usd = v => Number.isFinite(v) ? '$'+n2(v, Math.abs(v)<2 ? 4 : 2) : '—';
const sgn = v => Number.isFinite(v) ? (v>0?'+':v<0?'−':'')+'$'+n2(Math.abs(v)) : '—';
const pc  = v => Number.isFinite(v) ? (v>0?'+':v<0?'−':'')+n2(Math.abs(v))+'%' : '—';
const cls = v => Number.isFinite(v) ? (v<0?'negative':v>0?'positive':'muted') : 'muted';
const rp  = (v,kurs) => Number.isFinite(v)&&Number.isFinite(kurs) ? 'Rp '+n2(v*kurs/1e6,1)+' jt' : '';
const tgl = d => new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Makassar'}).format(new Date(d+'T12:00:00+08:00'));

const store = {
  get(){ try { return sessionStorage.getItem(SKEY) || ''; } catch(e){ return ''; } },
  set(v){ try { sessionStorage.setItem(SKEY, v); } catch(e){} },
  clear(){ try { sessionStorage.removeItem(SKEY); } catch(e){} }
};

async function rpc(fn, body){
  const res = await fetch(API+fn, {
    method:'POST',
    headers:{ 'apikey':KEY, 'Authorization':'Bearer '+KEY, 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('Jaringan '+res.status);
  return res.json();
}

function lock(msg){
  return `<section class="panel">
    <div class="panel-head"><div><span class="eyebrow">AREA PRIBADI</span><h2>Portofolio</h2></div></div>
    <div class="prose">
      <p>Bagian ini tidak ikut terbit bersama laporan publik. Angkanya disimpan terpisah dan hanya terbuka dengan PIN.</p>
      <form id="pf-form" class="pf-form" autocomplete="off">
        <label for="pf-pin">PIN</label>
        <input id="pf-pin" type="password" inputmode="numeric" placeholder="••••" aria-label="PIN portofolio" required>
        <button class="button primary" type="submit">Buka</button>
      </form>
      ${msg?`<p class="note negative" role="alert">${esc(msg)}</p>`:''}
      <p class="note">Tidak ada data portofolio pada halaman ini sampai PIN benar. Keluar dari tab akan mengunci kembali.</p>
    </div>
  </section>`;
}

function chart(history){
  const pts = history.filter(h => Number.isFinite(+h.value_usd));
  if(pts.length < 2) return '';
  const W=760, H=260, L=8, R=64, T=16, B=28;
  const vals = pts.flatMap(p => [+p.value_usd, +p.deployed_usd]);
  const lo = Math.min(...vals)*0.92, hi = Math.max(...vals)*1.06;
  const X = i => L + i*(W-L-R)/(pts.length-1);
  const Y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const path = key => pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(+p[key]).toFixed(1)).join(' ');
  const last = pts[pts.length-1];
  return `<div class="chart-wrap pf-chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Nilai portofolio dibanding modal disetor">
      <path d="${path('deployed_usd')}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5" opacity="0.45"/>
      <path d="${path('value_usd')}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pf-line-value"/>
      <circle cx="${X(pts.length-1).toFixed(1)}" cy="${Y(+last.value_usd).toFixed(1)}" r="5" class="pf-line-value" fill="currentColor"/>
    </svg>
    <p class="note"><span class="pf-key pf-key-value"></span> Nilai portofolio &nbsp; <span class="pf-key pf-key-dep"></span> Modal disetor &nbsp;·&nbsp; ${pts.length} titik, ${esc(tgl(pts[0].snapshot_date))} – ${esc(tgl(last.snapshot_date))}</p>
  </div>`;
}

function view(d){
  const s = d.latest;
  if(!s) return `<section class="panel"><div class="prose"><p>Belum ada snapshot tersimpan.</p></div></section>`;
  const val=+s.value_usd, dep=+s.deployed_usd, kurs=+s.usd_idr;
  const pnl=val-dep, ret=dep?pnl/dep*100:NaN;
  const real=Number.isFinite(+s.realized_pnl_usd)?+s.realized_pnl_usd:NaN;
  const unre=Number.isFinite(+s.unrealized_pnl_usd)?+s.unrealized_pnl_usd:NaN;
  const hold=d.holdings||[];
  const cat=hold.reduce((a,h)=>{a[h.category]=(a[h.category]||0)+(+h.value_usd);return a;},{});
  const top=Math.max(...hold.map(h=>+h.value_usd),1);

  const stat=(label,value,note,klass='')=>`<div class="detail-stat"><span class="eyebrow">${esc(label)}</span><strong class="${klass}">${value}</strong>${note?`<small>${esc(note)}</small>`:''}</div>`;

  return `<section class="panel">
    <div class="panel-head">
      <div><span class="eyebrow">AREA PRIBADI · ${esc(tgl(s.snapshot_date))}</span><h2>Portofolio</h2></div>
      <button type="button" class="text-button" data-pf="lock">Kunci lagi ↗</button>
    </div>
    <div class="pf-stats">
      ${stat('Nilai', usd(val), rp(val,kurs))}
      ${stat('Modal disetor', usd(dep), rp(dep,kurs))}
      ${stat('Realized PnL', sgn(real), 'sudah dicairkan', cls(real))}
      ${stat('Unrealized PnL', sgn(unre), 'masih di posisi', cls(unre))}
      ${stat('Total return', pc(ret), 'terhadap modal disetor', cls(ret))}
    </div>
    ${chart(d.history||[])}
    ${s.note?`<p class="note">${esc(s.note)}</p>`:''}
  </section>

  <section class="panel">
    <div class="panel-head"><div><span class="eyebrow">ALOKASI</span><h2>Rincian per aset</h2></div></div>
    <div class="table-container">
      <table class="pf-table">
        <thead><tr><th>Aset</th><th class="num">Nilai</th><th class="num">Avg buy</th><th class="num">Unrealized</th><th>Alokasi</th></tr></thead>
        <tbody>${hold.map(h=>{
          const v=+h.value_usd, u=+h.units, a=+h.avg_buy, p=+h.price;
          const cost=Number.isFinite(u)&&Number.isFinite(a)?u*a:NaN;
          const gain=Number.isFinite(cost)?v-cost:NaN;
          const gpct=Number.isFinite(cost)&&cost?gain/cost*100:NaN;
          return `<tr>
            <td><b>${esc(h.asset)}</b><small class="name-full">${esc(h.name||'')}</small></td>
            <td class="num">${usd(v)}</td>
            <td class="num muted">${usd(a)}</td>
            <td class="num ${cls(gain)}">${sgn(gain)} · ${pc(gpct)}</td>
            <td><span class="pf-bar"><i style="width:${(v/top*100).toFixed(1)}%"></i></span><small>${n2(v/val*100,1)}%</small></td>
          </tr>`;}).join('')}
        </tbody>
      </table>
    </div>
    <p class="note">Kategori: ${Object.entries(cat).map(([k,v])=>`${esc(k)} ${n2(v/val*100,1)}%`).join(' · ')}</p>
  </section>`;
}

let el=null;
async function unlock(pin, node){
  node.innerHTML = `<section class="panel"><div class="prose"><p class="note">Membuka…</p></div></section>`;
  try{
    const d = await rpc('portfolio_load', {p_pin:pin});
    if(!d || d.ok !== true){ store.clear(); node.innerHTML = lock('PIN salah. Coba lagi.'); return; }
    store.set(pin);
    node.innerHTML = view(d);
  }catch(err){
    node.innerHTML = lock('Gagal menghubungi server: '+err.message);
  }
}

window.portfolioHub = {
  render(){ return `<div id="pf-root">${store.get()?'<section class="panel"><div class="prose"><p class="note">Membuka…</p></div></section>':lock('')}</div>`; },
  mount(){
    el = document.getElementById('pf-root');
    if(!el) return;
    const pin = store.get();
    if(pin) unlock(pin, el);
  }
};

document.addEventListener('submit', e => {
  const f = e.target.closest('#pf-form');
  if(!f) return;
  e.preventDefault();
  const input = f.querySelector('#pf-pin');
  const root = document.getElementById('pf-root');
  if(root) unlock(input.value.trim(), root);
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-pf="lock"]');
  if(!b) return;
  store.clear();
  const root = document.getElementById('pf-root');
  if(root) root.innerHTML = lock('');
});
})();
