"use strict";
/* All game artwork as inline SVG. Light, industrial palette; no external images. */
const COL={ink:'#14202d',muted:'#5b6878',line:'#d3dae2',paper:'#eef1f4',blue:'#1c5fd4',accent:'#1c5fd4',amber:'#e3a21a',red:'#c2412d',ok:'#2f7d4f',si:'#8d99ab',skin:'#c98e66'};

/* ---------- Story cast ---------- */
function portrait(id){
 const eyes=y=>`<circle cx="53" cy="${y}" r="2.6" fill="#1d1410"/><circle cx="67" cy="${y}" r="2.6" fill="#1d1410"/>`;
 const art={
  sam:`<circle cx="60" cy="60" r="60" fill="#d9e3ee"/><path d="M12 120c4-27 22-39 48-39s44 12 48 39Z" fill="#fbfcfd" stroke="#c4ccd6"/><path d="M60 84v36" stroke="#b7c0cb" stroke-width="2"/>
   <path d="M29 64c0-26 13-43 31-43s31 17 31 43v16c-8 7-19 10-31 10s-23-3-31-10Z" fill="#fbfcfd" stroke="#c4ccd6"/><ellipse cx="60" cy="57" rx="19" ry="22" fill="#a86d47"/>
   <path d="M48 47q5-3 10 0M62 47q5-3 10 0" stroke="#2b190f" stroke-width="2.4" fill="none" stroke-linecap="round"/>${eyes(53)}
   <path d="M41 60h38v9c0 11-9 16-19 16s-19-5-19-16Z" fill="#dfe9f3" stroke="#a9b8c8"/><rect x="72" y="97" width="18" height="11" rx="2" fill="${COL.blue}"/>`,
  mira:`<circle cx="60" cy="60" r="60" fill="#efe3d6"/><path d="M33 68c-2-29 10-46 27-46s29 17 27 46c0 13-6 19-11 21H44c-5-2-11-8-11-21Z" fill="#2a201c"/>
   <rect x="53" y="72" width="14" height="14" fill="#d9a882"/><path d="M14 120c4-25 21-37 46-37s42 12 46 37Z" fill="#3b4f6b"/><path d="M50 83l10 17 10-17Z" fill="#f6f4ef"/>
   <ellipse cx="60" cy="55" rx="18" ry="21" fill="#e6b994"/><path d="M41 51c3-15 14-22 27-20 7 2 12 8 12 17-11-7-25-5-39 3Z" fill="#2a201c"/>${eyes(55)}
   <path d="M52 66q8 6 16 0" stroke="#8a4632" fill="none" stroke-width="2.2" stroke-linecap="round"/><path d="M47 85l13 23 13-23" stroke="${COL.amber}" fill="none" stroke-width="2.5"/><rect x="54" y="106" width="12" height="11" rx="1.5" fill="${COL.amber}"/>`,
  nova:`<circle cx="60" cy="60" r="60" fill="#14202d"/>
   <g stroke="#7fb0ff" stroke-width="3" stroke-linecap="round">${[42,54,66,78].map(p=>`<path d="M${p} 22v8M${p} 90v8M22 ${p}h8M90 ${p}h8"/>`).join('')}</g>
   <rect x="30" y="30" width="60" height="60" rx="9" fill="#2d3b4d" stroke="#7fb0ff" stroke-width="2.5"/>
   <rect class="nova-eye" x="41" y="50" width="13" height="7" rx="3.5" fill="#bcd6ff"/><rect class="nova-eye" x="66" y="50" width="13" height="7" rx="3.5" fill="#bcd6ff"/>
   <path d="M44 72h6l3-5 4 9 4-9 4 9 3-4h8" fill="none" stroke="#bcd6ff" stroke-width="2" stroke-linejoin="round"/>`
 }[id]||'';
 return `<svg viewBox="0 0 120 120" class="portrait" aria-hidden="true">${art}</svg>`;
}

