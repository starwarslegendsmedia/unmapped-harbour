import {validateV4} from './schema-v4.js';
import {validateV5} from './schema-v5.js';
import {MESSAGE_CONTENT,messageInitial,validateMessages} from '../math/messages.js';
import {validateV2Fresh,rootKeys} from './schema-v2-fresh.js';
import {validateV3} from './schema-v3.js';
import {SIGNAL,signalInitial,storyInitial,validateStory} from '../math/signal.js';
import {combatInitial,calibrationInitial} from '../combat/CombatSystem.js';
import {need,obj,exact} from '../math/validation.js';
import {initial} from '../math/rules.js';
import {waterInitial,mixInitial,batchInitial} from '../math/encounters.js';
import {validateV2} from './schema-v2.js';
import {validateV1} from './schema-v1.js';
export function validate(s){
 need(obj(s)&&s.version===6,'version');
 need(Array.isArray(s.evidence)&&new Set(s.evidence.map(e=>e?.id)).size===s.evidence.length,'global evidence identity');
 const base={...s,version:5,evidence:s.evidence.filter(e=>e?.content!==MESSAGE_CONTENT)};delete base.messages;
 validateV5(base);validateMessages(s);return s;
}
export function migrate(s){
 if(s.version===1){validateV1(s);s={...s,version:2,water:waterInitial(),mix:mixInitial()};}
 else if(s.version===2&&!Object.hasOwn(s.mix??{},'fresh')){validateV2(s);s={...s,mix:{...s.mix,fresh:batchInitial()}};}
 if(s.version===2){validateV2Fresh(s);s={...s,version:3,calibration:calibrationInitial(),combat:combatInitial(),timing:[],settings:{...s.settings,timingWindow:.5}};}
 if(s.version===3){validateV3(s);s={...s,version:4,story:storyInitial(),signal:signalInitial(),settings:{...s.settings,muted:false}};}
 if(s.version===4){validateV4(s);s=structuredClone(s);s.version=5;let seenSignal=false;for(const e of s.evidence){if(e.content===SIGNAL.content&&e.kind!=='help'){if(seenSignal)e.support='assisted';seenSignal=true;}}}
 if(s.version===5){validateV5(s);s={...structuredClone(s),version:6,messages:messageInitial()};}
 return validate(s);
}
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
export function encode(state){validate(state);const data=JSON.stringify(state);const raw=JSON.stringify({format:1,checksum:checksum(data),data});need(raw.length<=8e6,'save size');return raw;}
export function decode(raw){need(typeof raw==='string'&&raw.length<=8e6,'file size');const box=JSON.parse(raw);need(exact(box,['format','checksum','data'])&&box.format===1&&typeof box.data==='string'&&checksum(box.data)===box.checksum,'checksum');return migrate(JSON.parse(box.data));}
export class SaveStore {
 static async open(name='unmapped-harbour'){
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Another old tab is holding the save database open.'));});return new SaveStore(db);
 }
 constructor(db){this.db=db;this.expected=null;this.expectedValid=false;this.migratedRaw=null;db.onversionchange=()=>db.close();}
 read(key){return new Promise((resolve,reject)=>{const t=this.db.transaction('saves','readonly');const r=t.objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);});}
 async load(){this.expected=await this.read('current');this.expectedValid=false;this.migratedRaw=null;if(this.expected===null)return {state:initial()};try{const state=decode(this.expected);this.expectedValid=true;if(JSON.stringify(JSON.parse(JSON.parse(this.expected).data))!==JSON.stringify(state))this.migratedRaw=this.expected;return {state};}catch(error){let backup=null;try{backup=decode(await this.read('backup'));}catch{}return {error:error.message,backup,raw:this.expected};}}
 async write(state,{replace=false}={}){
  const raw=encode(state),expected=this.expected,validExpected=this.expectedValid,migratedRaw=this.migratedRaw;
  await new Promise((resolve,reject)=>{const t=this.db.transaction('saves','readwrite'),store=t.objectStore('saves');let error;
   const r=store.get('current');r.onsuccess=()=>{try{const actual=r.result??null;if(actual!==expected){error=new Error('Save conflict: another tab has changed this adventure.');t.abort();return;}
    if(migratedRaw!==null){store.put(migratedRaw,'migration-v6');const prior=store.get('migration');prior.onsuccess=()=>{if(prior.result===undefined)store.put(migratedRaw,'migration');};}
    if(actual!==null&&validExpected){if(replace)store.put(actual,'recovery');store.put(actual,'backup');}
    store.put(raw,'current');
   }catch(e){error=e;t.abort();}};
   t.oncomplete=()=>resolve();t.onerror=()=>reject(error??t.error??new Error('Save write failed.'));t.onabort=()=>reject(error??t.error??new Error('Save write failed.'));
  });this.expected=raw;this.expectedValid=true;this.migratedRaw=null;return state;
 }
 async recovery(key='recovery'){need(['recovery','migration','migration-v6'].includes(key),'recovery key');const raw=await this.read(key);return raw===null?null:decode(raw);}
 close(){this.db.close();}
}
