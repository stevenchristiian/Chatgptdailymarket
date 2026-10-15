import {getMarket} from './btc-risk-desk/market.mjs';
import {evaluateTracker,eventWindow} from './btc-risk-desk/tracker.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export function validateReport(data) {
 const r=data?.schema===1?data.report:null;
 if(!r||!['LONG','SHORT','NO TRADE'].includes(r.signal)||!Number.isFinite(Date.parse(r.asOf))||!Number.isFinite(Date.parse(r.validUntil))||Date.parse(r.validUntil)<=Date.parse(r.asOf)||Date.parse(r.validUntil)-Date.parse(r.asOf)>86400000||!Array.isArray(r.levels)||!Array.isArray(r.events)||!Array.isArray(r.sources))throw Error('Invalid public signal');
 // Explicit projection: a future publisher cannot accidentally expose extra state.
 return {asOf:r.asOf,validUntil:r.validUntil,signal:r.signal,headline:r.headline,reason:r.reason,
 levels:r.levels.map(x=>({kind:x.kind,low:x.low,high:x.high,note:x.note})),events:r.events.map(x=>({at:x.at,title:x.title,impact:x.impact,source:x.source})),invalidations:r.invalidations||[],sources:r.sources.map(x=>({title:x.title,url:x.url})),
 plan:r.plan?{direction:r.plan.direction,status:r.plan.status,entryLow:r.plan.entryLow,entryHigh:r.plan.entryHigh,stop:r.plan.stop,tracker:r.plan.tracker?{mode:r.plan.tracker.mode,breakout:r.plan.tracker.breakout,invalidation:r.plan.tracker.invalidation,volumeMultiplier:r.plan.tracker.volumeMultiplier,requireHigherLow:r.plan.tracker.requireHigherLow}:undefined}:null};
}
export default {
 async fetch(request,env) {
  const u=new URL(request.url);
  if(u.pathname!=='/api/btc')return u.pathname.startsWith('/api/')?json({error:'Not found'},404):env.ASSETS.fetch(request);
  if(request.method!=='GET')return new Response(JSON.stringify({error:'Read only'}),{status:405,headers:{...headers,Allow:'GET'}});
  let report;
  try{const res=await env.ASSETS.fetch(new Request(u.origin+'/btc-report.json'));if(!res.ok)throw Error();report=validateReport(await res.json());}
  catch{return json({error:'Salinan sinyal publik belum tersedia. Tidak ada konfirmasi baru.'},503);}
  let market=null;try{market=await getMarket();}catch{/* Feed failure never confirms a setup. */}
  const now=Date.now();
  return json({report,persisted:true,market,tracker:evaluateTracker(report,market,now),event:eventWindow(report,now),checkedAt:new Date(now).toISOString(),source:'Public market-only export from BTC Risk Desk'});
 }
};
