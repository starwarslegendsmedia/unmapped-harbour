import {recordReview,scheduleReview} from './review.js';
import {messageInitial,recordMessage} from './messages.js';
import {combatInitial,calibrationInitial,resolveCombat,resolveCalibration,recordSpellHelp,recordSpellMath,combatLogAction,CALIBRATION,SPELL} from '../combat/CombatSystem.js';
import {signalInitial,storyInitial,recordSignalHelp,sendSignal} from './signal.js';
import {finite} from './validation.js';
import {waterInitial,mixInitial,waterPlan,mixturePlan,recordHelp,recordAttempt,WATER,MIXTURE} from './encounters.js';
// Length is stored in millimetres. These are original encounter quantities.
export const LIMITS={notes:8000,strokes:1000,strokePoints:500,inkPoints:20000};
export const BRIDGE={content:'harbour.bridge.1',variant:'stock4800-gap2850-bearing200',outcomes:['MA3-GM-02','MA3-AR-01','MA3-RN-02']};
export const CLUES={pipe:'Water tank: its pipes must send water to cool the lighthouse lamp.',log:'Keeper’s notebook: water was sent away before the lighthouse went dark.',archive:'Letter room: a letter rests above a fresh water stain.',iona:'Iona: “I could not let the letters be ruined. One of them was mine.”',ambrose:'Ambrose remembers helping Gran build a cooling bypass.'};
export function canObserve(clues,clue){return Object.hasOwn(CLUES,clue)&&(!['iona','ambrose'].includes(clue)||(clue==='iona'?clues.includes('pipe')&&clues.includes('log'):clues.includes('iona')));}
export function lengthMM(text,unit='m') {
 if(typeof text!=='string'||!/^\d{1,4}(?:\.\d{1,3})?$/.test(text.trim())||!['m','cm'].includes(unit))return null;
 const [whole,dec='']=text.trim().split('.');
 const n=Number(whole)*1000+Number(dec.padEnd(3,'0'));
 const mm=unit==='m'?n:n/100;
 return Number.isSafeInteger(mm)&&mm>=0&&mm<=100000?mm:null;
}
export function bridgeCut(mm,offcut){
 if(!Number.isSafeInteger(mm)||mm<=0||mm>4800||!Number.isSafeInteger(offcut)||offcut<0)return {kind:'invalid'};
 if(mm<3250)return {kind:'short'};
 if(mm>3500)return {kind:'long'};
 if(offcut!==4800-mm)return {kind:'offcut'};
 return {kind:'success'};
}
export function initial(){return {version:6,messages:messageInitial(),story:storyInitial(),signal:signalInitial(),calibration:calibrationInitial(),combat:combatInitial(),timing:[],water:waterInitial(),mix:mixInitial(),revision:0,ids:[],position:{x:-8,z:1},started:false,bridge:{done:false,cut:0,recovery:0,failures:0},help:{},evidence:[],notes:'',ink:[],clues:[],settings:{quality:'auto',motion:true,timed:true,music:.35,effects:.6,speech:.6,text:1,timingWindow:.5,muted:false}};}
export function transition(state,action){
 if(!action||typeof action.id!=='string'||!action.id||state.ids.includes(action.id))return state;
 const s=structuredClone(state);let accepted=true;
 switch(action.type){
 case 'start':s.started=true;break;
 case 'help':if(action.task==='signal'){if(!recordSignalHelp(s,action))return state;break;}if(action.task!=='bridge'){if(!recordHelp(s,action))return state;break;}s.help.bridge=true;s.evidence.push({id:action.id,at:action.at??null,content:BRIDGE.content,kind:'help',support:'assisted',exposure:action.exposure??'example'});break;
 case 'cut':{
  if(s.bridge.done||s.bridge.recovery)return state;
  const result=bridgeCut(action.mm,action.offcut);if(result.kind==='invalid')return state;
  s.bridge.cut=action.mm;s.bridge.result=result.kind;
  if(result.kind==='success')s.bridge.done=true;
  else{s.bridge.failures++;s.bridge.recovery=3;}
  s.evidence.push({id:action.id,at:action.at??null,content:BRIDGE.content,variant:BRIDGE.variant,context:'story',actual:{cutMM:action.mm,remainingMM:4800-action.mm,result:result.kind},priorDemonstrations:s.evidence.filter(e=>e.content===BRIDGE.content&&e.kind==='help').map(e=>e.id),outcome:BRIDGE.outcomes[0],outcomes:[...BRIDGE.outcomes],...(action.guided?{}:{inputs:{mm:action.mm,offcut:action.offcut,cutUnit:action.cutUnit??'m',offcutUnit:action.offcutUnit??'m'}}),kind:action.guided?'guided':'observed',correct:action.guided?null:result.kind==='success',support:(action.guided||s.help.bridge)?'assisted':'independent',attempt:s.bridge.failures+(s.bridge.done?1:0)});
  break;
 }
 case 'spell-help':if(!s.mix.fresh.done||!recordSpellHelp(s,action))return state;break;
 case 'calibrate':case 'recover-calibration':{
  if(!s.mix.fresh.done||!s.help.spell)return state;const logAction=combatLogAction(action,s.settings),result=resolveCalibration(s.calibration,logAction);if(!result)return state;s.calibration=result.state;if(result.actual)recordSpellMath(s,logAction,CALIBRATION,result.actual);break;
 }
 case 'begin-combat':case 'cast':case 'settle-pulse':case 'recharge':case 'retreat':{
  if(!s.calibration.done)return state;const logAction=combatLogAction(action,s.settings),result=resolveCombat(s.combat,logAction);if(!result)return state;s.combat=result.state;if(result.actual)recordSpellMath(s,logAction,SPELL,result.actual);if(result.timing)s.timing.push(result.timing);break;
 }
 case 'timing-settings':if(typeof action.timed!=='boolean'||!Number.isFinite(action.window)||action.window<.2||action.window>1.2)return state;s.settings.timed=action.timed;s.settings.timingWindow=action.window;break;
 case 'allocate':{
  if(!s.bridge.done||s.water.done||s.water.spill)return state;const result=waterPlan(action.inputs);if(!result||action.guided&&!result.correct)return state;
  recordAttempt(s,action,'water',result,s.water.failures+1);s.water.plan=structuredClone(action.inputs);s.water.volume=result.waterAfter;
  if(result.correct)s.water.done=true;else{s.water.spill=WATER.spill;s.water.failures++;}break;
 }
 case 'recover-water':if(s.water.spill!==WATER.spill)return state;s.water.volume+=s.water.spill;s.water.spill=0;break;
 case 'mix':case 'mix-fresh':{
  const fresh=action.type==='mix-fresh',batch=fresh?s.mix.fresh:s.mix;
  if(!s.water.done||!s.clues.includes('iona')||fresh&&!s.mix.done||batch.done||batch.clouded||!s.help.mixture)return state;
  const result=mixturePlan(action.inputs,fresh?MIXTURE.freshTotal:MIXTURE.total);if(!result||action.guided&&!result.correct)return state;
  recordAttempt(s,action,'mixture',result,batch.failures+1);batch.plan=structuredClone(action.inputs);if(result.correct)batch.done=true;else{batch.clouded=true;batch.failures++;}break;
 }
 case 'reclaim':case 'reclaim-fresh':{const batch=action.type==='reclaim-fresh'?s.mix.fresh:s.mix;if(!batch.clouded)return state;batch.clouded=false;batch.plan=null;break;}
 case 'notes':if(typeof action.notes!=='string'||action.notes.length>LIMITS.notes||!Array.isArray(action.ink))return state;s.notes=action.notes;s.ink=structuredClone(action.ink);break;
 case 'clue':if(!canObserve(s.clues,action.clue)||s.clues.includes(action.clue)||!s.bridge.done)return state;s.clues.push(action.clue);break;
 case 'turn-lens':if(!s.combat.won||s.story.lens)return state;s.story.lens=true;break;
 case 'read-log':if(!s.story.lens||s.story.log)return state;s.story.log=true;break;
 case 'signal':if(!sendSignal(s,action))return state;break;
 case 'rewind-signal':if(!s.signal.misfire)return state;s.signal.misfire=false;break;
 case 'rest':if(!s.signal.done||s.story.rested)return state;s.story.rested=true;scheduleReview(s,action);break;
 case 'message-help':case 'message-attempt':case 'message-recover':if(!recordMessage(s,action))return state;break;
 case 'review-schedule':if(!scheduleReview(s,action))return state;break;
 case 'review-help':case 'review-attempt':if(!recordReview(s,action))return state;break;
 case 'settings':{const q=action.settings;if(!q||typeof q!=='object'||!['auto','light','high'].includes(q.quality)||typeof q.motion!=='boolean'||typeof q.muted!=='boolean'||!['music','effects','speech'].every(k=>finite(q[k],0,1))||!finite(q.text,1,1.3))return state;Object.assign(s.settings,{quality:q.quality,motion:q.motion,muted:q.muted,music:q.music,effects:q.effects,speech:q.speech,text:q.text});break;}
 case 'checkpoint':break;
 case 'arrive':if(!action.position||!Number.isFinite(action.position.x)||!Number.isFinite(action.position.z))return state;s.position={x:action.position.x,z:action.position.z};break;
 case 'salvage':if(!s.bridge.recovery)return state;s.bridge.recovery--;if(!s.bridge.recovery)s.bridge.cut=0;break;
 default:accepted=false;
 }
 if(!accepted)return state;if(!['notes','checkpoint','arrive'].includes(action.type))s.ids.push(action.id);s.revision++;return s;
}
