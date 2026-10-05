"use strict";
// The Google Form players swap codes with. Leave blank to hide the Form buttons.
const DEFAULT_FORM_URL = 'https://forms.gle/tY4uzBWDxj7RLszAA';
// The same Form's full address with ?embedded=true, so it opens inside the game (and full screen stays on).
// Leave blank to open the Form in a new tab instead.
const FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_O-6n0Jv6r2khtB2ezPds5oxmSP4PdNJpBysyKjxNE-veWA/viewform?embedded=true';
const SAVE_KEY='nova-last-batch-v8';
const FORM_KEY='nova-last-batch-form-v1';
const VERSION=8;
const MISSION_MS=25*60*1000;
const app=document.getElementById('app'),modal=document.getElementById('modal');
let view='landing',feedback='',feedbackError=false,returnFocus=null,toastTimer=null,formWindow=null,formOpened=false,lastView=null,unmount=()=>{};

function freshState(){return {version:VERSION,names:[],startedAt:null,deadline:null,finishedAt:null,finalCleared:false,current:0,progress:Array(6).fill(0),solved:Array(6).fill(false),released:Array(6).fill(false),gateUntil:Array(6).fill(0),training:false,variant:null,story:[],notes:Array.from({length:6},()=>[]),plan:[],stars:Array.from({length:6},()=>[]),learned:[],sound:true,choices:{}};}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeFormURL(v){try{const u=new URL(String(v).trim());return u.protocol==='https:'&&((u.hostname==='docs.google.com'&&/^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(u.pathname))||u.hostname==='forms.gle')?u.href:'';}catch{return '';}}
function readStore(k){try{return localStorage.getItem(k);}catch{return null;}}
function loadState(){try{
 const s=JSON.parse(readStore(SAVE_KEY)||'null');
 if(!s||s.version!==VERSION||!Array.isArray(s.names)||!s.names.length||!s.variant)return freshState();
 for(const k of ['progress','solved','released','gateUntil','notes'])if(!Array.isArray(s[k])||s[k].length!==6)return freshState();
 if(!Number.isFinite(s.startedAt)||s.deadline!==s.startedAt+MISSION_MS||!Number.isInteger(s.current)||s.current<0||s.current>5)return freshState();
 if(s.current>0&&!s.released[s.current-1])return freshState();
 s.story=Array.isArray(s.story)?s.story:[];s.learned=Array.isArray(s.learned)?s.learned:[];if(!Array.isArray(s.stars)||s.stars.length!==6)s.stars=Array.from({length:6},()=>[]);s.plan=Array.isArray(s.plan)?s.plan:[];s.choices=s.choices&&typeof s.choices==='object'?s.choices:{};return s;
 }catch{return freshState();}}
let state=loadState();
const formURL=safeFormURL(DEFAULT_FORM_URL||readStore(FORM_KEY)||'');
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{document.getElementById('storage-warning').hidden=false;}}
function announce(t){document.getElementById('announcer').textContent=t;}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3300);}
function fitStage(){const w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;document.documentElement.style.setProperty('--ui-scale',String(Math.min(w/1280,h/720)));}
window.addEventListener('resize',fitStage);window.visualViewport?.addEventListener('resize',fitStage);fitStage();
function fmt(sec){const n=Math.max(0,Math.floor(sec));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function expired(){return !!(state.startedAt&&!state.finishedAt&&Date.now()>=state.deadline);}
function clockText(){if(!state.startedAt)return '25:00';const t=state.finishedAt||Date.now(),left=Math.ceil((state.deadline-t)/1000);return left>=0?fmt(left):state.training?'+'+fmt(-left):'00:00';}
function canVisit(i){return Number.isInteger(i)&&i>=0&&i<6&&(i===0||state.released[i-1]);}
const who=()=>state.names.length>1?'Team':state.names[0]||'trainee';

/* ---------- Shell ---------- */
function header(playing=true){
 const nav=playing?`<nav class="room-nav" aria-label="Rooms">${ROOMS.map((r,i)=>`<button data-room="${i}" class="${state.current===i&&(view==='room'||view==='gate')?'active ':''}${state.released[i]?'done':''}" title="Room ${i+1}: ${r.name}" aria-label="Room ${i+1}: ${r.name}${!canVisit(i)?', locked':''}" ${canVisit(i)?'':'disabled'}>${state.released[i]?'✓':i+1}</button>${i<5?`<i class="${state.released[i]?'lit':''} ${i===3?'gap':''}"></i>`:''}`).join('')}</nav>`:'';
 const actions=playing?`<button class="text-btn" data-action="notebook">Notebook</button><button class="text-btn" data-action="guide">Career guide</button>${formURL?'<button class="text-btn" data-action="open-form">📝 Form</button>':''}<button class="text-btn" data-action="menu">Menu</button><button class="text-btn warn" id="training-btn" data-action="training" ${expired()&&!state.training?'':'hidden'}>Continue training</button><span id="clock" class="clock">${clockText()}</span>`:'<button class="text-btn" data-action="guide">Career guide</button><button class="text-btn" data-action="howto">How to play</button>';
 return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">N</div><div><b>The Last Batch</b><small>Nova Semiconductor · Ontario</small></div></div>${nav}<div class="top-actions">${actions}<button class="text-btn icon" data-action="sound" title="Sound effects" aria-label="${state.sound?'Sound effects on':'Sound effects off'}">${state.sound?'🔊':'🔇'}</button><button class="text-btn icon music ${bgm.on?'':'off'}" data-action="music" title="Background music" aria-label="${bgm.on?'Music on':'Music off'}">🎵</button><button class="text-btn icon" data-action="fullscreen" aria-label="Toggle fullscreen">⛶</button></div></header><small class="creator-credit">Made by Haolun, William, and Gordan</small>`;
}
function render(){unmount();unmount=()=>{};stopLoops();
 if(view==='landing'){renderLanding();return;}
 if(!state.startedAt){view='landing';renderLanding();return;}
 if(view==='ending'){if(state.finalCleared)renderEnding();else{view='final';render();return;}}
 else if(view==='final'){if(state.released.every(Boolean))renderFinal();else{view='room';render();return;}}
 else{if(!canVisit(state.current))state.current=0;if(view==='gate'&&!state.solved[state.current])view='room';if(view==='room'&&state.solved[state.current])view='gate';
  if(view==='gate')renderGate();else{view='room';renderRoom();}}
 tick();queueStory();
}
new MutationObserver(()=>{const m=document.getElementById('main');if(!m)return;const key=view+':'+state.current;if(key!==lastView){m.classList.add('enter');lastView=key;}}).observe(app,{childList:true});

/* ---------- Landing ---------- */
function renderLanding(){
 const facts=[['Grade 12','Entry requirement (OSSD or equivalent)'],['≈ 4,000 h','Paid on-the-job training'],['304 h','In-class technical training'],['630A','Ontario trade code']];
 app.innerHTML=header(false)+`<main id="main" class="screen landing" tabindex="-1">
 <div class="landing-copy"><div class="eyebrow">Ontario career escape room · Micro Electronics Manufacturer</div><h1>The Last Batch</h1>
 <p class="lede">You’re the new co-op student on the night shift at a chip factory. A mysterious power surge just wiped a batch of heart-monitor chips, and the truck leaves in 25 minutes. Gown up, print the circuit, test and cut the wafer, inspect every part, and find out what caused the surge. Then, in the training office, map your real route into the trade.</p>
 <div class="fact-row">${facts.map(([a,b])=>`<div class="fact"><strong>${a}</strong><span>${b}</span></div>`).join('')}</div>
 <div class="cast">${['sam','mira','nova'].map(k=>`<div class="cast-member">${portrait(k)}<span><b>${CAST[k].name}</b>${CAST[k].role}</span></div>`).join('')}</div></div>
 <figure class="hero-plan">${photoOr('cleanroom',floorPlan(),'hero-ph')}<figcaption>Rooms 1–4 are the factory floor. Rooms 5–6 are the training office.</figcaption></figure>
 <div class="landing-bottom">${state.startedAt?`<div class="resume-card"><b>Your mission is saved.</b><p>${esc(state.names.join(', '))} · ${state.released.filter(Boolean).length}/6 doors unlocked</p><div class="gate-actions"><button class="btn" data-action="resume">${state.finishedAt?'View result':'Resume mission'} →</button><button class="btn secondary" data-action="restart">Start fresh</button></div></div>`:`<form id="start-form" class="signup"><label for="names">Player name(s)</label><div class="input-row"><input class="input" id="names" maxlength="600" autocomplete="off" placeholder="Your name, or names separated by commas" aria-describedby="name-error"><button class="btn" type="submit">Start shift →</button></div><p id="name-error" class="inline-error" role="alert"></p></form>`}
 <div class="instructions-strip"><div><b>Hands-on</b>Work real fab stations: gowning, lithography, probing, dicing, inspection.</div><div><b>Your story</b>Pick your replies, earn stars and solve the surge mystery.</div><div><b>Unlock</b>Swap codes with the Google Form to open each door.</div></div></div></main>`;
 document.getElementById('start-form')?.addEventListener('submit',startMission);
}
function startMission(e){e.preventDefault();if(state.startedAt)return;const names=document.getElementById('names').value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(!names.length||names.some(n=>n.length>40)){document.getElementById('name-error').textContent='Enter at least one name. Keep each name under 41 characters.';return;}
 const sound=state.sound;state=freshState();state.sound=sound;state.names=names;state.startedAt=Date.now();state.deadline=state.startedAt+MISSION_MS;state.variant=makeVariant();view='room';save();shiftStart();}

/* ---------- Room: procedure card + bench ---------- */
function stationScreen({eyebrow,title,stepper,learnTitle,remember,photo}){
 return header()+`<main id="main" class="screen room-screen" tabindex="-1">
 <div class="room-head">${radioButton()}<div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${stepper||''}</div>
 <div class="room-body"><aside class="sop"><div class="eyebrow">Remember</div><h2>${learnTitle}</h2>${photo?photoFigure(photo,'sop-photo'):''}<ul class="remember">${remember.map(r=>`<li>${r}</li>`).join('')}</ul><button class="text-btn" data-action="learn">📖 Show the Learn card again</button></aside>
 <section class="work"><div class="coach" id="coach" role="status"><span class="coach-ico" aria-hidden="true">👉</span><p id="coach-text"></p><button class="hint-btn" id="hint-btn" data-action="hint">💡 Hint</button></div><div class="bench" id="bench" aria-label="Workbench"></div></section></div>
 <div class="say" id="say" role="status"><span class="say-face" id="say-face"></span><p id="say-text"></p></div></main>`;
}
/* Per-step coaching: banner text, hint target, mistake/hint counts for the star rating. */
let coachState={hint:null,mistakes:0,streak:0,hints:0},currentCtx=null;
let pendingContinue=false; // set when a step's celebration card is open; closing it moves on
let pendingShip=false,shipping=false; // final cleared: the ship-out scene plays before the ending story
modal.addEventListener('close',()=>{if(pendingShip){pendingShip=false;shipOut();return;}if(!pendingContinue)return;pendingContinue=false;render();if(view==='gate'){cinematic(`Room ${state.current+1} · complete`);autoCopy(state.current);}});
/* Clipboard: the async API where allowed, otherwise the old select-and-copy trick. Must run inside a click or key press. */
function copyText(t){try{if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);}catch{}
 return new Promise((ok,no)=>{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();let done=false;try{done=document.execCommand('copy');}catch{}ta.remove();done?ok():no();});}
