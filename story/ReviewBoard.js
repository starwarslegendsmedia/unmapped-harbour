import {REVIEW_TASKS,reviewAnchor,reviewDue,reviewDone,taskEvents} from '../math/review.js';
const $=id=>document.getElementById(id);
export class ReviewBoard {
 constructor(api){Object.assign(this,api);this.drafts=new Map();this.reset();const show=this.panel;this.panel=(...args)=>{show(...args);if(this.current)this.setReturn(()=>this.task(this.current));};}
 reset(){this.drafts.clear();this.current=null;}
 async open(){
  this.current=null;
  if(reviewAnchor(this.read())===null&&!await this.commit({type:'review-schedule'}))return;
  const s=this.read(),now=Date.now();
  this.panel('Harbour repair board','<p>Return to these maintenance plans after a delay. They use new quantities and drawings or tables. The harbour stays restored; this is a check of your planning.</p>'+REVIEW_TASKS.map(t=>'<div class="row"><button id="review-'+t.id+'" '+(reviewDone(s,t)||now<reviewDue(s,t)?'disabled':'')+'>'+t.title+' · day '+t.days+'</button><span>'+ (reviewDone(s,t)?'Recorded':now<reviewDue(s,t)?'Opens '+new Date(reviewDue(s,t)).toLocaleDateString():'Ready')+'</span></div>').join('')+'<p class="quiet">Dates use this device’s clock. A completed plan is an observation, not a year-level result.</p>');
  for(const t of REVIEW_TASKS)$('review-'+t.id).onclick=()=>this.task(t);
 }
 givens(t){
  if(t.kind==='bridge')return '<div class="diagram"><span class="bearing">'+t.bearing+' cm</span><span class="span">gap '+t.gap+' cm</span><span class="bearing">'+t.bearing+' cm</span></div>Stock '+t.stock+' cm. Find the minimum span and remaining stock.';
  if(t.kind==='water')return 'Capacity '+t.capacity+' L · gauge '+t.num+'/'+t.den+' · protect '+t.percent+'% of full capacity.<br>Cooling needs ≥'+t.cooling+' L; the repair needs ≥'+t.repair+' L.';
  return '<b>Amber : clear = '+t.amber+' : '+t.clear+'</b> · total '+t.total+' mL.<br>Read the plan as '+(t.amber+t.clear)+' equal parts. Both feeds and the amber share must agree.';
 }
 task(t){
  this.current=t;const draft=this.drafts.get(t.id)??['',''];
  this.numeric(t.title,this.givens(t),t.labels,draft,async values=>{
   const draft={first:values[0],second:values[1]};
   if(t.kind==='bridge'){await this.submit(t,draft);return;}
   const options=t.kind==='water'?[[t.cooling,t.repair],[t.capacity/2,t.repair+12],[t.cooling-4,t.repair]]:null;
   this.panel(t.title+' · connect the plan',t.kind==='water'?'<p>Your content: '+draft.first+' L; reserve: '+draft.second+' L. Which outlet plan meets both needs and protects the reserve?</p><table><tr><th>Plan</th><th>Cooling L</th><th>Repair L</th></tr>'+options.map((v,i)=>'<tr><td>'+String.fromCharCode(65+i)+'</td><td>'+v[0]+'</td><td>'+v[1]+'</td></tr>').join('')+'</table><div class="row">'+options.map((_,i)=>'<button id="connect-'+i+'">Plan '+String.fromCharCode(65+i)+'</button>').join('')+'</div>':'<p>Your feeds: '+draft.first+' mL amber and '+draft.second+' mL clear. Which fraction is amber’s share of the whole?</p><div class="row">'+[t.amber,t.clear,t.amber+t.clear].map((v,i)=>'<button id="connect-'+i+'">'+v+'/'+(t.amber+t.clear)+'</button>').join('')+'</div>',this.givens(t));
   for(let i=0;i<3;i++)this.bindOnce($('connect-'+i),()=>this.submit(t,{...draft,...(t.kind==='water'?{choice:i+1}:{share:[t.amber,t.clear,t.amber+t.clear][i]})}));
  },()=>this.help(t),()=>this.open(),'Check plan',1000);
  this.setReturn(()=>this.task(t));
  for(let i=0;i<2;i++)$('value-'+i).addEventListener('input',()=>{this.drafts.set(t.id,[$('value-0').value,$('value-1').value]);});
 }
 async submit(t,inputs,guided=false){
  if(!await this.commit({type:'review-attempt',task:t.id,...(guided?{guided:true}:{inputs})}))return;
  const e=taskEvents(this.read(),t).at(-1),pass=e.correct===true||e.kind==='guided';
  this.panel(pass?'Maintenance plan recorded':'Revise the maintenance plan','<p>'+(pass?(guided?'The worked plan was recorded as assisted.':e.novel?'Your new plan meets the requirements.':'This revision meets the requirements; the earlier attempt stays in your record.'):'Check '+(!e.actual.quantities?'the two quantities and their units.':'the connection between the quantities and the chosen plan or fraction.')+' The restored harbour is safe.')+'</p><div class="row"><button id="review-back">Repair board</button>'+(!pass?'<button id="review-again">Revise my plan</button><button id="review-worked">Show the worked plan</button>':'')+'</div>');
  $('review-back').onclick=()=>this.open();if(!pass){$('review-again').onclick=()=>this.task(t);this.bindOnce($('review-worked'),()=>this.help(t));}
 }
 async help(t){
  if(!await this.commit({type:'review-help',task:t.id}))return;
  const [a,b]=t.answer,work=t.kind==='bridge'?t.gap+' + '+t.bearing+' + '+t.bearing+' = '+a+' cm. Offcut: '+t.stock+' − '+a+' = '+b+' cm.':t.kind==='water'?t.capacity+' × '+t.num+'/'+t.den+' = '+a+' L. Reserve: '+t.capacity+' × '+t.percent+'/100 = '+b+' L. Plan A leaves '+(a-t.cooling-t.repair)+' L, enough to protect '+b+' L.':t.total+' ÷ '+(t.amber+t.clear)+' = '+t.total/(t.amber+t.clear)+' mL per part. Amber '+a+' mL; clear '+b+' mL. Amber is '+t.amber+'/'+(t.amber+t.clear)+' of the whole.';
  this.panel('Worked maintenance plan','<p>'+work+'</p><p>This plan will be recorded as assisted. The next later visit has different quantities.</p><button id="review-together" class="gold">Record the plan together</button>',this.givens(t));this.bindOnce($('review-together'),()=>this.submit(t,null,true));
 }
}
