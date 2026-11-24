import {rootKeys} from './schema-v2-fresh.js';
import {validateV3} from './schema-v3.js';
import {SIGNAL,validateStory} from '../math/signal.js';
import {need,obj,exact} from '../math/validation.js';
export const V3_KEYS=Object.freeze([...rootKeys,'water','mix','calibration','combat','timing']);
// Version 4 adds the ending (story), the fresh signal task and the mute setting. Its version 3 part is checked by the
// unchanged version 3 rules, with the signal's teaching and evidence taken out first.
export function validateV4(s,legacy=true){
 need(obj(s)&&s.version===4&&exact(s,[...V3_KEYS,'story','signal']),'version/fields');
 const base=Object.fromEntries(V3_KEYS.map(k=>[k,s[k]]));base.version=3;base.help=Object.fromEntries(Object.entries(s.help??{}).filter(([k])=>k!=='signal'));base.evidence=Array.isArray(s.evidence)?s.evidence.filter(e=>e?.content!==SIGNAL.content):s.evidence;base.settings={...s.settings};delete base.settings.muted;validateV3(base);
 need(typeof s.settings.muted==='boolean','mute setting');need(Object.keys(s.help).every(k=>['bridge','water','mixture','spell','signal'].includes(k)&&s.help[k]===true),'help tasks');validateStory(s,legacy);return s;
}
