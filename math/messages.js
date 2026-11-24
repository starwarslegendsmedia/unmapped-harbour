import {exact,integer,need} from './validation.js';
import {reviewAnchor,REVIEW_SCHEDULE} from './review.js';
export const MESSAGE_CONTENT='harbour.messages.1';
export const MESSAGE_TASKS=Object.freeze([
 {id:'messages47-cap6',total:47,capacity:6,title:'The outgoing messages',item:'messages',container:'crates',context:'story'},
 {id:'messages53-cap6',total:53,capacity:6,title:'The next boat’s messages',item:'messages',container:'crates',context:'fresh-immediate'},
 {id:'messages48-cap6',total:48,capacity:6,title:'The last bundle of messages',item:'messages',container:'crates',context:'fresh-exact'},
 {id:'maps38-cap8',total:38,capacity:8,title:'Chart-room map cases',item:'maps',container:'cases',context:'delayed-transfer'}
]);
export const messageInitial=()=>({log:[],dispatches:0,dispatchedAt:null,jammed:null});
export const messageEvents=s=>s.evidence.filter(e=>e.content===MESSAGE_CONTENT);
export const messageDone=(s,id)=>messageEvents(s).some(e=>e.variant===id&&(e.correct===true||e.kind==='guided'));
export const messageDue=(s,id)=>id==='maps38-cap8'?(s.messages.dispatchedAt===null?null:s.messages.dispatchedAt+86400000):reviewAnchor(s);
export function messagePacking(t,n){return Array.from({length:n},(_,i)=>Math.max(0,Math.min(t.capacity,t.total-i*t.capacity)));}
export const messageAnswer=t=>({full:Math.floor(t.total/t.capacity),remainder:t.total%t.capacity,containers:Math.ceil(t.total/t.capacity)});
export function messagePlan(t,p,packing=null){
 if(!exact(p,['full','remainder','containers'])||!Object.values(p).every(n=>integer(n,0,60)))return null;
 const {full:quotient,remainder,containers:minimum}=messageAnswer(t);
 const load=packing??messagePacking(t,p.containers),physical=Array.isArray(load)&&load.length===p.containers&&load.every(n=>integer(n,0,t.capacity));
 const loaded=physical?load.reduce((a,b)=>a+b,0):0,waiting=t.total-loaded;
 const grouping=p.full===quotient,leftover=p.remainder===remainder,space=p.containers*t.capacity>=t.total,smallest=p.containers===minimum;
 const reason=!space?'space':p.containers>minimum?'excess':!grouping?'grouping':!leftover?'remainder':!physical||loaded!==t.total?'packing':'success';
 return {grouping,leftover,space,smallest,capacity:p.containers*t.capacity,packing:load,loaded,waiting,conserved:physical&&loaded+waiting===t.total&&waiting>=0,correct:reason==='success',reason};
}
export function recordMessage(s,a){
 const t=MESSAGE_TASKS.find(t=>t.id===a.variant),m=s.messages,due=t&&messageDue(s,t.id);
 if(!s.story.rested||!t||due===null||!integer(a.at,due,1e15)||a.at<(m.log.at(-1)?.at??0)||messageDone(s,t.id))return false;
 if(t.context!=='story'&&!m.dispatches)return false;
 if(a.type==='message-recover'){
  if(m.jammed!==t.id)return false;m.jammed=null;m.log.push({id:a.id,at:a.at,type:a.type,variant:t.id});return true;
 }
 if(m.jammed!==null)return false;
 const events=messageEvents(s),prior=events.filter(e=>e.variant===t.id),base={id:a.id,at:a.at,content:MESSAGE_CONTENT,variant:t.id};
 if(a.type==='message-help'){
  if(!['example','shown-step','worked-route'].includes(a.exposure))return false;
  m.log.push({id:a.id,at:a.at,type:a.type,variant:t.id,exposure:a.exposure});
  s.evidence.push({...base,kind:'help',support:'assisted',exposure:a.exposure});return true;
 }
 if(a.type!=='message-attempt')return false;
 const guided=a.guided===true;
 if(guided&&!prior.some(e=>e.kind==='help'&&e.exposure==='worked-route'))return false;
 const inputs=guided?messageAnswer(t):a.inputs;
 const actual=messagePlan(t,inputs);if(!actual)return false;
 const demonstrations=events.filter(e=>e.kind==='help').map(e=>e.id),feedback=events.filter(e=>e.correct===false).map(e=>e.id);
 m.log.push({id:a.id,at:a.at,type:a.type,variant:t.id,...(guided?{guided:true}:{inputs:{...inputs}})});
 s.evidence.push({...base,kind:guided?'guided':'observed',context:t.context,support:guided||demonstrations.length||feedback.length?'assisted':'independent',correct:guided?null:actual.correct,...(guided?{}:{inputs:{...inputs}}),actual,priorDemonstrations:demonstrations,priorFeedback:feedback,previousExposure:prior.map(e=>e.id),novel:!prior.length,attempt:prior.filter(e=>e.kind!=='help').length+1,outcomes:['MA3-MR-01','MAO-WM-01']});
 if(!actual.correct)m.jammed=t.id;
 else if(t.context==='story'){m.dispatches=1;m.dispatchedAt=a.at;}
 return true;
}
export function validateMessages(s){
 need(exact(s.messages,['log','dispatches','dispatchedAt','jammed'])&&Array.isArray(s.messages.log)&&s.messages.log.length<=10000,'messages fields');
 const replay={...s,messages:messageInitial(),evidence:s.evidence.filter(e=>e.content!==MESSAGE_CONTENT)},ids=new Set();
 const occupied=new Set(replay.evidence.map(e=>e.id));
 const positions=new Map(s.ids.map((id,i)=>[id,i]));let previous=positions.get(s.evidence.find(e=>e.content===REVIEW_SCHEDULE)?.id)??-1;
 for(const a of s.messages.log){
  const keys=['id','at','type','variant',...(a.type==='message-help'?['exposure']:a.type==='message-attempt'?a.guided===true?['guided']:['inputs']:[])];
  const position=positions.get(a.id)??-1;
  need(exact(a,keys)&&position>previous&&!occupied.has(a.id)&&!ids.has(a.id),'messages log identity/order');ids.add(a.id);previous=position;
  need(recordMessage(replay,a),'messages log order');
 }
 need(JSON.stringify(replay.messages)===JSON.stringify(s.messages),'messages state replay');
 need(JSON.stringify(messageEvents(replay))===JSON.stringify(messageEvents(s)),'messages evidence replay');
 return s;
}
