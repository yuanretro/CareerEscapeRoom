"use strict";
/* Game content: rooms, hands-on steps, story and career facts.
   Rooms 1–4 are the factory floor (tech only). Rooms 5–6 are the training office (career only).
   Form codes never change; task details are randomized per mission. */

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
const CAREER_ROOMS=[4,5];

/* Each room is a short run of hands-on steps. `sop` is the procedure card beside the bench;
   `note` is what gets written into the field notebook when the step is done. */
const ROOMS = [
 {name:'Gowning room',short:'CLEANROOM ENTRY',code:'NOVA-7K4M',steps:[
  {task:'gown',title:'Gown up',
   sop:'<p>People are the biggest source of dirt in a cleanroom: skin flakes, hair and clothing fibres.</p><ol><li><b>Lock away personal items</b> first. Watches and phones can’t be cleaned.</li><li>Dress <b>from the top down</b>: hair, head, face, body, feet.</li><li><b>Gloves go on last</b>, so they touch nothing dirty.</li></ol><p class="tip">Click items on the worker to remove them. Then click garments on the rack.</p>',
   note:'Gowning goes top-down (hair net, hood, mask, coverall, boots) with gloves last. Personal items stay in the locker.'},
  {task:'airshower',title:'Air shower',
   sop:'<p>An <b>air shower</b> blasts filtered air over your gown to knock loose particles before you enter.</p><p>Stay in for the <b>whole cycle</b>. Leaving early carries dust inside.</p><p class="tip">Press and hold the button (or hold Space) until the cycle finishes.</p>',
   note:'Air showers blow particles off the gown. Always stay for the full cycle.'},
  {task:'cctv',title:'Contamination sweep',
   sop:'<p>Before the batch comes in, check the bay cameras. Flag anything that breaks the rules:</p><ul><li><b>No food or drinks.</b></li><li><b>All hair covered</b>; masks over nose and mouth.</li><li><b>Never touch a wafer bare-handed.</b> Use gloves and tweezers.</li><li><b>No cardboard, paper notebooks or pencils.</b> They shed particles.</li></ul><p class="tip">Click a camera to flag it. Click again to unflag. Then send the report.</p>',
   note:'Cleanroom rules: no food or drink, all hair covered, masks up, no bare hands on wafers, no cardboard or ordinary paper.'}
 ]},
 {name:'Litho bay',short:'PHOTOLITHOGRAPHY',code:'NOVA-2R8T',steps:[
  {task:'litho',title:'Print the circuit layer',
   sop:'<p><b>Photolithography</b> prints a circuit pattern onto the wafer using light. The bay is lit yellow because <b>photoresist reacts to UV and blue light</b>; yellow light is safe for it.</p><p>Each tool needs the one before it:</p><ul><li>Resist only sticks evenly to a <b>clean</b> wafer.</li><li>Light can only print on <b>resist</b>.</li><li>The <b>developer</b> washes away the resist that light hit, opening the pattern.</li><li>The <b>etcher</b> removes material where the resist is open.</li><li>Leftover resist is <b>stripped</b> at the end.</li></ul>',
   note:'Lithography order: clean → spin-coat resist → align mask and expose → develop → etch → strip. Spin speed sets resist thickness; etching stops at the endpoint signal.'}
 ]},
 {name:'Probe & dicing',short:'TEST AND CUT',code:'NOVA-5W9C',steps:[
  {task:'probe',title:'Probe the wafer',
   sop:'<p>Every chip is <b>tested while still on the wafer</b>. A prober touches each one and measures the current at a fixed test voltage.</p><p><b>Ohm’s law: I = V ÷ R.</b> With the same voltage, <b>higher resistance means lower current</b>.</p><p>Bad chips are <b>inked</b> (marked) so they are never packaged.</p>',
   note:'Chips are probe-tested on the wafer. I = V ÷ R: higher resistance gives lower current. Failing chips are inked.'},
  {task:'dice',title:'Dice the wafer',
   sop:'<p>A <b>dicing saw</b> cuts the wafer into separate chips along the narrow gaps between them, called <b>streets</b> (or scribe lines).</p><p>Cut <b>only on the streets</b>. A cut through a chip destroys it.</p><p class="tip">Click each street to run the blade along it.</p>',
   note:'Dicing saws cut along the streets between chips, never through a chip.'},
  {task:'pick',title:'Pick good chips',
   sop:'<p>Only <b>known-good dies</b> move on to packaging. Inked chips stay behind.</p><p class="tip">Click a good chip to lift it with the vacuum pick-up tool and drop it in the tray.</p>',
   note:'Only known-good (un-inked) dies are picked for packaging.'}
 ]},
 {name:'Final inspection',short:'QUALITY CHECK',code:'NOVA-8H3P',steps:[
  {task:'qc',title:'Measure, inspect, sort',
   sop:'',note:'Every part is measured against its spec (nominal ± tolerance) and checked for cracks. Fail either check and it’s rejected.'}
 ]},
 {name:'Training office',short:'CAREER · GETTING STARTED',code:'NOVA-4D7X',steps:[
  {task:'mentor',title:'Talk to Mira',
   sop:'<p>Mira helps new apprentices get started. Ask her three questions. Her answers are saved in your notebook.</p>',
   note:''},
  {task:'folder',title:'Build your application',
   sop:'<p>Put together what you need to <b>start the Micro Electronics Manufacturer apprenticeship</b>. Only what’s required, plus anything that helps you get hired.</p><p class="tip">Click a document to put it in the folder (click again to take it out). Then hand it to Mira.</p>',
   note:'To start: Grade 12 (OSSD or equivalent) and an employer who agrees to sponsor you. A resume with co-op or OYAP helps. No degree or exam is needed to start.'},
  {task:'logbook',title:'Sign your logbook',
   sop:'<p>Apprentices record progress in a <b>training standard</b>, often called a logbook. A supervisor signs off each skill once you can do it.</p><p>Tick the skills <b>from this trade</b> that you practised tonight. Skills from other trades don’t belong here.</p>',
   note:'The 630A training standard covers skills like gowning, spin coating, photo aligning, etching, testing, dicing, measuring and inspecting.'}
 ]},
 {name:'Career planner',short:'CAREER · YOUR ROUTE',code:'NOVA-6Y2B',steps:[
  {task:'route',title:'Map your route',
   sop:'<p>Plan the route from where you are now to a <b>Certificate of Apprenticeship</b>.</p><p>Click the stops in the order you would reach them. <b>Some stops are traps</b>: they aren’t part of this trade’s route.</p>',
   note:'Route: co-op or OYAP in high school → Grade 12 → find an employer sponsor → register through Employment Ontario → ≈4,000 h on the job + 304 h in class → Certificate of Apprenticeship.'},
  {task:'plan',title:'Pick your next moves',
   sop:'<p>Every route starts with a small step. Choose <b>at least two</b> things you could do this school year.</p><p>There are no wrong answers here. Your picks appear on your final mission report.</p>',
   note:''}
 ]}
];

