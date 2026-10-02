/* Inline environment art. Hotspot interactions are owned by the host game. */
window.renderLabScene = function renderLabScene(roomIndex, inspectedIds) {
  const room = Math.max(0, Math.min(5, Number(roomIndex) || 0));
  const inspected = new Set((inspectedIds || []).map(Number));
  const titles = ['Staff terminal', 'Cleanroom entrance', 'Materials archive', 'Inspection station', 'Project records', 'Dispatch terminal'];
  const labels = [
    ['Shift briefing', 'Training record', 'Work orders'],
    ['Gowning protocol', 'Airlock camera', 'Contamination alert'],
    ['Process diagram', 'Quartz equipment', 'Silicon wafer'],
    ['Acceptance limits', 'Sample measurements', 'Lab notes'],
    ['Test report', 'Defect record', 'Results summary'],
    ['Batch tracking log', 'Next station', 'Final checklist']
  ][room];
  const id = `nova-scene-${room}`;
  const text = (x, y, value, size = 16, color = '#b3c6c2', extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${value}</text>`;
  const bolt = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#5b7370"/><path d="M${x-1.5} ${y+1.5}l3-3" stroke="#203a3b"/>`;
  const screen = (x, y, w, h, inner = '', amber = false) => `<rect x="${x-6}" y="${y-6}" width="${w+12}" height="${h+12}" rx="8" fill="#3c5755" stroke="#69827b"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${id}-screen)"/><path d="M${x+12} ${y+10}h${w-24}" stroke="${amber ? '#ebba73' : '#7cdcca'}" opacity=".65"/>${inner}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${id}-scan)" pointer-events="none"/>`;
  const cabinet = (x, y, w, h, content = '') => `<path d="M${x} ${y}l24-14h${w}l-24 14Z" fill="#69817a"/><path d="M${x+w} ${y}l24-14v${h}l-24 14Z" fill="#263e3e"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}-metal)" stroke="#71847c" stroke-width="1.5"/><path d="M${x+8} ${y+h}v9m${w-16}-9v9" stroke="#102224" stroke-width="7"/>${content}`;
  const table = (x, y, w) => `<path d="M${x} ${y}l34-20h${w}l-34 20Z" fill="#a1b4a8"/><path d="M${x} ${y}h${w}v12H${x}Z" fill="#637e75"/><path d="M${x+w} ${y}l34-20v12l-34 20Z" fill="#354f49"/><path d="M${x+15} ${y+12}v70m${w-31}-70v70" stroke="#536d65" stroke-width="9"/><path d="M${x+15} ${y+65}h${w-31}" stroke="#36504a" stroke-width="5"/>`;
  const paper = (x,y,w=86,h=112,stamp=false) => `<path d="M${x} ${y}h${w-15}l15 15v${h-15}H${x}Z" fill="#cfdbcc"/><path d="M${x+w-15} ${y}v15h15" fill="#93b0a6"/><path d="M${x+12} ${y+27}h${w-26}m-${w-26} 12h${w-33}m-${w-33} 12h${w-26}m-${w-26} 12h${w-39}" fill="none" stroke="#607b70" stroke-width="3"/>${stamp ? `<g transform="rotate(-12 ${x+w/2} ${y+h-25})"><rect x="${x+9}" y="${y+h-39}" width="${w-18}" height="23" fill="none" stroke="#987457" stroke-width="2"/>${text(x+w/2,y+h-23,'REVIEW',10,'#806248','text-anchor="middle" letter-spacing="1"')}</g>`:''}`;
  const light = (x,y,w=70) => `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="#7cdcca"/><rect x="${x-3}" y="${y-3}" width="${w+6}" height="10" rx="5" fill="#7cdcca" opacity=".08"/>`;
  const label = (i,x,y,w) => `<g class="inspection-label"><rect x="${x}" y="${y}" width="${w}" height="42" rx="6" fill="#10282b" stroke="${inspected.has(i)?'#7cdcca':'#637c73'}"/><circle cx="${x+22}" cy="${y+21}" r="11" fill="${inspected.has(i)?'#7cdcca':'#d4bd87'}"/>${inspected.has(i)?`<path d="M${x+17} ${y+21}l3 3 7-7" stroke="#122c2b" fill="none" stroke-width="2.5" stroke-linecap="round"/>`:text(x+22,y+26,i+1,15,'#122c2b','text-anchor="middle" font-weight="700"')}${text(x+42,y+27,labels[i],16,inspected.has(i)?'#b8f0df':'#e8eee5','font-weight="500"')}</g>`;
  const hotspot = (i, art, x, y, w) => `<g class="hotspot${inspected.has(i)?' is-inspected':''}" role="button" tabindex="0" data-inspect="${i}" aria-label="Inspect ${labels[i]}${inspected.has(i)?', already inspected':''}"><title>Inspect ${labels[i]}</title>${art}${label(i,x,y,w)}</g>`;
  let art = '';
  if (room === 0) {
    art += hotspot(0,
      `<path d="M118 323v-141h24" fill="none" stroke="#37544f" stroke-width="8"/>`+
      screen(100,145,223,137,text(120,181,'SHIFT 06 / BRIEFING',14,'#7cdcca','letter-spacing="1"')+`<path d="M122 206h154m-154 14h122m-122 14h142" stroke="#557c70" stroke-width="5"/><rect x="121" y="250" width="89" height="11" fill="#ebba73" opacity=".65"/>`)+
      cabinet(100,302,214,44,`<path d="M117 318h161m-161 12h80" stroke="#29473f" stroke-width="5"/>`),84,379,220);
    art += hotspot(1,
      cabinet(432,145,154,207,`<rect x="449" y="168" width="120" height="157" rx="3" fill="#1b3535" stroke="#719587"/>${text(509,193,'PERSONNEL',13,'#96b7a9','text-anchor="middle" letter-spacing="2"')}<rect x="468" y="210" width="83" height="85" rx="4" fill="#b4c6b5"/><circle cx="509" cy="236" r="12" fill="#536f64"/><path d="M486 269q0-21 23-21t23 21" fill="#536f64"/><path d="M487 280h44" stroke="#536f64" stroke-width="3"/>${light(481,310,56)}${bolt(442,155)}${bolt(576,155)}`),403,379,215);
    art += hotspot(2,
      table(695,294,206)+paper(721,178,77,112)+paper(804,202,70,91)+`<path d="M711 182v-20h165v122" fill="none" stroke="#37564f" stroke-width="5"/><circle cx="728" cy="169" r="4" fill="#ebba73"/><path d="M696 277h183" stroke="#29413c" stroke-width="5"/>`,713,379,191);
  } else if (room === 1) {
    art += hotspot(0,
      cabinet(102,118,180,235,`<rect x="118" y="133" width="148" height="204" fill="#183234"/><path d="M137 150h109" stroke="#9cb6a8" stroke-width="4"/><path d="M185 144v11l-40 19m40-19 39 19" fill="none" stroke="#718f80" stroke-width="3"/><path d="M174 166q10-6 21 0l32 22 11 66-19 5-12-46v50l14 54-26 1-12-49-12 49-24-1 14-54v-50l-12 46-18-5 10-66Z" fill="#adbbb2" stroke="#d4dfd3" stroke-width="2"/><path d="M179 176h8v77" stroke="#7c9587" stroke-width="2"/><path d="M172 167l10 14 12-14" fill="none" stroke="#698674" stroke-width="3"/>`),84,383,226);
    art += hotspot(1,
      `<path d="M402 353V114h196v239" fill="#38534e" stroke="#6e8d7c" stroke-width="2"/><path d="M418 353V132h164v221" fill="#0b2023"/><path d="M432 342V145h67v197m6 0V145h62v197" fill="#294643" stroke="#547163"/><path d="M447 169h37v117h-37Zm73 0h31v117h-31Z" fill="url(#${id}-glass)" stroke="#7da38e"/><path d="M453 172l27 30m-27 38 27 30m45-96 21 23" stroke="#c0e6d2" opacity=".13" stroke-width="8"/><path d="M490 243v38m25-38v38" stroke="#99b6a5" stroke-width="4"/>${light(450,122,103)}<g transform="translate(570 94)"><rect width="39" height="21" rx="4" fill="#b6c6b6"/><path d="M39 7l11-5v17l-11-5" fill="#4c685d"/><circle cx="18" cy="11" r="6" fill="#182e2e"/></g>`,399,383,205);
    art += hotspot(2,
      cabinet(727,254,138,98,`<path d="M743 287h106m-106 13h106m-106 13h106" stroke="#28423c" stroke-width="5"/>`)+screen(717,170,157,74,`<path d="M731 215h24l11-23 11 37 11-27 11 13h59" fill="none" stroke="#ebba73" stroke-width="2.5"/>`)+`<path d="M795 163v-29" stroke="#435f54" stroke-width="7"/><circle cx="795" cy="126" r="11" fill="#ebba73"/><circle cx="795" cy="126" r="19" fill="#ebba73" opacity=".08"/>`,669,383,270);
  } else if (room === 2) {
    art += hotspot(0,
      screen(88,146,233,173,`${text(106,178,'FROM SAND TO CIRCUITS',13,'#96cdbc','letter-spacing=".5"')}<g stroke="#7cdcca" fill="none" stroke-width="2"><rect x="108" y="197" width="40" height="42" rx="3"/><path d="M117 228l11-19 12 19Z"/><path d="M155 218h16m-5-5 5 5-5 5"/><circle cx="195" cy="219" r="20"/><path d="M187 210h16v17h-16Zm-5 31h27"/><path d="M222 218h17m-5-5 5 5-5 5"/><rect x="249" y="198" width="44" height="41" rx="3"/><path d="M258 204h26v28h-26Zm-4 51h30"/></g><path d="M108 276h174m-174 13h123" stroke="#4d7568" stroke-width="4"/>`)+`<path d="M199 325v31m-49 0h98" stroke="#405e53" stroke-width="8"/>`,89,382,227);
    art += hotspot(1,
      table(390,302,228)+`<path d="M436 296l-12-63m149 63 12-63" stroke="#6b8976" stroke-width="8"/><ellipse cx="507" cy="216" rx="76" ry="27" fill="#52786c" opacity=".35"/><path d="M431 172v96c0 35 152 35 152 0v-96" fill="url(#${id}-glass)" stroke="#a4c9b1" stroke-width="2"/><ellipse cx="507" cy="172" rx="76" ry="27" fill="#668e80" fill-opacity=".22" stroke="#b8d8c1" stroke-width="2"/><ellipse cx="507" cy="172" rx="63" ry="19" fill="#172f2f" fill-opacity=".6" stroke="#83b6a2"/><path d="M444 176v83q0 23 48 25m69-108v76" fill="none" stroke="#d2eee0" opacity=".3" stroke-width="4"/>${text(508,229,'SiO₂',31,'#cce6d7','text-anchor="middle" font-weight="300"')}`,395,382,228);
    art += hotspot(2,
      cabinet(731,285,150,62,`<path d="M743 314h124" stroke="#314b40" stroke-width="6"/>`)+`<path d="M781 288l-21-29m62 29 15-29" stroke="#718c7a" stroke-width="8"/><ellipse cx="801" cy="216" rx="77" ry="84" fill="#33464a" stroke="#a4bfa8" stroke-width="4"/><ellipse cx="801" cy="216" rx="70" ry="77" fill="url(#${id}-wafer)"/><g clip-path="url(#${id}-waferClip)" stroke="#86acbd" stroke-width="1" opacity=".55">${Array.from({length:11},(_,i)=>`<path d="M${734+i*14} 135v160M729 ${146+i*14}h145"/>`).join('')}</g><path d="M786 296h28" stroke="#12282b" stroke-width="6"/><path d="M747 173q19-30 53-31" stroke="#cfdfcc" stroke-width="3" fill="none" opacity=".6"/>`,703,382,206);
  } else if (room === 3) {
    art += hotspot(0,
      cabinet(106,284,203,62,`<rect x="124" y="304" width="120" height="18" rx="3" fill="#314b41"/>`)+screen(109,146,198,122,`${text(125,177,'PASS / FAIL LIMITS',14,'#a3dcc6')}<path d="M126 192h160m-160 26h160m-160 25h160M220 185v59" stroke="#3c6659"/><rect x="235" y="199" width="40" height="9" rx="3" fill="#7cdcca"/><rect x="244" y="226" width="31" height="9" rx="3" fill="#ebba73"/><path d="M127 203h65m-65 25h53" stroke="#729b89" stroke-width="4"/>`),78,382,248);
    art += hotspot(1,
      table(383,299,238)+`<path d="M401 192v-59h201v59" fill="none" stroke="#78907c" stroke-width="10"/><path d="M500 138v36" stroke="#7cdcca" stroke-width="3"/><path d="M489 174h23l-6 23h-11Z" fill="#adc7b0"/><path d="M499 196v83" stroke="#7cdcca" opacity=".25" stroke-width="2"/><ellipse cx="499" cy="282" rx="89" ry="9" fill="#7cdcca" opacity=".08"/>`+[429,490,551].map((x,i)=>`<rect x="${x}" y="227" width="36" height="56" rx="6" fill="url(#${id}-glass)" stroke="#8fae94"/><rect x="${x-3}" y="219" width="42" height="12" rx="2" fill="#839d85"/>${text(x+18,264,['A','B','C'][i],19,'#dbe7d4','text-anchor="middle"')}<ellipse cx="${x+18}" cy="276" rx="14" ry="4" fill="${i===1?'#ebba73':'#7cdcca'}" opacity=".45"/>`).join(''),368,382,276);
    art += hotspot(2,
      table(714,299,173)+`<g transform="rotate(8 804 242)">${paper(746,175,101,119)}</g><path d="M864 208l-7 77" stroke="#ebba73" stroke-width="6" stroke-linecap="round"/><path d="M731 185v-56h76" fill="none" stroke="#6b8570" stroke-width="7"/><path d="M793 129l24-10 22 31-47 2Z" fill="#819784"/><path d="M798 154l-60 125h146l-55-124" fill="#ebba73" opacity=".035"/>`,717,382,185);
  } else if (room === 4) {
    art += hotspot(0,
      cabinet(112,271,183,79,`<rect x="130" y="291" width="147" height="30" rx="3" fill="#29463d"/><path d="M148 306h65" stroke="#56735f" stroke-width="5"/>`)+screen(109,142,186,113,`${text(126,173,'SECOND SOURCE',14,'#d9b580','letter-spacing="1"')}<path d="M127 192h148m-148 14h104m-104 14h128" stroke="#6f7160" stroke-width="4"/><rect x="127" y="232" width="65" height="7" fill="#ebba73"/>`,true),79,382,247);
    art += hotspot(1,
      table(395,301,220)+cabinet(420,217,161,69,`<path d="M439 229h123v24H439Z" fill="#203c33"/><circle cx="568" cy="269" r="4" fill="#7cdcca"/>`)+paper(446,149,105,91)+`<path d="M444 254h107l14 41H431Z" fill="#d0d9c5"/><path d="M449 269h94m-97 10h77" stroke="#718c73" stroke-width="2"/>`,386,382,238);
    art += hotspot(2,
      cabinet(732,136,143,215,`${[153,214,275].map((y,i)=>`<rect x="745" y="${y}" width="117" height="54" fill="#526d57" stroke="#8ba184"/><rect x="780" y="${y+10}" width="47" height="16" fill="#adb99a"/><path d="M786 ${y+36}h35" stroke="#263f32" stroke-width="5"/>${i===2?`<circle cx="848" cy="${y+36}" r="4" fill="#7cdcca"/>`:''}`).join('')}`)+`<path d="M781 136l4-40h82l-8 40" fill="#b6c4a7" stroke="#6d8b71"/><path d="M798 108h48m-50 10h37" stroke="#60816a" stroke-width="3"/>`,696,382,230);
  } else {
    art += hotspot(0,
      `<path d="M103 354l20-15h184l-20 15Z" fill="#5d7159"/><path d="M103 354h184v12H103Z" fill="#2f4938"/><path d="M287 354l20-15v12l-20 15Z" fill="#243c30"/>`+cabinet(119,237,147,100,`<path d="M145 237v100m90-100v100" stroke="#d0b276" stroke-width="8"/><rect x="157" y="255" width="66" height="48" fill="#c0c8aa"/>${text(190,277,'NOVA',12,'#395345','text-anchor="middle" font-weight="700"')}<path d="M168 288h44" stroke="#65816b" stroke-width="3"/>`)+`<g transform="rotate(-9 211 213)">${paper(173,133,88,115)}</g>`,79,387,243);
    art += hotspot(1,
      screen(369,132,276,181,`<g stroke="#385d4f" fill="none"><path d="M390 159h230m-230 32h230m-230 32h230m-230 32h230m-230 32h230M410 151v146m40-146v146m40-146v146m40-146v146m40-146v146m40-146v146"/></g><path d="M408 279l47-41h75l46-47h39" fill="none" stroke="#7cdcca" stroke-width="4" stroke-linejoin="round"/><path d="M408 279l14-95h68l52 96h61" fill="none" stroke="#71856c" stroke-width="2" stroke-dasharray="5 5"/><circle cx="408" cy="279" r="7" fill="#e8eee5"/><circle cx="575" cy="191" r="9" fill="#ebba73"/><circle cx="615" cy="191" r="5" fill="#7cdcca"/>${text(393,173,'TRANSPORT GRID',13,'#b7c7af','letter-spacing="1"')}`)+`<path d="M506 320v38m-59 0h118" stroke="#45634f" stroke-width="8"/>`,400,387,207);
    art += hotspot(2,
      cabinet(732,233,145,119,`<rect x="745" y="252" width="118" height="28" fill="#18392e"/><path d="M756 266h96" stroke="#7cdcca" stroke-width="3"/><path d="M750 300h111m-111 12h111m-111 12h111" stroke="#2d4b38" stroke-width="5"/>`)+`<path d="M724 244v-94h171v94" fill="none" stroke="#68886d" stroke-width="15"/><path d="M731 158h157" stroke="#7cdcca" stroke-width="3"/><path d="M753 177v64m19-64v64m19-64v64m19-64v64m19-64v64m19-64v64m19-64v64" stroke="#7cdcca" stroke-width="1" opacity=".11"/>${paper(773,177,60,64)}<circle cx="895" cy="180" r="7" fill="#ebba73"/>`,670,387,272);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 470" class="lab-scene" role="group" aria-label="Room ${room+1}: ${titles[room]}. Inspect three pieces of equipment."><defs>
    <linearGradient id="${id}-wall" x2="0" y2="1"><stop stop-color="#1d3938"/><stop offset="1" stop-color="#112b2d"/></linearGradient>
    <linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#314a40"/><stop offset="1" stop-color="#172d2b"/></linearGradient>
    <linearGradient id="${id}-metal" x2="1" y2="1"><stop stop-color="#6e8672"/><stop offset="1" stop-color="#425f51"/></linearGradient>
    <linearGradient id="${id}-screen" x2="0" y2="1"><stop stop-color="#0a2427"/><stop offset="1" stop-color="#12342f"/></linearGradient>
    <linearGradient id="${id}-glass" x2="1" y2="0"><stop stop-color="#9cd8c5" stop-opacity=".25"/><stop offset=".25" stop-color="#c1e9d6" stop-opacity=".08"/><stop offset=".65" stop-color="#97c6bd" stop-opacity=".15"/><stop offset="1" stop-color="#bce3d0" stop-opacity=".32"/></linearGradient>
    <linearGradient id="${id}-wafer" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60738b"/><stop offset=".4" stop-color="#445f72"/><stop offset=".6" stop-color="#466778"/><stop offset=".82" stop-color="#8c8a79"/><stop offset="1" stop-color="#3e6471"/></linearGradient>
    <radialGradient id="${id}-ambient"><stop stop-color="#7cdcca" stop-opacity=".1"/><stop offset="1" stop-color="#7cdcca" stop-opacity="0"/></radialGradient>
    <pattern id="${id}-scan" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0h5" stroke="#a1e6c8" stroke-opacity=".025"/></pattern>
    <clipPath id="${id}-waferClip"><ellipse cx="801" cy="216" rx="69" ry="76"/></clipPath>
    <filter id="${id}-glow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#7cdcca" flood-opacity=".28"/></filter>
  </defs><style>
    .lab-scene{display:block;width:100%;height:auto;font-family:Inter,Segoe UI,Arial,sans-serif}.lab-scene .hotspot{cursor:pointer;outline:none}.lab-scene .hotspot .inspection-label rect{transition:stroke .2s,fill .2s}.lab-scene .hotspot:hover .inspection-label rect,.lab-scene .hotspot:focus .inspection-label rect{stroke:#c0f3df;stroke-width:2;fill:#254b43}.lab-scene .hotspot:hover,.lab-scene .hotspot:focus{filter:url(#${id}-glow)}.lab-scene .hotspot:focus-visible .inspection-label rect{stroke:#f6d894;stroke-width:3}
  </style><rect width="1000" height="470" fill="#0b171a"/><path d="M0 0h1000v340H0Z" fill="url(#${id}-wall)"/><path d="M0 340h1000v130H0Z" fill="url(#${id}-floor)"/><ellipse cx="500" cy="210" rx="480" ry="235" fill="url(#${id}-ambient)"/>
  <path d="M0 337h1000M45 0v335M954 0v335" stroke="#466055" stroke-width="2"/><path d="M0 0l45 29v306L0 351m1000-351-46 29v306l46 16" fill="#10272a" opacity=".75"/><path d="M45 64h909M45 89h909" stroke="#3c574d" opacity=".35"/>
  <g stroke="#759381" stroke-width="1" opacity=".12"><path d="M0 373h1000M0 413h1000M0 466h1000M52 340-73 470m221-130L59 470m185-130-54 130m150-130-20 130m116-130 15 130m81-130 49 130m47-130 84 130m12-130 118 130m-22-130 152 130m-56-130 187 130"/></g>
  <path d="M64 110h281m312 0h281" stroke="#547061" stroke-width="3"/><path d="M64 115h281m312 0h281" stroke="#152e2c" stroke-width="4"/>
  <path d="M325 89v233q0 13 16 13h24m283-246v233q0 13 16 13h27" fill="none" stroke="#466556" stroke-width="4"/><path d="M330 89v232q0 9 14 9h21" fill="none" stroke="#789480" opacity=".25" stroke-width="1"/>
  ${text(70,46,`0${room+1} / ${titles[room].toUpperCase()}`,16,'#ceddcd','letter-spacing="2" font-weight="500"')}${text(930,46,'NOVA  /  2038',14,'#809f8e','text-anchor="end" letter-spacing="3"')}
  ${text(651,290,`0${room+1}`,181,'#c0dfc0','opacity=".035" font-weight="300" letter-spacing="-16"')}
  <g opacity=".65">${light(83,78,228)}${light(390,78,228)}${light(697,78,228)}</g>
  <ellipse cx="201" cy="354" rx="138" ry="13" fill="#081d20" opacity=".35"/><ellipse cx="500" cy="358" rx="147" ry="15" fill="#081d20" opacity=".4"/><ellipse cx="798" cy="355" rx="136" ry="14" fill="#081d20" opacity=".35"/>
  ${art}<path d="M74 447h95m6 0h9m12 0h9" stroke="#9d9270" stroke-width="3" opacity=".65"/>${text(930,451,'INSPECT • COLLECT • CONNECT',11,'#739486','text-anchor="end" letter-spacing="2"')}</svg>`;
};

function cameraArt(kind){
 const base='<path d="M8 74H172M18 77v8m144-8v8" stroke="#53776a" stroke-width="2"/><path d="M10 22H170M28 12V72M155 12V72" stroke="#2a4e46"/>';
 let art='';
 if(kind==='carrier')art='<path d="M42 38l55-10 38 13v31H42Z" fill="#315d52" stroke="#86c8b4"/><path d="M42 38h93l-7-8H50Z" fill="#759991"/><path d="M85 39v31" stroke="#8db7a9"/><rect x="71" y="49" width="34" height="14" rx="2" fill="#142e27"/><path d="m82 55 4 4 8-8" fill="none" stroke="#9bdac1" stroke-width="2"/>';
 if(kind==='drink')art='<ellipse cx="55" cy="65" rx="24" ry="7" fill="#7fa2ac"/><path d="M96 35h30l-3 36h-24Z" fill="#c99f6f"/><path d="M127 43q18-2 11 16h-14" fill="none" stroke="#c99f6f" stroke-width="5"/><ellipse cx="111" cy="35" rx="15" ry="4" fill="#5c412a"/><path d="M108 31q-8-10 0-17m11 15q-8-8 0-14" stroke="#a2c3ad" fill="none"/>';
 if(kind==='hair'||kind==='gown')art=`<path d="M65 45q-18 8-19 27h88q-2-22-21-27" fill="#7b9e97"/><path d="M65 49V27q22-22 45 0v25" fill="#a7beb0" stroke="#d4e0d1"/><rect x="72" y="30" width="32" height="23" rx="8" fill="#ccb193"/><path d="M71 43h34v15H73Z" fill="#536f72"/>${kind==='hair'?'<path d="M72 21q-16-6-16 17l-2 19m11-32q-11 0-11 21" fill="none" stroke="#b48b53" stroke-width="5"/><path d="M112 23q16 4 10 27" stroke="#b48b53" stroke-width="4" fill="none"/>':'<path d="M47 62h14v10H46m73-10h14v10h-14" fill="#d4e0d1"/><path d="M65 27q25-23 45 0" fill="none" stroke="#d7e4d3" stroke-width="4"/>'}`;
 if(kind==='cardboard')art='<path d="M54 42l39-12 37 13-38 13Z" fill="#b79765"/><path d="M54 42v29l38 9V56Z" fill="#967244"/><path d="M92 56v24l38-13V43Z" fill="#715838"/><path d="m74 36 37 14v23" stroke="#c8af7c" stroke-width="8"/><ellipse cx="147" cy="70" rx="19" ry="5" fill="#83a5aa"/>';
 if(kind==='hand')art='<ellipse cx="85" cy="64" rx="43" ry="11" fill="#648c94" stroke="#a7c0bf"/><path d="M50 64h70m-53-7 7 14m6-17 8 21m5-19 8 16" stroke="#34525b"/><path d="m126 15-11 25-32 17q-4 9 4 10l34-14 19-31" fill="#caaa8b" stroke="#ead3b1" stroke-width="2"/><path d="m119 41 8 6" stroke="#9d755a"/>';
 if(kind==='snack')art='<rect x="52" y="44" width="70" height="20" rx="4" fill="#d9a25e" stroke="#f0c98a"/><path d="M60 48h54" stroke="#8a5a2b" stroke-width="3" stroke-dasharray="6 5"/><path d="M58 64l8-4m30 4 8-4" stroke="#c48a47" stroke-width="3"/><circle cx="133" cy="66" r="3" fill="#d9a25e"/><circle cx="143" cy="70" r="2" fill="#d9a25e"/>';
 if(kind==='pencil')art='<path d="M40 40h58v34H40Z" fill="#e8e3cf" stroke="#b9b39a"/><path d="M46 50h46m-46 8h46m-46 8h34" stroke="#8aa5c4"/><path d="M110 70l42-34 6 6-42 34-9 3Z" fill="#e7b84c" stroke="#8c6a1f"/><path d="M107 79l3-9 6 6Z" fill="#3b2a12"/>';
 if(kind==='mask')art='<path d="M65 49V27q22-22 45 0v25" fill="#a7beb0" stroke="#d4e0d1"/><rect x="72" y="30" width="32" height="26" rx="8" fill="#ccb193"/><circle cx="81" cy="38" r="2" fill="#2b3b3a"/><circle cx="96" cy="38" r="2" fill="#2b3b3a"/><path d="M85 44q3 4 6 0" stroke="#7d5c44" fill="none" stroke-width="2"/><path d="M70 55h36l-4 12H74Z" fill="#dce8e6" stroke="#9fb7b4"/><path d="M65 45q-18 8-19 27h88q-2-22-21-27" fill="#7b9e97"/><text x="122" y="40" fill="#ffb4a5" font-size="18" font-family="monospace">!</text>';
 if(kind==='tweezers')art='<ellipse cx="78" cy="66" rx="40" ry="10" fill="#648c94" stroke="#a7c0bf"/><path d="M106 60l36-36m-30 40 36-36" stroke="#cfd8d6" stroke-width="4" stroke-linecap="round"/><path d="m146 12 18 8-10 18-14-6Z" fill="#cfe3ec" stroke="#eef6f8" stroke-width="2"/><path d="m142 34 6 4" stroke="#9cb9c4"/>';
 if(kind==='cleanpaper')art='<path d="M48 26h64v52H48Z" fill="#f2f6f4" stroke="#c4d6cf"/><path d="M56 38h48m-48 9h48m-48 9h36m-36 9h42" stroke="#94b8ad"/><path d="M122 70l30-44 5 3-30 44-6 3Z" fill="#7fb7d6" stroke="#2f5d75"/><text x="54" y="22" fill="#9bdac1" font-size="8" font-family="monospace">LINT-FREE</text>';
 return `<svg viewBox="0 0 180 90" aria-hidden="true">${base}${art}<text x="11" y="14" fill="#88bda8" font-size="7" font-family="monospace">CAM // 02</text><circle cx="165" cy="12" r="2" fill="#86d9b9"/></svg>`;
}

/* ---------- Story cast portraits ---------- */
window.portrait = function portrait(id) {
  const eyes = (y, c = '#1d1410') => `<circle cx="53" cy="${y}" r="2.6" fill="${c}"/><circle cx="67" cy="${y}" r="2.6" fill="${c}"/>`;
  const art = {
    sam: `<circle cx="60" cy="60" r="60" fill="#123a3f"/><path d="M12 120c4-27 22-39 48-39s44 12 48 39Z" fill="#dfe8ea"/><path d="M60 84v36" stroke="#9fb3b6" stroke-width="2"/>
      <path d="M29 64c0-26 13-43 31-43s31 17 31 43v16c-8 7-19 10-31 10s-23-3-31-10Z" fill="#eef4f5"/><ellipse cx="60" cy="57" rx="19" ry="22" fill="#a86d47"/>
      <path d="M48 47q5-3 10 0M62 47q5-3 10 0" stroke="#2b190f" stroke-width="2.4" fill="none" stroke-linecap="round"/>${eyes(53)}
      <path d="M41 60h38v9c0 11-9 16-19 16s-19-5-19-16Z" fill="#cfe0e6"/><path d="M45 66h30M46 72h28" stroke="#b3c9d0"/>
      <rect x="72" y="97" width="18" height="11" rx="2" fill="#66e3c4"/><path d="M75 102h12" stroke="#0b3a30" stroke-width="2"/>`,
    mira: `<circle cx="60" cy="60" r="60" fill="#2a2546"/><path d="M33 68c-2-29 10-46 27-46s29 17 27 46c0 13-6 19-11 21H44c-5-2-11-8-11-21Z" fill="#241c1a"/>
      <rect x="53" y="72" width="14" height="14" fill="#d9a882"/><path d="M14 120c4-25 21-37 46-37s42 12 46 37Z" fill="#2f5d73"/><path d="M50 83l10 17 10-17Z" fill="#eef5f2"/>
      <ellipse cx="60" cy="55" rx="18" ry="21" fill="#e6b994"/><path d="M41 51c3-15 14-22 27-20 7 2 12 8 12 17-11-7-25-5-39 3Z" fill="#241c1a"/>${eyes(55)}
      <path d="M52 66q8 6 16 0" stroke="#8a4632" fill="none" stroke-width="2.2" stroke-linecap="round"/><path d="M47 85l13 23 13-23" stroke="#f3c77b" fill="none" stroke-width="2.5"/><rect x="54" y="106" width="12" height="11" rx="1.5" fill="#f3c77b"/>`,
    nova: `<circle cx="60" cy="60" r="60" fill="#0d2230"/><circle cx="60" cy="60" r="44" fill="#66e3c4" opacity=".08"/>
      <g stroke="#66e3c4" stroke-width="3" stroke-linecap="round">${[42,54,66,78].map(p => `<path d="M${p} 22v8M${p} 90v8M22 ${p}h8M90 ${p}h8"/>`).join('')}</g>
      <rect x="30" y="30" width="60" height="60" rx="11" fill="#163a47" stroke="#66e3c4" stroke-width="2.5"/>
      <rect class="nova-eye" x="41" y="50" width="13" height="7" rx="3.5" fill="#66e3c4"/><rect class="nova-eye" x="66" y="50" width="13" height="7" rx="3.5" fill="#66e3c4"/>
      <path d="M44 72h6l3-5 4 9 4-9 4 9 3-4h8" fill="none" stroke="#f3c77b" stroke-width="2" stroke-linejoin="round"/>`
  }[id] || '';
  return `<svg viewBox="0 0 120 120" class="portrait" aria-hidden="true">${art}</svg>`;
};

/* ---------- Clue-file figures ---------- */
window.FIG = (() => {
  const t = (x, y, s, size = 13, c = '#cfe3dc', a = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${c}" text-anchor="${a}" font-family="Inter,Segoe UI,sans-serif">${s}</text>`;
  const fig = (svg, cap, vb = '0 0 520 170') => `<figure class="fig"><svg viewBox="${vb}" role="img" aria-label="${cap}">${svg}</svg><figcaption>${cap}</figcaption></figure>`;
  const grid = (cx, cy, r, step, id) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#${id})" stroke="#a9bde8" stroke-opacity=".45">${Array.from({length: Math.ceil(2*r/step)+1}, (_, i) => `<path d="M${cx-r+i*step} ${cy-r}v${2*r}M${cx-r} ${cy-r+i*step}h${2*r}"/>`).join('')}</g>`;
  const arrow = (x1, y, x2, label) => `<path d="M${x1} ${y}H${x2}" stroke="#66e3c4" stroke-width="2.5"/><path d="M${x2-8} ${y-6}l8 6-8 6" fill="none" stroke="#66e3c4" stroke-width="2.5"/>${label ? t((x1+x2)/2, y-10, label, 12, '#66e3c4', 'middle') : ''}`;
  return {
    gown: () => fig(`
      <path d="M150 14c-17 0-27 13-27 29v14h54V43c0-16-10-29-27-29Z" fill="#eef4f5"/><ellipse cx="150" cy="45" rx="13" ry="15" fill="#c9966c"/>
      <circle cx="145" cy="41" r="2" fill="#2b190f"/><circle cx="155" cy="41" r="2" fill="#2b190f"/><path d="M137 47h26v7c0 7-6 10-13 10s-13-3-13-10Z" fill="#cfe0e6"/>
      <path d="M118 63h64l10 70h-84Z" fill="#dfe8ea"/><path d="M150 66v66" stroke="#9fb3b6"/><path d="M120 68l-19 44M180 68l19 44" stroke="#dfe8ea" stroke-width="13" stroke-linecap="round"/>
      <circle cx="99" cy="116" r="8" fill="#7fb7d6"/><circle cx="201" cy="116" r="8" fill="#7fb7d6"/><rect x="128" y="133" width="17" height="20" fill="#dfe8ea"/><rect x="155" y="133" width="17" height="20" fill="#dfe8ea"/>
      <rect x="124" y="151" width="24" height="11" rx="4" fill="#9fb3b6"/><rect x="152" y="151" width="24" height="11" rx="4" fill="#9fb3b6"/>
      <g stroke="#f3c77b" stroke-width="1.5" fill="none"><path d="M168 20H262"/><path d="M164 54H262"/><path d="M188 92H262"/><path d="M210 116H262"/><path d="M177 157H262"/></g>
      <g fill="#f3c77b"><circle cx="168" cy="20" r="3"/><circle cx="164" cy="54" r="3"/><circle cx="188" cy="92" r="3"/><circle cx="210" cy="116" r="3"/><circle cx="177" cy="157" r="3"/></g>
      ${t(270,25,'Hood covers all hair')}${t(270,59,'Mask over nose and mouth')}${t(270,97,'Clean gown, zipped up')}${t(270,121,'Clean gloves, never bare hands')}${t(270,162,'Boot covers')}`,
      'Figure: a fully gowned cleanroom worker'),
    wafer: () => fig(`
      <circle cx="105" cy="85" r="72" fill="#4d5f86" stroke="#22324a" stroke-width="6"/>${grid(105, 85, 72, 16, 'fw1')}
      <rect x="113" y="69" width="16" height="16" fill="#f3c77b"/>${arrow(190, 85, 300, 'zoom in')}
      <rect x="320" y="25" width="120" height="120" rx="4" fill="#1b2d45" stroke="#f3c77b" stroke-width="3"/>
      <g stroke="#66e3c4" stroke-width="2" fill="none"><path d="M335 45h40v25h45M335 80h25v40h70M395 40v65h-30M410 125V95h20"/></g>
      ${t(380,163,'one chip (a “die”)',13,'#f3c77b','middle')}${t(105,166,'one silicon wafer',13,'#cfe3dc','middle')}`,
      'Figure: hundreds of identical chips are built side by side on one wafer'),
    dice: () => fig(`
      <circle cx="70" cy="85" r="52" fill="#4d5f86" stroke="#22324a" stroke-width="5"/>${grid(70, 85, 52, 13, 'fw2')}${t(70,160,'tested wafer',12,'#cfe3dc','middle')}
      ${arrow(135, 85, 205, 'dice')}
      <g fill="#4d5f86" stroke="#a9bde8">${[[222,52],[262,52],[222,92],[262,92]].map(([x,y]) => `<rect x="${x}" y="${y}" width="30" height="30"/>`).join('')}</g>${t(257,160,'separate chips',12,'#cfe3dc','middle')}
      ${arrow(310, 85, 380, 'package')}
      <rect x="400" y="55" width="80" height="60" rx="6" fill="#1a1f24" stroke="#56636c" stroke-width="2"/><circle cx="412" cy="67" r="4" fill="#56636c"/>
      <g stroke="#c9ced3" stroke-width="4">${[0,1,2,3,4].map(i => `<path d="M${410+i*15} 115v14M${410+i*15} 55V41"/>`).join('')}</g>${t(440,160,'packaged chip',12,'#cfe3dc','middle')}`,
      'Figure: after testing, the wafer is cut apart and each chip is packaged'),
    tube: L => fig(`
      <rect x="60" y="60" width="300" height="48" rx="14" fill="#71a39e" stroke="#b8dcc9" stroke-width="2"/><ellipse cx="360" cy="84" rx="9" ry="24" fill="#244647" stroke="#bbdccc"/>
      <path d="M60 135H360M60 127v16M360 127v16" stroke="#f3c77b" stroke-width="2"/>${t(210,157,`must be exactly ${L} cm`,14,'#f3c77b','middle')}
      <path d="M200 60l-8 12 12 6-7 16" fill="none" stroke="#ff9f8f" stroke-width="3.5"/><circle cx="200" cy="40" r="13" fill="none" stroke="#ff9f8f" stroke-width="2.5"/><path d="M191 31l18 18" stroke="#ff9f8f" stroke-width="2.5"/>
      ${t(220,45,'no cracks allowed',14,'#ff9f8f')}${t(420,80,'Both rules',14,'#cfe3dc')}${t(420,98,'must pass',14,'#cfe3dc')}`,
      'Figure: the two inspection rules for a sample tube'),
    hours: () => fig(`
      ${t(20,40,'On the job',14)}<rect x="130" y="24" width="360" height="26" rx="4" fill="#66e3c4"/>${t(482,42,'≈ 4,000 h',13,'#06261f','end')}
      ${t(20,95,'In class',14)}<rect x="130" y="79" width="${Math.round(360*304/4000)}" height="26" rx="4" fill="#f3c77b"/>${t(170,97,'304 h',13,'#f3c77b')}
      <path d="M130 120V14" stroke="#36565d"/>${t(130,145,'Bars drawn to scale: most of the learning happens at work, with a paid sponsor.',12,'#9fb9b6')}`,
      'Figure: apprenticeship training hours, to scale', '0 0 520 155'),
    circuit: () => fig(`
      <path d="M110 40H390V130H110Z" fill="none" stroke="#9fb3b6" stroke-width="3"/>
      <rect x="96" y="66" width="28" height="38" fill="#0a1d23"/><path d="M98 76h24M104 86h12M98 96h24" stroke="#f3c77b" stroke-width="3"/>${t(70,90,'V',18,'#f3c77b','middle')}${t(70,108,'battery',11,'#9fb9b6','middle')}
      <path d="M220 40l8-12 10 24 10-24 10 24 10-24 8 12" fill="#0a1d23" stroke="#66e3c4" stroke-width="3"/>${t(250,20,'R  (resistor, Ω)',13,'#66e3c4','middle')}
      <circle cx="390" cy="85" r="20" fill="#0a1d23" stroke="#b9a6ff" stroke-width="3"/>${t(390,91,'A',16,'#b9a6ff','middle')}${t(450,90,'I  (current)',13,'#b9a6ff','middle')}
      <path d="M250 130h-30m10-6-10 6 10 6" stroke="#b9a6ff" stroke-width="2" fill="none"/>${t(250,155,'current flows around the loop',12,'#9fb9b6','middle')}`,
      'Figure: a simple test circuit with a battery (V), a resistor (R) and an ammeter measuring current (I)'),
    certificate: () => fig(`
      <rect x="130" y="12" width="260" height="146" rx="6" fill="#f4efe1" stroke="#c9b98a" stroke-width="3"/><rect x="140" y="22" width="240" height="126" fill="none" stroke="#d8cba3"/>
      ${t(260,50,'CERTIFICATE OF',12,'#6b5a33','middle')}${t(260,70,'APPRENTICESHIP',18,'#3a2f16','middle')}${t(260,92,'Micro Electronics Manufacturer · 630A',11,'#6b5a33','middle')}
      <path d="M170 125h80" stroke="#8a7a52"/>${t(210,140,'signed off',9,'#8a7a52','middle')}<circle cx="330" cy="122" r="17" fill="#f3c77b" stroke="#c9963a" stroke-width="2"/><path d="M322 136l-4 16 12-6 12 6-4-16" fill="#c9963a"/>`,
      'Figure: the credential earned when the apprenticeship is complete')
  };
})();
