"use strict";
/* Career content, question pools and the per-game random variant.
   Codes exchanged with the Google Form never change; everything else is shuffled per mission. */

const SOURCES = [
 ['Skilled Trades Ontario','Micro Electronics Manufacturer (630A) trade information','https://www.skilledtradesontario.ca/trade-information/micro-electronics-manufacturer/'],
 ['Skilled Trades Ontario','Apprenticeship Programs Quick Facts Chart','https://www.skilledtradesontario.ca/wp-content/uploads/2026/08/Apprenticeship-Programs-Chart-EN.pdf'],
 ['Ontario Youth Apprenticeship Program','OYAP: start an apprenticeship in high school','https://oyap.ca/'],
 ['Ontario','Start an apprenticeship (Employment Ontario)','https://www.ontario.ca/page/start-apprenticeship'],
 ['ASML','How chips are manufactured','https://www.asml.com/en/company/stories/2021/semiconductor-manufacturing-process-steps'],
 ['Canadian Centre for Occupational Health and Safety','WHMIS overview','https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/general.html']
];

// Outbound codes go into the Form. Return codes are revealed by the Form.
const RETURN_CODES = ['GATE-2F8R','GATE-3M6T','GATE-4K9P','GATE-5D2W','GATE-6H7C','BATCH-SAVED'];

/* Rooms 1–4 are the factory floor (tech only). Rooms 5–6 are the training office (career only). */
const CAREER_ROOMS=[4,5];
const isCareer=i=>CAREER_ROOMS.includes(i);
const ROOMS = [
 {name:'Staff terminal',short:'CHIP BASICS',code:'NOVA-7K4M',verb:'Match the parts'},
 {name:'Cleanroom entrance',short:'SPOT THE HAZARDS',code:'NOVA-2R8T',verb:'Check the cleanroom'},
 {name:'Materials archive',short:'PUT IT IN ORDER',code:'NOVA-5W9C',verb:'Rebuild the steps'},
 {name:'Inspection station',short:'PASS OR FAIL',code:'NOVA-8H3P',verb:'Inspect the samples'},
 {name:'Training office',short:'CAREER · QUALIFICATIONS',code:'NOVA-4D7X',verb:'Complete the trade fact sheet'},
 {name:'Career planner',short:'CAREER · PATHWAY',code:'NOVA-6Y2B',verb:'Plan the route into the trade'}
];

/* The real-world route into the trade, in order. Used by Room 6, the career guide and the ending. */
const PATHWAY = [
 {id:'school',title:'Try the trade in high school',tag:'Co-op · OYAP · SHSM',
  text:'While still in high school, students can try the trade through <strong>co-op</strong>, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> or a <strong>Specialist High Skills Major</strong> in manufacturing.'},
 {id:'grade12',title:'Finish Grade 12',tag:'OSSD or equivalent',
  text:'The apprenticeship lists <strong>Grade 12</strong> (an Ontario Secondary School Diploma or equivalent) as its academic entry requirement. Math, science and technology courses are useful preparation.'},
 {id:'sponsor',title:'Find an employer sponsor',tag:'Get hired',
  text:'An apprenticeship is a job. It starts when an <strong>employer agrees to sponsor and train you</strong>.'},
 {id:'register',title:'Register the apprenticeship',tag:'Employment Ontario',
  text:'You and your sponsor <strong>register a training agreement through Employment Ontario</strong>. You receive a training standard (logbook) listing the skills to master.'},
 {id:'train',title:'Train on the job and in class',tag:'≈ 4,000 h + 304 h',
  text:'About <strong>4,000 hours of paid on-the-job training</strong> (around 2 years) plus <strong>304 hours of in-class technical training</strong> at an approved college or training provider. A supervisor signs off each skill.'},
 {id:'cert',title:'Earn the Certificate of Apprenticeship',tag:'Skilled Trades Ontario',
  text:'When all hours and skills are signed off, <strong>Skilled Trades Ontario</strong> issues a <strong>Certificate of Apprenticeship</strong>. The trade (code <strong>630A</strong>) is non-compulsory, with no Certificate of Qualification exam and no Red Seal.'}
];

