"use strict";
/* Hands-on stations. Each task mounts into the bench element and calls ctx.done() when finished.
   ctx = {v, name, coach(text), hint(fn), say(text, tone, who), done(), note(text), setPlan(list)}
   - coach(): the "do this now" banner above the bench. Every state change should update it.
   - hint(fn): registers a function returning the element the Hint button should highlight.
   - say(text,'bad') counts as a mistake; two in a row show the hint automatically.
   A task may return a cleanup function (for document-level listeners and timers). */
const TASKS={};
const $=(root,sel)=>root.querySelector(sel);

/* Press-and-hold controls (pointer or Space). */
function holdControl(btn,onDown,onUp){
 let held=false;const down=e=>{if(held)return;held=true;e?.preventDefault?.();onDown();},up=()=>{if(!held)return;held=false;onUp();};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);
 const kd=e=>{if(e.code==='Space'&&!e.repeat&&!document.getElementById('modal').open&&!e.target.closest('input,textarea')){e.preventDefault();down();}};
 const ku=e=>{if(e.code==='Space')up();};
 document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
 return ()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
}

/* ---------- Room 1 · Gown up ---------- */
TASKS.gown=(bench,ctx)=>{
 const g={};let k=0;
 function render(){
  const ready=g.watch&&g.phone;
  bench.innerHTML=`<div class="gown-layout"><div class="avatar-stage">${gownAvatar(g)}<div class="locker"><b>Locker</b>${['watch','phone'].map(x=>`<span class="${g[x]?'in':''}">${x==='watch'?'Wristwatch':'Phone'}</span>`).join('')}</div></div>
  <div class="rack"><div class="eyebrow">Garment rack</div><div class="rack-grid">${ctx.v.rack.map(id=>`<button class="garment" data-g="${id}" ${g[id]?'disabled':''}>${photoOr(id,garmentIcon(id),'garment-ph')}<span>${GARMENTS[id]}</span>${g[id]?'<i>✓ on</i>':''}</button>`).join('')}</div>
  <div class="dress-order">${GOWN_ORDER.map((id,n)=>`<span class="${n<k?'on':''}">${n<k?GARMENTS[id]:n+1}</span>`).join('<i>→</i>')}</div></div></div>`;
  if(!ready){ctx.coach(`Click the <b>${!g.watch?'watch on the worker’s wrist':'phone in the worker’s pocket'}</b> to put it in the locker.`);ctx.hint(()=>$(bench,`[data-remove="${!g.watch?'watch':'phone'}"]`));}
  else{ctx.coach(k===0?'Now dress the worker <b>from the top down</b>. Click the garment that goes on <b>first</b>.':`${GARMENTS[GOWN_ORDER[k-1]]} on! Which garment goes on <b>next</b>?`);ctx.hint(()=>$(bench,`[data-g="${GOWN_ORDER[k]}"]`));}
 }
 bench.onclick=e=>{
  const r=e.target.closest('[data-remove]');if(r){g[r.dataset.remove]=true;ctx.say(`${r.dataset.remove==='watch'?'Watch':'Phone'} locked away. Personal items can’t be cleaned, so they stay out.`,'good');render();return;}
  const b=e.target.closest('[data-g]');if(!b||b.disabled)return;const id=b.dataset.g;
  if(!g.watch||!g.phone){ctx.say('First lock away the watch and the phone. Click them on the worker.','bad');return;}
  if(id===GOWN_ORDER[k]){g[id]=true;k++;render();if(k===6){ctx.coach('Fully gowned! 🎉');ctx.say('Fully gowned: top to bottom, gloves last. Perfect.','good');setTimeout(ctx.done,700);}else ctx.say(`${GARMENTS[id]} on.`,'good');}
  else ctx.say(GOWN_WHY[id]||'Work from the top down: hair, head, face, body, feet, then gloves.','bad');
 };
 bench.onkeydown=e=>{const r=e.target.closest('[data-remove]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();r.dispatchEvent(new MouseEvent('click',{bubbles:true}));}};
 render();
};

/* ---------- Room 1 · Air shower ---------- */
TASKS.airshower=(bench,ctx)=>{
 const need=ctx.v.showerSecs;let t=0,raf=0,last=0,finished=false;
 bench.innerHTML=`<div class="shower"><div class="shower-cab" id="cab"><div class="jets l"></div><div class="jets r"></div><div class="mini-avatar">${gownAvatar({watch:1,phone:1,hairnet:1,hood:1,mask:1,coverall:1,boots:1,gloves:1})}</div></div>
  <div class="shower-ctl"><div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="fill" id="arc" pathLength="100" stroke-dasharray="0 100"/></svg><span id="secs">${need}.0 s</span></div>
  <button class="btn big" id="hold">Hold to run the air shower</button></div></div>`;
 ctx.coach(`Press and <b>hold</b> the button until the timer reaches 0 (${need} seconds). You can also hold the Space bar.`);ctx.hint(()=>$(bench,'#hold'));
 const cab=$(bench,'#cab'),arc=$(bench,'#arc'),secs=$(bench,'#secs');
 function frame(now){const dt=(now-last)/1000;last=now;t=Math.min(need,t+dt);arc.setAttribute('stroke-dasharray',`${t/need*100} 100`);secs.textContent=(need-t).toFixed(1)+' s';
  if(t>=need){finished=true;cab.classList.remove('on');airSound.stop(0.8);ctx.coach('Clean! 🎉');ctx.say('Cycle complete. You’re clean enough to go in.','good');setTimeout(ctx.done,700);return;}raf=requestAnimationFrame(frame);}
 const off=holdControl($(bench,'#hold'),()=>{if(finished)return;cab.classList.add('on');airSound.start();ctx.coach('Keep holding…');last=performance.now();raf=requestAnimationFrame(frame);},()=>{if(finished)return;cancelAnimationFrame(raf);cab.classList.remove('on');airSound.stop();if(t>0){t=0;arc.setAttribute('stroke-dasharray','0 100');secs.textContent=need+'.0 s';ctx.coach('Press and <b>hold</b> again, and keep holding until the timer reaches 0.');ctx.say('You let go too early, so dust could get in. Try again and hold the whole time.','bad');}});
 return ()=>{off();cancelAnimationFrame(raf);airSound.stop(0.1);};
};

/* ---------- Room 1 · Spot the rule-breakers ---------- */
TASKS.cctv=(bench,ctx)=>{
 const bad=ctx.v.hazards.filter(h=>HAZARDS[h].unsafe),found=new Set(),okSeen=new Set();
 function render(){bench.innerHTML=`<div class="cctv"><div class="cam-wall">${ctx.v.hazards.map((h,n)=>`<button class="cam ${found.has(h)?'flagged':''} ${okSeen.has(h)?'cleared':''}" data-h="${h}">${cameraArt(h)}<span class="cam-label">CAM ${n+1}<b>${HAZARDS[h].where}</b></span>${found.has(h)?'<i class="flag">✗ RULE BROKEN</i>':okSeen.has(h)?'<i class="flag ok">✓ OK</i>':''}</button>`).join('')}</div>
  <div class="bench-actions"><span class="counter">${found.size} of ${bad.length} rule-breakers found</span></div></div>`;
  ctx.coach(`Look closely at each camera. Click the ones that <b>break a cleanroom rule</b>. There are <b>${bad.length}</b> to find.`);
  ctx.hint(()=>$(bench,`[data-h="${bad.find(h=>!found.has(h))}"]`));}
 bench.onclick=e=>{const c=e.target.closest('[data-h]');if(!c)return;const h=c.dataset.h;if(found.has(h)||okSeen.has(h))return;
  if(HAZARDS[h].unsafe){found.add(h);ctx.say(`✓ ${HAZARDS[h].title}: ${HAZARDS[h].why}`,'good');}else{okSeen.add(h);ctx.say(`That one’s fine. ${HAZARDS[h].why}`,'bad');}
  render();if(found.size===bad.length){ctx.coach('All rule-breakers found! 🎉');setTimeout(ctx.done,900);}};
 render();
};

/* ---------- Room 2 · Lithography ---------- */
function waferView(stage,opts={}){
 const lines=[[70,40,14,120],[110,40,14,120],[150,40,14,120],[60,70,130,12],[60,128,130,12]];
 const lineFill=stage>=5?'#3b4656':stage>=4?'#a9b3c1':stage>=3?'#f7e3a6':null,coat=stage>=2&&stage<6;
 return `<svg viewBox="0 0 250 200" class="wafer-view" aria-hidden="true"><defs><clipPath id="wc"><circle cx="125" cy="100" r="88"/></clipPath></defs>
  <circle cx="125" cy="100" r="90" fill="#aab4c2" stroke="#6b7686" stroke-width="2"/><path d="M110 189h30" stroke="#6b7686" stroke-width="4"/>
  ${coat?`<circle cx="125" cy="100" r="88" fill="${COL.amber}" opacity=".55"/>`:''}
  ${lineFill?`<g clip-path="url(#wc)" fill="${lineFill}">${lines.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>`:''}
  ${stage===0?Array.from({length:14},(_,i)=>`<circle cx="${60+(i*37)%130}" cy="${40+(i*53)%120}" r="2.6" fill="#5b4a3a" class="speck"/>`).join(''):''}
 </svg>`;
}
const WAFER_STATE=['Dusty wafer','Clean wafer','Coated with resist','Pattern printed (not visible yet)','Pattern developed','Pattern etched','Finished layer'];
TASKS.litho=(bench,ctx)=>{
 const v=ctx.v;let stage=0,open=null,cleanup=()=>{};
 function shell(panel){
  bench.innerHTML=`<div class="litho"><div class="toolbar">${v.tools.map(id=>{const s=LITHO.findIndex(x=>x.id===id),d=s<stage;return `<button class="tool ${d?'done':''} ${open===id?'open':''}" data-tool="${id}">${photoOr(TOOL_PHOTO[id],'','tool-ph')}<b>${d?'✓ ':''}${LITHO[s].tool}</b><small>${LITHO[s].desc}</small></button>`;}).join('')}</div>
   <div class="litho-station"><div class="wafer-box" id="wbox">${waferView(stage)}<span class="wafer-label">${WAFER_STATE[stage]}</span><div class="mini-steps">${LITHO.map((x,n)=>`<span class="${n<stage?'on':''}">${n<stage?'✓':n+1}</span>`).join('')}</div></div><div class="panel" id="panel">${panel||''}</div></div></div>`;
  if(!open){ctx.coach(stage===0?'Which machine comes <b>first</b>? Read what each machine does, then click it.':`Step ${stage+1} of 6: which machine comes <b>next</b>? Your wafer is now: <b>${WAFER_STATE[stage].toLowerCase()}</b>.`);ctx.hint(()=>$(bench,`[data-tool="${LITHO[stage].id}"]`));}
 }
 function complete(){cleanup();cleanup=()=>{};ctx.say(`✓ ${LITHO[stage].done}`,'good');stage++;open=null;shell();if(stage===6){ctx.coach('Circuit layer printed! 🎉');setTimeout(ctx.done,800);}}
 const MINI={
  clean(){shell(`<h3>Wet clean bench</h3><p>Ultra-pure water rinses dust off, then the wafer spins dry.</p><button class="btn" id="go">Run clean cycle</button>`);
   ctx.coach('Click <b>Run clean cycle</b>.');ctx.hint(()=>$(bench,'#go'));
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;bench.querySelectorAll('.speck').forEach((s,i)=>setTimeout(()=>s.remove(),60*i));setTimeout(complete,1100);};},
  coat(){const band=[v.rpm-500,v.rpm+500];let rpm=0,raf=0,last=0;
   shell(`<h3>Spin coater</h3><p>Resist drips onto the middle of the wafer, then the wafer spins to spread it out. <b>Faster spin = thinner coat.</b></p>
    <div class="gauge"><div class="band" style="left:${band[0]/60}%;width:${1000/60}%"></div><div class="needle" id="needle"></div></div><div class="gauge-scale"><span>0</span><span>3000</span><span>6000 rpm</span></div>
    <p class="readout"><span id="rpm">0</span> rpm</p><button class="btn big" id="spin">Hold to spin</button>`);
   ctx.coach('Press and <b>hold</b> “Hold to spin”. <b>Let go</b> when the needle is inside the <b>green zone</b>.');ctx.hint(()=>$(bench,'.gauge'));
   const needle=$(bench,'#needle'),out=$(bench,'#rpm');
   function frame(now){const dt=(now-last)/1000;last=now;rpm=Math.min(6000,rpm+1500*dt);needle.style.left=rpm/60+'%';out.textContent=Math.round(rpm);raf=requestAnimationFrame(frame);}
   cleanup=holdControl($(bench,'#spin'),()=>{rpm=0;last=performance.now();raf=requestAnimationFrame(frame);},()=>{cancelAnimationFrame(raf);
    if(rpm>=band[0]&&rpm<=band[1])complete();else ctx.say(rpm<band[0]?'Too slow: the coat came out thick and lumpy. Hold a bit longer this time.':'Too fast: the coat came out too thin. Let go a bit sooner.','bad');});},
  expose(){let x=v.mask.dx,y=v.mask.dy;
   shell(`<h3>Mask aligner</h3><p>The mask is a stencil of the circuit. It must sit exactly over the wafer, or the pattern prints in the wrong place.</p>
    <svg viewBox="0 0 260 150" class="align-view" aria-hidden="true"><rect width="260" height="150" fill="#2c3440"/><g stroke="#e8edf3" stroke-width="3">${[[60,75],[200,75]].map(([a,b])=>`<path d="M${a-14} ${b}h28M${a} ${b-14}v28"/>`).join('')}</g><g id="mask" stroke="${COL.amber}" stroke-width="3">${[[60,75],[200,75]].map(([a,b])=>`<path d="M${a-14} ${b}h28M${a} ${b-14}v28"/><rect x="${a-8}" y="${b-8}" width="16" height="16" fill="none"/>`).join('')}</g></svg>
    <div class="nudge"><button class="text-btn" data-n="0,-3" aria-label="Move up">↑</button><button class="text-btn" data-n="-3,0" aria-label="Move left">←</button><button class="text-btn" data-n="3,0" aria-label="Move right">→</button><button class="text-btn" data-n="0,3" aria-label="Move down">↓</button><span class="readout" id="off"></span></div>
    <button class="btn" id="uv">Expose (UV light)</button>`);
   const mask=$(bench,'#mask'),off=$(bench,'#off'),aligned=()=>Math.abs(x)<=3&&Math.abs(y)<=3,upd=()=>{mask.setAttribute('transform',`translate(${x} ${y})`);off.textContent=aligned()?'✓ Lined up!':'Not lined up yet';off.className='readout '+(aligned()?'ok':'');
    if(aligned()){ctx.coach('Lined up! Now click <b>Expose (UV light)</b>.');ctx.hint(()=>$(bench,'#uv'));}else{ctx.coach('Use the <b>arrow buttons</b> (or arrow keys) to move the <b>yellow</b> crosses onto the <b>white</b> crosses.');ctx.hint(()=>$(bench,`[data-n="${Math.abs(x)>3?(x>0?'-3,0':'3,0'):(y>0?'0,-3':'0,3')}"]`));}};upd();
   const nudge=(a,b)=>{x+=a;y+=b;upd();};
   $(bench,'#panel').onclick=e=>{const n=e.target.closest('[data-n]');if(n){const [a,b]=n.dataset.n.split(',').map(Number);nudge(a,b);}
    if(e.target.closest('#uv')){if(aligned()){$(bench,'.align-view').classList.add('flash');setTimeout(complete,700);}else ctx.say('Not lined up yet: the pattern would print in the wrong place. Move the yellow crosses first.','bad');}};
   const kd=e=>{const m={ArrowUp:[0,-3],ArrowDown:[0,3],ArrowLeft:[-3,0],ArrowRight:[3,0]}[e.key];if(m&&!document.getElementById('modal').open){e.preventDefault();nudge(...m);}};
   document.addEventListener('keydown',kd);cleanup=()=>document.removeEventListener('keydown',kd);},
  develop(){shell(`<h3>Developer</h3><p>The developer liquid washes away the resist where the UV light hit. That reveals the circuit pattern.</p><button class="btn" id="go">Develop</button>`);
   ctx.coach('Click <b>Develop</b>.');ctx.hint(()=>$(bench,'#go'));
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;setTimeout(complete,900);};},
  etch(){const tE=v.endpoint;let t=0,raf=0,last=0,run=false,pts=[];
   shell(`<h3>Plasma etcher</h3><p>Plasma carves into the wafer wherever the resist is gone. A sensor watches: when the layer is cut through, the <b>signal line drops</b>.</p>
    <svg viewBox="0 0 400 150" class="chart" aria-label="Etch signal chart"><rect width="400" height="150" fill="#fbfcfd" stroke="${COL.line}"/><path d="M30 20v110h360" stroke="${COL.muted}" fill="none"/><text x="34" y="16" font-size="10" fill="${COL.muted}">signal</text><text x="360" y="145" font-size="10" fill="${COL.muted}">time</text><polyline id="trace" fill="none" stroke="${COL.blue}" stroke-width="2.5"/></svg>
    <div class="bench-actions"><button class="btn secondary" id="start">Start etch</button><button class="btn" id="stop" disabled>STOP</button></div>`);
   ctx.coach('Click <b>Start etch</b>. Watch the blue line. As soon as it <b>drops down</b>, click <b>STOP</b>.');ctx.hint(()=>$(bench,run?'#stop':'#start'));
   const trace=$(bench,'#trace'),sig=s=>s<tE?0.8+Math.sin(s*9)*.03:s<tE+.4?0.8-(s-tE)/.4*.6:0.2+Math.sin(s*7)*.02;
   function frame(now){t+=(now-last)/1000;last=now;pts.push(`${30+t/8*360},${130-sig(t)*100}`);trace.setAttribute('points',pts.join(' '));if(t>=8){stopAt();return;}raf=requestAnimationFrame(frame);}
   function stopAt(){run=false;cancelAnimationFrame(raf);$(bench,'#stop').disabled=true;$(bench,'#start').disabled=false;
    if(t<tE+.2)ctx.say('Too early! The line hadn’t dropped yet, so the layer isn’t cut through. Try again and wait for the drop.','bad');
    else if(t>tE+2.5)ctx.say('Too late! You kept etching after the drop and damaged the layer underneath. Try again and stop right after the drop.','bad');
    else complete();}
   $(bench,'#start').onclick=()=>{t=0;pts=[];run=true;$(bench,'#start').disabled=true;$(bench,'#stop').disabled=false;ctx.coach('Watch the line… click <b>STOP</b> when it drops!');last=performance.now();raf=requestAnimationFrame(frame);};
   $(bench,'#stop').onclick=()=>{if(run)stopAt();};
   cleanup=()=>cancelAnimationFrame(raf);},
  strip(){shell(`<h3>Resist stripper</h3><p>Etching is done, so the leftover resist comes off. What’s left is the new circuit layer.</p><button class="btn" id="go">Strip resist</button>`);
   ctx.coach('Click <b>Strip resist</b> to finish the layer.');ctx.hint(()=>$(bench,'#go'));
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;setTimeout(complete,800);};}
 };
 bench.onclick=e=>{const b=e.target.closest('[data-tool]');if(!b)return;const id=b.dataset.tool,s=LITHO.findIndex(x=>x.id===id);
  if(s<stage){ctx.say(`${LITHO[s].tool}: already done ✓`);return;}
  if(s>stage){ctx.say(`Not yet! ${LITHO[s].early}`,'bad');return;}
  if(open===id)return;cleanup();cleanup=()=>{};open=id;MINI[id]();};
 shell();
 return ()=>cleanup();
};

