import {exact,integer,need} from './validation.js';

const DAY=86400000;
export const REVIEW_SCHEDULE='harbour.review.schedule.1';
export const REVIEW_PREFIX='harbour.review.';
// Nine authored maintenance plans, in conventional drawings/tables, at 1, 3 and 7 days.
// The clock is local device time. These are observations on tasks, never mastery awards.
const bridges=[[310,15,520],[275,25,460],[385,20,600]];
const tanks=[[100,4,5,30,28,12],[120,3,4,25,30,12],[160,3,4,25,40,24]];
const mixtures=[[3,2,35],[1,3,48],[3,5,64]];
export const REVIEW_TASKS=[1,3,7].flatMap((days,i)=>{
 const [gap,bearing,stock]=bridges[i],[capacity,num,den,percent,cooling,repair]=tanks[i],[amber,clear,total]=mixtures[i];
 return [
  {id:'bridge-'+i,content:REVIEW_PREFIX+'bridge',variant:'drawing-'+i,days,title:'Crossing maintenance',kind:'bridge',gap,bearing,stock,labels:['Minimum span (cm)','Offcut (cm)'],answer:[gap+2*bearing,stock-gap-2*bearing],outcomes:['MA3-GM-02','MA3-AR-01','MA3-RN-02']},
  {id:'water-'+i,content:REVIEW_PREFIX+'water',variant:'table-'+i,days,title:'Reservoir maintenance',kind:'water',capacity,num,den,percent,cooling,repair,labels:['Current content (L)','Protected reserve (L)'],answer:[capacity*num/den,capacity*percent/100],outcomes:['MA3-RQF-02','MA3-RN-03','MA3-AR-01']},
  {id:'mixture-'+i,content:REVIEW_PREFIX+'mixture',variant:'parts-'+i,days,title:'Lens maintenance',kind:'mixture',amber,clear,total,labels:['Amber feed (mL)','Clear feed (mL)'],answer:[total*amber/(amber+clear),total*clear/(amber+clear)],outcomes:['MA4-RAT-C-01','MA3-MR-01']}
 ];
});
export const reviewEvents=s=>s.evidence.filter(e=>e?.content?.startsWith(REVIEW_PREFIX));
export const reviewAnchor=s=>s.evidence.find(e=>e.content===REVIEW_SCHEDULE)?.at??null;
export const taskEvents=(s,t)=>s.evidence.filter(e=>e.content===t.content&&e.variant===t.variant);
export const reviewDone=(s,t)=>taskEvents(s,t).some(e=>e.kind==='guided'||e.correct===true);
export const reviewDue=(s,t)=>reviewAnchor(s)===null?null:reviewAnchor(s)+t.days*DAY;
export function reviewResult(t,p){
 const keys=t.kind==='water'?['first','second','choice']:t.kind==='mixture'?['first','second','share']:['first','second'];
 if(!exact(p,keys)||!integer(p.first,0,1000)||!integer(p.second,0,1000)||t.kind==='water'&&!integer(p.choice,1,3)||t.kind==='mixture'&&!integer(p.share,0,64))return null;
 const quantities=p.first===t.answer[0]&&p.second===t.answer[1];
 const connection=t.kind==='water'?p.choice===1:t.kind==='mixture'?p.share===t.amber:true;
 return {quantities,connection,correct:quantities&&connection};
}
export function reviewAnswer(t){return {first:t.answer[0],second:t.answer[1],...(t.kind==='water'?{choice:1}:t.kind==='mixture'?{share:t.amber}:{})};}
export function scheduleReview(s,a){
 if(!s.story.rested||reviewAnchor(s)!==null||!integer(a.at,0,1e15))return false;
 const signal=s.evidence.findLast(e=>e.content==='harbour.signal.1'&&e.kind!=='help');
 if(signal?.at!==null&&signal?.at>a.at)return false;
 s.evidence.push({id:a.id,at:a.at,content:REVIEW_SCHEDULE,kind:'schedule'});return true;
}
export function recordReview(s,a){
 const t=REVIEW_TASKS.find(t=>t.id===a.task),due=t&&reviewDue(s,t);
 if(!s.story.rested||!t||due===null||!integer(a.at,due,1e15)||reviewDone(s,t))return false;
 const prior=taskEvents(s,t),help=prior.filter(e=>e.kind==='help').map(e=>e.id);
 const last=reviewEvents(s).at(-1);if(last&&a.at<last.at)return false;
 const base={id:a.id,at:a.at,content:t.content,variant:t.variant};
 if(a.type==='review-help'){s.evidence.push({...base,kind:'help',support:'assisted',exposure:'worked-route'});return true;}
 const guided=a.guided===true;if(guided&&!help.length)return false;
 const inputs=guided?reviewAnswer(t):a.inputs,result=reviewResult(t,inputs);if(!result)return false;
 s.evidence.push({...base,kind:guided?'guided':'observed',context:'delayed-transfer',support:guided||help.length?'assisted':'independent',correct:guided?null:result.correct,...(guided?{}:{inputs:{...inputs}}),actual:result,priorDemonstrations:help,novel:prior.every(e=>e.kind==='help')&&!help.length,outcomes:[...t.outcomes],attempt:prior.filter(e=>e.kind!=='help').length+1});return true;
}
export function validateReview(s){
 const events=reviewEvents(s);if(!events.length)return s;
 need(s.story.rested,'review before rest');
 const replay={...s,evidence:s.evidence.filter(e=>!e.content.startsWith(REVIEW_PREFIX))},seen=new Set();
 for(const e of events){
  need(s.ids.includes(e.id)&&!seen.has(e.id),'review identity');seen.add(e.id);
  const before=replay.evidence.length;
  if(e.content===REVIEW_SCHEDULE){need(exact(e,['id','at','content','kind'])&&e.kind==='schedule'&&scheduleReview(replay,e),'review schedule');}
  else{const t=REVIEW_TASKS.find(t=>t.content===e.content&&t.variant===e.variant);need(t&&recordReview(replay,{...e,task:t.id,type:e.kind==='help'?'review-help':'review-attempt',guided:e.kind==='guided'}),'review order');}
  need(replay.evidence.length===before+1&&JSON.stringify(replay.evidence.at(-1))===JSON.stringify(e),'review provenance');
 }
 return s;
}
