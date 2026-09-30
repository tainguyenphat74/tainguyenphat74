import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../movement.js';
test('walking is time based and diagonal speed is normalized', () => {
 const p={x:600,y:400};
 const a=m.move(p,{x:1,y:0},.1), b=m.move(p,{x:1,y:1},.1);
 assert.ok(Math.abs(Math.hypot(a.x-p.x,a.y-p.y)-12)<.001);
 assert.ok(Math.abs(Math.hypot(b.x-p.x,b.y-p.y)-12)<.001);
});
test('shoreline keeps the entire foot radius on grass even with a long frame',()=>{
 let p={x:600,y:480};
 p=m.move(p,{x:0,y:1},5);
 assert.ok(p.y<510);
 assert.equal(m.walkable({x:100,y:400}),false);
 assert.equal(m.walkable(p),true);
});
test('buildings, terrace furniture and trees are solid; movement cannot tunnel',()=>{
 assert.equal(m.walkable({x:420,y:320}),false);
 assert.equal(m.walkable({x:651,y:275}),false);
 assert.equal(m.walkable({x:805,y:410}),false);
 assert.equal(m.walkable({x:337,y:365}),false);
 assert.equal(m.walkable({x:732,y:355}),false);
 const p=m.move({x:420,y:400},{x:0,y:-1},3);
 assert.ok(p.y>357);
});
test('click routes go around buildings with safe segments and reject water',()=>{
 const start={x:540,y:330}, goal={x:650,y:330};
 const route=m.route(start,goal);
 assert.ok(route.length>0);
 let p=start;
 for(const q of route){assert.equal(m.clear(p,q),true);p=q;}
 assert.deepEqual(p,goal);
 const around=m.route({x:315,y:320},{x:530,y:320});
 assert.ok(around.length>2);
 let previous={x:315,y:320};for(const q of around){assert.ok(m.clear(previous,q));previous=q;}
 assert.deepEqual(m.route(start,{x:0,y:0}),[]);
});
test('project interaction requires proximity and arrives once after navigation',()=>{
 const walker=m.createWalker();
 assert.equal(walker.interact(),null);
 for(const id of Object.keys(m.entrances)) {
  assert.equal(walker.go(m.entrances[id],id),true);
  let opened=null;
  for(let i=0;i<2000&&!opened;i++) opened=walker.tick(.05);
  assert.equal(opened,id);
  assert.equal(walker.interact(),id);
  assert.equal(walker.tick(.05),null);
 }
 walker.go(m.entrances.feedbackfun,'feedbackfun');walker.stop();
 const p={...walker.position};walker.tick(1);assert.deepEqual(walker.position,p);
});
test('manual input cancels queued interaction',()=>{
 const w=m.createWalker();w.go(m.entrances.feedbackfun,'feedbackfun');
 w.tick(.1,{x:1,y:0});
 for(let i=0;i<500;i++) assert.equal(w.tick(.05),null);
});
