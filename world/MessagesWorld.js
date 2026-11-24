import * as T from '../vendor/build/three.module.js';
import {messageEvents,MESSAGE_TASKS} from '../math/messages.js';
// Drafts never draw a loaded crate. Two shared instance batches draw only the committed physical load.
export class MessagesWorld{
 constructor(world){this.group=new T.Group();world.scene.add(this.group);this.key='';const geometry=new T.BoxGeometry(1,1,1);this.wood=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color:'#ad7f4b'}),60);this.paper=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color:'#fff0c8'}),47);this.group.add(this.wood,this.paper);this.group.visible=false;this.matrix=new T.Matrix4();this.rotation=new T.Quaternion();this.items=0;this.dispatches=0;}
 box(mesh,index,x,y,z,sx,sy,sz){this.matrix.compose(new T.Vector3(x,y,z),this.rotation,new T.Vector3(sx,sy,sz));mesh.setMatrixAt(index,this.matrix);}
 update(s){
  if(s===this.state)return;this.state=s;this.dispatches=s.messages.dispatches;
  const last=messageEvents(s).findLast(e=>e.kind!=='help'&&e.context==='story'),key=(last?.id??'')+':'+s.messages.jammed;
  if(key===this.key)return;this.key=key;this.items=0;this.group.visible=false;if(!last)return;
  const t=MESSAGE_TASKS[0],a=last.actual,dispatched=s.messages.dispatches===1;if(!dispatched&&!s.messages.jammed)return;
  this.group.position.set(dispatched?9:8,dispatched?.3:.85,dispatched?5.3:1.2);this.group.visible=true;
  a.packing.forEach((n,i)=>{const x=(i%4)*.42-.63,z=Math.floor(i/4)*.52;this.box(this.wood,i,x,0,z,.36,.18,.44);for(let j=0;j<n;j++)this.box(this.paper,this.items++,x+(j%2)*.13-.065,.12+Math.floor(j/2)*.025,z,.11,.018,.32);});
  for(let j=0;j<a.waiting;j++)this.box(this.paper,this.items++,.95,.01+j*.015,0,.18,.012,.25);
  this.wood.count=a.packing.length;this.paper.count=this.items;
  for(const mesh of [this.wood,this.paper]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
 }
 metrics(){return {items:this.items,objects:this.group.visible?this.wood.count+this.paper.count:0,drawBatches:this.group.visible?2:0,dispatches:this.dispatches};}
}
