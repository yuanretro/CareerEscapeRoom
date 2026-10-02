"use strict";
/* Hands-on stations. Each task mounts into the bench element and calls ctx.done() when finished.
   ctx = {v, say(text, tone), done(), note(text), setSop(html), setPlan(list)}.
   A task may return a cleanup function (for document-level listeners and timers). */
const TASKS={};
const $=(root,sel)=>root.querySelector(sel);

/* Small helper for press-and-hold controls (pointer or Space). */
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
  <p class="bench-hint">${ready?`${k}/6 garments on. Dress from the top down.`:'Start by clicking the watch and phone on the worker.'}</p></div></div>`;
 }
 bench.onclick=e=>{
  const r=e.target.closest('[data-remove]');if(r){g[r.dataset.remove]=true;ctx.say(`${r.dataset.remove==='watch'?'Watch':'Phone'} locked away.`,'good');render();return;}
  const b=e.target.closest('[data-g]');if(!b||b.disabled)return;const id=b.dataset.g;
  if(!g.watch||!g.phone){ctx.say('Lock away personal items first: the watch and the phone.','bad');return;}
  if(id===GOWN_ORDER[k]){g[id]=true;k++;render();if(k===6){ctx.say('Fully gowned. Nice work.','good');setTimeout(ctx.done,700);}else ctx.say(`${GARMENTS[id]} on.`,'good');}
  else ctx.say(GOWN_WHY[id]||'Work from the top down: head, face, body, feet, then gloves.','bad');
 };
 bench.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-remove]')){e.preventDefault();e.target.closest('[data-remove]').dispatchEvent(new MouseEvent('click',{bubbles:true}));}};
 render();
};

/* ---------- Room 1 · Air shower ---------- */
TASKS.airshower=(bench,ctx)=>{
 const need=ctx.v.showerSecs;let t=0,raf=0,last=0,finished=false;
 bench.innerHTML=`<div class="shower"><div class="shower-cab" id="cab"><div class="jets l"></div><div class="jets r"></div><div class="mini-avatar">${gownAvatar({watch:1,phone:1,hairnet:1,hood:1,mask:1,coverall:1,boots:1,gloves:1})}</div></div>
  <div class="shower-ctl"><div class="ring" id="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="fill" id="arc" pathLength="100" stroke-dasharray="0 100"/></svg><span id="secs">${need}.0 s</span></div>
  <button class="btn big" id="hold">Hold to run the air shower</button><p class="bench-hint">Keep holding for the full ${need}-second cycle.</p></div></div>`;
 const cab=$(bench,'#cab'),arc=$(bench,'#arc'),secs=$(bench,'#secs');
 function frame(now){const dt=(now-last)/1000;last=now;t=Math.min(need,t+dt);arc.setAttribute('stroke-dasharray',`${t/need*100} 100`);secs.textContent=(need-t).toFixed(1)+' s';
  if(t>=need){finished=true;cab.classList.remove('on');ctx.say('Cycle complete. You’re clean enough to enter.','good');setTimeout(ctx.done,700);return;}raf=requestAnimationFrame(frame);}
 const off=holdControl($(bench,'#hold'),()=>{if(finished)return;cab.classList.add('on');last=performance.now();raf=requestAnimationFrame(frame);},()=>{if(finished)return;cancelAnimationFrame(raf);cab.classList.remove('on');if(t>0){t=0;arc.setAttribute('stroke-dasharray','0 100');secs.textContent=need+'.0 s';ctx.say('Cycle interrupted. Leaving early carries dust in. Start again and hold for the whole cycle.','bad');}});
 return ()=>{off();cancelAnimationFrame(raf);};
};

/* ---------- Room 1 · Contamination sweep ---------- */
TASKS.cctv=(bench,ctx)=>{
 const flags=new Set();
 function render(){bench.innerHTML=`<div class="cctv"><div class="cam-wall">${ctx.v.hazards.map((h,n)=>`<button class="cam ${flags.has(h)?'flagged':''}" data-h="${h}" aria-pressed="${flags.has(h)}">${cameraArt(h)}<span class="cam-label">BAY 2 · CAM ${n+1}<b>${HAZARDS[h].where}</b></span>${flags.has(h)?'<i class="flag">FLAGGED</i>':''}</button>`).join('')}</div>
  <div class="bench-actions"><span class="bench-hint">${flags.size} flagged</span><button class="btn" id="report">Send report →</button></div></div>`;}
 bench.onclick=e=>{
  const c=e.target.closest('[data-h]');if(c){const h=c.dataset.h;flags.has(h)?flags.delete(h):flags.add(h);render();$(bench,`[data-h="${h}"]`).focus();return;}
  if(e.target.closest('#report')){
   const bad=ctx.v.hazards.filter(h=>HAZARDS[h].unsafe),wrong=[...flags].filter(h=>!HAZARDS[h].unsafe),missed=bad.filter(h=>!flags.has(h));
   if(wrong.length)ctx.say(`“${HAZARDS[wrong[0]].title}” follows the rules, so it shouldn’t be flagged.`,'bad');
   else if(missed.length)ctx.say(`${missed.length} rule break${missed.length>1?'s are':' is'} still unflagged. Check every camera against the rules.`,'bad');
   else{ctx.say('Report sent. The bay is clean for NB-7.','good');setTimeout(ctx.done,700);}
  }
 };
 render();
};

/* ---------- Room 2 · Lithography ---------- */
function waferView(stage,opts={}){
 const lines=[[70,40,14,120],[110,40,14,120],[150,40,14,120],[60,70,130,12],[60,128,130,12]];
 const lineFill=stage>=6?'#3b4656':stage>=5?'#3b4656':stage>=4?'#a9b3c1':stage>=3?'#f7e3a6':null;
 const coat=stage>=2&&stage<6;
 return `<svg viewBox="0 0 250 200" class="wafer-view ${opts.spin?'spin':''}" aria-hidden="true"><defs><clipPath id="wc"><circle cx="125" cy="100" r="88"/></clipPath></defs>
  <circle cx="125" cy="100" r="90" fill="#aab4c2" stroke="#6b7686" stroke-width="2"/><path d="M110 189h30" stroke="#6b7686" stroke-width="4"/>
  ${coat?`<circle cx="125" cy="100" r="88" fill="${COL.amber}" opacity="${opts.thin?.35:.55}"/>`:''}
  ${lineFill?`<g clip-path="url(#wc)" fill="${lineFill}">${lines.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>`:''}
  ${stage===0&&opts.dirty!==false?Array.from({length:14},(_,i)=>`<circle cx="${60+(i*37)%130}" cy="${40+(i*53)%120}" r="2.6" fill="#5b4a3a" class="speck"/>`).join(''):''}
 </svg>`;
}
TASKS.litho=(bench,ctx)=>{
 const v=ctx.v;let stage=0,open=null,cleanup=()=>{};
 function shell(panel){
  bench.innerHTML=`<div class="litho"><div class="toolbar">${v.tools.map(id=>{const s=LITHO.findIndex(x=>x.id===id),d=s<stage;return `<button class="tool ${d?'done':''} ${open===id?'open':''}" data-tool="${id}">${photoOr(TOOL_PHOTO[id],'','tool-ph')}<span>${d?'✓ ':''}${LITHO[s].tool}</span></button>`;}).join('')}</div>
   <div class="litho-station"><div class="wafer-box" id="wbox">${waferView(stage)}<span class="bench-hint">${stage}/6 steps done</span></div><div class="panel" id="panel">${panel||'<p class="muted">Choose the tool for the next step from the bay above.</p>'}</div></div></div>`;
 }
 function complete(){cleanup();cleanup=()=>{};ctx.say(LITHO[stage].done,'good');stage++;open=null;shell();if(stage===6)setTimeout(ctx.done,800);}
 const MINI={
  clean(){shell(`<h3>Wet clean bench</h3><p>Rinse the wafer in ultra-pure water and spin it dry.</p><button class="btn" id="go">Run clean cycle</button>`);
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;bench.querySelectorAll('.speck').forEach((s,i)=>setTimeout(()=>s.remove(),60*i));setTimeout(complete,1100);};},
  coat(){const band=[v.rpm-300,v.rpm+300];let rpm=0,raf=0,last=0;
   shell(`<h3>Spin coater</h3><p>Resist is dripped in the centre, then the wafer spins. <b>Faster spin = thinner coat.</b> Release at the target speed.</p>
    <div class="gauge"><div class="band" style="left:${band[0]/60}%;width:${600/60}%"></div><div class="needle" id="needle"></div></div><div class="gauge-scale"><span>0</span><span>3000</span><span>6000 rpm</span></div>
    <p class="readout"><span id="rpm">0</span> rpm · target ${v.rpm} ± 300</p><button class="btn big" id="spin">Hold to spin</button>`);
   const needle=$(bench,'#needle'),out=$(bench,'#rpm'),wv=()=>$(bench,'#wbox svg');
   function frame(now){const dt=(now-last)/1000;last=now;rpm=Math.min(6000,rpm+2000*dt);needle.style.left=rpm/60+'%';out.textContent=Math.round(rpm);raf=requestAnimationFrame(frame);}
   cleanup=holdControl($(bench,'#spin'),()=>{rpm=0;wv()?.classList.add('spin');last=performance.now();raf=requestAnimationFrame(frame);},()=>{cancelAnimationFrame(raf);wv()?.classList.remove('spin');
    if(rpm>=band[0]&&rpm<=band[1])complete();else ctx.say(rpm<band[0]?`Released at ${Math.round(rpm)} rpm: too slow, so the resist is thick and uneven. Wipe and try again.`:`Released at ${Math.round(rpm)} rpm: too fast, so the coat is too thin. Wipe and try again.`,'bad');});},
  expose(){let x=v.mask.dx,y=v.mask.dy;
   shell(`<h3>Mask aligner</h3><p>Line up the mask’s <b style="color:${COL.amber}">amber marks</b> with the wafer’s <b>dark marks</b>, then expose with UV light.</p>
    <svg viewBox="0 0 260 150" class="align-view" aria-hidden="true"><rect width="260" height="150" fill="#2c3440"/><g id="fixed" stroke="#e8edf3" stroke-width="3">${[[60,75],[200,75]].map(([a,b])=>`<path d="M${a-14} ${b}h28M${a} ${b-14}v28"/>`).join('')}</g><g id="mask" stroke="${COL.amber}" stroke-width="3">${[[60,75],[200,75]].map(([a,b])=>`<path d="M${a-14} ${b}h28M${a} ${b-14}v28"/><rect x="${a-8}" y="${b-8}" width="16" height="16" fill="none"/>`).join('')}</g></svg>
    <div class="nudge"><button class="text-btn" data-n="0,-3" aria-label="Nudge up">↑</button><button class="text-btn" data-n="-3,0" aria-label="Nudge left">←</button><button class="text-btn" data-n="3,0" aria-label="Nudge right">→</button><button class="text-btn" data-n="0,3" aria-label="Nudge down">↓</button><span class="readout" id="off"></span></div>
    <button class="btn" id="uv">Expose (UV)</button>`);
   const mask=$(bench,'#mask'),off=$(bench,'#off'),upd=()=>{mask.setAttribute('transform',`translate(${x} ${y})`);off.textContent=`offset ${(x*.05).toFixed(2)} µm, ${(y*.05).toFixed(2)} µm`;};upd();
   const nudge=(a,b)=>{x+=a;y+=b;upd();};
   $(bench,'#panel').onclick=e=>{const n=e.target.closest('[data-n]');if(n){const [a,b]=n.dataset.n.split(',').map(Number);nudge(a,b);}
    if(e.target.closest('#uv')){if(Math.abs(x)<=3&&Math.abs(y)<=3){$(bench,'.align-view').classList.add('flash');setTimeout(complete,700);}else ctx.say('The marks don’t line up, so the pattern would print in the wrong place. Align first.','bad');}};
   const kd=e=>{const m={ArrowUp:[0,-3],ArrowDown:[0,3],ArrowLeft:[-3,0],ArrowRight:[3,0]}[e.key];if(m&&!document.getElementById('modal').open){e.preventDefault();nudge(...m);}};
   document.addEventListener('keydown',kd);cleanup=()=>document.removeEventListener('keydown',kd);},
  develop(){shell(`<h3>Developer</h3><p>With positive resist, the areas the UV light hit <b>dissolve in the developer</b>. That opens windows in the shape of the circuit.</p><button class="btn" id="go">Develop</button>`);
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;setTimeout(complete,900);};},
  etch(){const tE=v.endpoint;let t=0,raf=0,last=0,run=false,pts=[];
   shell(`<h3>Plasma etcher</h3><p>The plasma eats material wherever the resist is open. Watch the <b>endpoint signal</b>: when the layer is cleared, the signal drops. <b>Stop right after the drop.</b></p>
    <svg viewBox="0 0 400 150" class="chart" aria-label="Endpoint signal chart"><rect width="400" height="150" fill="#fbfaf7" stroke="${COL.line}"/><path d="M30 20v110h360" stroke="${COL.muted}" fill="none"/><text x="34" y="16" font-size="10" fill="${COL.muted}">signal</text><text x="360" y="145" font-size="10" fill="${COL.muted}">time</text><polyline id="trace" fill="none" stroke="${COL.blue}" stroke-width="2.5"/></svg>
    <div class="bench-actions"><button class="btn secondary" id="start">Start etch</button><button class="btn" id="stop" disabled>Stop etch</button></div>`);
   const trace=$(bench,'#trace'),sig=s=>s<tE?0.8+Math.sin(s*9)*.03:s<tE+.4?0.8-(s-tE)/.4*.6:0.2+Math.sin(s*7)*.02;
   function frame(now){t+=(now-last)/1000;last=now;pts.push(`${30+t/8*360},${130-sig(t)*100}`);trace.setAttribute('points',pts.join(' '));
    if(t>=8){stopAt();return;}raf=requestAnimationFrame(frame);}
   function stopAt(){run=false;cancelAnimationFrame(raf);$(bench,'#stop').disabled=true;$(bench,'#start').disabled=false;
    if(t<tE+.3)ctx.say('Too early: the signal hadn’t dropped, so the layer isn’t cleared. Run it again.','bad');
    else if(t>tE+1.8)ctx.say('Over-etched: you kept going long after the drop and cut into the layer below. Run it again and stop right after the drop.','bad');
    else complete();}
   $(bench,'#start').onclick=()=>{t=0;pts=[];run=true;$(bench,'#start').disabled=true;$(bench,'#stop').disabled=false;last=performance.now();raf=requestAnimationFrame(frame);};
   $(bench,'#stop').onclick=()=>{if(run)stopAt();};
   cleanup=()=>cancelAnimationFrame(raf);},
  strip(){shell(`<h3>Resist stripper</h3><p>Etching is done, so the leftover resist comes off. What remains is the new circuit layer.</p><button class="btn" id="go">Strip resist</button>`);
   $(bench,'#go').onclick=()=>{$(bench,'#go').disabled=true;setTimeout(complete,800);};}
 };
 bench.onclick=e=>{const b=e.target.closest('[data-tool]');if(!b)return;const id=b.dataset.tool,s=LITHO.findIndex(x=>x.id===id);
  if(s<stage){ctx.say(`${LITHO[s].tool}: already done.`);return;}
  if(s>stage){ctx.say(LITHO[s].early,'bad');return;}
  if(open===id)return;cleanup();cleanup=()=>{};open=id;MINI[id]();};
 shell();
 return ()=>cleanup();
};

/* ---------- Room 3 · Probe, dice, pick ---------- */
const DIE=60,GAP=14,ORIGIN=30;
const diePos=d=>[ORIGIN+d.c*(DIE+GAP),ORIGIN+d.r*(DIE+GAP)];
function waferMap(inner,extra=''){const span=5*DIE+4*GAP;return `<div class="wafer-map" style="width:${span+2*ORIGIN}px;height:${span+2*ORIGIN}px"><div class="wafer-disc"></div>${inner}${extra}</div>`;}
TASKS.probe=(bench,ctx)=>{
 const p=ctx.v.probe,ink=new Set();let phase='limits',shown=0;
 function render(){
  if(phase==='limits'){bench.innerHTML=`<div class="probe-limits"><div class="spec-card"><div class="eyebrow">Test spec · NB-7 sensor chip</div><p>Test voltage: <b>${p.V} V</b></p><p>A good chip’s resistance: <b>${p.Rlo} kΩ to ${p.Rhi} kΩ</b></p><p class="small muted">Volts ÷ kilohms = milliamps (mA).</p></div>
   <form id="lim" class="limit-form"><label>Lowest good current<span><input class="input" id="lo" inputmode="decimal" autocomplete="off"> mA</span></label><label>Highest good current<span><input class="input" id="hi" inputmode="decimal" autocomplete="off"> mA</span></label><button class="btn" type="submit">Set prober limits →</button></form></div>`;
   $(bench,'#lim').onsubmit=e=>{e.preventDefault();const lo=parseFloat($(bench,'#lo').value),hi=parseFloat($(bench,'#hi').value);
    if(lo===p.lo&&hi===p.hi){phase='probe';ctx.say(`Limits set: ${p.lo}–${p.hi} mA. Run the prober.`,'good');render();}
    else if(lo===p.hi&&hi===p.lo)ctx.say('Swapped! Higher resistance gives the lower current.','bad');
    else ctx.say(`Use I = V ÷ R: divide ${p.V} V by each resistance.`,'bad');};return;}
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d),r=i<shown;return `<button class="die ${ink.has(i)?'inked':''}" data-d="${i}" style="left:${x}px;top:${y}px" ${r?'':'disabled'}>${r?`<b>${d.mA.toFixed(1)}</b><small>mA</small>`:''}</button>`;}).join(''))}
   <div class="probe-side"><div class="spec-card"><div class="eyebrow">Pass band</div><p class="big-num">${p.lo}–${p.hi} mA</p></div>${shown?`<p class="bench-hint">Click every chip outside the pass band to ink it.</p><p class="bench-hint">${ink.size} inked</p><button class="btn" id="fin">Finish inking →</button>`:'<button class="btn" id="run">Run prober</button>'}</div></div>`;
 }
 bench.onclick=e=>{
  if(e.target.closest('#run')){$(bench,'#run').disabled=true;const tick=()=>{shown++;render();if(shown<ctx.v.dies.length)setTimeout(tick,45);};tick();return;}
  const d=e.target.closest('[data-d]');if(d&&shown){const i=+d.dataset.d;ink.has(i)?ink.delete(i):ink.add(i);render();return;}
  if(e.target.closest('#fin')){const wrong=[...ink].find(i=>!ctx.v.dies[i].bad),missed=ctx.v.dies.filter((x,i)=>x.bad&&!ink.has(i)).length;
   if(wrong!==undefined)ctx.say(`That chip reads ${ctx.v.dies[wrong].mA.toFixed(1)} mA, inside ${p.lo}–${p.hi} mA, so it passes. Don’t ink it.`,'bad');
   else if(missed)ctx.say(`${missed} failing chip${missed>1?'s are':' is'} still un-inked. ${ctx.v.dies.some(x=>x.bad&&x.mA===0)?'A 0.0 mA reading means an open circuit: that’s a fail too.':''}`,'bad');
   else{ctx.say('All failing chips inked.','good');setTimeout(ctx.done,700);}}
 };
 render();
};
TASKS.dice=(bench,ctx)=>{
 const cut=new Set(),span=5*DIE+4*GAP;
 function render(){
  const streets=[];for(let n=1;n<5;n++){const at=ORIGIN+n*(DIE+GAP)-GAP;streets.push(`<button class="street v ${cut.has('v'+n)?'cut':''}" data-s="v${n}" style="left:${at}px;top:${ORIGIN-18}px;width:${GAP}px;height:${span+36}px" aria-label="Vertical street ${n}"></button>`,`<button class="street h ${cut.has('h'+n)?'cut':''}" data-s="h${n}" style="top:${at}px;left:${ORIGIN-18}px;height:${GAP}px;width:${span+36}px" aria-label="Horizontal street ${n}"></button>`);}
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d);return `<div class="die static ${d.bad?'inked':''}" data-chip="${i}" style="left:${x}px;top:${y}px"></div>`;}).join(''),streets.join(''))}
   <div class="probe-side"><div class="spec-card"><div class="eyebrow">Dicing saw</div><p class="big-num">${cut.size} / 8 cuts</p></div><p class="bench-hint">Click each street between the chips. Inked chips get cut too: they’re sorted out next.</p></div></div>`;
 }
 bench.onclick=e=>{const s=e.target.closest('[data-s]');if(s){if(!cut.has(s.dataset.s)){cut.add(s.dataset.s);render();if(cut.size===8){ctx.say('Wafer diced into separate chips.','good');setTimeout(ctx.done,700);}}return;}
  if(e.target.closest('[data-chip]'))ctx.say('That cut would go straight through a chip and destroy it. Cut on the streets only.','bad');};
 render();
};
TASKS.pick=(bench,ctx)=>{
 const tray=[];
 function render(){
  bench.innerHTML=`<div class="probe">${waferMap(ctx.v.dies.map((d,i)=>{const [x,y]=diePos(d);return tray.includes(i)?'':`<button class="die diced ${d.bad?'inked':''}" data-p="${i}" style="left:${x}px;top:${y}px" aria-label="${d.bad?'Inked chip':'Good chip'}"></button>`;}).join(''))}
   <div class="probe-side"><div class="eyebrow">Packaging tray</div><div class="tray">${Array.from({length:ctx.v.tray},(_,n)=>`<span class="${n<tray.length?'full':''}"></span>`).join('')}</div><p class="bench-hint">${tray.length} / ${ctx.v.tray} placed</p></div></div>`;
 }
 bench.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;const i=+b.dataset.p;
  if(ctx.v.dies[i].bad){ctx.say('That chip is inked: it failed the probe test. It stays behind.','bad');return;}
  tray.push(i);render();if(tray.length===ctx.v.tray){ctx.say('Tray full of known-good dies.','good');setTimeout(ctx.done,700);}};
 render();
};

/* ---------- Room 4 · Measure, inspect, sort ---------- */
TASKS.qc=(bench,ctx)=>{
 const v=ctx.v,S=v.spec,PX=30,X0=70;let n=0,phase='measure',jx=600,reading=null,found=false;
 ctx.setSop(`<p>Final inspection checks every part against its <b>specification</b>:</p><ul><li>Length <b>${S}.00 mm ± 0.10 mm</b>, so anything from <b>${(S-.1).toFixed(2)}</b> to <b>${(S+.1).toFixed(2)} mm</b>.</li><li><b>No cracks</b> under the microscope.</li></ul><p>Fail <b>either</b> check and the part is rejected.</p><p class="tip">Drag the caliper jaw until it touches the part, then record the reading.</p>`);
 const P=()=>v.parts[n];
 function head(){return `<div class="part-strip">${v.parts.map((p,k)=>`<span class="${k<n?'done':k===n?'now':''}">Part ${p.id}${k<n?' ✓':''}</span>`).join('')}<span class="spec-pill">Spec ${S}.00 ± 0.10 mm</span></div>`;}
 function render(){
  const p=P(),right=X0+p.len*PX;
  if(phase==='measure'){bench.innerHTML=`<div class="qc">${head()}<div class="caliper-wrap"><svg viewBox="0 0 680 230" class="caliper" id="cal">
    <rect x="30" y="40" width="620" height="26" rx="3" fill="#d6dbe1" stroke="#8a95a3"/>${Array.from({length:60},(_,i)=>`<path d="M${X0+i*10} 40v${i%5?8:14}" stroke="#5b6573"/>`).join('')}
    <rect x="${X0-18}" y="40" width="18" height="150" fill="#b8c0ca" stroke="#6b7686"/>
    <rect x="${X0}" y="120" width="${p.len*PX}" height="44" fill="#2f3b4c" rx="2"/><text x="${X0+p.len*PX/2}" y="147" fill="#e8edf3" font-size="13" text-anchor="middle" font-family="IBM Plex Mono,monospace">PART ${p.id}</text>
    <g id="jaw" class="jaw" transform="translate(${jx} 0)" tabindex="0" role="slider" aria-label="Caliper jaw" aria-valuetext="${((jx-X0)/PX).toFixed(2)} mm"><rect x="0" y="34" width="18" height="156" fill="#c3cad3" stroke="#6f7b88"/><rect x="-8" y="-2" width="74" height="38" rx="4" fill="#2b3644"/><rect x="-3" y="3" width="64" height="28" rx="2" fill="#d6dde0"/><text x="29" y="23" fill="#14202d" font-size="15" text-anchor="middle" font-family="IBM Plex Mono,monospace" id="lcd">${((jx-X0)/PX).toFixed(2)}</text></g>
   </svg></div><div class="bench-actions"><button class="text-btn" id="close">◀ Close jaw</button><button class="text-btn" id="open">Open ▶</button><span class="bench-hint">Reading: <b id="rd">${((jx-X0)/PX).toFixed(2)} mm</b></span><button class="btn" id="rec">Record reading</button></div></div>`;
   const svg=$(bench,'#cal');let drag=false;
   const setJ=x=>{jx=Math.max(right,Math.min(640,x));const r=((jx-X0)/PX).toFixed(2);$(bench,'#jaw').setAttribute('transform',`translate(${jx} 0)`);$(bench,'#lcd').textContent=r;$(bench,'#rd').textContent=r+' mm';$(bench,'#jaw').setAttribute('aria-valuetext',r+' mm');};
   const toX=e=>{const b=svg.getBoundingClientRect();return (e.clientX-b.left)*680/b.width;};
   svg.onpointerdown=e=>{drag=true;svg.setPointerCapture(e.pointerId);setJ(toX(e)-9);};svg.onpointermove=e=>{if(drag)setJ(toX(e)-9);};svg.onpointerup=()=>drag=false;
   $(bench,'#jaw').onkeydown=e=>{if(e.key==='ArrowLeft'){e.preventDefault();setJ(jx-3);}if(e.key==='ArrowRight'){e.preventDefault();setJ(jx+3);}};
   $(bench,'#close').onclick=()=>setJ(right);$(bench,'#open').onclick=()=>setJ(jx+60);
   $(bench,'#rec').onclick=()=>{if(jx>right+0.5){ctx.say('The jaws aren’t touching the part yet, so that reading is too long. Close the jaw onto the part.','bad');return;}
    reading=p.len;phase='scope';found=false;ctx.say(`Recorded ${p.len.toFixed(2)} mm.`,'good');render();};
   return;}
  if(phase==='scope'){bench.innerHTML=`<div class="qc">${head()}<div class="scope-part" id="sc"><div class="surface">${p.crack?`<button class="crack" style="left:${p.cx}%;top:${p.cy}%" aria-label="Crack"><svg viewBox="0 0 60 40"><path d="M4 30l12-10 6 6 14-16 8 6 12-12" fill="none" stroke="#1d1d1d" stroke-width="2.5"/></svg></button>`:''}</div><div class="lens-shade"></div><div class="lens-ring"></div></div>
   <div class="bench-actions"><span class="bench-hint">Move the lens across the whole part. Click a crack if you see one.</span><button class="btn secondary" id="clean">No defects found</button></div></div>`;
   const sc=$(bench,'#sc'),mv=e=>{const b=sc.getBoundingClientRect(),k=b.width/sc.offsetWidth||1;sc.style.setProperty('--x',(e.clientX-b.left)/k+'px');sc.style.setProperty('--y',(e.clientY-b.top)/k+'px');};
   sc.addEventListener('pointermove',mv);sc.style.setProperty('--x','50%');sc.style.setProperty('--y','50%');
   const cr=$(bench,'.crack');if(cr){cr.onclick=()=>{found=true;phase='bin';ctx.say('Crack found and logged.','good');render();};cr.onfocus=()=>{sc.style.setProperty('--x',cr.offsetLeft+'px');sc.style.setProperty('--y',cr.offsetTop+'px');};}
   $(bench,'#clean').onclick=()=>{if(p.crack){ctx.say('Look again. Scan the whole surface slowly before you sign it off.','bad');return;}phase='bin';ctx.say('Surface clean.','good');render();};
   return;}
  const lenOk=Math.abs(p.len-S)<=0.1001;
  bench.innerHTML=`<div class="qc">${head()}<div class="result-card"><div class="eyebrow">Part ${p.id} · inspection record</div><div class="rec-row"><span>Length</span><b>${p.len.toFixed(2)} mm</b></div><div class="rec-row"><span>Spec</span><b>${S}.00 ± 0.10 mm</b></div><div class="rec-row"><span>Surface</span><b>${found?'Crack':'Clean'}</b></div></div>
   <div class="bins"><button class="bin pass" data-bin="pass">PASS bin</button><button class="bin reject" data-bin="reject">REJECT bin</button></div></div>`;
  bench.querySelectorAll('[data-bin]').forEach(b=>b.onclick=()=>{const good=lenOk&&!p.crack,want=good?'pass':'reject';
   if(b.dataset.bin!==want){ctx.say(good?`${p.len.toFixed(2)} mm is within ${(S-.1).toFixed(2)}–${(S+.1).toFixed(2)} mm and there’s no crack, so it passes.`:p.crack?'A cracked part fails, whatever its size.':`${p.len.toFixed(2)} mm is outside ${(S-.1).toFixed(2)}–${(S+.1).toFixed(2)} mm. Out of tolerance means reject.`,'bad');return;}
   ctx.say(`Part ${p.id} → ${want==='pass'?'PASS':'REJECT'}.`,'good');n++;phase='measure';jx=600;
   if(n===v.parts.length){setTimeout(ctx.done,600);bench.querySelectorAll('[data-bin]').forEach(x=>x.disabled=true);}else render();});
 }
 render();
};

/* ---------- Room 5 · Talk to Mira ---------- */
TASKS.mentor=(bench,ctx)=>{
 const asked=[];
 function render(){const opts=ctx.v.mentor.filter(n=>!asked.includes(n)).slice(0,3),done=asked.length>=3;
  bench.innerHTML=`<div class="mentor-layout"><aside class="mentor-card"><div class="avatar">${portrait('mira')}</div><h3>Mira Tran</h3><p class="muted small">Apprenticeship training advisor</p><div class="meter"><span style="width:${Math.min(3,asked.length)/3*100}%"></span></div><small class="muted">${Math.min(3,asked.length)}/3 questions</small></aside>
   <section class="chat"><div class="chat-log" id="log"><p class="bubble them">Pull up a chair! What would you like to know about getting into the trade?</p>${asked.map(n=>`<p class="bubble you">${MENTOR_POOL[n].q}</p><p class="bubble them">${MENTOR_POOL[n].a}</p>`).join('')}</div>
   <div class="chat-options">${done?'<button class="btn" id="next">Thanks, Mira →</button>':opts.map(n=>`<button class="chip-btn" data-q="${n}">${MENTOR_POOL[n].q}</button>`).join('')}</div></section></div>`;
  const log=$(bench,'#log');log.scrollTop=log.scrollHeight;}
 bench.onclick=e=>{const q=e.target.closest('[data-q]');if(q){const n=+q.dataset.q;asked.push(n);ctx.note(`Mira: ${MENTOR_POOL[n].a.replace(/<[^>]+>/g,'')}`);render();return;}if(e.target.closest('#next'))ctx.done();};
 render();
};

/* ---------- Room 5 · Application folder ---------- */
TASKS.folder=(bench,ctx)=>{
 const inF=new Set();
 function render(){bench.innerHTML=`<div class="desk"><div class="doc-pile">${ctx.v.docs.map(d=>`<button class="doc ${inF.has(d)?'filed':''}" data-doc="${d}" aria-pressed="${inF.has(d)}"><span class="doc-lines"></span><b>${DOCS[d].title}</b>${inF.has(d)?'<i>in folder</i>':''}</button>`).join('')}</div>
  <div class="folder"><div class="folder-tab">APPLICATION</div><ul>${[...inF].map(d=>`<li>${DOCS[d].title}</li>`).join('')||'<li class="muted">Empty</li>'}</ul><button class="btn" id="hand">Hand it to Mira →</button></div></div>`;}
 bench.onclick=e=>{const d=e.target.closest('[data-doc]');if(d){const k=d.dataset.doc;inF.has(k)?inF.delete(k):inF.add(k);render();$(bench,`[data-doc="${k}"]`).focus();return;}
  if(e.target.closest('#hand')){const extra=[...inF].find(k=>DOCS[k].need==='no');
   if(extra){ctx.say(DOCS[extra].why,'bad');return;}
   if(!inF.has('ossd')){ctx.say('Something’s missing: proof you meet the entry requirement.','bad');return;}
   if(!inF.has('sponsor')){ctx.say('Something’s missing: an apprenticeship is a job, so you need an employer.','bad');return;}
   ctx.say(inF.has('resume')?'Perfect. Everything required, plus a resume that will help you get hired.':'That’s everything required. Tip: a resume showing co-op or OYAP helps employers notice you.','good');setTimeout(ctx.done,900);}};
 render();
};

/* ---------- Room 5 · Logbook ---------- */
TASKS.logbook=(bench,ctx)=>{
 const ticked=new Set();
 function render(signed){bench.innerHTML=`<div class="logbook"><div class="log-page"><div class="log-head"><div><div class="eyebrow">Training standard · 630A</div><h3>Micro Electronics Manufacturer</h3></div><span class="muted small">Apprentice: ${ctx.name}</span></div>
  <ul class="log-list">${ctx.v.skills.map(s=>`<li><button class="tick ${ticked.has(s)?'on':''}" data-s="${s}" aria-pressed="${ticked.has(s)}" ${signed?'disabled':''}><span class="box">${ticked.has(s)?'✓':''}</span>${SKILLS[s].t}</button></li>`).join('')}</ul>
  <div class="sign-row"><span class="muted small">Supervisor sign-off</span>${signed?`<svg viewBox="0 0 200 50" class="signature"><path d="M8 34c14-22 22-22 24-4 2 14 10-18 18-14 6 3-2 20 6 18 10-2 12-22 22-18 8 4 0 20 10 16 12-6 18-14 30-10 10 4 20 2 30-6" fill="none" stroke="${COL.blue}" stroke-width="2.5" stroke-linecap="round"/></svg><b>S. Okoro</b>`:'<span class="sig-line"></span>'}</div></div>
  ${signed?'':'<button class="btn" id="sign">Ask Sam to sign →</button>'}</div>`;}
 bench.onclick=e=>{const t=e.target.closest('[data-s]');if(t){const s=t.dataset.s;ticked.has(s)?ticked.delete(s):ticked.add(s);render();$(bench,`[data-s="${s}"]`).focus();return;}
  if(e.target.closest('#sign')){const other=[...ticked].find(s=>!SKILLS[s].ours),missing=ctx.v.skills.filter(s=>SKILLS[s].ours&&!ticked.has(s)).length;
   if(other){ctx.say(`“${SKILLS[other].t}” belongs to the ${SKILLS[other].who} trade, not this one.`,'bad','sam');return;}
   if(missing){ctx.say(`You practised more than that tonight. ${missing} skill${missing>1?'s are':' is'} still unticked.`,'bad','sam');return;}
   render(true);ctx.say('Signed. That’s a real start on your logbook.','good','sam');setTimeout(ctx.done,1400);}};
 render();
};

/* ---------- Room 6 · Route map ---------- */
TASKS.route=(bench,ctx)=>{
 const order=ROUTE.map(s=>s.id),pos={...ctx.v.route,start:[40,150],cert:[905,150]},path=['start'];
 const label=id=>(ROUTE.find(s=>s.id===id)||TRAPS[id]).t;
 function render(){
  const nodes=Object.keys(pos),lit=path.slice(1).map((id,k)=>{const a=pos[path[k]],b=pos[id];return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" class="seg"/>`;}).join('');
  bench.innerHTML=`<div class="route"><svg viewBox="0 0 960 300" class="route-map" role="group" aria-label="Route map">
   <rect width="960" height="300" fill="#fbfaf7"/><g stroke="#e7e2d8">${Array.from({length:20},(_,i)=>`<path d="M${i*50} 0v300"/>`).join('')}${Array.from({length:7},(_,i)=>`<path d="M0 ${i*50}h960"/>`).join('')}</g>${lit}
   ${nodes.map(id=>{const [x,y]=pos[id],on=path.includes(id),end=id==='cert',start=id==='start';const lab=label(id);
    return `<g class="stop ${on?'on':''} ${start||end?'terminal':''}" data-stop="${id}" tabindex="${start?-1:0}" role="button" aria-label="${lab}"><circle cx="${x}" cy="${y}" r="${start||end?16:12}"/>${wrapText(lab,x,y+(start||end?32:28))}</g>`;}).join('')}
  </svg><p class="bench-hint">${path.length-1} of ${order.length-1} stops on your route.</p></div>`;}
 function wrapText(t,x,y){const words=t.split(' '),lines=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>18){lines.push(cur.trim());cur=w;}else cur+=' '+w;}lines.push(cur.trim());
  return `<text x="${x}" y="${y}" text-anchor="middle">${lines.map((l,i)=>`<tspan x="${x}" dy="${i?14:0}">${l.replace(/&/g,'&amp;')}</tspan>`).join('')}</text>`;}
 function pick(id){if(id==='start'||path.includes(id))return;
  if(TRAPS[id]){ctx.say(TRAPS[id].why,'bad');return;}
  if(id!==order[path.length]){ctx.say('Not yet. Something has to come before that stop.','bad');return;}
  path.push(id);render();if(id==='cert'){ctx.say('Route complete: high school to certified!','good');setTimeout(ctx.done,900);}}
 bench.onclick=e=>{const s=e.target.closest('[data-stop]');if(s)pick(s.dataset.stop);};
 bench.onkeydown=e=>{const s=e.target.closest('[data-stop]');if(s&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pick(s.dataset.stop);}};
 render();
};

