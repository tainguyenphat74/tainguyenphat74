import * as T from './vendor/three.module.js';
// Original deterministic, tileable material studies. Generated locally, no asset requests.
export function surface(kind) {
 const size=128,data=new Uint8Array(size*size*4);let seed=731;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=(random()-.5)*24;let v=190+noise;
  if(kind==='stone'){const row=Math.floor(y/32),joint=y%32<2||(x+row%2*32)%64<2;v=joint?105:185+noise+12*Math.sin(Math.floor((x+row%2*32)/64)*5+row*3);}
  if(kind==='timber')v=172+noise+19*Math.sin(x*.55+3*Math.sin(y*Math.PI/64))-(x%32<2?45:0);
  if(kind==='roof')v=175+noise-(y%16<3?55:0)-((x+Math.floor(y/16)%2*16)%32<2?30:0);
  if(kind==='soil')v=168+noise*2+15*Math.sin(x*Math.PI/16)*Math.cos(y*Math.PI/32);
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
 }
 const map=new T.DataTexture(data,size,size);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(2,2);map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;return map;
}
export function mergeGeometry(geometries){
 const merged=new T.BufferGeometry();
 for(const [name,width] of [['position',3],['normal',3],['uv',2],['color',3]]){
  if(name==='color'&&!geometries.some(g=>g.hasAttribute(name)))continue;
  const array=new Float32Array(geometries.reduce((n,g)=>n+g.attributes.position.count*width,0));let offset=0;if(name==='color')array.fill(1);
  for(const g of geometries){const attribute=g.getAttribute(name);if(attribute)array.set(attribute.array,offset);offset+=g.attributes.position.count*width;}
  merged.setAttribute(name,new T.BufferAttribute(array,width));
 }
 return merged;
}

// Metres per tile, independent of triangulation and mesh rotation/scale.
export function worldUV(geometry, metres=5){
 const p=geometry.attributes.position,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)/metres;uv[i*2+1]=p.getZ(i)/metres;}
 geometry.setAttribute('uv',new T.BufferAttribute(uv,2));return geometry;
}

// Original leaf spray: slender stems and individual tapered leaves, cut out in alpha.
export function foliageTexture(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+ .5)/size,v=(y+.5)/size;let coverage=Math.abs(u-(.48+.06*Math.sin(v*5)))<.008&&v>.1&&v<.9;
  let vein=0;
  for(let j=0;j<9;j++){
   const side=j%2?1:-1,cy=.19+j*.073,cx=.49+side*.145,dx=u-cx,dy=v-cy;
   const a=dx*.8+dy*side*.6,b=-dx*side*.6+dy*.8;
   if((a/.18)**2+(b/.046)**2<1){coverage=true;vein=Math.abs(b)<.004?15:0;}
  }
  const i=(y*size+x)*4,n=8*Math.sin(x*1.7+y*.9);
  data[i]=103+n+vein;data[i+1]=124+n+vein;data[i+2]= 70;data[i+3]=coverage?255:0;
 }
 const map=new T.DataTexture(data,size,size);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}

export function coastalWater(){
 const time={value:0};
 const material=new T.MeshStandardMaterial({color:0x526f70,roughness:.32,metalness:.08});
 material.onBeforeCompile=shader=>{
  shader.uniforms.coastTime=time;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 coastPosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ncoastPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float coastTime;\nvarying vec3 coastPosition;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 q=coastPosition.xz;
   float a=dot(q,vec2(2.3,1.1))+coastTime*.65;
   float b=dot(q,vec2(-1.7,3.2))-coastTime*.48;
   vec3 ripple=vec3(.055*cos(a)+.028*cos(b),0.,.026*cos(a)-.052*cos(b));
   normal=normalize(normal+mat3(viewMatrix)*ripple);
  `).replace('#include <opaque_fragment>',`float coastFresnel=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),5.);
   outgoingLight=mix(outgoingLight,vec3(.48,.58,.59),coastFresnel*.38);
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'coastal-ripples-v1';
 return {material,time};
}
