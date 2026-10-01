// Pure rules: timestamps are milliseconds; one harvest yields one crop and ten coins.
export const VERSION=1, SAVE_KEY='little-harvest:farm:v1', GROW_MS=12000, REWARD=10;
export const plots=Array.from({length:6},(_,id)=>({id,x:-5+(id%3)*3,z:1+Math.floor(id/3)*3,approach:{x:-5+(id%3)*3,z:2.1+Math.floor(id/3)*3}}));
export const freshFarm=()=>({version:VERSION,harvests:0,coins:0,plots:plots.map(()=>({stage:'empty',wateredAt:null}))});
export function stageAt(plot,now){return plot.stage==='watered'&&now>=plot.wateredAt+GROW_MS?'ready':plot.stage;}
export function nearPlot(position,id){const p=plots[id];return !!p&&Number.isFinite(position?.x)&&Number.isFinite(position?.z)&&Math.hypot(position.x-p.approach.x,position.z-p.approach.z)<=1;}
export function farmAction(state,id,position,now){
 if(!Number.isFinite(now)||now<0||!nearPlot(position,id))return state;
 const p=state.plots[id],stage=stageAt(p,now);if(stage==='watered')return state;
 const next={...state,plots:state.plots.map(p=>({...p}))};
 next.plots[id]=stage==='empty'?{stage:'planted',wateredAt:null}:stage==='planted'?{stage:'watered',wateredAt:now}:{stage:'empty',wateredAt:null};
 if(stage==='ready'){next.harvests++;next.coins+=REWARD;}return next;
}
export function validateFarm(value,now){
 if(!Number.isFinite(now)||now<0||!value||value.version!==VERSION||!Number.isSafeInteger(value.harvests)||value.harvests<0||value.harvests>1000000||value.coins!==value.harvests*REWARD||!Array.isArray(value.plots)||value.plots.length!==plots.length)return null;
 const clean=freshFarm();clean.harvests=value.harvests;clean.coins=value.coins;
 for(let i=0;i<plots.length;i++){const p=value.plots[i];if(!p||!['empty','planted','watered'].includes(p.stage))return null;
 if(p.stage==='watered'?(!Number.isSafeInteger(p.wateredAt)||p.wateredAt<0||p.wateredAt>now):p.wateredAt!==null)return null;
 clean.plots[i]={stage:p.stage,wateredAt:p.wateredAt};}return clean;
}
export function loadFarm(storage,now){
 let raw;
 try{raw=storage.getItem(SAVE_KEY);}catch{return {state:freshFarm(),notice:'Save unavailable · progress may last only this session.'};}
 if(raw===null)return {state:freshFarm(),notice:'Progress saves in this browser only.'};
 let state=null;
 try{if(raw.length<10000)state=validateFarm(JSON.parse(raw),now);}catch{/* malformed saves are discarded */}
 return {state:state||freshFarm(),notice:state?'Progress restored · this browser only.':'Invalid or outdated save reset · this browser only.'};
}
export function saveFarm(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
