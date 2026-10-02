(function(){
 'use strict';
 const W=1000,H=460,T=40,OY=10,R=11,MAZE_SPEED=175,ARENA_SPEED=190;
 const positions={};let stopCurrent=()=>{},active=null;
 const themes=[
  {name:'ACCESS SENTINEL',accent:'#99ddc1',seed:144},
  {name:'CLEANROOM GUARDIAN',accent:'#a5d9ee',seed:261},
  {name:'WAFER WARDEN',accent:'#ddc194',seed:337},
  {name:'QUALITY SENTINEL',accent:'#cab7ed',seed:486},
  {name:'RECORDS GUARDIAN',accent:'#e6bda7',seed:539},
  {name:'DISPATCH WARDEN',accent:'#a8e2ca',seed:672}
 ];
 const key=(x,y)=>x+','+y,center=([x,y])=>[(x+.5)*T,OY+(y+.5)*T];
 function pathTo(l,from,to){
  const q=[from],came=new Map([[key(...from),null]]);let found=false;
  for(let i=0;i<q.length;i++){const p=q[i];if(p[0]===to[0]&&p[1]===to[1]){found=true;break;}for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const n=[p[0]+dx,p[1]+dy],k=key(...n);if(l.open.has(k)&&!came.has(k)){came.set(k,p);q.push(n);}}}
  if(!found)return [];const out=[];for(let p=to;p;p=came.get(key(...p)))out.unshift(p);return out;
 }
 function makeMaze(seed){
  let rng=seed>>>0;function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
  const start=[1,9],open=new Set([key(...start)]),stack=[start];
  while(stack.length){const p=stack[stack.length-1],next=[[0,-2],[2,0],[0,2],[-2,0]].map(([dx,dy])=>[p[0]+dx,p[1]+dy]).filter(([x,y])=>x>=1&&x<=23&&y>=1&&y<=9&&!open.has(key(x,y)));
   if(!next.length){stack.pop();continue;}const n=next[Math.floor(random()*next.length)];open.add(key((p[0]+n[0])/2,(p[1]+n[1])/2));open.add(key(...n));stack.push(n);
  }
  const l={start,open,stations:[]},leaves=[...open].map(p=>p.split(',').map(Number)).filter(p=>[[0,-1],[1,0],[0,1],[-1,0]].filter(([dx,dy])=>open.has(key(p[0]+dx,p[1]+dy))).length===1&&pathTo(l,start,p).length>12);
  const far=leaves.filter(p=>{const d=pathTo(l,start,p).length;return d>9&&d<34;}),pool=far.length>=3?far:leaves;
  for(let n=0;n<3&&pool.length;n++)l.stations.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
  if(l.stations.length!==3)l.stations=[...open].map(p=>p.split(',').map(Number)).sort((a,b)=>pathTo(l,start,b).length-pathTo(l,start,a).length).slice(0,3);
  const distance=(a,b)=>pathTo(l,a,b).length-1;
  l.stations.sort((a,b)=>distance(start,a)-distance(start,b));return l;
 }
 const layouts=new Map(),layoutFor=seed=>{if(!layouts.has(seed))layouts.set(seed,makeMaze(seed));return layouts.get(seed);};
 window.roverCanInspect=(room,k)=>!!active&&active.room===room&&active.canInspect(k);
 window.stopRover=()=>stopCurrent();window.resetRover=()=>{stopCurrent();Object.keys(positions).forEach(k=>delete positions[k]);};
 window.startRover=function(canvas,room,seen,onInspect,names,options={}){
  stopCurrent();if(!canvas||!themes[room])return;const c=canvas.getContext('2d');if(!c)return;
  const seed=options.seed||themes[room].seed,l=layoutFor(seed),theme=themes[room],maxHp=44+room*3;
  const slot=room+':'+seed,s=positions[slot]||(positions[slot]={phase:'boss',x:500,y:350,hp:maxHp,integrity:6,time:0,nextAttack:2.8,fireAt:0,invuln:0,shots:[],hazards:[],attackNo:0,retries:0,autoFire:false,hits:0,engaged:false});
  if(options.bossCleared&&s.phase!=='maze'){s.phase='maze';[s.x,s.y]=center(l.start);s.shots=[];s.hazards=[];}
  let route=null,pending=null,keys=new Set(),raf=0,last=null,alive=true,manualPause=false,notice='',noticeUntil=0,notified=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.width=W;canvas.height=H;
  const moves=new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d']);
  function available(){return alive&&canvas.isConnected&&!document.hidden&&canvas.getClientRects().length>0&&!document.getElementById('modal')?.open;}
  function onControl(target){return !!target?.closest?.('input,textarea,select,button,a[href],[contenteditable]:not([contenteditable="false"]),[role="button"],[role="textbox"],[role="slider"]');}
  function say(t){notice=t;noticeUntil=s.time+3.4;const status=document.getElementById('rover-status');if(status)status.textContent=t;}
  function mazeFits(x,y){
   if(x-R<40||x+R>960||y-R<50||y+R>410)return false;
   const left=Math.floor((x-R)/T),right=Math.floor((x+R)/T),top=Math.floor((y-R-OY)/T),bottom=Math.floor((y+R-OY)/T);
   for(let a=left;a<=right;a++)for(let b=top;b<=bottom;b++)if(!l.open.has(key(a,b))){const px=Math.max(a*T,Math.min(x,(a+1)*T)),py=Math.max(OY+b*T,Math.min(y,OY+(b+1)*T));if((x-px)**2+(y-py)**2<R*R)return false;}
   return true;
  }
  function fits(x,y){return s.phase==='maze'?mazeFits(x,y):x-R>=40&&x+R<=960&&y-R>=58&&y+R<=410&&Math.hypot(x-500,y-130)>65;}
  function clearLine(x,y){const dx=x-s.x,dy=y-s.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));for(let i=1;i<=steps;i++)if(!fits(s.x+dx*i/steps,s.y+dy*i/steps))return false;return true;}
  function canInspect(k){if(!available()||manualPause||s.phase!=='maze'||!Number.isInteger(k)||!l.stations[k])return false;const [x,y]=center(l.stations[k]);return Math.hypot(s.x-x,s.y-y)<49&&clearLine(x,y);}
  function nearest(){return l.stations.findIndex((p,k)=>canInspect(k));}
  function inspect(k){if(!canInspect(k)){say(s.phase==='maze'?'Reach a numbered report terminal, then press E.':'Defeat the sentinel first.');return;}keys.clear();route=null;pending=null;onInspect(k);}
  function resetFight(){s.phase='boss';s.x=500;s.y=350;s.hp=maxHp;s.integrity=6;s.time=0;s.nextAttack=2.8;s.fireAt=0;s.invuln=0;s.shots=[];s.hazards=[];s.attackNo=0;s.retries++;s.autoFire=false;s.engaged=false;keys.clear();route=null;manualPause=false;say('Fresh attempt. Hold SPACE to fire; move out of amber zones.');}
  function pointer(e){
   if(!available())return;const r=canvas.getBoundingClientRect();let x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;canvas.focus({preventScroll:true});
   if(s.phase==='retry'){if(x>365&&x<635&&y>257&&y<305)resetFight();return;}
   if(manualPause){say('Press P to resume rover movement.');return;}
   if(s.phase==='boss'&&((x>=784&&x<=950&&y>=65&&y<=99)||Math.hypot(x-500,y-130)<54)){s.engaged=true;s.autoFire=!s.autoFire;say(s.autoFire?'Auto fire ON. Click clear floor to dodge amber zones.':'Auto fire OFF. Hold SPACE or click FIRE to shoot.');return;}
   if(s.phase==='maze'){
    const station=l.stations.findIndex(p=>Math.hypot(x-center(p)[0],y-center(p)[1])<25);
    if(station>=0&&canInspect(station)){inspect(station);return;}
    if(station>=0){[x,y]=center(l.stations[station]);pending=station;}else pending=null;
   }
   if(!fits(x,y)||!clearLine(x,y)){pending=null;say('A wall blocks that route. Walk around the corner.');return;}
   s.engaged=true;keys.clear();route=[x,y];
  }
  function keydown(e){
   const k=e.key.toLowerCase();if(!available()||e.ctrlKey||e.altKey||e.metaKey||onControl(e.target))return;
   if(!moves.has(k)&&!['e',' ','p','r'].includes(k))return;e.preventDefault();
   if(k==='p'){if(!e.repeat){manualPause=!manualPause;keys.clear();route=null;say(manualPause?'Rover paused. The mission clock still runs.':'Rover ready.');}return;}
   if(manualPause)return;
   if(s.phase==='retry'){if(k==='r'&&!e.repeat)resetFight();return;}
   if(k==='e'){if(!e.repeat)inspect(nearest());return;}
   if(k===' '){if(s.phase==='boss'){s.engaged=true;keys.add(k);}return;}
   if(moves.has(k)){s.engaged=true;keys.add(k);route=null;pending=null;}
  }
  function keyup(e){keys.delete(e.key.toLowerCase());}function blur(){keys.clear();route=null;last=null;}
  canvas.addEventListener('pointerdown',pointer);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
  function damage(){if(s.time<s.invuln||s.phase!=='boss')return;s.integrity--;s.hits++;s.invuln=s.time+1.15;say('Hull hit! Leave amber warnings before they turn red.');if(s.integrity<=0){s.phase='retry';keys.clear();route=null;s.autoFire=false;}}
  function spawnAttack(){
   const type=(s.attackNo+room)%3,warning=1.05-room*.025;
   if(type===0)s.hazards.push({type:'column',x:Math.max(88,Math.min(912,s.x)),y:0,size:70+room*3,born:s.time,warning,active:.48});
   if(type===1)s.hazards.push({type:'circle',x:s.x,y:s.y,size:60+room*2,born:s.time,warning:warning+.1,active:.48});
   if(type===2)s.hazards.push({type:'row',x:0,y:Math.max(100,Math.min(375,s.y)),size:50+room*2,born:s.time,warning:warning+.08,active:.48});
   if(room>=3&&s.attackNo%4===3)s.hazards.push({type:'circle',x:Math.max(115,Math.min(885,1000-s.x)),y:Math.max(135,Math.min(360,460-s.y)),size:58,born:s.time,warning:warning+.15,active:.4});
   s.attackNo++;s.nextAttack=s.time+2.35-room*.06;
  }
  function inside(h){return h.type==='column'?Math.abs(s.x-h.x)<h.size/2+R:h.type==='row'?Math.abs(s.y-h.y)<h.size/2+R:Math.hypot(s.x-h.x,s.y-h.y)<h.size+R;}
  function simulate(dt){
   if(s.phase==='retry'||(s.phase==='boss'&&!s.engaged))return;s.time+=dt;
   const dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w')),len=Math.hypot(dx,dy),speed=s.phase==='maze'?MAZE_SPEED:ARENA_SPEED;
   if(len){const step=speed*dt/len;if(fits(s.x+dx*step,s.y))s.x+=dx*step;if(fits(s.x,s.y+dy*step))s.y+=dy*step;}
   else if(route){const [x,y]=route,rx=x-s.x,ry=y-s.y,dist=Math.hypot(rx,ry),step=speed*dt;if(dist<=step){s.x=x;s.y=y;route=null;if(pending!==null){const k=pending;pending=null;inspect(k);if(!alive)return;}}else{const nx=s.x+rx/dist*step,ny=s.y+ry/dist*step;if(fits(nx,ny)){s.x=nx;s.y=ny;}else{route=null;pending=null;}}}
   if(s.phase!=='boss')return;
   if((keys.has(' ')||s.autoFire)&&s.time>=s.fireAt){const dx=500-s.x,dy=130-s.y,d=Math.hypot(dx,dy);s.shots.push({x:s.x,y:s.y,vx:dx/d*700,vy:dy/d*700});s.fireAt=s.time+.3;}
   for(let i=s.shots.length-1;i>=0;i--){const shot=s.shots[i];shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;if(Math.hypot(shot.x-500,shot.y-130)<40){s.hp--;s.shots.splice(i,1);}else if(shot.x<0||shot.x>W||shot.y<0||shot.y>H)s.shots.splice(i,1);}
   if(s.hp<=0){s.hp=0;s.phase='maze';[s.x,s.y]=center(l.start);s.shots=[];s.hazards=[];s.autoFire=false;keys.clear();route=null;pending=null;say('Sentinel offline. Recover all three reports.');if(!notified){notified=true;options.onBossDefeated?.();}return;}
   if(s.time>=s.nextAttack)spawnAttack();for(const h of s.hazards)if(s.time-h.born>=h.warning&&s.time-h.born<h.warning+h.active&&inside(h))damage();s.hazards=s.hazards.filter(h=>s.time-h.born<h.warning+h.active);
  }
  function rect(x,y,w,h,fill,stroke){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);}}
  function txt(t,x,y,size=12,col='#bed3c9',align='left'){c.font=`${size}px Consolas,monospace`;c.fillStyle=col;c.textAlign=align;c.fillText(t,x,y);}
  function circle(x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function drawArena(){
   rect(40,50,920,360,'#112d34');c.strokeStyle='#38626855';c.lineWidth=1;for(let x=40;x<=960;x+=40){c.beginPath();c.moveTo(x,50);c.lineTo(x,410);c.stroke();}for(let y=50;y<=410;y+=40){c.beginPath();c.moveTo(40,y);c.lineTo(960,y);c.stroke();}
   for(const h of s.hazards){const hot=s.time-h.born>=h.warning,fill=hot?'#e976665d':'#e9b76a24',line=hot?'#f99983':'#efc57a';c.setLineDash(hot?[]:[7,5]);if(h.type==='column')rect(h.x-h.size/2,54,h.size,352,fill,line);else if(h.type==='row')rect(44,h.y-h.size/2,912,h.size,fill,line);else circle(h.x,h.y,h.size,fill,line);c.setLineDash([]);if(!hot){txt('!',h.type==='row'?850:h.x,(h.type==='column'?380:h.y)+7,22,line,'center');}}
   circle(500,130,55,'#193a43','#4e7276');rect(455,109,16,52,'#375862',theme.accent);rect(529,109,16,52,'#375862',theme.accent);rect(471,94,58,68,'#91b5b6',theme.accent);rect(478,103,44,26,'#102b37');rect(485,112,9,7,'#f1be84');rect(506,112,9,7,'#f1be84');rect(482,138,36,13,'#284b58');rect(494,77,12,17,'#719b9c');circle(500,75,4,theme.accent);txt('SPACE / FIRE',500,200,10,'#9bbcb5','center');
   for(const shot of s.shots){circle(shot.x,shot.y,4,'#b8f5d9');if(!reduced){c.strokeStyle='#8ae5c4';c.lineWidth=3;c.beginPath();c.moveTo(shot.x,shot.y);c.lineTo(shot.x-shot.vx*.012,shot.y-shot.vy*.012);c.stroke();}}
   txt(theme.name,58,79,12,theme.accent);rect(58,89,220,9,'#051b23');rect(58,89,220*s.hp/maxHp,9,theme.accent);txt('SECURITY '+Math.ceil(s.hp/maxHp*100)+'%',58,116,10,'#b4ccc2');
   rect(784,65,166,34,s.autoFire?'#2f6559':'#183942',s.autoFire?'#a4e8c6':'#699c93');txt('AUTO FIRE: '+(s.autoFire?'ON':'OFF'),867,87,12,s.autoFire?'#dcffe9':'#c2d4ca','center');txt('Click FIRE; click floor to dodge',943,116,10,'#afc6bd','right');
   txt('HULL',59,386,10,'#adc9bd');for(let i=0;i<6;i++)rect(96+i*20,375,14,14,i<s.integrity?'#93dabb':'#3c4e52');txt('Amber = warning. Move before red.',939,391,11,'#dec895','right');
   if(!s.engaged&&s.phase==='boss'){rect(291,233,418,69,'#10242de8','#608d82');txt('HOLD SPACE TO FIRE · MOVE TO DODGE',500,258,15,'#d8e9ce','center');txt('Or click AUTO FIRE, then click clear floor to move.',500,280,11,'#b8d0c1','center');}
  }
  function drawMaze(){
   rect(40,50,920,360,'#17363a');for(let y=1;y<=9;y++)for(let x=1;x<=23;x++){const a=x*T,b=OY+y*T;if(!l.open.has(key(x,y))){rect(a,b,T,T,'#2f5057');rect(a+3,b+3,34,34,'#375d61','#618279');rect(a+7,b+8,26,4,'#739084');rect(a+7,b+17,26,16,'#213d47');}else rect(a+18,b+18,4,4,'#6796882d');}
   const [sx,sy]=center(l.start);rect(sx-15,sy-15,30,30,'#274e45','#74ad96');txt('IN',sx,sy+4,10,'#b6dbc0','center');
   l.stations.forEach((p,k)=>{const [x,y]=center(p),read=seen.includes(k);rect(x-16,y-17,32,34,'#315951',read?'#9eddbd':'#e8c886');rect(x-12,y-13,24,21,'#102a31');txt(read?'✓':String(k+1),x,y+4,18,read?'#a3efcc':'#ffe1a2','center');rect(x-10,y+11,20,3,read?'#9ad6b7':'#dab77d');if(canInspect(k)){c.strokeStyle='#c8f1d5';c.lineWidth=2;c.strokeRect(x-20,y-21,40,42);}});
   if(route){c.strokeStyle='#a3dec666';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.moveTo(s.x,s.y);c.lineTo(...route);c.stroke();c.setLineDash([]);}
  }
  function draw(){
   rect(0,0,W,H,'#0b1b21');txt('NOVA / SERVICE FLOOR '+String(room+1).padStart(2,'0'),42,25,12,theme.accent);txt(s.phase==='maze'?'REPORTS '+seen.length+'/3  ·  SENTINEL OFFLINE':'REPORTS LOCKED  ·  DEFEAT SENTINEL',957,25,12,s.phase==='maze'?'#b4e3c1':'#e1c798','right');
   if(s.phase==='maze')drawMaze();else drawArena();rect(32,42,936,6,'#6e9b8b');rect(32,412,936,6,'#507c70');rect(32,42,6,376,'#4c7e70');rect(962,42,6,376,'#4c7e70');
   if(s.phase!=='retry'){c.save();c.translate(s.x,s.y);if(s.phase==='boss'&&s.time<s.invuln)circle(0,0,19,'#e7c98c25','#e7c98c');rect(-12,-12,6,25,'#081114','#587c72');rect(6,-12,6,25,'#081114','#587c72');rect(-9,-11,18,24,'#acc5b8','#e1e9d8');rect(-6,-7,12,11,'#0d2b34');rect(-3,-4,6,4,'#90e0c5');rect(-5,8,10,3,'#4b6f67');c.restore();}
   if(s.phase==='retry'){rect(292,175,416,149,'#0b1b21f5','#9eb6a6');txt('ROVER NEEDS A RESTART',500,205,19,'#e8d2aa','center');txt('Unlimited retries. Your collected reports are safe.',500,228,11,'#c1d2c5','center');txt('Keep firing while dodging the amber zones.',500,246,11,'#c1d2c5','center');rect(365,258,270,46,'#30594d','#a4d2af');txt('PRESS R / CLICK TO RETRY',500,287,14,'#e5f3d8','center');}
   else if(manualPause||!available()){rect(354,200,292,52,'#091820ee','#7aa693');txt('ROVER PAUSED · P TO RESUME',500,232,15,'#c6ddc9','center');}
   if(notice&&s.time<noticeUntil)txt(notice,500,433,11,'#e1d5b4','center');txt(s.phase==='maze'?'WASD / ARROWS · CLICK CLEAR AISLE · E: REPORT · P: PAUSE':'WASD / ARROWS · HOLD SPACE TO FIRE · P: PAUSE',42,451,10,'#9fc1b0');txt(s.phase==='maze'?'WALK AROUND CORNERS':'DODGE AMBER → RED',958,451,10,'#cbb98c','right');
  }
  function frame(now){if(!alive||!canvas.isConnected)return;const dt=last===null?0:Math.max(0,Math.min((now-last)/1000,.035));last=now;const paused=manualPause||!available()||onControl(document.activeElement);if(paused)keys.clear();else simulate(dt);if(!alive)return;draw();raf=requestAnimationFrame(frame);}
  const controller={room,canInspect,snapshot:()=>({room,phase:s.phase,x:s.x,y:s.y,hp:s.hp,maxHp,integrity:s.integrity,time:s.time,autoFire:s.autoFire,retries:s.retries,hits:s.hits,hazards:s.hazards.map(h=>({...h})),paused:manualPause,engaged:s.engaged})};active=controller;
  raf=requestAnimationFrame(frame);stopCurrent=()=>{alive=false;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);keys.clear();if(active===controller)active=null;};
 };
})();

