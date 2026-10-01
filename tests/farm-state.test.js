import test from 'node:test';
import assert from 'node:assert/strict';
import {freshFarm,plots,stageAt,nearPlot,farmAction,validateFarm,loadFarm,saveFarm,SAVE_KEY,GROW_MS} from '../farm-state.js';
import {createWalker,walkable,clear} from '../movement.js';
import {bindKeyboard,createInput} from '../controls.js';
const time=100000;
test('six independent plots: plant, water, timed growth, reward, replant',()=>{
 let state=freshFarm();
 for(const p of plots){state=farmAction(state,p.id,p.approach,time);assert.equal(state.plots[p.id].stage,'planted');state=farmAction(state,p.id,p.approach,time+1);assert.equal(stageAt(state.plots[p.id],time+GROW_MS),'watered');assert.equal(stageAt(state.plots[p.id],time+GROW_MS+1),'ready');const waiting=farmAction(state,p.id,p.approach,time+2);assert.equal(waiting,state);state=farmAction(state,p.id,p.approach,time+GROW_MS+1);}
 assert.equal(state.harvests,6);assert.equal(state.coins,60);assert.ok(state.plots.every(p=>p.stage==='empty'));
 state=farmAction(state,0,plots[0].approach,time+GROW_MS+2);assert.equal(state.plots[0].stage,'planted');assert.equal(state.coins,60);
});
test('proximity and malformed action inputs cannot mutate state',()=>{
 const state=freshFarm();for(const id of [-1,6,100])assert.equal(farmAction(state,id,{x:0,z:0},time),state);
 for(const pos of [{x:30,z:30},{x:NaN,z:0},{x:Infinity,z:0},null])assert.equal(farmAction(state,0,pos,time),state);
 assert.equal(farmAction(state,0,plots[0].approach,NaN),state);assert.equal(nearPlot(plots[0].approach,0),true);
 const copy=JSON.stringify(state);farmAction(state,0,plots[0].approach,time);assert.equal(JSON.stringify(state),copy);
});
test('every crop approach is reachable by real walker with safe navigation',()=>{
 const w=createWalker();for(const p of plots){assert.ok(walkable(p.approach));assert.ok(w.go(p.approach));for(let i=0;i<800;i++){const before={...w.position};w.tick(.05);assert.ok(clear(before,w.position));}assert.ok(nearPlot(w.position,p.id));}
});
test('versioned persistence round trip and elapsed offline growth',()=>{
 let state=farmAction(freshFarm(),0,plots[0].approach,time);state=farmAction(state,0,plots[0].approach,time);
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 assert.equal(saveFarm(storage,state),true);assert.ok(data.has(SAVE_KEY));const result=loadFarm(storage,time+GROW_MS);assert.deepEqual(result.state,state);assert.equal(stageAt(result.state.plots[0],time+GROW_MS),'ready');assert.notEqual(result.state,state);
});
test('invalid saves, timestamps, rewards, versions and stages are rejected',()=>{
 const mutations=[s=>s.version=2,s=>s.harvests=-1,s=>s.harvests=1.2,s=>s.coins=10,s=>s.plots.pop(),s=>s.plots[0]=null,s=>s.plots[0].stage='ready',s=>s.plots[0].wateredAt=5,s=>s.plots[0]={stage:'watered',wateredAt:time+1},s=>s.plots[0]={stage:'watered',wateredAt:-1},s=>s.plots[0]={stage:'watered',wateredAt:1.5}];
 for(const mutate of mutations){const s=freshFarm();mutate(s);assert.equal(validateFarm(s,time),null);assert.deepEqual(loadFarm({getItem:()=>JSON.stringify(s)},time).state,freshFarm());}
 for(const raw of ['{','null','[]','42'])assert.deepEqual(loadFarm({getItem:()=>raw},time).state,freshFarm());
});
test('blocked storage fails gracefully and reset replaces saved progress',()=>{
 const blocked={getItem(){throw Error();},setItem(){throw Error();}};assert.match(loadFarm(blocked,time).notice,/unavailable/);assert.equal(saveFarm(blocked,freshFarm()),false);
 let raw;const storage={getItem:()=>raw??null,setItem:(k,v)=>raw=v};saveFarm(storage,farmAction(freshFarm(),0,plots[0].approach,time));saveFarm(storage,freshFarm());assert.deepEqual(loadFarm(storage,time).state,freshFarm());
});
test('F is canvas-only, nonrepeating, unmodified, and blocked by modal; native controls retain keys',()=>{
 const handlers={},canvas={},input=createInput(canvas);let farms=0,blocked=false;
 bindKeyboard({doc:{addEventListener:(k,f)=>handlers[k]=f},win:{addEventListener(){}},canvas,input,blocked:()=>blocked,stop(){},interact(){},farm:()=>farms++});
 const event={target:canvas,key:'F',preventDefault(){}};handlers.keydown(event);assert.equal(farms,1);
 for(const patch of [{target:{}},{repeat:true},{ctrlKey:true},{altKey:true},{metaKey:true}])handlers.keydown({...event,...patch});blocked=true;handlers.keydown(event);assert.equal(farms,1);
});
test('distance guard applies to harvest as well as planting and watering',()=>{
 let state=farmAction(freshFarm(),0,plots[0].approach,time);assert.equal(farmAction(state,0,{x:20,z:20},time),state);state=farmAction(state,0,plots[0].approach,time);assert.equal(farmAction(state,0,{x:20,z:20},time+GROW_MS),state);assert.equal(state.coins,0);
});
