// Sound for the harbour: three buses (music, effects, speech) under one master gain. Nothing plays until a tap or key
// press unlocks the browser's audio. Effects and the sea ambience are made in code, so the game always has sound;
// music is optional, listed in audio/tracks.json, and a missing file is noted once and never fetched again. Speech is
// the voiced story lines (voices/index.json): music dips while a line plays, a new line or closing its panel stops the
// old one, and leaving the page suspends everything until the player returns.
import {LINES} from '../story/lines.js';
const DUCK=.3;
export class AudioManager {
 constructor({fetcher=(...a)=>fetch(...a),base='./'}={}){
  this.fetcher=fetcher;this.base=base;this.ctx=null;this.settings={music:.35,effects:.6,speech:.6,muted:false};this.tracks=null;this.missing=new Set();this.buffers=new Map();this.requests=new Map();
  this.index=null;this.speaking=null;this.queue=[];this.played=[];this.effectsPlayed=[];this.music=null;this.wantMusic=null;this.ambience=null;this.hiddenSuspend=false;this.unvoiced=new Set();
 }
 // Called from a user gesture. Safari and Chrome refuse to start audio any other way.
 unlock(){
  try{
   if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return false;this.ctx=new AC();const c=this.ctx;
    this.master=c.createGain();this.master.connect(c.destination);this.bus={};for(const k of ['music','effects','speech']){this.bus[k]=c.createGain();this.bus[k].connect(this.master);}
    this.duck=c.createGain();this.duck.connect(this.bus.music);this.apply(this.settings);
    c.onstatechange=()=>{if(c.state==='interrupted'||c.state==='suspended')this.interrupted=!this.hiddenSuspend;};
    this.startAmbience();if(this.wantMusic)this.playMusic(this.wantMusic);}
   if(this.ctx.state!=='running'&&!document.hidden){this.ctx.resume();this.interrupted=false;}
   return true;
  }catch{this.ctx=null;return false;}
 }
 get unlocked(){return !!this.ctx;}
 apply(settings){
  this.settings={...this.settings,...settings};if(!this.ctx)return;const t=this.ctx.currentTime,q=this.settings;
  this.master.gain.setTargetAtTime(q.muted?0:1,t,.03);for(const k of ['music','effects','speech'])this.bus[k].gain.setTargetAtTime(q[k],t,.03);
 }
 // Leaving the page suspends the audio clock, so a line resumes where it stopped; returning resumes it.
 visibility(hidden){if(!this.ctx)return;if(hidden){this.hiddenSuspend=true;this.ctx.suspend();}else{this.hiddenSuspend=false;this.ctx.resume();}}
 // One fetch per file, ever: a failed file is remembered as missing, so absent music cannot cause a retry loop.
 async buffer(url){
  if(this.missing.has(url))return null;if(this.buffers.has(url))return this.buffers.get(url);if(this.requests.has(url))return this.requests.get(url);
  const work=(async()=>{try{const r=await this.fetcher(this.base+url);if(!r.ok)throw Error(r.status);const data=await r.arrayBuffer();const b=await this.ctx.decodeAudioData(data);this.buffers.set(url,b);return b;}catch{this.missing.add(url);return null;}finally{this.requests.delete(url);}})();
  this.requests.set(url,work);return work;
 }
 async manifest(){if(this.tracks)return this.tracks;try{const r=await this.fetcher(this.base+'audio/tracks.json');this.tracks=r.ok?(await r.json()).tracks??{}:{};}catch{this.tracks={};}return this.tracks;}
 async playMusic(id){
  this.wantMusic=id;if(!this.ctx||this.music?.id===id)return;const tracks=await this.manifest(),track=tracks[id];this.stopMusic();if(!track)return;
  for(const file of track.files??[]){if(!this.canPlay(file))continue;const b=await this.buffer(file);if(!b)continue;if(this.wantMusic!==id)return;const src=this.ctx.createBufferSource();src.buffer=b;src.loop=true;src.connect(this.duck);src.start();this.music={id,src,file};return;}
 }
 canPlay(file){const ext=file.split('.').pop();const probe=globalThis.document?.createElement('audio');return !probe||probe.canPlayType(ext==='ogg'?'audio/ogg':'audio/mpeg')!=='';}
 stopMusic(){try{this.music?.src.stop();}catch{}this.music=null;}
 // The sea: filtered noise with a slow swell, on the effects bus, so it stays when there is no music.
 startAmbience(){
  if(!this.ctx||this.ambience)return;const c=this.ctx,len=c.sampleRate*4,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.5;}
  const src=c.createBufferSource();src.buffer=b;src.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;const swell=c.createGain();swell.gain.value=.22;const lfo=c.createOscillator();lfo.frequency.value=.11;const depth=c.createGain();depth.gain.value=.12;lfo.connect(depth).connect(swell.gain);
  src.connect(filter).connect(swell).connect(this.bus.effects);src.start();lfo.start();this.ambience={src,lfo};
 }
 tone(freq,{at=0,dur=.25,vol=.16,type='sine',glide=0}={}){const c=this.ctx,t=c.currentTime+at,g=c.createGain(),o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t);if(glide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*glide),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(this.bus.effects);o.start(t);o.stop(t+dur+.05);}
 noise(dur,freq,vol=.15,at=0){const c=this.ctx,t=c.currentTime+at,len=Math.ceil(c.sampleRate*dur),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f).connect(g).connect(this.bus.effects);s.start(t);}
 // Short effects, named as in the plan's track ids.
 effect(id){
  this.effectsPlayed.push(id);if(this.effectsPlayed.length>200)this.effectsPlayed.shift();if(!this.ctx||this.ctx.state!=='running')return;
  const fx={
   sfx_ui:()=>this.tone(660,{dur:.08,vol:.08}),
   sfx_saw:()=>{for(let i=0;i<4;i++)this.noise(.12,2400,.12,i*.18);},
   sfx_valve:()=>{this.tone(180,{dur:.4,type:'triangle',glide:.7,vol:.12});this.noise(.9,700,.08,.2);},
   sfx_pour:()=>this.noise(1.2,1100,.07),
   sfx_cast:()=>this.tone(330,{dur:1.2,type:'triangle',glide:2.4,vol:.12}),
   sfx_impact:()=>{this.noise(.35,300,.22);this.tone(110,{dur:.5,type:'sine',glide:.5,vol:.18});},
   sfx_timed_hit:()=>{this.tone(880,{dur:.12,vol:.14});this.tone(1320,{at:.06,dur:.18,vol:.1});},
   sfx_glyph_solved:()=>[523,659,784].forEach((f,i)=>this.tone(f,{at:i*.09,dur:.3,vol:.1})),
   sfx_misfire:()=>{this.tone(240,{dur:.5,type:'sawtooth',glide:.5,vol:.07});this.noise(.3,500,.1,.1);},
   sfx_beam:()=>[392,494,587,784].forEach((f,i)=>this.tone(f,{at:i*.25,dur:1.4,vol:.08,type:'triangle'})),
   sfx_signal:()=>[784,784,1046].forEach((f,i)=>this.tone(f,{at:i*.2,dur:.15,vol:.1})),
  }[id];fx?.();
 }
 // A scene is a list of line ids spoken one after another. say() stops whatever was speaking first.
 async say(ids){
  this.stopSpeech();const token=this.token=Symbol('scene');if(!this.ctx||this.settings.muted||!this.settings.speech)return;
  if(!this.index){try{const r=await this.fetcher(this.base+'voices/index.json');this.index=r.ok?await r.json():{};}catch{this.index={};}}
  for(const id of ids){
   if(this.token!==token)return;const line=LINES[id],file=line&&this.index[line.voice]?.[line.text];if(!file){this.unvoiced.add(id);continue;}
   const b=await this.buffer('voices/'+file);if(this.token!==token)return;if(!b){this.unvoiced.add(id);continue;}
   await new Promise(resolve=>{const src=this.ctx.createBufferSource();src.buffer=b;src.connect(this.bus.speech);const t=this.ctx.currentTime;this.duck.gain.setTargetAtTime(DUCK,t,.08);src.onended=()=>{if(this.speaking?.src===src)this.speaking=null;resolve();};this.speaking={id,src,resolve};this.played.push(id);src.start();});
  }
  if(this.token===token&&this.ctx)this.duck.gain.setTargetAtTime(1,this.ctx.currentTime,.3);
 }
 stopSpeech(){this.token=null;const s=this.speaking;this.speaking=null;if(s){try{s.src.onended=null;s.src.stop();}catch{}s.resolve();}if(this.ctx)this.duck.gain.setTargetAtTime(1,this.ctx.currentTime,.2);}
 state(){return {unlocked:!!this.ctx,context:this.ctx?.state??'none',interrupted:!!this.interrupted,muted:this.settings.muted,gains:this.ctx?{master:this.master.gain.value,music:this.bus.music.gain.value,effects:this.bus.effects.gain.value,speech:this.bus.speech.gain.value,duck:this.duck.gain.value}:null,speaking:this.speaking?.id??null,played:[...this.played],unvoiced:[...this.unvoiced],music:this.music?.id??null,missing:[...this.missing],ambience:!!this.ambience,effects:[...this.effectsPlayed]};}
}
