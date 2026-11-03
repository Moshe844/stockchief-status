export function state(data,now=Date.now()){
 const checks=Array.isArray(data?.checks)?data.checks:[],last=checks.at(-1),age=last?now-Date.parse(last.checkedAt):Infinity;
 const current=Boolean(last&&Number.isFinite(age)&&age>=-60000&&age<=12*60000);
 const minutes=Math.round(age/60000),ago=minutes<120?minutes+' minutes':Math.round(minutes/60)+' hours';
 return {alert:current?null:last&&Number.isFinite(age)?'Checks have stopped. The last one was '+ago+' ago, so this page cannot confirm whether the service is up.':'Checks have not started, so this page cannot confirm whether the service is up.',label:!current?'Monitoring delayed':last.ok===true?'Operational':'Service disruption',tone:!current?'unknown':last.ok===true?'up':'down',last:last||null,samples:checks.length,observedPercent:checks.length?100*checks.filter(c=>c.ok===true).length/checks.length:null};
}
