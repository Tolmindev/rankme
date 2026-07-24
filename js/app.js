(function(){
"use strict";

/* ---- Template override (EX-Move etc.) ---- */
const TMPL = window.RANKME_TEMPLATE || null;
const CARD_SHAPE = (TMPL && TMPL.cardShape) || 'portrait';
const CARD_PATH = (TMPL && TMPL.cardPath) || 'assets/cards/';
const NO_FACTIONS = !!(TMPL && TMPL.noFactions);
const TEMPLATE_ID = (TMPL && TMPL.id) || (window.RANKME_BLANK ? 'blank' : 'sf-duel');
const TEMPLATE_TITLE = (TMPL && TMPL.title) || 'Street Fighter: Duel';
const TEMPLATE_EXPORT = (TMPL && TMPL.exportName) || null;
const TEMPLATE_FOOTER = (TMPL && TMPL.footerLabel) || null;

const DEFAULT_CARD_META_LIST = [{"id": 1, "file": "card_001.png", "faction": "MASTER", "name": "Gen"}, {"id": 2, "file": "card_002.png", "faction": "MASTER", "name": "Akuma"}, {"id": 3, "file": "card_003.png", "faction": "MASTER", "name": "Gouken"}, {"id": 4, "file": "card_004.png", "faction": "MASTER", "name": "Rose"}, {"id": 5, "file": "card_005.png", "faction": "MASTER", "name": "Trendy Cammy"}, {"id": 6, "file": "card_006.png", "faction": "MASTER", "name": "Taoist Gen"}, {"id": 7, "file": "card_007.png", "faction": "MASTER", "name": "Trendt Ryu"}, {"id": 8, "file": "card_008.png", "faction": "MASTER", "name": "Athlete Chun-Li"}, {"id": 9, "file": "card_009.png", "faction": "MASTER", "name": "Trendy Dhalsim"}, {"id": 10, "file": "card_010.png", "faction": "MASTER", "name": "Dante"}, {"id": 11, "file": "card_011.png", "faction": "MASTER", "name": "Summer Yun"}, {"id": 12, "file": "card_012.png", "faction": "MASTER", "name": " Master Leonardo"}, {"id": 13, "file": "card_013.png", "faction": "MASTER", "name": "Raphael"}, {"id": 14, "file": "card_014.png", "faction": "MASTER", "name": "Luke"}, {"id": 15, "file": "card_015.png", "faction": "MASTER", "name": "Jp"}, {"id": 16, "file": "card_016.png", "faction": "MASTER", "name": "Summer Ibuki"}, {"id": 17, "file": "card_017.png", "faction": "MASTER", "name": "Diviner Rose"}, {"id": 18, "file": "card_018.png", "faction": "MASTER", "name": "Firecracker Sakura"}, {"id": 19, "file": "card_019.png", "faction": "MASTER", "name": "Rich E Honda"}, {"id": 20, "file": "card_020.png", "faction": "MASTER", "name": "Kunoichi Ibuki"}, {"id": 21, "file": "card_021.png", "faction": "MASTER", "name": "Cowbot T Hawk"}, {"id": 22, "file": "card_022.png", "faction": "MASTER", "name": "Banquet Guy"}, {"id": 23, "file": "card_023.png", "faction": "MASTER", "name": "Popstar Poison"}, {"id": 24, "file": "card_024.png", "faction": "MASTER", "name": "Popstar Chun Li"}, {"id": 25, "file": "card_025.png", "faction": "MASTER", "name": "Popstar Juri"}, {"id": 26, "file": "card_026.png", "faction": "MASTER", "name": "Hermit Gouken"}, {"id": 27, "file": "card_027.png", "faction": "MASTER", "name": "Summer Rose"}, {"id": 28, "file": "card_028.png", "faction": "INFERNAL", "name": "Juri"}, {"id": 29, "file": "card_029.png", "faction": "INFERNAL", "name": "Seth"}, {"id": 30, "file": "card_030.png", "faction": "INFERNAL", "name": "M Bison"}, {"id": 31, "file": "card_031.png", "faction": "INFERNAL", "name": "Balrog"}, {"id": 32, "file": "card_032.png", "faction": "INFERNAL", "name": "Vega"}, {"id": 33, "file": "card_033.png", "faction": "INFERNAL", "name": "Sagat"}, {"id": 34, "file": "card_034.png", "faction": "INFERNAL", "name": "Evil Ryu"}, {"id": 35, "file": "card_035.png", "faction": "INFERNAL", "name": "Oni"}, {"id": 36, "file": "card_036.png", "faction": "INFERNAL", "name": "Witch Juri"}, {"id": 37, "file": "card_037.png", "faction": "INFERNAL", "name": "Gore Magala Ken"}, {"id": 38, "file": "card_038.png", "faction": "INFERNAL", "name": "Vergil"}, {"id": 39, "file": "card_039.png", "faction": "INFERNAL", "name": "Michelangelo"}, {"id": 40, "file": "card_040.png", "faction": "INFERNAL", "name": "Donatello"}, {"id": 41, "file": "card_041.png", "faction": "INFERNAL", "name": "Vizconde Vega"}, {"id": 42, "file": "card_042.png", "faction": "INFERNAL", "name": "Pharaoh Sagat"}, {"id": 43, "file": "card_043.png", "faction": "INFERNAL", "name": "Archon Decapre"}, {"id": 44, "file": "card_044.png", "faction": "INFERNAL", "name": "Chief Viper"}, {"id": 45, "file": "card_045.png", "faction": "INFERNAL", "name": "Giant Wrestler Hugo"}, {"id": 46, "file": "card_046.png", "faction": "INFERNAL", "name": "Overlord Bison"}, {"id": 47, "file": "card_047.png", "faction": "INFERNAL", "name": "Summer Poison"}, {"id": 48, "file": "card_048.png", "faction": "INFERNAL", "name": "Horror Hakan"}, {"id": 49, "file": "card_049.png", "faction": "INFERNAL", "name": "Shadaloo Cammy"}, {"id": 50, "file": "card_050.png", "faction": "INFERNAL", "name": "Shadow Ryu"}, {"id": 51, "file": "card_051.png", "faction": "INFERNAL", "name": "Cold-Hearted Adon"}, {"id": 52, "file": "card_052.png", "faction": "WIND", "name": "Chun Li"}, {"id": 53, "file": "card_053.png", "faction": "WIND", "name": "Guile"}, {"id": 54, "file": "card_054.png", "faction": "WIND", "name": "Abel"}, {"id": 55, "file": "card_055.png", "faction": "WIND", "name": "Cammy"}, {"id": 56, "file": "card_056.png", "faction": "WIND", "name": "Guy"}, {"id": 57, "file": "card_057.png", "faction": "WIND", "name": "Yun"}, {"id": 58, "file": "card_058.png", "faction": "WIND", "name": "Yang"}, {"id": 59, "file": "card_059.png", "faction": "WIND", "name": "T Hawk"}, {"id": 60, "file": "card_060.png", "faction": "WIND", "name": "El Fuerte"}, {"id": 61, "file": "card_061.png", "faction": "WIND", "name": "Beast Zangief"}, {"id": 62, "file": "card_062.png", "faction": "WIND", "name": "Street Poison"}, {"id": 63, "file": "card_063.png", "faction": "WIND", "name": "Summer Elena"}, {"id": 64, "file": "card_064.png", "faction": "WIND", "name": "Trendy Akuma"}, {"id": 65, "file": "card_065.png", "faction": "WIND", "name": "Royal Balrog"}, {"id": 66, "file": "card_066.png", "faction": "WIND", "name": "Saikyo Dan"}, {"id": 67, "file": "card_067.png", "faction": "WIND", "name": "Nishiki Sakura"}, {"id": 68, "file": "card_068.png", "faction": "THUNDER", "name": "Blanka"}, {"id": 69, "file": "card_069.png", "faction": "THUNDER", "name": "E Honda"}, {"id": 70, "file": "card_070.png", "faction": "THUNDER", "name": "Zangief"}, {"id": 71, "file": "card_071.png", "faction": "THUNDER", "name": "Poison"}, {"id": 72, "file": "card_072.png", "faction": "THUNDER", "name": "Elena"}, {"id": 73, "file": "card_073.png", "faction": "THUNDER", "name": "Makoto"}, {"id": 74, "file": "card_074.png", "faction": "THUNDER", "name": "Mad Ryu"}, {"id": 75, "file": "card_075.png", "faction": "THUNDER", "name": "Combat Guile"}, {"id": 76, "file": "card_076.png", "faction": "THUNDER", "name": "Mummy Dhalsim"}, {"id": 77, "file": "card_077.png", "faction": "THUNDER", "name": "Suit Abel"}, {"id": 78, "file": "card_078.png", "faction": "THUNDER", "name": "Trendy Guile"}, {"id": 79, "file": "card_079.png", "faction": "THUNDER", "name": "Charming Dudley"}, {"id": 80, "file": "card_080.png", "faction": "THUNDER", "name": "Baddest Juri"}, {"id": 81, "file": "card_081.png", "faction": "THUNDER", "name": "Action Guy"}, {"id": 82, "file": "card_082.png", "faction": "THUNDER", "name": "Banquet Rose"}, {"id": 83, "file": "card_083.png", "faction": "THUNDER", "name": "Horror Oni"}, {"id": 84, "file": "card_084.png", "faction": "FLAME", "name": "Dhalsim"}, {"id": 85, "file": "card_085.png", "faction": "FLAME", "name": "Hugo"}, {"id": 86, "file": "card_086.png", "faction": "FLAME", "name": "C Viper"}, {"id": 87, "file": "card_087.png", "faction": "FLAME", "name": "Adon"}, {"id": 88, "file": "card_088.png", "faction": "FLAME", "name": "Decapre"}, {"id": 89, "file": "card_089.png", "faction": "FLAME", "name": "Fei Long"}, {"id": 90, "file": "card_090.png", "faction": "FLAME", "name": "Dee Jay"}, {"id": 91, "file": "card_091.png", "faction": "FLAME", "name": "Dudley"}, {"id": 92, "file": "card_092.png", "faction": "FLAME", "name": "Mayor Cody"}, {"id": 93, "file": "card_093.png", "faction": "FLAME", "name": "Cammy & Vega"}, {"id": 94, "file": "card_094.png", "faction": "FLAME", "name": "Summer Yang"}, {"id": 95, "file": "card_095.png", "faction": "FLAME", "name": "Fire Adon"}, {"id": 96, "file": "card_096.png", "faction": "FLAME", "name": "Furisode Makoto"}, {"id": 97, "file": "card_097.png", "faction": "FLAME", "name": "Banquet Cammy"}, {"id": 98, "file": "card_098.png", "faction": "FLAME", "name": "Summer Cody"}, {"id": 99, "file": "card_099.png", "faction": "FLAME", "name": "Monk Bison"}, {"id": 100, "file": "card_100.png", "faction": "LEGENDARY", "name": "Flame Chun Li"}, {"id": 101, "file": "card_101.png", "faction": "LEGENDARY", "name": "Fashion Sakura"}, {"id": 102, "file": "card_102.png", "faction": "LEGENDARY", "name": "Fashion Blanka"}, {"id": 103, "file": "card_103.png", "faction": "LEGENDARY", "name": "Jonin Ibuki"}, {"id": 104, "file": "card_104.png", "faction": "LEGENDARY", "name": "Nero"}, {"id": 105, "file": "card_105.png", "faction": "LEGENDARY", "name": "Shredder"}, {"id": 106, "file": "card_106.png", "faction": "LEGENDARY", "name": "Christmas Rufus"}, {"id": 107, "file": "card_107.png", "faction": "LEGENDARY", "name": "Fashion Ken"}, {"id": 108, "file": "card_108.png", "faction": "LEGENDARY", "name": "Hydro Chun Li"}, {"id": 109, "file": "card_109.png", "faction": "LEGENDARY", "name": "Trendy Elena"}, {"id": 110, "file": "card_110.png", "faction": "LEGENDARY", "name": "Agent C Viper"}, {"id": 111, "file": "card_111.png", "faction": "LEGENDARY", "name": "Banquet Guile"}, {"id": 112, "file": "card_112.png", "faction": "LEGENDARY", "name": "Fashion E Honda"}, {"id": 113, "file": "card_113.png", "faction": "LEGENDARY", "name": "Santa Blanka"}, {"id": 114, "file": "card_114.png", "faction": "LEGENDARY", "name": "Vacation Dee Jay"}, {"id": 115, "file": "card_115.png", "faction": "LEGENDARY", "name": "Banquet Fei Long"}, {"id": 116, "file": "card_116.png", "faction": "LEGENDARY", "name": "Mech Zangief"}, {"id": 117, "file": "card_117.png", "faction": "LEGENDARY", "name": "Cupid Hugo"}, {"id": 118, "file": "card_118.png", "faction": "LEGENDARY", "name": "Zombie Cody"}, {"id": 119, "file": "card_119.png", "faction": "LEGENDARY", "name": "Fairy Makoto"}, {"id": 120, "file": "card_120.png", "faction": "LEGENDARY", "name": "Magican Rolento"}, {"id": 121, "file": "card_121.png", "faction": "LEGENDARY", "name": "Luchador El Fuerte"}, {"id": 122, "file": "card_122.png", "faction": "A+", "name": "Ibuki"}, {"id": 123, "file": "card_123.png", "faction": "A+", "name": "Cody"}, {"id": 124, "file": "card_124.png", "faction": "A+", "name": "Rufus"}, {"id": 125, "file": "card_125.png", "faction": "A+", "name": "Dan"}, {"id": 126, "file": "card_126.png", "faction": "A+", "name": "Sakura"}, {"id": 127, "file": "card_127.png", "faction": "A+", "name": "Ryu"}, {"id": 128, "file": "card_128.png", "faction": "A+", "name": "Hakan"}, {"id": 129, "file": "card_129.png", "faction": "A+", "name": "Ken"}, {"id": 130, "file": "card_130.png", "faction": "A+", "name": "Rolento"}];
const CARD_META_LIST = (TMPL && Array.isArray(TMPL.cards) && TMPL.cards.length)
  ? TMPL.cards
  : DEFAULT_CARD_META_LIST;
const CARD_META = {};
CARD_META_LIST.forEach(c => CARD_META[c.id] = c);
const N_CARDS = CARD_META_LIST.length;
const FACTIONS = NO_FACTIONS ? [] : [...new Set(CARD_META_LIST.map(c=>c.faction))];
const FACTION_HUE = {MASTER:210, INFERNAL:275, WIND:210, THUNDER:48, FLAME:8, LEGENDARY:290, 'A+':32};
const FACTION_ICON = {};
FACTIONS.forEach(f => FACTION_ICON[f] = `assets/factions/${f}_icon.svg`);
const ALL_ICON = 'assets/factions/ALL_icon.svg';

const cardSrc = id => {
  if(state.customCards && state.customCards[id]) return state.customCards[id].src;
  if(CARD_META[id]) return CARD_PATH + CARD_META[id].file;
  return CARD_PATH + `card_${String(id).padStart(3,'0')}.png`;
};

const DEFAULT_TIERS = [
  {id:'t1', name:'GOD',            hue:255, sat:55, light:82},
  {id:'t2', name:'BOSSES META',    hue:355, sat:70, light:65},
  {id:'t3', name:'PVP META',       hue:28,  sat:65, light:62},
  {id:'t4', name:'ASSISTANT META', hue:320, sat:65, light:65},
  {id:'t5', name:'GOOD',           hue:268, sat:50, light:62},
  {id:'t6', name:'ASSISTANT',      hue:220, sat:35, light:52},
  {id:'t7', name:'TOWERS',         hue:172, sat:50, light:52},
  {id:'t8', name:'DECENT',         hue:135, sat:38, light:48},
  {id:'t9', name:'DISAPPOINTED',   hue:110, sat:55, light:70},
  {id:'t10',name:'BAD',            hue:100, sat:55, light:82},
];

const BLANK_MODE = !!window.RANKME_BLANK;
const EXPERT_PRESETS = {"eldud":{"tiers":[{"id":"t1","name":"GOD","hue":255,"sat":55,"light":82},{"id":"t2","name":"BOSSES META","hue":355,"sat":70,"light":65},{"id":"t3","name":"PVP META","hue":28,"sat":65,"light":62},{"id":"t4","name":"ASSISTANT META","hue":320,"sat":65,"light":65},{"id":"t5","name":"GOOD","hue":268,"sat":50,"light":62},{"id":"t6","name":"ASSISTANT","hue":220,"sat":35,"light":52},{"id":"t7","name":"TOWERS","hue":172,"sat":50,"light":52},{"id":"t8","name":"DECENT","hue":135,"sat":38,"light":48},{"id":"t9","name":"DISAPPOINTED","hue":110,"sat":55,"light":70},{"id":"t10","name":"BAD","hue":100,"sat":55,"light":82}],"assignment":{"t1":[46,41,23,118,115,95,21],"t2":[62,116,30,100,19,6,77,17,42,15,81,13,65],"t3":[83,8,50,39,3,26,7,16,69],"t4":[38,40,24,12,49,34,54,61,4,36,89],"t5":[82,63,105,9,14,70,33,86,106,119,45,72,10,29],"t6":[78,117,92,44,74,104,109,71,108,101,57,58,1,31,73],"t7":[93,97,64,53,94,84,76,67,66,68,52,96,90,88,85,98,80,75],"t8":[47,11,113,35,110,20,59,43,114,111,102,112,123,5,56],"t9":[25,107,37,22,32,103,18,48],"t10":[2,55,28,91,79,87,60]}}};

const BLANK_TIERS = [
  {id:'t1', name:'S', hue:0,   sat:70, light:62},
  {id:'t2', name:'A', hue:28,  sat:65, light:58},
  {id:'t3', name:'B', hue:48,  sat:55, light:55},
  {id:'t4', name:'C', hue:140, sat:40, light:50},
  {id:'t5', name:'D', hue:220, sat:35, light:48},
];

let state = {
  // Exclusive opens with standard S–D strips; ElDuD hash loads expert layout
  tiers: JSON.parse(JSON.stringify(BLANK_TIERS)),
  assignment: {},
  pool: [],
  rowIdSeq: 6,
  customCards: {}, // id -> {src dataURL, name}
};

let customIdSeq = 10000;

function freshPool(){
  if(BLANK_MODE) return [];
  return Array.from({length:N_CARDS}, (_,i)=>i+1);
}

function loadFromHash(){
  const h = location.hash.replace(/^#/,'');
  if(!h) return false;
  // legacy / raw only in sync path; compressed 'z' handled in applyHashStateAsync
  if(h[0]==='z') return false;
  try{
    let data;
    if(h[0]==='r'){
      let s = h.slice(1).replace(/-/g,'+').replace(/_/g,'/');
      while(s.length % 4) s += '=';
      data = JSON.parse(decodeURIComponent(escape(atob(s))));
    } else {
      data = JSON.parse(decodeURIComponent(escape(atob(h))));
    }
    if(!data.tiers || !data.assignment) return false;
    state.tiers = data.tiers;
    state.assignment = data.assignment;
    const used = new Set();
    Object.values(state.assignment).forEach(arr => arr.forEach(id=>used.add(id)));
    state.pool = freshPool().filter(id=>!used.has(id));
    state.rowIdSeq = 1 + Math.max(0,...state.tiers.map(t=>parseInt((t.id||'t0').replace('t',''))||0));
    return true;
  }catch(e){ return false; }
}

async function loadFromHashAsync(){
  const h = location.hash.replace(/^#/,'');
  if(!h) return false;
  const data = await decodeSharePayload(h);
  if(!data || !data.tiers || !data.assignment) return false;
  state.tiers = data.tiers;
  state.assignment = data.assignment;
  const used = new Set();
  Object.values(state.assignment).forEach(arr => arr.forEach(id=>used.add(id)));
  state.pool = freshPool().filter(id=>!used.has(id));
  state.rowIdSeq = 1 + Math.max(0,...state.tiers.map(t=>parseInt((t.id||'t0').replace('t',''))||0));
  return true;
}



function sanitizeState(){
  // Coerce ids to numbers, drop unknowns, ensure each card in at most one tier
  // Custom uploads (state.customCards) are valid even without CARD_META
  const seen = new Set();
  const next = {};
  (state.tiers||[]).forEach(tier=>{
    const arr = [];
    (state.assignment[tier.id]||[]).forEach(cid=>{
      const id = +cid;
      if(!id) return;
      const isStock = !!CARD_META[id];
      const isCustom = !!(state.customCards && state.customCards[id]);
      if(!isStock && !isCustom) return;
      if(seen.has(id)) return;
      seen.add(id);
      arr.push(id);
    });
    next[tier.id] = arr;
  });
  state.assignment = next;
  // rebuild pool: stock leftovers + unplaced custom
  state.pool = [];
  for(let i=1;i<=N_CARDS;i++){
    if(!seen.has(i)) state.pool.push(i);
  }
  Object.keys(state.customCards||{}).forEach(k=>{
    const id = +k;
    if(!seen.has(id) && !state.pool.includes(id)) state.pool.push(id);
  });
}

function applyExpertPreset(id){
  const data = EXPERT_PRESETS && EXPERT_PRESETS[String(id).toLowerCase()];
  if(!data || !data.tiers || !data.assignment) return false;
  state.tiers = JSON.parse(JSON.stringify(data.tiers));
  state.assignment = JSON.parse(JSON.stringify(data.assignment));
  const used = new Set();
  Object.values(state.assignment).forEach(arr => arr.forEach(x => used.add(x)));
  state.pool = freshPool().filter(id => !used.has(id));
  state.rowIdSeq = 1 + Math.max(0, ...state.tiers.map(t => parseInt((t.id||'t0').replace('t',''))||0));
  window.__rankmeFromCabinet = true;
  activeFilter = 'ALL';
  portalsOn = false;
  const pb = document.getElementById('portalBtn');
  if(pb) pb.classList.remove('active');
  sanitizeState();
  // clean URL
  try{
    const u = new URL(location.href);
    u.searchParams.set('e', String(id).toLowerCase());
    u.hash = '';
    history.replaceState(null, '', u.pathname + u.search);
  }catch(e){}
  return true;
}

function applyHashState(){
  // try sync first (legacy), else async compressed
  if(loadFromHash()){
    activeFilter = 'ALL';
    portalsOn = false;
    const pb = document.getElementById('portalBtn');
    if(pb) pb.classList.remove('active');
    sanitizeState();
    render();
    if(!BLANK_MODE) renderFactionFilters();
    renderPortals();
    return true;
  }
  loadFromHashAsync().then(ok=>{
    if(!ok) return;
    activeFilter = 'ALL';
    portalsOn = false;
    const pb = document.getElementById('portalBtn');
    if(pb) pb.classList.remove('active');
    sanitizeState();
    render();
    if(!BLANK_MODE) renderFactionFilters();
    renderPortals();
  });
  return true;
}

function initState(){
  if(window.__rankmeFromCabinet) return;
  if(!BLANK_MODE && loadFromHash()) return;
  if(BLANK_MODE && loadFromHash()) return;
  state.assignment = {};
  state.tiers.forEach(t=> state.assignment[t.id] = []);
  state.pool = freshPool();
  if(BLANK_MODE){
    const title = localStorage.getItem('rankme_draft_title');
    if(title){
      const el = document.getElementById('listTitle');
      if(el) el.textContent = title;
    }
  }
}

function lighten(t, delta){
  const l = Math.min(95, t.light+delta);
  return `hsl(${t.hue}, ${t.sat}%, ${l}%)`;
}
function hsl(t){ return `hsl(${t.hue}, ${t.sat}%, ${t.light}%)`; }

/* ---------------- Rendering ---------------- */

const boardInner = document.getElementById('boardInner');
const poolEl = document.getElementById('pool');

function render(){
  boardInner.innerHTML = '';
  state.tiers.forEach((t, idx)=>{
    const row = document.createElement('div');
    row.className = 'tier-row';
    row.dataset.tierId = t.id;

    const labelWrap = document.createElement('div');
    labelWrap.className = 'tier-label-wrap';

    const pill = document.createElement('div');
    pill.className = 'tier-pill';
    pill.style.setProperty('--c1', lighten(t,8));
    pill.style.setProperty('--c2', hsl(t));

    const label = document.createElement('div');
    label.className = 'tier-label';
    label.contentEditable = 'true';
    label.spellcheck = false;
    label.style.setProperty('--hue', t.hue);
    label.style.setProperty('--sat', t.sat+'%');
    label.style.setProperty('--light', t.light+'%');
    label.textContent = t.name;
    fitLabelFont(label, t.name);
    label.addEventListener('input', ()=>{
      t.name = label.textContent;
      fitLabelFont(label, t.name);
    });
    label.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); label.blur(); } });
    label.addEventListener('blur', ()=>{
      if(!label.textContent.trim()) { label.textContent = t.name = 'ROW'; }
    });

    labelWrap.appendChild(pill);
    labelWrap.appendChild(label);
    row.appendChild(labelWrap);

    const cards = document.createElement('div');
    cards.className = 'tier-cards';
    cards.dataset.tierId = t.id;
    (state.assignment[t.id]||[]).forEach(cid=>{
      cards.appendChild(makeCard(cid));
    });
    row.appendChild(cards);

    const side = document.createElement('div');
    side.className = 'tier-side';
    side.innerHTML = `
      <button class="gear" title="Row settings">&#9881;</button>
      <button class="up" title="Move up" ${idx===0?'disabled':''}>&#9650;</button>
      <button class="down" title="Move down" ${idx===state.tiers.length-1?'disabled':''}>&#9660;</button>
    `;
    row.appendChild(side);

    side.querySelector('.gear').addEventListener('click', (e)=> openRowSettings(t.id, e.currentTarget));
    side.querySelector('.up').addEventListener('click', ()=> moveRow(idx,-1));
    side.querySelector('.down').addEventListener('click', ()=> moveRow(idx,1));

    // Compact side controls when cards are small (row too short for vertical stack)
    const cardPx = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 64;
    if(cardPx < 44) row.classList.add('compact-side');

    boardInner.appendChild(row);
  });
  renderPool();
  renderPortals();
}

