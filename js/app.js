(function(){
"use strict";

const CARD_META_LIST = [{"id": 1, "file": "card_001.png", "faction": "MASTER", "name": "Gen"}, {"id": 2, "file": "card_002.png", "faction": "MASTER", "name": "Akuma"}, {"id": 3, "file": "card_003.png", "faction": "MASTER", "name": "Gouken"}, {"id": 4, "file": "card_004.png", "faction": "MASTER", "name": "Rose"}, {"id": 5, "file": "card_005.png", "faction": "MASTER", "name": "Trendy Cammy"}, {"id": 6, "file": "card_006.png", "faction": "MASTER", "name": "Taoist Gen"}, {"id": 7, "file": "card_007.png", "faction": "MASTER", "name": "Trendt Ryu"}, {"id": 8, "file": "card_008.png", "faction": "MASTER", "name": "Athlete Chun-Li"}, {"id": 9, "file": "card_009.png", "faction": "MASTER", "name": "Trendy Dhalsim"}, {"id": 10, "file": "card_010.png", "faction": "MASTER", "name": "Dante"}, {"id": 11, "file": "card_011.png", "faction": "MASTER", "name": "Summer Yun"}, {"id": 12, "file": "card_012.png", "faction": "MASTER", "name": " Master Leonardo"}, {"id": 13, "file": "card_013.png", "faction": "MASTER", "name": "Raphael"}, {"id": 14, "file": "card_014.png", "faction": "MASTER", "name": "Luke"}, {"id": 15, "file": "card_015.png", "faction": "MASTER", "name": "Jp"}, {"id": 16, "file": "card_016.png", "faction": "MASTER", "name": "Summer Ibuki"}, {"id": 17, "file": "card_017.png", "faction": "MASTER", "name": "Diviner Rose"}, {"id": 18, "file": "card_018.png", "faction": "MASTER", "name": "Firecracker Sakura"}, {"id": 19, "file": "card_019.png", "faction": "MASTER", "name": "Rich E Honda"}, {"id": 20, "file": "card_020.png", "faction": "MASTER", "name": "Kunoichi Ibuki"}, {"id": 21, "file": "card_021.png", "faction": "MASTER", "name": "Cowbot T Hawk"}, {"id": 22, "file": "card_022.png", "faction": "MASTER", "name": "Banquet Guy"}, {"id": 23, "file": "card_023.png", "faction": "MASTER", "name": "Popstar Poison"}, {"id": 24, "file": "card_024.png", "faction": "MASTER", "name": "Popstar Chun Li"}, {"id": 25, "file": "card_025.png", "faction": "MASTER", "name": "Popstar Juri"}, {"id": 26, "file": "card_026.png", "faction": "MASTER", "name": "Hermit Gouken"}, {"id": 27, "file": "card_027.png", "faction": "MASTER", "name": "Summer Rose"}, {"id": 28, "file": "card_028.png", "faction": "INFERNAL", "name": "Juri"}, {"id": 29, "file": "card_029.png", "faction": "INFERNAL", "name": "Seth"}, {"id": 30, "file": "card_030.png", "faction": "INFERNAL", "name": "M Bison"}, {"id": 31, "file": "card_031.png", "faction": "INFERNAL", "name": "Balrog"}, {"id": 32, "file": "card_032.png", "faction": "INFERNAL", "name": "Vega"}, {"id": 33, "file": "card_033.png", "faction": "INFERNAL", "name": "Sagat"}, {"id": 34, "file": "card_034.png", "faction": "INFERNAL", "name": "Evil Ryu"}, {"id": 35, "file": "card_035.png", "faction": "INFERNAL", "name": "Oni"}, {"id": 36, "file": "card_036.png", "faction": "INFERNAL", "name": "Witch Juri"}, {"id": 37, "file": "card_037.png", "faction": "INFERNAL", "name": "Gore Magala Ken"}, {"id": 38, "file": "card_038.png", "faction": "INFERNAL", "name": "Vergil"}, {"id": 39, "file": "card_039.png", "faction": "INFERNAL", "name": "Michelangelo"}, {"id": 40, "file": "card_040.png", "faction": "INFERNAL", "name": "Donatello"}, {"id": 41, "file": "card_041.png", "faction": "INFERNAL", "name": "Vizconde Vega"}, {"id": 42, "file": "card_042.png", "faction": "INFERNAL", "name": "Pharaoh Sagat"}, {"id": 43, "file": "card_043.png", "faction": "INFERNAL", "name": "Archon Decapre"}, {"id": 44, "file": "card_044.png", "faction": "INFERNAL", "name": "Chief Viper"}, {"id": 45, "file": "card_045.png", "faction": "INFERNAL", "name": "Giant Wrestler Hugo"}, {"id": 46, "file": "card_046.png", "faction": "INFERNAL", "name": "Overlord Bison"}, {"id": 47, "file": "card_047.png", "faction": "INFERNAL", "name": "Summer Poison"}, {"id": 48, "file": "card_048.png", "faction": "INFERNAL", "name": "Horror Hakan"}, {"id": 49, "file": "card_049.png", "faction": "INFERNAL", "name": "Shadaloo Cammy"}, {"id": 50, "file": "card_050.png", "faction": "INFERNAL", "name": "Shadow Ryu"}, {"id": 51, "file": "card_051.png", "faction": "INFERNAL", "name": "Cold-Hearted Adon"}, {"id": 52, "file": "card_052.png", "faction": "WIND", "name": "Chun Li"}, {"id": 53, "file": "card_053.png", "faction": "WIND", "name": "Guile"}, {"id": 54, "file": "card_054.png", "faction": "WIND", "name": "Abel"}, {"id": 55, "file": "card_055.png", "faction": "WIND", "name": "Cammy"}, {"id": 56, "file": "card_056.png", "faction": "WIND", "name": "Guy"}, {"id": 57, "file": "card_057.png", "faction": "WIND", "name": "Yun"}, {"id": 58, "file": "card_058.png", "faction": "WIND", "name": "Yang"}, {"id": 59, "file": "card_059.png", "faction": "WIND", "name": "T Hawk"}, {"id": 60, "file": "card_060.png", "faction": "WIND", "name": "El Fuerte"}, {"id": 61, "file": "card_061.png", "faction": "WIND", "name": "Beast Zangief"}, {"id": 62, "file": "card_062.png", "faction": "WIND", "name": "Street Poison"}, {"id": 63, "file": "card_063.png", "faction": "WIND", "name": "Summer Elena"}, {"id": 64, "file": "card_064.png", "faction": "WIND", "name": "Trendy Akuma"}, {"id": 65, "file": "card_065.png", "faction": "WIND", "name": "Royal Balrog"}, {"id": 66, "file": "card_066.png", "faction": "WIND", "name": "Saikyo Dan"}, {"id": 67, "file": "card_067.png", "faction": "WIND", "name": "Nishiki Sakura"}, {"id": 68, "file": "card_068.png", "faction": "THUNDER", "name": "Blanka"}, {"id": 69, "file": "card_069.png", "faction": "THUNDER", "name": "E Honda"}, {"id": 70, "file": "card_070.png", "faction": "THUNDER", "name": "Zangief"}, {"id": 71, "file": "card_071.png", "faction": "THUNDER", "name": "Poison"}, {"id": 72, "file": "card_072.png", "faction": "THUNDER", "name": "Elena"}, {"id": 73, "file": "card_073.png", "faction": "THUNDER", "name": "Makoto"}, {"id": 74, "file": "card_074.png", "faction": "THUNDER", "name": "Mad Ryu"}, {"id": 75, "file": "card_075.png", "faction": "THUNDER", "name": "Combat Guile"}, {"id": 76, "file": "card_076.png", "faction": "THUNDER", "name": "Mummy Dhalsim"}, {"id": 77, "file": "card_077.png", "faction": "THUNDER", "name": "Suit Abel"}, {"id": 78, "file": "card_078.png", "faction": "THUNDER", "name": "Trendy Guile"}, {"id": 79, "file": "card_079.png", "faction": "THUNDER", "name": "Charming Dudley"}, {"id": 80, "file": "card_080.png", "faction": "THUNDER", "name": "Baddest Juri"}, {"id": 81, "file": "card_081.png", "faction": "THUNDER", "name": "Action Guy"}, {"id": 82, "file": "card_082.png", "faction": "THUNDER", "name": "Banquet Rose"}, {"id": 83, "file": "card_083.png", "faction": "THUNDER", "name": "Horror Oni"}, {"id": 84, "file": "card_084.png", "faction": "FLAME", "name": "Dhalsim"}, {"id": 85, "file": "card_085.png", "faction": "FLAME", "name": "Hugo"}, {"id": 86, "file": "card_086.png", "faction": "FLAME", "name": "C Viper"}, {"id": 87, "file": "card_087.png", "faction": "FLAME", "name": "Adon"}, {"id": 88, "file": "card_088.png", "faction": "FLAME", "name": "Decapre"}, {"id": 89, "file": "card_089.png", "faction": "FLAME", "name": "Fei Long"}, {"id": 90, "file": "card_090.png", "faction": "FLAME", "name": "Dee Jay"}, {"id": 91, "file": "card_091.png", "faction": "FLAME", "name": "Dudley"}, {"id": 92, "file": "card_092.png", "faction": "FLAME", "name": "Mayor Cody"}, {"id": 93, "file": "card_093.png", "faction": "FLAME", "name": "Cammy & Vega"}, {"id": 94, "file": "card_094.png", "faction": "FLAME", "name": "Summer Yang"}, {"id": 95, "file": "card_095.png", "faction": "FLAME", "name": "Fire Adon"}, {"id": 96, "file": "card_096.png", "faction": "FLAME", "name": "Furisode Makoto"}, {"id": 97, "file": "card_097.png", "faction": "FLAME", "name": "Banquet Cammy"}, {"id": 98, "file": "card_098.png", "faction": "FLAME", "name": "Summer Cody"}, {"id": 99, "file": "card_099.png", "faction": "FLAME", "name": "Monk Bison"}, {"id": 100, "file": "card_100.png", "faction": "LEGENDARY", "name": "Flame Chun Li"}, {"id": 101, "file": "card_101.png", "faction": "LEGENDARY", "name": "Fashion Sakura"}, {"id": 102, "file": "card_102.png", "faction": "LEGENDARY", "name": "Fashion Blanka"}, {"id": 103, "file": "card_103.png", "faction": "LEGENDARY", "name": "Jonin Ibuki"}, {"id": 104, "file": "card_104.png", "faction": "LEGENDARY", "name": "Nero"}, {"id": 105, "file": "card_105.png", "faction": "LEGENDARY", "name": "Shredder"}, {"id": 106, "file": "card_106.png", "faction": "LEGENDARY", "name": "Christmas Rufus"}, {"id": 107, "file": "card_107.png", "faction": "LEGENDARY", "name": "Fashion Ken"}, {"id": 108, "file": "card_108.png", "faction": "LEGENDARY", "name": "Hydro Chun Li"}, {"id": 109, "file": "card_109.png", "faction": "LEGENDARY", "name": "Trendy Elena"}, {"id": 110, "file": "card_110.png", "faction": "LEGENDARY", "name": "Agent C Viper"}, {"id": 111, "file": "card_111.png", "faction": "LEGENDARY", "name": "Banquet Guile"}, {"id": 112, "file": "card_112.png", "faction": "LEGENDARY", "name": "Fashion E Honda"}, {"id": 113, "file": "card_113.png", "faction": "LEGENDARY", "name": "Santa Blanka"}, {"id": 114, "file": "card_114.png", "faction": "LEGENDARY", "name": "Vacation Dee Jay"}, {"id": 115, "file": "card_115.png", "faction": "LEGENDARY", "name": "Banquet Fei Long"}, {"id": 116, "file": "card_116.png", "faction": "LEGENDARY", "name": "Mech Zangief"}, {"id": 117, "file": "card_117.png", "faction": "LEGENDARY", "name": "Cupid Hugo"}, {"id": 118, "file": "card_118.png", "faction": "LEGENDARY", "name": "Zombie Cody"}, {"id": 119, "file": "card_119.png", "faction": "LEGENDARY", "name": "Fairy Makoto"}, {"id": 120, "file": "card_120.png", "faction": "LEGENDARY", "name": "Magican Rolento"}, {"id": 121, "file": "card_121.png", "faction": "LEGENDARY", "name": "Luchador El Fuerte"}, {"id": 122, "file": "card_122.png", "faction": "A+", "name": "Ibuki"}, {"id": 123, "file": "card_123.png", "faction": "A+", "name": "Cody"}, {"id": 124, "file": "card_124.png", "faction": "A+", "name": "Rufus"}, {"id": 125, "file": "card_125.png", "faction": "A+", "name": "Dan"}, {"id": 126, "file": "card_126.png", "faction": "A+", "name": "Sakura"}, {"id": 127, "file": "card_127.png", "faction": "A+", "name": "Ryu"}, {"id": 128, "file": "card_128.png", "faction": "A+", "name": "Hakan"}, {"id": 129, "file": "card_129.png", "faction": "A+", "name": "Ken"}, {"id": 130, "file": "card_130.png", "faction": "A+", "name": "Rolento"}];
const CARD_META = {};
CARD_META_LIST.forEach(c => CARD_META[c.id] = c);
const N_CARDS = CARD_META_LIST.length;
const FACTIONS = [...new Set(CARD_META_LIST.map(c=>c.faction))];
const FACTION_HUE = {MASTER:255, INFERNAL:0, WIND:172, THUNDER:48, FLAME:14, LEGENDARY:300, 'A+':210};
const FACTION_ICON = {};
FACTIONS.forEach(f => FACTION_ICON[f] = `assets/factions/${f}_icon.svg`);
const ALL_ICON = 'assets/factions/ALL_icon.svg';

const cardSrc = id => `assets/cards/${CARD_META[id].file}`;

const DEFAULT_TIERS = [
  {id:'t1', name:'GOD',            hue:255, sat:55, light:82},
  {id:'t2', name:'BOSSES META',    hue:355, sat:70, light:65},
  {id:'t3', name:'PVP META',       hue:28,  sat:65, light:62},
  {id:'t4', name:'ASSISTANT META', hue:320, sat:65, light:65},
  {id:'t5', name:'GOOD',           hue:268, sat:50, light:62},
  {id:'t6', name:'ASSISTANT',      hue:220, sat:35, light:52},
  {id:'t7', name:'TOWERS',         hue:172, sat:50, light:52},
  {id:'t8', name:'DECENT',         hue:135, sat:38, light:48},
  {id:'t9', name:'DISSAPOINTED',   hue:110, sat:55, light:70},
  {id:'t10',name:'BAD',            hue:100, sat:55, light:82},
];

let state = {
  tiers: JSON.parse(JSON.stringify(DEFAULT_TIERS)),
  assignment: {},
  pool: [],
  rowIdSeq: 11,
};

function freshPool(){ return Array.from({length:N_CARDS}, (_,i)=>i+1); }

function loadFromHash(){
  const h = location.hash.replace(/^#/,'');
  if(!h) return false;
  try{
    const json = decodeURIComponent(escape(atob(h)));
    const data = JSON.parse(json);
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

function initState(){
  if(loadFromHash()) return;
  state.assignment = {};
  state.tiers.forEach(t=> state.assignment[t.id] = []);
  state.pool = freshPool();
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

    boardInner.appendChild(row);
  });
  renderPool();
}

function fitLabelFont(el, text){
  let size = 15;
  el.style.fontSize = size+'px';
  const maxTries = 12;
  let tries = 0;
  while(tries < maxTries && (el.scrollHeight > el.clientHeight+2 || el.scrollWidth > el.clientWidth+2) && size > 8){
    size -= 1;
    el.style.fontSize = size+'px';
    tries++;
  }
}

let activeFilter = 'ALL';

function renderPool(){
  poolEl.innerHTML = '';
  const visible = activeFilter==='ALL' ? state.pool : state.pool.filter(id=>CARD_META[id].faction===activeFilter);
  visible.forEach(cid => poolEl.appendChild(makeCard(cid)));
}

function makeCard(cid){
  const meta = CARD_META[cid];
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.cardId = cid;
  const img = document.createElement('img');
  img.src = cardSrc(cid);
  img.loading = 'lazy';
  img.draggable = false;
  img.alt = meta ? meta.name : ('Fighter #' + cid);
  el.title = meta ? meta.name : '';
  el.appendChild(img);
  el.addEventListener('pointerdown', onCardPointerDown);
  return el;
}

function renderFactionFilters(){
  const wrap = document.getElementById('factionFilters');
  wrap.innerHTML = '';
  const mkBtn = (key, label, icon, hue) => {
    const b = document.createElement('button');
    b.className = 'faction-btn' + (activeFilter===key ? ' active' : '');
    if(hue!==undefined) b.style.setProperty('--fhue', hue);
    const img = document.createElement('img');
    img.src = icon; img.alt='';
    b.appendChild(img);
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', ()=>{ activeFilter = key; renderFactionFilters(); renderPool(); });
    wrap.appendChild(b);
  };
  mkBtn('ALL', 'All', ALL_ICON);
  FACTIONS.forEach(f => mkBtn(f, f, FACTION_ICON[f] ?? ALL_ICON, FACTION_HUE[f] ?? 220));
}

function moveRow(idx, dir){
  const j = idx+dir;
  if(j<0 || j>=state.tiers.length) return;
  const tmp = state.tiers[idx];
  state.tiers[idx] = state.tiers[j];
  state.tiers[j] = tmp;
  render();
}

/* ---------------- Drag & drop (pointer-based, mouse+touch) ---------------- */

let drag = null;
let autoScrollRAF = null;

function onCardPointerDown(e){
  if(e.button !== undefined && e.button !== 0) return;
  if(drag) return; // ignore extra touches mid-drag
  const source = e.currentTarget;
  const cid = source.dataset.cardId;
  const rect = source.getBoundingClientRect();

  const floater = source.cloneNode(true);
  floater.classList.add('floating');
  floater.style.width = rect.width+'px';
  floater.style.height = rect.height+'px';
  floater.style.left = rect.left+'px';
  floater.style.top = rect.top+'px';
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
  };

  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
  e.preventDefault();
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

  drag.floater.style.left = (e.clientX - drag.offX)+'px';
  drag.floater.style.top = (e.clientY - drag.offY)+'px';

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
      // pool never reorders — just append, actual order is re-sorted by id on render
      cont.appendChild(ph);
    } else {
      const children = [...cont.children].filter(c=>!c.classList.contains('placeholder') && c!==drag.source);
      let inserted = false;
      for(const child of children){
        const b = child.getBoundingClientRect();
        const midX = b.left + b.width/2;
        const midY = b.top + b.height/2;
        if(e.clientY < b.top - 4) continue;
        if(e.clientY < b.bottom + 4 && (e.clientY < midY || Math.abs(e.clientY-midY) < b.height*0.6)){
          if(e.clientX < midX){ cont.insertBefore(ph, child); inserted = true; break; }
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
}

function onDragEnd(e){
  if(!drag || (e.pointerId!==undefined && e.pointerId !== drag.pointerId)) return;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);
  if(autoScrollRAF){ cancelAnimationFrame(autoScrollRAF); autoScrollRAF=null; }

  document.querySelectorAll('.tier-row').forEach(r=>r.classList.remove('drag-over'));

  const cid = parseInt(drag.cid);
  removeFromAllData(cid);

  if(drag.targetContainer){
    const cont = drag.targetContainer;
    const ids = [...cont.children].filter(c=>c!==drag.source).map(c => c.classList.contains('placeholder') ? cid : parseInt(c.dataset.cardId));
    if(cont.classList.contains('pool')){
      state.pool = ids.sort((a,b)=>a-b);
    } else {
      state.assignment[cont.dataset.tierId] = ids;
    }
  } else {
    if(drag.startedContainer.classList.contains('pool')){ state.pool.push(cid); state.pool.sort((a,b)=>a-b); }
    else {
      const tid = drag.startedContainer.dataset.tierId;
      if(state.assignment[tid]) state.assignment[tid].push(cid);
    }
  }

  drag.floater.remove();
  if(drag.placeholder) drag.placeholder.remove();
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
sizeSlider.addEventListener('input', (e)=>{
  document.documentElement.style.setProperty('--card-w', e.target.value+'px');
});
document.getElementById('sizeResetBtn').addEventListener('click', ()=>{
  sizeSlider.value = 64;
  document.documentElement.style.setProperty('--card-w', '64px');
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
  showConfirm('Clear the whole tier list?', 'Every fighter will go back to the pool. This can\'t be undone.', ()=>{
    state.assignment = {};
    state.tiers.forEach(t=>state.assignment[t.id]=[]);
    state.pool = freshPool();
    history.replaceState(null,'',location.pathname);
    render();
    showToast('Tier list cleared');
  });
});

document.getElementById('fillAllBtn').addEventListener('click', ()=>{
  showConfirm('Fill all rows randomly?', 'Every fighter still in the pool will be dropped into a random row — handy as a starting point before you sort them.', ()=>{
    const shuffled = [...state.pool].sort(()=>Math.random()-0.5);
    shuffled.forEach(cid=>{
      const t = state.tiers[Math.floor(Math.random()*state.tiers.length)];
      state.assignment[t.id].push(cid);
    });
    state.pool = [];
    render();
    showToast('Filled all rows randomly');
  });
});

function buildShareUrl(){
  const data = { tiers: state.tiers, assignment: state.assignment };
  const json = JSON.stringify(data);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return location.origin + location.pathname + '#' + b64;
}

function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>el.classList.remove('show'), 2400);
}

document.getElementById('shareDiscord').addEventListener('click', ()=>{
  const url = buildShareUrl();
  navigator.clipboard?.writeText(url).then(()=> showToast('Link copied — paste it into Discord'))
    .catch(()=> showToast(url));
});
document.getElementById('shareTelegram').addEventListener('click', ()=>{
  const url = buildShareUrl();
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('My Street Fighter: Duel tier list on RankMe')}`, '_blank');
});
document.getElementById('shareX').addEventListener('click', ()=>{
  const url = buildShareUrl();
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('My Street Fighter: Duel tier list on RankMe 🥊')}&url=${encodeURIComponent(url)}`, '_blank');
});