/* When a room is finished, its Form code goes straight to the clipboard (the Continue click counts as the user's gesture). */
function autoCopy(i){const c=ROOMS[i].code;copyText(c).then(()=>{toast(`✓ ${c} copied. Paste it into Room ${i+1} of the Form.`);const box=document.querySelector('.room-code');if(box){box.classList.add('copied');box.dataset.copied='✓ Copied';}}).catch(()=>{});}
function showHint(auto){const el=coachState.hint?.();if(!el)return;if(!auto&&!coachState.hints)currentCtx?.say(HINT_QUIPS[Math.floor(Math.random()*HINT_QUIPS.length)],'info','nova');document.querySelectorAll('.hint-glow').forEach(x=>x.classList.remove('hint-glow'));el.classList.add('hint-glow');el.scrollIntoView?.({block:'nearest'});if(!auto)coachState.hints++;sfx('hint');}
function makeCtx(i,onDone){
 const career=CAREER_ROOMS.includes(i);coachState={hint:null,mistakes:0,streak:0,hints:0};
 return currentCtx={v:state.variant,name:esc(who()),
  coach(html){const el=document.getElementById('coach-text');if(el){el.innerHTML=html;const c=document.getElementById('coach');c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');}document.querySelectorAll('.hint-glow').forEach(x=>x.classList.remove('hint-glow'));},
  hint(fn){coachState.hint=fn;},
  say(text,tone='info',speaker){const s=document.getElementById('say');if(!s)return;const w=speaker||(career?'mira':tone==='bad'?'nova':'sam');
   document.getElementById('say-face').innerHTML=portrait(w);document.getElementById('say-text').innerHTML=`<b>${CAST[w].name}:</b> ${text}`;s.className='say '+tone;s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');announce(text.replace(/<[^>]+>/g,''));
   if(tone==='bad'){coachState.mistakes++;coachState.streak++;sfx('bad');if(coachState.streak>=2)setTimeout(()=>showHint(true),300);}else if(tone==='good'){coachState.streak=0;sfx('good');}},
  note(t){if(i>=0){state.notes[i].push(t);save();}},
  setPlan(list){state.plan=list;save();},
  done:onDone};
}
function starsFor(){const {mistakes:m,hints:h}=coachState;return Math.max(1,3-(m>=2?1:0)-(m>=5||h>0?1:0));}
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function renderRoom(){
 const i=state.current,r=ROOMS[i],k=Math.min(state.progress[i],r.steps.length-1),step=r.steps[k];
 const stepper=`<ol class="stepper">${r.steps.map((s,n)=>`<li class="${n<state.progress[i]?'done':n===k?'now':''}"><span>${n<state.progress[i]?'✓':n+1}</span>${s.title}</li>`).join('')}</ol>`;
 app.innerHTML=stationScreen({eyebrow:`Room ${i+1} of 6 · ${r.short}`,title:r.name,stepper,learnTitle:`Step ${k+1} · ${step.title}`,remember:step.remember,photo:step.photo});
 const ctx=makeCtx(i,()=>stepDone(i,k));
 ctx.say(`Read the instructions in the blue box, then try it. Stuck? Press <b>💡 Hint</b>.`,'info');
 unmount=TASKS[step.task](document.getElementById('bench'),ctx)||(()=>{});
}
function learnKey(){return view==='final'?'final':view==='room'?`${state.current}-${Math.min(state.progress[state.current],ROOMS[state.current].steps.length-1)}`:null;}
function learnCard(){const key=learnKey();if(!key)return;const L=key==='final'?FINAL:ROOMS[state.current].steps[+key.split('-')[1]],title=key==='final'?'Line control':L.title;
 if(!state.learned.includes(key)){state.learned.push(key);save();}
 showModal(title,`<div class="learn ${L.photo?'has-photo':''}">${L.photo?photoFigure(L.photo,'learn-photo'):''}<div class="learn-text"><ul class="learn-points">${L.learn.points.map(p=>`<li>${p}</li>`).join('')}</ul>${L.learn.fact?`<p class="fact-box"><b>Did you know?</b> ${L.learn.fact}</p>`:''}</div></div>`,
  `<span class="small muted">Read this, then try it yourself.</span><button class="btn" data-action="close-modal">Let’s do it →</button>`,'Learn');}
function stepDone(i,k){
 if(view!=='room'||state.current!==i||state.progress[i]!==k)return;const step=ROOMS[i].steps[k],stars=starsFor();pendingContinue=true;
 if(step.note)state.notes[i].push(step.note);state.stars[i][k]=stars;state.progress[i]++;
 const last=state.progress[i]>=ROOMS[i].steps.length;if(last)state.solved[i]=true;save();confetti();sfx('done');
 showModal(last?`Room ${i+1} complete!`:`Step ${k+1} complete!`,`<div class="celebrate"><div class="big-stars" aria-label="${stars} of 3 stars">${starStr(stars)}</div><p class="small muted">${stars===3?'Perfect, no hints needed!':stars===2?'Nice work!':'You got there!'}</p>${reactLine(i,stars)}${step.note?`<div class="takeaway"><div class="eyebrow">What you just learned</div><p>${esc(step.note)}</p></div>`:''}</div>`,
  `<span></span><button class="btn" data-action="continue">${last?'Get the door code →':'Next step →'}</button>`,'Well done');
}
/* A short in-character reaction to the stars just earned. */
function reactLine(i,stars){const pool=REACT[CAREER_ROOMS.includes(i)?'career':'floor'][stars],[w,t]=pool[Math.floor(Math.random()*pool.length)];return `<div class="react">${portrait(w)}<p><b>${CAST[w].name}:</b> ${nameFill(t)}</p></div>`;}
/* ---------- Cut-scenes: the same factory, truck and sky for the shift start and the ship-out. ---------- */
const SCENE={
 /* sky: night (moon, stars) over a dawn gradient; the outro fades the night away and raises the sun */
 sky:()=>`<defs>
   <linearGradient id="so-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fa6e0"/><stop offset=".65" stop-color="#f7c58b"/><stop offset="1" stop-color="#f29e6b"/></linearGradient>
   <linearGradient id="so-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1222"/><stop offset=".7" stop-color="#1d2a48"/><stop offset="1" stop-color="#34406a"/></linearGradient>
   <radialGradient id="so-sunglow"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#ffd36b"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
   <linearGradient id="so-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="1" stop-color="#d3dae2"/></linearGradient>
   <linearGradient id="so-win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#f5d27a"/></linearGradient>
   <linearGradient id="so-box" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset="1" stop-color="#dfe5ec"/></linearGradient>
   <linearGradient id="so-cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b7be6"/><stop offset="1" stop-color="#1846a8"/></linearGradient>
   <radialGradient id="so-rim"><stop offset="0" stop-color="#eef1f4"/><stop offset="1" stop-color="#8a95a3"/></radialGradient>
   <radialGradient id="so-lamp"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>
  <rect x="-200" width="1600" height="600" fill="url(#so-dawn)"/>
  <g class="so-clouds" fill="#fff" fill-opacity=".55"><ellipse cx="760" cy="120" rx="70" ry="16"/><ellipse cx="800" cy="108" rx="40" ry="14"/><ellipse cx="1060" cy="170" rx="60" ry="12"/></g>
  <circle class="so-sun" cx="900" cy="470" r="90" fill="url(#so-sunglow)"/>
  <rect class="so-night" x="-200" width="1600" height="600" fill="url(#so-night)"/>
  <g class="so-stars" fill="#fff">${Array.from({length:40},(_,i)=>`<circle cx="${(i*397)%1400-100}" cy="${(i*131)%300}" r="${.8+(i%3)*.5}" opacity="${.5+(i%2)*.5}"/>`).join('')}
   <g class="so-moon"><circle cx="1030" cy="100" r="30" fill="#f4f1de"/><circle cx="1044" cy="92" r="27" fill="#1a2440"/></g></g>
  <rect x="-200" y="430" width="1600" height="18" fill="#c3cad3"/><path d="M-200 430h1600" stroke="#9aa6b2" stroke-width="2"/><path d="M-200 448h1600" stroke="#6b7686" stroke-width="3"/>
  <rect x="-200" y="450" width="1600" height="150" fill="#454d59"/><path d="M-200 520h1600" stroke="#f2c200" stroke-width="4" stroke-dasharray="46 30"/>
  <g class="so-streetlamp"><path d="M1010 448V300q0-18 22-18h20" fill="none" stroke="#5b6573" stroke-width="6"/><path d="M1046 280h26l-4 8h-18Z" fill="#3a4250"/><ellipse class="so-lampglow" cx="1059" cy="330" rx="70" ry="70" fill="url(#so-lamp)"/></g>`,
 /* the factory: panelled wall, rooftop units and stacks, framed lit windows (gowned figures in one), personnel door with lamp and
    clock-in reader, ribbed roll-up dock door (open with stacked boxes for the outro), shrubs */
 factory:(dockOpen)=>`<g>
   <rect x="66" y="150" width="70" height="36" rx="3" fill="#c3cad3" stroke="#6b7686"/>${[84,118].map(x=>`<circle cx="${x}" cy="168" r="12" fill="#8a95a3" stroke="#5b6573"/><path d="M${x-9} 168h18M${x} 159v18" stroke="#5b6573" stroke-width="2"/>`).join('')}
   ${[350,382].map((x,k)=>`<rect x="${x}" y="${120+k*14}" width="18" height="${66-k*14}" fill="#9aa6b2" stroke="#5b6573"/><rect x="${x-2}" y="${116+k*14}" width="22" height="6" fill="#6b7686"/>`).join('')}
   <path d="M250 186v-40M244 152h12" stroke="#6b7686" stroke-width="3"/>
   <rect x="40" y="200" width="380" height="230" fill="url(#so-wall)" stroke="#6b7686" stroke-width="2"/>
   ${[230,262,294,326,358,390].map(y=>`<path d="M42 ${y}h376" stroke="#c3cad3"/>`).join('')}${[135,230,325].map(x=>`<path d="M${x} 202v226" stroke="#c3cad3"/>`).join('')}
   <rect x="34" y="184" width="392" height="20" rx="2" fill="#1c5fd4" stroke="#14408f" stroke-width="1.5"/><rect x="48" y="187" width="14" height="14" rx="2" fill="#fff"/><path d="M51 198v-8l8 8v-8" fill="none" stroke="#1c5fd4" stroke-width="2"/>
   <text x="240" y="199" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="2" fill="#fff" font-family="IBM Plex Sans,sans-serif">NOVA SEMICONDUCTOR</text>
   ${[150,215].map((x,k)=>`<rect x="${x-3}" y="217" width="56" height="42" fill="#5b6573"/><rect class="so-window" x="${x}" y="220" width="50" height="36" fill="url(#so-win)"/><path d="M${x+25} 220v36M${x} 238h50" stroke="#8a95a3" stroke-width="2"/>${k===1?`<g fill="#fbfcfd" stroke="#b9c3ce" stroke-width=".8"><path d="M${x+8} 256v-10q0-6 6-6t6 6v10Z"/><circle cx="${x+14}" cy="236" r="4"/><path d="M${x+30} 256v-10q0-6 6-6t6 6v10Z"/><circle cx="${x+36}" cy="236" r="4"/></g>`:''}<path d="M${x+4} 224l12 0-12 14Z" fill="#fff" fill-opacity=".45"/>`).join('')}
   <rect x="76" y="326" width="52" height="104" fill="#5b6573" stroke="#2b3644"/><rect x="82" y="332" width="40" height="98" fill="#7d8896" stroke="#3a4250"/><rect x="92" y="342" width="20" height="26" fill="#1d2a48" stroke="#3a4250"/><rect x="113" y="380" width="6" height="3" rx="1" fill="#c3cad3"/>
   <rect class="so-doorlight" x="92" y="342" width="20" height="26" fill="#ffe9a8"/>
   <path d="M90 316h24l-4 6h-16Z" fill="#3a4250"/><ellipse class="so-window" cx="102" cy="332" rx="26" ry="16" fill="url(#so-lamp)"/>
   <g class="si-reader"><rect x="134" y="364" width="14" height="20" rx="2" fill="#2b3644"/><rect x="137" y="368" width="8" height="5" fill="#9fe0ff"/><circle class="si-led" cx="141" cy="379" r="2" fill="#c94a3a"/></g>
   <rect x="290" y="296" width="130" height="134" fill="#3a4250" stroke="#2b3644" stroke-width="2"/><rect x="296" y="286" width="118" height="12" rx="2" fill="#5b6573"/><text x="355" y="295.5" text-anchor="middle" font-size="8" font-weight="700" fill="#f2c200" font-family="IBM Plex Mono,monospace">DOCK 1</text>
   ${dockOpen?`<rect x="298" y="304" width="114" height="126" fill="#1f262f"/><rect x="298" y="304" width="114" height="30" fill="#c3cad3"/>${[0,1,2].map(k=>`<path d="M298 ${308+k*9}h114" stroke="#8a95a3"/>`).join('')}<g fill="#c9a874" stroke="#8f6c3c">${[[314,392],[350,392],[332,362],[368,392]].map(([x,y])=>`<rect x="${x}" y="${y}" width="34" height="30"/><path d="M${x} ${y+9}h34" stroke="#a8824e"/>`).join('')}</g><rect x="306" y="422" width="98" height="8" fill="#8a6a3c"/>`
     :`<rect x="298" y="304" width="114" height="126" fill="#c3cad3"/>${Array.from({length:14},(_,k)=>`<path d="M298 ${310+k*9}h114" stroke="#8a95a3"/>`).join('')}<rect x="345" y="420" width="20" height="5" rx="2" fill="#5b6573"/>`}
   <rect x="284" y="400" width="8" height="26" rx="2" fill="#14171c"/><rect x="418" y="400" width="8" height="26" rx="2" fill="#14171c"/>
   <g fill="#3f7d4e" stroke="#2c5a37">${[[52,424,20],[200,424,24],[236,428,16]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x+r*.8}" cy="${y+4}" r="${r*.7}"/>`).join('')}</g></g>`,
 /* the delivery truck: ribbed trailer with logo, rear door, reflective strip; cab with driver, mirror, lights, grille, exhaust; detailed wheels */
 truck:()=>`<g class="so-truck">
   <rect x="446" y="410" width="400" height="12" fill="#2b3036"/><rect x="452" y="414" width="10" height="20" fill="#14171c"/>
   <rect x="440" y="296" width="302" height="118" rx="5" fill="url(#so-box)" stroke="#6b7686" stroke-width="2"/>${[304,406].map(y=>`<path d="M444 ${y}h294" stroke="#c3cad3" stroke-width="2"/>`).join('')}
   <path d="M450 398h282" stroke="#c94a3a" stroke-width="5" stroke-dasharray="14 10"/>
   <path d="M480 340q-9-10-17-2q-8 8 17 26q25-18 17-26q-8-8-17 2Z" fill="#c94a3a"/><path d="M466 346h8l3-6 4 12 3-6h10" fill="none" stroke="#fff" stroke-width="2"/>
   <text x="616" y="346" text-anchor="middle" font-size="24" font-weight="700" fill="#14202d" font-family="IBM Plex Sans,sans-serif">NB-7 · MEDICAL</text><text x="616" y="370" text-anchor="middle" font-size="12" fill="#5b6573" font-family="IBM Plex Mono,monospace">HEART MONITOR CHIPS · FRAGILE</text><text x="616" y="388" text-anchor="middle" font-size="10" fill="#1c5fd4" font-family="IBM Plex Sans,sans-serif" font-weight="600">Nova Semiconductor · Ontario</text>
   <g class="so-reardoor"><rect x="434" y="298" width="12" height="114" fill="#d3dae2" stroke="#6b7686"/><path d="M436 318h8M436 392h8" stroke="#5b6573" stroke-width="3"/></g>
   <path d="M748 316h62q10 0 16 8l26 34q4 6 4 14v42H748Z" fill="url(#so-cab)" stroke="#14408f" stroke-width="2"/>
   <path d="M760 326h46q6 0 10 5l20 27h-76Z" fill="#bfe0f5" stroke="#14408f" stroke-width="1.5"/><path d="M768 330l16 0-14 24Z" fill="#fff" fill-opacity=".5"/>
   <circle cx="792" cy="340" r="7" fill="#2b3644"/><path d="M780 358q12-12 24 0Z" fill="#2b3644"/>
   <path d="M772 372h20" stroke="#14408f" stroke-width="3" stroke-linecap="round"/><rect x="752" y="330" width="6" height="22" rx="2" fill="#2b3644"/>
   <rect x="844" y="378" width="12" height="10" rx="2" fill="#ffe9a8" stroke="#c9a24a"/><ellipse class="so-headlight" cx="880" cy="384" rx="34" ry="12" fill="url(#so-lamp)"/>
   <path d="M836 396h20M836 402h20" stroke="#14408f" stroke-width="2"/><rect x="742" y="408" width="118" height="10" rx="3" fill="#9aa6b2" stroke="#5b6573"/>
   <rect x="744" y="266" width="8" height="50" rx="3" fill="#8a95a3" stroke="#5b6573"/><g class="so-smoke" fill="#c3cad3"><circle cx="748" cy="258" r="6"/><circle cx="742" cy="246" r="8"/><circle cx="734" cy="232" r="10"/></g>
   ${[500,700,800].map(x=>`<g class="so-wheel" style="transform-origin:${x}px 425px"><circle cx="${x}" cy="425" r="27" fill="#1f2328" stroke="#0c0f12" stroke-width="2"/><circle cx="${x}" cy="425" r="23" fill="none" stroke="#3a4250" stroke-width="3" stroke-dasharray="4 3"/><circle cx="${x}" cy="425" r="13" fill="url(#so-rim)" stroke="#5b6573"/>${[0,72,144,216,288].map(a=>`<circle cx="${x+7*Math.cos(a*Math.PI/180)}" cy="${425+7*Math.sin(a*Math.PI/180)}" r="1.6" fill="#5b6573"/>`).join('')}<circle cx="${x}" cy="425" r="3" fill="#3a4250"/></g>`).join('')}</g>`,
 /* the same detailed worker as in the gowning room, in street clothes, gently bobbing as they walk */
 worker:(cls)=>`<g class="${cls}"><g class="walker">${gownAvatar({}).replace(/<g class="removable"[\s\S]*?<\/g>/g,'').replace('<svg viewBox="0 0 240 390" class="avatar-svg" role="img" aria-label="Worker getting ready for the cleanroom">','<svg x="70" y="314" width="72" height="117" viewBox="0 0 240 390">')}</g></g>`,
 box:(n)=>`<g class="so-box b${n}"><rect x="0" y="0" width="46" height="36" rx="1" fill="#c9a874" stroke="#8f6c3c"/><path d="M0 9h46" stroke="#a8824e"/><rect x="19" y="0" width="8" height="36" fill="#d9c7a0" fill-opacity=".8"/>
   <rect x="4" y="14" width="14" height="12" fill="#fbfcfd" stroke="#9a8a6a" stroke-width=".6"/><path d="M11 23q-3-2-4-4q0-3 4-1q4-2 4 1q-1 2-4 4Z" fill="#c94a3a"/><path d="M32 26v-9l-3 3M32 17l3 3M39 26v-9l-3 3M39 17l3 3" fill="none" stroke="#5c4422" stroke-width="1"/></g>`
};
/* Plays a cut-scene over the game. While it runs, story and Learn pop-ups wait (shipping=true). sounds: [[ms,fxName]]. */
function playScene(cls,svg,card,ms,sounds,after){const el=document.createElement('div');el.className='scene '+cls;
 el.innerHTML=`<svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${svg.replace('<!--stage-->','<g transform="translate(120 0)">')}</g></svg><div class="so-card">${card}</div><button class="btn secondary so-skip" data-action="skip-scene">Skip ⏭</button>`;
 shipping=true;document.body.appendChild(el);const timers=sounds.map(([t,n])=>setTimeout(()=>fx(n),t));
 const finish=()=>{timers.forEach(clearTimeout);clearTimeout(end);el.remove();shipping=false;after?.();queueStory();};const end=setTimeout(finish,ms);el._finish=finish;}
/* Shift start: walk in at night past the waiting truck, clock in, then the power surge hits. The mission clock starts after it. */
function shiftStart(){render();playScene('intro',SCENE.sky()+'<!--stage-->'+SCENE.factory(false)+SCENE.truck()+SCENE.worker('si-worker')+'<rect class="si-surge" x="-200" width="1600" height="600" fill="#c2271b"/>',
  `<div class="so-time">🕠 05:35 · CLOCK IN</div><h2>Night shift, Nova Semiconductor</h2><p>Welcome, ${esc(who())}. The NB-7 truck leaves at 06:00.</p><p class="si-alert">⚠ POWER SURGE</p>`,
  7000,[[4300,'alarm']],()=>{const shift=Date.now()-state.startedAt;state.startedAt+=shift;state.deadline+=shift;save();tick();});}
/* Ship-out after the final: boxes into the truck, it drives off at sunrise, the shift clocks out. */
function shipOut(){render();playScene('outro',SCENE.sky()+'<!--stage-->'+SCENE.factory(true)+SCENE.box(1)+SCENE.box(2)+SCENE.box(3)+SCENE.truck()+SCENE.worker('so-worker'),
  `<div class="so-time">🕕 06:00 · CLOCK OUT</div><h2>Shift complete</h2><p>NB-7 is on its way to the hospital. Go get some sleep, ${esc(who())}!</p>`,
  8600,[[900,'thud'],[1500,'thud'],[2100,'thud'],[2700,'clunk'],[3100,'horn']]);}
function cinematic(text){const el=document.createElement('div');el.className='cinematic';el.innerHTML=`<div class="cine-text">${esc(text)}</div>`;app.appendChild(el);setTimeout(()=>el.remove(),1300);}

/* ---------- Gate (Form code exchange) ---------- */
function renderGate(){const i=state.current,r=ROOMS[i],notes=state.notes[i].filter(n=>!n.startsWith('Mira:'));
 app.innerHTML=header()+`<main id="main" class="screen gate-screen" tabindex="-1"><div class="gate-heading"><div><div class="eyebrow">Room ${i+1} · ${r.name} · complete · <span class="stars-inline">${state.stars[i].map(starStr).join(' ')}</span></div><h1>${state.released[i]?'Door unlocked.':'The door needs two codes.'}</h1></div>${HOOKS[i]?`<div class="hook">${portrait(HOOKS[i][0])}<p><b>${CAST[HOOKS[i][0]].name}:</b> ${nameFill(HOOKS[i][1])}</p></div>`:''}</div>
 <div class="gate-layout"><section class="gate-card"><div class="step-label"><span>1</span>Game → Google Form</div><p>Enter this code in <strong>Room ${i+1}</strong> of your Google Form, then click <strong>${i===5?'Submit':'Next'}</strong>.</p><div class="room-code" tabindex="0">${r.code}</div><div class="gate-actions"><button class="btn secondary" data-copy="${i}">Copy code</button>${formURL?'<button class="btn secondary" data-action="open-form">📝 Open Form</button>':''}</div></section>
 <section class="gate-card"><div class="step-label"><span>2</span>Google Form → Game</div>${state.released[i]?`<p class="receipt-success">Return code accepted. This door stays unlocked.</p><button class="btn" data-next="${i}">${i===5?(state.finalCleared?'View result':'Go to the dispatch dock'):'Enter Room '+(i+2)} →</button>`:`<p>${i===5?'The Form’s confirmation message':'The next Form section'} gives you a <strong>different code</strong>. Enter it here.</p><form class="gate-form" id="gate-form"><label class="sr-only" for="return-code">Code from the Form</label><input class="input" id="return-code" autocomplete="off" spellcheck="false" autocapitalize="characters" maxlength="24" placeholder="Code from Google Forms" aria-describedby="gate-feedback"><button class="btn" id="unlock-submit" type="submit">${i===5?'Go to the dispatch dock':'Unlock Room '+(i+2)} →</button></form><p class="feedback ${feedbackError?'error':''}" id="gate-feedback" role="status">${esc(feedback||'The code on the left goes into the Form. It won’t open this door.')}</p>`}</section>
 <section class="gate-card learned"><div class="eyebrow">What you learned here</div><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join('')||'<li>Saved to your notebook.</li>'}</ul></section></div></main>`;
 document.getElementById('gate-form')?.addEventListener('submit',e=>{e.preventDefault();unlockGate(document.getElementById('return-code').value);});}
function ensureTime(){if(expired()&&!state.training){toast('Time is up. Select Continue training at the top to finish.');return false;}return true;}
/* Door codes are matched loosely: case, spaces, dashes and punctuation are ignored (GATE 2f8r!, gate2f8r → GATE-2F8R).
   Every rejection says why, so a right code is never reported as simply "wrong". */
const codeKey=v=>String(v).toUpperCase().replace(/[^A-Z0-9]/g,'');
function unlockGate(value){const i=state.current;if(view!=='gate'||!state.solved[i]||state.released[i])return false;
 if(expired()&&!state.training){setGateError('Time is up. Click Continue training at the top of the game first, then enter the code again.');return false;}
 const wait=Math.ceil((state.gateUntil[i]-Date.now())/1000);if(wait>0){setGateError(`Wait ${wait} s, then try again.`);return false;}
 const answer=codeKey(value);
 if(!answer){setGateError('Enter the door code shown by the Form.');return false;}
 if(answer!==codeKey(RETURN_CODES[i])){
  const nova=ROOMS.findIndex(r=>codeKey(r.code)===answer),other=RETURN_CODES.findIndex(c=>codeKey(c)===answer);
  if(nova>=0){setGateError(`${ROOMS[nova].code} is the code you type into the Form. Click Next in the Form: it then shows a different code (GATE-…) for this door.`);return false;}
  if(other>=0){setGateError(`That’s the door code for ${other===5?'the dispatch dock':'Room '+(other+2)}. This door needs the code the Form shows right after the Room ${i+1} code.`);return false;}
  state.gateUntil[i]=Date.now()+3000;save();setGateError('That doesn’t open this door. Copy the code from the Form after Next or Submit.');return false;}
 state.released[i]=true;feedback='';feedbackError=false;if(i===5)view='final';else{state.current=i+1;view='room';}save();render();cinematic(i===5?'Form verified · dock access':`Form verified · Room ${i+2} open`);return true;}
function setGateError(text){feedback=text;feedbackError=true;const el=document.getElementById('gate-feedback');if(el){el.textContent=text;el.className='feedback error';}announce(text);tick();}
function nextRoom(i){if(!state.released[i])return;closeModal();if(i===5)view=state.finalCleared?'ending':'final';else{state.current=i+1;view='room';}feedback='';save();render();}

/* ---------- Final & ending ---------- */
function renderFinal(){
 app.innerHTML=stationScreen({eyebrow:'Last stop · dispatch dock',title:'Line control',learnTitle:'Clear the alarms',remember:FINAL.remember});
 const ctx=makeCtx(-1,()=>{if(view!=='final'||state.finalCleared)return;const stars=starsFor();
  state.finalStars=stars;state.finalCleared=true;state.finishedAt=Date.now();if(state.finishedAt>state.deadline)state.training=true;view='ending';save();confetti();sfx('done');shipping=true;pendingShip=true;
  showModal('Line clear!',`<div class="celebrate"><div class="big-stars" aria-label="${stars} of 3 stars">${starStr(stars)}</div><p class="small muted">${stars===3?'Perfect, no hints needed!':stars===2?'Nice work!':'You got there!'}</p>${reactLine(-1,stars)}<div class="takeaway"><div class="eyebrow">What you just did</div><p>You traced every alarm back to the station that caused it and picked the right fix. That’s what operators do on every shift.</p></div></div>`,
   `<span></span><button class="btn" data-action="shipout">🚚 Load the truck →</button>`,'All alarms cleared');});
 ctx.say('Five alarms and one very impatient truck driver. Find the machine, then fix it. You know this!','info','sam');
 unmount=TASKS.control(document.getElementById('bench'),ctx)||(()=>{});
}
function renderEnding(){const elapsed=fmt(((state.finishedAt||Date.now())-state.startedAt)/1000),onTime=state.finishedAt<=state.deadline;
 app.innerHTML=header()+`<main id="main" class="screen ending" tabindex="-1"><div class="ending-top"><div><div class="eyebrow">${onTime?'Mission complete':'Training complete · overtime'}</div><h1>Batch shipped. Mystery solved.</h1><p class="lede">NB-7 made the truck, and the surge turned out to be a spilled energy drink. Not bad for a co-op student’s first shift: you gowned up, printed a circuit layer, probed and diced a wafer, and inspected every part. Here’s your real route into the trade in Ontario.</p></div><div class="end-stats"><div><strong>${elapsed}</strong><span>Shift time</span></div><div><strong>${state.stars.flat().reduce((a,b)=>a+b,0)+(state.finalStars||0)} ★</strong><span>Stars earned</span></div><div><strong>6 / 6</strong><span>Doors</span></div></div></div>
 <ol class="roadmap">${PATHWAY.map((p,k)=>`<li><span class="dot">${k+1}</span><b>${p.title}</b><small>${p.tag}</small></li>`).join('')}</ol>
 <div class="end-bottom"><div class="plan-card-final"><div class="eyebrow">My next moves</div><ul>${(state.plan.length?state.plan:['Talk to my guidance counsellor about co-op or OYAP']).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
 <div class="end-actions"><button class="btn" data-action="guide">Read the career guide</button><button class="btn secondary" data-action="notebook">Review notebook</button><button class="btn secondary" data-action="restart">Play again</button></div></div></main>`;}

/* ---------- Storyline ---------- */
function storyKey(){return view==='room'||view==='gate'?'r'+state.current:view==='final'?'final':view==='ending'?'ending':null;}
/* Resolve a story key to a flat list of {w,t,choices?} beats. {guess} entries depend on the Room 4 choice. */
function beat(key){return (STORY[key]||[]).map(e=>Array.isArray(e)?{w:e[0],t:e[1]}:e.guess?(g=>g&&{w:g[0],t:g[1]})(e.guess[state.choices?.r3]):e).filter(Boolean);}
const nameFill=t=>esc(t).replace(/\{name\}/g,esc(who()));
function storyModal(key,idx,list,w,body,actions){const c=CAST[w];
 showModal(c.name,`<div class="story ${w}"><div class="story-fig">${portrait(w)}</div><div class="story-text"><div class="speaker">${c.role}</div>${body}</div></div>`,
  `<div class="story-dots" aria-label="Message ${idx+1} of ${list.length}">${list.map((_,k)=>`<span class="${k===idx?'on':''}"></span>`).join('')}</div><div class="gate-actions">${actions}</div>`,w==='nova'?'System alert':'Radio');}
function playStory(key,idx=0){const list=beat(key);if(!list.length||idx>=list.length){closeModal();return;}
 if(!state.story.includes(key)){state.story.push(key);save();}
 const b=list[idx],last=idx===list.length-1;
 if(b.choices){storyModal(key,idx,list,b.w,`<p class="story-line">${nameFill(b.t)}</p><div class="story-choices" role="group" aria-label="Your reply">${b.choices.map((c,n)=>`<button class="choice-btn" data-choice="${key},${idx},${n}">${esc(c[0])}</button>`).join('')}</div>`,'<span class="small muted">Pick your reply</span>');
  modal.querySelector('[data-choice]')?.focus();return;}
 storyModal(key,idx,list,b.w,`<p class="story-line">${nameFill(b.t)}</p>`,`${last?'':`<button class="btn secondary" data-action="close-modal">Skip</button>`}<button class="btn" data-story="${key},${idx+1}">${last?(key==='ending'?'Finish':'Let’s go'):'Next'} →</button>`);
 if(b.w==='nova')fx('beep');
 modal.querySelector('[data-story]')?.focus();}
/* The player picked a reply: show it as "You", then the cast member's answer. */
function pickChoice(key,idx,n){const list=beat(key),b=list[idx],c=b?.choices?.[n];if(!c)return;
 if(c[3]){state.choices[key]=c[3];save();}
 const last=idx===list.length-1;sfx('good');
 storyModal(key,idx,list,c[1],`<p class="you-said"><b>You:</b> ${esc(c[0])}</p><p class="story-line">${nameFill(c[2])}</p>`,`<button class="btn" data-story="${key},${idx+1}">${last?'Let’s go':'Next'} →</button>`);
 modal.querySelector('[data-story]')?.focus();}
function queueStory(){requestAnimationFrame(nextPopup);}
function nextPopup(){if(modal.open||shipping)return;const k=storyKey();if(k&&!state.story.includes(k)&&STORY[k]){playStory(k);return;}const l=learnKey();if(l&&!state.learned.includes(l))learnCard();}
function radioButton(){const k=storyKey(),w=beat(k)[0]?.w||'sam';return `<button class="radio-btn" data-story="${k},0" title="Replay radio message" aria-label="Replay radio message">${portrait(w)}</button>`;}

/* ---------- Modals ---------- */
function showModal(title,body,footer='',tag='Field notes'){if(!modal.open)returnFocus=document.activeElement;modal.innerHTML=`<div class="modal-inner"><div class="modal-head"><div><div class="eyebrow">${tag}</div><h2 id="modal-title">${title}</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||'<span></span><button class="btn" data-action="close-modal">Back to work</button>'}</div></div>`;if(!modal.open)modal.showModal();modal.querySelector('.modal-footer .btn, .modal-close')?.focus();}
function closeModal(){if(modal.open)modal.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});requestAnimationFrame(nextPopup);}
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
function notebook(i=state.current){showModal('Notebook',`<div class="notebook-tabs" aria-label="Rooms">${ROOMS.map((r,k)=>`<button data-notebook="${k}" class="${k===i?'active':''}" ${canVisit(k)?'':'disabled'}>${k+1} · ${r.name}</button>`).join('')}</div><ul class="note-list">${state.notes[i].map(n=>`<li>${esc(n)}</li>`).join('')||'<li class="muted">Nothing yet. Notes appear as you finish each step.</li>'}</ul>${state.solved[i]?`<div class="notebook-code">Form code: <b>${ROOMS[i].code}</b> <button class="text-btn" data-copy="${i}">Copy</button></div>`:''}`,undefined,'Your notebook');}
function howto(page=0){const pages=[['How a room works','<p><strong>1. Learn.</strong> Each step starts with a short Learn card. Read it, then click “Let’s do it”.</p><p><strong>2. Do.</strong> The <strong>blue box</strong> above the workbench always tells you exactly what to do next. Stuck? Press <strong>💡 Hint</strong> and the right thing glows.</p><p><strong>3. Earn stars.</strong> Finish a step with few mistakes and no hints for ★★★. Mistakes are fine: Sam, Mira or NOVA explains what went wrong.</p><p><strong>4. Talk back.</strong> In radio messages you sometimes pick your reply. One of your guesses comes back at the end, when NOVA finally finds out what caused the surge.</p>'],['Exchange the codes','<p><strong>Game → Form.</strong> Finish a room to reveal its NOVA code. Enter it in the matching Form section and click Next.</p><p><strong>Form → Game.</strong> The next Form section shows a door code. Enter it in the game to unlock the next room.</p><p>After Room 6, submit the Form. Its confirmation message gives the final code for the dispatch dock.</p>'],['Clock and saving','<p>Play alone or with others. Progress saves in this browser after every step.</p><p>The 25-minute clock keeps running while you read or use the Form. At zero, choose Continue training to finish.</p><p>Click the portrait next to a room’s name to replay its radio message.</p><p>🔊 turns sound effects on or off. 🎵 turns the background music on or off.</p>']];showModal(pages[page][0],pages[page][1],`<span class="small muted">${page+1} / 3</span><div class="gate-actions">${page?`<button class="btn secondary" data-help="${page-1}">← Back</button>`:''}${page<2?`<button class="btn" data-help="${page+1}">Next →</button>`:'<button class="btn" data-action="close-modal">Ready</button>'}</div>`,'How to play');}
/* Shown once when the page opens: the 1280×720 stage is much easier to read in full screen. */
function isFullscreen(){return !!document.fullscreenElement||(Math.abs(innerHeight-screen.height)<4&&Math.abs(innerWidth-screen.width)<4);}
function fullscreenPrompt(){if(isFullscreen()||modal.open)return;const can=!!document.documentElement.requestFullscreen;
 showModal('Play in full screen',`<div class="fs-prompt"><div class="fs-icon" aria-hidden="true">⛶</div><div><p><strong>This game works best in full screen.</strong> Everything gets bigger and easier to read, and nothing is cut off.</p><p class="small muted">${can?'Click the button below.':'Use your browser’s full screen option.'} You can also press <kbd>F11</kbd> (Windows) or <kbd>Ctrl</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd> (Mac). The ⛶ button in the top right corner switches it on or off any time.</p></div></div>`,
  `<button class="btn secondary" data-action="close-modal">Not now</button>${can?'<button class="btn" data-action="go-fullscreen">⛶ Go full screen</button>':''}`,'Before you start');
 modal.querySelector('[data-action="go-fullscreen"]')?.focus();}
function sources(){showModal('Sources',`<div class="source-list">${SOURCES.map(([org,title,url])=>`<div><a href="${url}" target="_blank" rel="noopener noreferrer">${org} ↗</a><small>${title}</small></div>`).join('')}</div>${Object.values(PHOTOS).some(p=>p.credit)?`<h3 style="margin-top:18px">Photo credits</h3><ul class="small">${Object.values(PHOTOS).filter(p=>p.credit).map(p=>`<li>${p.caption}: ${p.credit}</li>`).join('')}</ul>`:''}<p class="small muted" style="margin-top:18px">Nova, the batch, the readings and the specs are fictional training examples, and the equipment steps are simplified. The career information is based on these sources.</p>`);}
function menu(){showModal('Menu',`<div class="menu-grid"><button class="btn secondary" data-action="howto">How to play</button><button class="btn secondary" data-action="guide">Career guide</button><button class="btn secondary" data-action="sources">Career sources</button><button class="btn secondary" data-action="notebook">Notebook</button><button class="btn danger" data-action="restart">Start a new game</button></div><p class="small muted" style="margin-top:22px">The clock keeps running in menus and in the Form. Progress is saved after every step.</p>`);}
function restartPrompt(){showModal('Start fresh?',`<p>This starts a new shift with new random readings, specs and layouts. Saved progress in this browser is cleared.</p><p>Your submitted Google Form responses are not changed.</p>`,`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn danger" data-action="confirm-restart">Start fresh</button>`);}
/* The Form opens in a panel inside the game: a new tab would end full screen. The iframe is created once and only hidden,
   so the player's answers survive closing and reopening the panel. */
