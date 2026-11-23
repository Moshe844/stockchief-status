const sources=['https://raw.githubusercontent.com/Moshe844/stockchief-status/main/site/production-status.json','./production-status.json'];
export async function readStatus(fetcher=fetch,{timeoutMs=8000}={}){
 const results=await Promise.allSettled(sources.map(async url=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetcher(url+'?at='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});
   if(!response.ok)throw Error('Status not available');
   const data=await response.json();
   if(data?.version!==2||data.service!=='StockChief production'||data.origin!=='https://app.stockchiefhq.com'||!Array.isArray(data.checks)||!Number.isFinite(Date.parse(data.checks.at(-1)?.checkedAt)))throw Error('Status not valid');
   return data;
  }finally{clearTimeout(timer);}
 }));
 return results.filter(result=>result.status==='fulfilled').map(result=>result.value)
  .sort((a,b)=>Date.parse(b.checks.at(-1).checkedAt)-Date.parse(a.checks.at(-1).checkedAt))[0]||null;
}
