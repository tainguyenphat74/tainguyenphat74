import test from 'node:test';
import assert from 'node:assert/strict';

// A small DOM event harness checks the real controller without a browser dependency.
test('controller owns island keys only, stops on blur/hidden, and opens nearby dialogs',async()=>{
 class Element {
  constructor(id){this.id=id;this.listeners={};this.attributes={};this.dataset={};this.classList={toggle(){},remove(){}};this.open=false;}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  fire(name,event={}){for(const fn of this.listeners[name]??[])fn({target:this,...event});}
  setAttribute(name,value){this.attributes[name]=value;}
  querySelector(){return new Element('child');}
  focus(){document.activeElement=this;document.fire('focusin',{target:this});}
  showModal(){this.open=true;document.fire('focusin',{target:new Element('close')});}
  close(){this.open=false;this.fire('close');}
 }
 const ids=['island','walker','project-dialog','list-dialog','walk-status','interact','view-projects','project-category','project-title','project-description','project-image','project-link'];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 const doc=new Element('document');doc.body=new Element('body');doc.hidden=false;doc.getElementById=id=>elements[id];
 doc.querySelectorAll=selector=>selector==='dialog'?[elements['project-dialog'],elements['list-dialog']]:[];
 const win=new Element('window');let nextFrame;
 globalThis.document=doc;globalThis.window=win;globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};
 await import('../island.js');
 let time=0;const frame=()=>nextFrame(time+=50);
 const pos=()=>elements.walker.attributes.transform;
 function key(name,target=elements.island,extra={}){let prevented=false;doc.fire('keydown',{key:name,target,preventDefault(){prevented=true;},...extra});return prevented;}
 frame();const start=pos();assert.equal(key('ArrowRight'),true);frame();assert.notEqual(pos(),start);
 win.fire('blur');const blurred=pos();frame();assert.equal(pos(),blurred);
 for(const control of [new Element('button'),new Element('input'),new Element('a')]){
  assert.equal(key('ArrowRight',control),false);frame();assert.equal(pos(),blurred);
 }
 assert.equal(key('w',elements.island,{ctrlKey:true}),false);
 key('ArrowRight');doc.hidden=true;doc.fire('visibilitychange');doc.hidden=false;frame();assert.equal(pos(),blurred);
 key('ArrowRight');doc.fire('focusin',{target:new Element('input')});frame();assert.equal(pos(),blurred);
 elements['view-projects'].fire('click');assert.equal(elements['list-dialog'].open,true);
 assert.equal(key('ArrowDown'),false);frame();assert.equal(pos(),blurred);
 elements['list-dialog'].close();
 // Walk up to the workshop entrance with real frame updates.
 key('ArrowUp');for(let i=0;i<15;i++)frame();doc.fire('keyup',{key:'ArrowUp'});
 key('ArrowRight');for(let i=0;i<6;i++)frame();doc.fire('keyup',{key:'ArrowRight'});
 assert.equal(elements.interact.disabled,false);
 key('Enter');assert.equal(elements['project-dialog'].open,true);
 assert.equal(elements['project-title'].textContent,'SpecViewer');
 elements['project-dialog'].close();assert.equal(doc.activeElement,elements.island);
 delete globalThis.document;delete globalThis.window;delete globalThis.requestAnimationFrame;
});
