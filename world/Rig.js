import * as T from 'three';
import {strength,RELATION} from '../combat/CombatSystem.js';
export {CAST,rigDisplay} from './rigTimeline.js';
// The lens-chamber rig makes E = 3n + 4 visible: six cell sockets, one three-tooth gear per loaded cell,
// one square four-point starter and a strength column of 4 starter segments plus 3 segments per cell.
export const RIG_AT=Object.freeze({x:12.6,z:.2,scale:1.35});
const SOCKET_X=i=>-1.3+i*.3,STARTER_X=.7,METER_X=1.3;
export const segmentY=k=>.4+k*.062+(k<RELATION.starter?0:(1+Math.floor((k-RELATION.starter)/RELATION.perCell))*.03);
const OFF=new T.Color('#463d52'),GEAR_OFF=new T.Color('#7d6f80'),SOCKET_ON=new T.Color('#ffd27a'),GEAR_ON=new T.Color('#f0b85a'),STARTER_ON=new T.Color('#ff9b5e'),CELL_ON=new T.Color('#ffe08a');
export class Rig {
 constructor(scene,mat){
  const g=new T.Group();g.position.set(RIG_AT.x,.4,RIG_AT.z);g.rotation.y=Math.PI/4;g.scale.setScalar(RIG_AT.scale);scene.add(g);this.group=g;g.visible=false;
  const add=(mesh,x,y,z)=>{mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
  add(new T.Mesh(new T.BoxGeometry(2.95,.25,1),mat('#5d4b5e')),0,.12,0);
  add(new T.Mesh(new T.BoxGeometry(2.95,1.95,.12),mat('#6f5a6c')),0,1.2,-.36);
  const canvas=document.createElement('canvas');canvas.width=560;canvas.height=368;this.ctx=canvas.getContext('2d');
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;this.texture=texture;
  const decal=new T.Mesh(new T.PlaneGeometry(2.8,1.84),new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false}));decal.position.set(0,1.2,-.295);g.add(decal);
  const instanced=(geo,count,rotate)=>{const m=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color:'#ffffff',roughness:.6,metalness:.15}),count);m.castShadow=true;g.add(m);m.userData.rotate=rotate;return m;};
  this.sockets=instanced(new T.CylinderGeometry(.1,.1,.18,10),6,false);
  this.gears=instanced(new T.CylinderGeometry(.15,.15,.06,3),6,true);
  this.meter=instanced(new T.BoxGeometry(.18,.05,.1),strength(RELATION.cells),false);
  this.starter=add(new T.Mesh(new T.CylinderGeometry(.24,.24,.07,4),new T.MeshStandardMaterial({color:'#9a7f86',roughness:.6,metalness:.15})),STARTER_X,1.02,-.25);this.starter.rotation.x=Math.PI/2;
  this.spin=new Array(6).fill(0);this.starterSpin=0;this.key='';
  const o=new T.Object3D();
  for(let i=0;i<6;i++){o.position.set(SOCKET_X(i),.34,.22);o.rotation.set(0,0,0);o.updateMatrix();this.sockets.setMatrixAt(i,o.matrix);}
  for(let k=0;k<strength(RELATION.cells);k++){o.position.set(METER_X,segmentY(k),-.24);o.updateMatrix();this.meter.setMatrixAt(k,o.matrix);}
  this.placeGears();this.show({n:0,lit:0,loaded:0,spinning:false},0);
 }
 paint(d){
  const c=this.ctx,px=x=>(x+1.4)*200,py=y=>(2.12-y)*200,fit=(text,x,y,size,max)=>{c.font='bold '+size+'px Georgia, serif';while(c.measureText(text).width>max&&size>18){size-=2;c.font='bold '+size+'px Georgia, serif';}c.fillText(text,x,y);};
  c.clearRect(0,0,560,368);c.fillStyle='rgba(28,24,40,.72)';c.fillRect(0,0,560,368);c.strokeStyle='#d9b27c';c.lineWidth=6;c.strokeRect(5,5,550,358);
  c.textAlign='center';c.textBaseline='middle';
  // The running sum shows the rule as it happens: the starter's 4, then one 3 for each loaded cell.
  const {perCell:k,starter:b}=RELATION,E=strength(d.n),groups=d.lit<b?0:Math.floor((d.lit-b)/k),sum=!d.n?'E = '+k+'n + '+b:d.lit===0?'n = '+d.n:d.lit<b?String(d.lit):[String(b),...Array(groups).fill(String(k))].join(' + ')+(d.lit===E?' = '+E:'');
  c.fillStyle='#fff1d2';fit(sum,px(-.15),py(1.88),58,500);
  c.fillStyle='#ffd27a';fit('▲ '+RELATION.perCell+' each',px(-.55),py(1.4),40,300);c.fillStyle='#ffb07a';fit('■ +'+RELATION.starter,px(STARTER_X),py(1.4),40,150);
  c.fillStyle='#ffe9c2';fit(d.n?'n = '+d.n+(d.n===1?' cell':' cells'):'cells n',px(-.55),py(.62),34,300);
  this.texture.needsUpdate=true;
 }
 placeGears(){const o=new T.Object3D();for(let i=0;i<6;i++){o.position.set(SOCKET_X(i),1.02,-.25);o.rotation.set(Math.PI/2,this.spin[i],0);o.updateMatrix();this.gears.setMatrixAt(i,o.matrix);}this.gears.instanceMatrix.needsUpdate=true;}
 // display: n loaded cells, loaded sockets lit so far, lit strength segments, spinning while the gears turn.
 show(d,dt){
  const key=d.n+'/'+d.loaded+'/'+d.lit;
  if(key!==this.key){this.key=key;
   for(let i=0;i<6;i++){this.sockets.setColorAt(i,i<d.loaded?SOCKET_ON:OFF);this.gears.setColorAt(i,i<d.loaded?GEAR_ON:GEAR_OFF);}
   for(let k=0;k<strength(RELATION.cells);k++)this.meter.setColorAt(k,k>=d.lit?OFF:k<RELATION.starter?STARTER_ON:CELL_ON);
   for(const m of [this.sockets,this.gears,this.meter])m.instanceColor.needsUpdate=true;
   this.starter.material.color.set(d.lit>0?'#ff9b5e':'#9a7f86');this.paint(d);
  }
  if(d.spinning&&dt>0){for(let i=0;i<d.loaded;i++)this.spin[i]+=dt*4;this.starterSpin+=dt*3;this.starter.rotation.y=this.starterSpin;this.placeGears();}
 }
 top(){return this.group.localToWorld(new T.Vector3(METER_X,2.05,-.24));}
}
