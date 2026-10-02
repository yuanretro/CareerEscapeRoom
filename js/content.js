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

const ROOMS = [
 {name:'Staff terminal',short:'CHIP BASICS',code:'NOVA-7K4M',verb:'Match the parts'},
 {name:'Cleanroom entrance',short:'SPOT THE HAZARDS',code:'NOVA-2R8T',verb:'Check the cleanroom'},
 {name:'Materials archive',short:'PUT IT IN ORDER',code:'NOVA-5W9C',verb:'Rebuild the steps'},
 {name:'Inspection station',short:'PASS OR FAIL',code:'NOVA-8H3P',verb:'Inspect the samples'},
 {name:'Project records',short:'RECORD THE RESULTS',code:'NOVA-4D7X',verb:'Complete the test report'},
 {name:'Dispatch terminal',short:'TRACK THE BATCH',code:'NOVA-6Y2B',verb:'Match the batch record'}
];

/* The real-world pathway. One step is unlocked per room and the full roadmap is shown at the end. */
const PATHWAY = [
 {title:'Finish high school',tag:'Grade 12 / OSSD',
  text:'The Ontario apprenticeship lists <strong>Grade 12</strong> (an Ontario Secondary School Diploma or equivalent) as its academic entry requirement. Math, physics or chemistry, and technology courses such as Computer Engineering (TEJ) are useful preparation.'},
 {title:'Get early experience',tag:'Co-op · OYAP · SHSM',
  text:'High school students can try the trade through <strong>co-op</strong>, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> or a <strong>Specialist High Skills Major</strong> in manufacturing. These count as real workplace experience.'},
 {title:'Find a sponsor and register',tag:'Employment Ontario',
  text:'An apprenticeship starts when an <strong>employer agrees to sponsor and train you</strong>. Together you register a training agreement through <strong>Employment Ontario</strong>. You then get a training standard (logbook) that lists the skills to master.'},
 {title:'Learn on the job',tag:'≈ 4,000 hours',
  text:'Most of the training is <strong>paid, on-the-job learning</strong>: about 4,000 hours (around 2 years). You set up and monitor process equipment and follow cleanroom procedures. Tasks include spin coating, photo aligning, etching, dicing, testing and inspecting. A supervisor signs off each skill.'},
 {title:'Complete in-class training',tag:'304 hours',
  text:'Apprentices also complete <strong>304 hours of in-class technical training</strong>, split into levels at an approved college or training provider. Safety training such as <strong>WHMIS</strong> is required for anyone working with hazardous products.'},
 {title:'Earn your certificate',tag:'Certificate of Apprenticeship',
  text:'When all hours and skills are signed off, <strong>Skilled Trades Ontario</strong> issues a <strong>Certificate of Apprenticeship</strong>. It is a <strong>non-compulsory</strong> trade (code <strong>630A</strong>), so there is no Certificate of Qualification exam and it is not a Red Seal trade. You can keep growing through college diplomas (Electronics Engineering Technician or Technologist) or university engineering.'}
];

/* ---------- Discovery pools (replace the maze in most rooms) ---------- */
const MENTOR_POOL = [
 {q:'What does your job actually involve?',a:'I set up, run and monitor process equipment that builds microchips. Some machines are manual and some are automatic. Day to day I do spin coating, photo aligning, developing, etching, sputtering, dicing, baking, testing and inspecting.'},
 {q:'What education do I need to start?',a:'For the Ontario apprenticeship the academic entry requirement is <strong>Grade 12</strong>, which means an OSSD or equivalent. Math, science and tech courses make the first months much easier.'},
 {q:'How long is the apprenticeship?',a:'Roughly <strong>two years</strong>. That is about 4,000 hours of paid on-the-job training plus <strong>304 hours</strong> of in-class technical training.'},
 {q:'How do I actually become an apprentice?',a:'First, find an employer willing to <strong>sponsor and train you</strong>. Then you register a training agreement through <strong>Employment Ontario</strong>. As you learn, your skills get signed off in a training standard (logbook).'},
 {q:'What certificate do I get at the end?',a:'A <strong>Certificate of Apprenticeship</strong> from Skilled Trades Ontario. The trade is non-compulsory, so there is no Certificate of Qualification exam, and it is not a Red Seal trade.'},
 {q:'Can I start while still in high school?',a:'Yes! Co-op, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> and a <strong>Specialist High Skills Major</strong> let you earn experience before you graduate.'},
 {q:'What safety training will I need?',a:'Ontario workplaces require <strong>WHMIS</strong> training if you work with hazardous products, and chip fabs use plenty of chemicals. You also learn cleanroom gowning and equipment safety on the job.'},
 {q:'What makes someone good at this?',a:'Attention to detail, steady hands, patience, and following written procedures exactly. You also need basic math for measurements and careful record-keeping. One skipped step can ruin a whole batch.'},
 {q:'Are there other routes into chipmaking?',a:'Yes. Ontario colleges offer <strong>Electronics Engineering Technician</strong> (2-year) and <strong>Technologist</strong> (3-year) diplomas. Universities offer electrical, computer and nanotechnology engineering.'}
];