/* ---------- Room 6 · Next moves ---------- */
TASKS.plan=(bench,ctx)=>{
 const sel=new Set();
 function render(){bench.innerHTML=`<div class="plan"><div class="plan-grid">${ctx.v.plan.map((p,i)=>`<button class="plan-card ${sel.has(i)?'on':''}" data-i="${i}" aria-pressed="${sel.has(i)}"><span class="box">${sel.has(i)?'✓':''}</span>${p}</button>`).join('')}</div>
  <div class="bench-actions"><span class="bench-hint">${sel.size} chosen</span><button class="btn" id="save" ${sel.size<2?'disabled':''}>Save my plan →</button></div></div>`;}
 bench.onclick=e=>{const c=e.target.closest('[data-i]');if(c){const i=+c.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);render();$(bench,`[data-i="${i}"]`).focus();return;}
  if(e.target.closest('#save')&&sel.size>=2){ctx.setPlan([...sel].map(i=>ctx.v.plan[i]));ctx.say('Saved to your mission report.','good');setTimeout(ctx.done,700);}};
 render();
};

/* ---------- Final · Line control ---------- */
TASKS.control=(bench,ctx)=>{
 const list=ctx.v.incidents,LIMIT=30;let n=0,phase='find',t=LIMIT,timer=0;
 const order=['gowning','coater','aligner','etcher','prober','saw','inspect'];
 function render(){
  const inc=INCIDENTS[list[n].i];
  bench.innerHTML=`<div class="control"><div class="truck"><span>Dock</span><div class="truck-bar"><i style="width:${n/list.length*100}%"></i></div><span>${n}/${list.length} alarms cleared</span></div>
   <div class="line">${order.map((s,k)=>`<button class="station ${phase==='fix'&&s===inc.at?'hot':''}" data-st="${s}" ${phase==='fix'?'disabled':''}><small>${String(k+1).padStart(2,'0')}</small>${STATIONS[s]}</button>${k<order.length-1?'<span class="conv"></span>':''}`).join('')}</div>
   <div class="alarm"><div class="alarm-head"><span class="eyebrow">Alarm ${n+1} of ${list.length}</span><span class="alarm-time" id="tm">${Math.ceil(t)} s</span></div><div class="alarm-bar"><i id="tb" style="width:${t/LIMIT*100}%"></i></div><p class="alarm-text">${inc.alarm}</p>
   ${phase==='find'?'<p class="bench-hint">Which station is the problem coming from?</p>':`<div class="fixes">${list[n].order.map(k=>`<button class="fix" data-f="${k}">${inc.fix[k]}</button>`).join('')}</div>`}</div></div>`;
 }
 function tick(){t-=0.25;const tm=$(bench,'#tm'),tb=$(bench,'#tb');if(tm)tm.textContent=Math.ceil(Math.max(0,t))+' s';if(tb)tb.style.width=Math.max(0,t)/LIMIT*100+'%';
  if(t<=0){t=LIMIT;phase='find';ctx.say('Alarm escalated! The line stalled. Take it from the top.','bad');render();}}
 timer=setInterval(()=>{if(!document.getElementById('modal').open)tick();},250);
 bench.onclick=e=>{const inc=INCIDENTS[list[n].i];
  const s=e.target.closest('[data-st]');if(s&&phase==='find'){if(s.dataset.st===inc.at){phase='fix';ctx.say(`Found it: ${STATIONS[inc.at]}. Now pick the fix.`,'good');render();}else ctx.say(`${STATIONS[s.dataset.st]} isn’t the source. Which step could cause that?`,'bad');return;}
  const f=e.target.closest('[data-f]');if(f){if(+f.dataset.f===0){n++;t=LIMIT;phase='find';if(n===list.length){clearInterval(timer);ctx.say('Line clear! Dispatch dock opening.','good');render0();setTimeout(ctx.done,900);}else{ctx.say('Fixed. Next alarm!','good');render();}}else ctx.say('That won’t fix it. Think about what actually causes this problem.','bad');}};
 function render0(){bench.querySelector('.truck-bar i').style.width='100%';bench.querySelectorAll('button').forEach(b=>b.disabled=true);}
 render();
 return ()=>clearInterval(timer);
};