const FINAL={sop:'<p>The truck is at the dock, but the line is throwing alarms. For each alarm:</p><ol><li>Click the <b>station</b> where the problem started.</li><li>Choose the <b>fix</b>.</li></ol><p>Clear every alarm to open the dispatch dock.</p>'};

/* ---------- Room 1 ---------- */
const GOWN_ORDER=['hairnet','hood','mask','coverall','boots','gloves'];
const GARMENTS={hairnet:'Hair net',hood:'Hood',mask:'Face mask',coverall:'Coverall',boots:'Cleanroom boots',gloves:'Gloves',sweater:'Wool sweater',scarf:'Cotton scarf'};
const GOWN_WHY={
 gloves:'Gloves go on last. Anything you touch while dressing would dirty them.',
 boots:'Coverall first: its legs tuck inside the boots.',
 coverall:'Head and face first: the hood tucks into the coverall collar.',
 mask:'Hood first (your head), then the mask (your face).',
 hood:'Hair net first. It holds your hair in place under the hood.',
 sweater:'Wool sheds fibres. It never goes into the cleanroom.',
 scarf:'Ordinary fabric sheds lint. Leave it in the locker.'
};
// `where` is the neutral camera caption; `title` names the situation in feedback after the report.
const HAZARDS={
 drink:{unsafe:true,title:'Open drink',where:'Tool bench B'},hair:{unsafe:true,title:'Uncovered hair',where:'Operator, hood station'},cardboard:{unsafe:true,title:'Cardboard box',where:'Delivery area'},
 hand:{unsafe:true,title:'Bare hand on wafer',where:'Wafer hand-off'},snack:{unsafe:true,title:'Snack on bench',where:'Tool bench A'},pencil:{unsafe:true,title:'Pencil & notebook',where:'Note-taking station'},
 mask:{unsafe:true,title:'Mask below nose',where:'Operator, bay entrance'},carrier:{unsafe:false,title:'Closed wafer carrier',where:'Wafer transport'},gown:{unsafe:false,title:'Fully gowned worker',where:'Operator, hood station'},
 tweezers:{unsafe:false,title:'Gloved hand with tweezers',where:'Wafer hand-off'},cleanpaper:{unsafe:false,title:'Lint-free paper and cleanroom pen',where:'Note-taking station'}
};