const QUIZ_POOL = [
 {s:'You need a university degree to start the Micro Electronics Manufacturer apprenticeship.',fact:false,why:'The academic entry requirement is Grade 12 (OSSD or equivalent).'},
 {s:'Apprentices are paid while they train on the job.',fact:true,why:'An apprenticeship is a job: you earn while you learn from a sponsoring employer.'},
 {s:'Most of this apprenticeship happens in a classroom.',fact:false,why:'About 4,000 hours are on the job. In-class training is 304 hours.'},
 {s:'Micro Electronics Manufacturer is a non-compulsory trade in Ontario.',fact:true,why:'You can work in the field without the certificate, but the certificate proves your skills.'},
 {s:'Finishing the apprenticeship earns a Certificate of Apprenticeship.',fact:true,why:'Skilled Trades Ontario issues it once all hours and skills are complete.'},
 {s:'This trade ends with a Red Seal exam.',fact:false,why:'It is not a Red Seal trade and has no Certificate of Qualification exam.'},
 {s:'Cleanroom workers may wear regular clothes if they were freshly washed.',fact:false,why:'Workers wear gowns, hoods, boots and gloves. Normal fabric sheds particles.'},
 {s:'High school students can gain apprenticeship experience through OYAP.',fact:true,why:'The Ontario Youth Apprenticeship Program connects students with real trade placements.'},
 {s:'One silicon wafer can hold hundreds of chips.',fact:true,why:'Many identical chips are built side by side, then cut apart (diced).'},
 {s:'WHMIS training is only for chemists.',fact:false,why:'Any worker who may handle or be exposed to hazardous products needs WHMIS training.'},
 {s:'An apprentice needs an employer sponsor.',fact:true,why:'The sponsor provides the on-the-job training and signs off your skills.'}
];

const GLOSSARY = [
 ['WAFER','A thin, round slice of silicon that many chips are built on.'],
 ['SILICON','The element, found in sand, that most chips are made from.'],
 ['CLEANROOM','A room with filtered air that keeps dust away from chips.'],
 ['ETCHING','Removing material from a wafer to shape a circuit pattern.'],
 ['DICING','Cutting a finished wafer into individual chips.'],
 ['GOWNING','Putting on the cleanroom suit, hood, boots and gloves in order.'],
 ['APPRENTICE','A worker who learns a trade on the job while being paid.'],
 ['WHMIS','Canada’s system for labelling and safely handling hazardous products.'],
 ['SENSOR','A part that detects changes like light, heat or motion.'],
 ['LOGBOOK','The record where an apprentice’s completed skills are signed off.'],
 ['SPONSOR','The employer who agrees to train an apprentice.'],
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
 mentor:{name:'Ask a mentor',icon:'✉',how:'Ask the senior technician 3 questions. Each answer unlocks a file.'},
 quiz:{name:'Myth or fact',icon:'?',how:'Call each statement Myth or Fact. Every correct call unlocks a file.'},
 decode:{name:'Word decoder',icon:'⇄',how:'Unscramble 3 chipmaking terms to unlock the files.'}
};
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
 'A <strong>Micro Electronics Manufacturer</strong> (Ontario trade code <strong>630A</strong>) sets up, operates and monitors the equipment that makes tiny parts like this.',
 'In Ontario this is an <strong>apprenticeship</strong> trade: you train mostly on the job and are paid while you learn.',
 'Workers in this trade also <strong>inspect products, record results</strong> and follow cleanroom procedures.'
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
const DEFECTS = {cracked:'Their cases were cracked',bent:'Their pins were bent',scratched:'Their surfaces were scratched',untested:'They had not been tested'};

/* ---------- Random helpers ---------- */
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pickN=(a,n)=>shuffle(a).slice(0,n);
function scramble(word){if(word.length<2)return word;let s=word;for(let n=0;n<20&&s===word;n++)s=shuffle(word.split('')).join('');return s;}