/* ---------- Discovery pools ---------- */
// Career pools are tagged by room: 'qual' = Room 5 (qualifications), 'path' = Room 6 (pathway).
const MENTOR_POOL = [
 {t:'qual',q:'What education do I need to start?',a:'For the Ontario apprenticeship the academic entry requirement is <strong>Grade 12</strong>: an OSSD or equivalent. Math, science and tech courses make the first months much easier.'},
 {t:'qual',q:'What certificate do I get at the end?',a:'A <strong>Certificate of Apprenticeship</strong> from Skilled Trades Ontario. There is no Certificate of Qualification exam, and it is not a Red Seal trade.'},
 {t:'qual',q:'Do I need the certificate to work?',a:'No. Micro Electronics Manufacturer (trade code <strong>630A</strong>) is a <strong>non-compulsory</strong> trade. The certificate still proves your skills to employers.'},
 {t:'qual',q:'What safety training will I need?',a:'<strong>WHMIS</strong> training is required in Ontario if you work with hazardous products, and chip factories use plenty of chemicals. You also learn gowning and equipment safety on the job.'},
 {t:'qual',q:'What makes someone good at this job?',a:'Attention to detail, steady hands and patience. You need to follow written procedures exactly, use basic math for measurements and keep careful records.'},
 {t:'path',q:'Can I start while still in high school?',a:'Yes! Co-op, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> and a <strong>Specialist High Skills Major</strong> let you get experience before you graduate.'},
 {t:'path',q:'How do I actually become an apprentice?',a:'First, find an employer willing to <strong>sponsor and train you</strong>. Then you both register a training agreement through <strong>Employment Ontario</strong>.'},
 {t:'path',q:'How long does the apprenticeship take?',a:'Roughly <strong>two years</strong>: about 4,000 hours of paid on-the-job training plus <strong>304 hours</strong> of in-class training.'},
 {t:'path',q:'Where does the in-class training happen?',a:'At an approved <strong>college or training provider</strong>, split into levels. Everything else is learned on the job with your sponsor.'},
 {t:'path',q:'Are there other routes into chipmaking?',a:'Yes. Ontario colleges offer <strong>Electronics Engineering Technician</strong> (2-year) and <strong>Technologist</strong> (3-year) diplomas. Universities offer electrical, computer and nanotechnology engineering.'}
];

const QUIZ_POOL = [
 {t:'qual',s:'You need a university degree to start the Micro Electronics Manufacturer apprenticeship.',fact:false,why:'The academic entry requirement is Grade 12 (OSSD or equivalent).'},
 {t:'qual',s:'Micro Electronics Manufacturer is a non-compulsory trade in Ontario.',fact:true,why:'You can work without the certificate, but it proves your skills.'},
 {t:'qual',s:'Finishing the apprenticeship earns a Certificate of Apprenticeship.',fact:true,why:'Skilled Trades Ontario issues it once all hours and skills are complete.'},
 {t:'qual',s:'This trade ends with a Red Seal exam.',fact:false,why:'It is not a Red Seal trade and has no Certificate of Qualification exam.'},
 {t:'qual',s:'WHMIS training is only for chemists.',fact:false,why:'Any worker who may handle or be exposed to hazardous products needs WHMIS training.'},
 {t:'path',s:'Apprentices are paid while they train on the job.',fact:true,why:'An apprenticeship is a job: you earn while you learn from a sponsoring employer.'},
 {t:'path',s:'Most of this apprenticeship happens in a classroom.',fact:false,why:'About 4,000 hours are on the job. In-class training is 304 hours.'},
 {t:'path',s:'High school students can gain apprenticeship experience through OYAP.',fact:true,why:'The Ontario Youth Apprenticeship Program connects students with real trade placements.'},
 {t:'path',s:'An apprentice needs an employer sponsor.',fact:true,why:'The sponsor provides the on-the-job training and signs off your skills.'},
 {t:'path',s:'You register an apprenticeship by applying to a university.',fact:false,why:'You and your sponsor register a training agreement through Employment Ontario.'}
];

