// Cast timeline in seconds: sockets load 0–0.6, strength column fills 0.6–1.7, pulse travels 1.7–2.6, impact at 2.6.
import {strength} from '../combat/CombatSystem.js';
export const CAST={load:.6,fill:1.7,impact:2.6,duration:3};
export function rigDisplay(q,idle,time,demo){
 if(q){const n=q.rig,E=strength(n),t=q.t;return {n,loaded:Math.min(n,Math.ceil(Math.max(0,t)/CAST.load*n)),lit:t<CAST.load?0:Math.min(E,Math.floor((t-CAST.load)/(CAST.fill-CAST.load)*E)+1),spinning:t<CAST.fill};}
 if(demo){const n=1+Math.floor(time/2.4)%3,t=time%2.4;return {n,loaded:Math.min(n,Math.ceil(t/.5*n)),lit:t<.5?0:Math.min(strength(n),Math.floor((t-.5)/1.2*strength(n))+1),spinning:t<1.7};}
 return idle?{n:idle,loaded:idle,lit:strength(idle),spinning:false}:{n:0,loaded:0,lit:0,spinning:false};
}
