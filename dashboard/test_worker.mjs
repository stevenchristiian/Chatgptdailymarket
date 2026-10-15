import worker,{validateReport} from './worker.mjs';
import assert from 'node:assert/strict';
let assets=0,market=0;
const env={ASSETS:{fetch:async()=>{assets++;return new Response('missing',{status:404});}}};
for(const method of ['POST','PUT','DELETE','PATCH']){const r=await worker.fetch(new Request('https://example.test/api/btc',{method}),env);assert.equal(r.status,405);}
for(const route of ['report','desk','desk/action','monitor'])assert.equal((await worker.fetch(new Request('https://example.test/api/'+route),env)).status,404);
assert.equal(assets,0,'writes and private APIs cannot touch storage');
assert.equal((await worker.fetch(new Request('https://example.test/api/btc'),env)).status,503);
const r={schema:1,report:{asOf:'2026-10-15T00:00:00Z',validUntil:'2026-10-15T12:00:00Z',signal:'NO TRADE',levels:[],events:[],sources:[],capital:1000,orders:['x'],journal:['x'],balance:100,plan:null}};
const p=validateReport(r);for(const key of ['capital','orders','journal','balance'])assert.ok(!(key in p));
assert.throws(()=>validateReport({schema:1,report:{...r.report,asOf:'bad'}}));
console.log('PASS: public GET only, private endpoint isolation, missing-data failure and response allowlist.');