(function(){
 'use strict';
 let stopBattle=()=>{},stopSignal=()=>{};const saved={};
 const oldStop=window.stopRover,oldReset=window.resetRover;
 window.stopRover=()=>{stopBattle();oldStop();};
 window.resetRover=()=>{stopBattle();stopSignal();Object.keys(saved).forEach(k=>delete saved[k]);oldReset();};
 function battleModel(final=false){
  const box={x:final?200:280,y:160,w:final?600:440,h:220};
  const s={x:500,y:325,hp:6,time:0,phaseTime:0,stage:0,next:1.4,volley:0,bullets:[],invuln:0,started:false,exposed:false,won:false,lost:false,box,final};
  function strike(){if(!s.started){s.started=true;return;}if(!s.exposed||s.lost||s.won)return;s.stage++;s.phaseTime=0;s.exposed=false;s.bullets=[];s.next=.9;s.volley=0;if(s.stage===3)s.won=true;}
  function volley(){
   const vertical=s.stage!==1,span=vertical?box.w:box.h,step=span/10,gap=(s.volley%2?6:1),speed=vertical?105:135,up=s.stage===2;
   for(let i=0;i<10;i++){if(i>=gap&&i<gap+3)continue;s.bullets.push({r:step*.42,x:vertical?box.x+(i+.5)*step:box.x-10,y:vertical?(up?box.y+box.h+10:box.y-10):box.y+(i+.5)*step,vx:vertical?0:speed,vy:vertical?(up?-speed:speed):0});}
   s.volley++;s.next=s.phaseTime+(s.stage===2?1.65:2.05);
  }
  function step(dt,dx=0,dy=0){
   if(!s.started||s.won||s.lost)return;dt=Math.min(.035,Math.max(0,dt));s.time+=dt;s.phaseTime+=dt;
   const length=Math.hypot(dx,dy);if(length){s.x=Math.max(box.x+10,Math.min(box.x+box.w-10,s.x+dx/length*210*dt));s.y=Math.max(box.y+10,Math.min(box.y+box.h-10,s.y+dy/length*210*dt));}
   if(s.exposed){if(s.phaseTime>=5){s.exposed=false;s.phaseTime=0;s.next=1.4;s.volley=0;}return;}
   if(s.phaseTime>=12){s.bullets=[];s.phaseTime=0;if(final)s.exposed=true;else if(++s.stage===3)s.won=true;else{s.next=1.4;s.volley=0;}return;}
   if(s.phaseTime>=s.next)volley();
   for(const b of s.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;if(s.time>=s.invuln&&Math.hypot(b.x-s.x,b.y-s.y)<b.r+9){s.hp--;s.invuln=s.time+1.1;if(s.hp===0)s.lost=true;}}
   s.bullets=s.bullets.filter(b=>b.x>=box.x-15&&b.y>=box.y-15&&b.x<box.x+box.w+15&&b.y<box.y+box.h+15);
  }
  return {s,step,strike};
 }
 function signalModel(offset=0){
  const order=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5),s={time:0,hits:0,started:false,over:false,won:false,turn:-1};
  const target=()=>order[(Math.floor(s.time/1.3)+offset)%order.length];
  function tap(n){if(s.over)return;if(!s.started)s.started=true;const turn=Math.floor(s.time/1.3);if(n===target()&&s.turn!==turn){s.hits++;s.turn=turn;}}
  function step(dt){if(s.started&&!s.over){s.time=Math.min(10,s.time+Math.max(0,Math.min(.05,dt)));if(s.time>=10){s.over=true;s.won=s.hits>=5;}}}
  return {s,target,tap,step};
 }
 // Independent models are also used by the local regression tests.
 window.NovaChallenges={battleModel,signalModel};
 function text(c,t,x,y,size=16,color='#cfe4d6'){c.font=size+'px Consolas,monospace';c.fillStyle=color;c.textAlign='center';c.fillText(t,x,y);}
 function rect(c,x,y,w,h,color,border){c.fillStyle=color;c.fillRect(x,y,w,h);if(border){c.strokeStyle=border;c.lineWidth=2;c.strokeRect(x,y,w,h);}}
 window.startNovaEncounter=function(canvas,mode,onWin){
  window.stopRover();const c=canvas.getContext('2d');if(!c)return;canvas.width=1000;canvas.height=460;
  const final=mode==='final',key=final?'final':'dodge';let model=saved[key]||(saved[key]=battleModel(final));
  let raf=0,last=null,alive=true,paused=false,notified=false,route=null;const keys=new Set();
  function reset(){model=saved[key]=battleModel(final);route=null;keys.clear();paused=false;}
  function available(){return alive&&canvas.isConnected&&!document.hidden&&!document.getElementById('modal')?.open;}
  function keydown(e){if(!available()||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,select,textarea,button,a[href]'))return;const k=e.key.toLowerCase();if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','p','r'].includes(k))return;e.preventDefault();if(k==='p'&&!e.repeat){paused=!paused;keys.clear();return;}if(k==='r'&&model.s.lost){reset();return;}if(paused)return;if(k===' '&&!e.repeat){model.strike();return;}if(k!==' '){keys.add(k);route=null;model.s.started=true;}}
  function keyup(e){keys.delete(e.key.toLowerCase());}
  function blur(){keys.clear();route=null;last=null;paused=true;}
  function pointer(e){if(!available())return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1000/r.width,y=(e.clientY-r.top)*460/r.height;
   if(model.s.lost){if(x>340&&x<660&&y>225&&y<305)reset();return;}if(paused){paused=false;return;}
   if(model.s.exposed){if(x>300&&x<700&&y>58&&y<140)model.strike();return;}
   const b=model.s.box;if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){model.s.started=true;route=[x,y];keys.clear();}else if(!model.s.started)model.strike();
  }
  canvas.addEventListener('pointerdown',pointer);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
  function draw(){const s=model.s,b=s.box;rect(c,0,0,1000,460,'#08191f');text(c,final?'NOVA CORE / FINAL OVERRIDE':'WAFER WARDEN / CONTAINMENT',500,30,18,'#bca9e8');
   text(c,s.exposed?'CORE EXPOSED — SPACE OR CLICK HERE':'◇   '+['PULSE RAIN','SIDEWINDER','RETURN SURGE'][Math.min(s.stage,2)]+'   ◇',500,93,22,s.exposed?'#a5f1c8':'#dfc48b');
   text(c,final?'SEALS BROKEN '+s.stage+'/3':'WAVE '+Math.min(s.stage+1,3)+'/3',500,124,13);rect(c,b.x,b.y,b.w,b.h,'#050d14','#d4e8d9');
   c.save();c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();for(const z of s.bullets){c.fillStyle='#f1c1a0';c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.fill();}c.restore();
   c.fillStyle=s.time<s.invuln?'#d8c893':'#92f0c4';c.beginPath();c.moveTo(s.x,s.y-10);c.lineTo(s.x+9,s.y);c.lineTo(s.x,s.y+10);c.lineTo(s.x-9,s.y);c.closePath();c.fill();
   text(c,'INTEGRITY '+s.hp+'/6',b.x+80,411,14,'#9edac0');text(c,s.exposed?'STRIKE WINDOW '+Math.ceil(5-s.phaseTime)+'s':'SURVIVE '+Math.ceil(12-s.phaseTime)+'s',b.x+b.w-100,411,14,'#e8c58b');
   text(c,final?'Dodge each wave. Strike the exposed core to break a seal.':'Dodge the pulses for three waves. No shooting in this encounter.',500,442,13);
   if(!s.started||s.lost||paused){rect(c,315,213,370,104,'#10262ef2','#90bca6');text(c,s.lost?'SIGNAL LOST':paused?'PAUSED':'STAY INSIDE THE BOX',500,241,21);text(c,s.lost?'R / CLICK HERE TO RETRY':paused?'P / CLICK TO RESUME':'WASD / ARROWS OR CLICK TO MOVE',500,269,14);text(c,s.lost?'Your room progress is safe.':'Find the gaps between the pulses.',500,294,12);}
  }
  function frame(now){if(!alive||!canvas.isConnected)return;const dt=last===null?0:Math.min(.035,(now-last)/1000);last=now;
   if(available()&&!paused){let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(route){const rx=route[0]-model.s.x,ry=route[1]-model.s.y;if(Math.hypot(rx,ry)<5)route=null;else{dx=rx;dy=ry;}}model.step(dt,dx,dy);}
   draw();if(model.s.won&&!notified){notified=true;onWin();if(!alive)return;}raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);stopBattle=()=>{alive=false;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);keys.clear();};
 };
 window.stopSignalGame=()=>stopSignal();
 window.startSignalGame=function(canvas,room,onWin){
  stopSignal();const c=canvas.getContext('2d');if(!c)return;canvas.width=680;canvas.height=240;let model=signalModel(room),raf=0,last=null,alive=true;
  function tap(n){if(model.s.over){model=signalModel(room);return;}model.tap(n);}
  function pointer(e){canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*680/r.width,y=(e.clientY-r.top)*240/r.height;if(model.s.over){tap(0);return;}const col=Math.floor((x-215)/84),row=Math.floor((y-18)/64);if(col>=0&&col<3&&row>=0&&row<3)tap(row*3+col);}
  function keydown(e){if(document.activeElement!==canvas||e.repeat)return;if(/^[1-9]$/.test(e.key)){e.preventDefault();tap(Number(e.key)-1);}else if(e.key.toLowerCase()==='r'&&model.s.over){e.preventDefault();tap(0);}}
  canvas.addEventListener('pointerdown',pointer);document.addEventListener('keydown',keydown);
  function frame(now){if(!alive||!canvas.isConnected)return;const dt=last===null?0:(now-last)/1000;last=now;if(!document.hidden)model.step(dt);const s=model.s;rect(c,0,0,680,240,'#091b20');text(c,'SIGNAL LOCK',105,75,18);text(c,Math.ceil(10-s.time)+'s',105,112,29,'#a7e5c4');text(c,s.hits+'/5 hits',105,145,16);text(c,'CLICK OR USE',565,94,14);text(c,'KEYS 1–9',565,119,14);
   for(let n=0;n<9;n++){const lit=n===model.target()&&s.turn!==Math.floor(s.time/1.3);rect(c,215+n%3*84,18+Math.floor(n/3)*64,74,54,lit?'#b6e9c5':'#18363c',lit?'#e8f7d5':'#42635d');text(c,String(n+1),252+n%3*84,53+Math.floor(n/3)*64,22,lit?'#0b3026':'#7d9e90');}
   text(c,s.over?'Not enough signals. Click / R to retry.':s.started?'Catch the lit tiles. One hit per signal.':'Hit the lit tile to start the 10-second challenge.',340,227,13,'#d3d8bd');
   if(s.won){stopSignal();onWin();return;}raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);stopSignal=()=>{alive=false;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',keydown);};canvas.focus({preventScroll:true});
 };
})();

