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
/* Each room is a short run of hands-on steps.
   learn: the "Learn" card shown before the step (plain language for Grade 10).
   remember: the short reminder beside the bench.  note: the takeaway saved to the notebook.
   photo: optional real photo key (see PHOTOS). */
const ROOMS = [
 {name:'Gowning room',short:'CLEANROOM ENTRY',code:'NOVA-7K4M',steps:[
  {task:'gown',title:'Gown up',photo:'gowning',
   learn:{points:['A chip’s wires are thousands of times thinner than a hair. One speck of dust can ruin one.','<b>People are the dirtiest thing in a cleanroom.</b> We shed skin flakes, hair and clothing fibres all the time.','So workers cover up completely in a special suit, put on in a set order.'],
    fact:'Even standing still, a person sheds hundreds of thousands of tiny particles every minute.'},
   remember:['Watch and phone go in the locker first.','Dress <b>top to bottom</b>: hair → head → face → body → feet.','<b>Gloves go on last.</b>'],
   note:'Gowning goes top-down (hair net, hood, mask, coverall, boots) with gloves last. Personal items stay in the locker.'},
  {task:'airshower',title:'Air shower',photo:'airshower',
   learn:{points:['Before going in, you stand in an <b>air shower</b>: a small room that blasts clean, filtered air at you.','It knocks loose dust off your suit.','You must stay for the <b>whole cycle</b>. Leaving early lets dust in.'],
    fact:'The air in an air shower is filtered first, so it blows dust off without adding any.'},
   remember:['Hold the button for the <b>whole</b> countdown.','Letting go early restarts the cycle.'],
   note:'Air showers blow particles off the gown. Always stay for the full cycle.'},
  {task:'cctv',title:'Spot the rule-breakers',photo:'cleanroom',
   learn:{points:['Cleanroom rules keep dirt away from the chips.','<b>Not allowed:</b> food, drinks, uncovered hair, a mask below the nose, bare hands on wafers, cardboard, pencils and normal paper.','<b>Allowed:</b> full gowns, gloves with tweezers, closed wafer carriers, special lint-free paper.'],
    fact:'Cleanroom air can have thousands of times fewer particles than the air in your classroom.'},
   remember:['No food or drink.','Hair covered, mask over the nose.','No bare hands on wafers.','No cardboard, pencils or normal paper.'],
   note:'Cleanroom rules: no food or drink, all hair covered, masks up, no bare hands on wafers, no cardboard or ordinary paper.'}
 ]},
 {name:'Litho bay',short:'PHOTOLITHOGRAPHY',code:'NOVA-2R8T',steps:[
  {task:'litho',title:'Print a circuit layer',photo:'yellowroom',
   learn:{points:['Chips are built in layers. Each layer’s pattern is <b>printed with light</b>, a bit like developing a photo. This is called <b>photolithography</b>.','A light-sensitive coating called <b>photoresist</b> is spread on the wafer. UV light shines through a stencil (the <b>mask</b>) to print the pattern.','You’ll use six machines. Each card says what the machine does, so you can work out the order.'],
    fact:'The bay is lit yellow for the same reason old photo darkrooms used red light: it doesn’t affect the light-sensitive coating.'},
   remember:['Clean → coat → expose → develop → etch → strip.','Each machine needs the step before it.','Read each machine’s card if you’re unsure.'],
   note:'Lithography order: clean → spin-coat resist → align mask and expose → develop → etch → strip. Spin speed sets resist thickness; etching stops at the endpoint signal.'}
 ]},
 {name:'Probe & dicing',short:'TEST AND CUT',code:'NOVA-5W9C',steps:[
  {task:'probe',title:'Test the chips',photo:'prober',
   learn:{points:['One wafer holds lots of chips. Before cutting them apart, a machine called a <b>prober</b> tests each one.','It sends electricity through each chip and measures the <b>current</b> in milliamps (mA).','Chips outside the good range get a red ink dot so nobody uses them.'],
    fact:'Testing chips on the wafer saves money: bad chips are never cut out or packaged.'},
   remember:['<b>Ohm’s law: I = V ÷ R</b> (current = voltage ÷ resistance).','Green zone = good chip.','Click every chip <b>outside</b> the green zone.'],
   note:'Chips are probe-tested on the wafer. I = V ÷ R: higher resistance gives lower current. Failing chips are inked.'},
  {task:'dice',title:'Cut the wafer',photo:'wafer',
   learn:{points:['Next, a <b>dicing saw</b> cuts the wafer into separate chips.','It cuts along the thin gaps between chips, called <b>streets</b>.','Cutting through a chip would destroy it.'],
    fact:'Dicing blades are coated with tiny diamonds and can be thinner than a human hair.'},
   remember:['Click the <b>gaps</b> between chips.','Never cut through a chip.'],
   note:'Dicing saws cut along the streets between chips, never through a chip.'},
  {task:'pick',title:'Pick the good chips',photo:'chiptray',
   learn:{points:['Only chips that passed the test go on to be packaged.','A <b>vacuum pick-up tool</b> lifts each good chip by suction.','Chips with a red ink dot stay behind.'],
    fact:'Using suction instead of fingers or metal tips means nothing scratches the chip.'},
   remember:['Pick chips <b>without</b> a red dot.','Red dot = failed the test.'],
   note:'Only known-good (un-inked) dies are picked for packaging.'}
 ]},
 {name:'Final inspection',short:'QUALITY CHECK',code:'NOVA-8H3P',steps:[
  {task:'qc',title:'Measure, inspect, sort',photo:'caliper',
   learn:{points:['Every part is checked against its <b>specification</b> (spec): the size it’s supposed to be.','A spec like <b>10.00 ± 0.10 mm</b> means anything from 9.90 to 10.10 mm is OK. That allowed wiggle room is the <b>tolerance</b>.','You’ll measure with a <b>caliper</b>, look for cracks with a <b>microscope</b>, then sort each part: PASS or REJECT.'],
    fact:'0.1 mm is about the thickness of a sheet of paper.'},
   remember:['Close the caliper until it touches the part.','Look all over for cracks.','PASS only if the size is in the green zone <b>and</b> there’s no crack.'],
   note:'Every part is measured against its spec (nominal ± tolerance) and checked for cracks. Fail either check and it’s rejected.'}
 ]},
 {name:'Training office',short:'CAREER · GETTING STARTED',code:'NOVA-4D7X',steps:[
  {task:'mentor',title:'Talk to Mira',
   learn:{points:['What you did tonight is real work done by a <b>Micro Electronics Manufacturer</b>: an Ontario skilled trade (code 630A).','People learn it through an <b>apprenticeship</b>: a paid job where you train at work and in class.','Mira will answer your questions about how to start.'],
    fact:'Apprentices earn a paycheque while they learn.'},
   remember:['Ask Mira 3 questions.','Her answers go in your notebook.'],
   note:''},
  {task:'folder',title:'Build your application',
   learn:{points:['To <b>start</b> this apprenticeship you need two things: <b>Grade 12</b> (an OSSD or equivalent) and an <b>employer who agrees to hire and train you</b> (a sponsor).','A resume showing co-op or OYAP experience helps you get hired.','You do <b>not</b> need a university degree or an exam to start.'],
    fact:'OYAP (the Ontario Youth Apprenticeship Program) lets high school students start training in a trade.'},
   remember:['Needed: Grade 12 + an employer sponsor.','Helpful: a resume with co-op or OYAP.','Not needed: degrees, exams or end-of-training certificates.'],
   note:'To start: Grade 12 (OSSD or equivalent) and an employer who agrees to sponsor you. A resume with co-op or OYAP helps. No degree or exam is needed to start.'},
  {task:'logbook',title:'Fill in your logbook',
   learn:{points:['Apprentices keep a <b>logbook</b> (a training standard) listing the skills of their trade.','When you can do a skill, your supervisor signs it off.','Tonight you already practised several real skills from this trade!'],
    fact:'Spin coating, photo aligning, etching, testing, dicing and inspecting are all real tasks listed for this trade.'},
   remember:['Tick the skills you did tonight.','Skip skills from other trades.'],
   note:'The 630A training standard covers skills like gowning, spin coating, photo aligning, etching, testing, dicing, measuring and inspecting.'}
 ]},
 {name:'Career planner',short:'CAREER · YOUR ROUTE',code:'NOVA-6Y2B',steps:[
  {task:'route',title:'Map your route',
   learn:{points:['Here’s the real route into this trade in Ontario:','High school (try co-op or OYAP) → finish Grade 12 → find an employer sponsor → register through Employment Ontario → train about 2 years (≈4,000 hours at work + 304 hours in class) → get your <b>Certificate of Apprenticeship</b>.','Watch out for trap stops that aren’t part of this route!'],
    fact:'This trade has no final exam and no Red Seal: you earn the certificate by completing your hours and skills.'},
   remember:['High school → Grade 12 → sponsor → register → train → certificate.','Avoid the traps.'],
   note:'Route: co-op or OYAP in high school → Grade 12 → find an employer sponsor → register through Employment Ontario → ≈4,000 h on the job + 304 h in class → Certificate of Apprenticeship.'},
  {task:'plan',title:'Pick your next moves',
   learn:{points:['Every career starts with a small step you can take <b>this year</b>.','Pick at least two that you could really do.','They’ll appear on your final mission report.'],
    fact:'Ontario colleges also offer 2- and 3-year electronics diplomas if you want another route into chipmaking.'},
   remember:['Pick at least 2.','No wrong answers!'],
   note:''}
 ]}
];

