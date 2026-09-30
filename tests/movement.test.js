import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../movement.js';
test('world motion is time based, normalized, and radius stays on land',()=>{
 const p={x:0,z:5};
 for(const d of [{x:1,z:0},{x:1,z:1}]) {const q=m.move(p,d,.1);assert.ok(Math.abs(Math.hypot(q.x-p.x,q.z-p.z)-.32)<1e-6);}
 const q=m.move(p,{x:0,z:1},8);assert.ok(q.z<10);assert.ok(m.walkable(q));assert.equal(m.walkable({x:30,z:0}),false);
});
test('building and tree footprints are solid and long frames cannot tunnel',()=>{
 assert.equal(m.walkable({x:-5,z:-3}),false);
 assert.equal(m.walkable({x:-10,z:0}),false);
 const q=m.move({x:-5,z:3},{x:0,z:-1},10);assert.ok(q.z>=-.92);assert.ok(m.walkable(q));
});
test('navigation routes around footprints, rejects water, and has safe segments',()=>{
 const start={x:-9,z:-3},goal={x:-1,z:-3};const path=m.route(start,goal);
 assert.ok(path.length>1);let p=start;for(const q of path){assert.ok(m.clear(p,q));p=q;}assert.deepEqual(p,goal);
 assert.deepEqual(m.route(start,{x:40,z:0}),[]);
});
test('all project doors reachable; arrival opens once, manual input and stop cancel',()=>{
 const w=m.createWalker();assert.equal(w.interact(),null);
 for(const [id,p] of Object.entries(m.entrances)){assert.ok(w.go(p,id));let opened;for(let i=0;i<1600&&!opened;i++)opened=w.tick(.05);assert.equal(opened,id);assert.equal(w.interact(),id);assert.equal(w.tick(.05),null);}
 w.go(m.entrances.feedbackfun,'feedbackfun');w.tick(.1,{x:0,z:1});for(let i=0;i<500;i++)assert.equal(w.tick(.05),null);
 w.go(m.entrances.feedbackfun,'feedbackfun');w.stop();const p={...w.position};w.tick(2);assert.deepEqual(w.position,p);
});
test('café awning posts block walkers without blocking the entrance',()=>{
 assert.equal(m.walkable({x:-6.8,z:-.5}),false);
 assert.equal(m.walkable({x:-3.2,z:-.5}),false);
 assert.equal(m.walkable(m.entrances.feedbackfun),true);
});