/* ---------- Room 3 · Probe, dice, pick ---------- */
const DIE=60,GAP=14,ORIGIN=30;
const diePos=d=>[ORIGIN+d.c*(DIE+GAP),ORIGIN+d.r*(DIE+GAP)];
function waferMap(inner,extra=''){const span=5*DIE+4*GAP;return `<div class="wafer-map" style="width:${span+2*ORIGIN}px;height:${span+2*ORIGIN}px"><div class="wafer-disc"></div>${inner}${extra}</div>`;}
TASKS.probe=(bench,ctx)=>{
 const p=ctx.v.probe,bad=ctx.v.dies.map((d,i)=>d.bad?i:-1).filter(i=>i>=0),ink=new Set();let phase='quiz',shown=0;
 const choices=[...new Set([p.hi,p.V*p.Rlo,p.V+p.Rlo])].sort(()=>Math.random()-.5);
 function render(){
  if(phase==='quiz'){bench.innerHTML=`<div class="quiz-card"><div class="eyebrow">Warm-up: Ohm’s law</div><p class="formula">I = V ÷ R</p><p class="small muted">current (mA) = voltage (V) ÷ resistance (kΩ)</p>
   <p class="q">The prober uses <b>${p.V} volts</b>. A chip has a resistance of <b>${p.Rlo} kΩ</b>. What current flows through it?</p><p class="calc">${p.V} ÷ ${p.Rlo} = ?</p>
   <div class="choices">${choices.map(c=>`<button class="choice" data-c="${c}">${c} mA</button>`).join('')}</div></div>`;
   ctx.coach(`Use <b>I = V ÷ R</b>. Work out <b>${p.V} ÷ ${p.Rlo}</b>, then click your answer.`);ctx.hint(()=>$(bench,`[data-c="${p.hi}"]`));return;}
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d),r=i<shown;return `<button class="die ${ink.has(i)?'inked':''}" data-d="${i}" style="left:${x}px;top:${y}px" ${r?'':'disabled'}>${r?`<b>${d.mA.toFixed(1)}</b><small>mA</small>`:''}</button>`;}).join(''))}
   <div class="probe-side"><div class="spec-card"><div class="eyebrow">Good chips read between</div><p class="big-num">${p.lo} and ${p.hi} mA</p>
   <div class="zone"><span class="z-bad">too low</span><span class="z-ok">${p.lo}–${p.hi} ✓</span><span class="z-bad">too high</span></div></div>
   ${shown?`<p class="counter">${ink.size} of ${bad.length} bad chips found</p>`:'<button class="btn big" id="run">Run the prober</button>'}</div></div>`;
  if(!shown){ctx.coach('Click <b>Run the prober</b> to test every chip.');ctx.hint(()=>$(bench,'#run'));}
  else{ctx.coach(`Find the <b>${bad.length} bad chips</b>: any reading <b>lower than ${p.lo}</b> or <b>higher than ${p.hi}</b>. Click each one to mark it with red ink.`);ctx.hint(()=>$(bench,`[data-d="${bad.find(i=>!ink.has(i))}"]`));}
 }
 bench.onclick=e=>{
  const c=e.target.closest('[data-c]');if(c){if(+c.dataset.c===p.hi){ctx.say(`✓ ${p.V} ÷ ${p.Rlo} = ${p.hi} mA. Higher resistance means lower current, so with up to ${p.Rhi} kΩ, good chips read ${p.lo} to ${p.hi} mA.`,'good');phase='probe';render();}else ctx.say(`Not quite. Divide: ${p.V} ÷ ${p.Rlo}.`,'bad');return;}
  if(e.target.closest('#run')){$(bench,'#run').disabled=true;const tick=()=>{shown++;render();if(shown<ctx.v.dies.length)setTimeout(tick,45);};tick();return;}
  const d=e.target.closest('[data-d]');if(d&&shown){const i=+d.dataset.d,x=ctx.v.dies[i];if(ink.has(i))return;
   if(x.bad){ink.add(i);ctx.say(x.mA===0?'✓ 0.0 mA means no current at all: a broken connection. Inked!':`✓ ${x.mA.toFixed(1)} mA is ${x.mA<p.lo?'too low':'too high'}. Inked!`,'good');render();if(ink.size===bad.length){ctx.coach('All bad chips marked! 🎉');setTimeout(ctx.done,900);}}
   else ctx.say(`${x.mA.toFixed(1)} mA is between ${p.lo} and ${p.hi}, so that chip is good. Leave it.`,'bad');}
 };
 render();
};
TASKS.dice=(bench,ctx)=>{
 const cut=new Set(),span=5*DIE+4*GAP,all=['v1','v2','v3','v4','h1','h2','h3','h4'];
 function render(){
  const streets=[];for(let n=1;n<5;n++){const at=ORIGIN+n*(DIE+GAP)-GAP;streets.push(`<button class="street v ${cut.has('v'+n)?'cut':''}" data-s="v${n}" style="left:${at}px;top:${ORIGIN-18}px;width:${GAP}px;height:${span+36}px" aria-label="Vertical gap ${n}"></button>`,`<button class="street h ${cut.has('h'+n)?'cut':''}" data-s="h${n}" style="top:${at}px;left:${ORIGIN-18}px;height:${GAP}px;width:${span+36}px" aria-label="Horizontal gap ${n}"></button>`);}
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d);return `<div class="die static ${d.bad?'inked':''}" data-chip="${i}" style="left:${x}px;top:${y}px"></div>`;}).join(''),streets.join(''))}
   <div class="probe-side"><div class="spec-card"><div class="eyebrow">Dicing saw</div><p class="big-num">${cut.size} / 8 cuts</p></div></div></div>`;
  ctx.coach(`Click each <b>gap between the chips</b> to run the saw along it. ${8-cut.size} cut${8-cut.size===1?'':'s'} to go: 4 up-and-down, 4 side-to-side.`);ctx.hint(()=>$(bench,`[data-s="${all.find(s=>!cut.has(s))}"]`));
 }
 bench.onclick=e=>{const s=e.target.closest('[data-s]');if(s){if(!cut.has(s.dataset.s)){cut.add(s.dataset.s);render();if(cut.size===8){ctx.coach('Wafer cut into chips! 🎉');ctx.say('✓ Every chip is now separate.','good');setTimeout(ctx.done,700);}}return;}
  if(e.target.closest('[data-chip]'))ctx.say('Careful! That would cut straight through a chip and destroy it. Click the thin gaps between chips.','bad');};
 render();
};
TASKS.pick=(bench,ctx)=>{
 const tray=[];
 function render(){
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d);return tray.includes(i)?'':`<button class="die diced ${d.bad?'inked':''}" data-p="${i}" style="left:${x}px;top:${y}px" aria-label="${d.bad?'Inked chip':'Good chip'}"></button>`;}).join(''))}
   <div class="probe-side"><div class="eyebrow">Packaging tray</div><div class="tray">${Array.from({length:ctx.v.tray},(_,n)=>`<span class="${n<tray.length?'full':''}"></span>`).join('')}</div><p class="counter">${tray.length} of ${ctx.v.tray} placed</p></div></div>`;
  ctx.coach(`Click <b>${ctx.v.tray-tray.length} more good chip${ctx.v.tray-tray.length===1?'':'s'}</b> (no red dot) to move them into the tray.`);ctx.hint(()=>$(bench,`[data-p="${ctx.v.dies.findIndex((d,i)=>!d.bad&&!tray.includes(i))}"]`));
 }
 bench.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;const i=+b.dataset.p;
  if(ctx.v.dies[i].bad){ctx.say('That chip has a red dot: it failed the test. It stays behind.','bad');return;}
  tray.push(i);render();if(tray.length===ctx.v.tray){ctx.coach('Tray full! 🎉');ctx.say('✓ Only good chips in the tray.','good');setTimeout(ctx.done,700);}else ctx.say('✓ Good chip picked.','good');};
 render();
};

/* ---------- Room 4 · Measure, inspect, sort ---------- */
TASKS.qc=(bench,ctx)=>{
 const v=ctx.v,S=v.spec,PX=30,X0=70,lo=(S-.1).toFixed(2),hi=(S+.1).toFixed(2);let n=0,phase='measure',jx=600,found=false;
 const P=()=>v.parts[n];
 function head(){return `<div class="part-strip">${v.parts.map((p,k)=>`<span class="${k<n?'done':k===n?'now':''}">Part ${p.id}${k<n?' ✓':''}</span>`).join('')}<span class="spec-pill">Spec: ${S}.00 ± 0.10 mm (${lo} to ${hi})</span></div>`;}
 function render(){
  const p=P(),right=X0+p.len*PX;
  if(phase==='measure'){bench.innerHTML=`<div class="qc">${head()}<div class="caliper-wrap"><svg viewBox="0 0 680 230" class="caliper" id="cal">
    <rect x="30" y="40" width="620" height="26" rx="3" fill="#d6dbe1" stroke="#8a95a3"/>${Array.from({length:60},(_,i)=>`<path d="M${X0+i*10} 40v${i%5?8:14}" stroke="#5b6573"/>`).join('')}
    <rect x="${X0-18}" y="40" width="18" height="150" fill="#c3cad3" stroke="#6f7b88"/>
    <rect x="${X0}" y="120" width="${p.len*PX}" height="44" fill="#2f3b4c" rx="2"/><text x="${X0+p.len*PX/2}" y="147" fill="#e8edf3" font-size="13" text-anchor="middle" font-family="IBM Plex Mono,monospace">PART ${p.id}</text>
    <g id="jaw" class="jaw" transform="translate(${jx} 0)" tabindex="0" role="slider" aria-label="Caliper jaw"><rect x="0" y="34" width="18" height="156" fill="#c3cad3" stroke="#6f7b88"/><rect x="-8" y="-2" width="74" height="38" rx="4" fill="#2b3644"/><rect x="-3" y="3" width="64" height="28" rx="2" fill="#d6dde0"/><text x="29" y="23" fill="#14202d" font-size="15" text-anchor="middle" font-family="IBM Plex Mono,monospace" id="lcd">${((jx-X0)/PX).toFixed(2)}</text></g>
    <path d="M${jx-30} 205h-60" stroke="${COL.blue}" stroke-width="3" marker-end="url(#ar)" id="arrow"/><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0l8 4-8 4Z" fill="${COL.blue}"/></marker></defs>
   </svg></div><div class="bench-actions"><button class="btn secondary" id="close">◀ Close jaw</button><span class="counter">Reading: <b id="rd">${((jx-X0)/PX).toFixed(2)} mm</b></span><button class="btn" id="rec">Record reading</button></div></div>`;
   ctx.coach(`<b>Part ${p.id}:</b> drag the caliper’s right jaw to the <b>left</b> until it touches the part (or click <b>Close jaw</b>). Then click <b>Record reading</b>.`);ctx.hint(()=>$(bench,jx>right+0.5?'#close':'#rec'));
   const svg=$(bench,'#cal');let drag=false;
   const setJ=x=>{jx=Math.max(right,Math.min(640,x));const r=((jx-X0)/PX).toFixed(2);$(bench,'#jaw').setAttribute('transform',`translate(${jx} 0)`);$(bench,'#lcd').textContent=r;$(bench,'#rd').textContent=r+' mm';$(bench,'#arrow').style.display=jx>right+0.5?'':'none';if(jx<=right+0.5)ctx.coach('The jaw is touching the part. Click <b>Record reading</b>.');};
   const toX=e=>{const b=svg.getBoundingClientRect();return (e.clientX-b.left)*680/b.width;};
   svg.onpointerdown=e=>{drag=true;svg.setPointerCapture(e.pointerId);setJ(toX(e)-9);};svg.onpointermove=e=>{if(drag)setJ(toX(e)-9);};svg.onpointerup=()=>drag=false;
   $(bench,'#jaw').onkeydown=e=>{if(e.key==='ArrowLeft'){e.preventDefault();setJ(jx-3);}if(e.key==='ArrowRight'){e.preventDefault();setJ(jx+3);}};
   $(bench,'#close').onclick=()=>setJ(right);
   $(bench,'#rec').onclick=()=>{if(jx>right+0.5){ctx.say('The jaw isn’t touching the part yet, so that number is too big. Close the jaw first.','bad');return;}
    phase='scope';found=false;ctx.say(`✓ Part ${p.id} measures ${p.len.toFixed(2)} mm.`,'good');render();};
   return;}
  if(phase==='scope'){bench.innerHTML=`<div class="qc">${head()}<div class="scope-part" id="sc"><div class="surface">${p.crack?`<button class="crack" style="left:${p.cx}%;top:${p.cy}%" aria-label="Crack"><svg viewBox="0 0 60 40"><path d="M4 30l12-10 6 6 14-16 8 6 12-12" fill="none" stroke="#f2f4f7" stroke-width="3"/></svg></button>`:''}</div><div class="lens-shade"></div><div class="lens-ring"></div></div>
   <div class="bench-actions"><button class="btn secondary" id="clean">No cracks found</button></div></div>`;
   ctx.coach(`Move your mouse over the dark area to look at Part ${p.id} through the microscope. If you see a <b>white crack</b>, click it. If not, click <b>No cracks found</b>.`);ctx.hint(()=>p.crack?$(bench,'.crack'):$(bench,'#clean'));
   const sc=$(bench,'#sc'),mv=e=>{const b=sc.getBoundingClientRect(),k=b.width/sc.offsetWidth||1;sc.style.setProperty('--x',(e.clientX-b.left)/k+'px');sc.style.setProperty('--y',(e.clientY-b.top)/k+'px');};
   sc.addEventListener('pointermove',mv);sc.style.setProperty('--x','50%');sc.style.setProperty('--y','50%');
   const cr=$(bench,'.crack');if(cr){cr.onclick=()=>{found=true;phase='bin';ctx.say('✓ Crack found! Cracked parts can break inside a device.','good');render();};cr.onfocus=()=>{sc.style.setProperty('--x',cr.offsetLeft+'px');sc.style.setProperty('--y',cr.offsetTop+'px');};}
   $(bench,'#clean').onclick=()=>{if(p.crack){ctx.say('Look again: there’s a crack somewhere. Move the lens slowly over the whole part.','bad');return;}phase='bin';ctx.say('✓ No cracks on this one.','good');render();};
   return;}
  const lenOk=Math.abs(p.len-S)<=0.1001,good=lenOk&&!p.crack,min=S-.3,max=S+.3,pos=x=>Math.max(0,Math.min(100,(x-min)/(max-min)*100));
  bench.innerHTML=`<div class="qc">${head()}<div class="result-card"><div class="eyebrow">Part ${p.id} · inspection record</div>
   <div class="numline"><div class="nl-ok" style="left:${pos(S-.1)}%;width:${pos(S+.1)-pos(S-.1)}%"><span>OK zone</span></div><div class="nl-mark" style="left:${pos(p.len)}%"><b>${p.len.toFixed(2)}</b></div><span class="nl-l">${min.toFixed(1)}</span><span class="nl-r">${max.toFixed(1)} mm</span></div>
   <div class="rec-row"><span>Size</span><b class="${lenOk?'ok':'bad'}">${p.len.toFixed(2)} mm · ${lenOk?'in the OK zone':'outside the OK zone'}</b></div><div class="rec-row"><span>Surface</span><b class="${p.crack?'bad':'ok'}">${p.crack?'Cracked':'No cracks'}</b></div></div>
   <div class="bins"><button class="bin pass" data-bin="pass">✓ PASS bin</button><button class="bin reject" data-bin="reject">✗ REJECT bin</button></div></div>`;
  ctx.coach(`Part ${p.id} passes only if the size is in the <b>OK zone</b> <b>and</b> there are <b>no cracks</b>. Which bin does it go in?`);ctx.hint(()=>$(bench,`[data-bin="${good?'pass':'reject'}"]`));
  bench.querySelectorAll('[data-bin]').forEach(b=>b.onclick=()=>{const want=good?'pass':'reject';
   if(b.dataset.bin!==want){ctx.say(good?'This part is in the OK zone with no cracks, so it passes.':p.crack?'A cracked part always fails, even if the size is right.':'The size is outside the OK zone, so it fails. “Close enough” isn’t good enough.','bad');return;}
   ctx.say(`✓ Part ${p.id} → ${want==='pass'?'PASS':'REJECT'}.`,'good');n++;phase='measure';jx=600;
   if(n===v.parts.length){ctx.coach('All parts inspected! 🎉');setTimeout(ctx.done,700);bench.querySelectorAll('[data-bin]').forEach(x=>x.disabled=true);}else render();});
 }
 render();
};

/* ---------- Room 5 · Talk to Mira ---------- */
TASKS.mentor=(bench,ctx)=>{
 const asked=[];
 function render(){const opts=ctx.v.mentor.filter(n=>!asked.includes(n)).slice(0,3),done=asked.length>=3;
  bench.innerHTML=`<div class="mentor-layout"><aside class="mentor-card"><div class="avatar">${portrait('mira')}</div><h3>Mira Tran</h3><p class="muted small">Apprenticeship training advisor</p><div class="meter"><span style="width:${Math.min(3,asked.length)/3*100}%"></span></div><small class="muted">${Math.min(3,asked.length)}/3 questions</small></aside>
   <section class="chat"><div class="chat-log" id="log"><p class="bubble them">Pull up a chair, ${ctx.name}! What would you like to know about getting into this trade?</p>${asked.map(n=>`<p class="bubble you">${MENTOR_POOL[n].q}</p><p class="bubble them">${MENTOR_POOL[n].a}</p>`).join('')}</div>
   <div class="chat-options">${done?'<button class="btn" id="next">Thanks, Mira →</button>':opts.map(n=>`<button class="chip-btn" data-q="${n}">${MENTOR_POOL[n].q}</button>`).join('')}</div></section></div>`;
  const log=$(bench,'#log');log.scrollTop=log.scrollHeight;
  if(done){ctx.coach('Read Mira’s answers, then click <b>Thanks, Mira</b>.');ctx.hint(()=>$(bench,'#next'));}else{ctx.coach(`Click a question at the bottom to ask Mira. <b>${3-asked.length}</b> to go.`);ctx.hint(()=>$(bench,'.chip-btn'));}}
 bench.onclick=e=>{const q=e.target.closest('[data-q]');if(q){const n=+q.dataset.q;asked.push(n);ctx.note(`Mira: ${MENTOR_POOL[n].a.replace(/<[^>]+>/g,'')}`);render();return;}if(e.target.closest('#next'))ctx.done();};
 render();
};

/* ---------- Room 5 · Application folder ---------- */
TASKS.folder=(bench,ctx)=>{
 const inF=new Set(),no=new Set();
 function render(){const req=['ossd','sponsor'].filter(k=>inF.has(k)).length;
  bench.innerHTML=`<div class="desk"><div class="doc-pile">${ctx.v.docs.map(d=>`<button class="doc ${inF.has(d)?'filed':''} ${no.has(d)?'nope':''}" data-doc="${d}" ${inF.has(d)||no.has(d)?'disabled':''}><span class="doc-lines"></span><b>${DOCS[d].title}</b>${inF.has(d)?'<i>✓ in folder</i>':no.has(d)?'<i class="x">✗ not needed</i>':''}</button>`).join('')}</div>
  <div class="folder"><div class="folder-tab">APPLICATION</div><ul>${[...inF].map(d=>`<li>${DOCS[d].title}</li>`).join('')||'<li class="muted">Empty</li>'}</ul><p class="counter">${req} of 2 must-haves</p><button class="btn" id="hand" ${req<2?'disabled':''}>Hand it to Mira →</button></div></div>`;
  if(req<2){ctx.coach(`Click the documents you need to <b>start</b> this apprenticeship. There are <b>2 must-haves</b>. Wrong ones bounce back.`);ctx.hint(()=>$(bench,`[data-doc="${['ossd','sponsor'].find(k=>!inF.has(k))}"]`));}
  else{ctx.coach(inF.has('resume')?'Folder ready! Click <b>Hand it to Mira</b>.':'You have both must-haves. Want to add anything <b>helpful</b>? Then click <b>Hand it to Mira</b>.');ctx.hint(()=>$(bench,'#hand'));}}
 bench.onclick=e=>{const d=e.target.closest('[data-doc]');if(d){const k=d.dataset.doc,D=DOCS[k];
   if(D.need==='no'){no.add(k);ctx.say(`Not needed: ${D.why}`,'bad');}else{inF.add(k);ctx.say(D.need==='required'?`✓ Must-have: ${k==='ossd'?'Grade 12 is the entry requirement.':'an apprenticeship is a job, so you need an employer.'}`:'✓ Helpful: a resume with real experience helps you get hired.','good');}
   render();return;}
  if(e.target.closest('#hand')){ctx.say('That’s everything you need to get started!','good');setTimeout(ctx.done,800);}};
 render();
};

/* ---------- Room 5 · Logbook ---------- */
TASKS.logbook=(bench,ctx)=>{
 const ticked=new Set(),no=new Set(),ours=ctx.v.skills.filter(s=>SKILLS[s].ours);
 function render(signed){bench.innerHTML=`<div class="logbook"><div class="log-page"><div class="log-head"><div><div class="eyebrow">Training standard · 630A</div><h3>Micro Electronics Manufacturer</h3></div><span class="muted small">Apprentice: ${ctx.name}</span></div>
  <ul class="log-list">${ctx.v.skills.map(s=>`<li><button class="tick ${ticked.has(s)?'on':''} ${no.has(s)?'nope':''}" data-s="${s}" ${signed||ticked.has(s)||no.has(s)?'disabled':''}><span class="box">${ticked.has(s)?'✓':no.has(s)?'✗':''}</span>${SKILLS[s].t}${no.has(s)?`<em>${SKILLS[s].who}</em>`:''}</button></li>`).join('')}</ul>
  <div class="sign-row"><span class="muted small">Supervisor sign-off</span>${signed?`<svg viewBox="0 0 200 50" class="signature"><path d="M8 34c14-22 22-22 24-4 2 14 10-18 18-14 6 3-2 20 6 18 10-2 12-22 22-18 8 4 0 20 10 16 12-6 18-14 30-10 10 4 20 2 30-6" fill="none" stroke="${COL.blue}" stroke-width="2.5" stroke-linecap="round"/></svg><b>S. Okoro</b>`:`<span class="sig-line"></span><button class="btn" id="sign" ${ticked.size<ours.length?'disabled':''}>Ask Sam to sign →</button>`}</div></div></div>`;
  if(signed)return;
  if(ticked.size<ours.length){ctx.coach(`Tick every skill <b>you practised tonight</b> in Rooms 1–4. <b>${ours.length-ticked.size}</b> left. Skills from other trades don’t belong here.`);ctx.hint(()=>$(bench,`[data-s="${ours.find(s=>!ticked.has(s))}"]`));}
  else{ctx.coach('All your skills are ticked. Click <b>Ask Sam to sign</b>.');ctx.hint(()=>$(bench,'#sign'));}}
 bench.onclick=e=>{const t=e.target.closest('[data-s]');if(t){const s=t.dataset.s;if(SKILLS[s].ours){ticked.add(s);ctx.say(`✓ You did that tonight!`,'good');}else{no.add(s);ctx.say(`That’s a skill for a ${SKILLS[s].who}, a different trade.`,'bad');}render();return;}
  if(e.target.closest('#sign')){render(true);ctx.coach('Signed! 🎉');ctx.say('Signed. That’s a real start on your logbook.','good','sam');setTimeout(ctx.done,1400);}};
 render();
};

/* ---------- Room 6 · Route map ---------- */
TASKS.route=(bench,ctx)=>{
 const order=ROUTE.map(s=>s.id),pos={...ctx.v.route,start:[40,150],cert:[905,150]},path=['start'];
 const label=id=>(ROUTE.find(s=>s.id===id)||TRAPS[id]).t;
 function wrapText(t,x,y){const words=t.split(' '),lines=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>18){lines.push(cur.trim());cur=w;}else cur+=' '+w;}lines.push(cur.trim());
  return `<text x="${x}" y="${y}" text-anchor="middle">${lines.map((l,i)=>`<tspan x="${x}" dy="${i?14:0}">${l.replace(/&/g,'&amp;')}</tspan>`).join('')}</text>`;}
 function render(){
  const nodes=Object.keys(pos),lit=path.slice(1).map((id,k)=>{const a=pos[path[k]],b=pos[id];return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" class="seg"/>`;}).join('');
  bench.innerHTML=`<div class="route"><svg viewBox="0 0 960 300" class="route-map" role="group" aria-label="Route map">
   <rect width="960" height="300" fill="#f7f9fb"/><g stroke="#e3e8ee">${Array.from({length:20},(_,i)=>`<path d="M${i*50} 0v300"/>`).join('')}${Array.from({length:7},(_,i)=>`<path d="M0 ${i*50}h960"/>`).join('')}</g>${lit}
   ${nodes.map(id=>{const [x,y]=pos[id],on=path.includes(id),term=id==='start'||id==='cert';
    return `<g class="stop ${on?'on':''} ${term?'terminal':''}" data-stop="${id}" tabindex="${id==='start'?-1:0}" role="button" aria-label="${label(id)}"><circle cx="${x}" cy="${y}" r="${term?16:12}"/>${wrapText(label(id),x,y+(term?32:28))}</g>`;}).join('')}
  </svg><p class="counter">${path.length-1} of ${order.length-1} stops on your route</p></div>`;
  const last=label(path[path.length-1]);ctx.coach(path.length===1?'You start at <b>“You, in high school”</b> (left). Click the stop that comes <b>next</b>.':`You’re at <b>“${last}”</b>. Click the stop that comes <b>next</b>.`);ctx.hint(()=>$(bench,`[data-stop="${order[path.length]}"] circle`));
 }
 function pick(id){if(id==='start'||path.includes(id))return;
  if(TRAPS[id]){ctx.say(`Trap! ${TRAPS[id].why}`,'bad');return;}
  if(id!==order[path.length]){ctx.say('That stop is on the route, but not yet. Something comes before it.','bad');return;}
  path.push(id);render();if(id==='cert'){ctx.coach('Route complete! 🎉');ctx.say('✓ High school to certified!','good');setTimeout(ctx.done,900);}else ctx.say('✓ Next stop added.','good');}
 bench.onclick=e=>{const s=e.target.closest('[data-stop]');if(s)pick(s.dataset.stop);};
 bench.onkeydown=e=>{const s=e.target.closest('[data-stop]');if(s&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pick(s.dataset.stop);}};
 render();
};

