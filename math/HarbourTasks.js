import {quantity,needsOffer,mixturePlan,WATER,MIXTURE} from './encounters.js';
const $=id=>document.getElementById(id);
const waterGivens='<div class="water-route" aria-label="Water goes from the small round tank through pipes to the big lighthouse"><b>Round water tank<br>80 L when full · ¾ full</b><span aria-hidden="true">→</span><b>Big lighthouse<br>Needs at least 24 L</b></div><p>Emergency water: <b>25% of 80 L</b>.<br>Each extra repair: <b>at least 12 L</b>.</p>';
const waterGoal='<p class="task-purpose">Send water from the small round tank to cool the big lighthouse. Keep emergency water in the tank.</p>';
const mixGivens=total=>'Amber : clear = <b>2 : 3</b> · required total <b>'+total+' mL</b><br>Feed cylinders have 1 mL graduations.';
export class HarbourTasks {
 constructor(api){Object.assign(this,api);const show=this.panel;this.panel=(...args)=>{show(...args);this.world.focusPoint={...(this.focusPoint??{x:4,z:-.2})};};this.reset();}
 reset(){this.waterDraft={current:'',reserve:'',service:'archive',beacon:'',helper:''};this.mixDraft={amber:'',clear:'',fraction:'2/5'};}
 numeric(title,givens,labels,values,submit,help,back,submitLabel='Commit',max=80){
  this.panel(title,'<form id="task-form"><div class="work-grid"><div class="number-fields">'+labels.map((label,i)=>'<label for="value-'+i+'">'+label+'</label><div class="field"><input data-number id="value-'+i+'" inputmode="decimal" autocomplete="off" aria-label="'+label+'"></div>').join('')+'</div></div><p id="answer-message" class="quiet" role="status"></p></form>',givens,givens.includes('water-route')?'YOUR WATER PLAN':'PLAN FIRST; COMMIT WHEN READY');
  $('panel-body').className='mechanism';$('panel-footer').hidden=false;$('panel-footer').innerHTML='<button type="submit" form="task-form" class="gold">'+submitLabel+'</button>'+(help?'<button id="task-help">Help</button>':'')+(back?'<button id="task-back">Back</button>':'');
  const replay=$('teaching-replay');if(replay)$('panel-footer').append(replay);this.keypad();values.forEach((v,i)=>$('value-'+i).value=v);if(help)this.bindOnce($('task-help'),help);if(back)$('task-back').onclick=back;
  let busy=false;$('task-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const text=labels.map((_,i)=>$('value-'+i).value),numbers=text.map(t=>quantity(t,max));if(numbers.some(n=>n===null)){$('answer-message').textContent='Enter a whole number from 0 to '+max+'. Editing is free.';return;}busy=true;$('panel-footer').querySelector('[type=submit]').disabled=true;try{await submit(numbers,text);}finally{busy=false;const b=$('panel-footer').querySelector('[type=submit]');if(b)b.disabled=false;}};
 }
 async water(explained=false,step='current'){
  this.focusPoint={x:4,z:-.2};
  const w=this.read().water;
  if(!explained&&!w.done&&!w.spill){this.intro.show('water',()=>this.water(true),waterGivens,this.panel);return;}
  if(w.done){this.panel('Water has reached the lighthouse','<p>The pipes have sent water from the small round tank to the big lighthouse and the '+(w.plan.service==='archive'?'letter room door':'boat lift')+'. <b>'+w.volume+' L</b> remain in the tank, including the 20 L kept for emergencies.</p><p>Next, read the keeper’s notebook on the low table near the lighthouse, then visit the letter room and talk to Iona beside the mixing table.</p>',waterGivens);return;}
  if(w.spill){this.panel('Return the spilled water','<p>'+this.waterFeedback(w.plan)+' The pump stopped and <b>4 L</b> ran into the small basin beside the tank.</p><p>Press Return the 4 L to pump it back into the tank. Then change your plan.</p><button id="recover-water" class="gold">Return the 4 L</button>',waterGivens);this.bindOnce($('recover-water'),async()=>{if(!await this.commit({type:'recover-water'}))return;this.close();this.world.mechanism('valve',{x:4,z:-.2});this.tell('The 4 L are back in the tank. Inspect Water tank to try again.');});return;}
  if(w.failures>=2&&needsOffer(this.read(),'water')){await this.waterHelp('shown-step');return;}
  const d=this.waterDraft;
  if(step==='reserve'){
   this.numeric('Keep emergency water',waterGivens,['How much water must stay in the tank? (L)'],[d.reserve],async(n,t)=>{d.reserve=t[0];this.chooseService();},()=>this.waterHelp(),()=>this.water(true),'Choose an extra repair',80);
  }else{
   this.numeric('Read the water tank',waterGivens,['How much water is in the tank now? (L)'],[d.current],async(n,t)=>{d.current=t[0];this.water(true,'reserve');},()=>this.waterHelp(),null,'Next: emergency water',80);
  }
 }
 chooseService(){
  this.panel('Choose an extra repair',waterGoal+waterGivens+'<p>We also want water to run one of these repairs. Can your plan supply both? Keep enough for the lighthouse and emergencies.</p><p><b>Letter room door:</b> water powers the door so Iona can take the dry letters to the boats.</p><p><b>Boat lift:</b> water powers the platform that raises the boat crew’s cargo.</p><div class="row"><button id="archive-choice">Letter room door</button><button id="ferry-choice">Boat lift</button><button id="both-choice">Both repairs</button></div><button id="water-back-reserve">Back to emergency water</button>');
  for(const [id,service] of [['archive-choice','archive'],['ferry-choice','ferry'],['both-choice','both']])$(id).onclick=()=>{this.waterDraft.service=service;this.serviceChosen=true;this.outlets();};
  $('water-back-reserve').onclick=()=>this.water(true,'reserve');
 }
 outlets(step='lighthouse'){
  const d=this.waterDraft,name=d.service==='archive'?'letter room door':d.service==='ferry'?'boat lift':'each repair';
  const draft='<p class="water-draft">Your plan: tank <b>'+d.current+' L</b>; emergencies <b>'+d.reserve+' L</b>.'+(step==='repair'?'<br>Lighthouse: <b>'+d.beacon+' L</b>.':'')+'<br>Repair: '+name+'.</p>';
  if(step==='lighthouse'){
   this.numeric('Send water to the lighthouse',waterGivens+draft,['How much goes to the lighthouse? (L)'],[d.beacon],async(n,t)=>{d.beacon=t[0];this.outlets('repair');},()=>this.waterHelp(),()=>this.chooseService(),'Next: water for the repair',80);
  }else{
   this.numeric('Send water to '+(d.service==='both'?name:'the '+name),waterGivens+draft,[d.service==='both'?'How much goes to each repair? (L)':'How much goes to this repair? (L)'],[d.helper],async(n,t)=>{d.helper=t[0];const inputs={current:quantity(d.current),reserve:quantity(d.reserve),beacon:quantity(d.beacon),helper:n[0],service:d.service};if(!await this.commit({type:'allocate',inputs}))return;this.close();this.world.mechanism('valve',{x:4,z:-.2});this.tell(this.read().water.done?'Water reaches the lighthouse and your chosen repair. Next: the keeper’s notebook near the lighthouse.':'The pump stopped. Inspect Water tank to return the spilled 4 L, then try again.');},()=>this.waterHelp(),()=>this.outlets(),'Send the water',80);
  }
 }
 waterFeedback(p){if(p.current!==60)return 'Recheck what ¾ of the full 80 L means.';if(p.reserve!==20)return 'Emergency water is 25% of the full 80 L, rather than the amount inside now.';if(p.beacon<24)return 'The lighthouse needs at least 24 L of water to cool the light inside it.';if(p.helper<12)return 'The repair needs at least 12 L of water to work.';return 'Sending that much to the lighthouse and repairs would leave too little emergency water in the tank.';}
 async waterHelp(exposure='example'){
  if(!await this.commit({type:'help',task:'water',exposure}))return;
  const repeated=this.read().water.failures>=2;
  const example='<p>A different tank has capacity 40 L and is half full: <b>40 × ½ = 20 L</b> in it.</p><p>A reserve of 25% of its capacity is <b>40 ÷ 4 = 10 L</b>. It is not 25% of the 20 L currently inside.</p><p>For this tank, divide 80 L into four equal parts. Three parts are inside now; one must stay for emergencies. Subtract the water sent to the lighthouse and repair from the water inside.</p><button id="water-return" class="gold">Try my plan</button>';
  const step='<p>The reserve uses the full <b>80 L</b>. Find one quarter: <b>80 ÷ 4 = □ L</b>.</p><p>The tank contains three of these equal parts: <b>3 × □ L</b>. Keep one part in the tank. Subtract the water for the lighthouse and repair from the water inside, then compare what remains with your reserve.</p><button id="water-return" class="gold">Try my plan</button>';
  this.panel('Which whole does the fraction use?',(exposure==='shown-step'?step:example)+(repeated?'<button id="water-guided">Finish together</button>':''),waterGivens);
  $('water-return').onclick=()=>this.water(true);if(repeated)this.bindOnce($('water-guided'),()=>this.guideWater());
 }
 async guideWater(choice=null){if(this.guidingWater)return;this.guidingWater=true;try{await this.showWaterGuide(choice);}finally{this.guidingWater=false;}}
 async showWaterGuide(choice=null){
  const last=this.read().water.plan?.service,service=choice??(this.serviceChosen?this.waterDraft.service:last??this.waterDraft.service);
  if(service==='both'){this.panel('Choose one extra repair','<p>The lighthouse and emergency water leave enough for one extra repair. Which one shall we work through together?</p><div class="row"><button id="guide-archive">Letter room door</button><button id="guide-ferry">Boat lift</button></div>',waterGivens);this.bindOnce($('guide-archive'),()=>this.guideWater('archive'));this.bindOnce($('guide-ferry'),()=>this.guideWater('ferry'));return;}
  if(!await this.commit({type:'help',task:'water',exposure:'worked-route'}))return;
  this.panel('A protected quarter','<p>Content: 80 × ¾ = <b>60 L</b>. Reserve: 80 × ¼ = <b>20 L</b>.</p><p>After cooling: 60 − 24 = 36 L. One repair uses 12 L, leaving <b>24 L</b>. That is 4 L above the reserve.</p><p>We will send water to the lighthouse and the '+(service==='archive'?'letter room door':'boat lift')+' together.</p><button id="water-together" class="gold">Apply the plan together</button>',waterGivens);
  this.bindOnce($('water-together'),async()=>{if(!await this.commit({type:'allocate',inputs:{current:60,reserve:20,beacon:24,helper:12,service},guided:true}))return;this.close();this.world.mechanism('valve',{x:4,z:-.2});this.tell('The lighthouse and '+(service==='archive'?'letter room door':'boat lift')+' now have water.');});
 }
 async mixture(explained=false){this.focusPoint={x:7,z:-1.5};if(!explained&&this.read().water.done&&!(this.read().mix.done&&this.read().mix.fresh.done)&&!(this.read().mix.done?this.read().mix.fresh:this.read().mix).clouded){this.intro.show('mixture',()=>this.mixture(true),mixGivens(this.read().mix.done?40:30),this.panel);return;}if(this.openingMix)return;this.openingMix=true;try{await this.showMixture();}finally{this.openingMix=false;}}
 async showMixture(){
  this.focusPoint={x:7,z:-1.5};
  const s=this.read(),fresh=s.mix.done&&!s.mix.fresh.done;if(fresh!==this.fresh)this.mixDraft={amber:'',clear:'',fraction:'2/5'};this.fresh=fresh;this.total=this.fresh?MIXTURE.freshTotal:MIXTURE.total;const batch=this.fresh?s.mix.fresh:s.mix;if(!s.water.done){this.panel('A dry workshop','<p>The lens needs cooling water before Iona can open its mixing chamber. Follow the copper pipe.</p>');return;}
  if(s.mix.done&&s.mix.fresh.done){this.panel('A steady lens','<p>The five-part mixture shines without flickering. The lens stair is open. Inspect Lighthouse.</p>');return;}
  if(batch.clouded){this.panel(mixturePlan(batch.plan,this.total).reason==='whole'?'A label that will not seat':'A clouded capsule','<p>'+this.mixFeedback(batch.plan)+' The prepared capsule is held at the separator.</p><p>The separator can reclaim the ingredients once, then you can revise the amounts.</p><button id="reclaim-mixture" class="gold">Reclaim ingredients</button>',mixGivens(this.total??30));this.bindOnce($('reclaim-mixture'),async()=>{if(!await this.commit({type:this.fresh?'reclaim-fresh':'reclaim'}))return;this.close();this.world.mechanism('pour',{x:7,z:-1.5});this.tell('The separator clears. Prepare a fresh capsule.');});return;}
  if(!s.help.mixture){if(!await this.commit({type:'help',task:'mixture',exposure:'example'}))return;this.world.mechanism('pour',{x:7,z:-1.5},true);this.panel('Iona’s five-part sample','<p>“Two amber parts for every three clear parts. <b>Five equal parts altogether.</b>”</p><div class="parts"><b>2</b><b>2</b><i>2</i><i>2</i><i>2</i></div><p>In this 10 mL sample, each part is 2 mL: <b>4 mL amber + 6 mL clear</b>. Amber is <b>2/5 of the whole</b>; 2:3 compares amber with clear.</p><button id="start-mixture" class="gold">Prepare the 30 mL capsule</button>',mixGivens(this.total??30));$('start-mixture').onclick=()=>this.chooseFraction();return;}
  if(batch.failures>=2&&needsOffer(s,'mixture',this.fresh)){await this.mixHelp();return;}
  this.chooseFraction();
 }
 chooseFraction(){
  this.panel('Amber share · '+(this.total??30)+' mL','<p>The maintenance glyph means “two amber parts for three clear parts”. Which fraction describes amber as part of the <b>whole mixture</b>?</p><div class="row"><button id="fraction-2-5">2/5 of the whole</button><button id="fraction-2-3">2/3 of the whole</button><button id="fraction-3-5">3/5 of the whole</button></div><p class="quiet">This is a draft. Nothing is mixed until you commit the two feed amounts.</p>',mixGivens(this.total??30));
  for(const f of ['2/5','2/3','3/5'])$('fraction-'+f.replace('/','-')).onclick=()=>{this.mixDraft.fraction=f;this.feeds();};
 }
 feeds(){
  const d=this.mixDraft;this.numeric('Lens feeds · amber '+d.fraction,mixGivens(this.total??30),['Amber feed (mL)','Clear feed (mL)'],[d.amber,d.clear],async(n,t)=>{[d.amber,d.clear]=t;if(!await this.commit({type:this.fresh?'mix-fresh':'mix',inputs:{amber:n[0],clear:n[1],fraction:d.fraction}}))return;this.close();this.world.mechanism('pour',{x:7,z:-1.5});this.tell((this.fresh?this.read().mix.fresh:this.read().mix).done?(this.fresh?'The fresh capsule steadies the northern lens.':'The lens shines. Prepare a new 40 mL spare with Iona.'):mixturePlan((this.fresh?this.read().mix.fresh:this.read().mix).plan,this.total).reason==='whole'?'The fraction label will not seat. Inspect the separator.':'The capsule clouds. Inspect Iona’s separator to reclaim it.');},()=>this.mixHelp(),()=>this.chooseFraction(),'Mix capsule');
 }
 mixFeedback(p){if(p.amber+p.clear!==this.total)return 'The capsule needs a '+this.total+' mL total, even when the ratio is right.';if(3*p.amber!==2*p.clear)return 'The amounts do not keep two amber parts for every three clear parts.';return 'The feed amounts fit, but the whole has five parts. Recheck the fraction label before the capsule can be seated.';}
 async mixHelp(){
  if(!await this.commit({type:'help',task:'mixture',exposure:'shown-step'}))return;
  const repeated=(this.fresh?this.read().mix.fresh:this.read().mix).failures>=2;
  this.panel('One part at a time','<div class="parts"><b>?</b><b>?</b><i>?</i><i>?</i><i>?</i></div><p>There are <b>2 + 3 = 5</b> equal parts. Find one part with <b>'+this.total+' ÷ 5</b>. Use two of those parts for amber and three for clear. Then check the two amounts add to '+this.total+'.</p><button id="mix-return" class="gold">Complete the missing step</button>'+(repeated?'<button id="mix-guided">Finish together</button>':''),mixGivens(this.total??30));$('mix-return').onclick=()=>this.chooseFraction();if(repeated)this.bindOnce($('mix-guided'),()=>this.guideMix());
 }
 async guideMix(){
  if(!await this.commit({type:'help',task:'mixture',exposure:'worked-route'}))return;
  const part=this.total/5,amber=part*2,clear=part*3;
  this.panel('A complete lens capsule','<p>'+this.total+' ÷ 5 = <b>'+part+' mL</b> per part. Amber: 2 × '+part+' = <b>'+amber+' mL</b>. Clear: 3 × '+part+' = <b>'+clear+' mL</b>.</p><p>'+amber+' + '+clear+' = '+this.total+'; amber is 2/5 of the whole. We will pour this one together.</p><button id="mix-together" class="gold">Pour together</button>',mixGivens(this.total??30));this.bindOnce($('mix-together'),async()=>{if(!await this.commit({type:this.fresh?'mix-fresh':'mix',inputs:{amber,clear,fraction:'2/5'},guided:true}))return;this.close();this.world.mechanism('pour',{x:7,z:-1.5});this.tell('The guided capsule is ready. Keep testing the ratio on a fresh amount.');});
 }
}
