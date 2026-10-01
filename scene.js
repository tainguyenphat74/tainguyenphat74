import * as T from './vendor/three.module.js';
import {surface,mergeGeometry,worldUV,foliageTexture,coastalWater} from './materials.js';
import {buildings,trees,fences,pond} from './world.js';
import {plots,stageAt,GROW_MS} from './farm-state.js';

export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
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
 // Countryside continues to the horizon; the pond occupies only the east corner.
 const top=new T.PlaneGeometry(300,300);top.rotateX(-Math.PI/2);worldUV(top,6);const ground=mesh(top,'grass:0xb0b39a');
 const water=coastalWater();
 const pool=new T.Mesh(new T.CircleGeometry(pond.r,48),water.material);for(const g of [pool.geometry]){const a=g.attributes.position;for(let i=1;i<a.count;i++){const angle=Math.atan2(a.getY(i),a.getX(i)),scale=1+.035*Math.sin(angle*5)+.025*Math.cos(angle*3);a.setXY(i,a.getX(i)*scale,a.getY(i)*scale);}a.needsUpdate=true;}
 pool.rotation.x=-Math.PI/2;pool.position.set(pond.x,.035,pond.z);scene.add(pool);
 const rim=new T.Mesh(new T.RingGeometry(pond.r,pond.r+.3,48),mat(0x827f68));{const a=rim.geometry.attributes.position;for(let i=0;i<a.count;i++){const angle=Math.atan2(a.getY(i),a.getX(i)),scale=1+.035*Math.sin(angle*5)+.025*Math.cos(angle*3);a.setXY(i,a.getX(i)*scale,a.getY(i)*scale);}a.needsUpdate=true;}
 rim.rotation.x=-Math.PI/2;rim.position.copy(pool.position);scene.add(rim);
 for(const f of fences){const length=Math.max(f.w,f.d),horizontal=f.w>f.d;
  for(let i=0;i<=Math.ceil(length/1.5);i++){const t=-length/2+i*length/Math.ceil(length/1.5);box(.12,1.05,.12,'timber:0x93816a',f.x+(horizontal?t:0),.525,f.z+(horizontal?0:t));}
  for(const y of [.4,.85])box(horizontal?length:.09,.1,horizontal?.09:length,'timber:0x93816a',f.x,y,f.z);
 }
 // A continuous flat ribbon avoids overlapping segment caps and preserves world UVs.
 function path(points,width=1.05){
  const vertices=[],indices=[];
  points.forEach(([x,z],i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],length=Math.hypot(dx,dz);
   for(const side of [-1,1])vertices.push(x+side*dz/length*width/2,.045,z-side*dx/length*width/2);
   if(i){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  });
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();worldUV(g,5);mesh(g,'sand:0xcac3b2');
 }
 path([[0,9],[3,6],[3,-1],[1,-2.5]],1.3);path([[-8,-1.8],[7,-1.8]],1.2);
 const picks=[];
 for(const b of buildings){const group=new T.Group();group.position.set(b.x,0,b.z);scene.add(group);group.userData.building=b.id;
  box(b.w+.22,.2,b.d+.2,'stone:0x99968b',0,.12,0,group);box(b.w,2.1,b.d,b.id==='barn'?'timber:0x88594b':'stone:0xc6c3b5',0,1.2,0,group);
  // Gabled roof, extruded through the full depth of the house.
  const s=new T.Shape();s.moveTo(-b.w/2-.25,0);s.lineTo(0,1.3);s.lineTo(b.w/2+.25,0);s.closePath();const roof=new T.ExtrudeGeometry(s,{depth:b.d+.5,bevelEnabled:false});mesh(roof,'roof:0x77756d',0,2.24,-b.d/2-.25,group);
  box(.7,1.35,.08,'timber:0x726d5c',0,.9,b.d/2+.05,group);ball(.05,0xf3d293,.23,.86,b.d/2+.12,group);
  for(const x of b.id==='barn'?[]:[-b.w*.31,b.w*.31]){box(.77,.83,.1,0xffeed0,x,1.35,b.d/2+.06,group);box(.61,.64,.12,0x729e98,x,1.36,b.d/2+.12,group);box(.045,.64,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.65,.045,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.84,.16,.3,0x96754e,x,.89,b.d/2+.16,group);for(let j=0;j<3;j++)ball(.13,[0xeaa16d,0xf2cf7f,0xdd816b][j],x+(j-1)*.23,1.02,b.d/2+.2,group);}
  box(.55,.95,.6,0xd5bc91,-b.w*.27,3.04,-.6,group);box(.7,.14,.75,0x8a7357,-b.w*.27,3.54,-.6,group);
  if(b.id==='barn'){
   box(1.9,1.85,.16,'timber:0x695341',0,1.05,b.d/2+.13,group);
   for(const x of [-.9,0,.9])box(.055,1.85,.06,0xc1b59e,x,1.05,b.d/2+.24,group);
   for(const sign of [-1,1]){const brace=box(.055,2.35,.07,0xc1b59e,0,1.05,b.d/2+.25,group);brace.rotation.z=sign*.72;}
  }
  if(b.id==='workshop'){box(.95,.7,.13,0x405d57,1.2,2.63,b.d/2+.28,group);for(let i=0;i<3;i++)box(.5-i*.1,.035,.02,0xd5dcb4,1.18,2.8-i*.15,b.d/2+.36,group);}
  if(b.id==='farmhouse'){for(let i=0;i<9;i++)box(b.w+.03,.035,b.d+.03,0xa5825c,0,.35+i*.21,0,group);}
  // Fascia boards, eaves, ridge flashing, door jambs and stone threshold.
  for(const side of [-1,1]){box(.12,.18,b.d+.65,'timber:0x8a8172',side*(b.w/2+.22),2.23,0,group);box(.08,1.5,.16,'timber:0xaaa18e',side*.4,.94,b.d/2+.1,group);}
  box(.9,.12,.16,'timber:0xaaa18e',0,1.69,b.d/2+.1,group);box(1.1,.12,.48,'stone:0xa7a498',0,.13,b.d/2+.24,group);
  box(.16,.09,b.d+.58,0x666b69,0,3.55,0,group);
  group.traverse(o=>{if(o.isMesh){o.userData.building=b.id;picks.push(o);}});
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
 // A standing kitchen garden makes the cultivated landscape legible from arrival.
 box(1.2,.07,5.5,'soil:0x735039',-8,.04,2.5);
 for(let row=0;row<2;row++)for(let j=0;j<18;j++){
  const x=-8.3+row*.6,z=.05+j*.28;
  cylinder(.018,.025,.65,0x72814e,x,.36,z,5);
  const leaf=ball(.16,0x77894d,x,.35,z);leaf.scale.set(1.1,.3,1);
  const grain=ball(.065,0xb9a16a,x,.72,z);grain.scale.y=2.6;
 }
 // Batch stationary geometry by material to keep mobile draw calls low.
 // Pick meshes retain their world matrices for raycasting after batching.
 scene.updateMatrixWorld(true);
 const batches=new Map(),stationary=[];
 scene.traverse(o=>{if(o.isMesh&&o!==ground&&o!==pool&&!o.isInstancedMesh)stationary.push(o);});
 for(const object of stationary){const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);if(!batches.has(object.material))batches.set(object.material,[]);batches.get(object.material).push(geometry);object.removeFromParent();}
 for(const [material,geometries] of batches){const geometry=mergeGeometry(geometries);const batch=new T.Mesh(geometry,material);batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);for(const g of geometries)g.dispose();}
 // Each bed has furrows and a small instanced crop canopy, updated from real state.
 const beds=plots.map(p=>{
  const soil=box(2.35,.09,1.65,'soil:0x735039',p.x,.06,p.z);soil.material=soil.material.clone();soil.userData.plot=p.id;picks.push(soil);
  for(let row=0;row<4;row++)box(2.2,.045,.075,0x493a2c,p.x,.12,p.z-.6+row*.4);
  const crops=new T.InstancedMesh(new T.SphereGeometry(1,7,5),new T.MeshStandardMaterial({color:0x668345,roughness:1}),24);scene.add(crops);
  return {soil,crops};
 });
 const cropDummy=new T.Object3D();
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
 avatar.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 const marker=new T.Mesh(new T.RingGeometry(.38,.46,32),new T.MeshBasicMaterial({color:0xffefbb,side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.055;scene.add(marker);
 const target=new T.Vector3(0,0,0),projected=new T.Vector3(),raycaster=new T.Raycaster();
 return {renderer,camera,scene,get revision(){return revision;},
 resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?60:39;camera.updateProjectionMatrix();},
 render(c,walker,time,reduced,farm,now){
 beds.forEach((bed,i)=>{const p=farm.plots[i],stage=stageAt(p,now),growth=stage==='ready'?1:stage==='watered'?Math.min(1,(now-p.wateredAt)/GROW_MS):0;bed.soil.material.color.setHex(stage==='watered'?0x493b2d:0x735039);bed.crops.visible=stage!=='empty';bed.crops.material.color.setHex(stage==='ready'?0xb5a05a:0x668345);for(let j=0;j<24;j++){cropDummy.position.set(plots[i].x-.9+(j%6)*.36,.18+growth*.25,plots[i].z-.55+Math.floor(j/6)*.36);cropDummy.scale.set(.10+growth*.09,.09+growth*.35,.10+growth*.09);cropDummy.updateMatrix();bed.crops.setMatrixAt(j,cropDummy.matrix);}bed.crops.instanceMatrix.needsUpdate=true;});camera.position.set(Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance);camera.lookAt(target);avatar.position.set(walker.position.x,.06,walker.position.z);avatar.rotation.y=walker.facing;limbs.forEach((l,i)=>l.rotation.x=walker.walking&&!reduced?Math.sin(time*11)*(i%2?1:-1)*(i>1?-.5:.65):0);marker.position.x=walker.position.x;marker.position.z=walker.position.z;if(!reduced){water.time.value=time;}renderer.render(scene,camera);},
 project(b){projected.set(b.x,b.y??4.25,b.z).project(camera);return {x:(projected.x+1)*canvas.clientWidth/2,y:(1-projected.y)*canvas.clientHeight/2,visible:projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.85};},
 pick(clientX,clientY){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hits=raycaster.intersectObjects([ground,...picks],false);if(!hits.length)return null;const h=hits[0];return {id:h.object.userData.building,plot:h.object.userData.plot,point:{x:h.point.x,z:h.point.z}};}
 };
}