document.getElementById('downloadBtn').addEventListener('click', exportPNG);

async function exportPNG(){
  const scale = 2;
  const width = 1200;
  const rowH = 110;
  const padTop = 40;
  const footH = 90;
  const height = padTop + state.tiers.length * rowH + footH;

  const canvas = document.getElementById('exportCanvas');
  canvas.width = width*scale; canvas.height = height*scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale,scale);

  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0,0,width,height);

  let y = padTop;
  for(const t of state.tiers){
    ctx.fillStyle = `hsl(${t.hue},${t.sat}%,${t.light}%)`;
    ctx.fillRect(0, y, 130, rowH-2);
    ctx.fillStyle = '#fff';
    ctx.font = '900 20px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitAndWrap(ctx, t.name, 65, y+rowH/2, 118, 20, 22);

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(130, y, width-130, rowH-2);

    const ids = state.assignment[t.id]||[];
    let x = 140;
    for(const cid of ids){
      try{
        const img = await loadImage(cardSrc(cid));
        const cw = 70, ch = 94;
        ctx.drawImage(img, x, y+8, cw, ch);
        x += cw+6;
        if(x > width-80) break;
      }catch(e){}
    }
    y += rowH;
  }

  try{
    const logo = await loadImage('assets/brand/Footer_logo.svg');
    const lh = 46, lw = lh * (logo.width/logo.height);
    ctx.drawImage(logo, 20, y+22, lw, lh);
  }catch(e){}
  ctx.fillStyle = '#a79fc4';
  ctx.font = '700 13px Montserrat, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('RANKME.LOL — create tier lists in seconds, drag, drop, share.', 90, y+52);

  canvas.toBlob(blob=>{
    const link = document.createElement('a');
    link.download = 'rankme-sf-duel-tierlist.png';
    link.href = URL.createObjectURL(blob);
    link.click();
  });
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
  return new Promise((res,rej)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/* ---------------- Leave warning ---------------- */

function hasProgress(){
  return Object.values(state.assignment).some(arr=>arr.length>0);
}

window.addEventListener('beforeunload', (e)=>{
  if(hasProgress()){ e.preventDefault(); e.returnValue=''; }
});

document.querySelectorAll('nav.main a, .brand').forEach(a=>{
  a.addEventListener('click', (e)=>{
    if(hasProgress()){
      e.preventDefault();
      pendingNav = a.getAttribute('href') || '#';
      document.getElementById('leaveModal').classList.add('open');
    }
  });
});
let pendingNav = '#';
document.getElementById('stayBtn').addEventListener('click', ()=>{
  document.getElementById('leaveModal').classList.remove('open');
});
document.getElementById('leaveBtn').addEventListener('click', ()=>{
  document.getElementById('leaveModal').classList.remove('open');
  window.location.href = pendingNav;
});

/* ---------------- Init ---------------- */
initState();
renderFactionFilters();
render();
})();
