import {validateV4} from './schema-v4.js';
import {REVIEW_PREFIX,validateReview} from '../math/review.js';
import {need,obj} from '../math/validation.js';
export function validateV5(s){
 need(obj(s)&&s.version===5,'version');
 need(Array.isArray(s.evidence)&&new Set(s.evidence.map(e=>e?.id)).size===s.evidence.length,'global evidence identity');
 const base={...s,version:4,evidence:s.evidence.filter(e=>!e?.content?.startsWith(REVIEW_PREFIX))};
 validateV4(base,false);validateReview(s);return s;
}
