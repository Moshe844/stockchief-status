// One long-running job takes a check every five minutes. GitHub can delay a
// schedule by hours and a single failed dispatch must not end monitoring, so
// nothing here depends on a new run starting on time. A failed step is logged
// and the next tick carries on.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {probe,append} from './monitor.mjs';

export const EVERY_MS=5*60000;
export const RUN_MS=340*60000;
export const DOWN_AFTER=2;
const DOWN_TITLE='StockChief staging is down';

const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000});
const quietly=(what,fn)=>{try{return fn();}catch(error){console.error(what+' failed: '+String(error.stderr||error.message).slice(0,300));return null;}};

// Another run can only add newer observations, so retry on top of what is there.
function saveHistory(attempts=5){
 quietly('commit',()=>{run('git',['add','site/status.json']);run('git',['commit','-m','Record staging availability observation']);});
 for(let attempt=1;attempt<=attempts;attempt++){
  if(quietly('push',()=>{run('git',['pull','--rebase','--autostash','origin','main']);run('git',['push','origin','HEAD:main']);return true;}))return true;
  execFileSync('sleep',[String(attempt*5)]);
 }
 return false;
}

export function failedInARow(checks){let count=0;for(let i=checks.length-1;i>=0&&checks[i].ok!==true;i--)count++;return count;}

// An open issue emails the repository owner, and closing it records the recovery.
export function outageAction(checks,isOpen){const down=failedInARow(checks)>=DOWN_AFTER;return down&&!isOpen?'open':!down&&isOpen&&checks.at(-1)?.ok===true?'close':null;}

function syncOutageIssue(checks,last){
 const found=quietly('issue lookup',()=>run('gh',['issue','list','--state','open','--search','in:title "'+DOWN_TITLE+'"','--json','number','--jq','.[0].number // ""']).trim());
 if(found===null)return;
 const action=outageAction(checks,Boolean(found));
 if(action==='open')quietly('issue open',()=>run('gh',['issue','create','--title',DOWN_TITLE,'--body','The last '+failedInARow(checks)+' checks failed. Latest: HTTP '+last.httpStatus+' at '+last.checkedAt+'.']));
 if(action==='close')quietly('issue close',()=>run('gh',['issue','close',found,'--comment','Recovered at '+last.checkedAt+'.']));
}

async function tick(){
 quietly('pull',()=>run('git',['pull','--rebase','--autostash','origin','main']));
 let prior;try{prior=JSON.parse(await fs.readFile('site/status.json','utf8'));}catch{prior={checks:[]};}
 const check=await probe(),next=append(prior,check);
 await fs.writeFile('site/status.json',JSON.stringify(next)+'\n');
 console.log(JSON.stringify(check));
 saveHistory();
 syncOutageIssue(next.checks,check);
}

async function main(){
 const started=Date.now();
 while(Date.now()-started<RUN_MS){
  const began=Date.now();
  try{await tick();}catch(error){console.error('check failed: '+error.message);}
  await new Promise(resolve=>setTimeout(resolve,Math.max(1000,EVERY_MS-(Date.now()-began))));
 }
 // The schedule normally has a run queued behind this one. Ask for one anyway.
 for(let attempt=1;attempt<=8;attempt++){
  if(quietly('next run',()=>{run('gh',['workflow','run','status.yml','--ref','main']);return true;}))break;
  await new Promise(resolve=>setTimeout(resolve,attempt*20000));
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