/* ---------- Room 2 ---------- */
const LITHO=[
 {id:'clean',tool:'Wet clean bench',done:'Wafer cleaned and dried.',early:'Already clean. Cleaning now would wash off your work.'},
 {id:'coat',tool:'Spin coater',done:'Even resist coat.',early:'Clean the wafer first, or particles get trapped under the resist.'},
 {id:'expose',tool:'Mask aligner',done:'Pattern exposed.',early:'There’s no resist yet, so the light has nothing to print on.'},
 {id:'develop',tool:'Developer',done:'Pattern developed.',early:'The resist hasn’t been exposed yet, so no pattern would appear.'},
 {id:'etch',tool:'Plasma etcher',done:'Etched to the endpoint.',early:'Develop first. Etching needs the pattern opened up in the resist.'},
 {id:'strip',tool:'Resist stripper',done:'Resist stripped. Layer complete!',early:'Keep the resist until etching is done. It protects the areas that should stay.'}
];

/* ---------- Room 5 ---------- */
const DOCS={
 ossd:{title:'Grade 12 diploma (OSSD)',need:'required'},
 sponsor:{title:'Letter: an employer agrees to sponsor you',need:'required'},
 resume:{title:'Resume listing a co-op or OYAP placement',need:'helpful'},
 degree:{title:'University engineering degree',need:'no',why:'A degree isn’t needed. Entry is Grade 12.'},
 redseal:{title:'Red Seal endorsement',need:'no',why:'This trade isn’t a Red Seal trade.'},
 cofq:{title:'Certificate of Qualification exam result',need:'no',why:'There’s no Certificate of Qualification exam in this trade.'},
 cert:{title:'Certificate of Apprenticeship',need:'no',why:'That’s what you earn at the end, not what you need to start.'}
};
const SKILLS={
 gown:{t:'Follow cleanroom gowning procedures',ours:true},coat:{t:'Spin-coat photoresist',ours:true},align:{t:'Align and expose a photomask',ours:true},
 etch:{t:'Etch a pattern to its endpoint',ours:true},probe:{t:'Probe-test chips on a wafer',ours:true},dice:{t:'Dice a wafer along its streets',ours:true},
 measure:{t:'Measure and inspect parts',ours:true},
 weld:{t:'Weld steel pipe',ours:false,who:'welder'},panel:{t:'Wire a house electrical panel',ours:false,who:'construction electrician'},
 brakes:{t:'Replace car brake pads',ours:false,who:'automotive service technician'},frame:{t:'Frame a wall',ours:false,who:'carpenter'}
};
const MENTOR_POOL=[
 {q:'What education do I need to start?',a:'For the Ontario apprenticeship, the academic entry requirement is <strong>Grade 12</strong>: an OSSD or equivalent. Math, science and tech courses help a lot.'},
 {q:'How do I actually become an apprentice?',a:'Find an employer willing to <strong>sponsor and train you</strong>. Then you both register a training agreement through <strong>Employment Ontario</strong>.'},
 {q:'How long does the apprenticeship take?',a:'About <strong>two years</strong>: roughly 4,000 hours of paid on-the-job training plus <strong>304 hours</strong> of in-class training at a college or training provider.'},
 {q:'What certificate do I get at the end?',a:'A <strong>Certificate of Apprenticeship</strong> from Skilled Trades Ontario. There’s no Certificate of Qualification exam, and it isn’t a Red Seal trade.'},
 {q:'Do I need the certificate to work?',a:'No. Micro Electronics Manufacturer (trade code <strong>630A</strong>) is a <strong>non-compulsory</strong> trade, but the certificate proves your skills to employers.'},
 {q:'What safety training will I need?',a:'<strong>WHMIS</strong> training is required if you work with hazardous products, and fabs use plenty of chemicals. Gowning and equipment safety are taught on the job.'},
 {q:'Can I start while still in high school?',a:'Yes! <strong>Co-op</strong>, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> and a <strong>Specialist High Skills Major</strong> give you real experience before you graduate.'}
];