(function(){
 'use strict';
 const cached={};let stop=()=>{};const previousStop=window.stopRover,previousReset=window.resetRover;
 window.stopRover=()=>{stop();previousStop();};
 window.resetRover=()=>{stop();Object.keys(cached).forEach(k=>delete cached[k]);previousReset();};
 function stacker(){
  const s={board:[],piece:null,x:3,y:0,stage:0,lines:0,clock:0,won:false,lost:false,started:false};
  const specs=[{h:2,x:3,w:4,shape:[[1,1],[1,1]],tip:'Fit two square pieces into the centre gap.'},{h:4,x:7,w:2,shape:[[1,1,1,1]],tip:'Rotate the long pieces upright for the right-hand gap.'},{h:3,x:0,w:4,shape:[[1,1,1,1]],tip:'Place three flat pieces in the left-hand gap.'}];
  function fits(p=s.piece,x=s.x,y=s.y){return p.every((row,j)=>row.every((v,i)=>!v||(x+i>=0&&x+i<10&&y+j<12&&(y+j<0||!s.board[y+j][x+i]))));}
  function spawn(){s.piece=specs[s.stage].shape.map(r=>[...r]);s.x=3;s.y=0;s.clock=0;if(!fits())s.lost=true;}
  function setup(){const z=specs[s.stage];s.lines=[0,2,6][s.stage];s.board=Array.from({length:12},(_,y)=>Array.from({length:10},(_,x)=>y>=12-z.h&&(x<z.x||x>=z.x+z.w)?1:0));s.lost=false;spawn();}
  function lock(){for(let y=0;y<s.piece.length;y++)for(let x=0;x<s.piece[y].length;x++)if(s.piece[y][x])s.board[s.y+y][s.x+x]=2;
   const remain=s.board.filter(r=>!r.every(Boolean)),count=12-remain.length;s.lines+=count;s.board=[...Array.from({length:count},()=>Array(10).fill(0)),...remain];
   if(!s.board.some(r=>r.some(Boolean))){if(++s.stage===3){s.won=true;return;}setup();}else spawn();
  }
  function down(){if(fits(s.piece,s.x,s.y+1))s.y++;else lock();}
  function act(a){if(s.won)return;if(a==='retry'){setup();return;}if(s.lost)return;s.started=true;if(a==='left'||a==='right'){const x=s.x+(a==='left'?-1:1);if(fits(s.piece,x,s.y))s.x=x;}
   if(a==='rotate'){const p=s.piece[0].map((_,x)=>s.piece.map(r=>r[x]).reverse());for(const d of [0,-1,1,-2,2])if(fits(p,s.x+d,s.y)){s.piece=p;s.x+=d;break;}}
   if(a==='down')down();if(a==='drop'){while(fits(s.piece,s.x,s.y+1))s.y++;lock();}
  }
  function step(dt){if(s.started&&!s.won&&!s.lost){s.clock+=dt;if(s.clock>.8){s.clock=0;down();}}}
  function ghost(){let y=s.y;while(fits(s.piece,s.x,y+1))y++;return y;}
  setup();return {s,act,step,ghost,tip:()=>specs[Math.min(2,s.stage)].tip};
 }
 function memory(){
  const sequences=[3,4,5].map(n=>Array.from({length:n},()=>Math.floor(Math.random()*4)));
  const s={round:0,index:0,phase:'ready',time:0,lit:-1,flash:0,won:false,lost:false,started:false,message:'Watch the pattern, then repeat it.'};
  function play(){s.phase='watch';s.time=0;s.index=0;s.lit=-1;s.started=true;s.message='Watch…';}
  function act(a){if(s.won)return;if(a==='start'||a==='retry'){play();return;}if(s.phase!=='input'||!Number.isInteger(a)||a<0||a>3)return;s.lit=a;s.flash=.22;
   if(a!==sequences[s.round][s.index]){s.phase='again';s.time=0;s.message='Try that pattern again. Your earlier rounds are saved.';return;}
   if(++s.index===sequences[s.round].length){if(++s.round===sequences.length){s.won=true;return;}s.phase='next';s.time=0;s.message='Correct. Next pattern…';}
  }
  function step(dt){if(s.won)return;s.time+=dt;if(s.phase==='watch'){const t=s.time-.6,k=Math.floor(t/.75);s.lit=t>=0&&k<sequences[s.round].length&&t% .75<.5?sequences[s.round][k]:-1;if(t>=sequences[s.round].length*.75){s.phase='input';s.lit=-1;s.message='Your turn. Click the pads or use keys 1–4.';}}
   else if((s.phase==='again'||s.phase==='next')&&s.time>1.2)play();else if(s.phase==='input'){s.flash-=dt;if(s.flash<=0)s.lit=-1;}}
  return {s,act,step};
 }
 function timing(){
  const zones=Array.from({length:6},()=>.15+Math.random()*.7);const s={time:0,position:0,hits:0,misses:0,cool:0,started:false,won:false,lost:false,message:'Start, then stop the marker inside the green band.'};
  const target=()=>zones[Math.min(s.hits,5)];
  function act(a){if(s.won)return;if(!s.started){s.started=true;s.message='Press Space or LOCK when the marker is green.';return;}if(a!=='lock'||s.cool>0)return;s.cool=.65;
   if(Math.abs(s.position-target())<=.085){s.hits++;s.message='LOCKED';if(s.hits===6)s.won=true;}else{s.misses++;s.message='Missed. Keep your locks and try again.';}}
  function step(dt){if(!s.started||s.won)return;s.time+=dt*(.57+s.hits*.025);s.cool=Math.max(0,s.cool-dt);const p=s.time%2;s.position=p<=1?p:2-p;}
  return {s,act,step,target};
 }
 function breaker(){
  const s={paddle:500,x:500,y:362,vx:110,vy:-245,lives:3,launched:false,won:false,lost:false,started:false,bricks:Array.from({length:12},(_,i)=>({x:164+(i%6)*114,y:85+Math.floor(i/6)*36,live:true}))};
  function serve(){s.launched=false;s.x=s.paddle;s.y=362;s.vx=110;s.vy=-245;}
  function act(a,value){if(s.won)return;if(a==='retry'){s.lives=3;s.lost=false;serve();return;}if(s.lost)return;if(a==='paddle'){s.paddle=Math.max(164,Math.min(836,value));if(!s.launched)s.x=s.paddle;}if(a==='launch'){s.launched=true;s.started=true;}}
  function step(dt,axis=0){if(s.won||s.lost)return;dt=Math.min(.035,dt);if(axis)act('paddle',s.paddle+axis*530*dt);if(!s.launched)return;
   const lastX=s.x,lastY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;
   if(s.x<127){s.x=127;s.vx=Math.abs(s.vx);}if(s.x>873){s.x=873;s.vx=-Math.abs(s.vx);}if(s.y<61){s.y=61;s.vy=Math.abs(s.vy);}
   for(const b of s.bricks)if(b.live&&s.x+7>b.x&&s.x-7<b.x+100&&s.y+7>b.y&&s.y-7<b.y+23){b.live=false;if(lastY+7<=b.y||lastY-7>=b.y+23)s.vy=-s.vy;else s.vx=-s.vx;s.x=lastX;s.y=lastY;break;}
   if(s.vy>0&&lastY<=365&&s.y>=365&&Math.abs(s.x-s.paddle)<=71){s.y=364;const ratio=(s.x-s.paddle)/64;s.vx=ratio*265;if(Math.abs(s.vx)<75)s.vx=s.vx<0?-75:75;s.vy=-Math.sqrt(310*310-s.vx*s.vx);}
   if(s.y>415){if(--s.lives===0)s.lost=true;serve();}if(s.bricks.every(b=>!b.live))s.won=true;
  }
  return {s,act,step};
 }
 window.NovaArcade={stacker,memory,timing,breaker};
 const meta={stacker:['CLEANROOM STACKER','Tetris-style · clear all 3 trays'],memory:['INSPECTION MEMORY','Repeat 3 patterns to unlock the files'],timing:['SIGNAL CALIBRATION','Land 6 locks inside the green band'],breaker:['DISPATCH BREAKER','Clear the 12 buffer blocks']};
 window.startArcadeEncounter=function(canvas,kind,onWin){
  window.stopRover();const c=canvas.getContext('2d');if(!c)return;canvas.width=1000;canvas.height=460;
  let m=cached[kind]||(cached[kind]=window.NovaArcade[kind]()),alive=true,raf=0,last=null,paused=false,notified=false;const keys=new Set();let buttons=[];
  const rect=(x,y,w,h,fill,stroke)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.strokeRect(x,y,w,h);}};
  const text=(t,x,y,size=16,color='#d1e7d9')=>{c.font=size+'px Consolas,monospace';c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);};
  function button(label,x,y,w,h,a){rect(x,y,w,h,'#193c3a','#81b19a');text(label,x+w/2,y+h/2+5,15);buttons.push({x,y,w,h,a});}
  function available(){return alive&&canvas.isConnected&&!document.hidden&&!document.getElementById('modal')?.open;}
  function act(a){if(paused){paused=false;return;}m.act(a);}
  function keydown(e){if(!available()||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,select,textarea,button,a[href]'))return;const k=e.key.toLowerCase();if(!['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown',' ','enter','p','r','1','2','3','4'].includes(k))return;e.preventDefault();
   if(k==='p'&&!e.repeat){paused=!paused;keys.clear();return;}if(paused)return;if(k==='r'){if(!e.repeat)act('retry');return;}
   if(kind==='breaker'){if(['a','d','arrowleft','arrowright'].includes(k))keys.add(k);if([' ','enter'].includes(k)&&!e.repeat)act('launch');return;}
   if(kind==='stacker'){const a={a:'left',arrowleft:'left',d:'right',arrowright:'right',w:'rotate',arrowup:'rotate',s:'down',arrowdown:'down',' ':'drop',enter:'drop'}[k];if(a&&(!e.repeat||['left','right','down'].includes(a)))act(a);}
   else if(!e.repeat&&kind==='memory'){if(/^[1-4]$/.test(k))act(Number(k)-1);else if([' ','enter'].includes(k)&&m.s.phase==='ready')act('start');}
   else if(!e.repeat&&kind==='timing'&&[' ','enter'].includes(k))act('lock');
  }
  const keyup=e=>keys.delete(e.key.toLowerCase());const blur=()=>{keys.clear();last=null;paused=true;};
  function point(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*460/r.height];}
  function pointer(e){if(!available())return;canvas.focus({preventScroll:true});if(paused){paused=false;return;}const [x,y]=point(e),b=buttons.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(b){act(b.a);return;}if(kind==='breaker'){m.act('paddle',x);m.act('launch');}}
  function pointermove(e){if(kind==='breaker'&&available()&&!paused){const [x]=point(e);m.act('paddle',x);}}
  canvas.addEventListener('pointerdown',pointer);canvas.addEventListener('pointermove',pointermove);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
  function draw(){const s=m.s;buttons=[];rect(0,0,1000,460,'#091b22');text(meta[kind][0],500,29,21,'#bde5cd');text(meta[kind][1],500,48,13,'#cbbf98');
   if(kind==='stacker'){
    const ox=365,oy=74,t=25;rect(ox-3,oy-3,256,306,'#041116','#668d7b');for(let y=0;y<12;y++)for(let x=0;x<10;x++){const v=s.board[y][x];rect(ox+x*t+1,oy+y*t+1,t-2,t-2,v===2?'#9fe1cb':v?'#527875':'#102830');}
    if(!s.won&&!s.lost){const gy=m.ghost();for(let y=0;y<s.piece.length;y++)for(let x=0;x<s.piece[y].length;x++)if(s.piece[y][x]){rect(ox+(s.x+x)*t+2,oy+(gy+y)*t+2,t-4,t-4,'#213d3f','#526e61');rect(ox+(s.x+x)*t+1,oy+(s.y+y)*t+1,t-2,t-2,'#e9c18b');}}
    text('TRAY '+Math.min(s.stage+1,3)+' / 3',195,137,22);text('LINES '+s.lines,195,175,18,'#9ae1c3');text('Arrows / A D: move',805,123,14);text('Up / W: rotate',805,151,14);text('Space: drop',805,179,14);button('◀',695,218,70,44,'left');button('ROTATE',775,218,120,44,'rotate');button('▶',905,218,60,44,'right');button('DROP',735,277,185,48,'drop');text(m.tip(),500,414,15);text('Ghost outline shows where the piece will land. R retries this tray.',500,442,12);
   }else if(kind==='memory'){
    const colors=['#96dfbd','#e2bf82','#a8c5ea','#d5ade0'];for(let n=0;n<4;n++){const x=315+n%2*195,y=87+Math.floor(n/2)*132;rect(x,y,176,112,s.lit===n?colors[n]:'#17323a',colors[n]);text(String(n+1),x+88,y+71,40,s.lit===n?'#102d2c':colors[n]);buttons.push({x,y,w:176,h:112,a:n});}
    text('ROUND '+Math.min(s.round+1,3)+'/3',151,154,23);text(s.phase==='watch'?'WATCH':s.phase==='input'?'REPEAT':'GET READY',151,191,16,'#e2c791');text('Keys 1–4',841,163,17);if(s.phase==='ready')button('START',751,205,175,48,'start');text(s.message,500,403,15);text('A mistake replays this round. Earlier rounds stay complete.',500,438,12);
   }else if(kind==='timing'){
    const left=125,width=750;for(let k=0;k<6;k++)rect(376+k*43,98,30,16,k<s.hits?'#9ce4bd':'#274744');text(s.hits+' / 6 LOCKS',500,153,24);rect(left,193,width,64,'#112e36','#547d73');rect(left+(m.target()-.085)*width,195,.17*width,60,'#3b775d');rect(left+s.position*width-4,183,8,85,'#f4d59b');button(s.started?'LOCK':'START',382,302,236,58,'lock');text(s.message,500,395,16);text('Space / Enter or click LOCK. Misses never erase completed locks.',500,438,13);
   }else{
    rect(118,53,764,364,'#0c2630','#4d746b');for(const b of s.bricks)if(b.live)rect(b.x,b.y,100,23,['#a4d6bd','#bba7d9','#e4bd84'][Math.floor((b.y-85)/36)]);rect(s.paddle-64,373,128,12,'#a1e9c5');c.fillStyle='#f7d99a';c.beginPath();c.arc(s.x,s.y,7,0,Math.PI*2);c.fill();text('LIVES '+s.lives,55,110,12);text(s.bricks.filter(b=>!b.live).length+'/12',939,110,17);if(!s.launched&&!s.lost){text('SPACE / CLICK TO LAUNCH',500,294,19);text('Mouse or A/D / arrows move the paddle.',500,323,14);}text('Keep the ball above the paddle. Broken blocks stay cleared after a retry.',500,444,12);
   }
   if(s.lost){rect(297,176,406,143,'#10282af7','#9dccaf');text('TRY AGAIN',500,208,24);button('R / RETRY',360,242,280,51,'retry');}
   if(paused){rect(300,182,400,112,'#10282af7','#9dccaf');text('PAUSED',500,225,23);text('P or click to resume',500,261,15);}
  }
  function frame(now){if(!alive||!canvas.isConnected)return;const dt=last===null?0:Math.min(.035,(now-last)/1000);last=now;if(available()&&!paused){const axis=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));m.step(dt,axis);}draw();if(m.s.won&&!notified){notified=true;onWin();if(!alive)return;}raf=requestAnimationFrame(frame);}
  raf=requestAnimationFrame(frame);stop=()=>{alive=false;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',pointer);canvas.removeEventListener('pointermove',pointermove);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);keys.clear();};
 };
})();
