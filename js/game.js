"use strict";
// Optional: put the published Google Forms responder URL here before sharing.
const DEFAULT_FORM_URL = 'https://forms.gle/tY4uzBWDxj7RLszAA';
const SAVE_KEY='nova-last-batch-v6';
const FORM_KEY='nova-last-batch-form-v1';
const VERSION=6;
const MISSION_MS=25*60*1000;
const CHALLENGE_INFO={
 shooter:['Sentinel shooter','WASD / arrows: move · hold Space or click AUTO FIRE · P: pause'],
 stacker:['Cleanroom stacker','A/D or arrows: move · W / Up: rotate · Space: drop · P: pause'],
 dodge:['Wafer warden','WASD / arrows or click: dodge three waves · P: pause'],
 memory:['Inspection memory','Watch, then repeat with keys 1–4 or clicks · P: pause'],
 timing:['Signal calibration','Space / Enter or click LOCK inside the green band · P: pause'],
 breaker:['Dispatch breaker','Mouse or A/D: paddle · Space / click: launch · P: pause']
};
const app=document.getElementById('app'),modal=document.getElementById('modal');
let lastView=null,view='landing',feedback='',feedbackError=false,returnFocus=null,toastTimer=null,formWindow=null,formOpened=false;
const disc={}; // Transient per-room discovery UI state (chat log, quiz position…).

function freshState(){return {version:VERSION,names:[],startedAt:null,deadline:null,finishedAt:null,finalBossCleared:false,current:0,seen:Array.from({length:6},()=>[]),bossCleared:Array(6).fill(false),solved:Array(6).fill(false),released:Array(6).fill(false),drafts:Array.from({length:6},()=>({})),hints:Array(6).fill(false),coolUntil:Array(6).fill(0),gateUntil:Array(6).fill(0),training:false,variant:null,story:[]};}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sameSet(a,b){return Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&b.every(x=>a.includes(x));}
function safeFormURL(v){try{const u=new URL(String(v).trim());return u.protocol==='https:'&&((u.hostname==='docs.google.com'&&/^\/forms\/d\/(?:e\/)?[^/]+\/viewform\/?$/.test(u.pathname))||u.hostname==='forms.gle')?u.href:'';}catch{return '';}}
function readStore(k){try{return localStorage.getItem(k);}catch{return null;}}
function loadState(){try{
 const s=JSON.parse(readStore(SAVE_KEY)||'null');
 if(!s||s.version!==VERSION||!Array.isArray(s.names)||!s.names.length)return freshState();
 for(const k of ['seen','bossCleared','solved','released','drafts','hints','coolUntil','gateUntil'])if(!Array.isArray(s[k])||s[k].length!==6)return freshState();
 const v=s.variant;if(!v||!Array.isArray(v.challenges)||v.challenges.length!==6||!Array.isArray(v.discover)||v.discover.length!==6||!Array.isArray(v.parts)||!Array.isArray(v.facts)||!Array.isArray(v.path))return freshState();
 if(!Number.isFinite(s.startedAt)||s.deadline!==s.startedAt+MISSION_MS||!Number.isInteger(s.current)||s.current<0||s.current>5)return freshState();
 if(!s.seen.every(a=>Array.isArray(a)&&a.every(n=>Number.isInteger(n)&&n>=0&&n<3)))return freshState();
 if(s.current>0&&!s.released[s.current-1])return freshState();
 s.story=Array.isArray(s.story)?s.story.filter(k=>typeof k==='string'):[];s.seen=s.seen.map(a=>[...new Set(a)]);s.training=!!s.training;s.finalBossCleared=!!s.finalBossCleared;return s;
 }catch{return freshState();}}
