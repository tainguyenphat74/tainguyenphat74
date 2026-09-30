import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldRender} from '../render-policy.js';
test('dialog pauses expensive WebGL rendering',()=>assert.equal(shouldRender({modal:true,changed:true,reduced:false,elapsed:1}),false));
test('reduced-motion idle does not redraw unchanged world',()=>assert.equal(shouldRender({modal:false,changed:false,reduced:true,elapsed:1}),false));
test('changed world draws with capped frame cadence',()=>{assert.equal(shouldRender({modal:false,changed:true,reduced:true,elapsed:.04}),true);assert.equal(shouldRender({modal:false,changed:true,reduced:false,elapsed:.01}),false);});
test('normal idle animates at capped cadence',()=>assert.equal(shouldRender({modal:false,changed:false,reduced:false,elapsed:.04}),true));