const FINAL={learn:{points:['The truck is here, but the factory is throwing <b>alarms</b>.','For each alarm: click the <b>machine</b> where the problem started, then pick the <b>fix</b>.','Everything you need, you learned tonight. Use the Hint button if you get stuck!'],fact:''},
 remember:['Read the alarm.','Click the machine causing it.','Pick the fix.','Stuck? Press 💡 Hint.']};

/* ---------- Room 1 ---------- */
const GOWN_ORDER=['hairnet','hood','mask','coverall','boots','gloves'];
const GARMENTS={hairnet:'Hair net',hood:'Hood',mask:'Face mask',coverall:'Coverall',boots:'Boot covers',gloves:'Gloves',sweater:'Wool sweater',scarf:'Knitted scarf'};
const GOWN_WHY={
 gloves:'Gloves go on last. Anything you touch while dressing would dirty them.',
 boots:'Coverall first: boot covers go over the coverall legs.',
 coverall:'Head and face first: the hood tucks into the coverall collar.',
 mask:'Hood first (your head), then the mask (your face).',
 hood:'Hair net first. It holds your hair in place under the hood.',
 sweater:'Wool sheds fibres. It never goes into the cleanroom.',
 scarf:'Ordinary fabric sheds lint. Leave it in the locker.'
};
// `where` is the neutral camera caption; `why` explains the call after a click.
const HAZARDS={
 drink:{unsafe:true,title:'Open drink',where:'Tool bench B',why:'Drinks can spill and leave droplets. No food or drink inside.'},
 hair:{unsafe:true,title:'Uncovered hair',where:'Operator, hood station',why:'Hair falls out all the time, so it must be fully covered.'},
 cardboard:{unsafe:true,title:'Cardboard box',where:'Delivery area',why:'Cardboard sheds tiny fibres and dust.'},
 hand:{unsafe:true,title:'Bare hand on wafer',where:'Wafer hand-off',why:'Skin oils and flakes ruin wafers. Always wear gloves.'},
 snack:{unsafe:true,title:'Snack on bench',where:'Tool bench A',why:'Food leaves crumbs and grease.'},
 pencil:{unsafe:true,title:'Pencil & notebook',where:'Note-taking station',why:'Pencils and normal paper shed dust. Use cleanroom paper and pens.'},
 mask:{unsafe:true,title:'Mask below nose',where:'Operator, bay entrance',why:'Breath carries droplets. The mask must cover the nose.'},
 carrier:{unsafe:false,title:'Closed wafer carrier',where:'Wafer transport',why:'A closed carrier keeps wafers clean while they move.'},
 gown:{unsafe:false,title:'Fully gowned worker',where:'Operator, hood station',why:'Fully covered with gloves on: exactly right.'},
 tweezers:{unsafe:false,title:'Gloved hand with tweezers',where:'Wafer hand-off',why:'Gloves plus tweezers means no skin touches the wafer.'},
 cleanpaper:{unsafe:false,title:'Lint-free paper and cleanroom pen',where:'Note-taking station',why:'Special lint-free paper and pens are allowed.'}
};

