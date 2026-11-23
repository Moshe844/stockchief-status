import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {state} from './site/status-state.mjs';
test('the displayed badge becomes unknown even when a refresh is still hung, and recovers with new evidence',async()=>{
 const at=Date.parse('2026-11-22T20:00:00Z'),observation=time=>({version:2,checks:[{checkedAt:new Date(time).toISOString(),ok:true,latencyMs:12,components:[{name:'Web and database',ok:true}]}]});
 let now=at+1000,interval,next=async()=>observation(at);
 const nodes=new Map(),node=()=>({textContent:'',dataset:{},hidden:false,children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}});
 const document={querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},createElement:()=>node()};
 const script=fs.readFileSync(new URL('./site/status.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInNewContext(script,{document,state:data=>state(data,now),readStatus:()=>next(),Date,setInterval:callback=>{interval=callback;}});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(nodes.get('[data-status]').dataset.tone,'up');
 let release;next=()=>new Promise(resolve=>{release=resolve;});interval();
 now=at+5*60000;interval();assert.equal(nodes.get('[data-status]').dataset.tone,'unknown');
 assert.match(nodes.get('[data-alert]').textContent,/cannot confirm/);
 assert.match(nodes.get('[data-components]').children[0].textContent,/out of date/);
 release(observation(now));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(nodes.get('[data-status]').dataset.tone,'up');assert.equal(nodes.get('[data-alert]').hidden,true);
});