function openForm(){if(!formURL){toast('Open the Google Form provided for this game in another tab.');return;}
 if(!FORM_EMBED_URL){openFormTab();return;}
 const panel=document.getElementById('form-panel'),frame=document.getElementById('form-frame');
 if(!frame.firstChild)frame.innerHTML=`<iframe src="${esc(FORM_EMBED_URL)}" title="Google Form" loading="eager"></iframe>`;
 const i=state.current,showCode=state.startedAt&&state.solved[i],needDoor=showCode&&!state.released[i]&&view==='gate';
 document.getElementById('form-bar').innerHTML=`<div class="form-title"><b>📝 Google Form</b><small>Your answers are kept.</small></div>
  ${showCode?`<div class="form-code"><span>Room ${i+1} code</span><b>${ROOMS[i].code}</b><button class="text-btn" data-copy="${i}">Copy</button></div>`:''}
  ${needDoor?`<form class="form-door" id="form-door"><label for="form-door-code">Door code</label><input class="input" id="form-door-code" autocomplete="off" spellcheck="false" autocapitalize="characters" maxlength="24" placeholder="GATE-…"><button class="btn" type="submit">Unlock →</button></form>`:''}
  <div class="form-actions"><button class="text-btn" data-action="form-tab" title="Open the Form in a new tab (this ends full screen)">New tab ↗</button><button class="btn" data-action="close-form">← Back to the game</button></div>`;
 document.getElementById('form-door')?.addEventListener('submit',e=>{e.preventDefault();const v=document.getElementById('form-door-code').value;if(unlockGate(v))closeForm();else toast(feedback);});
 panel.hidden=false;document.body.classList.add('form-open');panel.querySelector('[data-action="close-form"]').focus();}
