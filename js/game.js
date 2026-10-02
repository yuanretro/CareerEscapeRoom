"use strict";
// The Google Form players swap codes with. Leave blank to hide the Form buttons.
const DEFAULT_FORM_URL = 'https://forms.gle/tY4uzBWDxj7RLszAA';
const SAVE_KEY='nova-last-batch-v7';
const FORM_KEY='nova-last-batch-form-v1';
const VERSION=7;
const MISSION_MS=25*60*1000;
const app=document.getElementById('app'),modal=document.getElementById('modal');
let view='landing',feedback='',feedbackError=false,returnFocus=null,toastTimer=null,formWindow=null,formOpened=false,lastView=null,unmount=()=>{};

function freshState(){return {version:VERSION,names:[],startedAt:null,deadline:null,finishedAt:null,finalCleared:false,current:0,progress:Array(6).fill(0),solved:Array(6).fill(false),released:Array(6).fill(false),gateUntil:Array(6).fill(0),training:false,variant:null,story:[],notes:Array.from({length:6},()=>[]),plan:[]};}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeFormURL(v){try{const u=new URL(String(v).trim());return u.protocol==='https:'&&((u.hostname==='docs.google.com'&&/^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(u.pathname))||u.hostname==='forms.gle')?u.href:'';}catch{return '';}}
function readStore(k){try{return localStorage.getItem(k);}catch{return null;}}
function loadState(){try{
 const s=JSON.parse(readStore(SAVE_KEY)||'null');
 if(!s||s.version!==VERSION||!Array.isArray(s.names)||!s.names.length||!s.variant)return freshState();
 for(const k of ['progress','solved','released','gateUntil','notes'])if(!Array.isArray(s[k])||s[k].length!==6)return freshState();
 if(!Number.isFinite(s.startedAt)||s.deadline!==s.startedAt+MISSION_MS||!Number.isInteger(s.current)||s.current<0||s.current>5)return freshState();
 if(s.current>0&&!s.released[s.current-1])return freshState();
 s.story=Array.isArray(s.story)?s.story:[];s.plan=Array.isArray(s.plan)?s.plan:[];return s;
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
const who=()=>state.names.length>1?'team':state.names[0]||'trainee';

/* ---------- Shell ---------- */
function header(playing=true){
 const nav=playing?`<nav class="room-nav" aria-label="Rooms">${ROOMS.map((r,i)=>`<button data-room="${i}" class="${state.current===i&&(view==='room'||view==='gate')?'active ':''}${state.released[i]?'done':''}" title="Room ${i+1}: ${r.name}" aria-label="Room ${i+1}: ${r.name}${!canVisit(i)?', locked':''}" ${canVisit(i)?'':'disabled'}>${state.released[i]?'✓':i+1}</button>${i<5?`<i class="${state.released[i]?'lit':''} ${i===3?'gap':''}"></i>`:''}`).join('')}</nav>`:'';
 const actions=playing?`<button class="text-btn" data-action="notebook">Notebook</button><button class="text-btn" data-action="guide">Career guide</button>${formURL?'<button class="text-btn" data-action="open-form">Form ↗</button>':''}<button class="text-btn" data-action="menu">Menu</button><button class="text-btn warn" id="training-btn" data-action="training" ${expired()&&!state.training?'':'hidden'}>Continue training</button><span id="clock" class="clock">${clockText()}</span>`:'<button class="text-btn" data-action="guide">Career guide</button><button class="text-btn" data-action="howto">How to play</button>';
 return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">N</div><div><b>The Last Batch</b><small>Nova Semiconductor · Ontario</small></div></div>${nav}<div class="top-actions">${actions}<button class="text-btn icon" data-action="fullscreen" aria-label="Toggle fullscreen">⛶</button></div></header><small class="creator-credit">Made by Haolun, William, and Gordan</small>`;
}
function render(){unmount();unmount=()=>{};
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
 <p class="lede">Your first night shift at a chip factory. A power surge has wiped a batch of heart-monitor chips, and the truck leaves at dawn. Gown up, print the circuit, test and cut the wafer, inspect every part. Then, in the training office, map your real route into the trade.</p>
 <div class="fact-row">${facts.map(([a,b])=>`<div class="fact"><strong>${a}</strong><span>${b}</span></div>`).join('')}</div>
 <div class="cast">${['sam','mira','nova'].map(k=>`<div class="cast-member">${portrait(k)}<span><b>${CAST[k].name}</b>${CAST[k].role}</span></div>`).join('')}</div></div>
 <figure class="hero-plan">${floorPlan()}<figcaption>Rooms 1–4 are the factory floor. Rooms 5–6 are the training office.</figcaption></figure>
 <div class="landing-bottom">${state.startedAt?`<div class="resume-card"><b>Your mission is saved.</b><p>${esc(state.names.join(', '))} · ${state.released.filter(Boolean).length}/6 doors unlocked</p><div class="gate-actions"><button class="btn" data-action="resume">${state.finishedAt?'View result':'Resume mission'} →</button><button class="btn secondary" data-action="restart">Start fresh</button></div></div>`:`<form id="start-form" class="signup"><label for="names">Player name(s)</label><div class="input-row"><input class="input" id="names" maxlength="600" autocomplete="off" placeholder="Your name, or names separated by commas" aria-describedby="name-error"><button class="btn" type="submit">Start shift →</button></div><p id="name-error" class="inline-error" role="alert"></p></form>`}
 <div class="instructions-strip"><div><b>Hands-on</b>Work real fab stations: gowning, lithography, probing, dicing, inspection.</div><div><b>Learn by doing</b>Each station has a procedure card. Mistakes explain why.</div><div><b>Unlock</b>Swap codes with the Google Form to open each door.</div></div></div></main>`;
 document.getElementById('start-form')?.addEventListener('submit',startMission);
}
function startMission(e){e.preventDefault();if(state.startedAt)return;const names=document.getElementById('names').value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(!names.length||names.some(n=>n.length>40)){document.getElementById('name-error').textContent='Enter at least one name. Keep each name under 41 characters.';return;}
 state=freshState();state.names=names;state.startedAt=Date.now();state.deadline=state.startedAt+MISSION_MS;state.variant=makeVariant();view='room';save();render();}

/* ---------- Room: procedure card + bench ---------- */
function stationScreen({eyebrow,title,stepper,sopTitle,sop}){
 return header()+`<main id="main" class="screen room-screen" tabindex="-1">
 <div class="room-head">${radioButton()}<div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${stepper||''}</div>
 <div class="room-body"><aside class="sop"><div class="eyebrow">Procedure card</div><h2>${sopTitle}</h2><div id="sop">${sop}</div></aside><section class="bench" id="bench" aria-label="Workbench"></section></div>
 <div class="say" id="say" role="status"><span class="say-face" id="say-face"></span><p id="say-text"></p></div></main>`;
}
function makeCtx(i,onDone){
 const career=CAREER_ROOMS.includes(i);
 return {v:state.variant,name:esc(who()),
  say(text,tone='info',speaker){const s=document.getElementById('say');if(!s)return;const w=speaker||(career?'mira':tone==='bad'?'nova':'sam');
   document.getElementById('say-face').innerHTML=portrait(w);document.getElementById('say-text').innerHTML=`<b>${CAST[w].name}:</b> ${text}`;s.className='say '+tone;s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');announce(text);},
  note(t){if(i>=0){state.notes[i].push(t);save();}},
  setSop(html){const el=document.getElementById('sop');if(el)el.innerHTML=html;},
  setPlan(list){state.plan=list;save();},
  done:onDone};
}
function renderRoom(){
 const i=state.current,r=ROOMS[i],k=Math.min(state.progress[i],r.steps.length-1),step=r.steps[k];
 const stepper=`<ol class="stepper">${r.steps.map((s,n)=>`<li class="${n<state.progress[i]?'done':n===k?'now':''}"><span>${n<state.progress[i]?'✓':n+1}</span>${s.title}</li>`).join('')}</ol>`;
 app.innerHTML=stationScreen({eyebrow:`Room ${i+1} of 6 · ${r.short}`,title:r.name,stepper,sopTitle:`Step ${k+1} · ${step.title}`,sop:step.sop});
 const ctx=makeCtx(i,()=>stepDone(i,k));
 ctx.say(i<4?'Read the procedure card, then work at the bench.':'Read the card on the left, then get started.',
  'info');
 unmount=TASKS[step.task](document.getElementById('bench'),ctx)||(()=>{});
}
function stepDone(i,k){
 if(view!=='room'||state.current!==i||state.progress[i]!==k)return;const step=ROOMS[i].steps[k];
 if(step.note)state.notes[i].push(step.note);state.progress[i]++;
 if(state.progress[i]>=ROOMS[i].steps.length){state.solved[i]=true;view='gate';save();render();cinematic(`Room ${i+1} · complete`);announce('Room complete. Enter the code in Google Forms.');}
 else{save();render();cinematic(`Step ${k+1} done`);}
}
function cinematic(text){const el=document.createElement('div');el.className='cinematic';el.innerHTML=`<div class="cine-text">${esc(text)}</div>`;app.appendChild(el);setTimeout(()=>el.remove(),1300);}

/* ---------- Gate (Form code exchange) ---------- */
function renderGate(){const i=state.current,r=ROOMS[i],notes=state.notes[i].filter(n=>!n.startsWith('Mira:'));
 app.innerHTML=header()+`<main id="main" class="screen gate-screen" tabindex="-1"><div class="gate-heading"><div class="eyebrow">Room ${i+1} · ${r.name} · complete</div><h1>${state.released[i]?'Door unlocked.':'The door needs two codes.'}</h1></div>
 <div class="gate-layout"><section class="gate-card"><div class="step-label"><span>1</span>Game → Google Form</div><p>Enter this code in <strong>Room ${i+1}</strong> of your Google Form, then click <strong>${i===5?'Submit':'Next'}</strong>.</p><div class="room-code" tabindex="0">${r.code}</div><div class="gate-actions"><button class="btn secondary" data-copy="${i}">Copy code</button>${formURL?'<button class="btn secondary" data-action="open-form">Open Form ↗</button>':''}</div></section>
 <section class="gate-card"><div class="step-label"><span>2</span>Google Form → Game</div>${state.released[i]?`<p class="receipt-success">Return code accepted. This door stays unlocked.</p><button class="btn" data-next="${i}">${i===5?(state.finalCleared?'View result':'Go to the dispatch dock'):'Enter Room '+(i+2)} →</button>`:`<p>${i===5?'The Form’s confirmation message':'The next Form section'} gives you a <strong>different code</strong>. Enter it here.</p><form class="gate-form" id="gate-form"><label class="sr-only" for="return-code">Code from the Form</label><input class="input" id="return-code" autocomplete="off" spellcheck="false" autocapitalize="characters" maxlength="24" placeholder="Code from Google Forms" aria-describedby="gate-feedback"><button class="btn" id="unlock-submit" type="submit">${i===5?'Go to the dispatch dock':'Unlock Room '+(i+2)} →</button></form><p class="feedback ${feedbackError?'error':''}" id="gate-feedback" role="status">${esc(feedback||'The code on the left goes into the Form. It won’t open this door.')}</p>`}</section>
 <section class="gate-card learned"><div class="eyebrow">What you learned here</div><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join('')||'<li>Saved to your notebook.</li>'}</ul></section></div></main>`;
 document.getElementById('gate-form')?.addEventListener('submit',e=>{e.preventDefault();unlockGate(document.getElementById('return-code').value);});}
function ensureTime(){if(expired()&&!state.training){toast('Time is up. Select Continue training at the top to finish.');return false;}return true;}
function unlockGate(value){const i=state.current;if(view!=='gate'||!state.solved[i]||state.released[i]||Date.now()<state.gateUntil[i]||!ensureTime())return false;const answer=String(value).trim().toUpperCase();
 if(!answer){setGateError('Enter the return code shown by the Form.');return false;}
 if(answer!==RETURN_CODES[i]){state.gateUntil[i]=Date.now()+5000;save();setGateError('That doesn’t open this door. Copy the new code from the Form after Next or Submit.');return false;}
 state.released[i]=true;feedback='';feedbackError=false;if(i===5)view='final';else{state.current=i+1;view='room';}save();render();cinematic(i===5?'Form verified · dock access':`Form verified · Room ${i+2} open`);return true;}
function setGateError(text){feedback=text;feedbackError=true;const el=document.getElementById('gate-feedback');if(el){el.textContent=text;el.className='feedback error';}announce(text);tick();}
function nextRoom(i){if(!state.released[i])return;closeModal();if(i===5)view=state.finalCleared?'ending':'final';else{state.current=i+1;view='room';}feedback='';save();render();}

/* ---------- Final & ending ---------- */
function renderFinal(){
 app.innerHTML=stationScreen({eyebrow:'Dawn · dispatch dock',title:'Line control',sopTitle:'Clear the alarms',sop:FINAL.sop});
 const ctx=makeCtx(-1,()=>{if(view!=='final'||state.finalCleared)return;state.finalCleared=true;state.finishedAt=Date.now();if(state.finishedAt>state.deadline)state.training=true;view='ending';save();render();cinematic('Truck away · mission complete');});
 ctx.say('Five alarms. Find the station, then fix it.','info','sam');
 unmount=TASKS.control(document.getElementById('bench'),ctx)||(()=>{});
}
function renderEnding(){const elapsed=fmt(((state.finishedAt||Date.now())-state.startedAt)/1000),onTime=state.finishedAt<=state.deadline;
 app.innerHTML=header()+`<main id="main" class="screen ending" tabindex="-1"><div class="ending-top"><div><div class="eyebrow">${onTime?'Mission complete':'Training complete · overtime'}</div><h1>Batch shipped. Route mapped.</h1><p class="lede">NB-7 left the dock at dawn. Tonight you gowned up, printed a circuit layer, probed and diced a wafer, and inspected every part. Here’s your real route into the trade in Ontario.</p></div><div class="end-stats"><div><strong>${elapsed}</strong><span>Shift time</span></div><div><strong>6 / 6</strong><span>Doors</span></div></div></div>
 <ol class="roadmap">${PATHWAY.map((p,k)=>`<li><span class="dot">${k+1}</span><b>${p.title}</b><small>${p.tag}</small></li>`).join('')}</ol>
 <div class="end-bottom"><div class="plan-card-final"><div class="eyebrow">My next moves</div><ul>${(state.plan.length?state.plan:['Talk to my guidance counsellor about co-op or OYAP']).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
 <div class="end-actions"><button class="btn" data-action="guide">Read the career guide</button><button class="btn secondary" data-action="notebook">Review notebook</button><button class="btn secondary" data-action="restart">Play again</button></div></div></main>`;}

/* ---------- Storyline ---------- */
function storyKey(){return view==='room'||view==='gate'?'r'+state.current:view==='final'?'final':view==='ending'?'ending':null;}
function playStory(key,idx=0){const beat=STORY[key];if(!beat||idx>=beat.length){closeModal();return;}
 if(!state.story.includes(key)){state.story.push(key);save();}
 const [w,line]=beat[idx],c=CAST[w],last=idx===beat.length-1;
 showModal(c.name,`<div class="story ${w}"><div class="story-fig">${portrait(w)}</div><div class="story-text"><div class="speaker">${c.role}</div><p class="story-line">${esc(line).replace('{name}',esc(who()))}</p></div></div>`,
  `<div class="story-dots" aria-label="Message ${idx+1} of ${beat.length}">${beat.map((_,k)=>`<span class="${k===idx?'on':''}"></span>`).join('')}</div><div class="gate-actions">${last?'':`<button class="btn secondary" data-action="close-modal">Skip</button>`}<button class="btn" data-story="${key},${idx+1}">${last?(key==='ending'?'Finish':'Let’s go'):'Next'} →</button></div>`,
  w==='nova'?'System alert':'Radio');
 modal.querySelector('[data-story]')?.focus();}
function queueStory(){requestAnimationFrame(()=>{const k=storyKey();if(k&&!modal.open&&!state.story.includes(k)&&STORY[k])playStory(k);});}
function radioButton(){const k=storyKey(),w=STORY[k]?.[0]?.[0]||'sam';return `<button class="radio-btn" data-story="${k},0" title="Replay radio message" aria-label="Replay radio message">${portrait(w)}</button>`;}

/* ---------- Modals ---------- */
function showModal(title,body,footer='',tag='Field notes'){if(!modal.open)returnFocus=document.activeElement;modal.innerHTML=`<div class="modal-inner"><div class="modal-head"><div><div class="eyebrow">${tag}</div><h2 id="modal-title">${title}</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||'<span></span><button class="btn" data-action="close-modal">Back to work</button>'}</div></div>`;if(!modal.open)modal.showModal();modal.querySelector('.modal-footer .btn, .modal-close')?.focus();}
function closeModal(){if(modal.open)modal.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
function notebook(i=state.current){showModal('Notebook',`<div class="notebook-tabs" aria-label="Rooms">${ROOMS.map((r,k)=>`<button data-notebook="${k}" class="${k===i?'active':''}" ${canVisit(k)?'':'disabled'}>${k+1} · ${r.name}</button>`).join('')}</div><ul class="note-list">${state.notes[i].map(n=>`<li>${esc(n)}</li>`).join('')||'<li class="muted">Nothing yet. Notes appear as you finish each step.</li>'}</ul>${state.solved[i]?`<div class="notebook-code">Form code: <b>${ROOMS[i].code}</b> <button class="text-btn" data-copy="${i}">Copy</button></div>`:''}`,undefined,'Your notebook');}
function howto(page=0){const pages=[['How a room works','<p>Each room is a real station in a chip factory. A <strong>procedure card</strong> on the left tells you what to do and why; the <strong>bench</strong> on the right is where you do it.</p><p>Make a mistake and Sam, Mira or NOVA explains what went wrong. Nothing is ever lost: just try again.</p><p>Everything you learn is saved in your <strong>notebook</strong>.</p>'],['Exchange the codes','<p><strong>Game → Form.</strong> Finish a room to reveal its NOVA code. Enter it in the matching Form section and click Next.</p><p><strong>Form → Game.</strong> The next Form section shows a door code. Enter it in the game to unlock the next room.</p><p>After Room 6, submit the Form. Its confirmation message gives the final code for the dispatch dock.</p>'],['Clock and saving','<p>Play alone or with others. Progress saves in this browser after every step.</p><p>The 25-minute clock keeps running while you read or use the Form. At zero, choose Continue training to finish.</p><p>Click the portrait next to a room’s name to replay its radio message.</p>']];showModal(pages[page][0],pages[page][1],`<span class="small muted">${page+1} / 3</span><div class="gate-actions">${page?`<button class="btn secondary" data-help="${page-1}">← Back</button>`:''}${page<2?`<button class="btn" data-help="${page+1}">Next →</button>`:'<button class="btn" data-action="close-modal">Ready</button>'}</div>`,'How to play');}
function sources(){showModal('Career sources',`<div class="source-list">${SOURCES.map(([org,title,url])=>`<div><a href="${url}" target="_blank" rel="noopener noreferrer">${org} ↗</a><small>${title}</small></div>`).join('')}</div><p class="small muted" style="margin-top:18px">Nova, the batch, the readings and the specs are fictional training examples, and the equipment steps are simplified. The career information is based on these sources.</p>`);}
function menu(){showModal('Menu',`<div class="menu-grid"><button class="btn secondary" data-action="howto">How to play</button><button class="btn secondary" data-action="guide">Career guide</button><button class="btn secondary" data-action="sources">Career sources</button><button class="btn secondary" data-action="notebook">Notebook</button><button class="btn danger" data-action="restart">Start a new game</button></div><p class="small muted" style="margin-top:22px">The clock keeps running in menus and in the Form. Progress is saved after every step.</p>`);}
function restartPrompt(){showModal('Start fresh?',`<p>This starts a new shift with new random readings, specs and layouts. Saved progress in this browser is cleared.</p><p>Your submitted Google Form responses are not changed.</p>`,`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn danger" data-action="confirm-restart">Start fresh</button>`);}
function openForm(){if(!formURL){toast('Open the Google Form provided for this game in another tab.');return;}if(formWindow&&!formWindow.closed){formWindow.focus();return;}if(formOpened){showModal('Your Google Form',`<p>Use the Form tab you already opened to keep your response. If you closed it, use this link.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Reopen Form ↗</a>`);return;}const w=window.open('about:blank','_blank');if(w){w.opener=null;w.location.replace(formURL);formWindow=w;formOpened=true;}else showModal('Open your Form',`<p>Your browser blocked the new tab.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Open Google Form ↗</a>`);}
async function copyCode(i){if(!state.solved[i])return;try{await navigator.clipboard.writeText(ROOMS[i].code);toast('Copied '+ROOMS[i].code);}catch{showModal('Copy your code',`<p>Select the code and copy it with Ctrl+C.</p><input class="input" id="manual-copy" readonly aria-label="Room code" value="${ROOMS[i].code}">`);document.getElementById('manual-copy').select();}}

/* ---------- Events ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-notebook')){const i=Number(b.dataset.notebook);if(canVisit(i))notebook(i);return;}
 if(b.hasAttribute('data-room')){const i=Number(b.dataset.room);if(canVisit(i)){state.current=i;view=state.solved[i]?'gate':'room';feedback='';save();render();}return;}
 if(b.hasAttribute('data-copy')){copyCode(Number(b.dataset.copy));return;}
 if(b.hasAttribute('data-next')){nextRoom(Number(b.dataset.next));return;}
 if(b.hasAttribute('data-help')){howto(Number(b.dataset.help));return;}
 if(b.hasAttribute('data-guide')){guide(Number(b.dataset.guide));return;}
 if(b.dataset.story){const [k,n]=b.dataset.story.split(',');playStory(k,Number(n));return;}
 switch(b.dataset.action){
  case 'resume':view=state.finishedAt?'ending':state.released.every(Boolean)?'final':state.solved[state.current]?'gate':'room';render();break;
  case 'notebook':notebook();break;
  case 'guide':guide();break;
  case 'close-modal':closeModal();break;
  case 'howto':howto();break;
  case 'sources':sources();break;
  case 'menu':menu();break;
  case 'restart':restartPrompt();break;
  case 'open-form':openForm();break;
  case 'training':state.training=true;save();tick();toast('Training mode on. Your final time will include overtime.');break;
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
render();
