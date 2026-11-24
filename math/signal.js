import {exact,integer,obj,need} from './validation.js';
// The fresh application at the end of the chapter: a new machine rule in ordinary notation, S = 5k + 2, shown as a
// table rather than the rig's glyphs. The northern boats listen at exactly 22. The player chooses the coils k and tunes
// the relay dial to the strength S those coils will make; the relay fires only when the dial matches the coils, and the
// boats hear it only at 22. So the choice (k) and the calculation (S) are each physical, and each is recorded.
export const SIGNAL=Object.freeze({content:'harbour.signal.1',variant:'rule5k2-target22',context:'fresh-transfer',outcomes:Object.freeze(['MA4-ALG-C-01','MA3-MR-02']),per:5,add:2,target:22,maxCoils:10,table:Object.freeze([1,2,3])});
export const signalStrength=k=>SIGNAL.per*k+SIGNAL.add;
export const signalInitial=()=>({done:false,misfire:false,failures:0,plan:null});
export const storyInitial=()=>({lens:false,log:false,rested:false});
export const SIGNAL_ROUTE=Object.freeze({k:(SIGNAL.target-SIGNAL.add)/SIGNAL.per,S:SIGNAL.target});
export function signalPlan(p){
 if(!exact(p,['k','S'])||!integer(p.k,1,SIGNAL.maxCoils)||!integer(p.S,0,80))return null;
 const actual=signalStrength(p.k),choiceCorrect=actual===SIGNAL.target,calculationCorrect=p.S===actual;
 const reason=!calculationCorrect?'dial':!choiceCorrect?(actual<SIGNAL.target?'weak':'strong'):'success';
 return {k:p.k,predicted:p.S,actual,choiceCorrect,calculationCorrect,correct:choiceCorrect&&calculationCorrect,reason};
}
const EXPOSURES=['example','shown-step','worked-route'];
export function recordSignalHelp(s,a){
 if(!s.story.log||s.signal.done||!EXPOSURES.includes(a.exposure)||!(a.at==null||integer(a.at,0,1e15)))return false;
 s.help.signal=true;s.evidence.push({id:a.id,at:a.at??null,content:SIGNAL.content,kind:'help',support:'assisted',exposure:a.exposure});return true;
}
// One committed signal. A guided signal is the worked route made together: the quest still resolves, and its
// correctness is recorded as null with assisted support, so it never counts as independent success.
export function sendSignal(s,a){
 const g=s.signal;if(!s.story.log||g.done||g.misfire)return false;const guided=a.guided===true;
 const inputs=guided?{...SIGNAL_ROUTE}:a.inputs,result=signalPlan(inputs);if(!result)return false;
 if(guided&&!s.evidence.some(e=>e.content===SIGNAL.content&&e.kind==='help'&&e.exposure==='worked-route'))return false;
 const prior=s.evidence.filter(e=>e.content===SIGNAL.content&&e.kind==='help').map(e=>e.id);
 s.evidence.push({id:a.id,at:a.at??null,content:SIGNAL.content,variant:SIGNAL.variant,context:SIGNAL.context,kind:guided?'guided':'observed',support:guided||prior.length||s.evidence.some(e=>e.content===SIGNAL.content&&e.kind!=='help')?'assisted':'independent',correct:guided?null:result.correct,...(guided?{}:{inputs:{k:inputs.k,S:inputs.S}}),actual:result,priorDemonstrations:prior,outcome:SIGNAL.outcomes[0],outcomes:[...SIGNAL.outcomes],attempt:s.evidence.filter(e=>e.content===SIGNAL.content&&e.kind!=='help').length+1});
 g.plan={k:inputs.k,S:inputs.S};if(guided||result.correct)g.done=true;else{g.misfire=true;g.failures++;}return true;
}
// Checks a version 4 save's story, signal and signal evidence by replaying the evidence in order.
export function validateStory(s,legacy=false){
 const t=s.story,g=s.signal;need(exact(t,['lens','log','rested'])&&Object.values(t).every(v=>typeof v==='boolean'),'story');
 need(!t.lens||s.combat.won,'lens prerequisite');need(!t.log||t.lens,'log prerequisite');need(!t.rested||g.done,'rest prerequisite');
 need(exact(g,['done','misfire','failures','plan'])&&typeof g.done==='boolean'&&typeof g.misfire==='boolean'&&integer(g.failures,0,10000)&&(g.plan===null||signalPlan(g.plan)!==null),'signal state');
 const help=[],seen=new Set();let attempts=0,failures=0,last=null;
 for(const e of s.evidence){
  if(!obj(e)||e.content!==SIGNAL.content)continue;need(s.ids.includes(e.id)&&!seen.has(e.id)&&(e.at===null||integer(e.at,0,1e15)),'signal identity');seen.add(e.id);need(t.log&&!last?.done,'signal order');
  const keys=['id','at','content','kind','support'];
  if(e.kind==='help'){need(exact(e,[...keys,'exposure'])&&e.support==='assisted'&&EXPOSURES.includes(e.exposure),'signal teaching');help.push(e);continue;}
  const guided=e.kind==='guided';need(['guided','observed'].includes(e.kind)&&exact(e,[...keys,'variant','context','correct','actual','priorDemonstrations','outcome','outcomes','attempt',...(guided?[]:['inputs'])]),'signal fields');
  if(guided)need(help.some(h=>h.exposure==='worked-route'),'guided signal teaching');
  const inputs=guided?SIGNAL_ROUTE:e.inputs,expected=signalPlan(inputs);need(expected!==null&&JSON.stringify(e.actual)===JSON.stringify(expected),'signal result');
  need(e.variant===SIGNAL.variant&&e.context===SIGNAL.context&&e.outcome===SIGNAL.outcomes[0]&&JSON.stringify(e.outcomes)===JSON.stringify(SIGNAL.outcomes),'signal outcomes');
  need(e.correct===(guided?null:expected.correct)&&e.support===(guided||help.length||!legacy&&attempts>0?'assisted':'independent')&&JSON.stringify(e.priorDemonstrations)===JSON.stringify(help.map(h=>h.id))&&e.attempt===++attempts,'signal provenance');
  if(!guided)need(exact(e.inputs,['k','S']),'signal inputs');
  const done=guided||expected.correct;if(!done)failures++;last={done,failed:!done,plan:{k:inputs.k,S:inputs.S}};
 }
 need(!!s.help.signal===help.length>0,'signal help state');need(g.failures===failures&&g.done===!!last?.done,'signal completion');
 need(JSON.stringify(g.plan)===JSON.stringify(last?.plan??null),'signal plan');need(!g.misfire||!!last?.failed,'signal misfire');
 return s;
}
