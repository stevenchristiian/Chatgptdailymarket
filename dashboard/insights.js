/* Visual enhancements are derived only from the selected report. */
(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=".insight-chart{margin:24px 0;padding:22px;background:#111f19;color:#e8f1e6;border-radius:18px}.insight-chart h4{margin:0 0 8px;font-size:20px}.insight-chart svg{width:100%;height:auto;display:block}.insight-chart figcaption{font-size:12px;color:#bccbbb}.scenario-grid{display:grid;gap:12px;margin:20px 0}.scenario-card{padding:20px;border:1px solid #dce1d6;border-left:4px solid #759856;border-radius:12px;background:#f7f9f2}.scenario-card h4{margin:0 0 12px}.scenario-card p{margin:8px 0}.scenario-card small{display:block;text-transform:uppercase;letter-spacing:.07em;color:#647065;font-size:10px}.report-jump{display:flex;gap:8px;overflow:auto;padding:10px 0 20px;margin-bottom:15px;scrollbar-width:thin}.report-jump a{white-space:nowrap;border:1px solid #dce1d6;padding:7px 12px;border-radius:24px;text-decoration:none;font-size:12px;background:#f7f9f2}.signal-pill{display:inline-block;font-weight:750;border-radius:20px;padding:4px 10px;white-space:nowrap}.signal-buy{color:#145b38;background:#e0f3e7}.signal-sell{color:#922f31;background:#ffe9e7}.signal-hold{color:#77531c;background:#fff1d6}#report h3{scroll-margin-top:20px;border-top:1px solid #e4e8df;padding-top:26px}#report h2:first-child{margin-top:0}.stories .insight-chart{margin:12px 0;padding:14px}.stories .insight-chart h4{font-size:17px}.stories .insight-chart figcaption{font-size:11px}details.raw-observations summary{cursor:pointer;color:#647065;font-size:12px;padding:8px 0}";
document.head.append(style);
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
function oilChart(table){
 const head=[...table.rows[0].cells].map(c=>c.textContent.trim());
 if(head.length!==2||head[0]!=='Tanggal'||!/^(Brent|WTI) \(USD\/barel\)$/.test(head[1]))return null;
 const points=[...table.rows].slice(1).map(r=>({date:r.cells[0]?.textContent.trim(),raw:r.cells[1]?.textContent.trim()})).filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&/^\d+(\.\d+)?$/.test(p.raw)).map(p=>({...p,t:Date.parse(p.date+'T00:00:00Z'),v:Number(p.raw)})).filter(p=>Number.isFinite(p.t)&&p.v>0).sort((a,b)=>a.t-b.t);
 if(points.length<2||new Set(points.map(p=>p.t)).size!==points.length)return null;
 const first=points[0],last=points.at(-1),lo=Math.min(...points.map(p=>p.v)),hi=Math.max(...points.map(p=>p.v)),pad=Math.max((hi-lo)*.15,1),bottom=lo-pad,top=hi+pad;
 const x=t=>54+(t-first.t)/(last.t-first.t)*510,y=v=>190-(v-bottom)/(top-bottom)*150;
 const fig=el('figure','insight-chart'),svg=svgEl('svg',{viewBox:'0 0 600 235',role:'img','aria-label':head[1]+', '+first.date+' sampai '+last.date});
 fig.append(el('h4','',head[1]+' · '+last.v.toFixed(2)));
 for(let i=0;i<4;i++){const v=bottom+(top-bottom)*i/3,Y=y(v);svg.append(svgEl('line',{x1:54,y1:Y,x2:564,y2:Y,stroke:'#35483d','stroke-width':1}),svgEl('text',{x:46,y:Y+4,fill:'#bccbbb','font-size':11,'text-anchor':'end'},v.toFixed(1)));}
 // Only observations are plotted; dashed connectors show gaps, not invented daily values.
 svg.append(svgEl('polyline',{points:points.map(p=>x(p.t)+','+y(p.v)).join(' '),fill:'none',stroke:'#c4ddaf','stroke-width':2,'stroke-dasharray':'4 3'}));
 for(const p of points){const dot=svgEl('circle',{cx:x(p.t),cy:y(p.v),r:3,fill:'#dcff8c'});dot.append(svgEl('title',{},p.date+' · $'+p.v.toFixed(2)));svg.append(dot);}
 svg.append(svgEl('text',{x:54,y:218,fill:'#bccbbb','font-size':11},first.date),svgEl('text',{x:564,y:218,fill:'#bccbbb','font-size':11,'text-anchor':'end'},last.date));
 const change=(last.v/first.v-1)*100;
 fig.append(svg,el('figcaption','',(change>=0?'+':'')+change.toFixed(2)+'% antar-observasi pertama–terakhir · '+points.length+' observasi. Titik = data tersedia; garis putus-putus hanya penghubung. Sumber dan jenis instrumen mengikuti laporan.'));
 return fig;
}
function enhance(){
 const report=document.getElementById('report');
 const headings=[...report.querySelectorAll('h3')];
 if(headings.length){const nav=el('nav','report-jump');nav.setAttribute('aria-label','Lompat ke bagian laporan');headings.forEach(h=>{const a=el('a','',h.textContent.replace(/^\d+[.)]\s*/,''));a.href='#'+h.id;nav.append(a);});report.prepend(nav);}
 for(const table of [...report.querySelectorAll('table')]){
  const headers=[...table.rows[0].cells].map(c=>c.textContent.trim());
  const chart=oilChart(table);
  if(chart){const wrap=table.closest('.table-wrap')||table;wrap.before(chart);const details=el('details','raw-observations');details.append(el('summary','','Lihat data harian asli'));wrap.before(details);details.append(wrap);continue;}
  if(headers[0]==='Skenario'&&headers.some(h=>/minyak/i.test(h))){
   const grid=el('div','scenario-grid');
   [...table.rows].slice(1).forEach(row=>{const card=el('section','scenario-card');card.append(el('h4','',row.cells[0]?.textContent||'Skenario'));headers.slice(1).forEach((h,i)=>{const p=el('p','');p.append(el('small','',h),document.createTextNode(row.cells[i+1]?.textContent||'Belum tersedia'));card.append(p);});grid.append(card);});
   const wrap=table.closest('.table-wrap')||table;wrap.replaceWith(grid);continue;
  }
  const si=headers.findIndex(h=>/^(Sinyal|Signal)$/i.test(h));
  if(si>=0)[...table.rows].slice(1).forEach(row=>{const cell=row.cells[si];if(!cell)return;const text=cell.textContent.trim(),match=text.match(/^(BUY|SELL|HOLD)\b/);if(match)cell.replaceChildren(el('span','signal-pill signal-'+match[1].toLowerCase(),text));});
 }
}
window.marketOilChart=oilChart;
document.getElementById('date').addEventListener('change',enhance);
document.getElementById('comparison').addEventListener('change',enhance);
enhance();
})();