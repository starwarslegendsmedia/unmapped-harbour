import {need,obj,integer,exact} from '../math/validation.js';
import {BRIDGE} from '../math/rules.js';
import {TASKS,waterPlan,mixturePlan,waterValues,WATER,MIXTURE} from '../math/encounters.js';
import {validateV1} from './schema-v1.js';
export const rootKeys=Object.freeze(['version','revision','ids','position','started','bridge','help','evidence','notes','ink','clues','settings']);
export function validateV2Fresh(s){
 need(obj(s)&&s.version===2,'version');need(exact(s,[...rootKeys,'water','mix']),'fields');
 const base={...s,version:1};delete base.water;delete base.mix;base.help=Object.fromEntries(Object.entries(s.help??{}).filter(([k])=>k==='bridge'));base.evidence=s.evidence?.filter(e=>e.content===BRIDGE.content);validateV1(base);
 need(obj(s.help)&&Object.keys(s.help).every(k=>['bridge',...Object.keys(TASKS)].includes(k)&&s.help[k]===true),'help tasks');
 need(Array.isArray(s.evidence)&&s.evidence.length<=10000,'evidence');const w=s.water,m=s.mix,{content,reserve}=waterValues();need(exact(w,['done','volume','spill','failures','plan'])&&typeof w.done==='boolean'&&integer(w.failures,0,10000)&&[0,WATER.spill].includes(w.spill)&&integer(w.volume,reserve,content),'water state');
 need(w.plan===null||waterPlan(w.plan)!==null,'water plan');need(!w.spill||w.plan!==null&&!waterPlan(w.plan).correct,'spill plan');need(!w.done? w.volume===content-w.spill : w.spill===0&&w.plan!==null&&waterPlan(w.plan).correct&&w.volume===waterPlan(w.plan).remaining,'water conservation');need(!w.done||s.bridge.done,'water prerequisite');
 need(exact(m,['done','clouded','failures','plan','fresh'])&&typeof m.done==='boolean'&&typeof m.clouded==='boolean'&&integer(m.failures,0,10000),'mixture state');need(m.plan===null||mixturePlan(m.plan)!==null,'mixture plan');need(!m.done||w.done&&s.clues.includes('iona')&&!m.clouded&&m.plan!==null&&mixturePlan(m.plan).correct,'mixture completion');
 const f=m.fresh;need(exact(f,['done','clouded','failures','plan'])&&typeof f.done==='boolean'&&typeof f.clouded==='boolean'&&integer(f.failures,0,10000)&&(f.plan===null||mixturePlan(f.plan,MIXTURE.freshTotal)!==null),'fresh mixture');need(!f.done||m.done&&!f.clouded&&f.plan!==null&&mixturePlan(f.plan,MIXTURE.freshTotal).correct,'fresh completion');
 for(const [batch,total] of [[m,MIXTURE.total],[f,MIXTURE.freshTotal]]){need(!batch.clouded||batch.plan!==null&&!mixturePlan(batch.plan,total).correct,'clouded plan');}
 const latest=(content,variant)=>s.evidence.findLast(e=>e.content===content&&e.variant===variant&&e.kind!=='help');
 for(const [batch,def,variant] of [[w,TASKS.water,TASKS.water.variant],[m,TASKS.mixture,TASKS.mixture.variant],[f,TASKS.mixture,'amber2-clear3-total40']]){const e=latest(def.content,variant);need(batch.done===(e?.actual?.correct===true),'completion evidence');if(batch.plan!==null){const actual=def===TASKS.water?waterPlan(batch.plan):mixturePlan(batch.plan,variant==='amber2-clear3-total40'?MIXTURE.freshTotal:MIXTURE.total);need(JSON.stringify(e?.actual)===JSON.stringify(actual),'plan evidence');}}
 const seen=new Set(),helpIds=Object.fromEntries(Object.values(TASKS).map(t=>[t.content,[]]));
 for(const e of s.evidence){
  need(obj(e)&&s.ids.includes(e.id)&&!seen.has(e.id),'evidence identity');seen.add(e.id);if(e.content===BRIDGE.content)continue;
  const task=Object.keys(TASKS).find(t=>TASKS[t].content===e.content),def=TASKS[task];need(!!def,'known content');
  const keys=['id','at','content','kind','support'];need(e.at===null||integer(e.at,0,1e15),'time');
  if(e.kind==='help'){need(exact(e,[...keys,'exposure'])&&e.support==='assisted'&&['example','shown-step','worked-route'].includes(e.exposure),'help');helpIds[e.content].push(e.id);continue;}
  need(['guided','observed'].includes(e.kind)&&exact(e,[...keys,'variant','context','actual','priorDemonstrations','outcome','outcomes','correct','attempt',...(e.kind==='observed'?['inputs']:[])]),'learning fields');
  const fresh=task==='mixture'&&e.variant==='amber2-clear3-total40',total=fresh?MIXTURE.freshTotal:MIXTURE.total;need((e.variant===def.variant||fresh)&&e.context===(fresh?'fresh-immediate':'story')&&e.outcome===def.outcomes[0]&&JSON.stringify(e.outcomes)===JSON.stringify(def.outcomes),'outcomes/variant');need(integer(e.attempt,1,10001)&&JSON.stringify(e.priorDemonstrations)===JSON.stringify(helpIds[e.content]),'prior teaching');
  let expected;if(e.kind==='guided'){
   need(e.correct===null&&e.support==='assisted','guided teaching');
   expected=task==='water'?waterPlan({current:content,reserve,beacon:e.actual?.beacon,helper:e.actual?.helper,service:e.actual?.service}):mixturePlan({amber:e.actual?.amber,clear:e.actual?.clear,fraction:'2/5'},total);
   need(expected?.correct,'guided result');
  }else{
   need(exact(e.inputs,task==='water'?['current','reserve','beacon','helper','service']:['amber','clear','fraction']),'inputs');expected=task==='water'?waterPlan(e.inputs):mixturePlan(e.inputs,total);
   need(expected!==null&&e.correct===expected.correct&&e.support===(helpIds[e.content].length?'assisted':'independent'),'observed support/result');
  }
  need(JSON.stringify(e.actual)===JSON.stringify(expected),'actual result');
 }
 return s;
}