function closeForm(){const panel=document.getElementById('form-panel');if(panel.hidden)return;panel.hidden=true;document.body.classList.remove('form-open');document.getElementById('return-code')?.focus();}
function openFormTab(){if(formWindow&&!formWindow.closed){formWindow.focus();return;}if(formOpened){showModal('Your Google Form',`<p>Use the Form tab you already opened to keep your response. If you closed it, use this link.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Reopen Form ↗</a>`);return;}const w=window.open('about:blank','_blank');if(w){w.opener=null;w.location.replace(formURL);formWindow=w;formOpened=true;}else showModal('Open your Form',`<p>Your browser blocked the new tab.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Open Google Form ↗</a>`);}
/* If full screen ends (Esc, a new tab), offer a one-click way back once the game has started. */
let wantFullscreen=false;
document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement)wantFullscreen=true;document.getElementById('fs-return').hidden=!!document.fullscreenElement||!wantFullscreen;});
async function copyCode(i){if(!state.solved[i])return;try{await copyText(ROOMS[i].code);toast('Copied '+ROOMS[i].code);}catch{showModal('Copy your code',`<p>Select the code and copy it with Ctrl+C.</p><input class="input" id="manual-copy" readonly aria-label="Room code" value="${ROOMS[i].code}">`);document.getElementById('manual-copy').select();}}

