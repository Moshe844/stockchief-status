export function state(data,now=Date.now()){
 const checks=Array.isArray(data?.checks)?data.checks:[],last=checks.at(-1),age=last?now-Date.parse(last.checkedAt):Infinity;
 const current=Boolean(last&&Number.isFinite(age)&&age>=-60000&&age<=12*60000);
 return {label:!current?'Monitoring delayed':last.ok===true?'Operational':'Service disruption',tone:!current?'unknown':last.ok===true?'up':'down',last:last||null,samples:checks.length,observedPercent:checks.length?100*checks.filter(c=>c.ok===true).length/checks.length:null};
}
