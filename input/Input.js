export class Input {
 constructor(action){
  this.keys=new Set();this.pointers=new Map();this.action=action;
  addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select'))return;if(e.target.closest('button,a,[role=button]')&&[' ','Enter'].includes(e.key))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key===' '||e.key==='e'||e.key==='Enter'){if(!e.repeat)action();}else this.keys.add(e.key.toLowerCase());});
  addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  for(const b of document.querySelectorAll('[data-dir]')){
   b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,b.dataset.dir);b.classList.add('held');});
   const release=e=>{this.pointers.delete(e.pointerId);b.classList.remove('held');};
   for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);
  }
  addEventListener('blur',()=>this.clear());document.addEventListener('visibilitychange',()=>this.clear());
 }
 clear(){this.keys.clear();this.pointers.clear();document.querySelectorAll('.held').forEach(n=>n.classList.remove('held'));}
 vector(){const all=new Set([...this.keys,...this.pointers.values()]);let x=0,z=0;
 if(all.has('arrowleft')||all.has('a')||all.has('left'))x--;
 if(all.has('arrowright')||all.has('d')||all.has('right'))x++;
 if(all.has('arrowup')||all.has('w')||all.has('up'))z--;
 if(all.has('arrowdown')||all.has('s')||all.has('down'))z++;
 const d=Math.hypot(x,z)||1;return {x:x/d,z:z/d};}
}