function fitLabelFont(el, text){
  let size = 13;
  el.style.fontSize = size+'px';
  const maxTries = 10;
  let tries = 0;
  while(tries < maxTries && (el.scrollHeight > el.clientHeight+2 || el.scrollWidth > el.clientWidth+2) && size > 7){
    size -= 1;
    el.style.fontSize = size+'px';
    tries++;
  }
}

let activeFilter = 'ALL';

function renderPool(){
  poolEl.innerHTML = '';
  // Deduplicate pool just in case
  state.pool = [...new Set(state.pool.map(Number))].filter(id => id > 0);
  let visible;
  if(BLANK_MODE || activeFilter === 'ALL'){
    visible = state.pool;
  } else {
    visible = state.pool.filter(id => {
      const m = CARD_META[id];
      return m && m.faction === activeFilter;
    });
  }
  visible.forEach(cid => {
    try { poolEl.appendChild(makeCard(cid)); } catch(e){ console.warn('card', cid, e); }
  });
}

function makeCard(cid){
  const meta = CARD_META[cid];
  const custom = state.customCards && state.customCards[cid];
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.cardId = cid;
  const img = document.createElement('img');
  img.src = cardSrc(cid);
  img.loading = 'lazy';
  img.draggable = false;
  img.alt = custom ? custom.name : (meta ? meta.name : ('Card #' + cid));
  el.title = custom ? custom.name : (meta ? meta.name : '');
  el.appendChild(img);
  el.addEventListener('pointerdown', onCardPointerDown);
  return el;
}

