(function(root){
 'use strict';
 const normalize=value=>String(value||'').trim().toLocaleLowerCase();
 function matches(material,query){const text=normalize([material.id,material.name,material.grade,material.lot].join(' '));return normalize(query).split(/\s+/).every(word=>text.includes(word));}
 function candidates(rows,config,{query='',status='all',sort='use'}={}){
  const filtered=rows.filter(r=>matches(r.material,query)&&(status==='all'||(status==='available'?!!r.placement:r.status===status)));
  return [...filtered].sort((a,b)=>{
   if(!a.placement)return b.placement?1:a.material.id.localeCompare(b.material.id);
   if(!b.placement)return -1;
   if(sort==='change'){const delta=(config.width-a.w+config.height-a.h)-(config.width-b.w+config.height-b.h);if(delta)return delta;}
   return b.utilization-a.utilization||a.material.id.localeCompare(b.material.id);
  });
 }
 function materials(rows,{query='',grade='all',status='all'}={}){return rows.filter(m=>matches(m,query)&&(grade==='all'||m.grade===grade)&&(status==='all'||(status==='verified'?m.verified:!m.verified)));}
 root.ReformUI={candidates,materials};
 if(typeof document!=='undefined'){
  let frame=null,latest=null;
  document.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const target=event.target.closest('.template-card,.material-card,.possibility');if(!target)return;
   latest={target,x:event.clientX,y:event.clientY};if(frame!==null)return;
   frame=requestAnimationFrame(()=>{frame=null;const {target,x,y}=latest;if(!target.isConnected)return;const box=target.getBoundingClientRect();target.style.setProperty('--pointer-x',(x-box.left)+'px');target.style.setProperty('--pointer-y',(y-box.top)+'px');});
  },{passive:true});
 }
 if(typeof module!=='undefined')module.exports=root.ReformUI;
})(typeof window!=='undefined'?window:globalThis);
