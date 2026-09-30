// Shared world-space X/Z footprints. The grass surface is Y=0.
export const land=[[-12,-5],[-8,-9],[-2,-10],[5,-9],[10,-5],[12,0],[10,6],[5,9],[-2,10],[-9,7],[-12,2]];
export const buildings=[
 {id:'feedbackfun',x:-5,z:-3,w:4,d:3.6,color:0xf1d9aa,roof:0xc86c53,label:'Feedback café'},
 {id:'specviewer',x:1,z:-5,w:3.8,d:3.2,color:0xd5dfbd,roof:0x467e79,label:'Dev workshop'},
 {id:'echoling',x:6,z:1,w:3.2,d:3,color:0xcaa277,roof:0xb96850,label:'Listening cabin'},
];
export const trees=[[-10,0],[-9,-4],[-7,-7],[-4,-8],[-1,-8],[4,-7],[7,-5],[9,-3],[10,1],[9,4],[7,6],[4,7],[-4,8],[-7,5],[-10,3],[-8,1],[-2,-5],[4,-3],[-5,5]];
export const circles=[...trees.map(([x,z])=>({x,z,r:.32})),{x:8,z:-3,r:1},{x:-7,z:0,r:.7},{x:-6.8,z:-.5,r:.05},{x:-3.2,z:-.5,r:.05}];
export const entrances=Object.fromEntries(buildings.map(b=>[b.id,{x:b.x,z:b.z+b.d/2+.9}]));
