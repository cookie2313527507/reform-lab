/* Store only user-created simulation descriptors, never approvals or results. */
(() => {
 const key='reform-custom-materials-v1';let message='自定义材料保存在此浏览器';
 const kinds=['rect','L','cut'],grades=['Q235B','304','5052'];
 function valid(d){return d&&Number.isInteger(d.w)&&d.w>=60&&d.w<=350&&Number.isInteger(d.h)&&d.h>=50&&d.h<=260&&kinds.includes(d.kind)&&grades.includes(d.grade)&&[1.5,2,3].includes(d.thickness)&&typeof d.verified==='boolean';}
 function load(base){try{const raw=localStorage.getItem(key);if(!raw)return base;const list=JSON.parse(raw);if(!Array.isArray(list)||!list.every(valid))throw Error('invalid');return base.concat(list.map((d,i)=>({id:`RM-${String(base.length+i+1).padStart(3,'0')}`,name:'自定义'+({rect:'矩形',L:'L形',cut:'缺角'}[d.kind])+'余板',grade:d.grade,thickness:d.thickness,verified:d.verified,lot:'CUSTOM-SIM',source:'用户设定模拟数据',polygon:d.kind==='L'?[[0,0],[d.w,0],[d.w,d.h*.45],[d.w*.62,d.h*.45],[d.w*.62,d.h],[0,d.h]]:d.kind==='cut'?[[0,0],[d.w,0],[d.w,d.h*.68],[d.w*.75,d.h],[0,d.h]]:[[0,0],[d.w,0],[d.w,d.h],[0,d.h]]})));}catch{message='本地数据无法读取；当前为临时材料库，刷新会丢失新增材料';return base;}}
 function save(materials){try{const list=materials.filter(m=>m.lot==='CUSTOM-SIM').map(m=>({w:Math.max(...m.polygon.map(p=>p[0])),h:Math.max(...m.polygon.map(p=>p[1])),kind:m.name.includes('L形')?'L':m.name.includes('缺角')?'cut':'rect',grade:m.grade,thickness:m.thickness,verified:m.verified}));if(!list.every(valid))throw Error('invalid');localStorage.setItem(key,JSON.stringify(list));message='自定义材料已保存到此浏览器';}catch{message='保存失败：刷新会丢失新增材料，请勿关闭当前页面';}}
 window.ReformStore={load,save,status:()=>message};
})();
