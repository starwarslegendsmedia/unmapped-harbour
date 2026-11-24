import {mixturePlan,WATER} from '../math/encounters.js';
import * as T from 'three';
import {BENCH} from './places.js';
import {Character} from '../character/Character.js';
import {Rig,RIG_AT} from './Rig.js';
import {CAST,rigDisplay} from './rigTimeline.js';
import {SPELL,CALIBRATION} from '../combat/CombatSystem.js';
export class World {
 constructor(canvas){
  this.scene=new T.Scene();this.scene.background=new T.Color('#827bba');this.scene.fog=new T.FogExp2('#827bba',.007);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.camera=new T.OrthographicCamera(-16,16,8,-8,.1,180);this.target=new T.Vector3(-2,0,0);
  this.scene.add(new T.HemisphereLight('#c4d6ee','#172239',1.65));const sun=new T.DirectionalLight('#ffc887',3.1);sun.position.set(-8,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-25,right:25,top:20,bottom:-20,near:.1,far:80});sun.shadow.bias=-.001;this.scene.add(sun);
  this.materials=new Map();this.lamps=[];this.time=0;this.frames=[];this.lastFrame=performance.now();this.frameCursor=0;
  this.build();this.dress();this.box(9.5,.9,.2,1.2,.25,.8,'#846658');this.box(9.5,1.07,.2,.65,.08,.45,'#ead1a2');this.batch();
  this.hero=new Character(this.scene,'./assets/sprites/explorer-walk.png',3.4);
  this.work=new Character(this.scene,'./assets/sprites/explorer-actions.png',3.5);this.work.sprite.visible=false;this.workLoop=false;
  this.ambrose=new Character(this.scene,'./assets/sprites/harbour-folk-v2.png',3.1,0);this.ambrose.set(-8.3,-1.5);
  this.iona=new Character(this.scene,'./assets/sprites/harbour-folk-v2.png',2.7,2);this.iona.set(8,-2);
  this.mechanic=new Character(this.scene,'./assets/sprites/explorer-mechanisms.png',3.5);this.mechanic.sprite.visible=false;this.buildMechanisms();this.sentries=[new Character(this.scene,'./assets/sprites/harbour-folk-v2.png',3,3),new Character(this.scene,'./assets/sprites/harbour-folk-v2.png',2.7,3)];this.sentries[0].set(15.6,-1.2);this.sentries[1].set(15.2,-4.2);this.sentries[1].sprite.material.color.set('#b4dcff');this.rings=[this.cyl(15.6,.6,-1.2,.9,.08,'#8cb9d4'),this.cyl(15.2,.6,-4.2,.8,.08,'#bdacd9')];this.pulse=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshBasicMaterial({color:'#ffe2a1'}));this.scene.add(this.pulse);this.pulse.visible=false;this.rig=new Rig(this.scene,c=>this.mat(c));this.rigDemo=false;this.combatVisual=null;this.impact=0;this.view=null;this.panelOpen=false;this.buildEnding();this.reducedMotion=false;this.quality='auto';
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.resize();addEventListener('resize',()=>this.resize());
 }
 mat(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));return this.materials.get(color);}
 box(x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),this.mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);return m;}
 cyl(x,y,z,r,h,color,n=12){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,n),this.mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);return m;}
 build(){
  this.water=new T.Mesh(new T.PlaneGeometry(220,220),new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec3 p;void main(){float w=sin(p.x*1.8+sin(p.y*.7+time*.3))*sin(p.y*2.-time*.4);float glint=pow(max(0.,w),18.);vec3 c=mix(vec3(.13,.20,.34),vec3(.24,.42,.53),.5+.5*sin(p.y*.09));gl_FragColor=vec4(c+glint*.12,1.);}'}));this.water.rotation.x=-Math.PI/2;this.water.position.y=-.6;this.scene.add(this.water);
  // Quays leave a measured 2.85 m gap. One scene unit is one metre.
  this.box(-7.7125,-.5,0,12.575,1.5,7,'#645b80');this.box(9,-.5,-1,15.15,1.5,11,'#645b80');
  this.box(-7.7125,.27,0,12.575,.25,6.9,'#b19c91');this.box(9,.27,-1,15.15,.25,10.9,'#b6a395');
  for(let x=-13;x<16;x+=1.2){if(x>-1.6&&x<1.6)continue;this.box(x,.41,1.6,1.12,.05,1.4,'#9e909e');this.box(x,.41,.12,1.12,.05,1.4,'#b1a0a5');this.box(x,.41,-1.36,1.12,.05,1.4,'#a2929c');}
  this.box(-1.525,.48,0,.2,.18,2.3,'#d1b584');this.box(1.525,.48,0,.2,.18,2.3,'#d1b584');
  this.bridge=this.box(0,.59,0,3.25,.18,1.65,'#be8855');this.bridge.visible=false;
  this.failed=this.box(0,.8,0,2.85,.16,1.35,'#9b6b55');this.failed.visible=false;
  for(const x of [-12,-10,-8,-6,-4,3,5,8,11,14]){this.cyl(x,-.2,3.1,.18,3.2,'#574154');this.cyl(x,.95,3.1,.26,.18,'#ce9a68');}
  this.bench=this.box(-4.5,.9,-.9,2.5,.2,1.3,'#714e57');for(const x of [-5.4,-3.6])this.box(x,.65,-.9,.15,.7,1,'#543a4b');
  this.stock=this.box(-4.5,1.1,-.9,4.8,.15,.3,'#d9a36d');this.piece=this.box(-4.5,1.5,0,3.25,.15,.6,'#d9a36d');this.piece.visible=false;
  this.jigLeft=this.box(-6.25,1.22,-.4,.12,.45,.7,'#bc7660');this.jigRight=this.box(-2.75,1.22,-.4,.12,.45,.7,'#bc7660');this.badTag=this.box(-4.5,1.42,-.8,.4,.3,.05,'#f57665');this.badTag.visible=false;
  this.box(-11,.8,-2,1,1,1,'#976e62');this.box(-12,1.05,-2,.8,1.5,.8,'#785466');
  this.house(-9,-5,4,3.3,'#548d88','#345f70');this.house(5,-6,4.3,3,'#b87865','#3d526f');this.house(12,-6,4,4.8,'#a99ca1','#3b5267');
  // Copper keeper's tower, galleries, glass lantern and a rotating beam.
  this.cyl(12,3.4,-3.3,1.45,6.2,'#c7a398',12);this.cyl(12,6.5,-3.3,1.9,.3,'#5f516b');
  for(let a=0;a<8;a++){let r=a*Math.PI/4;this.box(12+Math.sin(r)*1.6,7.2,-3.3+Math.cos(r)*1.6,.12,1.4,.12,'#655570');}
  this.cyl(12,7,-3.3,.9,1.1,'#607789');this.beacon=this.cyl(12,7.1,-3.3,.45,.9,'#ffc978');
  const roof=new T.Mesh(new T.ConeGeometry(2.1,1.7,8),this.mat('#345867'));roof.position.set(12,8.2,-3.3);this.scene.add(roof);
  this.beam=new T.Mesh(new T.ConeGeometry(2.2,18,20,1,true),new T.MeshBasicMaterial({color:'#ffdc97',transparent:true,opacity:.07,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));this.beam.rotation.z=Math.PI/2;this.beam.position.set(9,0,0);this.beam.visible=false;this.beamPivot=new T.Group();this.beamPivot.position.set(12,7.1,-3.3);this.beamPivot.add(this.beam);this.scene.add(this.beamPivot);
  for(const [x,z]of[[-10,2],[-5,2],[3,2],[7,2],[9.4,3.8]])this.lantern(x,z);
  for(let n=0;n<15;n++){const x=-18+n*2.7,z=-14-Math.sin(n)*4;this.cyl(x,-.4,z,.8+Math.sin(n)*.4,2+Math.cos(n),'#625e80',5);}
  for(const [x,z]of[[-12,-3],[4,-3],[8,-4],[15,-4]]){this.box(x,.6,z,.9,.4,.8,'#5a6c73');for(let n=0;n<5;n++){const leaf=new T.Mesh(new T.ConeGeometry(.25,1.2,5),this.mat(n%2?'#93a781':'#5e8e87'));leaf.position.set(x+Math.sin(n)*.3,1.2,z+Math.cos(n)*.2);leaf.rotation.z=Math.sin(n)*.6;this.scene.add(leaf);}}
  this.marker=new T.Mesh(new T.TorusGeometry(.45,.04,5,28),new T.MeshBasicMaterial({color:'#ffdf99'}));this.marker.rotation.x=-Math.PI/2;this.marker.position.set(-4.5,.48,.4);this.scene.add(this.marker);
 }
 dress(){
  // Weathered edges, timber joints and ropes give each route a readable silhouette.
  for(const [lo,hi,z] of [[-14,-1.5,3.45],[1.5,16.5,4.45]]){
   for(let x=lo+.3;x<hi;x+=.75){this.box(x,-.05,z,.69,.55,.22,'#766477');this.box(x,-.65,z,.73,.52,.18,'#4d4c69');}
  }
  const rope=(a,b)=>{const mid=new T.Vector3().addVectors(a,b).multiplyScalar(.5);mid.y-=.22;const curve=new T.QuadraticBezierCurve3(a,mid,b);const m=new T.Mesh(new T.TubeGeometry(curve,8,.025,4,false),this.mat('#d9b894'));this.scene.add(m);};
  for(const [x,z] of [[-12,3.1],[-10,3.1],[-8,3.1],[-6,3.1],[3,3.1],[5,3.1],[8,3.1],[11,3.1]])rope(new T.Vector3(x,1.02,z),new T.Vector3(x+1.8,1.02,z));
  for(const [x,z] of [[-12,4.7],[5,6.2],[9,6.2]]){
   const boat=new T.Mesh(new T.SphereGeometry(.9,10,6,0,Math.PI*2,0,Math.PI/2),this.mat('#905747'));boat.rotation.x=Math.PI;boat.scale.set(.65,.7,2);boat.position.set(x,-.2,z);this.scene.add(boat);
   this.box(x,-.25,z,.85,.08,1.9,'#c69568');this.box(x,.03,z,.12,.12,1.5,'#e3bd88');rope(new T.Vector3(x,.2,z),new T.Vector3(x,.8,z-1.7));
  }
  for(const [x,z] of [[-11,-2.3],[-10.2,-2.3],[6,-3.6],[8,-3.6],[14,-2]]){
   this.cyl(x,.83,z,.36,.9,'#7e635d',10);this.cyl(x,1.07,z,.38,.055,'#c0946d',10);this.cyl(x,.58,z,.38,.055,'#b78e69',10);
  }
  for(const [x,z] of [[-9,-5],[5,-6],[12,-6]]){
   this.box(x-1,4.2,z,.45,1.7,.5,'#8c7886');
   for(let n=0;n<4;n++)this.box(x,3.1+n*.13,z+1.4,3.3,.055,.08,n%2?'#756175':'#ad887f');
   for(let n=-1;n<=1;n++)this.box(x+n*.9,.5,z+1.5,.65,.12,.55,'#cab099');
  }
  // Hanging festival cloth remembers the lively harbour before the beacon failed.
  for(let n=0;n<14;n++){const x=-12+n*1.8,z=-2.8;this.cyl(x,2,z,.035,3,'#68596b',5);if(n<13)rope(new T.Vector3(x,3.4,z),new T.Vector3(x+1.8,3.4,z));const m=new T.Mesh(new T.ConeGeometry(.23,.5,3),this.mat(['#d99b85','#66a1a2','#d5b97c'][n%3]));m.rotation.z=Math.PI;m.position.set(x+.8,3.05,z);this.scene.add(m);}
  // Copper pipes visibly join the reservoir, archive and beacon.
  for(let x=3.3;x<12;x+=.7)this.cyl(x,.8,-2.7,.09,.7,'#b68c6b',8).rotation.z=Math.PI/2;
  this.cyl(4,1.35,-1.9,1.05,1.9,'#517e88',16);this.cyl(4,2.3,-1.9,1.12,.15,'#d4ae7c',16);this.box(4,1.4,-.86,.7,.8,.025,'#35576a');
  for(let n=0;n<5;n++)this.box(4,1.1+n*.14,-.84,.45,.025,.025,'#dcbd84');
  // Distant headlands and a broken sea arch frame the water.
  for(let n=0;n<12;n++){const x=-30+n*5,z=-25-Math.cos(n)*3;const hill=new T.Mesh(new T.ConeGeometry(4+n%3,6+n%4,6),this.mat(n%2?'#5e6c87':'#706c90'));hill.position.set(x,1,z);this.scene.add(hill);}
  const arch=new T.Mesh(new T.TorusGeometry(2.2,.65,6,18,Math.PI),this.mat('#7b7998'));arch.position.set(-8,0,-18);this.scene.add(arch);
  for(const l of this.lamps){const glow=new T.Mesh(new T.SphereGeometry(.23,8,6),new T.MeshBasicMaterial({color:'#ffd396'}));glow.position.copy(l.position);this.scene.add(glow);}
 }
 buildMechanisms(){
  this.tankGauge=this.box(4,1.4,-.82,.42,1.25,.04,'#8ecad3');
  this.valve=this.box(4,.9,-.15,.6,.1,.6,'#cda777');
  this.spill=this.cyl(3,.5,.8,.55,.08,'#84bbc9',14);this.spill.visible=false;
  this.flow=[];for(let i=0;i<8;i++){const drop=new T.Mesh(new T.SphereGeometry(.09,6,4),new T.MeshBasicMaterial({color:'#b4e8ec'}));this.scene.add(drop);this.flow.push(drop);}
  this.archiveDoor=this.box(5,1.2,-4.45,.9,1.5,.12,'#91696c');
  this.ferryCrate=this.box(9,.65,3.6,.8,.7,.8,'#bd9c70');
  this.box(8,.9,-1.7,2.2,.18,1,'#795d64');this.amber=this.cyl(7.55,1.22,-1.6,.22,.5,'#eeb665');this.clearFeed=this.cyl(8.45,1.22,-1.6,.22,.5,'#a0d9e6');
  this.lensFill=this.cyl(8,1.3,-1.65,.42,.3,'#776c86');this.lensFill.visible=false;this.mixTag=this.box(8.5,1.65,-1.65,.2,.25,.05,'#f57665');this.mixTag.visible=false;
 }
 mechanism(kind,position,demo=false,extra={}){document.body.classList.add('mechanism-action');this.workLoop=false;this.autoTarget={...position};this.focusPoint={...position};this.mechanismAction={kind,t:0,duration:kind==='cast'?CAST.duration:2.6,position:{...position},demo,...extra};this.view=extra.view??null;}
 batch(){
  // Batch immutable scenery by material; interactive pieces stay separate.
  this.scene.updateMatrixWorld(true);const groups=new Map();
  for(const mesh of [...this.scene.children]){
   if(!mesh.isMesh||!mesh.material.isMeshStandardMaterial||[this.bridge,this.failed,this.stock,this.piece,this.beacon,this.badTag].includes(mesh))continue;
   const key=mesh.material;let group=groups.get(key);if(!group){group=[];groups.set(key,group);}group.push(mesh);
  }
  for(const [material,meshes]of groups){
   const geometries=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);return g;});
   const combined=new T.BufferGeometry();
   for(const name of ['position','normal','uv']){if(!geometries.every(g=>g.getAttribute(name)))continue;const arrays=geometries.map(g=>g.getAttribute(name).array);const all=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;for(const a of arrays){all.set(a,at);at+=a.length;}combined.setAttribute(name,new T.BufferAttribute(all,name==='uv'?2:3));}
   combined.computeBoundingSphere();const mesh=new T.Mesh(combined,material);mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);
   for(const old of meshes){this.scene.remove(old);old.geometry.dispose();}for(const g of geometries)g.dispose();
  }
 }
 house(x,z,w,h,wall,roof){this.box(x,h/2+.4,z,w,h,2.8,wall);const r=new T.Mesh(new T.ConeGeometry(w*.8,1.9,4),this.mat(roof));r.rotation.y=Math.PI/4;r.scale.z=.8;r.position.set(x,h+1.3,z);r.castShadow=true;this.scene.add(r);for(let n=-1;n<=1;n+=2){this.box(x+n*w*.25,h*.55,z+1.42,.7,.9,.05,'#ffcd85');this.box(x+n*w*.25,h*.55,z+1.47,.06,1,.07,'#686073');}this.box(x,.95,z+1.45,.65,1.2,.1,'#68576f');}
 lantern(x,z){this.cyl(x,1.3,z,.07,1.9,'#66516a',6);this.box(x,2.35,z,.4,.5,.4,'#ffcc80');this.cyl(x,2.67,z,.32,.15,'#75536a',6);const l=new T.PointLight('#ffb267',2.8,5,2);l.position.set(x,2.4,z);this.scene.add(l);this.lamps.push(l);}
 screenPoint(x,y,z){this.labelPoint??=new T.Vector3();this.labelPoint.set(x,y,z).project(this.camera);return {x:(this.labelPoint.x+1)*innerWidth/2,y:(1-this.labelPoint.y)*innerHeight/2};}
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.left=-8*w/h;this.camera.right=8*w/h;this.camera.top=8;this.camera.bottom=-8;this.camera.updateProjectionMatrix();}
 valid(x,z,s,from=null){if(x<-13||x>16||z<(x<0?-2.7:-4.8)||z>(x<0?2.5:4.5))return false;const rig=(a,b)=>Math.hypot(a-RIG_AT.x,b-RIG_AT.z);if(x>0&&Math.hypot(x-12,z+3.3)<1.7)return false;if(this.rig.group.visible&&rig(x,z)<1.7&&!(from&&rig(x,z)>rig(from.x,from.z)))return false;if(x>-1.65&&x<1.65)return !!s.bridge.done&&Math.abs(z)<.65;return true;}
 step(dt,s,vector,paused){
  this.time+=paused?0:dt;this.water.material.uniforms.time.value=this.time;
  let autoMoving=false;
  if(!paused&&this.autoTarget){const p=s.position,t=this.autoTarget;const dz=t.z-p.z,dx=t.x-p.x;const dist=Math.hypot(dx,dz);if(dist<.05){p.x=t.x;p.z=t.z;this.autoTarget=null;}else{const d=Math.min(dist,3.4*dt);p.x+=dx/dist*d;p.z+=dz/dist*d;autoMoving=true;}}
  let moving=!paused&&!this.autoTarget&&Math.hypot(vector.x,vector.z)>.1;
  if(moving){const speed=3.4*dt;const p=s.position;const x=p.x+(vector.x+vector.z)*.7071*speed,z=p.z+(vector.z-vector.x)*.7071*speed;if(this.valid(x,p.z,s,p))p.x=x;if(this.valid(p.x,z,s,p))p.z=z;}
  const row=Math.abs(vector.x)>Math.abs(vector.z)?(vector.x>0?3:2):(vector.z<0?1:0);
  this.hero.set(s.position.x,s.position.z);this.hero.animate(paused?0:dt,moving||autoMoving,moving?row:this.hero.row);if(moving)this.hero.row=row;
  this.ambrose.animate(paused?0:dt,true,0);this.iona.animate(paused?0:dt,false,2);
  this.work.sprite.visible=!this.autoTarget&&(this.working>0||this.workLoop||!!this.sequence||this.mechanismAction?.kind==='cast');this.mechanic.sprite.visible=!!this.mechanismAction&&this.mechanismAction.kind!=='cast'&&!this.autoTarget;
  this.hero.sprite.visible=!this.work.sprite.visible&&!this.mechanic.sprite.visible;
  if(this.mechanismAction&&!this.autoTarget){const q=this.mechanismAction;if(!paused)q.t+=dt;if(q.kind==='cast'){this.work.set(q.position.x,q.position.z);this.work.animate(paused?0:dt,true,3);}else{this.mechanic.set(q.position.x,q.position.z);this.mechanic.animate(paused?0:dt,true,q.kind==='valve'?0:q.kind==='reaction'?2:1);}if(q.t>=q.duration){this.mechanismAction=null;if(q.kind==='valve')this.waterVisual=null;else if(q.kind==='cast'){this.combatVisual=null;if(!this.panelOpen)this.view=null;}else this.mixVisual=null;document.body.classList.remove('mechanism-action');if(!q.demo)this.focusPoint=null;this.onArrival?.(q.position);}}
  // The machine belongs to its explained chamber task and pulse actions. Exploration stays clear.
  this.rig.group.visible=this.view==='chamber'||this.mechanismAction?.kind==='cast';
  if(s.combat){
   // Barriers keep their pre-cast drawing until the pulse visibly arrives, then show the committed result.
   const q=this.mechanismAction,casting=q?.kind==='cast'&&!!q.rig&&!this.autoTarget;if(casting&&q.t>=CAST.impact&&this.combatVisual){this.combatVisual=null;this.impact=this.reducedMotion?0:.45;this.onImpact?.();}
   const cv=this.combatVisual??s.combat;this.impact=Math.max(0,this.impact-(paused?0:dt));
   this.sentries.forEach((foe,i)=>{foe.sprite.visible=cv.active&&cv.hp[i]>0;foe.animate(paused?0:dt,true,3);this.rings[i].visible=foe.sprite.visible;const r=(.4+.6*cv.hp[i]/[16,7][i])*(1+this.impact*(i===(s.combat.pending?.actual.target??-1)?.8:0));this.rings[i].scale.x=this.rings[i].scale.z=r;});
   this.pulse.visible=casting&&q.t>CAST.fill&&q.t<CAST.impact;
   if(this.pulse.visible){const from=this.rig.top(),target=s.combat.pending?.actual.target??0,goal=q.calibration?new T.Vector3(12,7.1,-3.3):target===0?new T.Vector3(15.6,1.8,-1.2):new T.Vector3(15.2,1.8,-4.2),progress=(q.t-CAST.fill)/(CAST.impact-CAST.fill);this.pulse.position.lerpVectors(from,goal,progress);this.pulse.position.y+=Math.sin(progress*Math.PI)*1.4;}
   const last=s.evidence.findLast(e=>e.actual?.n&&(e.content===SPELL.content||e.content===CALIBRATION.content));
   if(this.rig.group.visible)this.rig.show(rigDisplay(casting?q:null,last?.actual.n??0,this.time,this.rigDemo),paused?0:dt);
  }
  const w=this.waterVisual??s.water,m=this.mixVisual??s.mix;
  if(w){this.tankGauge.scale.y=w.volume/WATER.capacity;this.tankGauge.position.y=.78+.625*w.volume/WATER.capacity;this.spill.visible=w.spill>0;this.valve.rotation.y=w.done?Math.PI/2:0;
   this.flow.forEach((drop,i)=>{drop.visible=w.done;const phase=(this.time*.65+i/8)%1;drop.position.set(4+phase*8,.94,-2.7);});
   this.archiveDoor.rotation.y=w.done&&w.plan.service==='archive'?-1.2:0;this.ferryCrate.position.y=w.done&&w.plan.service==='ferry'?1.8:.65;
  }
  if(m){const batch=m.fresh&&(m.fresh.plan||m.fresh.failures)?m.fresh:m,p=batch.plan,result=p?mixturePlan(p,m.fresh===batch?40:30):null,demonstrating=this.mechanismAction?.demo;
   this.amber.scale.y=demonstrating ? .4 :Math.max(.05,(p?.amber??0)/30);this.clearFeed.scale.y=demonstrating ? .6 :Math.max(.05,(p?.clear??0)/30);this.lensFill.visible=!!p;
   this.mixTag.visible=batch.clouded&&result?.reason==='whole';this.lensFill.material=this.mat(batch.done?'#ffd794':batch.clouded?'#8c849e':'#c3c7ca');this.lensFill.scale.y=Math.max(.15,Math.min(1.6,((p?.amber??0)+(p?.clear??0))/30));
  }

  if(!paused&&(this.working>0||this.workLoop)){this.working=Math.max(0,(this.working||0)-dt);this.work.animate(dt,true,this.work.row);}
  this.bridge.visible=s.bridge.done&&!this.sequence;this.bridge.scale.x=s.bridge.cut/3250||1;
  this.failed.visible=!s.bridge.done&&s.bridge.failures>0&&!this.sequence&&s.bridge.cut>0;this.failed.scale.x=Math.min(s.bridge.cut,4800)/2850;this.failed.rotation.z=s.bridge.result==='short'?-.23:0;
  if(s.bridge.result==='long'||s.bridge.result==='offcut'){this.failed.position.set(-4.5,1.38,-.4);this.failed.scale.set(s.bridge.cut/2850,1,.23);}else{this.failed.position.set(0,-.1,0);this.failed.scale.z=1;}this.badTag.visible=!!s.bridge.cut&&s.bridge.result==='offcut'&&!s.bridge.done;
  const stockLength=s.bridge.cut?4800-s.bridge.cut:4800;this.stock.scale.x=stockLength/4800;this.stock.position.x=-6.9+stockLength/2000;
  if(this.sequence&&!this.autoTarget){
   const q=this.sequence;if(!paused)q.t+=dt;
   const carries=q.kind==='success'||q.kind==='short';const carry=carries?Math.max(0,Math.min(1,(q.t-1.7)/1.4)):0;
   this.work.row=q.t<.6?0:q.t<1.7?1:q.t<3.1?2:0;this.work.set(BENCH.x+carry*2.7,BENCH.z*(1-carry));this.work.animate(paused?0:dt,true,this.work.row);
   this.piece.visible=q.t>=3.1&&carries;this.piece.scale.x=q.mm/3250;this.piece.position.set(-4.5+carry*4.5,1.6-carry*.92,0);
   if(q.kind==='short'&&q.t>3)this.piece.position.y-=Math.min(1,(q.t-3)*1.5);
   if(q.t>=4){const position={x:BENCH.x+carry*2.7,z:BENCH.z*(1-carry)};this.onArrival?.(position);this.sequence=null;this.piece.visible=false;this.working=0;}
  }
  this.ending(dt,s,paused);
  this.marker.rotation.z=this.time*.4;this.marker.visible=!s.calibration.done;
  const next=!s.bridge.done?BENCH:!s.water.done?{x:4,z:-.2}:!s.clues.includes('log')?{x:9.5,z:.2}:!s.clues.includes('archive')?{x:5,z:-4}:!s.mix.fresh.done?{x:7,z:-2}:{x:12,z:-.8};this.marker.position.set(next.x,.48,next.z);
  const f=this.focusPoint,chamber=this.view==='chamber',zoom=chamber?1.3:this.view==='north'?.75:1;let goal;
  if(Math.abs(this.camera.zoom-zoom)>.001){this.camera.zoom+=(zoom-this.camera.zoom)*(this.reducedMotion?1:1-Math.exp(-dt*2.5));this.camera.updateProjectionMatrix();}
  // The chamber view frames explorer, rig and sentries: left of an open panel, centred while a pulse plays.
  if(chamber){const H=this.camera.right/zoom,sx=this.panelOpen?4.6+H:10,d=9;goal=new T.Vector3((d+sx)/Math.SQRT2,1.6,(d-sx)/Math.SQRT2);}
  else if(this.view==='north'){const centre=new T.Vector3(21.5,1.2,-13.4),right=new T.Vector3(1,0,-1).normalize(),offset=this.panelOpen?this.camera.right/zoom*.55:0;goal=centre.addScaledVector(right,offset);}
  else goal=new T.Vector3(f?f.x+11:this.focus?6.5:s.position.x*.38,f||this.focus?2.2:1.8,f?f.z-7:this.focus?-6.5:0);
  this.target.lerp(goal,this.reducedMotion?1:1-Math.exp(-dt*(chamber?3:2)));this.cameraSettled=this.target.distanceTo(goal)<.05&&Math.abs(this.camera.zoom-zoom)<.01;
  this.camera.position.copy(this.target).add(new T.Vector3(18,19,18));this.camera.lookAt(this.target);
  this.renderer.render(this.scene,this.camera);const now=performance.now();if(!paused&&now-this.lastFrame>0)this.frames[this.frameCursor++%54000]=now-this.lastFrame;this.lastFrame=now;
 }

 // The ending: the beam sweeps to the route north, the fog thins, lamps mark the road and Gran's lamp mark at its end.
 buildEnding(){
  const ROUTE=[[14.5,-6],[17,-8.6],[19.5,-11.2],[22,-13.8],[24.5,-16.4]];this.routeEnd=new T.Vector3(26.5,1.2,-18.4);
  this.route=new T.Group();const dot=new T.MeshBasicMaterial({color:'#ffe3a8'});for(const [x,z] of ROUTE){const m=new T.Mesh(new T.SphereGeometry(.18,8,6),dot);m.position.set(x,.2,z);this.route.add(m);}
  this.granMark=new T.Mesh(new T.OctahedronGeometry(.55,0),new T.MeshBasicMaterial({color:'#ffb45c'}));this.granMark.position.copy(this.routeEnd);this.route.add(this.granMark);this.route.visible=false;this.scene.add(this.route);
  this.northAngle=Math.atan2(-(this.routeEnd.z+3.3),this.routeEnd.x-12);this.reveal=0;
  this.boatLamp=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshBasicMaterial({color:'#ffd396'}));this.boatLamp.position.set(9,.7,6.2);this.boatLamp.visible=false;this.scene.add(this.boatLamp);
  this.letters=new T.Mesh(new T.BoxGeometry(.35,.25,.08),new T.MeshBasicMaterial({color:'#f3e2c0'}));this.letters.visible=false;this.scene.add(this.letters);
  this.shelterLight=new T.PointLight('#ffbf73',0,7,2);this.shelterLight.position.set(-9,2.2,-3.2);this.scene.add(this.shelterLight);
  this.signalPulse=new T.Mesh(new T.SphereGeometry(.22,8,6),new T.MeshBasicMaterial({color:'#bfe9ff'}));this.signalPulse.visible=false;this.scene.add(this.signalPulse);this.signalT=-1;
  this.fogBase=this.scene.fog.density;this.skyBase=this.scene.background.clone();this.skyClear=new T.Color('#9d97cf');
 }
 // Starts the sweep; revealing is true until it has finished.
 revealNorth(){this.reveal=this.reducedMotion?1:.001;}
 get revealing(){return this.reveal>0&&this.reveal<1;}
 sendSignal(){this.signalT=this.reducedMotion?-1:0;}
 setQuality(q){this.quality=q;const dpr=devicePixelRatio||1;this.renderer.setPixelRatio(q==='light'?1:q==='high'?Math.min(dpr,2):Math.min(dpr,1.5));this.renderer.shadowMap.autoUpdate=q!=='light';this.renderer.shadowMap.needsUpdate=true;this.resize();}
 ending(dt,s,paused){
  const story=s.story??{lens:false},lit=story.lens;if(!paused&&this.revealing)this.reveal=Math.min(1,this.reveal+dt/3);if(lit&&this.reveal===0)this.reveal=1;if(!lit)this.reveal=0;
  const r=this.reveal,ease=r*r*(3-2*r);this.beam.visible=r>0;this.beam.material.opacity=.07+.1*ease;this.beamPivot.rotation.y=this.northAngle*ease;
  this.route.visible=r>.35;this.route.children.forEach((m,i)=>{m.visible=r>.35+i*.1;});this.granMark.rotation.y=this.reducedMotion?0:this.time*.8;
  this.scene.fog.density=this.fogBase*(1-.65*ease);this.scene.background.copy(this.skyBase).lerp(this.skyClear,ease);
  const service=s.water?.plan?.service,ferry=lit&&['ferry','both'].includes(service);this.boatLamp.visible=ferry;
  if(lit){this.iona.set(8.4,2.9);this.letters.visible=!story.log;this.letters.position.set(8.4,1.5,3.1);
   const goal={x:s.position.x-1.1,z:s.position.z-.9},a=this.ambrose.sprite.position,k=paused?0:1-Math.exp(-dt*3);this.ambrose.set(a.x+(goal.x-a.x)*k,a.z+(goal.z-a.z)*k);}
  else{this.iona.set(8,-2);this.ambrose.set(-8.3,-1.5);this.letters.visible=false;}
  this.shelterLight.intensity=s.signal?.done?3.2:0;
  if(this.signalT>=0){if(!paused)this.signalT+=dt/2.4;const t=Math.min(1,this.signalT);this.signalPulse.visible=t<1;this.signalPulse.position.lerpVectors(new T.Vector3(12,7.1,-3.3),this.routeEnd,t);this.signalPulse.position.y+=Math.sin(t*Math.PI)*3;if(t>=1)this.signalT=-1;}else this.signalPulse.visible=false;
 }
 reaction(){this.mechanism('reaction',{x:10,z:1.5});}
 walkToBench(){this.autoTarget={x:BENCH.x,z:BENCH.z};}
 beginCut(mm,kind){this.workLoop=false;this.sequence={mm,kind,t:0};}
 action(row,x=BENCH.x,z=BENCH.z){this.work.row=row;this.work.time=0;this.work.set(x,z);this.working=1.8;}
}