/* ---------- Room 6 ---------- */
const ROUTE=[
 {id:'start',t:'You, in high school',start:true},
 {id:'coop',t:'Co-op or OYAP placement'},
 {id:'g12',t:'Graduate Grade 12'},
 {id:'sponsor',t:'Find an employer sponsor'},
 {id:'register',t:'Register through Employment Ontario'},
 {id:'train',t:'Train: ≈4,000 h on the job + 304 h in class'},
 {id:'cert',t:'Certificate of Apprenticeship',end:true}
];
const TRAPS={
 redseal:{t:'Write the Red Seal exam',why:'This trade isn’t Red Seal, and there’s no exam to pass.'},
 degree:{t:'Earn a university degree first',why:'Not needed. The entry requirement is Grade 12.'},
 nosponsor:{t:'Register without an employer',why:'You can’t. An apprenticeship needs a sponsoring employer.'},
 cofq:{t:'Pass a Certificate of Qualification exam',why:'There’s no C of Q exam in this trade.'}
};
const PLAN_OPTIONS=[
 'Ask my guidance counsellor about co-op or OYAP',
 'Take Grade 11 and 12 math, physics or chemistry',
 'Take a technology course, like computer engineering (TEJ)',
 'Ask about a Manufacturing Specialist High Skills Major',
 'Read the 630A trade page on Skilled Trades Ontario',
 'Visit a college open house for Electronics Engineering Technician',
 'Join a robotics or electronics club'
];

/* ---------- Final: line control ---------- */
const STATIONS={gowning:'Gowning',coater:'Spin coater',aligner:'Mask aligner',etcher:'Etcher',prober:'Prober',saw:'Dicing saw',inspect:'Inspection'};
const INCIDENTS=[
 {at:'gowning',alarm:'Particle count spikes every time someone enters the bay.',fix:['Re-gown properly and use the full air-shower cycle','Turn up the yellow lights','Etch the wafers longer']},
 {at:'gowning',alarm:'A worker walks in with their mask below their nose.',fix:['Stop them and fix the mask before entry','Let them in if they hurry','Give them a second pair of gloves']},
 {at:'coater',alarm:'Resist on the new wafers is thick and streaky.',fix:['Re-coat at the correct spin speed','Expose for twice as long','Skip the developer']},
 {at:'aligner',alarm:'The printed pattern is shifted off its alignment marks.',fix:['Strip, re-coat and re-align the mask','Spin the resist faster','Dice the wafer early']},
 {at:'etcher',alarm:'The layer under the pattern is damaged: over-etched.',fix:['Stop etching at the endpoint signal','Add a second resist coat','Raise the clean bench temperature']},
 {at:'prober',alarm:'Several chips read 0.0 mA at the test voltage.',fix:['Ink them as failed: an open circuit','Pass them: zero means no problem','Re-coat them with resist']},
 {at:'saw',alarm:'Chips come out cracked along one edge.',fix:['Re-align the blade to the streets','Expose the wafer again','Add more photoresist']},
 {at:'inspect',alarm:'A part measures 10.18 mm. The spec is 10.00 ± 0.10 mm.',fix:['Reject it: out of tolerance','Pass it: close enough','Measure a different part instead']},
 {at:'inspect',alarm:'Inked chips showed up in the packaging tray.',fix:['Pull them out: only known-good dies ship','Leave them: the ink will wear off','Re-probe the whole lot tomorrow']}
];