// Word decoder is a factory-floor mode, so it only uses technical terms.
const GLOSSARY = [
 ['WAFER','A thin, round slice of silicon that many chips are built on.'],
 ['SILICON','The element, found in sand, that most chips are made from.'],
 ['CLEANROOM','A room with filtered air that keeps dust away from chips.'],
 ['ETCHING','Removing material from a wafer to shape a circuit pattern.'],
 ['DICING','Cutting a finished wafer into individual chips.'],
 ['GOWNING','Putting on the cleanroom suit, hood, boots and gloves in order.'],
 ['SENSOR','A part that detects changes like light, heat or motion.'],
 ['TRANSISTOR','A tiny switch. Modern chips contain billions of them.'],
 ['PARTICLE','A speck of dust that can ruin a circuit pattern.'],
 ['INSPECTION','Checking a product carefully against its requirements.']
];

const SCOPE_DEFECTS = [
 ['Dust particle','A speck this small can block a circuit pattern.'],
 ['Scratch','Scratches can break the tiny wires on a chip.'],
 ['Residue spot','Leftover chemicals must be cleaned before the next step.'],
 ['Fingerprint oil','Skin oils are why wafers are never touched bare-handed.'],
 ['Edge chip','A chipped edge can crack the wafer during handling.']
];

const DISCOVERY = {
 maze:{name:'Service maze',icon:'⌗',how:'Drive the rover to each numbered terminal and press E.'},
 scene:{name:'Lab walkthrough',icon:'◎',how:'Click each numbered station in the lab to open its file.'},
 scope:{name:'Microscope scan',icon:'⊕',how:'Move the lens over the wafer. Click the 3 hidden defects.'},
 decode:{name:'Word decoder',icon:'⇄',how:'Unscramble 3 chipmaking terms to unlock the files.'},
 mentor:{name:'Ask a mentor',icon:'✉',how:'Ask the training advisor 3 questions. Each answer unlocks a file.'},
 quiz:{name:'Myth or fact',icon:'?',how:'Call each statement Myth or Fact. Every correct call unlocks a file.'}
};
const TECH_MODES=['maze','scene','scope','decode'],CAREER_MODES=['mentor','quiz'];
const CHALLENGES = ['shooter','stacker','dodge','memory','timing','breaker'];

