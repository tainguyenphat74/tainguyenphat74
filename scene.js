import * as T from './vendor/three.module.js';
import {surface,mergeGeometry,worldUV,foliageTexture,coastalWater} from './materials.js';
import {land,buildings,trees} from './world.js';

export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new T.Scene();scene.background=new T.Color(0xc7d2d4);scene.fog=new T.Fog(0xc7d2d4,65,150);
 const camera=new T.PerspectiveCamera(39,1,.1,200);
 scene.add(new T.HemisphereLight(0xf3f5f5,0x74786d,1.35));
 const sun=new T.DirectionalLight(0xfff6ec,2.1);sun.position.set(-14,23,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:65});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
 let revision=0;
 const textures=Object.fromEntries(['stone','timber','roof','soil'].map(k=>[k,surface(k)]));
 const loader=new T.TextureLoader();
 for(const name of ['grass','sand']){
  const map=loader.load(`./assets/materials/${name}.jpg`,()=>revision++,undefined,()=>revision++);
  map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures[name]=map;
 }
 const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.92,flatShading:false}));return materials.get(c);}
 function mesh(geometry,color,x=0,y=0,z=0,parent=scene){const kind=typeof color==='string'?color.split(':')[0]:null;let material;if(kind){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color:Number(color.split(':')[1]),map:textures[kind],bumpMap:textures[kind],bumpScale:kind==='stone'?.055:.025,roughness:.94}));material=materials.get(color);}else material=mat(color);const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const cylinder=(r1,r2,h,c,x,y,z,n=12,p)=>mesh(new T.CylinderGeometry(r1,r2,h,n),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>mesh(new T.SphereGeometry(r,12,8),c,x,y,z,p);
 // Rounded contour stays outside the conservative collision boundary.
 const outline=new T.CatmullRomCurve3(land.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal').getPoints(132).slice(0,-1);
 const shape=new T.Shape();outline.forEach((p,i)=>shape[i?'lineTo':'moveTo'](p.x*1.035,-p.z*1.035));shape.closePath();
 const top=new T.ShapeGeometry(shape,1);top.rotateX(-Math.PI/2);worldUV(top,6);const ground=mesh(top,'grass:0xd0d0bd');
 // Sloping shore rings merge into the water, with smooth shared vertex normals.
 const positions=[],uv=[],indices=[],shoreColors=[];
 for(let ring=0;ring<5;ring++)outline.forEach((p,i)=>{const spread=1.035+ring*.052+(ring?Math.sin(i*.31)*Math.sin(ring*.8)*.009:0);positions.push(p.x*spread,-ring*.69,p.z*spread);uv.push(p.x*spread/5,p.z*spread/5);const wet=1-ring*.085;shoreColors.push(wet,wet,wet);});
 for(let r=0;r<4;r++)for(let i=0;i<outline.length;i++){const a=r*outline.length+i,b=r*outline.length+(i+1)%outline.length,c=a+outline.length,d=b+outline.length;indices.push(a,b,c,b,d,c);}
 const bank=new T.BufferGeometry();bank.setAttribute('position',new T.Float32BufferAttribute(positions,3));bank.setAttribute('uv',new T.Float32BufferAttribute(uv,2));bank.setIndex(indices);bank.computeVertexNormals();bank.setAttribute('color',new T.Float32BufferAttribute(shoreColors,3));const shoreMaterial=new T.MeshStandardMaterial({map:textures.sand,color:0xc2baaa,vertexColors:true,roughness:.88});const shoreMesh=new T.Mesh(bank,shoreMaterial);shoreMesh.receiveShadow=true;scene.add(shoreMesh);
 for(let i=0;i<48;i++){const p=outline[Math.floor(i*outline.length/48)],rock=ball(.35+(i%4)*.1,'stone:0x98988b',p.x*1.12,-1.35,p.z*1.12);rock.scale.set(1.4,.7,1);}
 const water=coastalWater();
 const ocean=new T.Mesh(new T.PlaneGeometry(400,400),water.material);ocean.position.y=-2.75;ocean.rotation.x=-Math.PI/2;scene.add(ocean);
 // A continuous flat ribbon avoids overlapping segment caps and preserves world UVs.
 function path(points,width=1.05){
  const vertices=[],indices=[];
  points.forEach(([x,z],i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],length=Math.hypot(dx,dz);
   for(const side of [-1,1])vertices.push(x+side*dz/length*width/2,.045,z-side*dx/length*width/2);
   if(i){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  });
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();worldUV(g,5);mesh(g,'sand:0xcac3b2');
 }
 path([[0,8],[0,4],[-1,2],[-3,1],[-5,-.3]]);path([[-1,2],[1,0],[1,-2.5]]);path([[0,4],[3,4],[6,3.4]]);path([[3,4],[8,4],[9,1],[8,-1.8]],.7);
 const picks=[];
 for(const b of buildings){const group=new T.Group();group.position.set(b.x,0,b.z);scene.add(group);group.userData.project=b.id;
  box(b.w+.22,.2,b.d+.2,'stone:0x99968b',0,.12,0,group);box(b.w,2.1,b.d,b.id==='echoling'?'timber:0x9d8a70':'stone:0xc6c3b5',0,1.2,0,group);
  // Gabled roof, extruded through the full depth of the house.
  const s=new T.Shape();s.moveTo(-b.w/2-.25,0);s.lineTo(0,1.3);s.lineTo(b.w/2+.25,0);s.closePath();const roof=new T.ExtrudeGeometry(s,{depth:b.d+.5,bevelEnabled:false});mesh(roof,'roof:0x77756d',0,2.24,-b.d/2-.25,group);
  box(.7,1.35,.08,'timber:0x726d5c',0,.9,b.d/2+.05,group);ball(.05,0xf3d293,.23,.86,b.d/2+.12,group);
  for(const x of [-b.w*.31,b.w*.31]){box(.77,.83,.1,0xffeed0,x,1.35,b.d/2+.06,group);box(.61,.64,.12,0x729e98,x,1.36,b.d/2+.12,group);box(.045,.64,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.65,.045,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.84,.16,.3,0x96754e,x,.89,b.d/2+.16,group);for(let j=0;j<3;j++)ball(.13,[0xeaa16d,0xf2cf7f,0xdd816b][j],x+(j-1)*.23,1.02,b.d/2+.2,group);}
  box(.55,.95,.6,0xd5bc91,-b.w*.27,3.04,-.6,group);box(.7,.14,.75,0x8a7357,-b.w*.27,3.54,-.6,group);
  if(b.id==='feedbackfun'){for(let i=0;i<8;i++){const aw=box(b.w/8,.1,.9,i%2?0xb9b3a2:0x767e70,-b.w/2+b.w/16+i*b.w/8,1.95,b.d/2+.4,group);aw.rotation.x=.15;}for(const x of [-1.8,1.8])cylinder(.045,.045,1.8,0x947957,x,.9,b.d/2+.7,6,group);}
  if(b.id==='specviewer'){box(.95,.7,.13,0x405d57,1.2,2.63,b.d/2+.28,group);for(let i=0;i<3;i++)box(.5-i*.1,.035,.02,0xd5dcb4,1.18,2.8-i*.15,b.d/2+.36,group);}
  if(b.id==='echoling'){for(let i=0;i<9;i++)box(b.w+.03,.035,b.d+.03,0xa5825c,0,.35+i*.21,0,group);}
  // Fascia boards, eaves, ridge flashing, door jambs and stone threshold.
  for(const side of [-1,1]){box(.12,.18,b.d+.65,'timber:0x8a8172',side*(b.w/2+.22),2.23,0,group);box(.08,1.5,.16,'timber:0xaaa18e',side*.4,.94,b.d/2+.1,group);}
  box(.9,.12,.16,'timber:0xaaa18e',0,1.69,b.d/2+.1,group);box(1.1,.12,.48,'stone:0xa7a498',0,.13,b.d/2+.24,group);
  box(.16,.09,b.d+.58,0x666b69,0,3.55,0,group);
  group.traverse(o=>{if(o.isMesh){o.userData.project=b.id;picks.push(o);}});
 }
 // 144 cards/tree, two triangles/card, one foliage draw call for the island.
 const leafMaterial=new T.MeshStandardMaterial({map:foliageTexture(),color:0xc0c5a2,roughness:1,side:T.DoubleSide,alphaTest:.48});
 const foliage=new T.InstancedMesh(new T.PlaneGeometry(1,1),leafMaterial,trees.length*144);
 foliage.castShadow=false;foliage.receiveShadow=true;scene.add(foliage);
 const dummy=new T.Object3D();let leafIndex=0,seed=913;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 function branch(start,end,r1,r2){const direction=end.clone().sub(start),m=cylinder(r2,r1,direction.length(),'timber:0x81796b',...(start.clone().add(end).multiplyScalar(.5).toArray()),10);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());}
 trees.forEach(([x,z],i)=>{
  const h=2.35+random()*.8,lean=(random()-.5)*.3;
  branch(new T.Vector3(x,0,z),new T.Vector3(x+lean,h,z),.19,.055);
  for(let j=0;j<6;j++){
   const angle=j*2.399+i,r=.65+random()*.55;
   const end=new T.Vector3(x+Math.cos(angle)*r,h-.25+random()*.95,z+Math.sin(angle)*r);
   branch(new T.Vector3(x+lean*.7,h*.63+j*.065,z),end,.065,.012);
   for(let k=0;k<12;k++){
    const a=random()*Math.PI*2,radius=Math.sqrt(random())*.65,py=(random()-.5)*.85;
    const center=end.clone().add(new T.Vector3(Math.cos(a)*radius,py,Math.sin(a)*radius));
    const yaw=random()*Math.PI,tilt=(random()-.5)*1.4,scale=.55+random()*.4;
    for(let cross=0;cross<2;cross++){
     dummy.position.copy(center);dummy.rotation.set(tilt,yaw+cross*Math.PI/2,(random()-.5)*.6);dummy.scale.set(scale,scale*1.1,scale);dummy.updateMatrix();foliage.setMatrixAt(leafIndex++,dummy.matrix);
    }
   }
  }
 });foliage.instanceMatrix.needsUpdate=true;
 // Lighthouse with a walkable approach, railing, lantern and copper roof.
 const lx=8,lz=-3;cylinder(.85,1, .3,0xc9ba91,lx,.15,lz,12);for(let i=0;i<5;i++)cylinder(.65-i*.04,.69-i*.04,.75,i%2?0x888779:0xc5c2b4,lx,.65+i*.75,lz,12);
 cylinder(.92,.92,.16,0x4c6860,lx,4.1,lz,12);cylinder(.55,.55,.8,0xb5b5a0,lx,4.58,lz,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(.045,.045,.92,0x45655b,lx+Math.cos(a)*.6,4.57,lz+Math.sin(a)*.6,5);}cylinder(0,.95,.7,0x596962,lx,5.3,lz,8);ball(.12,0x8c8977,lx,5.72,lz);
 box(.46,.9,.1,0x4b6960,lx,.65,lz+.81);
 // Dock descends off the southern edge. It is scenery, beyond the grass navigation boundary.
 for(let i=0;i<15;i++){const z=8.4+i*.34;box(1.65,.14,.29, 'timber:0x998773',0,-.08-i*.07,z);if(i%4===0)for(const x of [-.8,.8])cylinder(.09,.1,2.9,0x826b4d,x,-1.15,z,6);}
 for(const x of [-.8,.8]){const rail=box(.06,.06,4.65,0xc1a274,x,.45,10.65);rail.rotation.x=.2;}
 const boat=new T.Group();boat.position.set(2.1,-2.35,12.3);boat.rotation.y=-.4;scene.add(boat);const hull=ball(1,0xe9ca8b,0,0,0,boat);hull.scale.set(.57,.3,1.4);box(.62,.12,1.65,0x8b7354,0,.18,0,boat);box(.95,.09,.17,0xe3c78f,0,.28,0,boat);
 // Café table and stools stay inside the shared circular furniture footprint.
 cylinder(.65,.65,.12,0xe1bd80,-7,.76,0,12);cylinder(.09,.13,.75,0x7b7252,-7,.38,0,6);cylinder(.12,.09,.22,0xf8e8c1,-7,.94,0,10);
 for(let i=0;i<2;i++)box(.35,.4,.35,0x8b7952,-7+(i? .45:-.45),.2,0);
 // Garden details, stepping stones and a tiny welcome sign.
 for(let i=0;i<42;i++){const a=i*2.399,r=7.8+(i%3)*.5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-6||x>8||x<-9)continue;const stem=cylinder(.02,.025,.22,0x6f8c50,x,.11,z,4);stem.castShadow=false;ball(.09,i%3?0xf2df99:0xd98e73,x,.26,z);}
 cylinder(.05,.05,.85,0x8b7353,-1.2,.43,5.8,6);box(.8,.36,.12,0xf2dfb1,-1.2,.83,5.8);
 // Batch stationary geometry by material to keep mobile draw calls low.
 // Pick meshes retain their world matrices for raycasting after batching.
 scene.updateMatrixWorld(true);
 const batches=new Map(),stationary=[];
 scene.traverse(o=>{if(o.isMesh&&o!==ground&&o!==ocean&&!o.isInstancedMesh&&o.parent!==boat)stationary.push(o);});
 for(const object of stationary){const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);if(!batches.has(object.material))batches.set(object.material,[]);batches.get(object.material).push(geometry);object.removeFromParent();}
 for(const [material,geometries] of batches){const geometry=mergeGeometry(geometries);const batch=new T.Mesh(geometry,material);batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);for(const g of geometries)g.dispose();}
 // Adult proportions: 1.8 m tall, small oval head, shaped torso and rounded limbs.
 const avatar=new T.Group();scene.add(avatar);
 const torso=cylinder(.22,.16,.56,0x737f84,0,1.16,0,16,avatar);torso.scale.z=.64;
 cylinder(.065,.07,.13,0xc5a58c,0,1.49,0,12,avatar);
 const head=ball(.125,0xc5a58c,0,1.65,0,avatar);head.scale.set(.85,1.25,.9);
 const hair=ball(.126,0x49463f,0,1.72,-.025,avatar);hair.scale.set(.86,.7,.85);
 const nose=ball(.028,0xc5a58c,0,1.65,.108,avatar);nose.scale.set(.65,1,1);
 const limbs=[];for(let i=0;i<4;i++){const arm=i>1,x=(i%2?1:-1)*(arm?.255:.10),pivot=new T.Group();pivot.position.set(x,arm?1.4:.9,0);avatar.add(pivot);
  cylinder(arm?.065:.09,arm?.045:.065,arm?.56:.73,arm?0x737f84:0x484e50,0,arm?-.28:-.365,0,12,pivot);
  if(arm){const hand=ball(.055,0xc5a58c,0,-.59,0,pivot);hand.scale.y=1.4;}else{const shoe=ball(.105,0x474640,0,-.79,.035,pivot);shoe.scale.set(.8,.65,1.6);}limbs.push(pivot);}
 const marker=new T.Mesh(new T.RingGeometry(.38,.46,32),new T.MeshBasicMaterial({color:0xffefbb,side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.055;scene.add(marker);
 const target=new T.Vector3(0,0,0),projected=new T.Vector3(),raycaster=new T.Raycaster();
 return {renderer,camera,scene,get revision(){return revision;},
 resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?60:39;camera.updateProjectionMatrix();},
 render(c,walker,time,reduced){camera.position.set(Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance);camera.lookAt(target);avatar.position.set(walker.position.x,.06,walker.position.z);avatar.rotation.y=walker.facing;limbs.forEach((l,i)=>l.rotation.x=walker.walking&&!reduced?Math.sin(time*11)*(i%2?1:-1)*(i>1?-.5:.65):0);marker.position.x=walker.position.x;marker.position.z=walker.position.z;if(!reduced){boat.rotation.z=Math.sin(time*1.4)*.045;water.time.value=time;}renderer.render(scene,camera);},
 project(b){projected.set(b.x,b.y??4.25,b.z).project(camera);return {x:(projected.x+1)*canvas.clientWidth/2,y:(1-projected.y)*canvas.clientHeight/2,visible:projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.85};},
 pick(clientX,clientY){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hits=raycaster.intersectObjects([ground,...picks],false);if(!hits.length)return null;const h=hits[0];return {id:h.object.userData.project,point:{x:h.point.x,z:h.point.z}};}
 };
}
