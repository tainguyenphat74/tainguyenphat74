import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraDirection,createInput,orbit} from '../controls.js';
test('camera-relative keys map screen forward/right after a quarter orbit',()=>{
 assert.deepEqual(cameraDirection(0,-1,0),{x:0,z:-1});
 let d=cameraDirection(0,-1,Math.PI/2);assert.ok(Math.abs(d.x+1)<1e-9);assert.ok(Math.abs(d.z)<1e-9);
 d=cameraDirection(1,0,Math.PI/2);assert.ok(Math.abs(d.x)<1e-9);assert.ok(Math.abs(d.z+1)<1e-9);
 assert.ok(Math.abs(Math.hypot(...Object.values(cameraDirection(1,1,.8)))-1)<1e-9);
 const c=orbit({yaw:0,pitch:.7,distance:30},10,100,100);assert.ok(c.pitch<=1.25);assert.ok(c.distance<=65);
});
test('controller owns canvas keys only; blur, hidden, dialog and focus clear queued movement',()=>{
 const canvas={},input=createInput(canvas);let stops=0;const stop=()=>stops++;
 assert.equal(input.down({target:{},key:'w'},false),false);
 assert.equal(input.down({target:canvas,key:'w',ctrlKey:true},false),false);
 assert.equal(input.down({target:canvas,key:'w'},true),false);
 assert.equal(input.down({target:canvas,key:'w'},false),true);assert.equal(input.direction(0).z,-1);
 input.up('w');assert.equal(input.direction(0).z,0);
 for(const reason of ['blur','hidden','dialog','focus']){input.down({target:canvas,key:'d'},false);input.stop(stop,reason);assert.deepEqual(input.direction(0),{x:0,z:0});}assert.equal(stops,4);
});
test('real keyboard lifecycle bindings release movement on focus, blur and hiding',async()=>{
 const {bindKeyboard}=await import('../controls.js');
 class Events{listeners={};addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}fire(k,e={}){for(const fn of this.listeners[k]??[])fn(e);}}
 const doc=new Events(),win=new Events(),canvas={},input=createInput(canvas);let stops=0,opens=0,blocked=false;
 bindKeyboard({doc,win,canvas,input,blocked:()=>blocked,stop:()=>input.stop(()=>stops++),interact:()=>opens++});
 const down=()=>doc.fire('keydown',{target:canvas,key:'w',preventDefault(){}});
 down();assert.equal(input.direction(0).z,-1);
 for(const [source,event,e] of [[win,'blur',{}],[doc,'visibilitychange',{}],[doc,'focusin',{target:{}}]]){down();source.fire(event,e);assert.equal(input.direction(0).z,0);}
 blocked=true;down();assert.equal(input.direction(0).z,0);blocked=false;
 doc.fire('keydown',{target:canvas,key:'e',preventDefault(){}});assert.equal(opens,1);assert.equal(stops,3);
});
