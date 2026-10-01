import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {worldUV,mergeGeometry,foliageTexture,coastalWater,surface} from '../materials.js';

test('world UVs agree at shared positions regardless of triangle layout and survive batching',()=>{
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,5,0,0,0,0,5,0,0,5,5,0,0,5,0,5],3));
 g.computeVertexNormals();worldUV(g,5);
 const merged=mergeGeometry([g]);
 assert.deepEqual([...merged.attributes.uv.array],[0,0,1,0,0,1,0,1,1,0,1,1]);
 assert.equal(merged.attributes.normal.count,6);
});
test('original foliage has opaque leaves and transparent gaps, with mipmaps',()=>{
 const map=foliageTexture(),alpha=map.image.data.filter((_,i)=>i%4===3);
 const coverage=alpha.filter(a=>a===255).length/alpha.length;
 assert.ok(coverage>.1&&coverage<.6);assert.ok(map.generateMipmaps);
 assert.deepEqual(map.image.data,foliageTexture().image.data);
});
test('pond shader shares an explicitly controlled static time uniform',()=>{
 const water=coastalWater();
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <worldpos_vertex>',fragmentShader:'#include <common>\n#include <normal_fragment_maps>\n#include <opaque_fragment>'};
 water.material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.coastTime,water.time);assert.equal(water.time.value,0);
 assert.match(shader.fragmentShader,/coastFresnel/);assert.match(shader.vertexShader,/coastPosition=/);
});

test('material batching retains transformed normals and UVs',()=>{
 const a=new T.BoxGeometry(1,2,3).toNonIndexed(),b=new T.SphereGeometry(1,12,8).toNonIndexed();b.translate(4,0,0);
 const merged=mergeGeometry([a,b]);assert.equal(merged.attributes.position.count,a.attributes.position.count+b.attributes.position.count);
 assert.deepEqual([...merged.attributes.uv.array],[...a.attributes.uv.array,...b.attributes.uv.array]);
 assert.deepEqual([...merged.attributes.normal.array],[...a.attributes.normal.array,...b.attributes.normal.array]);
 for(const kind of ['stone','timber','roof','soil']){const texture=surface(kind);assert.equal(texture.image.data.length,128*128*4);assert.ok(new Set(texture.image.data).size>20);}
});
