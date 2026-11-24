import {MESSAGE_TASKS,messageDone,messageDue,messageEvents,messageAnswer} from '../math/messages.js';
import {reviewAnchor} from '../math/review.js';
const $=id=>document.getElementById(id);
export class Messages{
 constructor(api){Object.assign(this,api);this.drafts=new Map();this.current=null;}
 reset(){this.drafts.clear();this.current=null;this.stageIndex=-1;}
 resume(){const t=this.current;if(!t)return this.open();if(this.read().messages.jammed||messageDone(this.read(),t.id))this.result(t);else if(this.stageIndex>=0)this.stage(t,this.stageIndex);else this.introduction(t);}
 show(title,body,givens='',voice=null){
  this.panel(title,body,givens,'THE PACKING TABLE');this.world.focusPoint={x:8,z:1.2};
  $('panel-body').className='mechanism messages-panel';
  this.setReturn(this.current?()=>this.resume():null);
  this.replay=null;
  if(voice){const b=document.createElement('button');b.id='message-replay';b.textContent='Hear again';b.onclick=()=>{this.audio.unlock();this.audio.say([voice]);};this.replay=b;this.audio.say([voice]);}
 }
 givens(t,d=null){return '<b>'+t.total+' '+t.item+'</b> · at most <b>'+t.capacity+' per '+(t.container==='crates'?'crate':'case')+'</b><div class="empty-crate" aria-label="One empty container with '+t.capacity+' slots">'+Array.from({length:t.capacity},()=>'<i>□</i>').join('')+'</div>'+(d?'<div>Your draft: '+(d.full||'—')+' full · '+(d.remainder||'—')+' left</div>':'');}
 async open(){
  this.current=null;if(!this.read().story.rested)return;
  if(reviewAnchor(this.read())===null&&!await this.commit({type:'review-schedule'}))return;
  const s=this.read();
  if(s.messages.jammed){this.current=MESSAGE_TASKS.find(t=>t.id===s.messages.jammed);this.result(this.current);return;}
  this.show('The packing table','<p>Iona has brought the archive’s outgoing messages to the wharf. Each plan must send every item in the smallest number of containers.</p><div class="message-jobs">'+MESSAGE_TASKS.map(t=>{
   const done=messageDone(s,t.id),due=messageDue(s,t.id),locked=t.context!=='story'&&!s.messages.dispatches||due===null||Date.now()<due;
   return '<button id="message-job-'+t.id+'" '+(done||locked?'disabled':'')+'>'+t.title+' · '+(done?'Recorded':locked?(t.context==='delayed-transfer'&&due!==null?'Opens '+new Date(due).toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'}):'After the outgoing boat'):'Ready')+'</button>';
  }).join('')+'</div><p class="quiet">The map cases open at least one day after dispatch, using this device’s clock. These are task observations.</p><button id="message-leave">Return to the shelter</button>');
  for(const t of MESSAGE_TASKS)$('message-job-'+t.id).onclick=()=>this.introduction(t);
  $('message-leave').onclick=()=>this.back();
 }
 introduction(t){
  this.current=t;this.stageIndex=-1;
  const maps=t.item==='maps';
  this.show(t.title,'<p>'+ (maps?'Protect every map in the chart room.':'Send every message from the archive aboard the waiting boat.')+'</p><p>A full '+(maps?'case':'crate')+' has '+t.capacity+' items and no empty slots. Capacity is the most it holds. A remainder is what is left after filling the full '+t.container+'.</p><p>Plan one quantity at a time. Nothing is loaded while you edit.</p>',this.givens(t),maps?'maps-goal':'messages-goal');
  this.footer('<button id="message-start" class="gold">Plan the full '+t.container+'</button><button id="message-help">Show a different example</button>');
  $('message-start').onclick=()=>this.stage(t,0);this.bindOnce($('message-help'),()=>this.help(t,'example'));
 }
 footer(html){const footer=$('panel-footer');footer.hidden=false;footer.innerHTML=html;if(this.replay)footer.append(this.replay);}
 stage(t,index){
  this.current=t;this.stageIndex=index;const d=this.drafts.get(t.id)??{full:'',remainder:'',containers:'',parsed:{}};this.drafts.set(t.id,d);
  const keys=['full','remainder','containers'],labels=['Full '+t.container+' we can fill',t.item+' left after the full '+t.container,'Smallest total '+t.container+' to send every item'];
  this.numeric(['Fill the full '+t.container,'Keep the remainder','Load every item'][index],this.givens(t,index?d:null),[labels[index]],[d[keys[index]]],async(n,text)=>{
   d[keys[index]]=text[0];d.parsed[keys[index]]=n[0];if(index<2){this.stage(t,index+1);return;}
   const controls=[...$('panel-footer').querySelectorAll('button')];controls.forEach(b=>b.disabled=true);
   try{await this.submit(t,{...d.parsed});}finally{controls.forEach(b=>{if(b.isConnected)b.disabled=false;});}
  },()=>this.help(t,'example'),()=>index?this.stage(t,index-1):this.introduction(t),index===2?'Commit loading plan':'Keep this draft',60);
  this.setReturn(()=>this.resume());this.world.focusPoint={x:8,z:1.2};$('value-0').addEventListener('input',()=>d[keys[index]]=$('value-0')?.value??d[keys[index]]);
 }
 async submit(t,inputs,guided=false){
  if(!await this.commit({type:'message-attempt',variant:t.id,...(guided?{guided:true}:{inputs})}))return;
  this.result(t);
 }
 loadHTML(t,a){return '<div class="crate-loads" aria-label="Committed load">'+a.packing.map((n,i)=>'<span class="loaded-crate">'+(i+1)+': '+n+'/'+t.capacity+'</span>').join('')+'</div><p>'+a.loaded+' on the rail + '+a.waiting+' waiting = '+t.total+' '+t.item+'.</p>';}
 result(t){
  const s=this.read(),e=messageEvents(s).findLast(e=>e.variant===t.id&&e.kind!=='help');if(!e)return;
  const a=e.actual,success=a.correct;
  const reasons={space:'Your proposed containers hold at most '+a.capacity+' items. Some still have no place.',excess:'That many containers can hold everything, but the task asks for the smallest total.',grouping:'The full-container count does not match the total and capacity.',remainder:'The leftover count does not match the full groups.',packing:'The load does not conserve every item within capacity.'};
  this.show(success?'A place for every '+(t.item==='maps'?'map':'message'):'The loading rail is held',this.loadHTML(t,a)+'<p>'+(success?(e.kind==='guided'?'This worked plan was completed together.':e.support==='assisted'?'Your plan fits after teaching or feedback.':'Your plan fits without method help on this task.'):(reasons[a.reason]+' Every item stays here; nothing was sent.'))+'</p>'+(success?'<p>'+(t.context==='story'?'The outgoing boat is loaded once. The harbour’s messages are on their way.':'This packing plan is recorded. The story dispatch stays unchanged.')+'</p>':'<p>Unload the rail once to return all '+t.total+' '+t.item+' to the table.</p>'),this.givens(t),success?'messages-done':'messages-jam');
  this.footer(success?'<button id="message-board" class="gold">Packing table</button><button id="message-watch">See the wharf</button>':'<button id="message-unload" class="gold">Unload the rail</button>');
  if(success){$('message-board').onclick=()=>this.open();$('message-watch').onclick=()=>{this.close();this.world.mechanism('pack',{x:8,z:1.2});};}
  else this.bindOnce($('message-unload'),async()=>{if(!await this.commit({type:'message-recover',variant:t.id}))return;const failures=messageEvents(this.read()).filter(e=>e.variant===t.id&&e.correct===false).length;if(failures>=2)this.offer(t);else this.stage(t,0);});
 }
 offer(t){
  this.show('A step for this load','<p>The rail is clear. A shown step or a complete worked plan is ready if you want it.</p>',this.givens(t));
  this.footer('<button id="message-try" class="gold">Revise my plan</button><button id="message-step">Show one step</button><button id="message-guide">Finish together</button>');
  $('message-try').onclick=()=>this.stage(t,0);this.bindOnce($('message-step'),()=>this.help(t,'shown-step'));this.bindOnce($('message-guide'),()=>this.help(t,'worked-route'));
 }
 async help(t,exposure){
  if(!await this.commit({type:'message-help',variant:t.id,exposure}))return;
  const {full:q,remainder:r,containers:n}=messageAnswer(t);
  const example='<p>A different bundle: <b>20 messages, at most 6 per crate</b>.</p><div class="crate-loads"><span class="loaded-crate">6</span><span class="loaded-crate">6</span><span class="loaded-crate">6</span><span class="loaded-crate">2</span></div><p>3 × 6 = 18; 20 − 18 = 2. Three full crates and two messages left need <b>4 crates</b>. Check: 3 × 6 + 2 = 20.</p>';
  const step='<p>Multiply your full groups by '+t.capacity+'. Subtract that amount from '+t.total+' to find the remainder. It must be smaller than '+t.capacity+'. Anything left needs room too. If nothing remains, do not add a container.</p>';
  const worked='<p>'+q+' × '+t.capacity+' = '+(q*t.capacity)+'. '+t.total+' − '+(q*t.capacity)+' = '+r+' left.</p><p>'+q+' full '+t.container+(r?' and one partly filled container':' with no extra container')+' need <b>'+n+' '+t.container+'</b>. Check: '+q+' × '+t.capacity+' + '+r+' = '+t.total+'.</p>';
  this.show(exposure==='example'?'A different bundle':exposure==='shown-step'?'One packing step':'Pack this load together',(exposure==='example'?example:exposure==='shown-step'?step:worked)+'<p class="quiet">Method help stays in the record for later packing checks.</p>',this.givens(t),exposure==='example'?'messages-example':exposure==='shown-step'?'messages-step':'messages-work-'+t.total);
  this.footer(exposure==='worked-route'?'<button id="message-together" class="gold">Load together</button><button id="message-return">Try my plan</button>':'<button id="message-return" class="gold">Plan this load</button><button id="message-guide">Finish together</button>');
  $('message-return').onclick=()=>this.stage(t,0);
  if(exposure==='worked-route')this.bindOnce($('message-together'),()=>this.submit(t,null,true));else this.bindOnce($('message-guide'),()=>this.help(t,'worked-route'));
 }
}
