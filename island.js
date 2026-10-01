import {createWalker,entrances} from './movement.js';
import {createInput,orbit,bindKeyboard} from './controls.js';
import {shouldRender} from './render-policy.js';
import {buildings} from './world.js';
import {plots,freshFarm,stageAt,nearPlot,farmAction,loadFarm,saveFarm,GROW_MS} from './farm-state.js';
const canvas=document.getElementById('island'),world=document.getElementById('world');
const help=document.getElementById('help-dialog');
const status=document.getElementById('walk-status');
const walker=createWalker(),input=createInput(canvas),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let view,raf=0,previous=0,failed=false,lastNearby,lastRender=-Infinity,lastState='';
const initial=()=>({yaw:.10,pitch:.88,distance:innerWidth<700?43:31});let camera=initial();
const modalOpen=()=>help.open;
let storage;try{storage=window.localStorage;}catch{/* blocked storage */}
const loaded=loadFarm(storage,Date.now());let farm=loaded.state,selected=null,lastArrived=null;
const action=document.getElementById('farm-action'),context=document.getElementById('farm-context'),score=document.getElementById('farm-score'),notice=document.getElementById('save-notice');notice.textContent=loaded.notice;
function persist(){notice.textContent=saveFarm(storage,farm)?'Saved in this browser only · no cloud sync.':'Save unavailable · progress lasts only this session.';}
function farmHere(){if(failed||modalOpen())return;const id=activePlot();if(id===null)return;const next=farmAction(farm,id,walker.position,Date.now());if(next!==farm){const harvested=next.harvests>farm.harvests;farm=next;persist();updateFarm();status.textContent=harvested?'Harvest collected · +10 coins. Plant again!':'Farm updated · follow the action below.';}}
function activePlot(){if(selected!==null&&nearPlot(walker.position,selected))return selected;return plots.find(p=>nearPlot(walker.position,p.id))?.id??null;}
function updateFarm(){const id=activePlot(),now=Date.now();score.textContent=`${farm.harvests>=6?`Goal complete · ${farm.harvests} crops`:`Harvest 6 crops · ${farm.harvests} / 6`} · ${farm.coins} coins`;
 if(id===null){action.disabled=true;action.textContent='Approach a crop bed';context.textContent=selected===null?'Select a bed · plant → water → harvest':'Walk beside the selected bed to farm.';return;}
 const p=farm.plots[id],stage=stageAt(p,now);action.disabled=stage==='watered';action.textContent=stage==='empty'?'Plant seeds · F':stage==='planted'?'Water crop · F':stage==='ready'?'Harvest +10 coins · F':'Growing…';context.textContent=`Bed ${id+1} · ${stage==='watered'?`watered · ready in ${Math.max(1,Math.ceil((p.wateredAt+GROW_MS-now)/1000))}s`:stage}`;
}
action.addEventListener('click',farmHere);
document.getElementById('new-game').addEventListener('click',()=>{if(failed||modalOpen())return;stop();farm=freshFarm();selected=null;persist();updateFarm();status.textContent='New season started. Plant, water, and harvest six crops.';});
function selectPlot(id){if(failed||modalOpen())return;selected=id;lastArrived=null;navigate(plots[id].approach);status.textContent=`Walking to bed ${id+1}…`;}