/* ---------- Fun: sound effects and confetti ---------- */
let audioCtx=null;
function sfx(kind){if(!state.sound)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const notes={good:[660,880],bad:[220,180],done:[523,659,784,1047],hint:[880]}[kind]||[];
 notes.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.09;o.type=kind==='bad'?'square':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='bad'?.04:.07,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g).connect(fxOut());o.start(t);o.stop(t+.2);});duck(500);}catch{}}
/* Air-shower whoosh: looping filtered noise with a fast flutter, like air jets. Plays while the button is held. */
const airSound={node:null,
 start(){if(!state.sound||this.node)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume?.()?.catch?.(()=>{});
  const sr=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,sr*2,sr),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=audioCtx.createBufferSource();src.buffer=buf;src.loop=true;
  const hp=audioCtx.createBiquadFilter();hp.type='highpass';hp.frequency.value=250;
  const bp=audioCtx.createBiquadFilter();bp.type='bandpass';bp.Q.value=0.7;const t=audioCtx.currentTime;bp.frequency.setValueAtTime(500,t);bp.frequency.linearRampToValueAtTime(1300,t+0.5);
  const lfo=audioCtx.createOscillator(),depth=audioCtx.createGain();lfo.frequency.value=7;depth.gain.value=220;lfo.connect(depth).connect(bp.frequency);
  const g=audioCtx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.16,t+0.4);
  src.connect(hp).connect(bp).connect(g).connect(fxOut());src.start();lfo.start();this.node={src,lfo,g};bgm.level();}catch{}},
 stop(fade=0.25){const n=this.node;if(!n)return;this.node=null;duck(fade*1000+300);try{const t=audioCtx.currentTime;n.g.gain.cancelScheduledValues(t);n.g.gain.setValueAtTime(Math.max(n.g.gain.value,0.0001),t);n.g.gain.exponentialRampToValueAtTime(0.0001,t+fade);n.src.stop(t+fade+0.05);n.lfo.stop(t+fade+0.05);}catch{}}
};
/* Machine and tool sounds, all synthesized (no audio files). fx(name) plays a one-shot; machineLoop() a held hum. */
function ac(){audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume?.()?.catch?.(()=>{});return audioCtx;}
let fxBus=null;
function fxOut(){const c=ac();if(!fxBus){const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;fxBus=c.createGain();fxBus.gain.value=1.6;fxBus.connect(comp).connect(c.destination);}return fxBus;}
let noiseBuf=null;
function noise(){const c=ac();if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const s=c.createBufferSource();s.buffer=noiseBuf;s.loop=true;return s;}
function env(g,t,peak,att,dur){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
/* Filtered noise burst. type: lowpass/highpass/bandpass; f may be [from,to] for a sweep. */
function noiseHit({type='bandpass',f=1000,q=1,peak=.15,att=.01,dur=.3,at=0}){const c=ac(),t=c.currentTime+at,s=noise(),fl=c.createBiquadFilter(),g=c.createGain();fl.type=type;fl.Q.value=q;
 if(Array.isArray(f)){fl.frequency.setValueAtTime(f[0],t);fl.frequency.exponentialRampToValueAtTime(f[1],t+dur);}else fl.frequency.value=f;
 env(g,t,peak,att,dur);s.connect(fl).connect(g).connect(fxOut());s.start(t,Math.random());s.stop(t+dur+.05);}
function tone({f=440,to,type='sine',peak=.08,att=.005,dur=.15,at=0}){const c=ac(),t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);env(g,t,peak,att,dur);o.connect(g).connect(fxOut());o.start(t);o.stop(t+dur+.05);}
const FX={
 rustle(){for(let k=0;k<3;k++)noiseHit({type:'highpass',f:2500,peak:.06,dur:.12,at:k*.07});},          // cleanroom fabric
 clunk(){tone({f:140,to:60,type:'triangle',peak:.18,dur:.18});noiseHit({type:'lowpass',f:500,peak:.08,dur:.08});}, // into the locker / bin
 water(){noiseHit({type:'bandpass',f:[900,1600],q:.6,peak:.12,att:.08,dur:1.1});for(let k=0;k<5;k++)tone({f:500+Math.random()*700,to:900+Math.random()*900,peak:.025,dur:.06,at:.15+k*.17});}, // rinse spray
 bubbles(){for(let k=0;k<8;k++)tone({f:300+Math.random()*300,to:700+Math.random()*500,peak:.04,dur:.07,at:k*.09+Math.random()*.04});}, // developer bath
 uv(){tone({f:120,type:'sawtooth',peak:.03,att:.05,dur:.9});tone({f:2400,peak:.015,att:.05,dur:.9});noiseHit({type:'highpass',f:6000,peak:.05,dur:.06});}, // lamp flash
 hiss(){noiseHit({type:'highpass',f:[1500,4000],peak:.13,att:.05,dur:.9});}, // O2 plasma strip / nitrogen gun
 tick(){tone({f:2000,type:'square',peak:.03,dur:.03});},                           // stage step / probe touch
 click(){tone({f:1200,type:'square',peak:.04,dur:.025});tone({f:600,type:'square',peak:.03,dur:.03,at:.03});}, // switch, monitor, tool
 stamp(){tone({f:220,to:90,type:'triangle',peak:.12,dur:.1});noiseHit({type:'lowpass',f:900,peak:.06,dur:.05});}, // ink dot
 saw(){tone({f:900,to:1400,type:'sawtooth',peak:.03,att:.05,dur:.5});noiseHit({type:'bandpass',f:3000,q:2,peak:.07,att:.05,dur:.5});}, // dicing blade
 vacuum(){tone({f:300,to:900,type:'sine',peak:.05,dur:.18});noiseHit({type:'highpass',f:[3000,1200],peak:.05,dur:.18});}, // vacuum pen pick
 beep(){tone({f:1320,type:'square',peak:.035,dur:.08});tone({f:1760,type:'square',peak:.035,dur:.08,at:.1});}, // instrument / system beep
 thud(){tone({f:90,to:50,type:'sine',peak:.2,dur:.22});},
 paper(){noiseHit({type:'bandpass',f:[3000,1800],q:.8,peak:.08,att:.02,dur:.25});},
 pen(){noiseHit({type:'bandpass',f:4000,q:3,peak:.06,dur:.08});noiseHit({type:'bandpass',f:3500,q:3,peak:.05,dur:.07,at:.09});},
 scribble(){for(let k=0;k<5;k++)noiseHit({type:'bandpass',f:3000+Math.random()*1500,q:3,peak:.05,dur:.07,at:k*.08});},
 alarm(){for(let k=0;k<3;k++){tone({f:880,type:'square',peak:.03,dur:.12,at:k*.26});tone({f:660,type:'square',peak:.03,dur:.12,at:k*.26+.13});}},
 horn(){tone({f:233,type:'sawtooth',peak:.05,att:.03,dur:.5});tone({f:294,type:'sawtooth',peak:.04,att:.03,dur:.5});tone({f:233,type:'sawtooth',peak:.05,att:.03,dur:.7,at:.6});tone({f:294,type:'sawtooth',peak:.04,att:.03,dur:.7,at:.6});}
};
const FX_MS={water:1300,uv:1000,hiss:1000,alarm:900,horn:1500,bubbles:900,saw:700};
function fx(name){if(!state.sound||!FX[name])return;try{FX[name]();duck((FX_MS[name]||400)+300);}catch{}}
/* Held machine hum: 'motor' (spin coater, follows set(rpm)) or 'plasma' (etcher buzz). */
const loops=new Set();
function machineLoop(kind){if(!state.sound)return {set(){},stop(){}};try{const c=ac(),t=c.currentTime,g=c.createGain(),o=c.createOscillator(),n=noise(),fl=c.createBiquadFilter();
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='plasma'?.06:.05,t+.3);
 if(kind==='plasma'){o.type='sawtooth';o.frequency.value=60;fl.type='bandpass';fl.frequency.value=2200;fl.Q.value=4;}else{o.type='triangle';o.frequency.value=80;fl.type='bandpass';fl.frequency.value=800;fl.Q.value=1.5;}
 const og=c.createGain();og.gain.value=.6;o.connect(og).connect(g);n.connect(fl).connect(g);g.connect(fxOut());o.start();n.start();
 const h={set(rpm){if(kind!=='motor')return;const x=Math.min(1,rpm/6000),now=c.currentTime;o.frequency.setTargetAtTime(80+x*420,now,.05);fl.frequency.setTargetAtTime(600+x*2400,now,.05);},
  stop(){if(!loops.delete(h))return;duck(600);try{const now=c.currentTime;g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(Math.max(g.gain.value,.0001),now);g.gain.exponentialRampToValueAtTime(.0001,now+.3);o.stop(now+.35);n.stop(now+.35);}catch{}}};
 loops.add(h);bgm.level();return h;}catch{return {set(){},stop(){}};}}