/* ---------- Puzzle pools ---------- */
const PARTS = {
 cpu:{name:'Processor (CPU)',job:'Follows instructions and does calculations',card:'A <strong>processor (CPU)</strong> follows instructions and performs calculations. It is the part that carries out a device’s tasks.'},
 memory:{name:'Memory',job:'Stores the data a device is using',card:'<strong>Memory</strong> stores data. A computer needs somewhere to hold the information it is working with.'},
 sensor:{name:'Sensor',job:'Detects changes like light or temperature',card:'A <strong>sensor</strong> detects a change, such as light or temperature. A phone uses a light sensor to adjust its screen brightness.'},
 led:{name:'LED',job:'Gives off light when current flows',card:'An <strong>LED</strong> (light-emitting diode) gives off light when electric current flows through it.'},
 transistor:{name:'Transistor',job:'Acts as a tiny on/off switch',card:'A <strong>transistor</strong> acts as a tiny switch. Modern chips contain billions of them.'},
 radio:{name:'Wireless chip',job:'Sends and receives radio signals',card:'A <strong>wireless chip</strong> sends and receives radio signals for Wi-Fi or Bluetooth.'}
};
const PART_EXTRAS = [
 'Parts like this are built on a thin slice of silicon called a <strong>wafer</strong>.',
 'Their circuits are so small that a single <strong>dust particle</strong> can ruin one.',
 'Every finished part is <strong>tested</strong> before it leaves the factory.'
];
const HAZARDS = {
 drink:{unsafe:true,title:'Open drink',caption:'Coffee beside the work surface'},
 hair:{unsafe:true,title:'Uncovered hair',caption:'Hair outside the hood'},
 cardboard:{unsafe:true,title:'Cardboard box',caption:'Ordinary cardboard by a wafer'},
 hand:{unsafe:true,title:'Bare hand',caption:'Bare fingers touching a wafer'},
 snack:{unsafe:true,title:'Snack on bench',caption:'Granola bar next to the tool'},
 pencil:{unsafe:true,title:'Pencil & notebook',caption:'Wood pencil, paper notebook'},
 mask:{unsafe:true,title:'Mask below nose',caption:'Face mask pulled down'},
 carrier:{unsafe:false,title:'Closed clean carrier',caption:'Approved container, closed'},
 gown:{unsafe:false,title:'Covered worker',caption:'Hair covered, clean gloves'},
 tweezers:{unsafe:false,title:'Wafer tweezers',caption:'Gloved hand, proper tool'},
 cleanpaper:{unsafe:false,title:'Cleanroom paper',caption:'Lint-free paper, approved pen'}
};
const STAGES = [
 {id:'prepare',label:'Prepare the wafer'},
 {id:'build',label:'Build the circuit layers'},
 {id:'test',label:'Test each chip on the wafer'},
 {id:'dice',label:'Cut (dice) the wafer into chips'},
 {id:'package',label:'Package the chips'}
];
/* Room 5 fact sheet: three of these fields are asked each game. */
const FACT_FIELDS = {
 entry:{label:'Academic entry requirement',answer:'a',options:{a:'Grade 12 (OSSD or equivalent)',b:'A university degree',c:'Grade 10',d:'A college diploma'}},
 credential:{label:'Credential earned at the end',answer:'a',options:{a:'Certificate of Apprenticeship',b:'Red Seal endorsement',c:'Certificate of Qualification',d:'Bachelor’s degree'}},
 type:{label:'Is the certificate required to work?',answer:'a',options:{a:'No: non-compulsory trade',b:'Yes: compulsory trade'}},
 safety:{label:'Training needed to handle hazardous products',answer:'a',options:{a:'WHMIS',b:'A driver’s licence',c:'None',d:'Lifeguard certificate'}},
 code:{label:'Ontario trade code',answer:'a',options:{a:'630A',b:'309A',c:'442A',d:'310S'}},
 hours:{label:'In-class technical training',answer:'a',options:{a:'304 hours',b:'40 hours',c:'2,000 hours',d:'4 years'}}
};

/* ---------- Storyline ---------- */
const CAST={
 sam:{name:'Sam Okoro',role:'Night-shift supervisor'},
 mira:{name:'Mira Tran',role:'Apprenticeship training advisor'},
 nova:{name:'NOVA',role:'Factory control system'}
};
// One beat plays the first time each scene opens. {name} becomes the player's name.
const STORY={
 r0:[['nova','⚠ POWER SURGE DETECTED. Security guardians restarted in lockdown mode. All doors sealed. Batch NB-7 is stranded on the factory floor.'],
     ['sam','{name}! Perfect timing for your first shift. NB-7 is a batch of sensor chips for hospital heart monitors, and the truck leaves at dawn.'],
     ['sam','The surge scrambled every room. Get past each glitching guardian, recover the files the day crew left, then solve the door puzzle. I’ll be on the radio.'],
     ['sam','Every door also needs a code swapped with the Google Form, so keep it open in another tab. First stop: the staff terminal. Learn what’s inside NB-7.']],
 r1:[['sam','NB-7 is inside the cleanroom. Before we go in, check the camera feed.'],['sam','One speck of dust, a hair or a fingerprint can ruin a whole wafer. Anything that breaks the rules gets flagged.']],
 r2:[['nova','PROCESS CHART CORRUPTED. Stage order: UNKNOWN.'],['sam','The night crew kept notes in the materials archive. Rebuild the chart so the line knows what comes after what.']],
 r3:[['sam','Last stop on the floor: inspection. The equipment tubes have to meet spec before NB-7 can move.'],['sam','Measure every sample. No guessing. A part that’s “almost right” is still wrong.']],
 r4:[['sam','NB-7 is cleared and loaded. Seriously, nice work tonight. You’re a natural.'],['sam','Nova sponsors apprentices. If you want to do this for real, head to the training office and see Mira.'],['mira','Hi {name}! The surge locked my door too, so beat the guardian first. Then let’s find out what this trade actually requires.']],
 r5:[['mira','Fact sheet done! Now the important part: your route.'],['mira','Let’s map every step, from high school all the way to the certificate.']],
 final:[['nova','CORE OVERRIDE ACTIVE. Dispatch dock release: DENIED.'],['sam','The truck can’t leave until the core is cleared. Break all three seals, {name}. This is it!']],
 ending:[['sam','Dock open, truck rolling. Those heart monitors will get their chips on time, because of you.'],['mira','And you’ve mapped your own route into the trade. Whenever you’re ready, Sam’s sponsorship offer stands.'],['nova','ALL SYSTEMS NOMINAL. Welcome to Nova, {name}.']]
};

