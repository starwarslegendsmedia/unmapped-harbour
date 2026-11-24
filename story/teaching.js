import {INTRO} from './TaskIntro.js';
export const TEACHING_LINES={
 'water-extra':{voice:'iona',who:'Iona',text:'Choose an extra repair. Water can power the letter room door or the boat lift. Each repair needs at least twelve litres. Your plan must also supply the lighthouse and leave emergency water in the tank.'},
 'water-repair':{voice:'iona',who:'Iona',text:'How much water will you send to your chosen repair? Each repair needs at least twelve litres. If you chose both, this amount goes to each one. Check that your whole plan leaves the emergency water in the tank. Then press Send the water.'},
 'water-reading':{voice:'iona',who:'Iona',text:'The small round tank can fit eighty litres. It is three quarters full. How much water is in the tank now? Enter the amount in litres.'},
 'water-emergency':{voice:'iona',who:'Iona',text:'Some water must stay in the tank for emergencies. Keep twenty five percent of the full eighty litres. How many litres must stay in the tank?'},
 'water-lighthouse':{voice:'iona',who:'Iona',text:'Now choose how much water to send from the tank to the big lighthouse. It needs at least twenty four litres to cool the light inside it. Leave enough in the tank for emergencies and your extra repair.'},
 ...Object.fromEntries(Object.values(INTRO).map(d=>[d.voice,{voice:d.voice==='goal-bridge'?'ambrose':'iona',who:d.voice==='goal-bridge'?'Ambrose':'Iona',text:d.text}])),
 'goal-leftover':{voice:'ambrose',who:'Ambrose',text:'The leftover is the wood that remains after cutting your plank. Work out its length so we can label it for later use. The full piece and your planned plank length stay on screen. No cut has been made.'},
 "bridge-example": {
  "voice": "ambrose",
  "who": "Ambrose",
  "text": "The example gap is two metres. Add ten centimetres at each end: two point two metres. Four metres of stock minus two point two leaves one point eight metres. On our crossing, add both bearings, then subtract the cut from the stock."
 },
 "bridge-guided": {
  "voice": "ambrose",
  "who": "Ambrose",
  "text": "Two point eight five plus zero point two is three point zero five. Add the other zero point two: three point two five metres. Four point eight minus three point two five leaves one point five five metres. We will make this cut together."
 },
 "water-example": {
  "voice": "iona",
  "who": "Iona",
  "text": "A different tank has forty litres capacity and is half full, so it holds twenty litres. A reserve of twenty five percent of its capacity is ten litres. For our tank, find one quarter of eighty litres. Three quarters are inside. Keep one quarter, then subtract the outlets."
 },
 "water-step": {
  "voice": "iona",
  "who": "Iona",
  "text": "The reserve uses the full eighty litres. Eighty divided by four gives one quarter. Multiply that by three for the current content. Keep one part in the tank. Subtract the cooling and repair outlets, then compare what remains with the reserve."
 },
 "water-guided": {
  "voice": "iona",
  "who": "Iona",
  "text": "Eighty times three quarters is sixty litres. The reserve is eighty divided by four: twenty litres. After twenty four litres of cooling, thirty six remain. A twelve litre repair leaves twenty four litres, four above the reserve."
 },
 "mix-sample": {
  "voice": "iona",
  "who": "Iona",
  "text": "Two amber parts and three clear parts make five equal parts. In a ten millilitre sample, each part is two millilitres. Four amber plus six clear make ten. Amber is two fifths of the whole; two to three compares amber with clear."
 },
 "spell-sample": {
  "voice": "iona",
  "who": "Iona",
  "text": "The machine adds three strength for each power cell. Its starter adds four strength once. One cell makes seven. Two make ten. Three make thirteen. E is the pulse strength. n is the number of cells. E equals three times n plus four."
 },
 "spell-step": {
  "voice": "iona",
  "who": "Iona",
  "text": "Three n plus four means three times n, then add four once. It is different from three times the sum of n and four. For two cells, three times two plus four makes ten. Use this order for your new prediction."
 },
 "spell-route": {
  "voice": "iona",
  "who": "Iona",
  "text": "Rest at the chamber checkpoint. Four cells make sixteen strength for the first barrier. One cell makes seven for the second. Both barriers break before a counter pulse, and one cell remains. We will make these predictions together."
 },
 "signal-example": {
  "voice": "iona",
  "who": "Iona",
  "text": "A different relay follows S equals four times k plus three and needs fifteen. Take away the three: twelve remain. Divide by four: three coils. Check: four times three plus three is fifteen. Our relay follows five times k plus two and needs twenty two."
 },
 "signal-step": {
  "voice": "iona",
  "who": "Iona",
  "text": "Our relay adds two once. Twenty two minus two leaves twenty. Each coil adds five. How many fives make twenty? Then set the dial to the strength those coils make."
 },
 "signal-guided": {
  "voice": "iona",
  "who": "Iona",
  "text": "Twenty two minus two is twenty. Twenty divided by five is four coils. Check: five times four plus two equals twenty two. Switch on four coils and set the dial to twenty two. We will send it together."
 },
 "mix-step-30": {
  "voice": "iona",
  "who": "Iona",
  "text": "There are two plus three, or five equal parts. thirty divided by five gives one part. Use two parts for amber and three for clear. Check the amounts add to thirty. Amber is two fifths of the whole."
 },
 "mix-guided-30": {
  "voice": "iona",
  "who": "Iona",
  "text": "thirty divided by five is six millilitres per part. Two parts give twelve millilitres amber; three give eighteen clear. Together they make thirty. Amber is two fifths of the whole. We will pour this one together."
 },
 "mix-step-40": {
  "voice": "iona",
  "who": "Iona",
  "text": "There are two plus three, or five equal parts. forty divided by five gives one part. Use two parts for amber and three for clear. Check the amounts add to forty. Amber is two fifths of the whole."
 },
 "mix-guided-40": {
  "voice": "iona",
  "who": "Iona",
  "text": "forty divided by five is eight millilitres per part. Two parts give sixteen millilitres amber; three give twenty four clear. Together they make forty. Amber is two fifths of the whole. We will pour this one together."
 },
 "rig-guided-4": {
  "voice": "iona",
  "who": "Iona",
  "text": "Three times four is twelve. Add the four point starter to make sixteen strength. We will make this test together."
 },
 "rig-guided-5": {
  "voice": "iona",
  "who": "Iona",
  "text": "Three times five is fifteen. Add the four point starter to make nineteen strength. We will make this test together."
 },
 "rig-guided-6": {
  "voice": "iona",
  "who": "Iona",
  "text": "Three times six is eighteen. Add the four point starter to make twenty two strength. We will make this test together."
 },
 "pulse-1": {
  "voice": "iona",
  "who": "Iona",
  "text": "Use one cells. Three times one plus four is seven. We will cast this pulse together."
 },
 "pulse-2": {
  "voice": "iona",
  "who": "Iona",
  "text": "Use two cells. Three times two plus four is ten. We will cast this pulse together."
 },
 "pulse-3": {
  "voice": "iona",
  "who": "Iona",
  "text": "Use three cells. Three times three plus four is thirteen. We will cast this pulse together."
 },
 "pulse-4": {
  "voice": "iona",
  "who": "Iona",
  "text": "Use four cells. Three times four plus four is sixteen. We will cast this pulse together."
 },
 "review-bridge-0": {
  "voice": "iona",
  "who": "Iona",
  "text": "three hundred and ten plus fifteen plus fifteen is three hundred and forty centimetres. The stock is five hundred and twenty, so the offcut is one hundred and eighty centimetres. This is a worked plan."
 },
 "review-bridge-1": {
  "voice": "iona",
  "who": "Iona",
  "text": "two hundred and seventy five plus twenty five plus twenty five is three hundred and twenty five centimetres. The stock is four hundred and sixty, so the offcut is one hundred and thirty five centimetres. This is a worked plan."
 },
 "review-bridge-2": {
  "voice": "iona",
  "who": "Iona",
  "text": "three hundred and eighty five plus twenty plus twenty is four hundred and twenty five centimetres. The stock is six hundred, so the offcut is one hundred and seventy five centimetres. This is a worked plan."
 },
 "review-water-0": {
  "voice": "iona",
  "who": "Iona",
  "text": "one hundred litres times four divided by five gives eighty litres inside. thirty percent of full capacity is thirty litres of reserve. Plan A leaves forty litres, enough to protect the reserve. This is a worked plan."
 },
 "review-water-1": {
  "voice": "iona",
  "who": "Iona",
  "text": "one hundred and twenty litres times three divided by four gives ninety litres inside. twenty five percent of full capacity is thirty litres of reserve. Plan A leaves forty eight litres, enough to protect the reserve. This is a worked plan."
 },
 "review-water-2": {
  "voice": "iona",
  "who": "Iona",
  "text": "one hundred and sixty litres times three divided by four gives one hundred and twenty litres inside. twenty five percent of full capacity is forty litres of reserve. Plan A leaves fifty six litres, enough to protect the reserve. This is a worked plan."
 },
 "review-mixture-0": {
  "voice": "iona",
  "who": "Iona",
  "text": "thirty five divided by five gives seven millilitres per part. Amber uses twenty one millilitres, clear uses fourteen. Amber is three out of five equal parts of the whole. This is a worked plan."
 },
 "review-mixture-1": {
  "voice": "iona",
  "who": "Iona",
  "text": "forty eight divided by four gives twelve millilitres per part. Amber uses twelve millilitres, clear uses thirty six. Amber is one out of four equal parts of the whole. This is a worked plan."
 },
 "review-mixture-2": {
  "voice": "iona",
  "who": "Iona",
  "text": "sixty four divided by eight gives eight millilitres per part. Amber uses twenty four millilitres, clear uses forty. Amber is three out of eight equal parts of the whole. This is a worked plan."
 }
};
const REVIEW_MATCH=[["310 + 15 +", "review-bridge-0"], ["275 + 25 +", "review-bridge-1"], ["385 + 20 +", "review-bridge-2"], ["100 \u00d7 4/5", "review-water-0"], ["120 \u00d7 3/4", "review-water-1"], ["160 \u00d7 3/4", "review-water-2"], ["35 \u00f7 5", "review-mixture-0"], ["48 \u00f7 4", "review-mixture-1"], ["64 \u00f7 8", "review-mixture-2"]];
const TITLES={"Ambrose’s measuring trick": "bridge-example", "Both bearings matter": "bridge-guided", "Which whole does the fraction use?": "water-example", "A protected quarter": "water-guided", "Iona’s five-part sample": "mix-sample", "How the light machine works": "spell-sample", "Multiply, then add the starter": "spell-step", "A complete route through the chamber": "spell-route", "A different relay": "signal-example", "Undo the starter first": "signal-step", "The signal together": "signal-guided"};
export function teachingFor(title,body){
 let id=({'Choose an extra repair':'water-extra','Read the water tank':'water-reading','Keep emergency water':'water-emergency','Send water to the lighthouse':'water-lighthouse'})[title]??Object.values(INTRO).find(d=>d.title===title)?.voice??(title==='Keep the leftover timber'?'goal-leftover':TITLES[title]);if(title.startsWith('Send water to ')&&title!=='Send water to the lighthouse')id='water-repair';if(title==='Worked maintenance plan')id=REVIEW_MATCH.find(([needle])=>body.includes(needle))?.[1];
 if(title==='Which whole does the fraction use?'&&body.includes('80 ÷ 4'))id='water-step';
 if(title==='One part at a time'||title==='A complete lens capsule'){const total=body.includes('40')?40:30;id=(title==='One part at a time'?'mix-step-':'mix-guided-')+total;}
 if(title==='A worked test pulse')id='rig-guided-'+(/Three times (\d+)/.exec(body)?.[1]??4);
 if(title==='A pulse together')id='pulse-'+(/Use (\d+) cells/.exec(body)?.[1]??1);
 return id?[id]:null;
}
