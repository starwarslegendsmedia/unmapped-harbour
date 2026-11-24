import {need,obj,integer,finite,exact} from '../math/validation.js';
import {initial,bridgeCut,LIMITS,BRIDGE,canObserve} from '../math/rules.js';
const rootKeys=['version','revision','ids','position','started','bridge','help','evidence','notes','ink','clues','settings'];
const outcomes=BRIDGE.outcomes;
export function validateV1(s){
 need(exact(s,rootKeys),'fields');need(s.version===1,'version');need(integer(s.revision,0,1e9),'revision');need(typeof s.started==='boolean','start');
 need(Array.isArray(s.ids)&&s.ids.length<=10000&&s.ids.every(x=>typeof x==='string'&&/^[\w:-]{1,100}$/.test(x))&&new Set(s.ids).size===s.ids.length,'action ids');
 need(exact(s.position,['x','z'])&&finite(s.position.x,-13,16)&&finite(s.position.z,-4.8,4.5),'position');
 const b=s.bridge;need(obj(b)&&['done','cut','recovery','failures'].every(k=>Object.hasOwn(b,k))&&Object.keys(b).every(k=>['done','cut','recovery','failures','result'].includes(k)),'bridge fields');
 need(typeof b.done==='boolean'&&integer(b.cut,0,4800)&&integer(b.recovery,0,3)&&integer(b.failures,0,10000),'bridge values');
 need(!b.result||['success','short','long','offcut'].includes(b.result),'cut result');need(!b.done||(b.cut>=3250&&b.cut<=3500&&b.recovery===0&&b.result==='success'),'bridge completion');
 need(b.done||s.position.x<=-1.65,'unreachable position');
 need(obj(s.help)&&Object.keys(s.help).every(k=>k==='bridge'&&s.help[k]===true),'help');
 need(typeof s.notes==='string'&&s.notes.length<=LIMITS.notes,'notes');
 need(Array.isArray(s.ink)&&s.ink.reduce((n,a)=>n+(Array.isArray(a)?a.length:1e9),0)<=LIMITS.inkPoints&&s.ink.length<=LIMITS.strokes&&s.ink.every(stroke=>Array.isArray(stroke)&&stroke.length<=LIMITS.strokePoints&&stroke.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>finite(v,0,1)))),'ink');
 need(Array.isArray(s.clues)&&new Set(s.clues).size===s.clues.length&&s.clues.every((c,i)=>s.bridge.done&&canObserve(s.clues.slice(0,i),c)),'clue order');
 const q=s.settings;need(exact(q,['quality','motion','timed','music','effects','speech','text'])&&['auto','light','high'].includes(q.quality)&&typeof q.motion==='boolean'&&typeof q.timed==='boolean'&&['music','effects','speech'].every(k=>finite(q[k],0,1))&&finite(q.text,1,1.3),'settings');
 need(Array.isArray(s.evidence)&&s.evidence.length<=10000,'evidence');
 const seen=new Set(),helpIds=[],cuts=[];for(const e of s.evidence){
  need(obj(e)&&s.ids.includes(e.id)&&!seen.has(e.id)&&e.content===BRIDGE.content&&['help','guided','observed'].includes(e.kind),'evidence identity');seen.add(e.id);
  need(e.support==='assisted'||e.support==='independent','support');need(e.at===null||integer(e.at,0,1e15),'time');
  const keys=['id','at','content','kind','support'];if(e.kind==='help'){need(exact(e,[...keys,'exposure']),'help fields');need(e.support==='assisted'&&['example','shown-step','worked-route'].includes(e.exposure),'help exposure');helpIds.push(e.id);continue;}
  need(exact(e,[...keys,'variant','context','actual','priorDemonstrations','outcome','outcomes','correct','attempt',...(e.kind==='observed'?['inputs']:[])]),'learning fields');need(e.variant===BRIDGE.variant&&e.context==='story','variant');need(exact(e.actual,['cutMM','remainingMM','result'])&&integer(e.actual.cutMM,1,4800)&&e.actual.remainingMM===4800-e.actual.cutMM&&['success','short','long','offcut'].includes(e.actual.result),'actual cut');
  need(e.outcome===outcomes[0]&&Array.isArray(e.outcomes)&&e.outcomes.length===3&&outcomes.every((o,i)=>e.outcomes[i]===o),'outcome links');
  need(integer(e.attempt,1,10001)&&Array.isArray(e.priorDemonstrations)&&e.priorDemonstrations.length===helpIds.length&&e.priorDemonstrations.every((id,i)=>helpIds[i]===id),'attempt provenance');
  need(cuts.at(-1)?.actual.result!=='success'&&e.attempt===cuts.length+1,'bridge attempt order');cuts.push(e);
  if(e.kind==='guided')need(e.correct===null&&e.support==='assisted'&&!Object.hasOwn(e,'inputs'),'guided teaching');
  else need(typeof e.correct==='boolean'&&exact(e.inputs,['mm','offcut','cutUnit','offcutUnit'])&&integer(e.inputs.mm,1,4800)&&integer(e.inputs.offcut,0,100000)&&['m','cm'].includes(e.inputs.cutUnit)&&['m','cm'].includes(e.inputs.offcutUnit),'observed inputs');
  if(e.kind==='observed'){need(e.actual.cutMM===e.inputs.mm&&e.actual.result===bridgeCut(e.inputs.mm,e.inputs.offcut).kind&&e.correct===(e.actual.result==='success'),'observed result');need(e.support===(helpIds.length?'assisted':'independent'),'observed support');}
 }
 need(!!s.help.bridge===(helpIds.length>0),'bridge help evidence');
 const last=cuts.at(-1),failed=cuts.filter(e=>e.actual.result!=='success').length;
 need(b.done===(last?.actual.result==='success')&&b.failures===failed,'bridge completion/failure evidence');
 need(b.result===last?.actual.result,'bridge result evidence');
 need(last?b.cut===(b.done||b.recovery?last.actual.cutMM:0):b.cut===0&&b.recovery===0,'bridge cut/recovery evidence');
 return s;
}