/* ---------- Room 6 · Next moves ---------- */
TASKS.plan=(bench,ctx)=>{
 const sel=new Set();
 function render(){bench.innerHTML=`<div class="plan"><div class="plan-grid">${ctx.v.plan.map((p,i)=>`<button class="plan-card ${sel.has(i)?'on':''}" data-i="${i}" aria-pressed="${sel.has(i)}"><span class="box">${sel.has(i)?'✓':''}</span>${p}</button>`).join('')}</div>
  <div class="bench-actions"><span class="counter">${sel.size} chosen</span><button class="btn" id="save" ${sel.size<2?'disabled':''}>Save my plan →</button></div></div>`;
  ctx.coach(sel.size<2?`Pick <b>at least 2</b> things you could really do this school year. (${sel.size} chosen)`:'Great choices! Click <b>Save my plan</b>.');ctx.hint(()=>$(bench,sel.size<2?'.plan-card:not(.on)':'#save'));}
 bench.onclick=e=>{const c=e.target.closest('[data-i]');if(c){const i=+c.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);render();return;}
  if(e.target.closest('#save')&&sel.size>=2){ctx.setPlan([...sel].map(i=>ctx.v.plan[i]));ctx.say('✓ Saved to your mission report.','good');setTimeout(ctx.done,700);}};
 render();
};

