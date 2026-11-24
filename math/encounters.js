import {exact,integer} from './validation.js';
export const TASKS={
 water:{content:'harbour.water.1',variant:'capacity80-fill3of4-reserve25',outcomes:['MA3-RQF-02','MA3-RN-03','MA3-AR-01']},
 mixture:{content:'harbour.mixture.1',variant:'amber2-clear3-total30',outcomes:['MA4-RAT-C-01','MA3-MR-01']}
};
export const WATER={capacity:80,fill:[3,4],reservePercent:25,cooling:24,helper:12,spill:4};
export const MIXTURE={parts:[2,3],sampleTotal:10,total:30,freshTotal:40};
export const waterValues=(v=WATER)=>({content:v.capacity*v.fill[0]/v.fill[1],reserve:v.capacity*v.reservePercent/100});
export const waterInitial=()=>({done:false,volume:waterValues().content,spill:0,failures:0,plan:null});
export const batchInitial=()=>({done:false,clouded:false,failures:0,plan:null});
export const mixInitial=()=>({...batchInitial(),fresh:batchInitial()});
export function quantity(text,max=80){
 if(typeof text!=='string'||!/^\d{1,4}(?:\.\d{1,3}|\/\d{1,4})?$/.test(text.trim()))return null;
 const [a,b]=text.trim().split('/'),value=b===undefined?Number(a):Number(a)/Number(b);
 return Number.isSafeInteger(value)&&value>=0&&value<=max?value:null;
}
export function waterPlan(p,v=WATER){
 const {content, reserve:protectedReserve}=waterValues(v);
 if(!exact(p,['current','reserve','beacon','helper','service'])||!['current','reserve','beacon','helper'].every(k=>integer(p[k],0,v.capacity))||!['archive','ferry','both'].includes(p.service))return null;
 const draw=p.beacon+p.helper*(p.service==='both'?2:1),remaining=content-draw;
 const reason=p.current!==content?'content':p.reserve!==protectedReserve?'reserve':p.beacon<v.cooling?'cooling':p.helper<v.helper?'helper':remaining<protectedReserve?'overdraw':'success';
 return {correct:reason==='success',draw,remaining,service:p.service,beacon:p.beacon,helper:p.helper,reason,waterAfter:reason==='success'?remaining:content-v.spill};
}
export function mixturePlan(p,total=MIXTURE.total){
 if(!exact(p,['amber','clear','fraction'])||!integer(p.amber,0,80)||!integer(p.clear,0,80)||!['2/5','2/3','3/5'].includes(p.fraction))return null;
 const ratioOK=p.amber>0&&p.clear>0&&MIXTURE.parts[1]*p.amber===MIXTURE.parts[0]*p.clear,wholeOK=p.fraction==='2/5';
 const reason=p.amber+p.clear!==total?'total':!ratioOK?'ratio':!wholeOK?'whole':'success';
 return {correct:reason==='success',amber:p.amber,clear:p.clear,total:p.amber+p.clear,ratioOK,wholeOK,reason};
}
export function recordHelp(s,a){
 const task=TASKS[a.task];if(!task||!['example','shown-step','worked-route'].includes(a.exposure??'example'))return false;
 if(a.task==='mixture'&&(a.exposure??'example')==='example'&&s.evidence.some(e=>e.content===task.content&&e.kind==='help'&&e.exposure==='example'))return false;
 s.help[a.task]=true;s.evidence.push({id:a.id,at:a.at??null,content:task.content,kind:'help',support:'assisted',exposure:a.exposure??'example'});return true;
}
export function recordAttempt(s,a,task,actual,attempt){
 const def=TASKS[task],prior=s.evidence.filter(e=>e.content===def.content&&e.kind==='help').map(e=>e.id);
 s.evidence.push({id:a.id,at:a.at??null,content:def.content,variant:a.type==='mix-fresh'?'amber2-clear3-total40':def.variant,context:a.type==='mix-fresh'?'fresh-immediate':'story',kind:a.guided?'guided':'observed',support:a.guided||prior.length?'assisted':'independent',correct:a.guided?null:actual.correct,...(a.guided?{}:{inputs:structuredClone(a.inputs)}),actual,priorDemonstrations:prior,outcome:def.outcomes[0],outcomes:[...def.outcomes],attempt});
}

export function needsOffer(s,task,fresh=false){
 const def=TASKS[task],variant=fresh?'amber2-clear3-total40':def.variant,events=s.evidence;
 let failed=-1;for(let i=events.length-1;i>=0;i--){const e=events[i];if(e.content===def.content&&e.variant===variant&&e.kind==='observed'&&e.correct===false){failed=i;break;}}
 return failed>=0&&!events.slice(failed+1).some(e=>e.content===def.content&&e.kind==='help');
}
