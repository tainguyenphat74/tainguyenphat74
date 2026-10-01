// Shared farm footprints, in metres. Crop beds are approached from the south.
export const land=[[-12,-10],[12,-10],[12,10],[-12,10]];
export const buildings=[
 {id:'barn',x:-5,z:-4.8,w:4,d:3.6,label:'Barn',hint:'Barn · stores the harvest you collect. Your crops earn 10 coins each.'},
 {id:'workshop',x:1,z:-5,w:3.8,d:3.2,label:'Workshop',hint:'Workshop · tools for your farm. Seeds and water are free.'},
 {id:'farmhouse',x:7,z:-4,w:3.2,d:3,label:'Farmhouse',hint:'Farmhouse · welcome home! Harvest six crops to finish the season.'},
];
export const trees=[[-10,0],[-10,-6],[-8,-8],[-3,-8],[4,-8],[10,-7],[10,-1],[-10,6],[-7,8],[10,8]];
export const fences=[{x:0,z:-9.3,w:23,d:.15},{x:-11.3,z:0,w:.15,d:18.6},{x:11.3,z:0,w:.15,d:18.6},{x:-7,z:9.3,w:8.6,d:.15},{x:7,z:9.3,w:8.6,d:.15}];
export const pond={x:8,z:4,r:2.15};
export const circles=[...trees.map(([x,z])=>({x,z,r:.32})),pond];
export const entrances=Object.fromEntries(buildings.map(b=>[b.id,{x:b.x,z:b.z+b.d/2+.9}]));
