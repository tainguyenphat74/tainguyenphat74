import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildings} from '../world.js';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('Little Harvest is a standalone game without personal metadata, links or tracking',()=>{
 const html=read('index.html');
 assert.match(html,/<title>Little Harvest/);
 for(const file of ['index.html','island.js','world.js','scene.js','style.css','package.json','package-lock.json','farm-state.js'])assert.doesNotMatch(read(file),/Tai Nguyen|tainguyenphat|portfolio|feedbackfun|specviewer|echoling|mailto:|data-project|project-dialog|list-dialog|api\/views|entrance-signal/i,file);
 // The existing deployment domain belongs in hosting metadata, not in the game UI.
 assert.match(read('sitemap.xml'),/<loc>https:\/\/tainguyenphat\.com\/<\/loc>/);
 assert.match(read('robots.txt'),/Sitemap: https:\/\/tainguyenphat\.com\/sitemap.xml/);
 assert.doesNotMatch(html,/href="(?:https?:|mailto:)|assets\/(?:avatar|favicon)/);
 for(const file of ['main.js','nearby.js','api/views.js','assets/avatar.png'])assert.equal(fs.existsSync(new URL('../'+file,import.meta.url)),false);
 for(const id of ['farm-action','new-game','farm-score','save-notice','help-dialog'])assert.ok(html.includes(`id="${id}"`));
 const beds=[...html.matchAll(/<button data-bed="(\d)">Bed (\d)<\/button>/g)];assert.equal(beds.length,6);beds.forEach((b,i)=>assert.deepEqual(b.slice(1),[String(i),String(i+1)]));
 assert.deepEqual(buildings.map(b=>b.id),['barn','workshop','farmhouse']);assert.ok(buildings.every(b=>b.hint&&!b.url));
});
test('fallback is initially visible with no JavaScript and offers a native reload',()=>{
 const html=read('index.html'),css=read('style.css');
 assert.match(html,/<section id="fallback" class="fallback panel"/);assert.match(html,/<noscript>.*JavaScript is disabled/);assert.match(html,/<form action=""><button type="submit">Retry \/ reload/);
 assert.match(css,/\.ready \.fallback\{display:none\}/);
 assert.match(read('island.js'),/world.classList.remove\('ready'\)/);
});
test('real scene, context loss, native help and guarded controller remain connected',()=>{
 const scene=read('scene.js'),controller=read('island.js');assert.match(scene,/\.\/vendor\/three.module.js/);assert.doesNotMatch(scene,/https?:/);
 assert.match(controller,/webglcontextlost/);assert.match(controller,/window.__farm=/);assert.match(controller,/document.activeElement===canvas/);assert.match(controller,/selectPlot\(plot\)/);
 assert.match(controller,/const modalOpen=\(\)=>help.open/);assert.match(controller,/help.showModal\(\)/);assert.match(controller,/function farmHere\(\)\{if\(failed\|\|modalOpen\(\)\)return/);
 assert.match(controller,/function selectPlot\(id\)\{if\(failed\|\|modalOpen\(\)\)return/);
});
