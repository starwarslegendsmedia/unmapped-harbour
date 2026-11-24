import {need,exact,integer} from '../math/validation.js';
import {combatInitial,calibrationInitial,resolveCombat,resolveCalibration,CALIBRATION,SPELL} from './CombatSystem.js';
export function validateCombat(s){
 const actuals=new Map(),actions=new Map(),expectedTiming=[];
 for(const [value,initial,resolve] of [[s.calibration,calibrationInitial,resolveCalibration],[s.combat,combatInitial,resolveCombat]]){
  need(value&&Array.isArray(value.log)&&value.log.length<=10000,'machine log');let replay=initial();
  const ids=new Set(s.ids),log=[];
  for(const a of value.log){need(a&&ids.has(a.id)&&!actions.has(a.id),'machine action id');actions.set(a.id,a);const r=resolve({...replay,log:[]},a);need(r!==null,'machine transition');log.push(r.state.log[0]);replay=r.state;if(r.actual)actuals.set(a.id,r.actual);if(r.timing)expectedTiming.push(r.timing);}
  need(JSON.stringify(value)===JSON.stringify({...replay,log}),'machine replay');
 }
 need(!s.calibration.log.length||s.mix.fresh.done,'calibration prerequisite');need(!s.combat.log.length||s.calibration.done,'combat prerequisite');need(Array.isArray(s.timing)&&JSON.stringify(s.timing)===JSON.stringify(expectedTiming),'timing log');
 const helpIds=[],seen=new Set(),seenNumbers=new Set();let help=false;const attempts={[CALIBRATION.content]:0,[SPELL.content]:0};
 for(const e of s.evidence){
  need(e&&s.ids.includes(e.id)&&!seen.has(e.id),'evidence identity');seen.add(e.id);
  if(![CALIBRATION.content,SPELL.content].includes(e.content))continue;
  need(e.at===null||integer(e.at,0,1e15),'time');const keys=['id','at','content','kind','support'];
  if(e.kind==='help'){need(e.content===SPELL.content&&exact(e,[...keys,'exposure','phase'])&&['calibration','combat'].includes(e.phase)&&e.support==='assisted'&&['example','shown-step','worked-route'].includes(e.exposure)&&!actions.has(e.id),'spell teaching');helpIds.push(e.id);help=true;continue;}
  const a=actions.get(e.id),actual=actuals.get(e.id),def=e.content===CALIBRATION.content?CALIBRATION:SPELL;need(!!a&&!!actual&&a.type===(def===CALIBRATION?'calibrate':'cast'),'math action');
  need(exact(e,[...keys,'variant','context','correct','novel','actual','priorDemonstrations','outcome','outcomes','attempt',...(a.guided?[]:['inputs'])]),'spell evidence fields');
  need(e.kind===(a.guided?'guided':'observed')&&e.correct===(a.guided?null:actual.correct)&&e.support==='assisted'&&helpIds.length>0,'spell provenance');
  need(JSON.stringify(e.actual)===JSON.stringify(actual)&&e.at===a.at&&e.variant==='rule3n4-n'+actual.n&&e.context===def.context,'spell result');
  need(JSON.stringify(e.priorDemonstrations)===JSON.stringify(helpIds)&&e.outcome===def.outcomes[0]&&JSON.stringify(e.outcomes)===JSON.stringify(def.outcomes),'spell teaching/outcomes');
  need(e.attempt===++attempts[e.content]&&e.novel===(!a.guided&&actual.n>3&&!seenNumbers.has(actual.n)),'novel attempt');seenNumbers.add(actual.n);
  if(!a.guided){const input=def===CALIBRATION?{n:a.n,prediction:a.prediction,rule:a.rule}:{n:a.n,prediction:a.prediction};need(JSON.stringify(e.inputs)===JSON.stringify(input),'spell inputs');}
 }
 need(!!s.help.spell===help,'spell help state');for(const id of actuals.keys())need(s.evidence.some(e=>e.id===id),'missing machine evidence');
}
