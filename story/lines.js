import {TEACHING_LINES} from './teaching.js';
import {MESSAGE_LINES} from './MessagesLines.js';
// Every voiced line in the harbour, in one place. The panels show this text and the speech player looks up the
// recording made from exactly this text (voices/index.json, written by tools/voice-adventure.mjs). Numbers that are
// spoken are written as words so the voice model reads them as words; the panels show the numerals beside them.
// voice is the cast entry in tools/voices/cast.json; who is the name shown beside the line.
export const LINES=Object.freeze({
 ...TEACHING_LINES,
 ...MESSAGE_LINES,
 'ambrose.remember.1':{voice:'ambrose',who:'Ambrose',text:'Your Gran once mended this harbour with me. Her last route is kept inside the lighthouse.'},
 'ambrose.remember.2':{voice:'ambrose',who:'Ambrose',text:'The light inside the big lighthouse has gone out. Water from the small round tank keeps that light cool. First, we need a way across.'},
 'ambrose.bridge-help':{voice:'ambrose',who:'Ambrose',text:'The gap is only the water. The timber must also rest on land.'},
 'ambrose.promise.1':{voice:'ambrose',who:'Ambrose',text:'Your Gran and I built a bypass. I thought keeping that secret would keep her route safe.'},
 'ambrose.promise.2':{voice:'ambrose',who:'Ambrose',text:'I remembered the promise. I forgot the people it was meant to help.'},
 'iona.hurry':{voice:'iona',who:'Iona',text:'The light inside the lighthouse has gone out. Please leave the letter room alone. The paper letters in there are important.'},
 'iona.farewell':{voice:'iona',who:'Iona',text:'Water was getting into the letter room. It could ruin people’s paper letters. I changed the pipes to keep the letters dry. That stopped cooling water reaching the lighthouse too. I meant to fix it before anyone needed the light.'},
 'narrator.beam':{voice:'narrator',who:'',text:'The northern lens turns. Light runs out across the water, and the Grey draws back from the harbour.'},
 'haveah.route':{voice:'girl',who:'Havéah',text:'There. Gran left her mark on the road north.'},
 'narrator.archive':{voice:'narrator',who:'',text:'The letter room door opens. The paper letters are dry. Iona carries the letters down to the wharf herself.'},
 'narrator.ferry':{voice:'narrator',who:'',text:'The ferry lift raises the message boat. Its crew wait at the wharf for the harbour’s letters.'},
 'iona.letters':{voice:'iona',who:'Iona',text:'I kept these dry for the people who wrote them. They were never mine to lock away.'},
 'iona.own':{voice:'iona',who:'Iona',text:'This one is my own farewell. I think I can open it now.'},
 'ambrose.stay.1':{voice:'ambrose',who:'Ambrose',text:'I should have told you about the bypass on the first night. No more secrets on this road.'},
 'haveah.stay':{voice:'girl',who:'Havéah',text:'Then stay beside me, and tell me everything you remember about Gran.'},
 'ambrose.stay.2':{voice:'ambrose',who:'Ambrose',text:'I will. Every part of it.'},
 'gran.log.1':{voice:'gran',who:'Gran’s beacon log',text:'I am going north on purpose. Something taken from the map makers has to go back to them.'},
 'gran.log.2':{voice:'gran',who:'Gran’s beacon log',text:'The old routes are being wiped away, one by one. When you find this, ask the map makers why.'},
 'haveah.question':{voice:'girl',who:'Havéah',text:'Who would want to wipe a road off the map?'},
 'iona.signal':{voice:'iona',who:'Iona',text:'One last job. The relay needs a signal of exactly twenty two to reach the northern boats.'},
 'iona.signal-done':{voice:'iona',who:'Iona',text:'The relay answers. Every boat in the north will see our light tonight.'},
 'iona.misfire':{voice:'iona',who:'Iona',text:'That signal was the wrong strength. Wind the relay spring, and we can send another.'},
 'narrator.shelter':{voice:'narrator',who:'',text:'A lit shelter waits beside the wharf. This is a good place to stop for tonight.'},
});
// The lines each scene plays, in order. A scene is spoken one line after another and can be replayed or stopped.
export const SCENES=Object.freeze({
 remember:['ambrose.remember.1','ambrose.remember.2'],
 promise:['ambrose.promise.1','ambrose.promise.2'],
 hurry:['iona.hurry'],farewell:['iona.farewell'],bridgeHelp:['ambrose.bridge-help'],
 beam:['narrator.beam','haveah.route'],
 helperArchive:['narrator.archive','iona.letters','iona.own'],
 helperFerry:['narrator.ferry','iona.letters','iona.own'],
 helperBoth:['narrator.archive','narrator.ferry','iona.letters','iona.own'],
 stay:['ambrose.stay.1','haveah.stay','ambrose.stay.2'],
 log:['gran.log.1','gran.log.2','haveah.question'],
 signal:['iona.signal'],signalDone:['iona.signal-done'],misfire:['iona.misfire'],shelter:['narrator.shelter'],
});
export const lineText=id=>LINES[id].text;
// The quoted HTML for a scene: each line with its speaker, the words exactly as voiced.
export const sceneHTML=name=>SCENES[name].map(id=>{const l=LINES[id];return '<p class="line">'+(l.who?'<b>'+l.who+':</b> ':'')+(l.voice==='narrator'?'':'“')+l.text+(l.voice==='narrator'?'':'”')+'</p>';}).join('');
// Every voice and sentence the game uses, for the voicing tool.
export function voicedLines(){const out={};for(const l of Object.values(LINES))(out[l.voice]??=[]).push(l.text);return out;}