/* ---------- Gowning avatar: layers appear as the player dresses ---------- */
function gownAvatar(g){
 const skin=COL.skin,white='#fbfcfd',edge='#bcc5cf';
 let s='';
 // street clothes
 s+=`<path d="M86 360v-112h68v112" fill="#2c3e5c"/><path d="M120 252v108" stroke="#22324b" stroke-width="3"/>`;
 s+=`<ellipse cx="102" cy="372" rx="20" ry="9" fill="#2b2b2b"/><ellipse cx="138" cy="372" rx="20" ry="9" fill="#2b2b2b"/>`;
 s+=`<path d="M78 128h84l8 124H70Z" fill="#3f6fa8"/><path d="M80 134l-20 104M160 134l20 104" stroke="${skin}" stroke-width="17" stroke-linecap="round"/>`;
 s+=`<path d="M80 132l-10 40M160 132l10 40" stroke="#3f6fa8" stroke-width="22" stroke-linecap="round"/><circle cx="58" cy="246" r="10" fill="${skin}"/><circle cx="182" cy="246" r="10" fill="${skin}"/>`;
 if(!g.watch)s+=`<g class="removable" data-remove="watch" role="button" tabindex="0" aria-label="Remove wristwatch"><rect x="52" y="222" width="16" height="12" rx="3" fill="#2b2b2b"/><circle cx="60" cy="228" r="4" fill="#dfe6ee"/><circle cx="60" cy="228" r="14" class="hit"/></g>`;
 if(!g.phone)s+=`<g class="removable" data-remove="phone" role="button" tabindex="0" aria-label="Remove phone"><rect x="128" y="262" width="18" height="30" rx="3" fill="#111827"/><rect x="131" y="266" width="12" height="20" fill="#5b8fd6"/><rect x="122" y="256" width="30" height="42" class="hit"/></g>`;
 if(g.coverall){s+=`<path d="M76 124h88l8 128-6 112h-34l-12-100-12 100H74l-6-112Z" fill="${white}" stroke="${edge}"/><path d="M120 128v122" stroke="${edge}" stroke-width="2"/>`;
  s+=`<path d="M80 134l-20 104M160 134l20 104" stroke="${white}" stroke-width="22" stroke-linecap="round"/><path d="M80 134l-20 104M160 134l20 104" stroke="${edge}" stroke-width="22" stroke-linecap="round" fill="none" opacity=".25"/>`;}
 if(g.boots)s+=`<rect x="80" y="318" width="40" height="58" rx="6" fill="#eef2f6" stroke="${edge}"/><rect x="120" y="318" width="40" height="58" rx="6" fill="#eef2f6" stroke="${edge}"/><path d="M80 370h40M120 370h40" stroke="#9aa6b2" stroke-width="6"/>`;
 if(g.gloves)s+=`<circle cx="58" cy="246" r="12" fill="#6aa7d8"/><circle cx="182" cy="246" r="12" fill="#6aa7d8"/><path d="M50 234h18M174 234h18" stroke="#4d8cc0" stroke-width="5"/>`;
 // head
 s+=`<rect x="110" y="104" width="20" height="22" fill="${skin}"/>`;
 s+=`<path d="M90 76c0-32 13-50 30-50s30 18 30 50c-5-12-16-20-30-20s-25 8-30 20Z" fill="#3b2a20"/><path d="M92 70c-6 14-4 30 2 38M148 70c6 14 4 30-2 38" stroke="#3b2a20" stroke-width="8" stroke-linecap="round"/>`;
 s+=`<ellipse cx="120" cy="80" rx="27" ry="31" fill="${skin}"/>`;
 if(g.hairnet)s+=`<path d="M88 72c0-32 14-48 32-48s32 16 32 48c-8-10-19-15-32-15s-24 5-32 15Z" fill="#f4f6f8" stroke="${edge}" stroke-dasharray="3 2"/>`;
 if(g.hood)s+=`<path d="M82 84c0-38 17-62 38-62s38 24 38 62v44H82Z" fill="${white}" stroke="${edge}"/><ellipse cx="120" cy="84" rx="21" ry="25" fill="${skin}"/>`;
 s+=`<circle cx="110" cy="80" r="3" fill="#1d1410"/><circle cx="130" cy="80" r="3" fill="#1d1410"/>`;
 s+=g.mask?`<path d="M100 88h40v12c0 10-9 15-20 15s-20-5-20-15Z" fill="#dfe9f3" stroke="#a9b8c8"/><path d="M100 92l-12-6M140 92l12-6" stroke="#a9b8c8"/>`:`<path d="M112 96q8 6 16 0" stroke="#7a3e2c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
 return `<svg viewBox="0 0 240 390" class="avatar-svg" role="img" aria-label="Worker getting ready for the cleanroom">${s}</svg>`;
}
function garmentIcon(id){
 const w='#fbfcfd',e='#9aa6b2';
 return `<svg viewBox="0 0 48 48" aria-hidden="true">${{
  hairnet:`<path d="M8 30c0-14 7-22 16-22s16 8 16 22Z" fill="${w}" stroke="${e}" stroke-dasharray="3 2"/>`,
  hood:`<path d="M10 42V22c0-10 6-16 14-16s14 6 14 16v20Z" fill="${w}" stroke="${e}"/><ellipse cx="24" cy="24" rx="7" ry="9" fill="#e6d3c3"/>`,
  mask:`<path d="M10 18h28v8c0 8-6 12-14 12s-14-4-14-12Z" fill="#dfe9f3" stroke="#8fa3b8"/><path d="M10 20l-6-4M38 20l6-4" stroke="#8fa3b8"/>`,
  coverall:`<path d="M14 6h20l6 18-4 20h-8l-4-14-4 14h-8L8 24Z" fill="${w}" stroke="${e}"/><path d="M24 7v22" stroke="${e}"/>`,
  boots:`<path d="M8 10h12v26h6v6H8ZM28 10h12v26h6v6H28Z" fill="#eef2f6" stroke="${e}"/>`,
  gloves:`<path d="M12 40V22l-4-8 4-2 3 6V8h3v10V6h3v12V8h3v12l3-6 3 2-4 10v14Z" fill="#6aa7d8" stroke="#4d8cc0"/>`,
  sweater:`<path d="M10 14l8-6h12l8 6-4 8v18H14V22Z" fill="#b5523b"/><path d="M14 26h20M14 32h20" stroke="#8f3b28" stroke-dasharray="2 2"/>`,
  scarf:`<path d="M10 12h28v8H10ZM14 20h8v20h-8Z" fill="#8e6bb8"/><path d="M14 40l2 4 2-4 2 4 2-4" stroke="#8e6bb8" fill="none"/>`
 }[id]||''}</svg>`;
}

/* ---------- CCTV hazard frames (camera screens stay dark: they are monitors) ---------- */
function cameraArt(kind){
 const base='<path d="M8 74H172M18 77v8m144-8v8" stroke="#5b6573" stroke-width="2"/><path d="M10 22H170M28 12V72M155 12V72" stroke="#3a4250"/>';
 const A={
  carrier:'<path d="M42 38l55-10 38 13v31H42Z" fill="#4a5a6e" stroke="#9fb0c4"/><path d="M42 38h93l-7-8H50Z" fill="#8094aa"/><path d="M85 39v31" stroke="#a9b8c8"/><rect x="71" y="49" width="34" height="14" rx="2" fill="#26303c"/><path d="m82 55 4 4 8-8" fill="none" stroke="#9bd4b0" stroke-width="2"/>',
  drink:'<ellipse cx="55" cy="65" rx="24" ry="7" fill="#7f95a8"/><path d="M96 35h30l-3 36h-24Z" fill="#c99f6f"/><path d="M127 43q18-2 11 16h-14" fill="none" stroke="#c99f6f" stroke-width="5"/><ellipse cx="111" cy="35" rx="15" ry="4" fill="#5c412a"/><path d="M108 31q-8-10 0-17m11 15q-8-8 0-14" stroke="#c4ccd6" fill="none"/>',
  hair:'<path d="M65 45q-18 8-19 27h88q-2-22-21-27" fill="#c7cfd8"/><path d="M65 49V27q22-22 45 0v25" fill="#e8ecf0" stroke="#fff"/><rect x="72" y="30" width="32" height="23" rx="8" fill="#ccb193"/><path d="M72 21q-16-6-16 17l-2 19m11-32q-11 0-11 21" fill="none" stroke="#b48b53" stroke-width="5"/><path d="M112 23q16 4 10 27" stroke="#b48b53" stroke-width="4" fill="none"/>',
  gown:'<path d="M65 45q-18 8-19 27h88q-2-22-21-27" fill="#c7cfd8"/><path d="M65 49V27q22-22 45 0v25" fill="#e8ecf0" stroke="#fff"/><rect x="72" y="30" width="32" height="23" rx="8" fill="#ccb193"/><path d="M71 43h34v15H73Z" fill="#9fb3c8"/><path d="M47 62h14v10H46m73-10h14v10h-14" fill="#6aa7d8"/><path d="M65 27q25-23 45 0" fill="none" stroke="#fff" stroke-width="4"/>',
  cardboard:'<path d="M54 42l39-12 37 13-38 13Z" fill="#b79765"/><path d="M54 42v29l38 9V56Z" fill="#967244"/><path d="M92 56v24l38-13V43Z" fill="#715838"/><path d="m74 36 37 14v23" stroke="#c8af7c" stroke-width="8"/><ellipse cx="147" cy="70" rx="19" ry="5" fill="#8d99ab"/>',
  hand:'<ellipse cx="85" cy="64" rx="43" ry="11" fill="#7f8ea3" stroke="#b5c2d2"/><path d="M50 64h70m-53-7 7 14m6-17 8 21m5-19 8 16" stroke="#4b5869"/><path d="m126 15-11 25-32 17q-4 9 4 10l34-14 19-31" fill="#caaa8b" stroke="#ead3b1" stroke-width="2"/>',
  snack:'<rect x="52" y="44" width="70" height="20" rx="4" fill="#d9a25e" stroke="#f0c98a"/><path d="M60 48h54" stroke="#8a5a2b" stroke-width="3" stroke-dasharray="6 5"/><circle cx="133" cy="66" r="3" fill="#d9a25e"/><circle cx="143" cy="70" r="2" fill="#d9a25e"/>',
  pencil:'<path d="M36 30h62l-3 5 4 5-4 6 4 5-3 6 4 5-4 6 3 6H36Z" fill="#e9dcb4" stroke="#b39c66"/><path d="M48 30v44" stroke="#d26b5c" stroke-width="1.2"/><path d="M50 40h42m-42 8h44m-44 8h40m-40 8h43" stroke="#8aa5c4"/><circle cx="40" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="48" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="56" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="64" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="72" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="80" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="88" cy="30" r="2.6" fill="none" stroke="#5b6573" stroke-width="1.6"/><circle cx="103" cy="70" r="1.2" fill="#a59b85"/><circle cx="108" cy="74" r="1.2" fill="#a59b85"/><circle cx="99" cy="77" r="1.2" fill="#a59b85"/><circle cx="112" cy="68" r="1.2" fill="#a59b85"/><circle cx="42" cy="79" r="1.2" fill="#a59b85"/><g transform="rotate(-38 132 52)"><rect x="104" y="47" width="44" height="10" fill="#f2c200" stroke="#9a7a10"/><path d="M104 50h44" stroke="#d9a900"/><rect x="98" y="47" width="7" height="10" fill="#b8bec7" stroke="#6b7480"/><rect x="91" y="47" width="8" height="10" rx="2" fill="#e88aa0" stroke="#b25b70"/><path d="M148 47l12 5-12 5Z" fill="#e3c08f" stroke="#9a7a4d"/><path d="M156 50.4l4 1.6-4 1.6Z" fill="#2b2f36"/></g><path d="M140 74q4-6 9-2q-3 5-9 2Z" fill="#e3c08f" stroke="#9a7a4d" stroke-width=".6"/><circle cx="128" cy="77" r="1.6" fill="#e88aa0"/><circle cx="133" cy="78" r="1.2" fill="#e88aa0"/>',
  mask:'<path d="M65 45q-18 8-19 27h88q-2-22-21-27" fill="#c7cfd8"/><path d="M65 49V27q22-22 45 0v25" fill="#e8ecf0" stroke="#fff"/><rect x="72" y="30" width="32" height="26" rx="8" fill="#ccb193"/><circle cx="81" cy="38" r="2" fill="#2b3b3a"/><circle cx="96" cy="38" r="2" fill="#2b3b3a"/><path d="M70 55h36l-4 12H74Z" fill="#dce8f0" stroke="#9fb3c8"/>',
  tweezers:'<ellipse cx="78" cy="66" rx="40" ry="10" fill="#7f8ea3" stroke="#b5c2d2"/><path d="M106 60l36-36m-30 40 36-36" stroke="#dfe6ee" stroke-width="4" stroke-linecap="round"/><path d="m146 12 18 8-10 18-14-6Z" fill="#6aa7d8" stroke="#a9cdee" stroke-width="2"/>',
  cleanpaper:'<rect x="40" y="22" width="70" height="56" rx="2" fill="#bfe0f5" opacity=".35" stroke="#8cc4e8"/><rect x="44" y="26" width="62" height="50" fill="#ffffff" stroke="#d6e4ee"/><rect x="44" y="26" width="62" height="10" fill="#1c5fd4"/><text x="75" y="33.5" text-anchor="middle" fill="#fff" font-size="5.6" font-family="monospace" font-weight="bold" textLength="56" lengthAdjust="spacingAndGlyphs">CLEANROOM · LINT-FREE</text><path d="M50 44h50m-50 8h50m-50 8h38m-38 8h44" stroke="#b9c6d3"/><g transform="rotate(-55 136 50)"><rect x="112" y="47" width="50" height="6" rx="3" fill="#2f6fd6" stroke="#1b4590"/><rect x="112" y="47" width="14" height="6" rx="3" fill="#e8edf3" stroke="#8a95a3"/><path d="M114 46h16" stroke="#c3cad3" stroke-width="2" stroke-linecap="round"/><path d="M162 48.5l6 1.5-6 1.5Z" fill="#c3cad3" stroke="#6b7480" stroke-width=".6"/></g>'
 };
 return `<svg viewBox="0 0 180 90" aria-hidden="true">${base}${A[kind]||''}<text x="11" y="14" fill="#9aa6b2" font-size="7" font-family="monospace">CAM // ${kind.length}${kind.charCodeAt(0)%10}</text><circle cx="165" cy="12" r="2.4" fill="#e05a47"/></svg>`;
}

