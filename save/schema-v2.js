import {need,obj,integer,finite,exact} from '../math/validation.js';
import {initial,BRIDGE} from '../math/rules.js';
import {TASKS,waterInitial,mixInitial,waterPlan,mixturePlan} from '../math/encounters.js';
import {validateV1} from './schema-v1.js';
const rootKeys=['version','revision','ids','position','started','bridge','help','evidence','notes','ink','clues','settings'];
const outcomes=BRIDGE.outcomes;
export function validateV2(s){
 need(obj(s)&&s.version===2,'version');need(exact(s,[...rootKeys,'water','mix']),'fields');
 const base={...s,version:1};delete base.water;delete base.mix;base.help=Object.fromEntries(Object.entries(s.help??{}).filter(([k])=>k==='bridge'));base.evidence=s.evidence?.filter(e=>e.content===BRIDGE.content);validateV1(base);
 need(obj(s.help)&&Object.keys(s.help).every(k=>['bridge',...Object.keys(TASKS)].includes(k)&&s.help[k]===true),'help tasks');
 const w=s.water,m=s.mix;need(exact(w,['done','volume','spill','failures','plan'])&&typeof w.done==='boolean'&&integer(w.failures,0,10000)&&[0,4].includes(w.spill)&&integer(w.volume,20,60),'water state');
 need(w.plan===null||waterPlan(w.plan)!==null,'water plan');need(!w.done? w.volume===60-w.spill : w.spill===0&&w.plan!==null&&waterPlan(w.plan).correct&&w.volume===waterPlan(w.plan).remaining,'water conservation');need(!w.done||s.bridge.done,'water prerequisite');
 need(exact(m,['done','clouded','failures','plan'])&&typeof m.done==='boolean'&&typeof m.clouded==='boolean'&&integer(m.failures,0,10000),'mixture state');need(m.plan===null||mixturePlan(m.plan)!==null,'mixture plan');need(!m.done||w.done&&s.clues.includes('iona')&&!m.clouded&&m.plan!==null&&mixturePlan(m.plan).correct,'mixture completion');
 const seen=new Set(),helpIds=Object.fromEntries(Object.values(TASKS).map(t=>[t.content,[]]));
 for(const e of s.evidence){
  need(obj(e)&&s.ids.includes(e.id)&&!seen.has(e.id),'evidence identity');seen.add(e.id);if(e.content===BRIDGE.content)continue;
  const task=Object.keys(TASKS).find(t=>TASKS[t].content===e.content),def=TASKS[task];need(!!def,'known content');
  const keys=['id','at','content','kind','support'];need(e.at===null||integer(e.at,0,1e15),'time');
  if(e.kind==='help'){need(exact(e,[...keys,'exposure'])&&e.support==='assisted'&&['example','shown-step','worked-route'].includes(e.exposure),'help');helpIds[e.content].push(e.id);continue;}
  need(['guided','observed'].includes(e.kind)&&exact(e,[...keys,'variant','context','actual','priorDemonstrations','outcome','outcomes','correct','attempt',...(e.kind==='observed'?['inputs']:[])]),'learning fields');
  need(e.variant===def.variant&&e.context==='story'&&e.outcome===def.outcomes[0]&&JSON.stringify(e.outcomes)===JSON.stringify(def.outcomes),'outcomes/variant');need(integer(e.attempt,1,10001)&&JSON.stringify(e.priorDemonstrations)===JSON.stringify(helpIds[e.content]),'prior teaching');
  let expected;if(e.kind==='guided'){
   need(e.correct===null&&e.support==='assisted','guided teaching');
   expected=task==='water'?waterPlan({current:60,reserve:20,beacon:e.actual?.beacon,helper:e.actual?.helper,service:e.actual?.service}):mixturePlan({amber:e.actual?.amber,clear:e.actual?.clear,fraction:'2/5'});
   need(expected?.correct,'guided result');
  }else{
   need(exact(e.inputs,task==='water'?['current','reserve','beacon','helper','service']:['amber','clear','fraction']),'inputs');expected=task==='water'?waterPlan(e.inputs):mixturePlan(e.inputs);
   need(expected!==null&&e.correct===expected.correct&&e.support===(helpIds[e.content].length?'assisted':'independent'),'observed support/result');
  }
  need(JSON.stringify(e.actual)===JSON.stringify(expected),'actual result');
 }
 return s;
}
