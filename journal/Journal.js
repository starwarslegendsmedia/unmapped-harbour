import {CLUES,LIMITS} from '../math/rules.js';
import {strength,SPELL,CALIBRATION} from '../combat/CombatSystem.js';
const RULES={'3n+4':strength,'3(n+4)':n=>3*(n+4),'n+7':n=>n+7},SHOW={'3n+4':'E = 3n + 4','3(n+4)':'E = 3(n + 4)','n+7':'E = n + 7'};
// The rig entry is derived from saved evidence: each hypothesis test, chamber pulse and what it supports or contradicts.
export function rigEntry(state){
 const rows=state.evidence.filter(e=>[CALIBRATION.content,SPELL.content].includes(e.content)&&e.kind!=='help').map(e=>{
  const a=e.actual,where=e.content===CALIBRATION.content?'Rig test':'Chamber pulse';
  if(e.kind==='guided')return '<li>'+where+' together: n = '+a.n+' → E = '+a.E+' (worked with help).</li>';
  const rule=e.inputs.rule??'3n+4',fits=RULES[rule](a.n)===a.E;
  return '<li>'+where+': '+SHOW[rule]+', n = '+a.n+'. You predicted '+e.inputs.prediction+'; the rig made <b>'+a.E+'</b>. '+(fits?'The rig supports this hypothesis.':'The rig contradicts this hypothesis.')+(e.inputs.prediction===a.E?' Prediction ✓':' Prediction ✗')+(e.novel?'':' (a value already seen, so not fresh evidence)')+'</li>';
 });
 return '<details open><summary>Rig relationship · E = 3n + 4</summary><p><span class="glyph">▲</span> three-tooth gear: 3 for each cell. <span class="glyph">■</span> square starter: 4 once. n is the cells loaded; E is strength.</p><p>Observed before testing: 1 → 7, 2 → 10, 3 → 13. Three results fit more than one rule; the gears and a new cell count are the stronger test.</p>'+(rows.length?'<ul class="tests">'+rows.join('')+'</ul>':'<p class="quiet">No test yet. The worked rig example is teaching.</p>')+'<p class="quiet">A supported hypothesis on this task is not yet mastery; later fresh work is needed.</p><div class="match" aria-label="Optional: match each mark to its meaning"><span class="quiet">Optional: tap a mark, then its meaning.</span><div class="row"><button data-glyph="gear">▲</button><button data-glyph="starter">■</button><button data-meaning="starter">4 added once</button><button data-meaning="gear">3 for each cell</button></div><span class="quiet match-status" role="status"></span></div></details>';
}
function bindMatch(root){
 let chosen=null;const status=root.querySelector('.match-status');if(!status)return;
 for(const b of root.querySelectorAll('[data-glyph]'))b.onclick=()=>{chosen=b.dataset.glyph;root.querySelectorAll('[data-glyph]').forEach(x=>x.classList.toggle('picked',x===b));status.textContent='Now tap what '+b.textContent+' means.';};
 for(const b of root.querySelectorAll('[data-meaning]'))b.onclick=()=>{if(!chosen){status.textContent='Tap ▲ or ■ first.';return;}status.textContent=chosen===b.dataset.meaning?(chosen==='gear'?'▲ means 3 for each cell: the 3n part.':'■ means 4 added once: the + 4 part.'):'Not that one. Look at the rig: which mark appears once?';if(chosen===b.dataset.meaning)b.classList.add('matched');chosen=null;root.querySelectorAll('[data-glyph]').forEach(x=>x.classList.remove('picked'));};
}
export class Journal {
 constructor({panel,read,stage,save,givens,back=()=>null}){Object.assign(this,{panel,read,stage,save,givens,back});this.flush=()=>Promise.resolve(true);}
 open(){
  this.flush();
  const state=this.read(),back=this.back();this.strokes=structuredClone(state.ink);
  const relationship=state.help.spell?rigEntry(state):'';const ratio=state.help.mixture?'<details><summary>Lens relationship · 2 : 3</summary><p>Two amber parts and three clear make five equal parts. Amber is 2/5 of the whole. '+(state.mix.fresh.done?'The 30 mL and fresh 40 mL capsules were completed with the introductory teaching available. Later independent work is still needed.':'The fresh batch is still to be checked.')+'</p></details>':'';
  this.panel('Your journal',relationship+ratio+'<p>'+state.clues.map(c=>CLUES[c]).join('<br>')+'</p><label for="working">Your working and observations</label><textarea id="working" maxlength="'+LIMITS.notes+'" placeholder="Write a method, calculation or clue…"></textarea><canvas id="ink" aria-label="Draw your working" width="840" height="240"></canvas><div class="row"><button id="clear-ink">Clear drawing</button><span id="working-status" class="quiet" role="status">Working stays on this browser.</span></div>',this.givens(),'CLUES & WORKING');
  if(back){const b=document.createElement('button');b.textContent='Return to the plan';b.id='working-return';b.onclick=()=>{this.flush();back();};document.getElementById('panel-body').prepend(b);}
  bindMatch(document.getElementById('panel-body'));const field=document.getElementById('working');field.value=state.notes;const canvas=document.getElementById('ink'),c=canvas.getContext('2d'),status=document.getElementById('working-status');let current=null,currentId=null,total=this.strokes.reduce((n,a)=>n+a.length,0),timer=null,dirty=false;
  const redraw=()=>{c.clearRect(0,0,840,240);c.strokeStyle='#ffd69a';c.lineWidth=3;c.lineCap='round';for(const stroke of this.strokes){if(!stroke.length)continue;c.beginPath();c.moveTo(stroke[0][0]*840,stroke[0][1]*240);for(const p of stroke)c.lineTo(p[0]*840,p[1]*240);if(stroke.length===1)c.lineTo(stroke[0][0]*840+.5,stroke[0][1]*240+.5);c.stroke();}};
  const stage=()=>{dirty=true;this.stage(field.value,this.strokes);status.textContent='Working kept; saving shortly…';clearTimeout(timer);timer=setTimeout(()=>this.flush(),500);};
  this.flush=async()=>{clearTimeout(timer);if(!dirty)return true;dirty=false;this.stage(field.value,this.strokes);status.textContent='Saving…';const ok=await this.save();if(status.isConnected)status.textContent=ok?'Working saved.':'Working kept for retry or export.';return ok;};
  field.addEventListener('input',stage);
  const point=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
  canvas.onpointerdown=e=>{if(current||this.strokes.length>=LIMITS.strokes||total>=LIMITS.inkPoints)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);current=[point(e)];currentId=e.pointerId;total++;this.strokes.push(current);dirty=true;redraw();};
  canvas.onpointermove=e=>{if(!current||e.pointerId!==currentId||current.length>=LIMITS.strokePoints||total>=LIMITS.inkPoints)return;current.push(point(e));total++;dirty=true;redraw();};
  const end=e=>{if(current&&e.pointerId===currentId){current=null;currentId=null;stage();}};canvas.onpointerup=end;canvas.onpointercancel=end;canvas.onlostpointercapture=end;
  document.getElementById('clear-ink').onclick=()=>{this.strokes=[];current=null;currentId=null;total=0;redraw();stage();};redraw();
 }
}
