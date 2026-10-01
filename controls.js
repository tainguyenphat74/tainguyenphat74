export function cameraDirection(x,z,yaw){const n=Math.hypot(x,z)||1;return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))/n,z:(z*Math.cos(yaw)-x*Math.sin(yaw))/n};}
export function orbit(c,dx=0,dy=0,zoom=0){return {yaw:c.yaw-dx*.006,pitch:Math.max(.35,Math.min(1.25,c.pitch+dy*.005)),distance:Math.max(19,Math.min(65,c.distance*Math.exp(zoom*.002)))};}
const vectors={w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0]};
const key=k=>k.length===1?k.toLowerCase():k;
export function createInput(canvas){const keys=new Set();return {
 down(e,blocked){if(blocked||e.target!==canvas||e.ctrlKey||e.altKey||e.metaKey||!vectors[key(e.key)])return false;keys.add(key(e.key));return true;},
 up(k){keys.delete(key(k));},
 stop(callback){keys.clear();callback();},
 direction(yaw){let x=0,z=0;for(const k of keys){x+=vectors[k][0];z+=vectors[k][1];}return cameraDirection(x,z,yaw);}
 };}
export function bindKeyboard({doc,win,canvas,input,blocked,stop,farm=()=>{}}){
 doc.addEventListener('keydown',e=>{if(input.down(e,blocked())){e.preventDefault();return;}if(e.target===canvas&&!blocked()&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&e.key.toLowerCase()==='f'){e.preventDefault();farm();return;}});
 doc.addEventListener('keyup',e=>input.up(e.key));
 doc.addEventListener('focusin',e=>{if(e.target!==canvas)stop();});
 win.addEventListener('blur',stop);
 doc.addEventListener('visibilitychange',stop);
}
