/* Exercise every view against every real archive without a browser or network.
   The DOM shim is only a host: all extraction and rendering uses production JS. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const data = html.match(/<script id="market-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {
    id, textContent: '', innerHTML: '', value: '', dataset: {}, open: false,
    classList: {add(){},remove(){},toggle(){}},
    add(){}, insertAdjacentHTML(){}, addEventListener(){}, setAttribute(){}, removeAttribute(){},
    focus(){}, showModal(){this.open=true;}, close(){this.open=false;}, scrollIntoView(){}, offsetWidth:1,
  });
  return nodes.get(id);
}
node('market-data').textContent = data;
const context = vm.createContext({
  document: {getElementById: node, querySelector:s=>node(s.replace(/^#/,'')), querySelectorAll:()=>[],
    documentElement:{dataset:{}}, body:{classList:{add(){},toggle(){}}}, addEventListener(){},activeElement:null},
  location:new URL('https://example.test/?date=2026-10-15'),
  history:{replaceState(){}},window:{scrollTo(){},addEventListener(){}},
  navigator:{},localStorage:{getItem(){return null}},Option:function(){},
  URL,Intl,Date,console,setTimeout(){},Number,String,Array,Object,Math,Set,
});
let source = fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
source=source.replace(/\}\)\(\);\s*$/,`globalThis.testAPI={reports,views,overview,market,rotation,macro,research,library,getEtf,getFx,makeSlides,searchResults,pointsFor,
 setReport(r){selected=r;compare=reports[reports.indexOf(r)+1]?.date||'';},setFilter(f){filter=f;},marketTable};})();`);
vm.runInContext(source, context);
const api=context.testAPI;
let rendered=0;
for(const r of api.reports){
  api.setReport(r);
  for(const v of ['overview','market','rotation','macro','research','library']){
    const output=api[v]();
    assert.ok(output.length>400,`${r.date} ${v} must render`);
    assert.ok(!output.includes('NaN'),`${r.date} ${v} cannot show NaN`);
    assert.ok(!output.includes('undefined'),`${r.date} ${v} cannot show undefined`);
    rendered++;
  }
  const slides=api.makeSlides();
  assert.ok(slides.length>=5,`${r.date} stories are available`);
}
api.setReport(api.reports[0]);
assert.equal(api.getEtf().date,'13 Oktober');
assert.equal(api.getEtf().flows.BTC,175.7);
assert.equal(api.getEtf().flows.ETH,24.8);
assert.equal(api.getEtf().partial[0],'14 Oktober');
assert.equal(api.getFx().rate,'17.898');
assert.equal(api.getFx().observation,'14 Oktober 2026');
assert.equal(api.pointsFor('BTC',7).length,8);
api.setFilter('buy');
assert.ok(api.marketTable().includes('Tidak ada aset yang cocok'));
api.setFilter('sell');
assert.equal((api.marketTable().match(/<tr data-asset=/g)||[]).length,9);
api.searchResults('CCIP');
assert.ok(node('search-results').innerHTML.includes('LINK'));
api.searchResults('notarealterm123456');
assert.ok(node('search-results').innerHTML.includes('Tidak ada hasil'));
console.log(`PASS: ${rendered} views across ${api.reports.length} reports; ETF final/partial, FX, filtering, search, Stories and archive graphs.`);
