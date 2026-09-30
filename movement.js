import {land,buildings,circles,entrances} from './world.js';
export {entrances};
export const radius=.28, speed=3.2;
function inside(p){let yes=false;for(let i=0,j=land.length-1;i<land.length;j=i++){const [x,z]=land[i],[a,b]=land[j];if((z>p.z)!==(b>p.z)&&p.x<(a-x)*(p.z-z)/(b-z)+x)yes=!yes;}return yes;}
function edgeDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a[0]-t*dx,p.z-a[1]-t*dz);}
export function walkable(p){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||!inside(p))return false;
 if(land.some((a,i)=>edgeDistance(p,a,land[(i+1)%land.length])<radius))return false;
 if(circles.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<c.r+radius))return false;
 return !buildings.some(b=>Math.hypot(Math.max(Math.abs(p.x-b.x)-b.w/2,0),Math.max(Math.abs(p.z-b.z)-b.d/2,0))<radius);
}
export function move(p,d,seconds){
 const length=Math.hypot(d.x,d.z);if(!length||!Number.isFinite(seconds))return {...p};
 const distance=speed*Math.max(0,Math.min(seconds,30)),n=Math.ceil(distance/.08);let q={...p};
 for(let i=0;i<n;i++){const next={x:q.x+d.x/length*distance/n,z:q.z+d.z/length*distance/n};if(!walkable(next))break;q=next;}return q;
}
export function clear(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1));for(let i=0;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n}))return false;return true;}
let graph;
function grid(){if(graph)return graph;graph=new Map();for(let x=-24;x<=24;x++)for(let z=-20;z<=20;z++){const p={x:x/2,z:z/2};if(walkable(p))graph.set(`${x},${z}`,p);}return graph;}
export function route(start,goal){
 if(!walkable(start)||!walkable(goal))return [];if(clear(start,goal))return [{...goal}];
 const nodes=grid(),nearest=p=>[...nodes.values()].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).find(q=>clear(p,q));
 const first=nearest(start),last=nearest(goal);if(!first||!last)return [];
 const queue=[first],previous=new Map([[first,null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p===last){const path=[goal];for(let q=p;q;q=previous.get(q))path.unshift(q);const smooth=[];let from=start;while(path.length){let j=path.length-1;while(j>0&&!clear(from,path[j]))j--;from=path[j];smooth.push({...from});path.splice(0,j+1);}return smooth;}
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const q=nodes.get(`${p.x*2+dx},${p.z*2+dz}`);if(q&&!previous.has(q)&&clear(p,q)){previous.set(q,p);queue.push(q);}}}return [];
}
export function createWalker(){let path=[],pending=null;return {
 position:{x:0,z:4},facing:0,walking:false,
 stop(){path=[];pending=null;this.walking=false;},
 nearby(){return Object.keys(entrances).find(id=>Math.hypot(this.position.x-entrances[id].x,this.position.z-entrances[id].z)<1.2)||null;},
 interact(){return this.nearby();},
 go(goal,id=null){this.stop();path=route(this.position,goal);pending=path.length?id:null;return path.length>0;},
 tick(dt,input={x:0,z:0}){dt=Math.max(0,Math.min(dt,.1));const old=this.position;
 if(input.x||input.z){this.stop();this.position=move(old,input,dt);}else if(path.length){const q=path[0],dx=q.x-old.x,dz=q.z-old.z,d=Math.hypot(dx,dz);if(d<=speed*dt){this.position={...q};path.shift();}else this.position=move(old,{x:dx,z:dz},dt);}
 const dx=this.position.x-old.x,dz=this.position.z-old.z;this.walking=Math.hypot(dx,dz)>.001;if(this.walking)this.facing=Math.atan2(dx,dz);
 if(!path.length&&pending){const id=pending;pending=null;return this.nearby()===id?id:null;}return null;
 }};
}
