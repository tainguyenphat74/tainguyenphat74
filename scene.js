import * as T from './vendor/three.module.js';
import {land,buildings,trees} from './world.js';

export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new T.Scene();scene.background=new T.Color(0xa5d5cf);scene.fog=new T.Fog(0xa5d5cf,65,150);
 const camera=new T.PerspectiveCamera(39,1,.1,200);
 scene.add(new T.HemisphereLight(0xfff6da,0x577e70,2.3));
 const sun=new T.DirectionalLight(0xffe5b0,3);sun.position.set(-14,23,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:65});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
 const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.88,flatShading:true}));return materials.get(c);}
 function mesh(geometry,color,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const cylinder=(r1,r2,h,c,x,y,z,n=8,p)=>mesh(new T.CylinderGeometry(r1,r2,h,n),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>mesh(new T.IcosahedronGeometry(r,0),c,x,y,z,p);
 function cap(scale,depth,y,color){const shape=new T.Shape();land.forEach(([x,z],i)=>shape[i?'lineTo':'moveTo'](x*scale,z*scale));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geo.rotateX(Math.PI/2);return mesh(geo,color,0,y,0);}
 cap(1.025,2.5,-.12,0xb6a27b);cap(1.055,.18,-.16,0xe7cc96);const ground=cap(1,.18,0,0x98b775);
 // Irregular exposed cliff strata; every face has real volume and receives light.
 for(let i=0;i<land.length;i++){const a=land[i],b=land[(i+1)%land.length];for(let j=0;j<4;j++){const t=(j+.3)/4,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;const rock=ball(.9+(i%3)*.13,[0xa59a78,0xc0ac84,0x998f70][j%3],x,-1.35,z);rock.scale.set(.9,1.15,.8);}}
 const ocean=mesh(new T.PlaneGeometry(400,400),0x79bcb8,0,-2.75,0);ocean.rotation.x=-Math.PI/2;ocean.castShadow=false;
 const foam=[];for(let i=0;i<80;i++){const a=i*2.399,r=15+(i%13)*2.3,x=Math.cos(a)*r,z=Math.sin(a)*r;const m=box(.6+(i%4)*.35,.015,.06,0xc3e3d7,x,-2.71,z);m.castShadow=false;foam.push(m);}
 const shore=new T.BufferGeometry().setFromPoints([...land,land[0]].map(([x,z])=>new T.Vector3(x*1.13,-2.68,z*1.13)));scene.add(new T.Line(shore,new T.LineBasicMaterial({color:0xd6e7c5,transparent:true,opacity:.7})));
 function path(points,width=1.05){for(let i=1;i<points.length;i++){const [x,z]=points[i-1],[a,b]=points[i],length=Math.hypot(a-x,b-z);const m=box(width,.045,length,0xe6d2a5,(x+a)/2,.02,(z+b)/2);m.rotation.y=Math.atan2(a-x,b-z);cylinder(width/2,width/2,.05,0xe6d2a5,a,.02,b,12);}}
 path([[0,8],[0,4],[-1,2],[-3,1],[-5,-.3]]);path([[-1,2],[1,0],[1,-2.5]]);path([[0,4],[3,4],[6,3.4]]);path([[3,4],[8,4],[9,1],[8,-1.8]],.7);
 const picks=[];
 for(const b of buildings){const group=new T.Group();group.position.set(b.x,0,b.z);scene.add(group);group.userData.project=b.id;
  box(b.w+.22,.2,b.d+.2,0xd5c4a2,0,.12,0,group);box(b.w,2.1,b.d,b.color,0,1.2,0,group);
  // Gabled roof, extruded through the full depth of the house.
  const s=new T.Shape();s.moveTo(-b.w/2-.25,0);s.lineTo(0,1.3);s.lineTo(b.w/2+.25,0);s.closePath();const roof=new T.ExtrudeGeometry(s,{depth:b.d+.5,bevelEnabled:false});mesh(roof,b.roof,0,2.24,-b.d/2-.25,group);
  box(.7,1.35,.08,0x45655a,0,.9,b.d/2+.05,group);ball(.05,0xf3d293,.23,.86,b.d/2+.12,group);
  for(const x of [-b.w*.31,b.w*.31]){box(.77,.83,.1,0xffeed0,x,1.35,b.d/2+.06,group);box(.61,.64,.12,0x729e98,x,1.36,b.d/2+.12,group);box(.045,.64,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.65,.045,.14,0xf4deb2,x,1.36,b.d/2+.13,group);box(.84,.16,.3,0x96754e,x,.89,b.d/2+.16,group);for(let j=0;j<3;j++)ball(.13,[0xeaa16d,0xf2cf7f,0xdd816b][j],x+(j-1)*.23,1.02,b.d/2+.2,group);}
  box(.55,.95,.6,0xd5bc91,-b.w*.27,3.04,-.6,group);box(.7,.14,.75,0x8a7357,-b.w*.27,3.54,-.6,group);
  if(b.id==='feedbackfun'){for(let i=0;i<8;i++){const aw=box(b.w/8,.1,.9,i%2?0xffe7b8:0xd07856,-b.w/2+b.w/16+i*b.w/8,1.95,b.d/2+.4,group);aw.rotation.x=.15;}for(const x of [-1.8,1.8])cylinder(.045,.045,1.8,0x947957,x,.9,b.d/2+.7,6,group);}
  if(b.id==='specviewer'){box(.95,.7,.13,0x405d57,1.2,2.63,b.d/2+.28,group);for(let i=0;i<3;i++)box(.5-i*.1,.035,.02,0xd5dcb4,1.18,2.8-i*.15,b.d/2+.36,group);}
  if(b.id==='echoling'){for(let i=0;i<9;i++)box(b.w+.03,.035,b.d+.03,0xa5825c,0,.35+i*.21,0,group);}
  group.traverse(o=>{if(o.isMesh){o.userData.project=b.id;picks.push(o);}});
 }
 trees.forEach(([x,z],i)=>{const h=1.8+(i%4)*.24;cylinder(.13,.22,h,0x806b48,x,h/2,z,7);if(i%3===0){for(let j=0;j<3;j++)cylinder(0,1.05-j*.2,1.6, [0x497b5c,0x5d9165,0x739e69][j],x,h+j*.65,z,7);}else{const crown=ball(1.12, i%2?0x6e995f:0x578963,x,h+.45,z);crown.scale.set(1,1.2,1);ball(.73,0x88a86a,x-.48,h+1.02,z+.1);}});
 // Lighthouse with a walkable approach, railing, lantern and copper roof.
 const lx=8,lz=-3;cylinder(.85,1, .3,0xc9ba91,lx,.15,lz,12);for(let i=0;i<5;i++)cylinder(.65-i*.04,.69-i*.04,.75,i%2?0xc87558:0xf3e4bd,lx,.65+i*.75,lz,12);
 cylinder(.92,.92,.16,0x4c6860,lx,4.1,lz,12);cylinder(.55,.55,.8,0xf5d694,lx,4.58,lz,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(.045,.045,.92,0x45655b,lx+Math.cos(a)*.6,4.57,lz+Math.sin(a)*.6,5);}cylinder(0,.95,.7,0x527c6c,lx,5.3,lz,8);ball(.12,0xe9c17d,lx,5.72,lz);
 box(.46,.9,.1,0x4b6960,lx,.65,lz+.81);
 // Dock descends off the southern edge. It is scenery, beyond the grass navigation boundary.
 for(let i=0;i<15;i++){const z=8.4+i*.34;box(1.65,.14,.29, i%2?0xa58257:0xb89464,0,-.08-i*.07,z);if(i%4===0)for(const x of [-.8,.8])cylinder(.09,.1,2.9,0x826b4d,x,-1.15,z,6);}
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
 scene.traverse(o=>{if(o.isMesh&&o!==ground&&o!==ocean&&!foam.includes(o)&&o.parent!==boat)stationary.push(o);});
 for(const object of stationary){const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);if(!batches.has(object.material))batches.set(object.material,[]);batches.get(object.material).push(geometry);object.removeFromParent();}
 for(const [material,geometries] of batches){const geometry=new T.BufferGeometry();for(const name of ['position','normal']){const total=geometries.reduce((n,g)=>n+g.attributes[name].array.length,0),array=new Float32Array(total);let offset=0;for(const g of geometries){array.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}geometry.setAttribute(name,new T.BufferAttribute(array,3));}const batch=new T.Mesh(geometry,material);batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);for(const g of geometries)g.dispose();}
 // Humanoid avatar: pivoted limbs, shoes, face and backpack, all actual geometry.
 const avatar=new T.Group();scene.add(avatar);box(.48,.6,.29,0xd97855,0,.87,0,avatar);ball(.26,0xf0c796,0,1.42,0,avatar);const hair=ball(.275,0x354b40,0,1.54,-.025,avatar);hair.scale.y=.65;
 for(const x of [-.085,.085])ball(.025,0x364b42,x,1.44,.23,avatar);box(.3,.35,.16,0xd1ac69,0,.92,-.23,avatar);
 const limbs=[];for(let i=0;i<4;i++){const arm=i>1,x=(i%2?1:-1)*(arm?.34:.14),pivot=new T.Group();pivot.position.set(x,arm?1.13:.6,0);avatar.add(pivot);box(arm?.13:.17,arm?.45:.47,.18,arm?0xf0c796:0x3d5a61,0,-.22,0,pivot);if(!arm)box(.2,.13,.3,0xf4e7c8,0,-.47,.06,pivot);limbs.push(pivot);}
 const marker=new T.Mesh(new T.RingGeometry(.38,.46,32),new T.MeshBasicMaterial({color:0xffefbb,side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.055;scene.add(marker);
 const target=new T.Vector3(0,0,0),projected=new T.Vector3(),raycaster=new T.Raycaster();
 return {renderer,camera,scene,
 resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?60:39;camera.updateProjectionMatrix();},
 render(c,walker,time,reduced){camera.position.set(Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance);camera.lookAt(target);avatar.position.set(walker.position.x,.06,walker.position.z);avatar.rotation.y=walker.facing;limbs.forEach((l,i)=>l.rotation.x=walker.walking&&!reduced?Math.sin(time*11)*(i%2?1:-1)*(i>1?-.5:.65):0);marker.position.x=walker.position.x;marker.position.z=walker.position.z;if(!reduced){boat.rotation.z=Math.sin(time*1.4)*.045;foam.forEach((m,i)=>m.position.y=-2.7+Math.sin(time+i)*.025);}renderer.render(scene,camera);},
 project(b){projected.set(b.x,4.25,b.z).project(camera);return {x:(projected.x+1)*canvas.clientWidth/2,y:(1-projected.y)*canvas.clientHeight/2,visible:projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.94&&Math.abs(projected.y)<.85};},
 pick(clientX,clientY){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hits=raycaster.intersectObjects([ground,...picks],false);if(!hits.length)return null;const h=hits[0];return {id:h.object.userData.project,point:{x:h.point.x,z:h.point.z}};}
 };
}
