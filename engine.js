(function(root){
 'use strict';
 const rectangle=(w,h)=>[[0,0],[w,0],[w,h],[0,h]];
 const seeds=[
  {id:'RM-001',name:'短边余板',grade:'Q235B',thickness:2,polygon:rectangle(166,116),verified:true,lot:'XY-260901',source:'罩板切割余料'},
  {id:'RM-002',name:'标准矩形余板',grade:'Q235B',thickness:2,polygon:rectangle(230,160),verified:true,lot:'XY-260902',source:'钣金试制余料'},
  {id:'RM-003',name:'L形余板',grade:'Q235B',thickness:2,polygon:[[0,0],[240,0],[240,75],[165,75],[165,180],[0,180]],verified:true,lot:'XY-260903',source:'开孔切割余料'},
  {id:'RM-004',name:'不锈钢余板',grade:'304',thickness:2,polygon:rectangle(195,145),verified:true,lot:'XY-260904',source:'设备面板余料'},
  {id:'RM-005',name:'来源待核验余板',grade:'Q235B',thickness:2,polygon:rectangle(180,130),verified:false,lot:'待核验',source:'模拟待检区'},
  {id:'RM-006',name:'厚板余料',grade:'Q235B',thickness:3,polygon:rectangle(200,145),verified:true,lot:'XY-260906',source:'支架切割余料'},
  {id:'RM-007',name:'窄条余料',grade:'Q235B',thickness:2,polygon:rectangle(230,86),verified:true,lot:'XY-260907',source:'边条切割余料'},
  {id:'RM-008',name:'缺角余板',grade:'Q235B',thickness:2,polygon:[[0,0],[210,0],[210,95],[155,150],[0,150]],verified:true,lot:'XY-260908',source:'轮廓切割余料'}
 ];
 const presets={
  cover:{name:'倒角设备检修盖板',shape:'chamfer',width:160,height:110,holeGap:80,holeDiameter:6,corner:18,use:'设备检修口 · 双孔固定'},
  angle:{name:'L形转角连接片',shape:'L',width:140,height:120,holeGap:76,holeDiameter:6,arm:44,holeCenters:[[-48,-36],[-48,36],[40,36]],use:'框架转角 · 三点连接'},
  saddle:{name:'U形避让安装板',shape:'U',width:160,height:120,holeGap:112,holeDiameter:6,arm:44,holeCenters:[[-56,-34],[56,-34],[0,38]],use:'绕开管线 · 开口安装'},
  flange:{name:'八角四孔安装法兰',shape:'octagon',width:140,height:140,holeGap:84,holeDiameter:8,corner:30,holeCenters:[[-42,0],[42,0],[0,-42],[0,42]],use:'设备接口 · 四点固定'},
  bracket:{name:'双孔安装底板',shape:'rect',width:140,height:90,holeGap:90,holeDiameter:8,use:'直线支座 · 基础对照'},
  tag:{name:'削角标识面板',shape:'chamfer',width:180,height:100,holeGap:100,holeDiameter:5,corner:20,use:'设备标识 · 双孔悬挂'}
 };
 // Coordinates are centred on the part datum. Shrinking never moves the holes.
 function holes(c){return c.holeCenters||[[-c.holeGap/2,0],[c.holeGap/2,0]];}
 function partPolygon(c,w=c.width,h=c.height){
  const a=w/2,b=h/2,t=c.arm||44,k=Math.min(c.corner||18,w/3,h/3);
  if(c.shape==='L')return [[-a,-b],[-a+t,-b],[-a+t,b-t],[a,b-t],[a,b],[-a,b]];
  if(c.shape==='U')return [[-a,-b],[-a+t,-b],[-a+t,b-t],[a-t,b-t],[a-t,-b],[a,-b],[a,b],[-a,b]];
  if(c.shape==='chamfer'||c.shape==='octagon')return [[-a+k,-b],[a-k,-b],[a,-b+k],[a,b-k],[a-k,b],[-a+k,b],[-a,b-k],[-a,-b+k]];
  return [[-a,-b],[a,-b],[a,b],[-a,b]];
 }
 function partValid(c,w=c.width,h=c.height){
  if((c.shape==='L'&&(w<=(c.arm||44)||h<=(c.arm||44)))||(c.shape==='U'&&(w<=2*(c.arm||44)||h<=(c.arm||44))))return false;
  const p=partPolygon(c,w,h),clearance=c.holeDiameter/2+8;
  return holes(c).every(q=>inside(q,p)&&p.every((a,i)=>distance(q,a,p[(i+1)%p.length])+1e-6>=clearance));
 }
 function transformPart(c,w,h,placement){const cx=placement.x+placement.w/2,cy=placement.y+placement.h/2;return partPolygon(c,w,h).map(([x,y])=>placement.rotated?[cx-y,cy+x]:[cx+x,cy+y]);}
 function polygonContained(r,p,margin){
  if(!r.every(q=>inside(q,p)))return false;
  for(let i=0;i<r.length;i++)for(let j=0;j<p.length;j++){
   const a=r[i],b=r[(i+1)%r.length],c=p[j],d=p[(j+1)%p.length];
   if(intersect(a,b,c,d))return false;
   if(Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))+1e-6<margin)return false;
  }
  return true;
 }
 function placePart(w,h,m,c){
  const b=bounds(m.polygon),margin=c.margin;
  if(area(partPolygon(c,w,h))>area(m.polygon))return null;
  for(const rotated of c.rotate?[false,true]:[false]){
   const pw=rotated?h:w,ph=rotated?w:h;
   for(const y of positions(b.h-ph-margin,margin))for(const x of positions(b.w-pw-margin,margin)){
    const p={x,y,w:pw,h:ph,rotated};if(polygonContained(transformPart(c,w,h,p),m.polygon,margin))return p;
   }
  }
  return null;
 }
 function area(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
 function bounds(p){return {w:Math.max(...p.map(q=>q[0])),h:Math.max(...p.map(q=>q[1]))};}
 function inside(q,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
 function distance(q,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dy);}
 function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
 function intersect(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a[0],b[0])>=Math.min(c[0],d[0])&&Math.max(c[0],d[0])>=Math.min(a[0],b[0])&&Math.max(a[1],b[1])>=Math.min(c[1],d[1])&&Math.max(c[1],d[1])>=Math.min(a[1],b[1]);}
 function contained(x,y,w,h,p,margin){const r=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];if(!r.every(q=>inside(q,p)))return false;for(let i=0;i<4;i++)for(let j=0;j<p.length;j++){const a=r[i],b=r[(i+1)%4],c=p[j],d=p[(j+1)%p.length];if(intersect(a,b,c,d))return false;const dist=Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b));if(dist+1e-6<margin)return false;}return true;}
 function positions(max,min){if(max<min)return [];const a=[];for(let v=min;v<=max+1e-6;v+=5)a.push(v);if(a[a.length-1]!==max)a.push(max);return a;}
 function place(w,h,m,margin,rotate){const b=bounds(m.polygon);for(const rotated of rotate?[false,true]:[false]){const pw=rotated?h:w,ph=rotated?w:h;for(const y of positions(b.h-ph-margin,margin))for(const x of positions(b.w-pw-margin,margin))if(contained(x,y,pw,ph,m.polygon,margin))return {x,y,w:pw,h:ph,rotated};}return null;}
 function validate(c){for(const k of ['width','height','holeGap','holeDiameter','thickness','margin','flexW','flexH'])if(!Number.isFinite(c[k]))throw Error('请填写有效的数字参数。');if(c.width<60||c.width>300||c.height<50||c.height>240)throw Error('零件宽度范围为60–300 mm，高度为50–240 mm。');if(c.flexW<0||c.flexW>24||c.flexH<0||c.flexH>24)throw Error('协商范围应在0–24 mm。');if(c.margin<2||c.margin>12)throw Error('加工留边应在2–12 mm。');if(c.holeGap<20||c.holeDiameter<2||c.holeGap+c.holeDiameter+16>c.width||c.holeDiameter+16>c.height)throw Error('孔位与外边界间至少需要8 mm实体距离，请调整外形或孔距。');if(!['Q235B','304','5052'].includes(c.grade)||![1.5,2,3].includes(c.thickness))throw Error('请选择支持的材料与厚度。');if(!partValid(c))throw Error('功能孔与零件轮廓之间至少需要8 mm实体距离，请增大外形或切换模板。');return c;}
 function netArea(w,h,c){return area(partPolygon(c,w,h))-holes(c).length*Math.PI*(c.holeDiameter/2)**2;}
 function solve(m,c,negotiate=true){
  validate(c);const reasons=[];
  if(!m.verified)reasons.push('来源尚未核验，不能推定材料合格');
  if(m.grade!==c.grade)reasons.push(`牌号不匹配：需要 ${c.grade}，库存为 ${m.grade}`);
  if(m.thickness!==c.thickness)reasons.push(`厚度不匹配：需要 ${c.thickness} mm，库存为 ${m.thickness} mm`);
  if(reasons.length)return {material:m,status:'rejected',reasons};
  if(!partValid(c))return {material:m,status:'rejected',reasons:['功能孔与零件轮廓之间不足8 mm实体距离，请增大外形尺寸']};
  let placement=placePart(c.width,c.height,m,c);
  let w=c.width,h=c.height,status='direct';
  if(!placement&&negotiate){
   const dims=[];
   for(let dw=0;dw<=(c.lockW?0:c.flexW);dw+=1)for(let dh=0;dh<=(c.lockH?0:c.flexH);dh+=1){if(!dw&&!dh)continue;const nw=c.width-dw,nh=c.height-dh;if(partValid(c,nw,nh))dims.push({w:nw,h:nh,loss:area(partPolygon(c))-area(partPolygon(c,nw,nh))});}
   dims.sort((a,b)=>a.loss-b.loss);
   for(const d of dims){placement=placePart(d.w,d.h,m,c);if(placement){w=d.w;h=d.h;status='negotiated';break;}}
  }
  if(!placement)return {material:m,status:'rejected',reasons:['当前搜索范围内无可行放置：外形、孔边距离或加工留边不满足；可检查尺寸锁定与协商范围']};
  const utilization=netArea(w,h,c)/area(m.polygon)*100;
  return {material:m,status,w,h,placement,polygon:transformPart(c,w,h,placement),utilization,change:area(partPolygon(c))-area(partPolygon(c,w,h)),reasons:status==='direct'?['原始外形可放入，关键孔位与加工留边满足几何约束']:['仅缩短已允许协商的外缘，孔径与孔中心基准保持不变'],checks:['牌号一致','厚度一致','来源已核验（模拟）',`${holes(c).length}个功能孔固定 · 孔边实体距离 ≥ 8 mm`,`全部轮廓边界留边 ≥ ${c.margin} mm`]};
 }
 function run(materials,c,negotiate=true){return materials.map(m=>solve(m,c,negotiate)).sort((a,b)=>{if(a.status==='rejected')return b.status==='rejected'?0:1;if(b.status==='rejected')return -1;return b.utilization-a.utilization;});}
 function inventory(count=24){const a=structuredClone(seeds);for(let i=8;i<count;i++){const w=145+(i*23)%112,h=92+(i*19)%90;a.push({id:`RM-${String(i+1).padStart(3,'0')}`,name:i===10?'转角工位L形余板':i%3===0?'批次缺角余板':'批次矩形余板',grade:i%9===0?'304':'Q235B',thickness:i%7===0?3:2,verified:i%11!==0,lot:`XY-26${String(901+i).padStart(4,'0')}`,source:'确定性模拟数据',polygon:i===10?[[0,0],[64,0],[64,76],[160,76],[160,140],[0,140]]:i%3===0?[[0,0],[w,0],[w,h-25],[w-30,h],[0,h]]:rectangle(w,h)});}return a;}
 function reverse(m,options){return Object.entries(presets).map(([preset,p])=>{const config={...options,...p,preset,grade:m.grade,thickness:m.thickness,lockW:false,lockH:false};return {preset,config,result:solve(m,config)};});}
 root.Yucai={seeds,presets,area,bounds,contained,place,validate,run,inventory,netArea,holes,partPolygon,partValid,transformPart,polygonContained,placePart,solve,reverse};
 if(typeof module!=='undefined')module.exports=root.Yucai;
})(typeof window!=='undefined'?window:globalThis);
