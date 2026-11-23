import {state} from './status-state.mjs';
import {readStatus} from './status-client.mjs';
let data={checks:[]},loading=false;
function render(){
 const view=state(data),badge=document.querySelector('[data-status]');badge.textContent=view.label;badge.dataset.tone=view.tone;
 const alert=document.querySelector('[data-alert]');alert.textContent=view.alert||'';alert.hidden=!view.alert;
 const components=document.querySelector('[data-components]');components.replaceChildren();
 for(const component of view.last?.components||[]){const line=document.createElement('li');line.textContent=component.name+': '+(view.tone==='unknown'?'Latest check is out of date':component.ok?'Responding':'Needs attention');components.append(line);}
 document.querySelector('[data-checked]').textContent=view.last?new Date(view.last.checkedAt).toLocaleString():'Waiting for the first check';
 document.querySelector('[data-latency]').textContent=view.last?view.last.latencyMs+' ms':'—';
 document.querySelector('[data-observed]').textContent=view.observedPercent===null?'No observations yet':view.observedPercent.toFixed(2)+'% across '+view.samples.toLocaleString()+' observed checks';
}
async function refresh(){
 if(loading)return;loading=true;
 try{const found=await readStatus();if(found&&Date.parse(found.checks.at(-1).checkedAt)>Date.parse(data.checks.at(-1)?.checkedAt||'1970-01-01'))data=found;}
 finally{loading=false;render();}
}
render();void refresh();
// Recompute freshness even while the next request is still waiting.
setInterval(()=>{render();void refresh();},60000);
