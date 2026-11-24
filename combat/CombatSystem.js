import {exact,integer,finite} from '../math/validation.js';
export const RELATION={perCell:3,starter:4,cells:6,barriers:[16,7],health:3};
export const SPELL={content:'harbour.spell.1',outcomes:['MA3-MR-02','MA4-ALG-C-01'],context:'story-combat'};
export const CALIBRATION={content:'harbour.calibration.1',outcomes:SPELL.outcomes,context:'calibration'};
export const strength=n=>RELATION.perCell*n+RELATION.starter;
export const combatInitial=()=>({active:false,won:false,failed:false,cells:RELATION.cells,hp:[...RELATION.barriers],health:RELATION.health,round:0,counters:0,failures:0,recharges:0,pending:null,log:[]});
export const calibrationInitial=()=>({done:false,recovery:false,failures:0,n:4,log:[]});
const common=['type','id','at'];
const validCommon=a=>typeof a.id==='string'&&a.id.length>0&&(a.at===null||integer(a.at,0,1e15));
export function resolveCalibration(state,a){
 if(!a||!validCommon(a)||state.log.some(e=>e.id===a.id))return null;const c=structuredClone(state);let actual=null;
 if(a.type==='recover-calibration'){if(!exact(a,common)||!c.recovery||c.done)return null;c.recovery=false;}
 else if(a.type==='calibrate'){
  const keys=[...common,'n','guided',...(a.guided?[]:['prediction','rule'])];if(!exact(a,keys)||typeof a.guided!=='boolean'||c.done||c.recovery||a.n!==c.n)return null;
  if(!a.guided&&(!integer(a.prediction,0,80)||!['3n+4','3(n+4)','n+7'].includes(a.rule)))return null;
  const E=strength(a.n),ruleCorrect=a.guided||a.rule==='3n+4',predictionCorrect=a.guided||a.prediction===E;actual={n:a.n,E,ruleCorrect,predictionCorrect,correct:ruleCorrect&&predictionCorrect};
  if(actual.correct)c.done=true;else{c.failures++;c.recovery=true;c.n=Math.min(6,4+c.failures);}
 }else return null;
 c.log.push(structuredClone(a));return {state:c,actual};
}
function chamberFailure(c){c.active=false;c.won=false;c.failed=true;c.cells=RELATION.cells;c.hp=[...RELATION.barriers];c.health=RELATION.health;c.pending=null;c.counters=0;c.failures++;}
export function resolveCombat(state,a){
 if(!a||!validCommon(a)||state.log.some(e=>e.id===a.id))return null;const c=structuredClone(state);let actual=null,timing=null;
 switch(a.type){
 case 'begin-combat':if(!exact(a,common)||c.active||c.won)return null;c.active=true;c.failed=false;break;
 case 'cast':{
  const keys=[...common,'n','guided','timed','window',...(a.guided?[]:['prediction'])];
  if(!exact(a,keys)||typeof a.guided!=='boolean'||typeof a.timed!=='boolean'||!finite(a.window,.2,1.2)||!c.active||c.pending||c.won||!integer(a.n,1,c.cells)||!a.guided&&!integer(a.prediction,0,80))return null;
  const target=c.hp.findIndex(h=>h>0);if(target<0)return null;const E=strength(a.n),hpBefore=c.hp[target],cellsBefore=c.cells;c.hp[target]=Math.max(0,hpBefore-E);c.cells-=a.n;c.round++;
  actual={n:a.n,E,target,hpBefore,hpAfter:c.hp[target],cellsBefore,cellsAfter:c.cells,predictionCorrect:a.guided||a.prediction===E,correct:a.guided||a.prediction===E};
  c.pending={castId:a.id,actual,needsCounter:c.hp[target]>0,timed:a.timed,window:a.window};break;
 }
 case 'settle-pulse':{
  if(!exact(a,[...common,'mode','hit'])||!c.active||!c.pending)return null;const p=c.pending,mode=!p.needsCounter?'none':p.timed?'on':'off';
  if(a.mode!==mode||(mode==='on'?typeof a.hit!=='boolean':a.hit!==null))return null;
  // With timing off, the first, third and fifth surviving counter-pulses of an attempt are blocked.
  const blocked=p.needsCounter&&(mode==='on'?a.hit:c.counters%2===0),before=c.health;if(p.needsCounter){c.counters++;if(!blocked)c.health--;}
  timing={id:a.id,at:a.at,castId:p.castId,mode,hit:a.hit,blocked,healthBefore:before,healthAfter:c.health};c.pending=null;
  if(c.health<=0)chamberFailure(c);else if(c.hp.every(h=>h===0)){c.won=true;c.active=false;}break;
 }
 case 'recharge':{
  if(!exact(a,common)||!c.active||c.pending||c.cells!==0)return null;c.recharges++;c.health--;const target=c.hp.findIndex(h=>h>0);if(target>=0)c.hp[target]=Math.min(RELATION.barriers[target],c.hp[target]+3);c.cells=RELATION.cells;if(c.health<=0)chamberFailure(c);break;
 }
 case 'retreat':if(!exact(a,common)||!c.active)return null;chamberFailure(c);break;
 default:return null;
 }
 c.log.push(structuredClone(a));return {state:c,actual,timing};
}
export function recordSpellHelp(s,a){
 if(!(a.at==null||integer(a.at,0,1e15))||!['calibration','combat'].includes(a.phase)||!['example','shown-step','worked-route'].includes(a.exposure)||a.exposure==='example'&&s.evidence.some(e=>e.content===SPELL.content&&e.kind==='help'&&e.exposure==='example'))return false;
 s.help.spell=true;s.evidence.push({id:a.id,at:a.at??null,content:SPELL.content,kind:'help',support:'assisted',exposure:a.exposure,phase:a.phase});return true;
}
export function recordSpellMath(s,a,def,actual){
 const prior=s.evidence.filter(e=>e.content===SPELL.content&&e.kind==='help').map(e=>e.id),novel=actual.n>3&&!s.evidence.some(e=>e.actual?.n===actual.n);
 s.evidence.push({id:a.id,at:a.at??null,content:def.content,variant:'rule3n4-n'+actual.n,context:def.context,kind:a.guided?'guided':'observed',support:a.guided||prior.length?'assisted':'independent',correct:a.guided?null:actual.correct,novel:a.guided?false:novel,...(a.guided?{}:{inputs:def===CALIBRATION?{n:a.n,prediction:a.prediction,rule:a.rule}:{n:a.n,prediction:a.prediction}}),actual,priorDemonstrations:prior,outcome:def.outcomes[0],outcomes:[...def.outcomes],attempt:s.evidence.filter(e=>e.content===def.content&&e.kind!=='help').length+1});
}
export function combatLogAction(a,settings){
 const base={type:a.type,id:a.id,at:a.at??null};
 if(a.type==='cast')return {...base,n:a.inputs?.n,guided:!!a.guided,timed:settings.timed,window:settings.timingWindow,...(a.guided?{}:{prediction:a.inputs?.prediction})};
 if(a.type==='calibrate')return {...base,n:a.inputs?.n,guided:!!a.guided,...(a.guided?{}:{prediction:a.inputs?.prediction,rule:a.inputs?.rule})};
 if(a.type==='settle-pulse')return {...base,mode:a.mode,hit:a.hit};return base;
}