function stopLoops(){[...loops].forEach(h=>h.stop());airSound.stop(0.1);}

/* Background music: bgm/bgm1.mp3, bgm/bgm2.mp3, … (the bgm folder next to index.html), played in order, then the list repeats.
   On by default; the 🎵 button turns it off (remembered in this browser). Browsers only allow audio after a click or key press. */
const BGM_KEY='nova-last-batch-bgm';
/* Ducking: while a sound effect plays (or a machine runs) the music drops to DUCK, then fades back to BASE. */
const BGM_BASE=.22,BGM_DUCK=.04;let duckUntil=0;
function duck(ms){duckUntil=Math.max(duckUntil,performance.now()+ms);bgm.level();}
const bgm={el:null,n:1,on:readStore(BGM_KEY)!=='off',missing:false,vol:BGM_BASE,timer:0,
 target(){return loops.size||airSound.node||performance.now()<duckUntil?BGM_DUCK:BGM_BASE;},
 level(){if(!this.el||this.timer)return;this.timer=setInterval(()=>{const t=this.target(),d=t-this.vol;
  this.vol=Math.abs(d)<.005?t:this.vol+(d<0?Math.max(d,-.06):Math.min(d,.012)); // fast down (~0.1 s), slow back up (~0.8 s)
  this.el.volume=this.vol;if(this.vol===t&&t===BGM_BASE){clearInterval(this.timer);this.timer=0;}},50);},
 start(){if(!this.on||this.missing)return;if(!this.el){this.el=new Audio();this.el.volume=this.vol;this.el.preload='auto';this.el.addEventListener('ended',()=>this.load(this.n+1));this.el.addEventListener('error',()=>this.fail());this.load(1);return;}this.el.play().catch(()=>{});},
 load(n){this.n=n;this.el.src=`bgm/bgm${n}.mp3`;if(this.on)this.el.play().catch(()=>{});},
 fail(){if(this.n===1){this.missing=true;return;}this.load(1);}, // past the last file (or bgm1 missing): back to the start
 toggle(){this.on=!this.on;try{localStorage.setItem(BGM_KEY,this.on?'on':'off');}catch{}if(this.on){this.missing=false;this.start();}else this.el?.pause();}
};
const startMusic=()=>{bgm.start();removeEventListener('pointerdown',startMusic);removeEventListener('keydown',startMusic);};
addEventListener('pointerdown',startMusic);addEventListener('keydown',startMusic);
function confetti(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const box=document.createElement('div');box.className='confetti';
 for(let n=0;n<60;n++){const c=document.createElement('i');c.style.left=Math.random()*100+'%';c.style.background=['#1c5fd4','#f2c200','#2f7d4f','#e05a47','#8e6bb8'][n%5];c.style.animationDelay=Math.random()*.4+'s';c.style.setProperty('--dx',(Math.random()*160-80)+'px');c.style.setProperty('--r',(Math.random()*720)+'deg');box.appendChild(c);}
 app.appendChild(box);setTimeout(()=>box.remove(),2200);}

