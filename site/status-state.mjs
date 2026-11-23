export function state(data,now=Date.now()){
 const checks=Array.isArray(data?.checks)?data.checks:[],last=checks.at(-1),age=last?now-Date.parse(last.checkedAt):Infinity;
 const current=Boolean(last&&Number.isFinite(age)&&age>=-60000&&age<=4*60000);
 const minutes=Math.round(age/60000),ago=minutes<120?minutes+' minutes':Math.round(minutes/60)+' hours';
 const days=Array.isArray(data?.days)?data.days.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.day)&&Date.parse(d.day+'T00:00:00Z')>=now-30*86400000&&Number.isSafeInteger(d.samples)&&Number.isSafeInteger(d.successful)&&d.samples>=d.successful&&d.successful>=0):null;
 const samples=days?days.reduce((n,d)=>n+d.samples,0):checks.length,successful=days?days.reduce((n,d)=>n+d.successful,0):checks.filter(c=>c.ok===true).length;
 return {alert:current?null:last&&Number.isFinite(age)?'Checks have stopped. The last one was '+ago+' ago, so this page cannot confirm whether the service is up.':'Checks have not started, so this page cannot confirm whether the service is up.',label:!current?'Monitoring delayed':last.ok===true?'Operational':'Service disruption',tone:!current?'unknown':last.ok===true?'up':'down',last:last||null,samples,observedPercent:samples?100*successful/samples:null};
}
