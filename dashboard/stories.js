/* Stories reuse the selected archive snapshot, never inventing market data. */
(()=>{
 'use strict';
 const launch=document.createElement('button');
 launch.type='button';launch.className='story-launch';launch.id='open-stories';
 launch.innerHTML='<div><small>MODE STORIES · TAP TO EXPLORE</small><strong>Market, in moments.</strong><span>Inti laporan pilihanmu, satu cerita setiap tap.</span></div><i aria-hidden="true">↗</i>';
 document.querySelector('.controls').after(launch);
 const dialog=document.createElement('dialog');dialog.className='stories';dialog.setAttribute('aria-label','Market Notes Stories');
 dialog.innerHTML='<div class="story-shell"><div class="story-progress" aria-hidden="true"></div><div class="story-top"><div class="story-brand">MARKET NOTES<small id="story-date"></small></div><button class="story-close" aria-label="Tutup Stories" autofocus>×</button></div><section class="story-content" tabindex="0" aria-label="Cerita market"></section><div class="story-bottom"><div class="story-nav"><button id="story-prev" aria-label="Cerita sebelumnya">← Kembali</button><span class="story-counter" aria-live="polite" aria-atomic="true"></span><button id="story-next" aria-label="Cerita berikutnya">Lanjut →</button></div><p class="story-hint">Tap kiri / kanan · Geser ke atas untuk teks panjang</p></div></div>';
 document.body.append(dialog);
 const shell=dialog.querySelector('.story-shell'),content=dialog.querySelector('.story-content'),prev=dialog.querySelector('#story-prev'),next=dialog.querySelector('#story-next'),progress=dialog.querySelector('.story-progress');
 const themes=[['#dcff8c','#192719'],['#ded0ff','#2c2145'],['#ffcda8','#432719'],['#bfe8f5','#173342']];
 let slides=[],index=0,scrollBefore=0,opener=null,pointerStart=null;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const text=n=>n?.textContent.replace(/\s+/g,' ').trim()||'';
 const cleanTitle=s=>s.replace(/^\d+[.)]\s*/,'');
 function safeHtml(node){
  const clone=node.cloneNode(true);
  clone.querySelectorAll('*').forEach(el=>{
   if(!['STRONG','EM','A','BR'].includes(el.tagName)){el.replaceWith(...el.childNodes);return;}
   [...el.attributes].forEach(a=>{if(!(el.tagName==='A'&&a.name==='href'))el.removeAttribute(a.name)});
   if(el.tagName==='A'){
    if(!/^https?:\/\//.test(el.getAttribute('href')||'')){el.replaceWith(...el.childNodes);return;}
    el.target='_blank';el.rel='noopener noreferrer';
   }
  });
  return clone.innerHTML;
 }
 const groups=(items,size)=>Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
 function makeSlides(report){
  const doc=new DOMParser().parseFromString('<!doctype html><html><body>'+report.html+'</body></html>','text/html'),result=[];
  const add=(tag,title,body,theme=0)=>result.push({tag,title,body,theme});
  const source='https://github.com/stevenchristiian/Chatgptdailymarket/blob/main/crypto-recaps/'+report.date+'.md';
  const changeValues=report.prices.map(p=>({p,v:Number(p.change.replace('−','-').replace('%','').replace(',','.'))})).filter(x=>Number.isFinite(x.v));
  const up=changeValues.filter(x=>x.v>0).length,down=changeValues.filter(x=>x.v<0).length;
  add('DAILY RECAP', 'Pasar hari ini.<br>Satu tap lagi.', (report.prices.length?'<div class="story-orbit">'+report.prices.length+'<span> aset</span></div>':'<div class="story-orbit">↗</div><p class="story-fine">Rincian harga tersedia di laporan lengkap.</p>')+'<p>'+escape(formatDate(report.date))+'</p><p class="story-fine">'+escape(report.snapshot)+'</p><p class="story-fine">Ringkasan dari arsip terpilih. Snapshot, bukan harga live. Tap dengan tempo kamu sendiri.</p>');
  const overview=doc.querySelector('blockquote');
  if(overview)add('GAMBAR BESAR','Mulai dari sini.', '<div class="story-copy"><p>'+safeHtml(overview)+'</p></div>',1);
  if(changeValues.length)add('SUHU PASAR · 24 JAM','Siapa yang bergerak?', '<div class="story-orbit">'+up+'<span> naik</span></div><p><strong>'+down+' turun</strong> · '+(changeValues.length-up-down)+' datar</p><p class="story-fine">Dari '+changeValues.length+' aset dengan data perubahan 24 jam dalam laporan ini; bukan seluruh pasar.</p>',2);
  groups(report.prices,3).forEach((batch,i)=>add('HARGA SNAPSHOT · USD','Angka di balik cerita.',batch.map(p=>'<div class="story-price-row"><b>'+escape(p.asset)+'</b><strong>'+escape(p.price)+'</strong><em class="'+(/[−-]/.test(p.change)?'down':'up')+'">'+escape(p.change)+'</em></div>').join('')+'<p class="story-fine">Perubahan 24 jam dari laporan '+escape(formatDate(report.date))+'.</p>',i%2?3:0));
  // Find top-level report sections, keeping nested facts and inference labels.
  const headings=[...doc.body.children].filter(n=>/^H[23]$/.test(n.tagName));
  const topTag=headings.some(n=>n.tagName==='H3')?'H3':'H2';
  const sections=[];let section=null,sub='';
  [...doc.body.children].forEach(n=>{
   if(n.tagName===topTag){section={title:cleanTitle(text(n)),items:[]};sections.push(section);sub='';}
   else if(section){if(/^H[2-6]$/.test(n.tagName))sub=text(n);else section.items.push({node:n,sub});}
  });
  for(const section of sections){
   const title=section.title;
   if(/dashboard|harga|signal deck|perbandingan|metodologi/i.test(title))continue;
   if(/level|teknikal|support.*resistance/i.test(title)){
    for(const {node} of section.items){
     const table=node.matches('table')?node:node.querySelector('table');if(!table)continue;
     const rows=[...table.querySelectorAll('tr')],headers=[...rows[0].children].map(text);
     const si=headers.findIndex(h=>/support/i.test(h)),ri=headers.findIndex(h=>/resistan/i.test(h));
     if(si<0||ri<0)continue;
     // Preserve the report's signal and its conditions together; never infer one from price alone.
     rows.slice(1).forEach(row=>{
      const cells=[...row.children].map(text);
      const sig=headers.findIndex(h=>/sinyal|signal/i.test(h));
      const label=sig>=0&&cells[sig]?cells[sig]:'Belum dinilai';
      const extras=headers.map((h,i)=>({h,i})).filter(({i})=>i>0&&i!==si&&i!==ri&&i!==sig);
      add('LEVEL PANTAUAN · '+report.date,escape(cells[0])+' · '+escape(label),
       '<div class="story-level"><dl><div><dt>'+escape(headers[si])+'</dt><dd>'+escape(cells[si]||'Belum tersedia')+'</dd></div><div><dt>'+escape(headers[ri])+'</dt><dd>'+escape(cells[ri]||'Belum tersedia')+'</dd></div></dl></div>'+
       extras.map(({h,i})=>'<p class="story-fine"><strong>'+escape(h)+':</strong> '+escape(cells[i]||'Belum tersedia')+'</p>').join('')+
       '<p class="story-fine">'+(sig<0?'Arsip ini belum memuat penilaian BUY / SELL / HOLD. ':'Sinyal pada waktu snapshot. BUY: setup beli; SELL: kurangi/keluar spot, bukan short; HOLD: tunggu. ')+'Periksa pemicu, invalidasi, dan horizon pada laporan. Bukan harga atau sinyal live.</p>',3);
     });
    }
    continue;
   }
   if(/agenda|kalender/i.test(title)){
    for(const {node} of section.items){
     const table=node.matches('table')?node:node.querySelector('table');if(!table)continue;
     groups([...table.querySelectorAll('tr')].slice(1),3).forEach(batch=>add('AGENDA · '+formatDate(report.date),'Jam yang perlu dicatat.',batch.map(row=>{const cells=[...row.children].map(text);return '<div class="story-event"><strong>'+escape(cells[0])+' WITA</strong><b>'+escape(cells[1]||'')+'</b><p>'+escape(cells[2]||'')+'</p></div>'}).join('')+'<p class="story-fine">Agenda pada saat laporan ditulis; bukan countdown live.</p>',2));
    }
    continue;
   }
   // Keep complete source items, including uncertainty and partial-data labels.
   const candidates=section.items.flatMap(({node,sub})=>node.matches('ul,ol')?[...node.children].map(node=>({node,sub})):[{node,sub}]).filter(({node})=>node.matches('p,li,blockquote')&&text(node).length>35&&!/^sumber|catatan metodologi/i.test(text(node)));
   let selected=candidates;
   if(/fundamental|token|unlock|suplai/i.test(title))selected=candidates.filter(({node})=>/unlock|buyback|burn|reserve|staking|suplai|belum|parsial/i.test(text(node)));
   // Limit section length without shortening any selected fact or caveat.
   const max=/risiko|praktis|strategi/i.test(title)?3:/geopolitik/i.test(title)?2:/terjadi|kondisi|makro/i.test(title)?5:3;
   selected.slice(0,max).forEach(({node,sub},i)=>{
    const lead=node.querySelector('strong');
    const headline=lead&&text(lead).length<95?text(lead):title;
    add(sub||title,escape(headline),'<div class="story-copy"><p>'+safeHtml(node)+'</p></div>',/risiko|unlock|suplai/i.test(title)?2:/geopolitik/i.test(title)?3:1);
   });
  }
  add('SELESAI','Kamu sudah<br>catch up.', '<p>Detail, sumber, dan skenario lengkap tetap ada di laporan.</p><button class="story-read" data-read-report>Baca laporan lengkap ↗</button><p class="story-fine" style="margin-top:24px">'+escape(formatDate(report.date))+' · <a href="'+source+'" target="_blank" rel="noopener noreferrer">Buka arsip & sumber</a></p>',0);
  return result;
 }
 function renderStory(){
  const slide=slides[index],[paper,type]=themes[slide.theme];shell.style.setProperty('--paper',paper);shell.style.setProperty('--type',type);
  content.innerHTML='<div class="story-kicker">'+escape(slide.tag)+'</div><h2>'+slide.title+'</h2>'+slide.body;
  content.scrollTop=0;content.classList.remove('animating');void content.offsetWidth;content.classList.add('animating');
  progress.replaceChildren(...slides.map((_,i)=>{const segment=document.createElement('span');if(i<=index)segment.className='seen';return segment}));
  dialog.querySelector('.story-counter').textContent=(index+1)+' / '+slides.length;
  prev.disabled=index===0;next.textContent=index===slides.length-1?'Selesai ✓':'Lanjut →';
  next.setAttribute('aria-label',index===slides.length-1?'Tutup Stories':'Cerita berikutnya');
 }
 function navigate(delta){if(delta>0&&index===slides.length-1){dialog.close();return;}index=Math.max(0,Math.min(slides.length-1,index+delta));renderStory();}
 function open(){
  const report=reports.find(r=>r.date===date.value);if(!report||dialog.open)return;
  slides=makeSlides(report);index=0;opener=document.activeElement;scrollBefore=window.scrollY;
  dialog.querySelector('#story-date').textContent=formatDate(report.date)+' · snapshot';
  document.body.style.position='fixed';document.body.style.top=-scrollBefore+'px';document.body.style.width='100%';
  dialog.showModal();renderStory();
  const url=new URL(location.href);url.searchParams.set('mode','stories');history.replaceState(null,'',url);
 }
 dialog.addEventListener('close',()=>{document.body.style.position='';document.body.style.top='';document.body.style.width='';window.scrollTo(0,scrollBefore);opener?.focus({preventScroll:true});const url=new URL(location.href);url.searchParams.delete('mode');history.replaceState(null,'',url)});
 launch.addEventListener('click',open);dialog.querySelector('.story-close').addEventListener('click',()=>dialog.close());
 prev.addEventListener('click',()=>navigate(-1));next.addEventListener('click',()=>navigate(1));
 content.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,scroll:content.scrollTop}});
 content.addEventListener('pointercancel',()=>{pointerStart=null});
 content.addEventListener('click',e=>{
  if(e.target.closest('[data-read-report]')){dialog.close();document.querySelector('#report').scrollIntoView({behavior:'instant',block:'start'});return;}
  if(e.target.closest('a,button')||window.getSelection()?.toString())return;
  if(pointerStart&&(Math.abs(e.clientX-pointerStart.x)>12||Math.abs(e.clientY-pointerStart.y)>12||Math.abs(content.scrollTop-pointerStart.scroll)>5)){pointerStart=null;return;}
  pointerStart=null;const bounds=content.getBoundingClientRect();navigate(e.clientX-bounds.left<bounds.width*.35?-1:1);
 });
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();navigate(e.key==='ArrowRight'?1:-1)}else if(e.key==='Home'||e.key==='End'){e.preventDefault();index=e.key==='Home'?0:slides.length-1;renderStory()}});
 if(new URL(location.href).searchParams.get('mode')==='stories')open();
})();