/* ---------- Career reference (guide + ending) ---------- */
const PATHWAY=[
 {title:'Try the trade in high school',tag:'Co-op · OYAP · SHSM',text:'While still in high school, try the trade through <strong>co-op</strong>, the <strong>Ontario Youth Apprenticeship Program (OYAP)</strong> or a <strong>Specialist High Skills Major</strong> in manufacturing.'},
 {title:'Finish Grade 12',tag:'OSSD or equivalent',text:'The apprenticeship lists <strong>Grade 12</strong> (OSSD or equivalent) as its academic entry requirement.'},
 {title:'Find an employer sponsor',tag:'Get hired',text:'An apprenticeship is a job. It starts when an <strong>employer agrees to sponsor and train you</strong>.'},
 {title:'Register the apprenticeship',tag:'Employment Ontario',text:'You and your sponsor <strong>register a training agreement through Employment Ontario</strong> and receive a training standard (logbook).'},
 {title:'Train on the job and in class',tag:'≈ 4,000 h + 304 h',text:'About <strong>4,000 hours of paid on-the-job training</strong> (around 2 years) plus <strong>304 hours of in-class training</strong>. A supervisor signs off each skill.'},
 {title:'Earn the Certificate of Apprenticeship',tag:'Skilled Trades Ontario',text:'<strong>Skilled Trades Ontario</strong> issues a <strong>Certificate of Apprenticeship</strong>. The trade (code <strong>630A</strong>) is non-compulsory, with no Certificate of Qualification exam and no Red Seal.'}
];

/* ---------- Storyline ---------- */
const CAST={sam:{name:'Sam Okoro',role:'Night-shift supervisor'},mira:{name:'Mira Tran',role:'Apprenticeship training advisor'},nova:{name:'NOVA',role:'Factory control system'}};
const STORY={
 r0:[['nova','⚠ POWER SURGE DETECTED. Line reset. Batch NB-7 lost its last circuit layer. All doors sealed.'],
     ['sam','{name}! Perfect timing for your first shift. NB-7 is sensor chips for hospital heart monitors, and the truck leaves at dawn.'],
     ['sam','We’ll have to rebuild the batch ourselves. Each door needs a code swapped with the Google Form, so keep it open in another tab.'],
     ['sam','But first: you can’t go anywhere near a wafer dressed like that. Gown up.']],
 r1:[['sam','Welcome to the litho bay. That’s why everything’s yellow.'],['sam','The surge wiped NB-7’s last layer. Re-print it: pick each tool in the right order and run it.']],
 r2:[['sam','The layer is printed. Now we find out which chips actually work.'],['sam','Probe them on the wafer, ink the bad ones, then dice it and pick the good chips.']],
 r3:[['sam','Final inspection. Measure every part and check it under the microscope.'],['sam','If it’s out of spec, it doesn’t ship. No “close enough”.']],
 r4:[['sam','NB-7 is packed. Honestly? You’re a natural.'],['sam','Nova sponsors apprentices. If you want to do this for real, go see Mira in the training office.'],['mira','Hi {name}! Let’s see what it takes to get started, and what you’ve already practised tonight.']],
 r5:[['mira','Application sorted! Now let’s map your route, from where you are today to the certificate.']],
 final:[['nova','LINE ALARMS ACTIVE. Dispatch dock locked until the line is clear.'],['sam','The truck’s here and the line is throwing alarms. Find each problem, fix it, and we ship!']],
 ending:[['sam','Dock open, truck rolling. Those heart monitors will get their chips on time, because of you.'],['mira','And you’ve mapped your own route into the trade. Whenever you’re ready, Sam’s sponsorship offer stands.'],['nova','ALL SYSTEMS NOMINAL. Welcome to Nova, {name}.']]
};