/* Everything that differs between playthroughs. Stored in the save so a reload keeps the same mission. */
function makeVariant(){
 const v={};
 v.challenges=shuffle(CHALLENGES);
 v.discover=shuffle(Object.keys(DISCOVERY));
 v.mazeSeed=rint(1,1e9);
 v.mentor=pickN(MENTOR_POOL.map((_,i)=>i),5);
 v.quiz=shuffle(QUIZ_POOL.map((_,i)=>i));
 v.glossary=pickN(GLOSSARY.map((_,i)=>i),3).map(i=>({i,mix:scramble(GLOSSARY[i][0])}));
 v.scope=pickN(SCOPE_DEFECTS.map((_,i)=>i),3).map(d=>({d,x:0,y:0}));
 // Spread the defects so the lens never shows two at once.
 const spots=shuffle([[12,22],[38,18],[66,24],[86,30],[20,70],[48,58],[74,72],[34,40],[60,44]]).slice(0,3);
 v.scope.forEach((s,k)=>{s.x=spots[k][0]+rint(-3,3);s.y=spots[k][1]+rint(-3,3);});
 // Room 1 – parts
 v.parts=pickN(Object.keys(PARTS),3);
 v.jobs=shuffle(Object.keys(PARTS)).filter(p=>!v.parts.includes(p)).slice(0,1).concat(v.parts);
 v.jobs=shuffle(v.jobs);
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
 // Room 5 – test report
 v.tested=rint(6,12)*10;v.failed=rint(2,Math.floor(v.tested/20))*5;v.passed=v.tested-v.failed;
 v.defect=pickN(['cracked','bent','scratched'],1)[0];
 // Room 6 – batches
 const ids=pickN([302,304,306,311,318,325,327,333,340,348],3);
 v.batches={fail:'B-'+ids[0],pass:'B-'+ids[1],wait:'B-'+ids[2]};
 v.batchOrder=shuffle(['fail','pass','wait']);v.stationOrder=shuffle(['office','pack','hold']);v.defectOrder=shuffle(Object.keys(DEFECTS));v.packStation=rint(3,8);v.holdStation=pickN([1,2,9].filter(n=>n!==v.packStation),1)[0];
 return v;
}

