// Coordinates match the inline SVG's 1200 × 710 viewBox.
export const land=[[210,318],[290,255],[441,186],[648,184],[837,256],[987,375],[932,440],[815,467],[689,512],[505,491],[406,457],[286,402]];
function inside(p, polygon) {
 let yes=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
  const [x,y]=polygon[i], [a,b]=polygon[j];
  if((y>p.y)!==(b>p.y) && p.x<(a-x)*(p.y-y)/(b-y)+x) yes=!yes;
 }
 return yes;
}
const buildings=[[[334,218],[426,180],[510,220],[503,316],[426,358],[334,323]],[[570,180],[655,140],[745,180],[730,272],[657,310],[570,275]],[[727,320],[810,279],[895,319],[880,406],[810,443],[727,412]],[[880,210],[938,210],[940,335],[877,335]]];
const solids=[[337,365,27],[491,370,27],[556,390,18],[319,267,12],[388,237,12],[468,220,10],[752,263,12],[811,292,12],[267,335,12],[732,355,15],[269,380,12],[337,432,15],[419,469,13],[512,456,11],[851,457,13],[933,413,11],[586,238,10]];
export function walkable(p) {
 if(solids.some(([x,y,r])=>Math.hypot(p.x-x,p.y-y)<r+8)) return false;
 return Array.from({length:16},(_,i)=>({x:p.x+8*Math.cos(i*Math.PI/8),y:p.y+8*Math.sin(i*Math.PI/8)})).every(q=>inside(q,land)&&!buildings.some(b=>inside(q,b)));
}
export function move(p, direction, seconds) {
 const length=Math.hypot(direction.x,direction.y);
 if (!length) return {...p};
 const distance=120*Math.max(0,seconds), steps=Math.ceil(distance/2);
 let next={...p};
 for(let i=0;i<steps;i++) {
  const q={x:next.x+direction.x/length*distance/steps,y:next.y+direction.y/length*distance/steps};
  if(walkable(q)) next=q; else break;
 }
 return next;
}
export function clear(a,b) {
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3));
 for(let i=0;i<=n;i++) if(!walkable({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n})) return false;
 return true;
}
let graph;
function grid() {
 if(graph) return graph;
 graph=new Map();
 for(let x=220;x<=980;x+=5) for(let y=190;y<=510;y+=5) {
  const p={x,y};if(walkable(p)) graph.set(`${x},${y}`,p);
 }
 return graph;
}
export function route(start,goal) {
 if(!walkable(start)||!walkable(goal)) return [];
 if(clear(start,goal)) return [{...goal}];
 const nodes=grid();
 const nearest=p=>[...nodes.values()].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).find(q=>clear(p,q));
 const first=nearest(start),last=nearest(goal);
 if(!first||!last) return [];
 const queue=[first],previous=new Map([[first,null]]);
 for(let i=0;i<queue.length;i++) {
  const p=queue[i];
  if(p===last) {
   const path=[goal];for(let q=p;q;q=previous.get(q)) path.unshift(q);
   const smooth=[];let from=start;
   while(path.length){let j=path.length-1;while(j>0&&!clear(from,path[j]))j--;from=path[j];smooth.push(from);path.splice(0,j+1);}
   return smooth;
  }
  for(const [dx,dy] of [[5,0],[-5,0],[0,5],[0,-5],[5,5],[5,-5],[-5,5],[-5,-5]]) {
   const q=nodes.get(`${p.x+dx},${p.y+dy}`);
   if(q&&!previous.has(q)&&clear(p,q)){previous.set(q,p);queue.push(q);}
  }
 }
 return [];
}
export const entrances={feedbackfun:{x:410,y:374},specviewer:{x:650,y:326},echoling:{x:795,y:455}};
export function createWalker() {
 let path=[],pending=null;
 return {
  position:{x:600,y:420},facing:'down',walking:false,
  stop(){path=[];pending=null;this.walking=false;},
  nearby(){return Object.keys(entrances).find(id=>Math.hypot(this.position.x-entrances[id].x,this.position.y-entrances[id].y)<28)||null;},
  interact(){return this.nearby();},
  go(goal,id=null){this.stop();path=route(this.position,goal);pending=path.length?id:null;return path.length>0;},
  tick(dt,input={x:0,y:0}) {
   const old=this.position;
   if(input.x||input.y){this.stop();this.position=move(old,input,dt);}
   else if(path.length){
    const target=path[0],dx=target.x-old.x,dy=target.y-old.y,d=Math.hypot(dx,dy);
    if(d<=120*dt){this.position={...target};path.shift();}
    else this.position=move(old,{x:dx,y:dy},dt);
   }
   const dx=this.position.x-old.x,dy=this.position.y-old.y;
   this.walking=Math.hypot(dx,dy)>.01;
   if(this.walking)this.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
   if(!path.length&&pending){const id=pending;pending=null;return this.nearby()===id?id:null;}
   return null;
  }
 };
}