/* ---------- Random helpers ---------- */
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pickN=(a,n)=>shuffle(a).slice(0,n);
function scramble(word){if(word.length<2)return word;let s=word;for(let n=0;n<20&&s===word;n++)s=shuffle(word.split('')).join('');return s;}

/* Everything that differs between playthroughs. Stored in the save so a reload keeps the same mission. */
function makeVariant(){
 const v={};
 v.challenges=shuffle(CHALLENGES);
 v.discover=shuffle(TECH_MODES).concat(shuffle(CAREER_MODES));
 v.mazeSeed=rint(1,1e9);
 const tagged=(pool,t)=>pool.map((x,i)=>x.t===t?i:-1).filter(i=>i>=0);
 v.mentor={4:shuffle(tagged(MENTOR_POOL,'qual')),5:shuffle(tagged(MENTOR_POOL,'path'))};
 v.quiz={4:shuffle(tagged(QUIZ_POOL,'qual')),5:shuffle(tagged(QUIZ_POOL,'path'))};
 v.glossary=pickN(GLOSSARY.map((_,i)=>i),3).map(i=>({i,mix:scramble(GLOSSARY[i][0])}));
 v.scope=pickN(SCOPE_DEFECTS.map((_,i)=>i),3).map(d=>({d,x:0,y:0}));
 // Spread the defects so the lens never shows two at once.
 const spots=shuffle([[12,22],[38,18],[66,24],[86,30],[20,70],[48,58],[74,72],[34,40],[60,44]]).slice(0,3);
 v.scope.forEach((s,k)=>{s.x=spots[k][0]+rint(-3,3);s.y=spots[k][1]+rint(-3,3);});
 // Room 1 – parts
 v.parts=pickN(Object.keys(PARTS),3);
 v.jobs=shuffle(shuffle(Object.keys(PARTS)).filter(p=>!v.parts.includes(p)).slice(0,1).concat(v.parts));
 // Room 2 – hazards
 const unsafe=Object.keys(HAZARDS).filter(k=>HAZARDS[k].unsafe),safe=Object.keys(HAZARDS).filter(k=>!HAZARDS[k].unsafe),n=rint(3,4);
 v.hazards=shuffle(pickN(unsafe,n).concat(pickN(safe,6-n)));
 // Room 3 – process
 v.stages=Math.random()<.5?STAGES.map(s=>s.id):STAGES.map(s=>s.id).filter((_,i)=>i!==rint(1,3));
 v.stageOrder=shuffle(v.stages);
 // Room 4 – samples
 v.size=rint(4,6);
 do{v.samples=['A','B','C'].map(id=>({id,size:v.size+[0,0,1,-1,2][rint(0,4)],crack:Math.random()<.35}));}
 while(!v.samples.some(s=>s.size===v.size&&!s.crack)||v.samples.every(s=>s.size===v.size&&!s.crack));
 // Room 5 – trade fact sheet
 v.facts=pickN(Object.keys(FACT_FIELDS),3).map(f=>({f,order:shuffle(Object.keys(FACT_FIELDS[f].options))}));
 // Room 6 – pathway order (4 or 5 of the 6 steps, kept in real order)
 const drop=pickN(PATHWAY.map((_,i)=>i),rint(1,2));
 v.path=PATHWAY.map(p=>p.id).filter((_,i)=>!drop.includes(i));
 v.pathOrder=shuffle(v.path);
 return v;
}

