// The end of the chapter, after both barriers fall: turn the northern lens, the chosen helper's part, Ambrose's
// promise, Gran's beacon log, the fresh relay signal (S = 5k + 2) and a lit shelter to stop in. Only turning the lens,
// reading the log, each signal, rewinding the relay, teaching and resting are committed; the scenes can be replayed.
import {sceneHTML,SCENES} from './lines.js';
import {SIGNAL,signalStrength,SIGNAL_ROUTE} from '../math/signal.js';
const $=id=>document.getElementById(id);
const TABLE='<table><tr><th>Coils k</th>'+SIGNAL.table.map(k=>'<td>'+k+'</td>').join('')+'</tr><tr><th>Signal S</th>'+SIGNAL.table.map(k=>'<td>'+signalStrength(k)+'</td>').join('')+'</tr></table>';
const GIVENS='<b>S = 5k + 2</b> · k is the coils switched on · the northern boats listen at exactly <b>22</b>';
export const SIGNAL_GIVENS=TABLE+GIVENS;
export class Ending {
 constructor(api){Object.assign(this,api);const frame=fn=>(...args)=>{fn(...args);this.world.focusPoint={...(this.look??{x:12,z:-.8})};if(this.look)this.world.view='north';};this.panel=frame(this.panel);this.numeric=frame(this.numeric);}
 // A panel that speaks its scene, with Hear again; speech never spends an attempt.
 scene(title,name,after,eye='BELLWETHER'){
  this.panel(title,sceneHTML(name)+'<div class="row">'+after+'<button id="hear-again">Hear again</button></div>','',eye);
  this.audio.say(SCENES[name]);$('hear-again').onclick=()=>{this.audio.unlock();this.audio.say(SCENES[name]);};
 }
 async open(){
  const s=this.read();
  if(!s.story.lens){this.panel('The northern shutter','<p>Both barriers are down. The restored light waits behind the northern lens. Iona sets her hand beside yours on the crank.</p><button id="turn-lens" class="gold">Turn the northern lens</button>');this.bindOnce($('turn-lens'),()=>this.turnLens());return;}
  if(!s.story.log){this.helper();return;}
  if(s.signal.misfire){this.misfire();return;}
  if(!s.signal.done){this.signal();return;}
  if(!s.story.rested){this.shelter();return;}
  this.finished();
 }
 async turnLens(){
  if(!await this.commit({type:'turn-lens'}))return;this.close();this.world.focusPoint={x:16,z:-8};this.world.revealNorth();this.audio.effect('sfx_beam');
  const token=this.screenToken();const wait=()=>{if(token!==this.screenToken()||!this.read().story.lens)return;if(this.world.revealing){requestAnimationFrame(wait);return;}if(this.canShow())this.beam();};requestAnimationFrame(wait);
 }
 beam(){this.look={x:16,z:-8};this.world.view='north';this.scene('The road north','beam','<button id="go-helper" class="gold">Go on</button>');$('go-helper').onclick=()=>this.helper();}
 helper(){
  this.look=null;
  const service=this.read().water.plan?.service,name=service==='ferry'?'helperFerry':service==='both'?'helperBoth':'helperArchive';
  this.scene(service==='ferry'?'The message boat':service==='both'?'The letter room and the boat':'The open letter room',name,'<button id="go-stay" class="gold">Go on</button><button id="replay-beam">See the road north again</button>');
  $('go-stay').onclick=()=>this.stay();$('replay-beam').onclick=()=>this.beam();
 }
 stay(){this.scene('Beside Havéah','stay','<button id="read-log" class="gold">Read Gran’s beacon log</button>');this.bindOnce($('read-log'),async()=>{if(this.read().story.log||await this.commit({type:'read-log'}))this.log();});}
 log(){this.scene('Gran’s beacon log','log','<button id="go-signal" class="gold">Help Iona with the relay</button>','IN GRAN’S HANDWRITING');$('go-signal').onclick=()=>this.open();}
 // The fresh application: a new rule in ordinary notation, shown as a table.
 signal(explained=false){
  if(!explained){this.intro.show('signal',()=>this.signal(true),TABLE+GIVENS,this.panel);return;}
  const s=this.read(),g=s.signal;if(g.failures>=2&&this.needsStep(s)){this.teach('shown-step');return;}
  this.numeric('Tune the northern relay',TABLE+GIVENS,['Coils to switch on (k)','Dial strength (S)'],['',''],async values=>{
   const [k,S]=values;if(k<1||k>SIGNAL.maxCoils){$('answer-message').textContent='The relay has 1 to '+SIGNAL.maxCoils+' coils. Nothing was sent.';return;}
   if(!await this.commit({type:'signal',inputs:{k,S}}))return;this.fired();
  },()=>this.teach('example'),null,'Send the signal');
  if(g.failures>=2){const b=document.createElement('button');b.textContent='Finish together';this.bindOnce(b,()=>this.teach('worked-route'));$('panel-footer').append(b);}
  this.audio.say(SCENES.signal);
 }
 needsStep(s){const events=s.evidence,i=events.findLastIndex(e=>e.content===SIGNAL.content&&e.kind==='observed'&&e.correct===false);return i>=0&&!events.slice(i+1).some(e=>e.content===SIGNAL.content&&e.kind==='help');}
 fired(){const g=this.read().signal;this.close();if(g.done){this.world.sendSignal();this.audio.effect('sfx_signal');this.audio.effect('sfx_glyph_solved');const token=this.screenToken();setTimeout(()=>{if(token===this.screenToken()&&this.read().signal.done&&this.canShow())this.done();},this.world.reducedMotion?200:2400);}else{this.audio.effect('sfx_misfire');this.misfire();}}
 misfire(){
  const g=this.read().signal,last=this.read().evidence.findLast(e=>e.content===SIGNAL.content&&e.kind==='observed'),a=last.actual;
  const why=a.reason==='dial'?'The '+a.k+' coils made <b>'+a.actual+'</b>, but the dial was set to '+a.predicted+'. The relay will not send a signal its dial does not match.':a.reason==='weak'?a.k+' coils make 5 × '+a.k+' + 2 = <b>'+a.actual+'</b>. That is weaker than 22, so it fades before the northern boats.':a.k+' coils make 5 × '+a.k+' + 2 = <b>'+a.actual+'</b>. That is stronger than 22, so the boats’ receivers shut it out.';
  this.panel('The relay misfires','<p>'+why+'</p><p>The relay spring has run down. Wind it once, then plan again. '+(g.failures>=2?'A shown step is ready if you want it.':'')+'</p><button id="rewind" class="gold">Wind the relay spring</button><button id="hear-again">Hear Iona</button>',TABLE+GIVENS,'THE SIGNAL WAS SPENT');
  this.audio.say(SCENES.misfire);$('hear-again').onclick=()=>{this.audio.unlock();this.audio.say(SCENES.misfire);};
  this.bindOnce($('rewind'),async()=>{if(await this.commit({type:'rewind-signal'}))this.signal(true);});
 }
 async teach(exposure){
  if(!await this.commit({type:'help',task:'signal',exposure}))return;
  if(exposure==='example'){this.panel('A different relay','<p>Another harbour’s relay follows <b>S = 4k + 3</b> and needs <b>15</b>.</p><p>Take away the 3 that is added once: 15 − 3 = 12. Each coil adds 4: 12 ÷ 4 = <b>3 coils</b>.</p><p>Check by putting it back into the rule: 4 × 3 + 3 = 15 ✓</p><p>Now use our rule, S = 5k + 2, and our target, 22.</p><button id="back-signal" class="gold">Plan our signal</button>',TABLE+GIVENS,'A DIFFERENT EXAMPLE');$('back-signal').onclick=()=>this.signal(true);return;}
  if(exposure==='shown-step'){this.panel('Undo the starter first','<p>The relay adds 2 once, whatever the coils. So take it away first: <b>22 − 2 = 20</b>.</p><p>Each coil adds 5. How many fives make 20? Then set the dial to what those coils make.</p><div class="row"><button id="back-signal" class="gold">Try my plan</button><button id="signal-guide">Finish together</button></div>',TABLE+GIVENS,'ONE STEP SHOWN');$('back-signal').onclick=()=>this.signal(true);this.bindOnce($('signal-guide'),()=>this.teach('worked-route'));return;}
  this.panel('The signal together','<p>22 − 2 = 20. Then 20 ÷ 5 = <b>'+SIGNAL_ROUTE.k+' coils</b>.</p><p>Check: 5 × '+SIGNAL_ROUTE.k+' + 2 = <b>'+SIGNAL_ROUTE.S+'</b>. Set the dial to 22.</p><button id="send-together" class="gold">Send it together</button>',TABLE+GIVENS,'WORKED TOGETHER');
  this.bindOnce($('send-together'),async()=>{if(await this.commit({type:'signal',guided:true}))this.fired();});
 }
 done(){this.scene('The relay answers','signalDone','<button id="go-shelter" class="gold">Go to the shelter</button>');$('go-shelter').onclick=()=>this.shelter();}
 shelter(){this.scene('A lit shelter','shelter','<button id="rest-here" class="gold">Rest here</button>');this.bindOnce($('rest-here'),async()=>{if(this.read().story.rested||await this.commit({type:'rest'}))this.finished();});}
 finished(){
  const s=this.read(),last=s.evidence.findLast(e=>e.content===SIGNAL.content&&e.kind!=='help'),how=last?.kind==='guided'?'You sent the signal together with Iona.':last?.support==='assisted'?'You sent the signal after looking at an example.':'You worked out the signal yourself.';
  this.panel('End of chapter one','<p>Bellwether is lit. Iona has brought out the letters, the boats can see the harbour, and Gran’s road north is waiting.</p><p>'+how+'</p><p>You can keep exploring the harbour, or press Stop to rest here.</p><div class="row"><button id="replay-log">Hear Gran’s log again</button><button id="replay-road">See the road north again</button><button id="repair-board">Harbour repair board</button><button id="keep-exploring" class="gold">Keep exploring</button></div>');
  $('repair-board').onclick=()=>this.review();$('replay-log').onclick=()=>this.log();$('replay-road').onclick=()=>this.beam();$('keep-exploring').onclick=()=>this.close();
  const b=document.createElement('button');b.id='outgoing-messages';b.className='gold';b.textContent='Help with the outgoing messages';b.onclick=()=>this.messages();$('panel-body').append(b);
 }
}