/* ---------- Room 2 ---------- */
const LITHO=[
 {id:'clean',desc:'Washes the wafer with ultra-pure water',tool:'Wet clean bench',done:'Wafer cleaned and dried.',early:'Already clean. Cleaning now would wash off your work.'},
 {id:'coat',desc:'Spins a layer of light-sensitive resist onto the wafer',tool:'Spin coater',done:'Even resist coat.',early:'Clean the wafer first, or particles get trapped under the resist.'},
 {id:'expose',desc:'Shines UV light through a mask to print the pattern',tool:'Mask aligner',done:'Pattern exposed.',early:'There’s no resist yet, so the light has nothing to print on.'},
 {id:'develop',desc:'Washes away the resist that the light hit',tool:'Developer',done:'Pattern developed.',early:'The resist hasn’t been exposed yet, so no pattern would appear.'},
 {id:'etch',desc:'Uses plasma to carve the pattern into the wafer',tool:'Plasma etcher',done:'Etched to the endpoint.',early:'Develop first. Etching needs the pattern opened up in the resist.'},
 {id:'strip',desc:'Removes the leftover resist',tool:'Resist stripper',done:'Resist stripped. Layer complete!',early:'Keep the resist until etching is done. It protects the areas that should stay.'}
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
/* Story beats. An entry is either [speaker, line] or an object:
   {w, t, choices:[[button label, reply speaker, reply line, tag?]]}  -> the player picks a reply (tag is saved in state.choices[key])
   {guess:{tag:[speaker,line]}}                                       -> a line that depends on an earlier choice (skipped if none)
   {name} becomes the player's name. */
const STORY={
 r0:[['nova','⚠ POWER SURGE. Line crashed. Batch NB-7 lost its last circuit layer. Doors: LOCKED. Cause: unknown.'],
     ['sam','{name}! You’re the new co-op student, right? Great timing… or terrible timing. I’m Sam, the night supervisor.'],
     {w:'sam',t:'NB-7 is chips for hospital heart monitors. Real patients are waiting, and the truck leaves in 25 minutes.',choices:[
      ['Let’s do this! 💪','sam','That’s the spirit. I like you already.'],
      ['Wait… 25 MINUTES?!','sam','Yep. Breathe. The blue box on your screen will walk you through every step.'],
      ['Do I get paid for this?','sam','Ha! Co-op is for credits. But apprentices in this trade DO get paid. Remember that for later.']]},
     ['sam','Every door needs a code swapped with the Google Form, so keep it open in another tab.'],
     ['sam','Rule one: nobody goes near a wafer in a hoodie. Let’s get you suited up.']],
 r1:[['nova','Welcome to the litho bay. Yes, everything is yellow. No, your eyes are fine.'],
     ['sam','Yellow light doesn’t affect the light-sensitive coating. Blue and UV light would ruin it.'],
     ['nova','Surge investigation: 12% complete. Cause: still unknown. I am… concerned.'],
     ['sam','Fun fact: the chip in your phone was made with this same process, layer after layer. Let’s rebuild NB-7’s layer.']],
 r2:[['sam','Layer printed. Now the big question: which chips actually work?'],
     ['nova','Starting chip test… correction: YOU are starting the chip test. I am supervising. Emotionally.'],
     ['nova','Surge investigation: 47% complete. Found: something sticky near control panel 3.'],
     ['sam','Sticky? Weird. Okay: test the chips, mark the duds with red ink, then cut the wafer and keep only the good ones.']],
 r3:[['sam','Last stop on the floor: inspection. This is where we catch mistakes before a patient ever could.'],
     ['nova','Reminder: “close enough” is not a measurement.'],
     {w:'sam',t:'Before we start: any guess what caused that surge? Something sticky on a control panel…',choices:[
      ['A lightning storm ⚡','sam','Could be! But lightning isn’t usually sticky. Let’s see what NOVA finds.','lightning'],
      ['Someone broke a cleanroom rule','sam','Hmm. In a place with this many rules? Let’s see what NOVA finds.','rule'],
      ['NOVA did it 🤖','nova','I am deeply offended. And also checking my logs. Just in case.','nova']]}],
 r4:[['sam','NB-7 is packed. {name}, you picked this up faster than some new hires do.'],
     {w:'sam',t:'Real talk: people get paid to do this job, and you can start training while you’re still in high school.',choices:[
      ['Wait, really? In high school?','sam','Really. Co-op and OYAP let you start in Grade 11 or 12. Mira knows all about it.'],
      ['Could someone like me do this?','sam','You just did it, all night. That’s the whole point.'],
      ['How much school does it take?','sam','Less than you’d think. Most of it is paid training on the job. Ask Mira.']]},
     ['sam','Mira in the training office can show you how. Go on, I’ll watch the line.'],
     ['mira','Hi {name}! Sam says you’re a natural. Let’s see what it takes to do this for real, and what you’ve already practised tonight.']],
 r5:[['mira','Application done! That’s a real head start.'],
     ['nova','Surge investigation: 89% complete. Sticky substance identified as… sugar. And caffeine.'],
     ['mira','Now let’s map your route, from Grade 10 all the way to a Certificate of Apprenticeship.']],
 final:[['nova','ALARM. ALARM. Also: ALARM. Five problems on the line. Dispatch dock locked.'],
     {w:'sam',t:'The truck’s here and the driver keeps checking the clock. You ready?',choices:[
      ['Born ready.','sam','Then let’s ship it! Find each problem, fix it, and we’re done.'],
      ['…Do I have a choice?','sam','Nope! But you’ve got this. Find each problem, fix it, and we ship.']]}],
 ending:[['nova','Surge investigation complete. Cause: an energy drink spilled on control panel 3.'],
     {guess:{rule:['sam','You called it, {name}: someone broke the no-drinks rule.'],lightning:['nova','Not lightning. Lightning does not come in a can.'],nova:['nova','As I said: not me. Apology accepted in advance.']}},
     ['sam','…and THAT is why there are no drinks on the floor. Anyway: dock open, truck rolling. Those heart monitors will be on time because of you.'],
     ['mira','And you’ve mapped your own route into a real career. Sam’s sponsorship offer stands, whenever you’re ready.'],
     ['nova','ALL SYSTEMS NOMINAL. Welcome to Nova, {name}. Please leave your energy drinks in the locker.']]
};
/* Shown on each room's door screen: a teaser for what comes next. */
const HOOKS=[
 ['sam','Suited up and clean. Next stop: the litho bay. Bring sunglasses. (Kidding. Mostly.)'],
 ['nova','Layer printed. Warning: hundreds of chips on this wafer, and I have no idea which ones work.'],
 ['sam','Good chips in the tray. But inspection is where things get picky…'],
 ['sam','NB-7 is ready to pack. Before you go… I have something to ask you, {name}.'],
 ['mira','Your application is ready. One last question: where do YOU go from here?'],
 ['nova','Career route saved. Uh-oh. The dispatch dock is throwing alarms…']
];
/* Step-complete reactions, picked by stars earned. Career rooms use Mira. */
const REACT={
 floor:{3:[['sam','Clean work. Not a single hint!'],['sam','Textbook. Are you sure this is your first shift?'],['nova','Flawless. Updating your file to “suspiciously good”.']],
  2:[['sam','Nice! A couple of slips, but that’s how everyone learns.'],['sam','Solid work. Mistakes happen, and you fixed them.'],['nova','Acceptable. Above acceptable, even.']],
  1:[['nova','Hints used. Filed under “learning experience”.'],['sam','You got there, and that’s what counts. It gets easier with practice.'],['sam','Every pro needed hints on day one. Keep going.']]},
 career:{3:[['mira','Perfect! You really know your stuff.'],['mira','Wow, first try. Employers love that kind of focus.']],
  2:[['mira','Nicely done! A few tries, and you got it.'],['mira','Good work. Asking questions is how you learn a trade.']],
  1:[['mira','You got there. That’s what matters!'],['mira','No shame in hints. Every apprentice asks for help.']]}
};
const HINT_QUIPS=['Hint deployed. I won’t tell Sam. (I will tell Sam.)','Making it glow for you. You’re welcome.','Hint activated. Even pros check the manual.','Look for the glow. NOVA always delivers.'];

/* ---------- Real photos ----------
   Files live in img/. Any photo that is missing falls back to the drawn illustration,
   so the game works with none, some or all of them. Fill in `credit` for every photo added
   (author, licence, source) — it is shown in Menu → Sources. */
const PHOTOS={
 cleanroom:{file:'cleanroom.jpg',caption:'Workers in a real cleanroom',credit:'Aileen Devlin / Jefferson Lab, public domain, via Wikimedia Commons'},
 gowning:{file:'gowning.jpg',caption:'Workers in full cleanroom gowns at an Intel fab',credit:'Intel Corporation (press photo)'},
 airshower:{file:'airshower.jpg',caption:'An air shower at a cleanroom entrance',credit:'NASA, public domain, via Wikimedia Commons'},
 yellowroom:{file:'yellowroom.jpg',caption:'A real cleanroom lit with yellow safe-light',credit:'NASA Glenn Research Center, public domain, via Wikimedia Commons'},
 wetbench:{file:'wetbench.jpg',caption:'A wet bench for cleaning wafers',credit:'MOT GmbH (product photo, µGALV wet bench)'},
 spincoater:{file:'spincoater.jpg',caption:'A spin coater',credit:'Junny97008, CC BY-SA 4.0, via Wikimedia Commons'},
 maskaligner:{file:'maskaligner.jpg',caption:'A mask aligner (SÜSS MicroTec MA/BA6)',credit:'SÜSS MicroTec (product photo)'},
 developer:{file:'developer.jpg',caption:'A resist coater and developer',credit:'Guillaume Paumier, CC BY-SA 3.0, via Wikimedia Commons'},
 etcher:{file:'etcher.jpg',caption:'A reactive ion (plasma) etcher',credit:'AlabamaUSA, CC BY-SA 3.0, via Wikimedia Commons'},
 stripper:{file:'stripper.jpg',caption:'An oxygen plasma cleaner, used to strip resist',credit:'Maxfisch, CC0, via Wikimedia Commons'},
 prober:{file:'prober.jpg',caption:'A wafer prober, with a wafer loaded',credit:'Ixnayonthetimmay, CC BY-SA 3.0, via Wikimedia Commons'},
 wafer:{file:'wafer.jpg',caption:'A real wafer full of chips, ready to be cut apart',credit:'Peellden, CC BY-SA 3.0, via Wikimedia Commons'},
 chiptray:{file:'chiptray.jpg',caption:'Finished chips in a tray',credit:'BrokenSphere, CC BY-SA 3.0, via Wikimedia Commons'},
 caliper:{file:'caliper.jpg',caption:'A digital caliper',credit:'Jacek Halicki, CC BY-SA 4.0, via Wikimedia Commons'},
 hairnet:{file:'hairnet.jpg',caption:'Hair net',credit:'Online store product photo (seller not recorded)'},
 hood:{file:'hood.jpg',caption:'Cleanroom hood and mask',credit:'Cleanroom supplier product photo (supplier not recorded)',pos:'center 12%'},
 mask:{file:'facemask.jpg',caption:'Face mask',credit:'MagiCare (product photo)'},
 coverall:{file:'coverall.jpg',caption:'Cleanroom coveralls',credit:'Cleanroom supplier product photo (supplier not recorded)'},
 boots:{file:'boots.jpg',caption:'Boot covers',credit:'Sergeev Pavel, CC BY-SA 3.0, via Wikimedia Commons'},
 gloves:{file:'gloves.jpg',caption:'Nitrile gloves',credit:'Comfy Package (product photo)'},
 sweater:{file:'sweater.jpg',caption:'Wool sweater',credit:'Andrew Toskin, CC BY 2.0, via Wikimedia Commons'},
 scarf:{file:'scarf.jpg',caption:'Knitted scarf',credit:'AbbieCall, CC BY-SA 4.0, via Wikimedia Commons'}
};
const TOOL_PHOTO={clean:'wetbench',coat:'spincoater',expose:'maskaligner',develop:'developer',etch:'etcher',strip:'stripper'};

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
