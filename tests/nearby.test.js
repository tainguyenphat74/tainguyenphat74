import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {updateNearby} from '../nearby.js';
import {createWalker,entrances} from '../movement.js';
import {mergeGeometry,surface} from '../materials.js';
import * as T from '../vendor/three.module.js';
const link=()=>({hidden:true,removeAttribute(k){delete this[k];}});
test('routing to each entrance reveals native new-tab links; walking away clears stale URLs',()=>{
 const walker=createWalker(),links=[link(),link()];
 for(const [id,point] of Object.entries(entrances)){
  walker.go(point,id);for(let i=0;i<1600;i++)walker.tick(.05);
  assert.equal(walker.nearby(),id);assert.equal(walker.walking,false);
  const project={name:id,url:`https://${id}.example`};updateNearby(links,project);
  for(const a of links){assert.equal(a.hidden,false);assert.equal(a.href,project.url);assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.textContent,`Open ${id} in new tab ↗`);}
  for(let i=0;i<20;i++)walker.tick(.05,{x:0,z:1});assert.equal(walker.nearby(),null);
  updateNearby(links,null);for(const a of links){assert.equal(a.hidden,true);assert.equal(a.href,undefined);}
 }
});
test('arrival does not invoke popup or modal; keyboard focuses a native anchor',()=>{
 const source=fs.readFileSync(new URL('../island.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/window\.open|if\(opened\)showProject|showProject\(walker/);
 assert.match(source,/interact\.focus\(/);
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['interact','entrance-signal','project-link'])assert.match(html,new RegExp(`<a[^>]*id="${id}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`));
});
test('material batching retains transformed normals and UVs',()=>{
 const a=new T.BoxGeometry(1,2,3).toNonIndexed(),b=new T.SphereGeometry(1,12,8).toNonIndexed();b.translate(4,0,0);
 const merged=mergeGeometry([a,b]);assert.equal(merged.attributes.position.count,a.attributes.position.count+b.attributes.position.count);
 assert.deepEqual([...merged.attributes.uv.array],[...a.attributes.uv.array,...b.attributes.uv.array]);
 assert.deepEqual([...merged.attributes.normal.array],[...a.attributes.normal.array,...b.attributes.normal.array]);
 for(const kind of ['stone','timber','roof','soil']){const texture=surface(kind);assert.equal(texture.image.data.length,128*128*4);assert.ok(new Set(texture.image.data).size>20);}
});
