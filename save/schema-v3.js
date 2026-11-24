import {rootKeys,validateV2Fresh} from './schema-v2-fresh.js';
import {CALIBRATION,SPELL} from '../combat/CombatSystem.js';
import {validateCombat} from '../combat/validate.js';
import {need,obj,finite,exact} from '../math/validation.js';
// Version 3: the chamber, calibration and timing added to version 2. Kept unchanged so version 4 can check its part.
export function validateV3(s){
 need(obj(s)&&s.version===3&&exact(s,[...rootKeys,'water','mix','calibration','combat','timing']),'version/fields');
 const base=Object.fromEntries([...rootKeys,'water','mix'].map(k=>[k,s[k]]));base.version=2;base.help=Object.fromEntries(Object.entries(s.help??{}).filter(([k])=>k!=='spell'));base.evidence=s.evidence?.filter(e=>![SPELL.content,CALIBRATION.content].includes(e.content));base.settings={...s.settings};delete base.settings.timingWindow;validateV2Fresh(base);
 need(obj(s.help)&&Object.keys(s.help).every(k=>['bridge','water','mixture','spell'].includes(k)&&s.help[k]===true),'help tasks');need(Array.isArray(s.evidence)&&s.evidence.length<=10000,'evidence size');need(finite(s.settings.timingWindow,.2,1.2),'timing window');validateCombat(s);return s;
}