/* ---------- Landing figure: the factory floor plan ---------- */
function floorPlan(){
 const room=(x,y,w,h,n,label,sub,fill='#ffffff')=>`<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${COL.ink}" stroke-width="1.5"/><text x="${x+10}" y="${y+20}" font-size="10" font-family="IBM Plex Mono,monospace" fill="${COL.muted}">${n}</text><text x="${x+10}" y="${y+38}" font-size="13" font-weight="600" fill="${COL.ink}" font-family="IBM Plex Sans,Inter,sans-serif">${label}</text><text x="${x+10}" y="${y+54}" font-size="11" fill="${COL.muted}" font-family="IBM Plex Sans,Inter,sans-serif">${sub}</text></g>`;
 return `<svg viewBox="0 0 600 330" class="floorplan" role="img" aria-label="Floor plan of the Nova factory: four factory rooms, then the training office and career planner, then the dispatch dock">
  <rect x="1" y="1" width="598" height="328" fill="#f7f9fb" stroke="${COL.line}"/>
  <g stroke="${COL.line}" stroke-width="1">${Array.from({length:14},(_,i)=>`<path d="M${i*44+10} 1v328"/>`).join('')}${Array.from({length:8},(_,i)=>`<path d="M1 ${i*44+10}h598"/>`).join('')}</g>
  <text x="18" y="26" font-size="11" font-family="IBM Plex Mono,monospace" fill="${COL.muted}" letter-spacing="2">NOVA SEMICONDUCTOR · LEVEL 1</text>
  <rect x="18" y="40" width="420" height="160" fill="none" stroke="${COL.blue}" stroke-width="1.5" stroke-dasharray="6 4"/><text x="26" y="214" font-size="10" font-family="IBM Plex Mono,monospace" fill="${COL.blue}">CLEANROOM · CLASS 100</text>
  ${room(30,52,120,70,'01','Gowning','Get clean')}${room(162,52,130,70,'02','Litho bay','Print the pattern','#fff6cc')}${room(304,52,120,70,'03','Probe & dice','Test and cut')}
  ${room(304,130,120,62,'04','Inspection','Measure & sort')}
  ${room(30,236,140,72,'05','Training office','Qualifications')}${room(184,236,140,72,'06','Career planner','Your route')}
  ${room(460,52,124,140,'⚑','Dispatch dock','Truck in 25 min','#eef2f6')}
  <path d="M150 87h12M292 87h12M364 122v8M424 161h36M364 192v20H100v24M170 272h14M324 272h80V192" fill="none" stroke="${COL.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 7"/>
  <circle cx="60" cy="140" r="7" fill="${COL.accent}"/><text x="72" y="144" font-size="11" fill="${COL.ink}" font-family="IBM Plex Sans,Inter,sans-serif">You start here</text>
 </svg>`;
}

/* ---------- Photo helpers ----------
   photoFigure: a captioned photo that removes itself if the file is missing.
   photoOr: a photo laid over a drawn fallback; if the photo fails, the drawing shows. */
function photoFigure(key,cls=''){const p=PHOTOS[key];if(!p)return '';
 return `<figure class="photo ${cls}"><img src="img/${p.file}" alt="${p.caption}" loading="lazy" onerror="this.parentNode.remove()"><figcaption>${p.caption}</figcaption></figure>`;}
function photoOr(key,fallback,cls=''){const p=PHOTOS[key];if(!p)return fallback;
 return `<span class="ph ${cls}">${fallback}<img src="img/${p.file}" alt="" loading="lazy" ${p.pos?`style="object-position:${p.pos}"`:''} onload="this.parentNode.classList.add('has-photo')" onerror="this.remove()"></span>`;}
