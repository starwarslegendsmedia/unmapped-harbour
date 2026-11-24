const $=id=>document.getElementById(id);
export const INTRO={
 bridge:{title:'A plank to reach the harbour',voice:'goal-bridge',text:'The crossing is broken. We need a plank to reach the pump court. The plank must cover the water and rest on both stone supports.',action:'Choose the plank length',detail:'The brown blocks are the stone supports, also called bearings. Each needs 0.20 m of plank on top. The fitting space accepts a plank up to 3.50 m long.'},
 water:{title:'Water for the lighthouse',voice:'goal-water',text:'The big lighthouse needs water to cool the light inside it. The small round tank beside the crossing has the water. We will send it through the pipes, keeping some in the tank for emergencies.',action:'Read the tank',detail:'The tall tower is the lighthouse, also called the beacon. The short blue cylinder is the water tank. First, work out how much water is inside it. Each following screen asks for one part of your plan.'},
 mixture:{title:'A clear lens for the lighthouse',voice:'goal-mixture',text:'The glass lens inside the lighthouse needs a mixture of two liquids. Amber and clear liquid must keep the stated ratio and fill the capsule to its required total. First compare a part with the whole mixture.',action:'Look at the mixture',detail:'A ratio compares the two liquids. The total is both liquids together. Iona can show how the equal parts work.'},
 rig:{title:'Test the light machine',voice:'goal-rig',text:'This machine sends a burst of light, called a pulse. Use it to break two barriers inside the lighthouse. First, choose a rule and predict a test pulse.',action:'Look at the machine',detail:'The six round sockets take power cells (small batteries). n means cells loaded. E means pulse strength. A prediction is your answer before a test.'},
 combat:{title:'Light through the barriers',voice:'goal-combat',text:'Two Grey barriers block the lens. Choose cells for a light pulse and predict its strength. Casting uses up those cells. A barrier that survives sends a counter pulse. You can plan without a timer.',action:'Plan the next move',detail:'Break both barriers. The cell bank, remaining barrier strength and guard are shown while you plan. Timing affects defence only.'},
 signal:{title:'Reach the northern boats',voice:'goal-signal',text:'The northern boats need a signal of exactly twenty two. Choose how many coils to switch on, then set the dial to the strength they will make. Sending uses the spring; a wrong signal can be rewound.',action:'Plan the signal',detail:'A coil is a switchable part of the relay. The table and rule show how coils change signal strength.'}
};
export class TaskIntro{
 constructor({panel,world}){this.panel=panel;this.world=world;}
 show(key,next,givens='',panel=this.panel){
  const d=INTRO[key];panel(d.title,'<div class="task-intro"><p>'+d.text+'</p><p>'+d.detail+'</p></div>',givens,'YOUR NEXT TASK');
  $('panel-body').className='mechanism task-goal'+(key==='rig'?' machine-demo':'');
  const footer=$('panel-footer');footer.hidden=false;footer.innerHTML='<button id="task-begin" class="gold">'+d.action+'</button><button id="goal-replay">Hear again</button>';
  $('task-begin').onclick=next;
  // panel() supplies automatic speech and its replay. Keep that replay beside the action.
  const replay=$('teaching-replay');if(replay){$('goal-replay').onclick=replay.onclick;replay.remove();}
  if(key==='bridge'){this.world.focus=true;this.world.workLoop=true;if(this.world.reducedMotion)$('givens').querySelector('.plank-demo')?.style.setProperty('animation','none');}
 }
}