/* Clue cards, question, hint and reward for one room, built from the variant. */
function roomContent(i,v){
 if(i===0)return {
  intro:'Welcome to the Nova chip factory. Learn about three parts made here, then match each to its job.',
  question:'Match each part to its job. One job does not belong to any of them.',
  evidence:v.parts.map((p,k)=>({title:PARTS[p].name,text:`<p>${PARTS[p].card}</p><p>${PART_EXTRAS[k]}</p>`})),
  hint:v.parts.map(p=>`${PARTS[p].name} → ${PARTS[p].job.toLowerCase()}`).join('. ')+'.',
  reward:'Access cleared. You matched the three parts to their jobs.'};
 if(i===1){const bad=v.hazards.filter(h=>HAZARDS[h].unsafe);return {
  intro:'Tiny chips can be ruined by a single speck of dust. Learn the cleanroom rules before opening the door.',
  question:`Select every unsafe situation on the camera feed (there are ${bad.length}). Leave the safe ones unselected.`,
  evidence:[
   {title:'Keep it clean',text:'<p>Dust, hair, skin flakes and food crumbs can damage tiny circuits.</p><p><strong>No food or drinks</strong> are allowed inside. <strong>All hair stays covered</strong> by the hood, and the <strong>face mask covers nose and mouth</strong>.</p>'+FIG.gown()},
   {title:'Handle with care',text:'<p><strong>Never touch a wafer with bare hands.</strong> Skin leaves oils and particles.</p><p>A <strong>gloved hand using wafer tweezers</strong> is correct. So is a <strong>fully gowned worker</strong> with hair covered and clean gloves.</p>'},
   {title:'Approved materials only',text:'<p><strong>Cardboard, ordinary paper notebooks and wood pencils</strong> shed particles, so they stay outside.</p><p>Use <strong>lint-free cleanroom paper with an approved pen</strong>. Move wafers in a <strong>closed, approved clean carrier</strong>.</p>'}
  ],
  hint:'Unsafe here: '+bad.map(h=>HAZARDS[h].title.toLowerCase()).join(', ')+'.',
  reward:'Cleanroom cleared. Clean habits protect every chip in the batch.'};}
 if(i===2){const labels=v.stages.map(id=>STAGES.find(s=>s.id===id).label);return {
  intro:'The factory’s process chart is mixed up. Read the notes and put the stages back in order.',
  question:`Click the ${v.stages.length} cards in manufacturing order. Use Undo if you change your mind.`,
  evidence:[
   {title:'Start with a wafer',text:'<p>A <strong>wafer</strong> is a thin slice of silicon. Hundreds of chips can be made on one wafer.</p><p><strong>Prepare the wafer first.</strong> The surface must be perfectly clean and flat before anything is built on it.</p>'+FIG.wafer()},
   {title:'Build, then test',text:'<p>Next, <strong>build the circuit layers</strong> through steps like spin coating, photo aligning, developing and etching, repeated many times.</p><p>Then <strong>test each chip while it is still on the wafer</strong> to find the ones that work.</p>'},
   {title:'Cut, then package',text:'<p>After testing, the wafer is <strong>cut (diced) into individual chips</strong>.</p><p><strong>Packaging comes last.</strong> It protects the chip and connects it to a device. Operators monitor equipment at every stage.</p>'+FIG.dice()}
  ],
  hint:labels.join(' → ')+'.',
  reward:'Process restored. Every stage depends on the one before it.'};}
 if(i===3){const L=v.size,pass=s=>s.size===L&&!s.crack;return {
  intro:'Inspect three sample tubes used in factory equipment. Compare every measurement with the requirement.',
  question:'Mark each sample Pass or Fail. A sample must meet BOTH rules.',
  evidence:[
   {title:'The two rules',text:`<p>A sample passes only if it has:</p><ul><li><strong>No cracks</strong>, and</li><li>exactly the correct size: <strong>${L} cm</strong>.</li></ul><p>These are simplified training rules for this game.</p>${FIG.tube(L)}`},
   {title:'Sample report',text:`<div class="mini-table">${v.samples.map(s=>`<div><b>Sample ${s.id}</b><span>${s.size} cm · ${s.crack?'has a crack':'no cracks'}</span></div>`).join('')}</div><p>Check size and cracks separately. One failed rule means the sample fails.</p>`},
   {title:'Why inspect?',text:'<p>Parts are <strong>measured and checked for defects</strong> before they go into factory equipment, and every result is recorded.</p><p>A part that is “almost right” still fails if it does not meet the requirement.</p>'}
  ],
  hint:v.samples.map(s=>`${s.id}: ${pass(s)?'pass':'fail'}${pass(s)?'':s.crack?' (crack)':' ('+s.size+' cm)'}`).join(' · '),
  reward:`Inspection complete. Only samples at exactly ${L} cm with no cracks passed.`};}
 if(i===4){const label=f=>FACT_FIELDS[f].label,ans=f=>FACT_FIELDS[f].options[FACT_FIELDS[f].answer];return {
  intro:'Batch NB-7 is out. Now: what does this job require in Ontario?',
  question:'Fill in the trade fact sheet for a Micro Electronics Manufacturer in Ontario.',
  evidence:[
   {title:'Getting in',text:'<p>The Ontario apprenticeship for a <strong>Micro Electronics Manufacturer</strong> lists <strong>Grade 12</strong> (an OSSD or equivalent) as its academic entry requirement.</p><p>No university degree or college diploma is required to start. Math, science and technology courses are useful preparation.</p>'},
   {title:'About the trade',text:'<p>The Ontario trade code is <strong>630A</strong>. It is a <strong>non-compulsory</strong> trade: the certificate is not legally required to work, but it proves your skills.</p><p>Finishing the apprenticeship earns a <strong>Certificate of Apprenticeship</strong> from Skilled Trades Ontario. There is no Certificate of Qualification exam and no Red Seal.</p>'+FIG.certificate()},
   {title:'Training and safety',text:'<p>The apprenticeship takes about 2 years: roughly <strong>4,000 hours on the job</strong> plus <strong>304 hours of in-class technical training</strong>.</p><p>Anyone who works with hazardous products must complete <strong>WHMIS</strong> safety training.</p>'+FIG.hours()}
  ],
  hint:v.facts.map(({f})=>`${label(f)}: ${ans(f)}`).join(' · '),
  reward:'Fact sheet complete. You know what the trade requires.'};}
 const label=id=>PATHWAY.find(p=>p.id===id).title;return {
  intro:'Map your own route into the trade, from high school all the way to the certificate.',
  question:`Click the ${v.path.length} steps in the order you would complete them.`,
  evidence:[
   {title:'In high school',text:'<p>Start early. While still in high school, try the trade through <strong>co-op, OYAP or a Specialist High Skills Major</strong>.</p><p>Then <strong>finish Grade 12</strong> (OSSD or equivalent), the entry requirement for the apprenticeship.</p>'},
   {title:'Getting hired',text:'<p>An apprenticeship is a job, so first <strong>find an employer willing to sponsor you</strong>.</p><p>Once you have a sponsor, you both <strong>register a training agreement through Employment Ontario</strong>.</p>'},
   {title:'Training and certificate',text:'<p>After registering, you <strong>train on the job and in class</strong>: about 4,000 hours plus 304 hours.</p><p>The final step: once every skill is signed off, Skilled Trades Ontario issues your <strong>Certificate of Apprenticeship</strong>.</p>'}
  ],
  hint:v.path.map(label).join(' → ')+'.',
  reward:'Route planned. You have mapped every step from high school to certified Micro Electronics Manufacturer.'};
}