/* Clue cards, question, hint and reward for one room, built from the variant. */
function roomContent(i,v){
 if(i===0)return {
  intro:'You are training as a Micro Electronics Manufacturer. Learn about three parts made in the factory, then match each to its job.',
  question:'Match each part to its job. One job does not belong to any of them.',
  evidence:v.parts.map((p,k)=>({title:PARTS[p].name,text:`<p>${PARTS[p].card}</p><p>${PART_EXTRAS[k]}</p>`})),
  hint:v.parts.map(p=>`${PARTS[p].name} → ${PARTS[p].job.toLowerCase()}`).join('. ')+'.',
  reward:'Access cleared. You matched the three parts to their jobs.'};
 if(i===1){const bad=v.hazards.filter(h=>HAZARDS[h].unsafe);return {
  intro:'Tiny chips can be ruined by a single speck of dust. Learn the cleanroom rules before opening the door.',
  question:`Select every unsafe situation on the camera feed (there are ${bad.length}). Leave the safe ones unselected.`,
  evidence:[
   {title:'Keep it clean',text:'<p>Dust, hair, skin flakes and food crumbs can damage tiny circuits.</p><p><strong>No food or drinks</strong> are allowed inside. <strong>All hair stays covered</strong> by the hood, and the <strong>face mask covers nose and mouth</strong>.</p>'},
   {title:'Handle with care',text:'<p><strong>Never touch a wafer with bare hands.</strong> Skin leaves oils and particles.</p><p>A <strong>gloved hand using wafer tweezers</strong> is correct. So is a <strong>fully gowned worker</strong> with hair covered and clean gloves.</p>'},
   {title:'Approved materials only',text:'<p><strong>Cardboard, ordinary paper notebooks and wood pencils</strong> shed particles, so they stay outside.</p><p>Use <strong>lint-free cleanroom paper with an approved pen</strong>. Move wafers in a <strong>closed, approved clean carrier</strong>.</p>'}
  ],
  hint:'Unsafe here: '+bad.map(h=>HAZARDS[h].title.toLowerCase()).join(', ')+'.',
  reward:'Cleanroom cleared. Clean habits protect every chip in the batch.'};}
 if(i===2){const labels=v.stages.map(id=>STAGES.find(s=>s.id===id).label);return {
  intro:'The factory’s process chart is mixed up. Read the notes and put the stages back in order.',
  question:`Click the ${v.stages.length} cards in manufacturing order. Use Undo if you change your mind.`,
  evidence:[
   {title:'Start with a wafer',text:'<p>A <strong>wafer</strong> is a thin slice of silicon. Hundreds of chips can be made on one wafer.</p><p><strong>Prepare the wafer first.</strong> The surface must be perfectly clean and flat before anything is built on it.</p>'},
   {title:'Build, then test',text:'<p>Next, <strong>build the circuit layers</strong> through steps like spin coating, photo aligning, developing and etching, repeated many times.</p><p>Then <strong>test each chip while it is still on the wafer</strong> to find the ones that work.</p>'},
   {title:'Cut, then package',text:'<p>After testing, the wafer is <strong>cut (diced) into individual chips</strong>.</p><p><strong>Packaging comes last.</strong> It protects the chip and connects it to a device. Operators monitor equipment at every stage.</p>'}
  ],
  hint:labels.join(' → ')+'.',
  reward:'Process restored. Every stage depends on the one before it.'};}
 if(i===3){const L=v.size,pass=s=>s.size===L&&!s.crack;return {
  intro:'Inspect three sample tubes used in factory equipment. Compare every measurement with the requirement.',
  question:'Mark each sample Pass or Fail. A sample must meet BOTH rules.',
  evidence:[
   {title:'The two rules',text:`<p>A sample passes only if it has:</p><ul><li><strong>No cracks</strong>, and</li><li>exactly the correct size: <strong>${L} cm</strong>.</li></ul><p>These are simplified training rules for this game.</p>`},
   {title:'Sample report',text:`<div class="mini-table">${v.samples.map(s=>`<div><b>Sample ${s.id}</b><span>${s.size} cm · ${s.crack?'has a crack':'no cracks'}</span></div>`).join('')}</div><p>Check size and cracks separately. One failed rule means the sample fails.</p>`},
   {title:'Why inspect?',text:'<p>A Micro Electronics Manufacturer <strong>measures parts, checks for defects and records results</strong>. It is listed among the core tasks of the trade.</p><p>A part that is “almost right” still fails if it does not meet the requirement.</p>'}
  ],
  hint:v.samples.map(s=>`${s.id}: ${pass(s)?'pass':'fail'}${pass(s)?'':s.crack?' (crack)':' ('+s.size+' cm)'}`).join(' · '),
  reward:`Inspection complete. Only samples at exactly ${L} cm with no cracks passed.`};}
 if(i===4)return {
  intro:'The last batch of chips has been tested. Record the defect and count how many chips passed.',
  question:`Why did ${v.failed} chips fail? How many of the ${v.tested} chips passed?`,
  evidence:[
   {title:'Test report',text:`<p>The lab tested <strong>${v.tested} chips</strong>. Exactly <strong>${v.failed} failed</strong>. The other chips passed every check.</p><p>All counts in this training report are fictional.</p>`},
   {title:'Defect record',text:`<p>Inspector note: “${DEFECTS[v.defect]}.” Record the actual defect, and keep the failed chips clearly marked and separate from passing ones.</p><p>Identifying defects and recording test results are part of the trade.</p>`},
   {title:'Results summary',text:`<p><strong>Passed = total tested − failed.</strong></p><p>Record both counts so the next worker knows which products passed inspection.</p>`}
  ],
  hint:`${DEFECTS[v.defect]}. ${v.tested} − ${v.failed} = ${v.passed}.`,
  reward:`Report complete: ${v.tested} tested, ${v.failed} failed, ${v.passed} passed.`};
 const b=v.batches;return {
  intro:'Use the product tracking log to find the passing chips from Room 5 and send them to the right station.',
  question:`Which batch contains the ${v.passed} passing chips? Where does it go next?`,
  evidence:[
   {title:'Batch tracking log',text:`<div class="mini-table">${v.batchOrder.map(k=>({fail:[b.fail,`${v.failed} failed chips · hold`],pass:[b.pass,`${v.passed} passing chips · ready`],wait:[b.wait,'Not yet tested · wait']})[k]).map(([id,t])=>`<div><b>${id}</b><span>${t}</span></div>`).join('')}</div><p>A batch ID is a label that helps workers track a group of products.</p>`},
   {title:'Work order',text:`<p>Ready batches go to <strong>Packaging, Station ${v.packStation}</strong>.</p><p>Failed batches go to <strong>Hold area, Station ${v.holdStation}</strong>. The office only handles paperwork.</p>`},
   {title:'Final checklist',text:'<p>Match the <strong>batch ID, test result and next station</strong> before moving anything.</p><p>Keeping product tracking records is part of the role. It stops tested, failed and untested products from getting mixed up.</p>'}
  ],
  hint:`${v.passed} passing chips → ${b.pass} → Packaging, Station ${v.packStation}.`,
  reward:`Batch ${b.pass}: ${v.passed} passing chips, ready for Packaging, Station ${v.packStation}.`};
}