/* ---------- Events ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-notebook')){const i=Number(b.dataset.notebook);if(canVisit(i))notebook(i);return;}
 if(b.hasAttribute('data-room')){const i=Number(b.dataset.room);if(canVisit(i)){state.current=i;view=state.solved[i]?'gate':'room';feedback='';save();render();}return;}
 if(b.hasAttribute('data-copy')){copyCode(Number(b.dataset.copy));return;}
 if(b.hasAttribute('data-next')){nextRoom(Number(b.dataset.next));return;}
 if(b.hasAttribute('data-help')){howto(Number(b.dataset.help));return;}
 if(b.hasAttribute('data-guide')){guide(Number(b.dataset.guide));return;}
 if(b.dataset.choice){const [k,i,n]=b.dataset.choice.split(',');pickChoice(k,Number(i),Number(n));return;}
 if(b.dataset.story){const [k,n]=b.dataset.story.split(',');playStory(k,Number(n));return;}
 switch(b.dataset.action){
  case 'resume':view=state.finishedAt?'ending':state.released.every(Boolean)?'final':state.solved[state.current]?'gate':'room';render();break;
  case 'notebook':notebook();break;
  case 'guide':guide();break;
  case 'close-modal':closeModal();break;
  case 'learn':learnCard();break;
  case 'hint':showHint(false);break;
  case 'continue':closeModal();break;
  case 'shipout':closeModal();break;
  case 'skip-scene':document.querySelector('.scene')?._finish?.();break;
  case 'sound':state.sound=!state.sound;if(!state.sound)stopLoops();save();b.textContent=state.sound?'🔊':'🔇';b.setAttribute('aria-label',state.sound?'Sound effects on':'Sound effects off');break;
  case 'music':bgm.toggle();b.classList.toggle('off',!bgm.on);b.setAttribute('aria-label',bgm.on?'Music on':'Music off');break;
  case 'howto':howto();break;
  case 'sources':sources();break;
  case 'menu':menu();break;
  case 'restart':restartPrompt();break;
  case 'open-form':openForm();break;
  case 'close-form':closeForm();break;
  case 'form-tab':closeForm();openFormTab();break;
  case 'fullscreen-back':document.documentElement.requestFullscreen?.()?.catch(()=>{});break;
  case 'training':state.training=true;save();tick();toast('Training mode on. Your final time will include overtime.');break;
  case 'go-fullscreen':closeModal();document.documentElement.requestFullscreen?.()?.catch(()=>toast('Use your browser’s fullscreen control instead.'));document.getElementById('names')?.focus();break;
  case 'fullscreen':{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();p?.catch(()=>toast('Use your browser’s fullscreen control instead.'));break;}
  case 'confirm-restart':closeModal();unmount();unmount=()=>{};state=freshState();view='landing';feedback='';try{localStorage.removeItem(SAVE_KEY);}catch{}render();document.getElementById('names')?.focus();break;
 }
});
function tick(){const t=state.finishedAt||Date.now(),left=(state.deadline-t)/1000;const clock=document.getElementById('clock');if(clock){clock.textContent=clockText();clock.classList.toggle('low',left>0&&left<300);clock.classList.toggle('expired',left<=0);clock.setAttribute('aria-label','Mission clock: '+clockText());}const training=document.getElementById('training-btn');if(training)training.hidden=!(expired()&&!state.training);
 const i=state.current,gateWait=Math.max(0,Math.ceil((state.gateUntil[i]-Date.now())/1000)),gate=document.getElementById('unlock-submit');if(gate){gate.disabled=gateWait>0;gate.textContent=gateWait?`Check the Form · ${gateWait}s`:i===5?'Go to the dispatch dock →':'Unlock Room '+(i+2)+' →';}}
document.addEventListener('visibilitychange',tick);setInterval(tick,250);
function guide(page=0){
 const pages=[
  ['Quick facts',`<div class="guide-facts"><div><strong>Trade</strong><span>Micro Electronics Manufacturer · code 630A</span></div><div><strong>Type</strong><span>Non-compulsory apprenticeship trade</span></div><div><strong>Entry</strong><span>Grade 12 (OSSD or equivalent)</span></div><div><strong>Training</strong><span>≈ 4,000 h on the job + 304 h in class (≈ 2 years)</span></div><div><strong>Credential</strong><span>Certificate of Apprenticeship (Skilled Trades Ontario)</span></div><div><strong>Exam</strong><span>No Certificate of Qualification exam · not Red Seal</span></div></div><p class="small muted">Non-compulsory means you can work in the field without the certificate. Finishing the apprenticeship proves your skills to employers.</p>`],
  ['Steps to get there',`<ol class="guide-steps">${PATHWAY.map(p=>`<li><b>${p.title}</b> <small>${p.tag}</small><p>${p.text}</p></li>`).join('')}</ol>`],
  ['What the job involves',`<p>A Micro Electronics Manufacturer <strong>sets up, operates and monitors</strong> manual, semi-automatic and automatic process equipment that makes microelectronic products, while following <strong>cleanroom procedures</strong>.</p><ul><li>Spin coating, photo aligning and developing</li><li>Etching, sputtering, implanting oxides and baking</li><li>Dicing wafers into chips</li><li>Measuring, testing and inspecting products</li><li>Recording results and tracking batches</li></ul><p><strong>Useful strengths:</strong> attention to detail, steady hands, following procedures exactly, basic math and careful record-keeping.</p>`],
  ['Other ways in',`<ul><li><strong>High school:</strong> co-op, OYAP and a Manufacturing SHSM give early experience.</li><li><strong>College:</strong> Electronics Engineering Technician (2-year) or Technologist (3-year) diplomas at Ontario colleges lead to technician roles in fabs and electronics plants.</li><li><strong>University:</strong> Electrical, Computer, Engineering Physics or Nanotechnology Engineering lead to process, equipment and design engineering.</li><li><strong>Safety first:</strong> WHMIS training is required for workers who handle hazardous products, and fabs use many chemicals.</li></ul><p class="small muted">Always check the latest details with Skilled Trades Ontario and Employment Ontario (see Menu → Career sources).</p>`]
 ];
 const [t,b]=pages[page];
 showModal(t,`<div class="guide-tabs">${pages.map(([n],k)=>`<button data-guide="${k}" class="${k===page?'active':''}">${n}</button>`).join('')}</div>${b}`,`<span class="small muted">${page+1} / ${pages.length}</span><div class="gate-actions">${page?`<button class="btn secondary" data-guide="${page-1}">← Back</button>`:''}${page<pages.length-1?`<button class="btn" data-guide="${page+1}">Next →</button>`:'<button class="btn" data-action="close-modal">Done</button>'}</div>`,'ONTARIO CAREER GUIDE');
}
render();fullscreenPrompt();
