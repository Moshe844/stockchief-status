import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const SERVICE_URL='https://app.stockchiefhq.com/healthz';
export const READINESS_URL='https://app.stockchiefhq.com/readyz';
export const SERVICE='StockChief production',HISTORY_FILE='site/production-status.json';
export const MAX_RECENT_CHECKS=1440;
export async function probe({fetchImpl=fetch,now=Date.now}={}){
 const checkedAt=new Date(now()).toISOString(),start=performance.now();
 const components=await Promise.all([{name:'Web and database',url:SERVICE_URL},{name:'Background queue',url:READINESS_URL}].map(async target=>{
  let ok=false,httpStatus=0;const began=performance.now();
  try{const response=await fetchImpl(target.url,{redirect:'error',headers:{accept:'application/json'},signal:AbortSignal.timeout(10000)});httpStatus=response.status;
   const body=await response.json();ok=httpStatus===200&&body.ok===true&&(target.url!==READINESS_URL||body.deadJobs===0&&body.staleJobs===0);
  }catch{}
  return {name:target.name,ok,httpStatus,latencyMs:Math.round(performance.now()-began)};
 }));
 return {checkedAt,ok:components.every(c=>c.ok),httpStatus:components.find(c=>!c.ok)?.httpStatus??200,latencyMs:Math.round(performance.now()-start),components};
}
export function append(input,check){
 const prior=input?.version===2&&input.service===SERVICE?input:{checks:[],days:[]},last=prior.checks?.at(-1);
 if(last&&Date.parse(last.checkedAt)>=Date.parse(check.checkedAt))return prior;
 const day=check.checkedAt.slice(0,10),cutoff=new Date(Date.parse(day+'T00:00:00Z')-29*86400000).toISOString().slice(0,10);
 const days=new Map((prior.days||[]).filter(d=>d.day>=cutoff&&d.day<=day).map(d=>[d.day,{...d}])),bucket=days.get(day)||{day,samples:0,successful:0};
 bucket.samples++;if(check.ok===true)bucket.successful++;days.set(day,bucket);
 return {version:2,service:SERVICE,origin:'https://app.stockchiefhq.com',days:[...days.values()].sort((a,b)=>a.day.localeCompare(b.day)),checks:[...(prior.checks||[]),check].filter(c=>c.checkedAt.slice(0,10)>=cutoff).slice(-MAX_RECENT_CHECKS)};
}
async function main(){let prior;try{prior=JSON.parse(await fs.readFile(HISTORY_FILE,'utf8'));}catch{prior={checks:[]};}const check=await probe();await fs.writeFile(HISTORY_FILE,JSON.stringify(append(prior,check))+'\n');if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,'healthy='+check.ok+'\n');console.log(JSON.stringify(check));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
