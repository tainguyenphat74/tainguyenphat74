import {createWalker,entrances} from './movement.js';
import {createInput,orbit,bindKeyboard} from './controls.js';
import {shouldRender} from './render-policy.js';
import {buildings} from './world.js';
const projects={feedbackfun:{name:'FeedbackFun',category:'01 / Feedback café · Customer feedback',image:'assets/feedbackfun.png',description:'A native feedback widget that lets users chat, request features, report bugs, and view a roadmap directly on your site.',url:'https://feedbackfun.com'},specviewer:{name:'SpecViewer',category:'02 / Developer workshop · Developer tool',image:'assets/specviewer.png',description:'Explore and visualize OpenAPI specs in one place — no backend, login, or setup required.',url:'https://specviewer.app'},echoling:{name:'Echoling',category:'03 / Listening cabin · Learning',image:'assets/echoling.png',description:'Learn a language by echoing real YouTube speech, with shadowing practice and spaced repetition.',url:'https://echoling-eosin.vercel.app'}};
const canvas=document.getElementById('island'),world=document.getElementById('world');
const detail=document.getElementById('project-dialog'),directory=document.getElementById('list-dialog');
const status=document.getElementById('walk-status'),interact=document.getElementById('interact');
const walker=createWalker(),input=createInput(canvas),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let view,raf=0,previous=0,failed=false,lastNearby,returnFocus=canvas,lastRender=-Infinity,lastState='';
const initial=()=>({yaw:.22,pitch:.72,distance:innerWidth<700?52:36});let camera=initial();
const modalOpen=()=>detail.open||directory.open;
function stop(){input.stop(()=>walker.stop());}
function showProject(id){if(!id)return;stop();const p=projects[id];
 document.getElementById('project-category').textContent=p.category;
 document.getElementById('project-title').textContent=p.name;
 document.getElementById('project-description').textContent=p.description;
 const img=document.getElementById('project-image');img.src=p.image;img.alt=p.name+' project screenshot';
 document.getElementById('project-link').href=p.url;detail.showModal();
}
function navigate(point,id){stop();canvas.focus({preventScroll:true});returnFocus=canvas;
 status.textContent=walker.go(point,id)?id?`Walking to ${projects[id].name}…`:'On my way…':'That spot is off the path. Try some open grass.';
}
for(const button of document.querySelectorAll('#labels button'))button.addEventListener('click',()=>navigate(entrances[button.dataset.project],button.dataset.project));
for(const button of document.querySelectorAll('.project-row'))button.addEventListener('click',()=>{returnFocus=button;showProject(button.dataset.project);});
document.getElementById('view-projects').addEventListener('click',()=>{stop();directory.showModal();});
interact.addEventListener('click',()=>{returnFocus=canvas;showProject(walker.interact());});
for(const dialog of [detail,directory]){dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{stop();if(dialog===detail&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});}
function fail(message){failed=true;stop();cancelAnimationFrame(raf);world.classList.remove('ready');world.classList.add('failed');document.getElementById('fallback-message').textContent=message;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('The 3D world paused because its graphics context was lost. All projects are available below. Reload to explore the island again.');});
canvas.addEventListener('webglcontextrestored',()=>{document.getElementById('fallback-message').textContent='Graphics are available again. Reload to rebuild the island, or explore the projects below.';});
bindKeyboard({doc:document,win:window,canvas,input,blocked:()=>modalOpen()||failed,stop,interact:e=>{if(walker.nearby()){e.preventDefault();returnFocus=canvas;showProject(walker.interact());}}});
window.addEventListener('blur',()=>{stop();pointers.clear();gesture=null;});
document.addEventListener('visibilitychange',()=>{stop();previous=0;cancelAnimationFrame(raf);if(!document.hidden&&view&&!failed)raf=requestAnimationFrame(frame);});
reduced.addEventListener('change',stop);
// A short tap walks; a drag or two-finger gesture only changes the camera.
const pointers=new Map();let gesture=null;
canvas.addEventListener('pointerdown',e=>{if(failed||modalOpen())return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,moved:false};else if(gesture)gesture.moved=true;});
canvas.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p||!gesture)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
 if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1];const before=Math.hypot(p.x-other.x,p.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);camera=orbit(camera,0,0,(before-after)*3);gesture.moved=true;}
 else if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5||gesture.moved){gesture.moved=true;camera=orbit(camera,dx,dy);}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
});
canvas.addEventListener('pointerup',e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(!pointers.size){if(gesture&&!gesture.moved&&view){const hit=view.pick(e.clientX,e.clientY);if(hit)navigate(hit.id?entrances[hit.id]:hit.point,hit.id);}gesture=null;}});
canvas.addEventListener('pointercancel',()=>{pointers.clear();gesture=null;stop();});
canvas.addEventListener('wheel',e=>{if(failed)return;e.preventDefault();camera=orbit(camera,0,0,Math.max(-150,Math.min(150,e.deltaY)));},{passive:false});
document.getElementById('zoom-in').addEventListener('click',()=>camera=orbit(camera,0,0,-100));
document.getElementById('zoom-out').addEventListener('click',()=>camera=orbit(camera,0,0,100));
document.getElementById('reset-camera').addEventListener('click',()=>camera=initial());
function frame(now){if(failed||document.hidden)return;const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
 try{if(!modalOpen()){const opened=walker.tick(dt,input.direction(camera.yaw));if(opened)showProject(opened);}
 const nearby=walker.nearby();interact.hidden=!nearby;if(nearby!==lastNearby){if(nearby){status.textContent=`${projects[nearby].name} · Press E to explore`;interact.textContent=`Explore ${projects[nearby].name} ↗`;}else if(lastNearby)status.textContent='Tap the grass to wander. Select a place to visit.';lastNearby=nearby;}
 const state=[camera.yaw,camera.pitch,camera.distance,walker.position.x,walker.position.z,walker.facing,walker.walking,canvas.clientWidth,canvas.clientHeight].join(',');
 if(shouldRender({modal:modalOpen(),changed:state!==lastState,reduced:reduced.matches,elapsed:(now-lastRender)/1000})){
 view.render(camera,walker,now/1000,reduced.matches);lastRender=now;lastState=state;
 }
 for(const b of buildings){const label=document.querySelector(`#labels [data-project="${b.id}"]`),p=view.project(b);label.style.left=p.x+'px';label.style.top=p.y+'px';label.hidden=!p.visible;}
 raf=requestAnimationFrame(frame);
 }catch(error){console.error(error);fail('The island could not render on this device. You can still explore every project below.');}
}
try{const {createScene}=await import('./scene.js');view=createScene(canvas);view.resize();window.addEventListener('resize',()=>view.resize());world.classList.add('ready');raf=requestAnimationFrame(frame);}catch(error){console.error(error);fail('The 3D island needs WebGL. You can still explore every project below.');}