/* ---------- Final · Line control ---------- */
TASKS.control=(bench,ctx)=>{
 const list=ctx.v.incidents,LIMIT=45;let n=0,phase='find',t=LIMIT,timer=0;
 const order=['gowning','coater','aligner','etcher','prober','saw','inspect'];
 function render(){
  const inc=INCIDENTS[list[n].i];
  bench.innerHTML=`<div class="control"><div class="truck"><span>🚚 Truck</span><div class="truck-bar"><i style="width:${n/list.length*100}%"></i></div><span>${n}/${list.length} alarms fixed</span></div>
   <div class="line">${order.map((s,k)=>`<button class="station ${phase==='fix'&&s===inc.at?'hot':''}" data-st="${s}" ${phase==='fix'?'disabled':''}><small>Room ${{gowning:1,coater:2,aligner:2,etcher:2,prober:3,saw:3,inspect:4}[s]}</small>${STATIONS[s]}</button>${k<order.length-1?'<span class="conv"></span>':''}`).join('')}</div>
   <div class="alarm"><div class="alarm-head"><span class="eyebrow">🚨 Alarm ${n+1} of ${list.length}</span><span class="alarm-time" id="tm">${Math.ceil(t)} s</span></div><div class="alarm-bar"><i id="tb" style="width:${t/LIMIT*100}%"></i></div><p class="alarm-text">${inc.alarm}</p>
   ${phase==='find'?'':`<div class="fixes">${list[n].order.map(k=>`<button class="fix" data-f="${k}">${inc.fix[k]}</button>`).join('')}</div>`}</div></div>`;
  if(phase==='find'){ctx.coach('Read the alarm. Which <b>machine</b> is causing it? Click it in the line above.');ctx.hint(()=>$(bench,`[data-st="${inc.at}"]`));}
  else{ctx.coach('Now pick the <b>fix</b> that solves the problem.');ctx.hint(()=>$(bench,'[data-f="0"]'));}
 }
 function tick(){t-=0.25;const tm=$(bench,'#tm'),tb=$(bench,'#tb');if(tm)tm.textContent=Math.ceil(Math.max(0,t))+' s';if(tb)tb.style.width=Math.max(0,t)/LIMIT*100+'%';
  if(t<=0){t=LIMIT;phase='find';ctx.say('Time ran out and the line stalled. Same alarm: try again! (Use the Hint button if you’re stuck.)','bad');render();}}
 timer=setInterval(()=>{if(!document.getElementById('modal').open)tick();},250);
 bench.onclick=e=>{const inc=INCIDENTS[list[n].i];
  const s=e.target.closest('[data-st]');if(s&&phase==='find'){if(s.dataset.st===inc.at){phase='fix';ctx.say(`✓ Yes, it’s the ${STATIONS[inc.at]}.`,'good');render();}else ctx.say(`Not the ${STATIONS[s.dataset.st]}. Which step tonight could cause this?`,'bad');return;}
  const f=e.target.closest('[data-f]');if(f){if(+f.dataset.f===0){n++;t=LIMIT;phase='find';if(n===list.length){clearInterval(timer);ctx.coach('Line clear! 🎉');ctx.say('✓ All alarms fixed. Dispatch dock opening!','good');bench.querySelector('.truck-bar i').style.width='100%';bench.querySelectorAll('button').forEach(b=>b.disabled=true);setTimeout(ctx.done,900);}else{ctx.say('✓ Fixed! Next alarm…','good');render();}}else ctx.say('That won’t fix it. Think about what actually causes this problem.','bad');}};
 render();
 return ()=>clearInterval(timer);
};
