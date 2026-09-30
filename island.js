import {createWalker, entrances, move} from './movement.js';
const projects={feedbackfun:{name:'FeedbackFun',category:'01 / Feedback café · Customer feedback',image:'assets/feedbackfun.png',description:'A native feedback widget that lets users chat, request features, report bugs, and view a roadmap directly on your site.',url:'https://feedbackfun.com'},specviewer:{name:'SpecViewer',category:'02 / Developer workshop · Developer tool',image:'assets/specviewer.png',description:'Explore and visualize OpenAPI specs in one place — no backend, login, or setup required.',url:'https://specviewer.app'},echoling:{name:'Echoling',category:'03 / Listening cabin · Learning',image:'assets/echoling.png',description:'Learn a language by echoing real YouTube speech, with shadowing practice and spaced repetition.',url:'https://echoling-eosin.vercel.app'}};
const island=document.getElementById('island');
const svg=island.querySelector('svg'), avatar=document.getElementById('walker');
const detail=document.getElementById('project-dialog'), directory=document.getElementById('list-dialog');
const status=document.getElementById('walk-status'), interact=document.getElementById('interact');
const walker=createWalker(), keys=new Set();
const vectors={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
const steps={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
let previous=0,lastNearby=null,returnFocus=island;
function stop(){keys.clear();walker.stop();avatar.classList.remove('walking');}
function modalOpen(){return detail.open||directory.open;}
function showProject(id){
 if(!id)return;
 stop();const p=projects[id];
 document.getElementById('project-category').textContent=p.category;
 document.getElementById('project-title').textContent=p.name;
 document.getElementById('project-description').textContent=p.description;
 const img=document.getElementById('project-image');img.src=p.image;img.alt=p.name+' project screenshot';
 document.getElementById('project-link').href=p.url;
 detail.showModal();
}
function render(){
 avatar.setAttribute('transform',`translate(${walker.position.x} ${walker.position.y})`);
 avatar.dataset.facing=walker.facing;
 avatar.classList.toggle('walking',walker.walking);
 const nearby=walker.nearby();
 interact.disabled=!nearby;
 interact.textContent=nearby?`Explore ${projects[nearby].name}`:'Explore nearby project';
 if(nearby!==lastNearby){status.textContent=nearby?`${projects[nearby].name} · Press E / Enter to explore`:'Tap the grass to wander. Select a place to visit.';lastNearby=nearby;}
}
function navigate(point,id){
 stop();island.focus({preventScroll:true});returnFocus=island;
 if(walker.go(point,id))status.textContent=id?`Walking to ${projects[id].name}…`:'On my way…';
 else status.textContent='Choose open grass nearby, or select a project above.';
}
island.addEventListener('click',event=>{
 if(event.target.closest('button'))return;
 const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
 navigate({x:point.x,y:point.y});
});
document.querySelectorAll('.hotspot').forEach(button=>button.addEventListener('click',()=>navigate(entrances[button.dataset.project],button.dataset.project)));
document.querySelectorAll('.project-row').forEach(button=>button.addEventListener('click',()=>{returnFocus=button;showProject(button.dataset.project);}));
document.getElementById('view-projects').addEventListener('click',()=>{stop();directory.showModal();});
interact.addEventListener('click',()=>{returnFocus=interact;showProject(walker.interact());});
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
 const [x,y]=steps[button.dataset.step];navigate(move(walker.position,{x,y},.5));
}));
function acceptsKeys(event){return !modalOpen()&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&(event.target===document.body||event.target===island);}
document.addEventListener('keydown',event=>{
 if(!acceptsKeys(event))return;
 const key=event.key.length===1?event.key.toLowerCase():event.key;
 if(vectors[key]){event.preventDefault();keys.add(key);}
 else if((key==='e'||key==='Enter')&&!event.repeat){event.preventDefault();returnFocus=island;showProject(walker.interact());}
});
document.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));
document.addEventListener('focusin',event=>{if(event.target!==island&&event.target!==document.body)stop();});
window.addEventListener('blur',stop);
document.addEventListener('visibilitychange',()=>{stop();previous=0;});
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{stop();if(dialog===detail)returnFocus.focus({preventScroll:true});});
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
 });
});
function frame(now){
 const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
 if(!document.hidden&&!modalOpen()){
  const input={x:0,y:0};for(const key of keys){input.x+=vectors[key][0];input.y+=vectors[key][1];}
  const opened=walker.tick(dt,input);render();if(opened)showProject(opened);
 }
 requestAnimationFrame(frame);
}
render();requestAnimationFrame(frame);