let state=loadState();
const formURL=safeFormURL(DEFAULT_FORM_URL||readStore(FORM_KEY)||'');
const C=i=>roomContent(i,state.variant);
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{document.getElementById('storage-warning').hidden=false;}}
function announce(t){document.getElementById('announcer').textContent=t;}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3300);}
function fitStage(){const w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;document.documentElement.style.setProperty('--ui-scale',String(Math.min(w/1280,h/720)));}
window.addEventListener('resize',fitStage);window.visualViewport?.addEventListener('resize',fitStage);fitStage();
function fmt(sec){const n=Math.max(0,Math.floor(sec));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function expired(){return !!(state.startedAt&&!state.finishedAt&&Date.now()>=state.deadline);}
function clockText(){if(!state.startedAt)return '25:00';const t=state.finishedAt||Date.now(),left=Math.ceil((state.deadline-t)/1000);return left>=0?fmt(left):state.training?'+'+fmt(-left):'00:00';}
function canVisit(i){return Number.isInteger(i)&&i>=0&&i<6&&(i===0||state.released[i-1]);}
function canProceed(i){return canVisit(i)&&state.bossCleared[i]&&state.solved[i]&&state.released[i];}

/* ---------- Shell ---------- */
function header(playing=true){
 const nav=playing?`<nav class="room-nav" aria-label="Rooms">${ROOMS.map((r,i)=>`<button data-room="${i}" class="${state.current===i&&view!=='ending'?'active ':''}${state.released[i]?'done':''}" title="Room ${i+1}: ${r.name}" aria-label="Room ${i+1}: ${r.name}${!canVisit(i)?', locked':''}" ${canVisit(i)?'':'disabled'}>${state.released[i]?'✓':i+1}</button>${i<5?`<i class="${state.released[i]?'lit':''}"></i>`:''}`).join('')}</nav>`:'';
 const actions=playing?`<button class="text-btn" data-action="notebook">Notebook</button><button class="text-btn" data-action="guide">Career guide</button>${formURL?'<button class="text-btn form-link" data-action="open-form">Form ↗</button>':''}<button class="text-btn" data-action="menu">Menu</button><button class="text-btn warn" id="training-btn" data-action="training" ${expired()&&!state.training?'':'hidden'}>Continue training</button><span id="clock" class="clock">${clockText()}</span>`:'<button class="text-btn" data-action="guide">Career guide</button><button class="text-btn" data-action="howto">How to play</button>';
 return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="7" y="7" width="18" height="18" rx="3"/><path d="M11 3v4m5-4v4m5-4v4M11 25v4m5-4v4m5-4v4M3 11h4m-4 5h4m-4 5h4M25 11h4m-4 5h4m-4 5h4"/><path d="M12 20v-8l8 8v-8" class="n"/></svg></div><div><b>THE LAST BATCH</b><small>NOVA SEMICONDUCTOR · ONTARIO</small></div></div>${nav}<div class="top-actions">${actions}<button class="text-btn icon" data-action="fullscreen" aria-label="Toggle fullscreen">⛶</button></div></header><small class="creator-credit">Made by Haolun, William, and Gordan</small>`;
}
function render(){window.stopRover?.();
 if(view==='landing'){renderLanding();return;}
 if(view==='ending'){if(state.finalBossCleared&&state.finishedAt){renderEnding();queueStory();}else{view=state.released.every(Boolean)?'final-boss':'gate';render();}return;}
 if(view==='final-boss'){if(state.released.every(Boolean)){renderFinalBoss();queueStory();}else{view='floor';render();}return;}
 if(!state.startedAt||!canVisit(state.current)){view='landing';renderLanding();return;}
 if(view==='puzzle'&&(!state.bossCleared[state.current]||state.seen[state.current].length<3))view='floor';
 if(view==='gate'&&!state.solved[state.current])view='floor';
 if(view==='floor')renderFloor();else if(view==='puzzle')renderPuzzle();else if(view==='gate')renderGate();
 tick();queueStory();
}
/* ---------- Storyline ---------- */
function storyKey(){return view==='floor'?'r'+state.current:view==='final-boss'?'final':view==='ending'?'ending':null;}
function storyText(t){const who=state.names.length>1?'team':state.names[0]||'trainee';return esc(t).replace('{name}',esc(who));}
function playStory(key,idx=0){const beat=STORY[key];if(!beat||idx>=beat.length){closeModal();return;}
 if(!state.story.includes(key)){state.story.push(key);save();}
 const [who,line]=beat[idx],c=CAST[who],last=idx===beat.length-1;
 showModal(c.name,`<div class="story ${who}"><div class="story-fig">${window.portrait(who)}</div><div class="story-text"><div class="speaker">${c.role}</div><p class="story-line">${storyText(line)}</p></div></div>`,
  `<div class="story-dots" aria-label="Message ${idx+1} of ${beat.length}">${beat.map((_,k)=>`<span class="${k===idx?'on':''}"></span>`).join('')}</div><div class="gate-actions">${last?'':`<button class="btn secondary" data-action="close-modal">Skip</button>`}<button class="btn" data-story="${key},${idx+1}">${last?(key==='ending'?'Finish':'Let’s go'):'Next'} →</button></div>`,
  who==='nova'?'SYSTEM ALERT':'RADIO · '+(key==='ending'?'DAWN':key==='final'?'DISPATCH DOCK':'ROOM '+(state.current+1)));
 modal.querySelector('[data-story]')?.focus();}
function queueStory(){requestAnimationFrame(()=>{const k=storyKey();if(k&&!modal.open&&!state.story.includes(k)&&STORY[k])playStory(k);});}
function radioButton(){const k=storyKey(),who=STORY[k]?.[0]?.[0]||'sam';return `<button class="radio-btn" data-story="${k},0" title="Replay radio message" aria-label="Replay radio message">${window.portrait(who)}<span>▶</span></button>`;}
// Animate a screen only when it is first shown, not on every in-place refresh.
new MutationObserver(()=>{const m=document.getElementById('main');if(!m)return;const key=view+':'+state.current;if(key!==lastView){m.classList.add('enter');lastView=key;}}).observe(app,{childList:true});

/* ---------- Landing ---------- */
function renderLanding(){
 const facts=[['Grade 12','Academic entry requirement (OSSD or equivalent)'],['≈ 2 years','About 4,000 hours of paid on-the-job training'],['304 h','Of in-class technical training'],['630A','Ontario trade code · Certificate of Apprenticeship']];
 app.innerHTML=header(false)+`<main id="main" class="screen landing" tabindex="-1">
 <div class="landing-copy"><div class="eyebrow">Ontario career escape room · Micro Electronics Manufacturer</div><h1>The last<br><em>batch.</em></h1>
 <p class="lede">First night shift at Nova Semiconductor. A power surge has locked the factory, and a batch of heart-monitor chips must ship by dawn. Save it on the factory floor (Rooms 1–4), then map your real route into the trade in the training office (Rooms 5–6).</p>
 <div class="eyebrow facts-label">The career at a glance</div><div class="fact-row">${facts.map(([a,b])=>`<div class="fact"><strong>${a}</strong><span>${b}</span></div>`).join('')}</div></div>
 <div class="hero-art">${window.renderLabScene(Math.floor(Math.random()*6),[]).replace(/tabindex="0"/g,'tabindex="-1"').replace(/role="button"/g,'role="img"').replace(/data-inspect="[0-2]"/g,'')}<div class="hero-caption"><div class="cast">${['sam','mira','nova'].map(k=>`<div class="cast-member">${window.portrait(k)}<span><b>${CAST[k].name}</b>${CAST[k].role}</span></div>`).join('')}</div></div></div>
 <div class="landing-bottom">${state.startedAt?`<div class="resume-card"><b>Your mission is saved.</b><p>${esc(state.names.join(', '))} · ${state.released.filter(Boolean).length}/6 checkpoints unlocked</p><div class="gate-actions"><button class="btn" data-action="resume">${state.finishedAt?'View result':'Resume mission'} →</button><button class="btn secondary" data-action="restart">Start fresh</button></div></div>`:`<form id="start-form" class="signup"><label for="names">Player name(s)</label><div class="input-row"><input class="input" id="names" maxlength="600" autocomplete="off" placeholder="Your name, or names separated by commas" aria-describedby="name-error"><button class="btn" type="submit">Start mission →</button></div><p id="name-error" class="inline-error" role="alert"></p></form>`}
 <div class="instructions-strip"><div><b>01 · CHALLENGE</b>A short arcade game guards each room.</div><div><b>02 · DISCOVER</b>Microscope, mentor chat, myth-or-fact, decoder, lab walk or maze.</div><div><b>03 · UNLOCK</b>Swap codes with the Google Form to open the next door.</div></div></div></main>`;
 document.getElementById('start-form')?.addEventListener('submit',startMission);
}
function startMission(e){e.preventDefault();if(state.startedAt)return;const names=document.getElementById('names').value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(!names.length||names.some(n=>n.length>40)){document.getElementById('name-error').textContent='Enter at least one name. Keep each name under 41 characters.';return;}
 state=freshState();state.names=names;state.startedAt=Date.now();state.deadline=state.startedAt+MISSION_MS;state.variant=makeVariant();view='floor';feedback='';Object.keys(disc).forEach(k=>delete disc[k]);window.resetRover?.();save();render();focusGame();}

/* ---------- Room floor: challenge, then discovery ---------- */
function reportStatus(i,k){const read=state.seen[i].includes(k),how=DISCOVERY[state.variant.discover[i]].name.toLowerCase();return `<button class="record-btn report-status ${read?'seen':''}" ${read?`data-evidence="${i},${k}"`:'disabled'} aria-label="File ${k+1}: ${read?'collected, open':'not collected'}"><span class="number">${read?'✓':k+1}</span><span>${read?C(i).evidence[k].title:'Locked file'}<small>${read?'Open again':'Unlock via '+how}</small></span></button>`;}
function defeatedBoss(i){if(view!=='floor'||i!==state.current||!canVisit(i)||state.bossCleared[i])return;state.bossCleared[i]=true;save();render();focusGame();announce('Challenge complete. Now uncover the three clue files.');}
function renderFloor(){
 const i=state.current,r=ROOMS[i],cleared=state.bossCleared[i],ch=state.variant.challenges[i],dk=state.variant.discover[i],d=DISCOVERY[dk];
 const controls=cleared?d.how:CHALLENGE_INFO[ch][1],seen=state.seen[i].length;
 const step=(n,label,name,state_)=>`<div class="step-chip ${state_}"><span>${state_==='done'?'✓':n}</span><div><small>${label}</small>${name}</div></div>`;
 app.innerHTML=header()+`<main id="main" class="screen floor-screen" tabindex="-1">
 <div class="room-heading">${radioButton()}<div><div class="eyebrow">Room ${i+1} of 6 · ${r.short}</div><h1>${r.name}</h1></div><p class="room-intro">${C(i).intro}</p>
 <div class="steps">${step(1,'Challenge',CHALLENGE_INFO[ch][0],cleared?'done':'now')}${step(2,'Discover',d.name,!cleared?'':seen===3?'done':'now')}${step(3,'Solve',r.verb,seen===3&&cleared?'now':'')}</div></div>
 <div class="map-frame ${cleared&&dk!=='maze'?'html':''}" id="stage">${cleared&&dk!=='maze'?discoveryHTML(i):`<canvas id="rover" width="1000" height="460" tabindex="0" role="img" aria-label="${esc(controls)}"></canvas>`}</div>
 <div class="floor-actions">${[0,1,2].map(k=>reportStatus(i,k)).join('')}<button class="btn" data-action="open-puzzle" ${!cleared||seen<3?'disabled':''}>${state.solved[i]?'Open checkpoint':'Open puzzle'} →</button></div>
 <div class="floor-controls"><span id="rover-status" role="status">${esc(controls)}</span><span>${seen}/3 files unlocked</span></div></main>`;
 const cv=document.getElementById('rover');
 if(!cleared){
  if(ch==='shooter')window.startRover(cv,i,state.seen[i],k=>collectFromMaze(i,k),[],{seed:state.variant.mazeSeed,bossCleared:false,onBossDefeated:()=>defeatedBoss(i)});
  else if(ch==='dodge')window.startNovaEncounter(cv,'dodge',()=>defeatedBoss(i));
  else window.startArcadeEncounter(cv,ch,()=>defeatedBoss(i));
  return;
 }
 if(dk==='maze')window.startRover(cv,i,state.seen[i],k=>collectFromMaze(i,k),[],{seed:state.variant.mazeSeed,bossCleared:true});
 else bindDiscovery(i);
}
function collectFromMaze(i,k){if(window.roverCanInspect?.(i,k))collect(i,k);else if(state.seen[i].includes(k))openEvidence(i,k);}
function nextClue(i){return [0,1,2].find(k=>!state.seen[i].includes(k));}
function collect(i,k){
 if(view!=='floor'||i!==state.current||!state.bossCleared[i]||!Number.isInteger(k)||k<0||k>2)return;
 if(!state.seen[i].includes(k)){state.seen[i].push(k);save();render();if(state.seen[i].length===3)announce('All three files unlocked. Open the puzzle.');}
 openEvidence(i,k);
}

/* ---------- Discovery modes ---------- */
function discoveryHTML(i){
 const v=state.variant,kind=v.discover[i],seen=state.seen[i],D=disc[i]||(disc[i]={log:[],quizPos:0,msg:''});
 if(kind==='scene')return `<div class="scene-wrap">${window.renderLabScene(i,seen)}</div>`;
 if(kind==='scope'){
  return `<div class="scope-layout"><div class="scope" id="scope"><div class="wafer"><div class="die-grid"></div>${v.scope.map((s,k)=>`<button class="defect ${seen.includes(k)?'found':''}" data-defect="${k}" style="left:${s.x}%;top:${s.y}%" aria-label="${seen.includes(k)?'Found: '+SCOPE_DEFECTS[s.d][0]:'Possible defect '+(k+1)}"><span></span></button>`).join('')}</div><div class="lens-shade" aria-hidden="true"></div><div class="lens-ring" aria-hidden="true"></div></div>
  <aside class="side-card"><div class="eyebrow">Microscope scan</div><h3>Find 3 defects</h3><p class="muted small">Move the lens across the wafer. Click a defect when it appears. Tab also jumps between defects.</p><ul class="found-list">${v.scope.map((s,k)=>`<li class="${seen.includes(k)?'ok':''}">${seen.includes(k)?`<b>${SCOPE_DEFECTS[s.d][0]}</b><span>${SCOPE_DEFECTS[s.d][1]}</span>`:'<b>???</b><span>Not found yet</span>'}</li>`).join('')}</ul><p class="tip">Real inspectors use microscopes and automated scanners to catch defects before chips are packaged.</p></aside></div>`;
 }
 if(kind==='mentor'){
  const asked=D.log.map(l=>l.n),options=v.mentor[i].filter(n=>!asked.includes(n)).slice(0,3),done=seen.length===3;
  return `<div class="mentor-layout"><aside class="mentor-card"><div class="avatar">${window.portrait('mira')}</div><h3>Mira Tran</h3><p class="muted small">Apprenticeship training advisor · certified Micro Electronics Manufacturer</p><p class="tip">“${i===4?'Ask me what the trade requires.':'Ask me how to get from high school into the trade.'}”</p><div class="meter"><span style="width:${seen.length/3*100}%"></span></div><small class="muted">${seen.length}/3 files unlocked</small></aside>
  <section class="chat" aria-live="polite"><div class="chat-log" id="chat-log">${D.log.length?'':`<p class="bubble them">Welcome to the training office! ${i===4?'What would you like to know about the qualifications?':'Let’s plan your route into the trade. What do you want to know?'}</p>`}${D.log.map(l=>`<p class="bubble you">${esc(MENTOR_POOL[l.n].q)}</p><p class="bubble them">${MENTOR_POOL[l.n].a}</p>`).join('')}</div>
  <div class="chat-options">${done?'<p class="muted small">All files unlocked. Open the puzzle below when you are ready.</p>':options.map(n=>`<button class="chip-btn" data-ask="${n}">${esc(MENTOR_POOL[n].q)}</button>`).join('')}</div></section></div>`;
 }
 if(kind==='quiz'){
  const done=seen.length===3,item=QUIZ_POOL[v.quiz[i][D.quizPos%v.quiz[i].length]];
  return `<div class="quiz-layout"><div class="quiz-card ${D.msgType||''}">${done?'<div class="eyebrow">All files unlocked</div><h2>Nice calls!</h2><p class="muted">Open the puzzle below when you are ready.</p>':`<div class="eyebrow">Statement ${D.quizPos+1} · ${seen.length}/3 correct</div><h2>“${esc(item.s)}”</h2><div class="quiz-actions"><button class="btn big is-myth" data-quiz="myth">✕ Myth</button><button class="btn big is-fact" data-quiz="fact">✓ Fact</button></div>`}<p class="quiz-msg" role="status">${D.msg||'Choose Myth or Fact. A wrong call just moves on to a new statement.'}</p></div></div>`;
 }
 if(kind==='decode'){
  return `<div class="decode-layout">${v.glossary.map((g,k)=>{const [word,def]=GLOSSARY[g.i],ok=seen.includes(k);return `<form class="decode-row ${ok?'ok':''}" data-decode="${k}"><div class="tiles" aria-label="Scrambled letters ${esc(g.mix.split('').join(' '))}">${(ok?word:g.mix).split('').map(c=>`<span>${c}</span>`).join('')}</div><p>${esc(def)}</p>${ok?'<span class="solved">✓ Decoded</span>':`<div class="decode-input"><label class="sr-only" for="dec-${k}">Unscrambled word ${k+1}</label><input class="input" id="dec-${k}" autocomplete="off" spellcheck="false" maxlength="14" placeholder="${word.length} letters"><button class="btn" type="submit">Check</button></div>`}</form>`;}).join('')}</div>`;
 }
 return '';
}
function bindDiscovery(i){
 const kind=state.variant.discover[i],stage=document.getElementById('stage');
 if(kind==='scene'){
  stage.querySelectorAll('[data-inspect]').forEach(h=>{const go=()=>collect(i,Number(h.dataset.inspect));h.addEventListener('click',go);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
 }
 if(kind==='scope'){
  const scope=document.getElementById('scope'),move=(x,y)=>{scope.style.setProperty('--x',x+'px');scope.style.setProperty('--y',y+'px');};
  const r0=scope.getBoundingClientRect(),scale=r0.width/scope.offsetWidth||1;move(scope.offsetWidth/2,scope.offsetHeight/2);
  scope.addEventListener('pointermove',e=>{const r=scope.getBoundingClientRect(),sc=r.width/scope.offsetWidth||scale;move((e.clientX-r.left)/sc,(e.clientY-r.top)/sc);});
  scope.querySelectorAll('.defect').forEach(b=>{b.addEventListener('focus',()=>move(b.offsetLeft+b.offsetParent.offsetLeft,b.offsetTop+b.offsetParent.offsetTop));b.addEventListener('click',()=>collect(i,Number(b.dataset.defect)));});
 }
 if(kind==='mentor'){const log=document.getElementById('chat-log');if(log)log.scrollTop=log.scrollHeight;}
 if(kind==='decode'){
  stage.querySelectorAll('form[data-decode]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const k=Number(f.dataset.decode),g=state.variant.glossary[k],input=f.querySelector('input');if(!input)return;
   if(input.value.trim().toUpperCase()===GLOSSARY[g.i][0])collect(i,k);else{f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');input.select();toast('Not quite. Read the definition and try again.');}}));
 }
}
function askMentor(n){const i=state.current;if(view!=='floor'||state.variant.discover[i]!=='mentor'||!state.bossCleared[i])return;const D=disc[i];if(D.log.some(l=>l.n===n)||!state.variant.mentor[i]?.includes(n))return;D.log.push({n});const k=nextClue(i);if(k===undefined){render();return;}collect(i,k);}
function answerQuiz(choice){const i=state.current;if(view!=='floor'||state.variant.discover[i]!=='quiz'||!state.bossCleared[i]||state.seen[i].length===3)return;const D=disc[i],v=state.variant,item=QUIZ_POOL[v.quiz[i][D.quizPos%v.quiz[i].length]],right=(choice==='fact')===item.fact;
 D.quizPos++;D.msg=`<strong>${right?'Correct':'Not quite'} — it’s a ${item.fact?'fact':'myth'}.</strong> ${esc(item.why)}`;D.msgType=right?'good':'bad';
 if(right)collect(i,nextClue(i));else{render();focusGame();}}

/* ---------- Puzzles ---------- */
function recordButton(r,k){const read=state.seen[r].includes(k);return `<button class="record-btn ${read?'seen':''}" data-evidence="${r},${k}" ${read?'':'disabled'}><span class="number">${read?'✓':k+1}</span><span>${read?C(r).evidence[k].title:'Locked file'}</span></button>`;}
function opts(items,current){return '<option value="">Choose…</option>'+items.map(([v,t])=>`<option value="${v}" ${v===current?'selected':''}>${t}</option>`).join('');}
function sampleArt(s,L){const w=Math.round(108*s.size/L);return `<svg viewBox="0 0 180 95" aria-hidden="true"><ellipse cx="90" cy="76" rx="64" ry="7" fill="#061217"/><rect x="${90-w/2}" y="28" width="${w}" height="30" rx="8" fill="#71a39e" stroke="#b8dcc9" stroke-width="2"/><ellipse cx="${90+w/2}" cy="43" rx="6" ry="15" fill="#244647" stroke="#bbdccc"/>${s.crack?'<path d="m80 28-7 9 11 5-6 16" fill="none" stroke="#ffb4a5" stroke-width="4"/>':''}<text x="90" y="91" fill="#acc8b7" font-size="13" font-family="monospace" text-anchor="middle">${s.size} cm</text></svg>`;}
function puzzleContent(i){const d=state.drafts[i],v=state.variant;
 if(i===0)return `<div class="match-grid">${v.parts.map((p,n)=>`<div class="match-item"><div class="match-icon" aria-hidden="true">0${n+1}</div><label for="part-${p}">${PARTS[p].name}</label><select id="part-${p}" data-field="${p}">${opts(v.jobs.map(j=>[j,PARTS[j].job]),d[p])}</select></div>`).join('')}</div>`;
 if(i===1)return `<div class="camera-grid">${v.hazards.map(h=>`<button class="camera-cell ${(d.flags||[]).includes(h)?'selected':''}" data-hazard="${h}" aria-pressed="${(d.flags||[]).includes(h)}">${cameraArt(h)}<div class="camera-caption"><strong>${HAZARDS[h].title}</strong><span>${HAZARDS[h].caption}</span></div></button>`).join('')}</div>`;
 if(i===2)return orderPuzzle(v.stageOrder,id=>STAGES.find(s=>s.id===id).label,d);
 if(i===3)return `<div class="sample-grid">${v.samples.map(s=>`<div class="sample-card"><h3>Sample ${s.id}</h3>${sampleArt(s,v.size)}<p>${s.crack?'Has a crack':'No cracks'} · ${s.size} cm</p><label class="sr-only" for="sample-${s.id}">Sample ${s.id} result</label><select id="sample-${s.id}" data-field="sample${s.id}">${opts([['pass','Pass'],['fail','Fail']],d['sample'+s.id])}</select></div>`).join('')}</div>`;
 if(i===4)return `<div class="simple-form">${v.facts.map(({f,order})=>`<div><label for="fact-${f}">${FACT_FIELDS[f].label}</label><select id="fact-${f}" data-field="${f}">${opts(order.map(k=>[k,FACT_FIELDS[f].options[k]]),d[f])}</select></div>`).join('')}</div>`;
 return orderPuzzle(v.pathOrder,id=>PATHWAY.find(p=>p.id===id).title,d);
}
function orderPuzzle(order,label,d){return `<div class="process-layout"><div class="process-bank">${order.map(id=>`<button class="process-card" data-process="${id}" ${(d.seq||[]).includes(id)?'disabled':''}>+ ${label(id)}</button>`).join('')}</div><div class="process-order"><div class="eyebrow">Your order</div><ol>${(d.seq||[]).map(id=>`<li>${label(id)}</li>`).join('')}</ol><div class="minor-actions"><button class="text-btn" data-action="undo" ${d.seq?.length?'':'disabled'}>Undo</button><button class="text-btn" data-action="clear-order" ${d.seq?.length?'':'disabled'}>Clear</button></div></div></div>`;}
function renderPuzzle(){const i=state.current,r=ROOMS[i],c=C(i);app.innerHTML=header()+`<main id="main" class="screen puzzle-screen" tabindex="-1"><div class="puzzle-heading"><div><div class="eyebrow">Room ${i+1} / ${r.short}</div><h1>${r.verb}</h1></div><button class="text-btn" data-action="back-floor">← Back to room</button></div><div class="puzzle-layout"><aside class="clue-panel"><h3>Your clue files</h3>${[0,1,2].map(k=>recordButton(i,k)).join('')}<p class="hint-text">${state.hints[i]?esc(c.hint):'Everything you need is in these files. Open them again whenever you want.'}</p><button class="text-btn hint-btn" data-action="hint" ${state.hints[i]?'disabled':''}>Earn a hint · 10s game</button></aside><section class="puzzle-main" aria-label="Room puzzle"><p class="question">${c.question}</p><div class="puzzle-content">${puzzleContent(i)}</div></section></div><div class="puzzle-footer"><div class="feedback ${feedbackError?'error':''}" id="feedback" role="status">${esc(feedback||'Use the clues. Check your answer before submitting.')}</div><button class="btn" id="puzzle-submit" data-action="submit">Check answer →</button></div></main>`;}
function evaluateRoom(i,d){const v=state.variant,incomplete=text=>({ok:false,incomplete:true,text}),fail=text=>({ok:false,text});
 if(i===0){if(v.parts.some(p=>!d[p]))return incomplete('Choose a job for all three parts.');return v.parts.every(p=>d[p]===p)?{ok:true}:fail('Not quite. Reopen the file for each part and match its job.');}
 if(i===1){if(!d.flags?.length)return incomplete('Select the unsafe situations.');return sameSet(d.flags,v.hazards.filter(h=>HAZARDS[h].unsafe))?{ok:true}:fail('Check each picture against the three cleanroom rule files.');}
 if(i===2){if(d.seq?.length!==v.stages.length)return incomplete(`Place all ${v.stages.length} cards.`);return d.seq.join(',')===v.stages.join(',')?{ok:true}:fail('Start by preparing the wafer, and package last. Re-read the middle steps.');}
 if(i===3){if(v.samples.some(s=>!d['sample'+s.id]))return incomplete('Mark every sample Pass or Fail.');return v.samples.every(s=>d['sample'+s.id]===(s.size===v.size&&!s.crack?'pass':'fail'))?{ok:true}:fail(`A sample needs no cracks AND a size of exactly ${v.size} cm.`);}
 if(i===4){if(v.facts.some(({f})=>!d[f]))return incomplete('Fill in every line of the fact sheet.');return v.facts.every(({f})=>d[f]===FACT_FIELDS[f].answer)?{ok:true}:fail('Re-read the three training office files and check each line.');}
 if(i===5){if(d.seq?.length!==v.path.length)return incomplete(`Place all ${v.path.length} steps.`);return d.seq.join(',')===v.path.join(',')?{ok:true}:fail('High school comes first and the certificate comes last. You need a sponsor before you can register.');}
 return fail('This room is unavailable.');
}
function ensureTime(){if(expired()&&!state.training){toast('Time is up. Select Continue training at the top to finish.');return false;}return true;}
function submitRoom(){const i=state.current;if(view!=='puzzle'||!canVisit(i)||!state.bossCleared[i]||state.seen[i].length!==3||state.solved[i]||Date.now()<state.coolUntil[i]||!ensureTime())return;const result=evaluateRoom(i,state.drafts[i]);if(result.ok){state.solved[i]=true;view='gate';feedback='';feedbackError=false;save();render();announce('Puzzle solved. Enter the room code in Google Forms.');}else{feedback=result.text;feedbackError=true;if(!result.incomplete)state.coolUntil[i]=Date.now()+5000;save();render();announce(result.text);}}

/* ---------- Gate (Form code exchange) ---------- */
function renderGate(){const i=state.current,r=ROOMS[i];app.innerHTML=header()+`<main id="main" class="screen gate-screen" tabindex="-1"><div class="gate-heading"><div class="eyebrow">Room ${i+1} / puzzle solved</div><h1>${state.released[i]?'Checkpoint unlocked.':'The door needs two codes.'}</h1></div><div class="gate-layout"><section class="gate-card"><div class="step-label"><span>1</span>Game → Google Form</div><p>Enter this code in <strong>Room ${i+1}</strong> of your Google Form, then click <strong>${i===5?'Submit':'Next'}</strong>.</p><div class="room-code" tabindex="0">${r.code}</div><div class="gate-actions"><button class="btn secondary" data-copy="${i}">Copy code</button>${formURL?'<button class="btn secondary" data-action="open-form">Open Form ↗</button>':''}</div><p class="gate-help">${esc(C(i).reward)}</p></section><section class="gate-card"><div class="step-label"><span>2</span>Google Form → Game</div>${state.released[i]?`<p class="receipt-success">Return code accepted. This checkpoint stays unlocked.</p><button class="btn" data-next="${i}">${i===5?(state.finalBossCleared?'View result':'Enter final battle'):'Enter Room '+(i+2)} →</button>`:`<p>${i===5?'The Form’s confirmation message':'The next Form section'} gives you a <strong>different code</strong>. Enter it here.</p><form class="gate-form" id="gate-form"><label class="sr-only" for="return-code">${i===5?'Final confirmation code':'Door code from the Form'}</label><input class="input" id="return-code" autocomplete="off" spellcheck="false" autocapitalize="characters" maxlength="24" placeholder="Code from Google Forms" aria-describedby="gate-feedback"><button class="btn" id="unlock-submit" type="submit">${i===5?'Enter final battle':'Unlock Room '+(i+2)} →</button></form><p class="feedback ${feedbackError?'error':''}" id="gate-feedback" role="status">${esc(feedback||'The code on the left goes into the Form. It will not open this door.')}</p>`}<button class="text-btn back" data-action="back-floor">← Back to room</button></section></div></main>`;document.getElementById('gate-form')?.addEventListener('submit',e=>{e.preventDefault();unlockGate(document.getElementById('return-code').value);});}
function unlockGate(value){const i=state.current;if(view!=='gate'||!canVisit(i)||!state.bossCleared[i]||!state.solved[i]||state.released[i]||Date.now()<state.gateUntil[i]||!ensureTime())return false;const answer=String(value).trim().toUpperCase();if(!answer){setGateError('Enter the return code shown by the Form.');return false;}if(answer!==RETURN_CODES[i]){state.gateUntil[i]=Date.now()+5000;save();setGateError('That does not open this door. Copy the new code from the Form after Next or Submit.');return false;}state.released[i]=true;feedback='';feedbackError=false;if(i===5){view='final-boss';}else{state.current=i+1;view='floor';}save();render();focusGame();announce(i===5?'Final code accepted. Defeat the Nova Core.':'Room '+(i+2)+' unlocked.');return true;}
function setGateError(text){feedback=text;feedbackError=true;const el=document.getElementById('gate-feedback');if(el){el.textContent=text;el.className='feedback error';}announce(text);tick();}
function nextRoom(i){if(!canProceed(i))return false;closeModal();if(i===5)view=state.finalBossCleared?'ending':'final-boss';else{state.current=i+1;view='floor';}feedback='';save();render();focusGame();return true;}

/* ---------- Final boss & ending ---------- */
function finishFinalBoss(){if(view!=='final-boss'||!state.released.every(Boolean)||state.finalBossCleared)return;state.finalBossCleared=true;state.finishedAt=Date.now();if(state.finishedAt>state.deadline)state.training=true;view='ending';save();render();focusGame();announce('Nova Core defeated. Mission complete.');}
function renderFinalBoss(){app.innerHTML=header()+`<main id="main" class="screen floor-screen final" tabindex="-1"><div class="room-heading">${radioButton()}<div><div class="eyebrow">Final encounter</div><h1>Nova Core</h1></div><p class="room-intro">BATCH-SAVED accepted. Dodge the pulse waves. When the core opens, press Space or click it. Break all three seals.</p></div><div class="map-frame"><canvas id="rover" width="1000" height="460" tabindex="0" role="img" aria-label="Final boss. Move with WASD, arrows or clicks inside the box. Dodge each wave, then press Space or click the exposed core. Break three seals."></canvas></div><div class="floor-controls"><span>WASD / arrows or click to move · Space to strike · P to pause · R to retry</span><span>Your six Form checkpoints are saved.</span></div></main>`;window.startNovaEncounter(document.getElementById('rover'),'final',finishFinalBoss);tick();}
function renderEnding(){const elapsed=fmt(((state.finishedAt||Date.now())-state.startedAt)/1000),onTime=state.finishedAt<=state.deadline;app.innerHTML=header()+`<main id="main" class="screen ending" tabindex="-1"><div class="ending-top"><div><div class="eyebrow">${onTime?'MISSION COMPLETE':'TRAINING COMPLETE / OVERTIME'}</div><h1>Batch checked. <em>Career mapped.</em></h1><p class="lede">Batch NB-7 shipped at dawn. On the factory floor you matched parts, protected the cleanroom, rebuilt the process and inspected samples. Then, in the training office, you mapped your real route into the trade in Ontario:</p></div><div class="end-stats"><div><strong>${elapsed}</strong><span>Mission time</span></div><div><strong>6 / 6</strong><span>Checkpoints</span></div></div></div><ol class="roadmap">${PATHWAY.map((p,k)=>`<li><span class="dot">${k+1}</span><b>${p.title}</b><small>${p.tag}</small></li>`).join('')}</ol><div class="next-row"><div><b>THIS WEEK</b>Ask your guidance counsellor about co-op, OYAP and the Manufacturing SHSM.</div><div><b>IN CLASS</b>Keep taking math, physics or chemistry, and a technology course through Grade 12.</div><div><b>EXPLORE</b>Read the 630A trade page from Skilled Trades Ontario and search Employment Ontario for apprenticeships.</div></div><div class="end-actions"><button class="btn" data-action="guide">Read the full career guide</button><button class="btn secondary" data-action="notebook">Review notebook</button><button class="btn secondary" data-action="restart">Play again (new mix)</button></div></main>`;tick();}

/* ---------- Modals ---------- */
function focusGame(){requestAnimationFrame(()=>{const target=document.getElementById('rover')||document.querySelector('#stage button,#stage input,#stage [tabindex="0"]')||document.getElementById('main');target?.focus({preventScroll:true});});}
function showModal(title,body,footer='',tag='NOVA / FIELD NOTES'){window.stopSignalGame?.();if(!modal.open)returnFocus=document.activeElement;modal.innerHTML=`<div class="modal-inner"><div class="modal-head"><div><div class="eyebrow">${tag}</div><h2 id="modal-title">${title}</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||'<span></span><button class="btn" data-action="close-modal">Back to game</button>'}</div></div>`;if(!modal.open)modal.showModal();modal.querySelector('.modal-footer .btn, .modal-close')?.focus();}
function closeModal(){window.stopSignalGame?.();if(modal.open)modal.close();if(view==='floor')focusGame();else if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
modal.addEventListener('cancel',()=>{window.stopSignalGame?.();requestAnimationFrame(()=>{if(view==='floor')focusGame();else returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});});});
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
function openEvidence(i,k){if(view==='landing'||!canVisit(i)||!state.seen[i].includes(k))return;const ev=C(i).evidence[k];showModal(ev.title,ev.text,`<button class="btn secondary" data-notebook="${i}">Notebook</button><button class="btn" data-action="close-modal">Got it ✓</button>`,`ROOM ${i+1} / FILE ${k+1} OF 3 · ${state.seen[i].length}/3 UNLOCKED`);}
function notebook(i=state.current){const r=ROOMS[i];showModal('Evidence notebook',`<div class="notebook-tabs" aria-label="Notebook rooms">${ROOMS.map((_,k)=>`<button data-notebook="${k}" class="${k===i?'active':''}" ${canVisit(k)?'':'disabled'}>Room ${k+1}</button>`).join('')}</div><h3>${r.name}</h3><div class="notebook-records">${[0,1,2].map(k=>recordButton(i,k)).join('')}</div><p class="notebook-finding">${state.solved[i]?esc(C(i).reward):'Uncover the files and solve the puzzle to add a finding.'}</p>${state.solved[i]?`<div class="notebook-code">Form code: ${r.code} <button class="text-btn" data-copy="${i}">Copy</button></div>`:''}`,undefined,'YOUR COLLECTED CLUES');}
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
function howto(page=0){const pages=[['Each room, three steps','<p><strong>Story.</strong> Sam (your supervisor), Mira (the training advisor) and NOVA (the factory system) radio in as you go. Click the portrait beside a room’s name to replay a message.</p><p><strong>1. Challenge.</strong> A short arcade game guards every room: shooter, falling blocks, dodge box, memory, timing or brick breaker. The order is shuffled each game. P pauses.</p><p><strong>2. Discover.</strong> Unlock three clue files a different way in each room: microscope scan, mentor chat, myth or fact, word decoder, lab walkthrough or a short rover maze.</p><p><strong>3. Solve.</strong> Use the files to answer the puzzle. The numbers and answers change every game. Stuck? Earn a hint with a 10-second game.</p>'],['Exchange the codes','<p><strong>Game → Form.</strong> Solve a room to reveal its NOVA code. Enter it in the matching Form section and click Next.</p><p><strong>Form → Game.</strong> The next Form section shows a new door code. Enter it in the game to unlock the next room.</p><p>After Room 6, submit the Form. Its confirmation message gives the final code. Enter it to face the final boss. Keep the same Form tab open.</p>'],['Clock and saving','<p>Play alone or with others. Progress saves in this browser. Rooms 1–4 are on the factory floor. Rooms 5–6 are in the training office and cover the real Ontario career pathway.</p><p>The 25-minute clock keeps running while you read or use the Form. At zero, choose Continue training to finish.</p><p>Tab moves between controls, Enter selects and Escape closes notes.</p>']];showModal(pages[page][0],pages[page][1],`<span class="small muted">${page+1} / 3</span><div class="gate-actions">${page?`<button class="btn secondary" data-help="${page-1}">← Back</button>`:''}${page<2?`<button class="btn" data-help="${page+1}">Next →</button>`:'<button class="btn" data-action="close-modal">Ready</button>'}</div>`,'HOW TO PLAY');}
function sources(){showModal('Career sources',`<div class="source-list">${SOURCES.map(([org,title,url])=>`<div><a href="${url}" target="_blank" rel="noopener noreferrer">${org} ↗</a><small>${title}</small></div>`).join('')}</div><p class="small muted" style="margin-top:18px">The lab, batches, counts and sample rules are fictional training examples. The career information is based on these sources.</p>`);}
function menu(){showModal('Mission menu',`<div class="menu-grid"><button class="btn secondary" data-action="howto">How to play</button><button class="btn secondary" data-action="guide">Career guide</button><button class="btn secondary" data-action="sources">Career sources</button><button class="btn secondary" data-action="notebook">Notebook</button><button class="btn danger" data-action="restart">Start a new game</button></div><p class="small muted" style="margin-top:24px">The clock keeps running in menus and in the Form. Your current progress is saved.</p>`);}
function restartPrompt(){showModal('Start fresh?',`<p>This starts a new mission with a new random mix of games and puzzles. Saved progress in this browser is cleared.</p><p>Your submitted Google Form responses are not changed.</p>`,`<button class="btn secondary" data-action="close-modal">Cancel</button><button class="btn danger" data-action="confirm-restart">Start fresh</button>`);}
function earnHint(){const i=state.current;if(view!=='puzzle'||!canVisit(i)||!state.bossCleared[i]||state.seen[i].length!==3||state.hints[i])return;showModal('Unlock the hint','<p>Catch <strong>5 lit signals in 10 seconds</strong>. Click the lit tile or press its number. Hit a tile to begin.</p><canvas id="signal-game" width="680" height="240" tabindex="0" aria-label="Signal lock. Press the lit number from 1 to 9. Collect five signals in ten seconds."></canvas>');window.startSignalGame(document.getElementById('signal-game'),i,()=>{if(view!=='puzzle'||state.current!==i||!modal.open)return;state.hints[i]=true;save();closeModal();render();focusGame();announce('Hint unlocked. Read it beside your clue files.');});}
function openForm(){if(!formURL){toast('Open the Google Form provided for this game in another tab.');return;}if(formWindow&&!formWindow.closed){formWindow.focus();return;}if(formOpened){showModal('Your Google Form',`<p>Use the Form tab you already opened to keep your response. If you closed it, use this link.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Reopen Form ↗</a>`);return;}const w=window.open('about:blank','_blank');if(w){w.opener=null;w.location.replace(formURL);formWindow=w;formOpened=true;}else showModal('Open your Form',`<p>Your browser blocked the new tab.</p><a class="btn" href="${esc(formURL)}" target="_blank" rel="noopener noreferrer">Open Google Form ↗</a>`);}
async function copyCode(i){if(!state.solved[i])return;try{await navigator.clipboard.writeText(ROOMS[i].code);toast('Copied '+ROOMS[i].code);}catch{showModal('Copy your code',`<p>Select the code and copy it with Ctrl+C.</p><input class="input" id="manual-copy" readonly aria-label="Room code" value="${ROOMS[i].code}">`);document.getElementById('manual-copy').select();}}
function updatePuzzle(selector){render();if(selector)document.querySelector(selector)?.focus({preventScroll:true});}

/* ---------- Events ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.evidence){const [i,k]=b.dataset.evidence.split(',').map(Number);openEvidence(i,k);return;}
 if(b.hasAttribute('data-notebook')){const i=Number(b.dataset.notebook);if(canVisit(i))notebook(i);return;}
 if(b.hasAttribute('data-room')){const i=Number(b.dataset.room);if(canVisit(i)){state.current=i;view=state.solved[i]?'gate':'floor';feedback='';save();render();focusGame();}return;}
 if(b.hasAttribute('data-copy')){copyCode(Number(b.dataset.copy));return;}
 if(b.hasAttribute('data-next')){nextRoom(Number(b.dataset.next));return;}
 if(b.hasAttribute('data-help')){howto(Number(b.dataset.help));return;}
 if(b.hasAttribute('data-guide')){guide(Number(b.dataset.guide));return;}
 if(b.hasAttribute('data-ask')){askMentor(Number(b.dataset.ask));return;}
 if(b.dataset.quiz){answerQuiz(b.dataset.quiz);return;}
 if(b.dataset.story){const [k,n]=b.dataset.story.split(',');playStory(k,Number(n));return;}
 const i=state.current,d=state.drafts[i];
 if(b.dataset.hazard&&view==='puzzle'&&!state.solved[i]){d.flags=d.flags||[];const k=d.flags.indexOf(b.dataset.hazard);if(k<0)d.flags.push(b.dataset.hazard);else d.flags.splice(k,1);save();updatePuzzle(`[data-hazard="${b.dataset.hazard}"]`);return;}
 if(b.dataset.process&&view==='puzzle'&&!state.solved[i]){d.seq=d.seq||[];if(!d.seq.includes(b.dataset.process))d.seq.push(b.dataset.process);save();updatePuzzle();document.querySelector('.process-card:not(:disabled)')?.focus({preventScroll:true});return;}
 switch(b.dataset.action){
  case 'resume':view=state.finishedAt?'ending':state.released.every(Boolean)?'final-boss':state.solved[i]?'gate':'floor';render();focusGame();break;
  case 'open-puzzle':if(state.bossCleared[i]&&state.seen[i].length===3){view=state.solved[i]?'gate':'puzzle';feedback='';render();focusGame();}break;
  case 'back-floor':view='floor';render();focusGame();break;
  case 'submit':submitRoom();break;
  case 'notebook':notebook();break;
  case 'guide':guide();break;
  case 'hint':earnHint();break;
  case 'undo':d.seq?.pop();save();updatePuzzle();break;
  case 'clear-order':d.seq=[];save();updatePuzzle();break;
  case 'close-modal':closeModal();break;
  case 'howto':howto();break;
  case 'sources':sources();break;
  case 'menu':menu();break;
  case 'restart':restartPrompt();break;
  case 'open-form':openForm();break;
  case 'training':state.training=true;save();tick();toast('Training mode enabled. Your final time will include overtime.');break;
  case 'fullscreen':{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();p?.catch(()=>toast('Use your browser’s fullscreen control instead.'));break;}
  case 'confirm-restart':closeModal();window.resetRover?.();state=freshState();Object.keys(disc).forEach(k=>delete disc[k]);view='landing';feedback='';try{localStorage.removeItem(SAVE_KEY);}catch{}render();document.getElementById('names')?.focus();break;
 }
});
function recordField(e){const el=e.target;if(view!=='puzzle'||state.solved[state.current]||!el.dataset.field)return;state.drafts[state.current][el.dataset.field]=el.value;save();}
document.addEventListener('input',recordField);document.addEventListener('change',recordField);
function tick(){const t=state.finishedAt||Date.now(),left=(state.deadline-t)/1000;const clock=document.getElementById('clock');if(clock){clock.textContent=clockText();clock.classList.toggle('low',left>0&&left<300);clock.classList.toggle('expired',left<=0);clock.setAttribute('aria-label',state.finishedAt?'Time saved at completion: '+clockText():'Mission clock: '+clockText());}const training=document.getElementById('training-btn');if(training)training.hidden=!(expired()&&!state.training);const i=state.current;
 const wait=Math.max(0,Math.ceil((state.coolUntil[i]-Date.now())/1000));const quiz=document.getElementById('puzzle-submit');if(quiz){quiz.disabled=wait>0;quiz.textContent=wait?`Review clues · ${wait}s`:'Check answer →';}
 const gateWait=Math.max(0,Math.ceil((state.gateUntil[i]-Date.now())/1000));const gate=document.getElementById('unlock-submit');if(gate){gate.disabled=gateWait>0;gate.textContent=gateWait?`Check the Form · ${gateWait}s`:i===5?'Enter final battle →':'Unlock Room '+(i+2)+' →';}}
document.addEventListener('visibilitychange',tick);setInterval(tick,250);render();
