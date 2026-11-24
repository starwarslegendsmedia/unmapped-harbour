export const BENCH=Object.freeze({x:-4.5,z:.4,radius:3.3});
export const nearBench=p=>Math.hypot(p.x-BENCH.x,p.z-BENCH.z)<BENCH.radius;
export const PLACES=Object.freeze([
 {id:'pipe',label:'Water tank',x:4,z:-.5,radius:2.2},
 {id:'iona',label:'Iona',x:7,z:-2,radius:1.8},
 {id:'log',label:'Keeper’s notebook',x:9.5,z:.2,radius:1.6},
 {id:'archive',label:'Letter room',x:5,z:-4,radius:1.6},
 {id:'beacon',label:'Lighthouse',x:12,z:-.8,radius:2.2},
]);
export function nearby(p){return PLACES.map(q=>({...q,distance:Math.hypot(p.x-q.x,p.z-q.z)})).filter(q=>q.distance<q.radius).sort((a,b)=>a.distance-b.distance)[0]??null;}