function stop(){input.stop(()=>walker.stop());}
function navigate(point,id){if(failed||modalOpen())return;stop();canvas.focus({preventScroll:true});
 status.textContent=walker.go(point,id)?id?`Walking to ${buildings.find(b=>b.id===id).label}…`:'On my way…':'That spot is off the path. Try some open grass.';
}
for(const button of document.querySelectorAll('#labels button'))button.addEventListener('click',()=>navigate(entrances[button.dataset.building],button.dataset.building));
for(const button of document.querySelectorAll('[data-bed]'))button.addEventListener('click',()=>selectPlot(Number(button.dataset.bed)));
document.getElementById('help').addEventListener('click',()=>{stop();pointers.clear();gesture=null;help.showModal();});
help.querySelector('.close').addEventListener('click',()=>help.close());
help.addEventListener('close',()=>{stop();document.getElementById('help').focus();});
function fail(message){failed=true;stop();cancelAnimationFrame(raf);world.classList.remove('ready');world.classList.add('failed');document.getElementById('fallback-message').textContent=message;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('The 3D world paused because its graphics context was lost. Reload to return to Little Harvest.');});
canvas.addEventListener('webglcontextrestored',()=>{document.getElementById('fallback-message').textContent='Graphics are available again. Reload to rebuild the farm.';});
bindKeyboard({doc:document,win:window,canvas,input,blocked:()=>modalOpen()||failed,stop,farm:farmHere});
window.addEventListener('blur',()=>{stop();pointers.clear();gesture=null;});
document.addEventListener('visibilitychange',()=>{stop();previous=0;cancelAnimationFrame(raf);if(!document.hidden&&view&&!failed)raf=requestAnimationFrame(frame);});
reduced.addEventListener('change',stop);
// A short tap walks; a drag or two-finger gesture only changes the camera.
const pointers=new Map();let gesture=null;
canvas.addEventListener('pointerdown',e=>{if(failed||modalOpen())return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,moved:false};else if(gesture)gesture.moved=true;});
canvas.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(failed||modalOpen()||!p||!gesture)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
 if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1];const before=Math.hypot(p.x-other.x,p.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);camera=orbit(camera,0,0,(before-after)*3);gesture.moved=true;}
 else if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5||gesture.moved){gesture.moved=true;camera=orbit(camera,dx,dy);}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
});
canvas.addEventListener('pointerup',e=>{if(failed||modalOpen()||!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(!pointers.size){if(gesture&&!gesture.moved&&view){const hit=view.pick(e.clientX,e.clientY);if(hit){const plot=hit.plot??plots.find(p=>Math.abs(p.x-hit.point.x)<1.2&&Math.abs(p.z-hit.point.z)<.85)?.id;if(plot!==undefined)selectPlot(plot);else{selected=null;navigate(hit.id?entrances[hit.id]:hit.point,hit.id);}}}gesture=null;}});
canvas.addEventListener('pointercancel',()=>{pointers.clear();gesture=null;stop();});
canvas.addEventListener('wheel',e=>{if(failed||modalOpen())return;e.preventDefault();camera=orbit(camera,0,0,Math.max(-150,Math.min(150,e.deltaY)));},{passive:false});
document.getElementById('zoom-in').addEventListener('click',()=>camera=orbit(camera,0,0,-100));
document.getElementById('zoom-out').addEventListener('click',()=>camera=orbit(camera,0,0,100));
document.getElementById('reset-camera').addEventListener('click',()=>camera=initial());
function frame(now){if(failed||document.hidden)return;const dt=previous?Math.min((now-previous)/1000,.25):0;previous=now;
 try{if(!modalOpen()&&document.activeElement===canvas){for(let remaining=dt;remaining>0;remaining-=.05)walker.tick(Math.min(.05,remaining),input.direction(camera.yaw));}updateFarm();if(selected!==null&&!walker.walking&&nearPlot(walker.position,selected)&&lastArrived!==selected){status.textContent=`At bed ${selected+1} · use the action below or press F.`;lastArrived=selected;}
 const nearby=walker.nearby();if(nearby!==lastNearby){if(nearby)status.textContent=buildings.find(b=>b.id===nearby).hint;else if(lastNearby)status.textContent='Select a bed to plant, water, and harvest.';lastNearby=nearby;}
 const state=[JSON.stringify(farm),farm.plots.some(p=>p.stage==='watered'&&stageAt(p,Date.now())!=='ready')?Math.floor(now/250):farm.plots.map(p=>stageAt(p,Date.now())).join(),view.revision,reduced.matches,camera.yaw,camera.pitch,camera.distance,walker.position.x,walker.position.z,walker.facing,walker.walking,canvas.clientWidth,canvas.clientHeight].join(',');
 if(shouldRender({modal:modalOpen(),changed:state!==lastState,reduced:reduced.matches,elapsed:(now-lastRender)/1000})){
 view.render(camera,walker,now/1000,reduced.matches,farm,Date.now());lastRender=now;lastState=state;
 }
 const occupied=[...document.querySelectorAll('.game-header,.farm-hud,.bottom')].map(el=>el.getBoundingClientRect());
 for(const b of buildings){const label=document.querySelector(`#labels [data-building="${b.id}"]`),p=view.project(b);label.hidden=!p.visible;if(!p.visible)continue;
 const width=label.offsetWidth,height=label.offsetHeight,x=Math.max(width/2+8,Math.min(canvas.clientWidth-width/2-8,p.x));
 const box={left:x-width/2,right:x+width/2,top:p.y-height,bottom:p.y};label.hidden=occupied.some(r=>box.left<r.right+4&&box.right>r.left-4&&box.top<r.bottom+4&&box.bottom>r.top-4);if(!label.hidden)occupied.push(box);label.style.left=x+'px';label.style.top=p.y+'px';}
 raf=requestAnimationFrame(frame);
 }catch(error){console.error(error);fail('The farm could not render on this device. Little Harvest requires JavaScript and WebGL. Enable graphics support and retry.');}
}
try{const {createScene}=await import('./scene.js');view=createScene(canvas);view.resize();window.addEventListener('resize',()=>view.resize());world.classList.add('ready');raf=requestAnimationFrame(frame);}catch(error){console.error(error);fail('The 3D farm needs WebGL. Little Harvest requires JavaScript and WebGL. Enable graphics support and retry.');}

// Read-only QA snapshots and real screen coordinates; no state injection or teleportation.
window.__farm={snapshot:()=>({character:{...walker.position},walking:walker.walking,selected,nearby:walker.nearby(),farm:structuredClone(farm),stages:farm.plots.map(p=>stageAt(p,Date.now())),plots:structuredClone(plots),camera:{...camera}}),project:point=>view?.project({...point,y:point.y??.1}),get ready(){return !!view&&!failed&&Number.isFinite(lastRender);}};
