import {test} from 'node:test';import assert from 'node:assert/strict';
import {readStatus} from './site/status-client.mjs';
const sample=(at,extra={})=>({version:2,service:'StockChief production',origin:'https://app.stockchiefhq.com',checks:[{checkedAt:at,ok:true}],...extra});
const json=data=>({ok:true,json:async()=>data});
test('status reader uses the newest verified production observation from parallel sources',async()=>{
 const calls=[],old=sample('2026-11-22T20:00:00Z'),current=sample('2026-11-22T20:01:00Z');
 const result=await readStatus(async(url,options)=>{calls.push({url,options});return json(url.startsWith('https:')?old:current);});
 assert.deepEqual(result,current);assert.equal(calls.length,2);assert(calls.every(call=>call.options.credentials==='omit'&&call.options.cache==='no-store'));
});
test('a hung status source is aborted while a valid fallback remains usable',async()=>{
 let aborted=false;const current=sample('2026-11-22T20:01:00Z');
 const result=await readStatus(async(url,{signal})=>{if(url.startsWith('https:'))return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'));},{once:true}));return json(current);},{timeoutMs:20});
 assert(aborted);assert.deepEqual(result,current);
});
test('staging, malformed, redirected failures and unavailable observations never appear as healthy production',async()=>{
 for(const invalid of [sample('bad date'),sample('2026-11-22T20:00:00Z',{version:1}),sample('2026-11-22T20:00:00Z',{origin:'https://staging.example.test'}),sample('2026-11-22T20:00:00Z',{service:'StockChief staging'}),{}])assert.equal(await readStatus(async()=>json(invalid)),null);
 assert.equal(await readStatus(async()=>({ok:false})),null);assert.equal(await readStatus(async()=>{throw Error('offline');}),null);
});
