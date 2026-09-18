(() => {
 'use strict';
 const E=window.Yucai;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const points=p=>p.map(q=>q.join(',')).join(' ');
 let thumbnailId=0;
 const labels={direct:'原尺寸可用',negotiated:'调整后可用',rejected:'暂不适用'};
 function thumbnail(c){const id='titanium-'+thumbnailId++;return `<svg class="part-thumb" viewBox="${-c.width/2-15} ${-c.height/2-15} ${c.width+30} ${c.height+30}" role="img" aria-label="${esc(c.name)}轮廓"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#deebff"/><stop offset=".27" stop-color="#8ca2c7"/><stop offset=".5" stop-color="#b9b8e0"/><stop offset=".75" stop-color="#61799f"/><stop offset="1" stop-color="#b4c8e9"/></linearGradient></defs><polygon points="${points(E.partPolygon(c))}" style="fill:url(#${id})"/>${E.holes(c).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${c.holeDiameter/2}"/>`).join('')}</svg>`;}
 function preview(row){
  const r=row.result,c=row.config,m=r.material,b=E.bounds(m.polygon),p=r.placement;
  if(!p)return thumbnail(c);
  const holes=E.holes(c).map(([x,y])=>p.rotated?[p.x+p.w/2-y,p.y+p.h/2+x]:[p.x+p.w/2+x,p.y+p.h/2+y]);
  return `<svg class="reverse-preview" viewBox="-12 -12 ${b.w+24} ${b.h+24}" role="img" aria-label="${esc(c.name)}在${m.id}中的放置"><polygon class="stock" points="${points(m.polygon)}"/><polygon class="part" points="${points(r.polygon)}"/>${holes.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${c.holeDiameter/2}"/>`).join('')}</svg>`;
 }
 function init(state){if(!state.reverse)state.reverse={material:state.selected,budget:12,margin:5,rotate:true,sort:'change',rows:null,dirty:false,probe:null};return state.reverse;}
 function ordered(r){return [...(r.rows||[])].sort((a,b)=>{
  const ar=a.result,br=b.result;if(ar.status==='rejected')return br.status==='rejected'?0:1;if(br.status==='rejected')return -1;
  const da=a.config.width-ar.w+a.config.height-ar.h,db=b.config.width-br.w+b.config.height-br.h;
  return r.sort==='use'?br.utilization-ar.utilization:da-db||br.utilization-ar.utilization;
 });}
 function resultMarkup(state){const r=init(state);
  if(!r.rows)return `<div class="reverse-empty panel"><div class="reverse-empty-heading"><div><span class="panel-kicker">余料边界 → 零件用途</span><h2>由材生形，先看六种可能</h2><p>轻触图谱查看用途与固定孔位，再按左侧材料与约束进行探索。</p></div><button class="btn primary" data-explore-entry>探索当前余料 ↗</button></div><div class="template-atlas" role="group" aria-label="待探索零件图谱">${Object.entries(E.presets).map(([key,c],i)=>`<button class="atlas-tile" data-atlas="${key}" aria-pressed="${i===0}">${thumbnail(c)}<strong>${esc(c.name)}</strong><small>${c.width} × ${c.height} mm · ${E.holes(c).length}孔</small></button>`).join('')}</div><div class="atlas-detail" aria-live="polite"><strong>${esc(E.presets.cover.name)}</strong><p>${esc(E.presets.cover.use)} · 功能孔径 Ø${E.presets.cover.holeDiameter} mm。此处为原始模板预览，尚未判断适配。</p></div><p class="atlas-note">当前材料：${esc(r.material)}。六种用途各自独立评估；轮廓、孔位、留边与模拟核验状态共同决定结果。</p></div>`;

  const rows=ordered(r),count=rows.filter(x=>x.result.placement).length;
  return `<div class="reverse-result-heading"><div><span class="panel-kicker">DESIGN POSSIBILITIES</span><h2>${count} 种可用零件 <small>/ ${rows.length} 种模板</small></h2></div><div class="reverse-sort" role="group" aria-label="用途排序"><button data-sort="change" class="filter ${r.sort==='change'?'active':''}" aria-pressed="${r.sort==='change'}">累计缩短更少</button><button data-sort="use" class="filter ${r.sort==='use'?'active':''}" aria-pressed="${r.sort==='use'}">利用率更高</button></div></div>
  <div class="reverse-cards">${rows.map(row=>{const q=row.result,c=row.config,ok=!!q.placement,delta=ok?c.width-q.w+c.height-q.h:0;return `<article class="panel possibility ${ok?'':'unavailable'}"><div class="card-top"><span class="tag ${q.status==='direct'?'green':ok?'orange':'red'}">${labels[q.status]}</span><span class="card-id">${E.holes(c).length} 孔 · Ø${c.holeDiameter}</span></div><div class="possibility-visual">${preview(row)}</div><h3>${esc(c.name)}</h3><p class="part-use">${c.use}</p>${ok?`<div class="possibility-metrics"><div><strong>${q.utilization.toFixed(1)}<small>%</small></strong><span>面积利用率</span></div><div><strong>${delta}<small> mm</small></strong><span>宽高累计缩短</span></div></div><p class="size-line">${c.width} × ${c.height} <span>→</span> ${q.w} × ${q.h} mm</p>`:`<p class="possibility-reason">${esc(q.reasons.join('；'))}</p>`}<div class="possibility-actions"><button class="btn primary wide" data-adopt="${row.preset}" ${ok?'':'disabled'}>带入工作台 <span aria-hidden="true">↗</span></button><button class="btn wide" data-probe="${row.preset}">寻找最小协商范围</button></div></article>`;}).join('')}</div>`;
 }
 function render(state){const r=init(state),m=state.materials.find(x=>x.id===r.material)||state.materials[0];r.material=m.id;
  return `<div class="page-title reverse-title"><div><div class="eyebrow">MATERIAL → POSSIBLE PRODUCTS</div><h1>先有余料，再找用途</h1><p>选一块材料，探索六种零件。比较改动与利用率，让余料参与设计。</p></div><span class="tag">余料反向设计</span></div><div class="reverse-layout"><section class="panel reverse-controls"><div class="panel-head"><div><span class="panel-kicker">01 / CHOOSE A MATERIAL</span><h2>这块余料，能做什么？</h2></div></div><div class="panel-body"><label class="label" for="reverse-material">选择余料</label><select id="reverse-material" class="control">${state.materials.map(x=>`<option value="${x.id}" ${x.id===m.id?'selected':''}>${x.id} · ${esc(x.name)} · ${x.grade}</option>`).join('')}</select><div class="reverse-stock"><svg viewBox="-15 -15 ${E.bounds(m.polygon).w+30} ${E.bounds(m.polygon).h+30}" role="img" aria-label="${esc(m.name)}轮廓"><polygon points="${points(m.polygon)}"/></svg><div><span class="tag ${m.verified?'green':'red'}">${m.verified?'模拟已核验':'来源待核验'}</span><p>${m.grade} · ${m.thickness} mm</p><small>${E.bounds(m.polygon).w} × ${E.bounds(m.polygon).h} mm</small></div></div><div class="range-field"><div class="field-heading"><label class="label" for="reverse-budget">宽、高各最多缩短</label><output id="reverse-budget-value">${r.budget} mm</output></div><input id="reverse-budget" type="range" min="0" max="24" value="${r.budget}" style="--fill:${r.budget/24*100}%"><div class="range-label"><span>保留原尺寸</span><span>24 mm</span></div></div><div class="field"><label class="label" for="reverse-margin">加工留边 / mm</label><input id="reverse-margin" type="number" min="2" max="12" step="1" class="control" value="${r.margin}"></div><label class="switch-row"><span>允许90°旋转</span><input id="reverse-rotate" type="checkbox" role="switch" ${r.rotate?'checked':''}></label><button class="btn primary wide" id="explore-material">探索适用零件 <span aria-hidden="true">↗</span></button><p class="hint reverse-status" role="status" aria-live="polite">${r.rows?'已按当前材料与边界完成探索':'牌号与厚度跟随所选余料，功能孔位保持固定'}</p></div></section><section class="reverse-results" aria-label="反向设计结果">${resultMarkup(state)}</section></div><p class="simulation-note">每种用途独立评估一个零件，不能同时制作所有候选。仅验证二维轮廓与孔位；结果是模拟设计建议。</p>`;
 }
 function bind(state,api){if(state.page!=='reverse')return;const r=init(state);
  function refresh(){document.querySelector('.reverse-results').innerHTML=resultMarkup(state);bindResults();}
  function invalidate(){r.rows=null;r.probe=null;r.dirty=true;refresh();document.querySelector('.reverse-status').textContent='参数已修改，点击探索更新用途。';}
  const material=document.getElementById('reverse-material');material.onchange=e=>{r.material=e.target.value;r.rows=null;r.probe=null;api.render();};
  document.getElementById('reverse-budget').oninput=e=>{r.budget=Number(e.target.value);e.target.style.setProperty('--fill',r.budget/24*100+'%');document.getElementById('reverse-budget-value').textContent=r.budget+' mm';invalidate();};
  document.getElementById('reverse-margin').oninput=e=>{r.margin=Number(e.target.value);invalidate();};
  document.getElementById('reverse-rotate').onchange=e=>{r.rotate=e.target.checked;invalidate();};
  document.getElementById('explore-material').onclick=async()=>{
   const input=document.getElementById('reverse-margin');if(!input.reportValidity()||r.margin<2||r.margin>12){api.toast('加工留边需在2至12 mm之间。');return;}
   const button=document.getElementById('explore-material');button.disabled=true;button.textContent='正在逐个检查轮廓…';
   // Compute from an immutable snapshot; navigation cannot apply a stale result.
   const snapshot={material:r.material,budget:r.budget,margin:r.margin,rotate:r.rotate};
   await new Promise(resolve=>setTimeout(resolve,35));
   const m=state.materials.find(x=>x.id===snapshot.material);
   const rows=E.reverse(m,{margin:snapshot.margin,flexW:snapshot.budget,flexH:snapshot.budget,rotate:snapshot.rotate});
   if(Object.keys(snapshot).some(k=>snapshot[k]!==r[k])){if(state.page==='reverse')api.render();return;}
   r.rows=rows;r.dirty=false;if(state.page!=='reverse')return;refresh();button.disabled=false;button.innerHTML='重新探索 <span aria-hidden="true">↗</span>';document.querySelector('.reverse-status').textContent='探索完成 · 点击方案带入工作台，或寻找最小协商范围。';
  };
  function bindResults(){
   document.querySelectorAll("[data-explore-entry]").forEach(b=>b.onclick=()=>document.getElementById("explore-material").click());
   document.querySelectorAll("[data-atlas]").forEach(b=>b.onclick=()=>{const c=E.presets[b.dataset.atlas];document.querySelectorAll("[data-atlas]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));document.querySelector(".atlas-detail").innerHTML=`<strong>${esc(c.name)}</strong><p>${esc(c.use)} · 原始外形 ${c.width} × ${c.height} mm · ${E.holes(c).length}个固定孔 · 孔径 Ø${c.holeDiameter} mm。尚未判断适配。</p>`;});
   document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{r.sort=b.dataset.sort;refresh();});
   document.querySelectorAll('[data-adopt]').forEach(b=>b.onclick=()=>{const row=r.rows.find(x=>x.preset===b.dataset.adopt);if(row?.result.placement)api.apply(row.config,r.material);});
   document.querySelectorAll('[data-probe]').forEach(b=>b.onclick=()=>probe(b.dataset.probe,state,api));
  }
  bindResults();
 }
 async function probe(key,state,api){const r=init(state),m=state.materials.find(x=>x.id===r.material),p=E.presets[key];
  const options={margin:r.margin,rotate:r.rotate,grade:m.grade,thickness:m.thickness,lockW:false,lockH:false,...p,preset:key};
  const d=api.openDialog(`<div class="panel-body"><div class="eyebrow">BOUNDARY PROBE / 0–24 mm</div><h2>${p.name}</h2><p class="probe-intro">在这块余料上，至少要允许缩短多少，才会出现可行方案？</p><div class="probe-content" role="status" aria-live="polite">正在探索尺寸边界…</div><div class="actions"><button class="btn" data-close>关闭</button></div></div>`);
  await new Promise(resolve=>setTimeout(resolve,35));
  // Solve the maximum envelope once. Feasibility is monotone in the allowed
  // search range; a binary search finds the smallest integer shared limit.
  const solve=budget=>E.solve(m,{...options,flexW:budget,flexH:budget});
  const max=solve(24);let minimum=null,answer=null;
  if(max.placement){let lo=0,hi=24;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(solve(mid).placement)hi=mid;else lo=mid+1;}minimum=lo;answer=solve(lo);}
  if(!d.isConnected)return;
  d.querySelector('.probe-content').innerHTML=`<div class="probe-scale">${[0,4,8,12,16,20,24].map(n=>`<div class="probe-tick ${minimum!==null&&n>=minimum?'possible':''}"><i></i><span>${n} mm</span></div>`).join('')}</div>${answer?`<div class="probe-answer"><strong>${minimum}<small> mm</small></strong><div><b>宽、高共用的最小允许缩短上限</b><p>实际建议 ${answer.w} × ${answer.h} mm<br>宽缩短 ${p.width-answer.w} mm，高缩短 ${p.height-answer.h} mm</p></div></div><button class="btn primary wide" id="apply-probe">应用这个边界，带入工作台</button>`:`<div class="reject-reason">0–24 mm内未找到可行方案。${esc(max.reasons.join('；'))}</div>`}<p class="hint">此最小值对应当前模板、留边与采样规则；孔位保持固定。</p>`;
  if(answer)d.querySelector('#apply-probe').onclick=()=>{d.close();api.apply({...options,flexW:minimum,flexH:minimum},m.id);};
 }
 // Event feedback applies to keyboard activation and newly rendered controls.
 document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;button.animate([{filter:'brightness(1.45)'},{filter:'brightness(1)'}],{duration:330,easing:'ease-out'});});
 window.ReformReverse={render,bind,thumbnail};
})();