function renderFactionFilters(){
  const wrap = document.getElementById('factionFilters');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(NO_FACTIONS){ wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const mkBtn = (key, label, icon, hue) => {
    const b = document.createElement('button');
    let extra = '';
    if(key==='LEGENDARY') extra += ' legendary';
    if(key==='MASTER') extra += ' master';
    if(key==='ALL') extra += ' all-mix';
    b.className = 'faction-btn' + (activeFilter===key ? ' active' : '') + (!icon ? ' no-icon' : '') + extra;
    if(hue!==undefined) b.style.setProperty('--fhue', hue);
    if(icon){
      const img = document.createElement('img');
      img.src = icon; img.alt='';
      b.appendChild(img);
    }
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', ()=>{ activeFilter = key; renderFactionFilters(); renderPool(); });
    wrap.appendChild(b);
  };
  mkBtn('ALL', 'All', ALL_ICON);
  FACTIONS.forEach(f => {
    const icon = (f === 'A+') ? null : (FACTION_ICON[f] ?? ALL_ICON);
    mkBtn(f, f, icon, FACTION_HUE[f] ?? 220);
  });
}

function moveRow(idx, dir){
  const j = idx+dir;
  if(j<0 || j>=state.tiers.length) return;
  const tmp = state.tiers[idx];
  state.tiers[idx] = state.tiers[j];
  state.tiers[j] = tmp;
  render();
}


/* ---------------- Magic Portals ---------------- */
let portalsOn = false;

function renderPortals(){
  const bar = document.getElementById('portalsBar');
  if(!bar) return;
  bar.innerHTML = '';
  if(!portalsOn){
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  state.tiers.forEach((tier, idx) => {
    const slot = document.createElement('div');
    slot.className = 'portal-slot';
    slot.dataset.tierId = tier.id;
    slot.dataset.tierIndex = idx;
    slot.dataset.label = tier.name;
    const c1 = `hsl(${tier.hue}, ${Math.min(60, tier.sat)}%, ${Math.min(58, tier.light)}%)`;
    const c2 = `hsl(${tier.hue}, ${Math.min(50, tier.sat)}%, ${Math.max(28, tier.light-12)}%)`;
    slot.style.background = `linear-gradient(180deg, ${c1}, ${c2})`;
    slot.style.setProperty('--glow', `hsla(${tier.hue}, 70%, 60%, 0.65)`);
    bar.appendChild(slot);
  });
}

function portalAt(x, y){
  if(!portalsOn) return null;
  const slots = document.querySelectorAll('.portal-slot');
  for(const s of slots){
    const b = s.getBoundingClientRect();
    if(x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return s;
  }
  return null;
}

document.getElementById('portalBtn').addEventListener('click', ()=>{
  portalsOn = !portalsOn;
  document.getElementById('portalBtn').classList.toggle('active', portalsOn);
  renderPortals();
  showToast(portalsOn ? 'Teleportation ON' : 'Teleportation OFF');
});

/* ---------------- Drag & drop (pointer-based, mouse+touch) ---------------- */

let drag = null;
let autoScrollRAF = null;

function onCardPointerDown(e){
  if(e.button !== undefined && e.button !== 0) return;
  if(drag) return;
  e.preventDefault();
  const source = e.currentTarget;
  const cid = source.dataset.cardId;
  const rect = source.getBoundingClientRect();

  const floater = source.cloneNode(true);
  floater.classList.add('floating');
  floater.style.width = rect.width+'px';
  floater.style.height = rect.height+'px';
  floater.style.left = rect.left+'px';
  floater.style.top = rect.top+'px';
  floater.style.transform = 'none';
  document.body.appendChild(floater);

  source.classList.add('dragging');
  source.style.display = 'none';

  drag = {
    cid, source, pointerId: e.pointerId,
    offX: e.clientX - rect.left,
    offY: e.clientY - rect.top,
    floater,
    startedContainer: source.parentElement,
    lastY: e.clientY,
    moved: false,
    startX: e.clientX,
    startY: e.clientY,
  };

  try { source.setPointerCapture(e.pointerId); } catch(err){}
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
}

function containerAt(x,y){
  const rows = document.querySelectorAll('.tier-cards, .pool');
  for(const r of rows){
    const b = r.getBoundingClientRect();
    const pad = 14;
    if(x >= b.left-pad && x <= b.right+pad && y >= b.top-pad && y <= b.bottom+pad){
      return r;
    }
  }
  return null;
}

function autoScrollTick(){
  if(!drag){ autoScrollRAF = null; return; }
  const margin = 90, maxSpeed = 22;
  const y = drag.lastY;
  if(y < margin){
    window.scrollBy(0, -maxSpeed * (1 - y/margin));
  } else if(y > window.innerHeight - margin){
    window.scrollBy(0, maxSpeed * (1 - (window.innerHeight - y)/margin));
  }
  autoScrollRAF = requestAnimationFrame(autoScrollTick);
}

function onDragMove(e){
  if(!drag || e.pointerId !== drag.pointerId) return;
  drag.lastY = e.clientY;
  if(!autoScrollRAF) autoScrollRAF = requestAnimationFrame(autoScrollTick);

  if(Math.abs(e.clientX - drag.startX) > 3 || Math.abs(e.clientY - drag.startY) > 3) drag.moved = true;
  drag.floater.style.left = (e.clientX - drag.offX)+'px';
  drag.floater.style.top = (e.clientY - drag.offY)+'px';
  drag.floater.style.transform = 'none';

  document.querySelectorAll('.tier-row').forEach(r=>r.classList.remove('drag-over'));
  const cont = containerAt(e.clientX, e.clientY);
  document.querySelectorAll('.card.placeholder').forEach(p=>p.remove());

  if(cont){
    if(cont.classList.contains('tier-cards')){
      cont.closest('.tier-row').classList.add('drag-over');
    }
    const ph = document.createElement('div');
    ph.className = 'card placeholder';
    ph.innerHTML = '<img src="'+cardSrc(drag.cid)+'">';
    if(cont.classList.contains('pool')){
      cont.appendChild(ph);
    } else {
      const children = [...cont.children].filter(c =>
        c !== drag.source &&
        !c.classList.contains('placeholder') &&
        c.style.display !== 'none'
      );
      let inserted = false;
      for(const child of children){
        const b = child.getBoundingClientRect();
        if(e.clientY < b.top - 6 || e.clientY > b.bottom + 6) continue;
        const midX = b.left + b.width / 2;
        if(e.clientX < midX){
          cont.insertBefore(ph, child);
          inserted = true;
          break;
        }
      }
      if(!inserted) cont.appendChild(ph);
    }
    drag.targetContainer = cont;
    drag.placeholder = ph;
  } else {
    drag.targetContainer = null;
    drag.placeholder = null;
  }

  // Portal highlight
  document.querySelectorAll('.portal-slot').forEach(s=>s.classList.remove('drag-over'));
  const portal = portalAt(e.clientX, e.clientY);
  if(portal){
    portal.classList.add('drag-over');
    drag.targetPortal = portal;
  } else {
    drag.targetPortal = null;
  }
}

function onDragEnd(e){
  if(!drag || (e.pointerId!==undefined && e.pointerId !== drag.pointerId)) return;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);
  if(autoScrollRAF){ cancelAnimationFrame(autoScrollRAF); autoScrollRAF=null; }

  document.querySelectorAll('.tier-row').forEach(r=>r.classList.remove('drag-over'));
  document.querySelectorAll('.portal-slot').forEach(s=>s.classList.remove('drag-over'));

  const cid = parseInt(drag.cid, 10);
  const floater = drag.floater;
  let targetContainer = drag.targetContainer;
  const targetPortal = drag.targetPortal || portalAt(e.clientX, e.clientY);
  const started = drag.startedContainer;

  // Hit-test again at release point (more reliable than last move)
  if(!targetContainer){
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if(el){
      const cont = el.closest('.tier-cards, .pool');
      if(cont) targetContainer = cont;
    }
  }

  // Drop on Magic Portal
  if(targetPortal && portalsOn){
    if(drag.placeholder) drag.placeholder.remove();
    const tierId = targetPortal.dataset.tierId;
    const label = targetPortal.dataset.label || 'tier';
    removeFromAllData(cid);
    if(!state.assignment[tierId]) state.assignment[tierId] = [];
    if(!state.assignment[tierId].includes(cid)) state.assignment[tierId].push(cid);
    state.pool = state.pool.filter(id => id !== cid);
    floater.style.transition = 'transform .25s ease, opacity .25s ease';
    floater.style.transform = 'scale(0.3)';
    floater.style.opacity = '0';
    setTimeout(()=>{
      try { floater.remove(); } catch(err){}
      drag = null;
      try { render(); renderFactionFilters(); renderPool(); } catch(err){
        console.error(err); activeFilter = 'ALL'; render();
      }
      showToast('Teleported to ' + label);
    }, 260);
    return;
  }

  // No valid drop target → if started from a tier/pool, put back there (no evaporate on click/double-click)
  if(!targetContainer){
    if(drag.placeholder) drag.placeholder.remove();
    // restore source visibility without removing from data
    try { drag.source.style.display = ''; drag.source.style.visibility = ''; drag.source.classList.remove('dragging'); } catch(err){}
    try { floater.remove(); } catch(err){}
    drag = null;
    // full re-render to be safe
    render();
    return;
  }

  // Normal drop
  removeFromAllData(cid);

  const cont = targetContainer;
  const ids = [...cont.children]
    .filter(c => c !== drag.source)
    .map(c => {
      if(c.classList.contains('placeholder')) return cid;
      const id = parseInt(c.dataset.cardId, 10);
      return Number.isFinite(id) ? id : null;
    })
    .filter(id => id !== null);

  if(!ids.includes(cid)) ids.push(cid);

  if(cont.classList.contains('pool')){
    state.pool = [...new Set(ids)].sort((a,b)=>a-b);
  } else {
    const tid = cont.dataset.tierId;
    if(tid) state.assignment[tid] = ids;
  }

  if(drag.placeholder) drag.placeholder.remove();
  try { floater.remove(); } catch(err){}
  drag = null;
  render();
}

function removeFromAllData(cid){
  state.pool = state.pool.filter(id=>id!==cid);
  Object.keys(state.assignment).forEach(k=>{
    state.assignment[k] = state.assignment[k].filter(id=>id!==cid);
  });
}

/* ---------------- Row settings popover ---------------- */

let openPopover = null;

function closePopover(){
  if(openPopover){ openPopover.remove(); openPopover=null; document.removeEventListener('click', outsideClose); }
}

function openRowSettings(tierId, anchorBtn){
  closePopover();
  const t = state.tiers.find(x=>x.id===tierId);
  const pop = document.createElement('div');
  pop.className = 'row-settings open';
  pop.innerHTML = `
    <label>Row color</label>
    <input type="range" class="hue-slider" min="0" max="360" value="${t.hue}">
    <div class="rs-actions">
      <button class="rs-btn clear">Clear</button>
      <button class="rs-btn danger del">Delete</button>
    </div>
  `;
  document.body.appendChild(pop);

  const positionPop = ()=>{
    const r = anchorBtn.getBoundingClientRect();
    const pw = 260;
    let left = r.left - pw - 12;
    if(left < 8) left = r.right + 12;
    let top = r.top + r.height/2 - 90;
    top = Math.max(8, Math.min(top, window.innerHeight - 190));
    pop.style.left = left+'px';
    pop.style.top = top+'px';
  };
  positionPop();
  openPopover = pop;

  pop.querySelector('.hue-slider').addEventListener('input', (e)=>{
    t.hue = parseInt(e.target.value);
    const row = document.querySelector(`.tier-row[data-tier-id="${tierId}"]`);
    if(row){
      row.querySelector('.tier-pill').style.setProperty('--c1', lighten(t,8));
      row.querySelector('.tier-pill').style.setProperty('--c2', hsl(t));
      row.querySelector('.tier-label').style.setProperty('--hue', t.hue);
    }
  });
  pop.querySelector('.clear').addEventListener('click', ()=>{
    state.pool.push(...state.assignment[tierId]);
    state.assignment[tierId] = [];
    render(); closePopover();
  });
  pop.querySelector('.del').addEventListener('click', ()=>{
    if(state.tiers.length<=1){ showToast('You need at least one row'); return; }
    state.pool.push(...(state.assignment[tierId]||[]));
    delete state.assignment[tierId];
    state.tiers = state.tiers.filter(x=>x.id!==tierId);
    render(); closePopover();
  });

  setTimeout(()=>{ document.addEventListener('click', outsideClose); },0);
}
function outsideClose(e){
  if(openPopover && !openPopover.contains(e.target) && !e.target.closest('.gear')){
    closePopover();
  }
}

document.getElementById('addRowBtn').addEventListener('click', ()=>{
  const id = 't'+(state.rowIdSeq++);
  state.tiers.push({id, name:'NEW ROW', hue:200, sat:50, light:60});
  state.assignment[id] = [];
  render();
});

/* ---------------- Toolbar: size, reset, share, download ---------------- */

const sizeSlider = document.getElementById('sizeSlider');
let _sizeDragging = false;
function setCardSize(px){
  // Freeze scroll: pin the toolbar (which sits above the board) in place
  const pin = document.querySelector('.toolbar') || document.getElementById('board');
  const pinTop = pin ? pin.getBoundingClientRect().top : 0;
  const y0 = window.scrollY || document.documentElement.scrollTop;

  document.documentElement.style.setProperty('--card-w', px + 'px');
  if(CARD_SHAPE === 'square'){
    document.documentElement.style.setProperty('--card-h', px + 'px');
  } else {
    document.documentElement.style.removeProperty('--card-h');
  }

  document.querySelectorAll('.tier-row').forEach(row=>{
    if(px < 58) row.classList.add('compact-side');
    else row.classList.remove('compact-side');
  });

  // Correct immediately + after layout
  const fix = ()=>{
    if(!pin) return;
    const pinTop2 = pin.getBoundingClientRect().top;
    const delta = pinTop2 - pinTop;
    if(Math.abs(delta) > 0.5){
      const target = y0 + delta;
      window.scrollTo(0, target);
      // some browsers need documentElement too
      document.documentElement.scrollTop = target;
      document.body.scrollTop = target;
    }
  };
  fix();
  requestAnimationFrame(()=>{ fix(); requestAnimationFrame(fix); });
}
sizeSlider.addEventListener('pointerdown', (e)=>{
  _sizeDragging = true;
  document.documentElement.style.overflowAnchor = 'none';
  document.body.style.overflowAnchor = 'none';
});
window.addEventListener('pointerup', ()=>{
  if(_sizeDragging){
    _sizeDragging = false;
    document.documentElement.style.overflowAnchor = '';
    document.body.style.overflowAnchor = '';
  }
});
sizeSlider.addEventListener('input', (e)=>{
  setCardSize(+e.target.value);
});
document.getElementById('sizeResetBtn').addEventListener('click', ()=>{
  sizeSlider.value = 64;
  setCardSize(64);
});

function showConfirm(title, text, onConfirm){
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  modal.classList.add('open');
  const ok = document.getElementById('confirmOk');
  const cancel = document.getElementById('confirmCancel');
  const cleanup = ()=>{ modal.classList.remove('open'); ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); };
  const onOk = ()=>{ cleanup(); onConfirm(); };
  const onCancel = ()=> cleanup();
  ok.addEventListener('click', onOk);
  cancel.addEventListener('click', onCancel);
}

document.getElementById('clearAllBtn').addEventListener('click', ()=>{
  showConfirm('Clear the whole tier list?', 'Everything on the rows goes back to the pool. This can\'t be undone.', ()=>{
    state.assignment = {};
    state.tiers.forEach(t=>state.assignment[t.id]=[]);
    // Stock cards + custom uploads both return to pool
    const stock = freshPool();
    const customIds = Object.keys(state.customCards||{}).map(Number).filter(Boolean);
    state.pool = [...stock, ...customIds.filter(id => !stock.includes(id))];
    history.replaceState(null,'',location.pathname + location.search);
    render();
    showToast('Tier List Cleared');
  });
});

document.getElementById('fillAllBtn').addEventListener('click', ()=>{
  showConfirm('Fill all rows randomly?', 'Every fighter still in the pool will be dropped into a random row - handy as a starting point before you sort them.', ()=>{
    const shuffled = [...state.pool].sort(()=>Math.random()-0.5);
    shuffled.forEach(cid=>{
      const t = state.tiers[Math.floor(Math.random()*state.tiers.length)];
      state.assignment[t.id].push(cid);
    });
    state.pool = [];
    render();
    showToast('Rows Filled Randomly');
  });
});

/* ---- compact share hash (deflate) ---- */
function b64urlEncode(bytes){
  let s = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for(let i=0;i<arr.length;i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlDecode(str){
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while(str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function encodeSharePayload(data){
  const json = JSON.stringify(data);
  try{
    if(typeof CompressionStream !== 'undefined'){
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const buf = await new Response(stream).arrayBuffer();
      return 'z' + b64urlEncode(new Uint8Array(buf));
    }
  }catch(e){}
  return 'r' + btoa(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function decodeSharePayload(h){
  if(!h) return null;
  try{
    if(h[0]==='z' && typeof DecompressionStream !== 'undefined'){
      const bytes = b64urlDecode(h.slice(1));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const text = await new Response(stream).text();
      return JSON.parse(text);
    }
    if(h[0]==='r'){
      let s = h.slice(1).replace(/-/g,'+').replace(/_/g,'/');
      while(s.length % 4) s += '=';
      return JSON.parse(decodeURIComponent(escape(atob(s))));
    }
    // legacy raw base64
    return JSON.parse(decodeURIComponent(escape(atob(h))));
  }catch(e){ return null; }
}

async function buildShareUrl(){
  const data = { tiers: state.tiers, assignment: state.assignment };
  const payload = await encodeSharePayload(data);
  return location.origin + location.pathname + '#' + payload;
}

function shareCaption(){
  if(BLANK_MODE) return 'My tier list on RankMe - create yours at rankme.lol';
  return 'My Street Fighter: Duel tier list on RankMe — rankme.lol';
}

function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>el.classList.remove('show'), 2400);
}

async function shareLinkOrImage(kind){
  const caption = shareCaption();
  // Custom (blank): prefer sharing PNG image + site promo
  if(BLANK_MODE){
    try{
      const blob = await exportPNGBlob();
      const file = new File([blob], 'rankme-tierlist.png', { type: 'image/png' });
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        await navigator.share({
          files: [file],
          title: 'RankMe tier list',
          text: caption + '\nhttps://rankme.lol'
        });
        showToast('Link Ready');
        return;
      }
      // fallback: download image
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rankme-tierlist.png';
      a.click();
      showToast('PNG Saved - Ready to Share');
    }catch(e){
      showToast('Could not share image');
    }
    return;
  }
  // Exclusive: try Supabase short link, else compressed hash
  let url = await buildShareUrl();
  try{
    if(typeof createShortLink === 'function'){
      const code = await createShortLink({ tiers: state.tiers, assignment: state.assignment });
      if(code) url = location.origin + location.pathname + '?s=' + code;
    }
  }catch(e){}
  const text = caption;
  if(kind === 'discord'){
    navigator.clipboard?.writeText(url).then(()=> showToast('Link copied'))
      .catch(()=> showToast(url));
  } else if(kind === 'telegram'){
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  } else if(kind === 'x'){
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }
}

document.getElementById('shareDiscord')?.addEventListener('click', ()=> shareLinkOrImage('discord'));
document.getElementById('shareTelegram')?.addEventListener('click', ()=> shareLinkOrImage('telegram'));
document.getElementById('shareX')?.addEventListener('click', ()=> shareLinkOrImage('x'));

document.getElementById('downloadBtn')?.addEventListener('click', ()=>exportPNG());

// Remix = editable copy + option to add own images into the pool
let remixFlag = false;
function setRemixUI(on){
  remixFlag = !!on;
  const wrap = document.getElementById('remixUploadWrap');
  if(wrap) wrap.hidden = !on;
  const rb = document.getElementById('remixBtn');
  if(rb) rb.classList.toggle('active-remix', on);
}
function wireRemixUpload(){
  const input = document.getElementById('remixUpload');
  if(!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('change', async (e)=>{
    const files = [...(e.target.files||[])];
    let n = 0;
    for(const f of files){
      if(!f.type.startsWith('image/')) continue;
      const src = await new Promise((res,rej)=>{
        const r = new FileReader();
        r.onload = ()=>res(r.result);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const id = customIdSeq++;
      state.customCards[id] = { src, name: f.name.replace(/\.[^.]+$/,'') };
      state.pool.push(id);
      n++;
    }
    renderPool();
    showToast(n + ' custom image(s) added to pool');
    e.target.value = '';
  });
}
document.getElementById('remixBtn')?.addEventListener('click', ()=>{
  if(BLANK_MODE){
    showToast('Remix is for Exclusive templates');
    return;
  }
  state.tiers = JSON.parse(JSON.stringify(state.tiers));
  state.assignment = JSON.parse(JSON.stringify(state.assignment));
  const used = new Set();
  Object.values(state.assignment).forEach(arr => arr.forEach(id => used.add(id)));
  state.pool = freshPool().filter(id => !used.has(id));
  setRemixUI(true);
  window.__rankmeFromCabinet = true;
  wireRemixUpload();
  render();
  if(!BLANK_MODE) renderFactionFilters();
  renderPortals();
  showToast('Remix ready — add images, edit, then Save');
});

document.getElementById('saveAccountBtn')?.addEventListener('click', async ()=>{
  if(BLANK_MODE){
    showToast('Account save is for Exclusive templates only');
    return;
  }
  try{
    if(typeof getSessionUser !== 'function'){
      showToast('Open Account to login first');
      return;
    }
    const user = await getSessionUser();
    if(!user){
      showToast('Login required');
      location.href = 'account.html';
      return;
    }
    const base = document.querySelector('.hero .desc b')?.textContent || 'SF Duel';
    const title = remixFlag ? ('Remix · ' + base) : (base + ' list');
    sanitizeState();
    const payload = { tiers: state.tiers, assignment: state.assignment };
    await saveExclusiveTierlist({ title, templateId: TEMPLATE_ID || 'sf-duel', payload });
    remixFlag = false;
    showToast('Ranking Saved');
  }catch(e){
    console.error(e);
    showToast(e.message || 'Save failed — check Supabase table');
  }
});

async function exportPNGBlob(){
  // Reuse export pipeline into blob without download
  return new Promise(async (resolve, reject) => {
    try{
      await exportPNG(true, resolve);
    }catch(e){ reject(e); }
  });
}

async function exportPNG(returnBlobOnly, blobCb){
  sanitizeState();
  if(!returnBlobOnly) showToast('Generating PNG...');
  const scale = 2; // pixel density / quality
  // Layout follows Size slider; scale=2 keeps sharp PNG
  const uiSize = parseInt(document.getElementById('sizeSlider')?.value || '64', 10);
  const cardW = Math.round(Math.min(140, Math.max(48, uiSize * 1.15)));
  const cardH = Math.round(cardW * (CARD_SHAPE === 'square' ? 1 : 1.35));
  const cardGap = 8;
  const padX = 14;
  const padY = 12;
  const labelW = 160;
  const width = 1600;

  const cardsAreaW = width - labelW - 8;
  const cardsPerLine = Math.max(1, Math.floor((cardsAreaW - padX + cardGap) / (cardW + cardGap)));

  const allIds = new Set();
  state.tiers.forEach(tier => (state.assignment[tier.id]||[]).forEach(id => allIds.add(id)));
  const imgCache = {};
  await Promise.all([...allIds].map(async cid => {
    try {
      const custom = state.customCards && state.customCards[cid];
      const src = custom ? custom.src : cardSrc(cid);
      const img = await loadImage(src);
      if(img && (img.naturalWidth || img.width)) imgCache[Number(cid)] = img;
    } catch(e) { console.warn('export img', cid, e); }
  }));

  const rowHeights = state.tiers.map(tier => {
    const n = (state.assignment[tier.id]||[]).length;
    const lines = Math.max(1, Math.ceil(n / cardsPerLine) || 1);
    return Math.max(padY*2 + cardH, padY*2 + lines * cardH + Math.max(0, lines-1)*cardGap);
  });
  const padTop = 24;
  const footH = 72;
  const height = padTop + rowHeights.reduce((a,b)=>a+b, 0) + footH;

  const canvas = document.getElementById('exportCanvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Clean dark background (no dual flares)
  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0, 0, width, height);
  // single soft vignette from top center
  const g1 = ctx.createRadialGradient(width*0.5, 0, 0, width*0.5, 0, height*0.45);
  g1.addColorStop(0, 'rgba(160,120,220,0.08)');
  g1.addColorStop(1, 'rgba(160,120,220,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  let y = padTop;
  for(let i = 0; i < state.tiers.length; i++){
    const tier = state.tiers[i];
    const rh = rowHeights[i];

    const c1 = `hsl(${tier.hue}, ${tier.sat}%, ${Math.min(88, tier.light + 4)}%)`;
    const c2 = `hsl(${tier.hue}, ${tier.sat}%, ${Math.max(28, tier.light - 8)}%)`;
    const grad = ctx.createLinearGradient(0, y, labelW, y + rh);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, labelW, rh);

    // left pill accent
    const pill = ctx.createLinearGradient(0, y, 0, y + rh);
    pill.addColorStop(0, `hsl(${tier.hue}, ${tier.sat}%, ${Math.min(95, tier.light+12)}%)`);
    pill.addColorStop(1, `hsl(${tier.hue}, ${tier.sat}%, ${tier.light}%)`);
    ctx.fillStyle = pill;
    ctx.fillRect(0, y, 8, rh);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitAndWrap(ctx, tier.name, 8 + (labelW-8)/2, y + rh/2, labelW - 20, 11, Math.min(20, Math.round(cardW*0.28)));

    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(labelW, y, width - labelW, rh);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + rh - 0.5);
    ctx.lineTo(width, y + rh - 0.5);
    ctx.stroke();

    const ids = state.assignment[tier.id] || [];
    const lines = Math.max(1, Math.ceil(ids.length / cardsPerLine));
    let x = labelW + padX;
    let cy = y + (lines > 1 ? padY : Math.max(padY, (rh - cardH) / 2));
    let col = 0;
    for(const cid of ids){
      const img = imgCache[Number(cid)] || imgCache[cid];
      if(img){
        try {
          const r = Math.max(6, Math.round(cardW * (CARD_SHAPE === 'square' ? 0.14 : 0.12)));
          ctx.save();
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(x, cy, cardW, cardH, r);
          else ctx.rect(x, cy, cardW, cardH);
          if(CARD_SHAPE === 'square'){
            // EX: solid dark plate + gold rim
            const bg = ctx.createLinearGradient(x, cy, x+cardW, cy+cardH);
            bg.addColorStop(0, 'rgba(40,32,60,0.95)');
            bg.addColorStop(1, 'rgba(18,14,28,0.98)');
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = 'rgba(230,200,140,0.75)';
            ctx.lineWidth = Math.max(1.5, cardW * 0.03);
            ctx.stroke();
            ctx.shadowColor = 'rgba(200,160,255,0.35)';
            ctx.shadowBlur = cardW * 0.12;
          } else {
            // SF Duel: same soft translucent plate as on site (no border)
            ctx.fillStyle = 'rgba(255,255,255,0.045)';
            ctx.fill();
          }
          // clip card art to rounded plate
          ctx.clip();
          ctx.drawImage(img, x, cy, cardW, cardH);
          ctx.restore();
        } catch(e){}
      }
      col++;
      if(col >= cardsPerLine){
        col = 0;
        x = labelW + padX;
        cy += cardH + cardGap;
      } else {
        x += cardW + cardGap;
      }
    }
    y += rh;
  }

  // Footer - epic minimal bar
  const footY = y;
  const midY = footY + footH / 2;
  // deep base
  ctx.fillStyle = '#161222';
  ctx.fillRect(0, footY, width, footH);
  // soft horizontal brand wash
  const wash = ctx.createLinearGradient(0, footY, width, footY);
  wash.addColorStop(0, 'rgba(150,110,230,0.16)');
  wash.addColorStop(0.5, 'rgba(200,160,240,0.06)');
  wash.addColorStop(1, 'rgba(130,150,230,0.14)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, footY, width, footH);
  // gentle center bloom
  const bloom = ctx.createRadialGradient(width/2, midY, 8, width/2, midY, Math.max(120, width*0.22));
  bloom.addColorStop(0, 'rgba(220,190,255,0.14)');
  bloom.addColorStop(1, 'rgba(220,190,255,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, footY, width, footH);
  // thin top edge glow
  const edge = ctx.createLinearGradient(0, footY, width, footY);
  edge.addColorStop(0, 'rgba(183,155,240,0)');
  edge.addColorStop(0.5, 'rgba(220,190,255,0.45)');
  edge.addColorStop(1, 'rgba(183,155,240,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, footY, width, 1.5);

  // Left: RANKME.LOL
  const titleGrad = ctx.createLinearGradient(28, midY, 240, midY);
  titleGrad.addColorStop(0, '#f0e6ff');
  titleGrad.addColorStop(1, '#c4b5e8');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 22px Montserrat, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RANKME.LOL', 36, midY);

  // Center logo
  try {
    const flogo = await loadImage('assets/brand/Footer_logo.png');
    const lh = 36;
    const lw = lh * (flogo.naturalWidth || flogo.width) / (flogo.naturalHeight || flogo.height || 1);
    ctx.drawImage(flogo, (width - lw) / 2, midY - lh / 2, lw, lh);
  } catch(e) {
    try {
      const flogo = await loadImage('assets/brand/Footer_logo.svg');
      const lh = 36;
      const lw = lh * (flogo.naturalWidth || flogo.width || 2) / (flogo.naturalHeight || flogo.height || 1);
      ctx.drawImage(flogo, (width - lw) / 2, midY - lh / 2, lw, lh);
    } catch(e2) {}
  }

  // Right: title + exclusive badge
  const rightLabel = BLANK_MODE ? 'Custom Tier List' : (TEMPLATE_FOOTER || TEMPLATE_TITLE || 'RankMe');
  ctx.font = '800 14px Montserrat, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0eafc';
  ctx.fillText(rightLabel, width - 36, midY - (BLANK_MODE ? 0 : 11));

  if(!BLANK_MODE){
    const badge = 'EXCLUSIVE';
    ctx.font = '800 10px Montserrat, system-ui, sans-serif';
    const bw = ctx.measureText(badge).width + 26;
    const bh = 20;
    const bx = width - 36 - bw;
    const by = midY + 5;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 10);
    else ctx.rect(bx, by, bw, bh);
    const badgeStroke = ctx.createLinearGradient(bx, by, bx+bw, by);
    badgeStroke.addColorStop(0, 'rgba(183,155,240,0.85)');
    badgeStroke.addColorStop(1, 'rgba(230,169,232,0.85)');
    ctx.strokeStyle = badgeStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(180,150,230,0.12)';
    ctx.fill();
    ctx.fillStyle = '#e0d4f8';
    ctx.textAlign = 'center';
    ctx.fillText(badge, bx + bw/2, by + bh/2 + 1);
  }

  canvas.toBlob(blob => {
    if(!blob){
      if(blobCb) blobCb(null);
      else showToast('Export failed');
      return;
    }
    if(returnBlobOnly && blobCb){ blobCb(blob); return; }
    const a = document.createElement('a');
    a.download = BLANK_MODE ? 'rankme-tierlist.png' : (TEMPLATE_EXPORT || 'rankme-sf-duel-tierlist.png');
    a.href = URL.createObjectURL(blob);
    a.click();
    showToast('PNG downloaded');
  }, 'image/png', 0.95);
}

function fitAndWrap(ctx, text, x, y, maxWidth, minSize, maxSize){
  let size = maxSize;
  let lines;
  while(size >= minSize){
    ctx.font = `900 ${size}px Montserrat, sans-serif`;
    lines = wrapLines(ctx, text, maxWidth);
    if(lines.length <= 2) break;
    size--;
  }
  ctx.font = `900 ${size}px Montserrat, sans-serif`;
  const lh = size*1.15;
  const startY = y - (lines.length-1)*lh/2;
  lines.forEach((l,i)=> ctx.fillText(l, x, startY + i*lh));
}
function wrapLines(ctx, text, maxWidth){
  const words = text.split(' ');
  let line = '', lines = [];
  for(const w of words){
    const test = line ? line+' '+w : w;
    if(ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = w; }
    else line = test;
  }
  lines.push(line);
  return lines;
}

function loadImage(src){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('fail '+src));
    img.src = src;
  });
}

// Strict match only - never substring match on id (was causing wrong/dupe cards in PNG)
function getCardImage(cid){
  const meta = CARD_META[cid];
  const custom = state.customCards && state.customCards[cid];
  if(custom && custom.src){
    const els = document.querySelectorAll('img');
    for(const el of els){
      if(el.complete && el.naturalWidth > 0 && el.getAttribute('src') === custom.src) return el;
    }
    return null;
  }
  if(!meta) return null;
  const file = meta.file; // e.g. card_046.png
  const els = document.querySelectorAll('img');
  for(const el of els){
    if(!el.complete || el.naturalWidth <= 0) continue;
    const attr = el.getAttribute('src') || '';
    if(attr === cardSrc(cid) || attr.endsWith('/'+file) || attr.endsWith(file)) return el;
    try{
      const u = new URL(el.src, location.href);
      if(u.pathname.endsWith('/'+file) || u.pathname.endsWith(file)) return el;
    }catch(e){}
  }
  return null;
}

/* ---------------- Leave warning ---------------- */

function hasProgress(){
  return Object.values(state.assignment).some(arr=>arr.length>0);
}

let allowLeave = false;
let pendingNav = '#';

// No native beforeunload when user already confirmed via our modal // for tab close only
window.addEventListener('beforeunload', (e)=>{
  if(allowLeave || !hasProgress()) return;
  // Only for real tab close / refresh — in-app nav uses our modal
  e.preventDefault();
  e.returnValue = '';
});

function bindLeaveGuard(el, href){
  if(!el || el.dataset.leaveBound) return;
  el.dataset.leaveBound = '1';
  el.addEventListener('click', (e)=>{
    const target = href || el.getAttribute('href') || '';
    if(!target || target === '#' || target.startsWith('javascript')) return;
    // same page
    try{
      const u = new URL(target, location.href);
      if(u.pathname === location.pathname && u.search === location.search && !u.hash){
        e.preventDefault();
        return;
      }
    }catch(_){}
    if(!hasProgress()) return;
    e.preventDefault();
    e.stopPropagation();
    pendingNav = target;
    document.getElementById('leaveModal')?.classList.add('open');
  }, true);
}

document.querySelectorAll('nav.main a, a.brand').forEach(a => bindLeaveGuard(a));
const loginBtn = document.getElementById('loginBtn');
if(loginBtn){
  loginBtn.dataset.navBound = '1';
  loginBtn.addEventListener('click', (e)=>{
    if(!hasProgress()){
      location.href = 'account.html';
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    pendingNav = 'account.html';
    document.getElementById('leaveModal')?.classList.add('open');
  }, true);
}

document.getElementById('stayBtn')?.addEventListener('click', ()=>{
  document.getElementById('leaveModal')?.classList.remove('open');
});
document.getElementById('leaveBtn')?.addEventListener('click', ()=>{
  document.getElementById('leaveModal')?.classList.remove('open');
  allowLeave = true;
  // detach beforeunload for this navigation
  window.onbeforeunload = null;
  window.location.href = pendingNav;
});

/* ---------------- Init ---------------- */
// Open from cabinet
try{
  const raw = sessionStorage.getItem('rankme_open_payload');
  if(raw){
    sessionStorage.removeItem('rankme_open_payload');
    const data = JSON.parse(raw);
    if(data.tiers && data.assignment){
      state.tiers = data.tiers;
      state.assignment = data.assignment;
      const used = new Set();
      Object.values(state.assignment).forEach(arr => arr.forEach(id=>used.add(id)));
      state.pool = freshPool().filter(id=>!used.has(id));
      window.__rankmeFromCabinet = true;
      sanitizeState();
      // + My images only after explicit Remix
    }
  }
}catch(e){}

(async ()=>{
  if(CARD_SHAPE === 'square') document.body.classList.add('card-square');
  if(NO_FACTIONS) document.body.classList.add('no-factions');
  const expertId = new URLSearchParams(location.search).get('e');
  if(expertId && applyExpertPreset(expertId)){
    // expert loaded
  }
  const sc = new URLSearchParams(location.search).get('s');
  if(sc && typeof loadShortLink === 'function'){
    try{
      const payload = await loadShortLink(sc);
      if(payload?.tiers && payload?.assignment){
        state.tiers = payload.tiers;
        state.assignment = payload.assignment;
        const used = new Set();
        Object.values(state.assignment).forEach(arr => arr.forEach(id=>used.add(id)));
        state.pool = freshPool().filter(id=>!used.has(id));
        window.__rankmeFromCabinet = true;
      }
    }catch(e){}
  }
  // Compressed hash shares (z...) need async decode on first load
  const h = location.hash.replace(/^#/,'');
  if(h && h[0]==='z' && !window.__rankmeFromCabinet){
    const ok = await loadFromHashAsync();
    if(ok){
      window.__rankmeFromCabinet = true;
      activeFilter = 'ALL';
    }
  }
  initState();
  // If still only sync-hash (legacy eyJ / r...), ensure rendered
  if(location.hash && location.hash.length > 2){
    applyHashState();
  }
  render();
  if(!BLANK_MODE) renderFactionFilters();
  renderPortals();
})();

if(BLANK_MODE){
  const ff = document.getElementById('factionFilters');
  if(ff) ff.style.display = 'none';
  const portalBtn = document.getElementById('portalBtn');
  // portals still useful in blank
  const upload = document.getElementById('uploadImgs');
  if(upload){
    upload.addEventListener('change', async (e)=>{
      const files = [...(e.target.files||[])];
      for(const f of files){
        if(!f.type.startsWith('image/')) continue;
        const src = await new Promise((res,rej)=>{
          const r = new FileReader();
          r.onload = ()=>res(r.result);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        const id = customIdSeq++;
        state.customCards[id] = { src, name: f.name.replace(/\.[^.]+$/, '') };
        state.pool.push(id);
      }
      renderPool();
      showToast(files.length + ' image(s) added');
      e.target.value = '';
    });
  }
} else {
  renderFactionFilters();
}
render();

window.addEventListener('hashchange', ()=>{
  if(location.hash && location.hash.length > 1){
    applyHashState();
    showToast('Expert tier list loaded');
  }
});

// ElDuD (and any expert link): always apply, even if hash is already the same
document.querySelectorAll('a.expert-name, #eldudLink').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href') || '';
    try{
      const u = new URL(href, location.href);
      const eid = u.searchParams.get('e');
      if(eid && EXPERT_PRESETS[eid.toLowerCase()]){
        e.preventDefault();
        if(applyExpertPreset(eid)){
          render();
          if(!BLANK_MODE) renderFactionFilters();
          renderPortals();
          showToast('Expert tier list loaded');
        }
        return;
      }
    }catch(err){}
    const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
    if(!hash || hash.length < 2) return;
    e.preventDefault();
    if(location.hash === hash){
      applyHashState();
      showToast('Expert tier list loaded');
    } else {
      location.hash = hash;
    }
  });
});
})();
