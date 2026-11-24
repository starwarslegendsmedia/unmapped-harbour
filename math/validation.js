export function need(ok,label){if(!ok)throw new Error('Invalid save: '+label);}
export const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export const integer=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
export const finite=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
export const exact=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