/* ---------- Random helpers & per-mission variant ---------- */
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pickN=(a,n)=>shuffle(a).slice(0,n);
const round1=x=>Math.round(x*10)/10;
function partOk(p,spec){return Math.abs(p.len-spec)<=0.1001&&!p.crack;}

function makeVariant(){
 const v={};
 // Room 1
 v.rack=shuffle(GOWN_ORDER.concat(pickN(['sweater','scarf'],1)));
 const unsafe=Object.keys(HAZARDS).filter(k=>HAZARDS[k].unsafe),safe=Object.keys(HAZARDS).filter(k=>!HAZARDS[k].unsafe),n=rint(3,4);
 v.hazards=shuffle(pickN(unsafe,n).concat(pickN(safe,6-n)));
 v.showerSecs=rint(3,4);
 // Room 2
 v.tools=shuffle(LITHO.map(s=>s.id));
 v.rpm=[2500,3000,3500,4000][rint(0,3)];
 v.mask={dx:pickN([-1,1],1)[0]*rint(5,11)*3,dy:pickN([-1,1],1)[0]*rint(4,9)*3};
 v.endpoint=round1(2.8+Math.random()*2.4);
 // Room 3: 5×5 wafer map without corners
 const lo=rint(3,6),hi=lo+2;v.probe={V:lo*hi,Rlo:lo,Rhi:hi,lo,hi};
 const dies=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++)if(!((r===0||r===4)&&(c===0||c===4)))dies.push({r,c});
 const bad=new Set(pickN(dies.map((_,i)=>i),rint(4,5)));
 v.dies=dies.map((d,i)=>{let mA;if(!bad.has(i))mA=round1(lo+0.2+Math.random()*(hi-lo-0.4));
  else mA=pickN([0,round1(lo-0.6-Math.random()*1.4),round1(hi+0.6+Math.random()*1.5),round1(hi*3+Math.random()*4)],1)[0];
  return {...d,mA,bad:bad.has(i)};});
 v.tray=6;
 // Room 4: three parts against a random spec
 v.spec=[8,10,12][rint(0,2)];
 do{v.parts=['A','B','C'].map(id=>({id,len:+(v.spec+pickN([-0.18,-0.13,-0.06,-0.03,0,0.02,0.05,0.08,0.14,0.21],1)[0]).toFixed(2),crack:Math.random()<.3,cx:rint(25,75),cy:rint(30,70)}));}
 while(v.parts.every(p=>partOk(p,v.spec))||!v.parts.some(p=>partOk(p,v.spec)));
 // Room 5
 v.mentor=pickN(MENTOR_POOL.map((_,i)=>i),5);
 v.docs=shuffle(['ossd','sponsor','resume'].concat(pickN(['degree','redseal','cofq','cert'],3)));
 v.skills=shuffle(pickN(Object.keys(SKILLS).filter(k=>SKILLS[k].ours),5).concat(pickN(Object.keys(SKILLS).filter(k=>!SKILLS[k].ours),3)));
 // Room 6: route stops placed on random map slots
 const slots=shuffle([[110,80],[290,60],[470,85],[650,60],[820,90],[130,220],[310,200],[490,230],[670,205],[840,230]]);
 const stops=ROUTE.filter(s=>!s.start&&!s.end).map(s=>s.id).concat(pickN(Object.keys(TRAPS),2));
 v.route=Object.fromEntries(stops.map((id,i)=>[id,slots[i]]));
 v.plan=pickN(PLAN_OPTIONS,5);
 // Final: five alarms at five different stations
 const byStation={};shuffle(INCIDENTS.map((_,i)=>i)).forEach(i=>{const s=INCIDENTS[i].at;if(byStation[s]===undefined)byStation[s]=i;});
 v.incidents=shuffle(Object.values(byStation)).slice(0,5).map(i=>({i,order:shuffle([0,1,2])}));
 return v;
}
