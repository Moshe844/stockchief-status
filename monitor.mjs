import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const SERVICE_URL='https://stockchief-staging-web.onrender.com/healthz';
export async function probe({fetchImpl=fetch,now=Date.now}={}){
 const checkedAt=new Date(now()).toISOString(),start=performance.now();let ok=false,httpStatus=0;
 try{const response=await fetchImpl(SERVICE_URL,{redirect:'error',headers:{accept:'application/json'},signal:AbortSignal.timeout(10000)});httpStatus=response.status;ok=httpStatus===200&&(await response.json()).ok===true;}catch{}
 return {checkedAt,ok,httpStatus,latencyMs:Math.round(performance.now()-start)};
}
export function append(prior,check){const cutoff=Date.parse(check.checkedAt)-30*86400000;return {version:1,service:'StockChief staging',checks:[...(Array.isArray(prior?.checks)?prior.checks:[]).filter(r=>Date.parse(r.checkedAt)>=cutoff&&Date.parse(r.checkedAt)<Date.parse(check.checkedAt)),check].slice(-9000)};}
async function main(){let prior;try{prior=JSON.parse(await fs.readFile('site/status.json','utf8'));}catch{prior={checks:[]};}const check=await probe();await fs.writeFile('site/status.json',JSON.stringify(append(prior,check))+'\n');if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,'healthy='+check.ok+'\n');console.log(JSON.stringify(check));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
