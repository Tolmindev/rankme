(function(){
"use strict";

/* ---- Template override (EX-Move etc.) ---- */
const TMPL = window.RANKME_TEMPLATE || null;
const CARD_SHAPE = (TMPL && TMPL.cardShape) || 'portrait';
const CARD_ASPECT = (TMPL && TMPL.cardAspect) || (CARD_SHAPE === 'square' ? 1 : 1.35);
const CARD_PATH = (TMPL && TMPL.cardPath) || 'assets/cards/';
const NO_FACTIONS = !!(TMPL && TMPL.noFactions);
const TEMPLATE_ID = (TMPL && TMPL.id) || (window.RANKME_BLANK ? 'blank' : 'sf-duel');
try { if (typeof trackTemplateUse === 'function' && TEMPLATE_ID && TEMPLATE_ID !== 'blank') trackTemplateUse(TEMPLATE_ID, 'open'); } catch (e) {}
const TEMPLATE_TITLE = (TMPL && TMPL.title) || 'Street Fighter: Duel';
const TEMPLATE_EXPORT = (TMPL && TMPL.exportName) || null;
const TEMPLATE_FOOTER = (TMPL && TMPL.footerLabel) || null;
const THEME_GOLD = !!(TMPL && TMPL.theme === 'gold');
const FACTION_ORDER = (TMPL && TMPL.factionOrder) || null;
const FACTION_ICON_MAP = (TMPL && TMPL.factionIcons) || null;

const BLANK_MODE = !!window.RANKME_BLANK;
/* Card data lives in templates/*.json only (loaded as window.RANKME_TEMPLATE). */
const DEFAULT_CARD_META_LIST = [];
// Blank builder: no stock cards - only user uploads
const CARD_META_LIST = BLANK_MODE
  ? []
  : ((TMPL && Array.isArray(TMPL.cards) && TMPL.cards.length)
      ? TMPL.cards
      : (console.warn('[RankMe] No template cards — load via boot.js / templates/*.json'), DEFAULT_CARD_META_LIST));
const CARD_META = {};
CARD_META_LIST.forEach(c => CARD_META[c.id] = c);
const N_CARDS = CARD_META_LIST.length;
const FACTIONS = NO_FACTIONS ? [] : (
  FACTION_ORDER || [...new Set(CARD_META_LIST.flatMap(c => Array.isArray(c.roles) ? c.roles : [c.faction]))]
);
const FACTION_HUE = {MASTER:210, INFERNAL:275, WIND:210, THUNDER:48, FLAME:8, LEGENDARY:290, 'A+':32, Fighter:30, Tank:200, Mage:270, Assassin:0, Marksman:50, Support:160, Strength:270, Agility:280, Intelligence:265, Universal:275};
const FACTION_ICON = {};
FACTIONS.forEach(f => {
  FACTION_ICON[f] = (FACTION_ICON_MAP && FACTION_ICON_MAP[f]) || (`assets/factions/${f}_icon.svg`);
});
const ALL_ICON = 'assets/factions/ALL_icon.svg';

const cardSrc = id => {
  if(state.customCards && state.customCards[id]) return state.customCards[id].src;
  if(CARD_META[id]) return CARD_PATH + CARD_META[id].file;
  return CARD_PATH + `card_${String(id).padStart(3,'0')}.webp`;
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

const EXPERT_PRESETS = Object.assign({}, {"eldud":{"tiers":[{"id":"t1","hue":255,"sat":55,"name":"GOD","light":82},{"id":"t2","hue":355,"sat":70,"name":"BOSSES META","light":65},{"id":"t3","hue":28,"sat":65,"name":"PVP META","light":62},{"id":"t4","hue":320,"sat":65,"name":"ASSISTANT META","light":65},{"id":"t5","hue":268,"sat":50,"name":"GOOD","light":62},{"id":"t6","hue":220,"sat":35,"name":"ASSISTANT","light":52},{"id":"t7","hue":172,"sat":50,"name":"SUPREME FIST","light":52},{"id":"t8","hue":135,"sat":38,"name":"DECENT","light":48},{"id":"t9","hue":110,"sat":55,"name":"DISAPPOINTED","light":70},{"id":"t10","hue":100,"sat":55,"name":"BAD","light":82}],"assignment":{"t1":[46,23,118,41,12,95,99,115,62,21],"t2":[116,6,100,19,77,17,42,81,13,65,121],"t3":[50,83,38,8,7,15,3,63,26,51,39,16,69],"t4":[40,24,49,34,89,71,54,61,27,1],"t5":[14,35,82,45,117,10,105,119,30,70,33,11,9,72,29],"t6":[120,36,4,78,20,18,44,92,74,31,108,104,109,102,57,58,101],"t7":[86,93,97,64,53,94,84,76,67,66,68,52,96,90,88,85,98,80,75],"t8":[47,43,113,114,110,106,59,111,73,112,123,56],"t9":[25,107,37,22,32,5,103,48],"t10":[2,55,28,91,79,87,60]}}}, (window.RANKME_EXPERT_PRESETS || {}));

const BLANK_TIERS = [
  {id:'t1', name:'S', hue:0,   sat:70, light:62},
  {id:'t2', name:'A', hue:28,  sat:65, light:58},
  {id:'t3', name:'B', hue:48,  sat:55, light:55},
  {id:'t4', name:'C', hue:140, sat:40, light:50},
  {id:'t5', name:'D', hue:220, sat:35, light:48},
];

let state = {
  // Exclusive opens with standard S-D strips; ElDuD hash loads expert layout
  tiers: JSON.parse(JSON.stringify(BLANK_TIERS)),
  assignment: {},
  pool: [],
  rowIdSeq: 6,
  customCards: {}, // id -> {src dataURL, name}
};

let customIdSeq = 10000;

function freshPool(){
  if(BLANK_MODE) return [];
  // Preserve template card order (not numeric id sort) so new legendaries stay after their peers
  return CARD_META_LIST.map(function (c) { return Number(c.id); }).filter(function (id) { return id > 0; });
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
  // rebuild pool: stock leftovers (exclusive only) + unplaced custom
  state.pool = [];
  if(!BLANK_MODE){
    for(let i=1;i<=N_CARDS;i++){
      if(!seen.has(i)) state.pool.push(i);
    }
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
    let title = null;
    try { title = sessionStorage.getItem('rankme_blank_title'); } catch(e){}
    if(!title){ try { title = localStorage.getItem('rankme_draft_title'); } catch(e){} }
    const el = document.getElementById('listTitle');
    if(el){
      if(title && title !== 'My tier list') el.textContent = title;
      else el.textContent = 'My Rank';
      try { localStorage.setItem('rankme_draft_title', el.textContent); } catch(e){}
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

    const label = document.createElement('div');
    label.className = 'tier-label';
    label.contentEditable = 'true';
    label.spellcheck = false;
    label.style.setProperty('--hue', t.hue);
    label.style.setProperty('--sat', t.sat+'%');
    label.style.setProperty('--light', t.light+'%');
    label.textContent = t.name;
    fitLabelFont(label, t.name);
    label.addEventListener('focus', ()=>{
      const name = t.name || (label.innerText || '');
      fitLabelFont(label, name);
      // Caret to end for quick edit
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(label);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) {}
    });
    label.addEventListener('input', ()=>{
      t.name = (label.innerText || '').replace(/\u00a0/g, ' ');
      fitLabelFontLive(label);
    });
    label.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        e.stopPropagation();
        // Insert \n at caret, then reflow per-line sizes (no execCommand)
        const off = getLabelCaretOffset(label);
        const text = (label.innerText || '').replace(/\u00a0/g, ' ');
        const next = text.slice(0, off) + '\n' + text.slice(off);
        t.name = next;
        fitLabelFont(label, next, true);
        setLabelCaretOffset(label, off + 1);
      }
    });
    label.addEventListener('blur', ()=>{
      let name = (label.innerText || '').replace(/\u00a0/g, ' ').replace(/\n+$/,'');
      if(!name.trim()) name = 'ROW';
      t.name = name;
      fitLabelFont(label, name);
    });

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

function labelLineFontSize(line){
  const len = (line || '').replace(/\s+/g, '').length || 1;
  // Same curve as before — per line
  if(len <= 1) return 24;
  if(len === 2) return 18;
  if(len <= 4) return 15;
  if(len <= 8) return 13;
  return 12;
}

function getLabelCaretOffset(el){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  if(!el.contains(range.endContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setLabelCaretOffset(el, offset){
  const sel = window.getSelection();
  if(!sel) return;
  let current = 0;
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  const range = document.createRange();
  while((node = walk.nextNode())){
    const len = node.textContent.length;
    if(current + len >= offset){
      range.setStart(node, Math.max(0, offset - current));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    current += len;
  }
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function fitLabelFontLive(el){
  // Per-line sizes while typing; keep trailing empty line so Enter works
  const off = getLabelCaretOffset(el);
  const text = (el.innerText || '').replace(/\u00a0/g, ' ');
  const norm = normalizeLabelText(text, true);
  fitLabelFont(el, norm.raw, true);
  setLabelCaretOffset(el, Math.min(off, norm.raw.length));
}

function normalizeLabelText(text, keepTrailingEmpty){
  let raw = String(text == null ? '' : text).replace(/\r/g, '');
  const lines = raw.split('\n');
  if(!keepTrailingEmpty){
    // Blur / final: drop trailing empty lines (fixes "SS" shifted up after Enter+Backspace)
    while(lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  }
  return { raw: lines.join('\n'), lines: lines };
}

function fitLabelFont(el, text, keepTrailingEmpty){
  const norm = normalizeLabelText(text, keepTrailingEmpty);
  const lines = norm.lines;
  el.style.fontSize = '';
  el.style.lineHeight = '1.15';
  el.textContent = '';

  if(lines.length <= 1){
    const line = lines[0] || '';
    el.textContent = line;
    let size = labelLineFontSize(line);
    el.style.fontSize = size + 'px';
    el.style.lineHeight = (line.replace(/\s+/g, '').length <= 2) ? '1' : '1.15';
    let tries = 0;
    while(tries < 8 && (el.scrollHeight > el.clientHeight+2 || el.scrollWidth > el.clientWidth+2) && size > 12){
      size -= 1;
      el.style.fontSize = size + 'px';
      tries++;
    }
    return;
  }

  // Multi-line: each line keeps its own size
  lines.forEach(function(line){
    const span = document.createElement('span');
    span.className = 'tier-label-line';
    span.textContent = line.length ? line : '\u00a0';
    span.style.fontSize = labelLineFontSize(line) + 'px';
    el.appendChild(span);
  });
}

let activeFilter = 'ALL';

function cardMatchesFilter(id, filter){
  if(!filter || filter === 'ALL') return true;
  const m = CARD_META[id];
  if(!m) return false;
  if(Array.isArray(m.roles) && m.roles.length){
    return m.roles.some(r => String(r).toLowerCase() === String(filter).toLowerCase());
  }
  return String(m.faction || '').toLowerCase() === String(filter).toLowerCase();
}

function renderPool(){
  if(!poolEl) return;
  state.pool = [...new Set(state.pool.map(Number))].filter(id => id > 0);
  // Single source of truth: template / CARD_META_LIST order (not numeric id)
  var order = {};
  CARD_META_LIST.forEach(function (c, i) { order[Number(c.id)] = i; });
  state.pool.sort(function (a, b) {
    var oa = order.hasOwnProperty(a) ? order[a] : 1e9 + a;
    var ob = order.hasOwnProperty(b) ? order[b] : 1e9 + b;
    return oa - ob;
  });

  const existing = new Map();
  Array.from(poolEl.querySelectorAll('.card')).forEach(el => {
    const id = Number(el.dataset.cardId);
    if(id) existing.set(id, el);
  });

  const poolSet = new Set(state.pool);
  existing.forEach((el, id) => {
    if(!poolSet.has(id)){
      el.remove();
      existing.delete(id);
    }
  });

  // Create missing cards, then move every node into template order via appendChild
  state.pool.forEach(cid => {
    var el = existing.get(cid);
    if(!el){
      try {
        el = makeCard(cid);
        existing.set(cid, el);
      } catch(e){ console.warn('card', cid, e); return; }
    }
    poolEl.appendChild(el);
    el.style.display = cardMatchesFilter(cid, activeFilter) ? '' : 'none';
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
  // eager: filter toggles must not cancel loads (lazy + innerHTML wipe caused vanishing cards)
  img.loading = 'eager';
  img.decoding = 'async';
  img.draggable = false;
  img.alt = '';
  img.onerror = function(){ this.onerror = null; this.style.opacity = '0.35'; };
  el.title = custom ? custom.name : (meta ? meta.name : '');
  el.appendChild(img);
  el.addEventListener('pointerdown', onCardPointerDown, { passive: false });
  // iOS Safari: block native scroll/gesture on the card itself
  el.addEventListener('touchstart', function(ev){
    // only mark; actual drag via pointer events
  }, { passive: true });
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
  showToast(portalsOn ? 'Portals on' : 'Portals off');
});

/* ---------------- Drag & drop (pointer-based, mouse+touch) ---------------- */

let drag = null;
let autoScrollRAF = null;

function lockPageScroll(){
  try {
    document.documentElement.classList.add('rankme-dragging');
    document.body.classList.add('rankme-dragging');
  } catch(err){}
}
function unlockPageScroll(){
  try {
    document.documentElement.classList.remove('rankme-dragging');
    document.body.classList.remove('rankme-dragging');
  } catch(err){}
}
function blockTouchScroll(e){
  if(!drag) return;
  try { e.preventDefault(); } catch(err){}
}

function onCardPointerDown(e){
  if(drag) return;
  // Mouse: ignore right/middle. Touch/pen: always allow (button can be weird)
  const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === '';
  if(!isTouch && e.button !== undefined && e.button > 0) return;
  try { e.preventDefault(); } catch(err){}

  const source = e.currentTarget;
  const cid = source.dataset.cardId;
  if(cid === undefined || cid === null || cid === '') return;
  const rect = source.getBoundingClientRect();

  drag = {
    cid, source, pointerId: e.pointerId,
    offX: e.clientX - rect.left,
    offY: e.clientY - rect.top,
    floater: null,
    startedContainer: source.parentElement,
    lastY: e.clientY,
    moved: false,
    active: false,
    startX: e.clientX,
    startY: e.clientY,
    startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    isTouch: isTouch,
  };

  try { source.setPointerCapture(e.pointerId); } catch(err){}
  lockPageScroll();
  // Critical for mobile: stop page scroll while finger is on a card
  document.addEventListener('touchmove', blockTouchScroll, { passive: false, capture: true });
  window.addEventListener('pointermove', onDragMove, { passive: false });
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
  // Start visual immediately on touch so user feels the grab
  if(isTouch){
    drag.moved = true;
    beginDragVisual();
  }
}

function beginDragVisual(){
  if(!drag || drag.active) return;
  drag.active = true;
  const source = drag.source;
  const rect = drag.startRect || source.getBoundingClientRect();
  const floater = source.cloneNode(true);
  floater.classList.add('floating');
  floater.style.width = rect.width+'px';
  floater.style.height = rect.height+'px';
  floater.style.left = rect.left+'px';
  floater.style.top = rect.top+'px';
  floater.style.transform = 'none';
  floater.style.pointerEvents = 'none';
  document.body.appendChild(floater);
  drag.floater = floater;
  source.classList.add('dragging');
  source.style.opacity = '0.25';
  source.style.pointerEvents = 'none';
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
  try { e.preventDefault(); } catch(err){}
  drag.lastY = e.clientY;

  const dx = Math.abs(e.clientX - drag.startX);
  const dy = Math.abs(e.clientY - drag.startY);
  if(!drag.active){
    // Decide scroll vs drag by first meaningful movement (no long-press)
    // Free drag — tiny threshold (touch already started in pointerdown)
    if(dx < 3 && dy < 3) return;
    drag.moved = true;
    try { e.preventDefault(); } catch(err){}
    beginDragVisual();
  }

  if(!drag.floater) return;
  if(!autoScrollRAF) autoScrollRAF = requestAnimationFrame(autoScrollTick);

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
        c.style.display !== 'none' &&
        c.style.visibility !== 'hidden'
      );
      let inserted = false;
      // Horizontal tiers: order by X only (left = stronger)
      for(const child of children){
        const b = child.getBoundingClientRect();
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

function cleanupDragSource(source){
  if(!source) return;
  try {
    source.classList.remove('dragging');
    source.style.display = '';
    source.style.visibility = '';
    source.style.opacity = '';
    source.style.pointerEvents = '';
  } catch(err){}
}

function onDragEnd(e){
  if(!drag || (e.pointerId!==undefined && e.pointerId !== drag.pointerId)) return;
  document.removeEventListener('touchmove', blockTouchScroll, { capture: true });
  unlockPageScroll();
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);
  if(autoScrollRAF){ cancelAnimationFrame(autoScrollRAF); autoScrollRAF=null; }

  document.querySelectorAll('.tier-row').forEach(r=>r.classList.remove('drag-over'));
  document.querySelectorAll('.portal-slot').forEach(s=>s.classList.remove('drag-over'));

  // Pure tap / no real drag started → restore and exit (fixes dim cards on mobile)
  if(!drag.active){
    document.querySelectorAll('.card.placeholder').forEach(p=>p.remove());
    cleanupDragSource(drag.source);
    try { if(drag.floater) drag.floater.remove(); } catch(err){}
    drag = null;
    return;
  }

  const cid = parseInt(drag.cid, 10);
  const floater = drag.floater;
  let targetContainer = drag.targetContainer;
  const targetPortal = drag.targetPortal || (typeof portalAt === 'function' ? portalAt(e.clientX, e.clientY) : null);
  const started = drag.startedContainer;

  // Hit-test again at release point (more reliable than last move)
  if(!targetContainer){
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if(el){
      const cont = el.closest('.tier-cards, .pool');
      if(cont) targetContainer = cont;
    }
  }

  // IMPORTANT: read drop order WHILE placeholder is still in the DOM
  let orderedIds = null;
  if(targetContainer && !(targetPortal && portalsOn)){
    const seen = new Set();
    orderedIds = [];
    for(const c of [...targetContainer.children]){
      if(c === drag.source) continue;
      let id = null;
      if(c.classList.contains('placeholder')) id = cid;
      else {
        const n = parseInt(c.dataset.cardId, 10);
        if(Number.isFinite(n)) id = n;
      }
      if(id === null || seen.has(id)) continue;
      seen.add(id);
      orderedIds.push(id);
    }
    if(!seen.has(cid)) orderedIds.push(cid);
  }

  // Now safe to clear placeholders
  document.querySelectorAll('.card.placeholder').forEach(p=>p.remove());

  // Drop on Magic Portal
  if(targetPortal && portalsOn){
    cleanupDragSource(drag.source);
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
      showToast('→ ' + label);
    }, 260);
    return;
  }

  // No valid drop target → put back
  if(!targetContainer || !orderedIds){
    cleanupDragSource(drag.source);
    try { if(floater) floater.remove(); } catch(err){}
    drag = null;
    render();
    return;
  }

  // Normal drop - preserve left-to-right order from placeholder
  removeFromAllData(cid);

  const cont = targetContainer;
  if(cont.classList.contains('pool')){
    // pool order is reapplied in renderPool (template order)
    if(!orderedIds.includes(cid)) orderedIds.push(cid);
    state.pool = [...new Set(orderedIds)];
  } else {
    const tid = cont.dataset.tierId;
    if(tid) state.assignment[tid] = orderedIds;
  }

  cleanupDragSource(drag.source);
  try { if(floater) floater.remove(); } catch(err){}
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
let openPopoverGear = null;

function closePopover(){
  if(openPopover){ openPopover.remove(); openPopover=null; document.removeEventListener('click', outsideClose); }
  if(openPopoverGear){ openPopoverGear.classList.remove('active'); openPopoverGear=null; }
}

function openRowSettings(tierId, anchorBtn){
  // Toggle: second click on same gear closes
  if(openPopover && openPopoverGear === anchorBtn){
    closePopover();
    return;
  }
  closePopover();
  const t = state.tiers.find(x=>x.id===tierId);
  const pop = document.createElement('div');
  pop.className = 'row-settings open';
  anchorBtn.classList.add('active');
  openPopoverGear = anchorBtn;
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
    // Document coordinates so popover scrolls with the row, not the viewport
    const r = anchorBtn.getBoundingClientRect();
    const pw = 260;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    let left = r.left + scrollX - pw - 12;
    if(left < scrollX + 8) left = r.right + scrollX + 12;
    let top = r.top + scrollY + r.height/2 - 90;
    if(top < scrollY + 8) top = scrollY + 8;
    pop.style.left = left+'px';
    pop.style.top = top+'px';
  };
  positionPop();
  openPopover = pop;

  const hueInput = pop.querySelector('.hue-slider');
  const setHueThumb = (v)=>{
    hueInput.style.setProperty('--thumb', `hsl(${v}, 90%, 58%)`);
    hueInput.style.setProperty('--thumb-glow', `hsla(${v}, 95%, 62%, .65)`);
  };
  setHueThumb(t.hue);
  hueInput.addEventListener('input', (e)=>{
    t.hue = parseInt(e.target.value, 10);
    setHueThumb(t.hue);
    const row = document.querySelector(`.tier-row[data-tier-id="${tierId}"]`);
    if(row){
      const lab = row.querySelector('.tier-label');
      if(lab) lab.style.setProperty('--hue', t.hue);
    }
  });
  pop.querySelector('.clear').addEventListener('click', ()=>{
    state.pool.push(...state.assignment[tierId]);
    state.assignment[tierId] = [];
    render(); closePopover();
  });
  pop.querySelector('.del').addEventListener('click', ()=>{
    if(state.tiers.length<=1){ showToast('Need one row'); return; }
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
function setCardSize(sliderVal){
  /* Portrait/square: slider value ≈ pixel width.
     Landscape (Dota etc.): map slider to a larger readable width range. */
  var px = +sliderVal;
  if(CARD_SHAPE === 'landscape'){
    var minS = 50, maxS = 140;
    var minPx = 72, maxPx = 260;
    var t = (px - minS) / (maxS - minS);
    if(t < 0) t = 0;
    if(t > 1) t = 1;
    px = Math.round(minPx + t * (maxPx - minPx));
  }
  document.documentElement.style.setProperty('--card-w', px + 'px');
  if(CARD_SHAPE === 'square'){
    document.documentElement.style.setProperty('--card-h', px + 'px');
  } else if(CARD_ASPECT && Number(CARD_ASPECT) !== 1.35){
    document.documentElement.style.setProperty('--card-h', Math.round(px * CARD_ASPECT) + 'px');
  } else {
    document.documentElement.style.removeProperty('--card-h');
  }
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
  const def = CARD_SHAPE === 'landscape' ? 78 : 64;
  sizeSlider.value = def;
  setCardSize(def);
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
    showToast('Cleared');
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
    showToast('Filled');
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
  if(BLANK_MODE) return 'My Rank on RankMe - create yours at rankme.lol';
  const t = (typeof TEMPLATE_TITLE === 'string' && TEMPLATE_TITLE) ? TEMPLATE_TITLE : 'RankMe';
  return 'My ' + t + ' tier list on RankMe - rankme.lol';
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
        showToast('Link copied');
        return;
      }
      // fallback: download image
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rankme-tierlist.png';
      a.click();
      showToast('Saved');
    }catch(e){
      showToast('Share failed');
    }
    return;
  }
  // Exclusive: try Supabase short link, else compressed hash
  let url = await buildShareUrl();
  try{
    if(typeof createShortLink === 'function'){
      const code = await createShortLink({ tiers: state.tiers, assignment: state.assignment });
      if(code){
        const su = new URL(location.href);
        su.searchParams.set('s', code);
        url = su.origin + su.pathname + '?' + su.searchParams.toString();
      }
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

document.getElementById('downloadBtn')?.addEventListener('click', ()=> openDownloadModal());

function openDownloadModal(){
  let back = document.getElementById('downloadModal');
  if(!back){
    back = document.createElement('div');
    back.className = 'modal-back';
    back.id = 'downloadModal';
    back.innerHTML = `
      <div class="modal download-modal">
        <h3>Download</h3>
        <p>Choose quality</p>
        <div class="download-modal-actions">
          <button type="button" class="dl-std" id="dlStdBtn">Standard PNG</button>
          <button type="button" class="dl-max" id="dlMaxBtn"><span>Max Quality</span></button>
          <button type="button" class="dl-cancel" id="dlCancelBtn">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    back.addEventListener('click', (e)=>{ if(e.target === back) closeDownloadModal(); });
    back.querySelector('#dlCancelBtn').addEventListener('click', closeDownloadModal);
    back.querySelector('#dlStdBtn').addEventListener('click', ()=>{
      closeDownloadModal();
      exportPNG(false, null, null);
    });
    back.querySelector('#dlMaxBtn').addEventListener('click', ()=>{
      closeDownloadModal();
      exportPNG(false, null, 100);
    });
  }
  back.classList.add('open');
}
function closeDownloadModal(){
  document.getElementById('downloadModal')?.classList.remove('open');
}

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
    showToast(n + ' added');
    e.target.value = '';
  });
}
document.getElementById('remixBtn')?.addEventListener('click', ()=>{
  if(BLANK_MODE){
    showToast('Remix: Exclusive only');
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
  showToast('Remix ready');
});

/** @param {{needReturn?: boolean}} opts needReturn=true only when redirecting to login/OAuth */
function stashDraftBeforeLogin(opts){
  try{
    sanitizeState();
    const needReturn = !!(opts && opts.needReturn);
    if(needReturn){
      sessionStorage.setItem('rankme_login_return', location.href);
    } else {
      // Opening Account while already logged in - do NOT bounce back from account.html
      sessionStorage.removeItem('rankme_login_return');
    }
    sessionStorage.setItem('rankme_draft_payload', JSON.stringify({
      tiers: state.tiers,
      assignment: state.assignment,
      customCards: state.customCards || {},
      pool: state.pool,
      templateId: TEMPLATE_ID,
      remixFlag: !!remixFlag,
      title: (document.getElementById('listTitle')?.textContent || '').trim() || null
    }));
  }catch(e){ console.warn('stash draft', e); }
}

function restoreDraftIfAny(){
  try{
    const raw = sessionStorage.getItem('rankme_draft_payload');
    if(!raw) return false;
    const data = JSON.parse(raw);
    // only restore on matching template (or blank)
    const tid = data.templateId || 'sf-duel';
    if(tid !== TEMPLATE_ID && !(BLANK_MODE && tid === 'blank')) return false;
    sessionStorage.removeItem('rankme_draft_payload');
    sessionStorage.removeItem('rankme_login_return');
    if(data.tiers && data.assignment){
      state.tiers = data.tiers;
      state.assignment = data.assignment;
      state.customCards = data.customCards || {};
      state.pool = Array.isArray(data.pool) ? data.pool : [];
      if(data.remixFlag) setRemixUI(true);
      window.__rankmeFromCabinet = true;
      sanitizeState();
      if(data.title){
        const h = document.getElementById('listTitle');
        if(h) h.textContent = data.title;
      }
      showToast('Restored');
      return true;
    }
  }catch(e){ console.warn('restore draft', e); }
  return false;
}

document.getElementById('saveAccountBtn')?.addEventListener('click', async ()=>{
  if(BLANK_MODE){
    showToast('Save: Exclusive only');
    return;
  }
  try{
    if(typeof getSessionUser !== 'function'){
      showToast('Open Account to login first');
      return;
    }
    const user = await getSessionUser();
    if(!user){
      stashDraftBeforeLogin({ needReturn: true });
      showToast('Sign in to save - your ranking is kept');
      setAllowLeave(true);
      location.href = 'account.html';
      return;
    }
    const base = (TEMPLATE_TITLE || document.querySelector('.hero .desc b')?.textContent || 'Exclusive');
    const title = remixFlag ? ('Remix · ' + base) : (base + ' list');
    sanitizeState();
    const payload = { tiers: state.tiers, assignment: state.assignment };
    await saveExclusiveTierlist({ title, templateId: TEMPLATE_ID || 'sf-duel', payload });
    remixFlag = false;
    showToast('Saved');
  }catch(e){
    console.error(e);
    showToast(e.message || 'Save failed - check Supabase table');
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

async function exportPNG(returnBlobOnly, blobCb, forceSize){
  sanitizeState();
  if(!returnBlobOnly) showToast(forceSize ? 'Exporting…' : 'Exporting…');
  const scale = 2; // pixel density / quality
  // Layout follows Size slider (or forced max for premium export)
  const sliderEl = document.getElementById('sizeSlider');
  const sliderMax = parseInt(sliderEl?.max || '100', 10);
  const uiSize = forceSize != null
    ? Math.min(sliderMax, Math.max(40, forceSize))
    : parseInt(sliderEl?.value || '64', 10);
  let cardW;
  if(CARD_SHAPE === 'landscape'){
    const minS = 50, maxS = 140, minPx = 72, maxPx = 260;
    let t = (uiSize - minS) / (maxS - minS);
    if(t < 0) t = 0; if(t > 1) t = 1;
    cardW = Math.round(minPx + t * (maxPx - minPx));
  } else {
    cardW = Math.round(Math.min(140, Math.max(48, uiSize * 1.15)));
  }
  const isSquareCard = CARD_SHAPE === 'square' || document.body.classList.contains('card-square');
  const cardH = Math.round(cardW * (isSquareCard ? 1 : (CARD_ASPECT || 1.35)));
  const cardGap = 8;
  const padX = 14;
  const padY = 12;
  const labelW = 150;
  const padRight = 20;
  const MAX_W = 1600;

  // Content-aware width: only as wide as needed for cards (no empty right void)
  const maxCards = Math.max(1, ...state.tiers.map(t => (state.assignment[t.id]||[]).length));
  const maxFit = Math.max(1, Math.floor((MAX_W - labelW - padX - padRight + cardGap) / (cardW + cardGap)));
  const cardsPerLine = Math.min(maxCards, maxFit);
  const width = Math.max(640, labelW + padX + cardsPerLine * (cardW + cardGap) - cardGap + padRight);

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
  const padTop = 20;
  const footH = 72;
  const height = padTop + rowHeights.reduce((a,b)=>a+b, 0) + footH;

  const canvas = document.getElementById('exportCanvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Clean dark background
  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0, 0, width, height);
  const g1 = ctx.createRadialGradient(width*0.5, 0, 0, width*0.5, 0, height*0.45);
  g1.addColorStop(0, 'rgba(160,120,220,0.07)');
  g1.addColorStop(1, 'rgba(160,120,220,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  let y = padTop;
  for(let i = 0; i < state.tiers.length; i++){
    const tier = state.tiers[i];
    const rh = rowHeights[i];

    // Premium label: rich color, muted neon (lower sat, deeper stops)
    const baseSat = Number(tier.sat);
    const baseLight = Number(tier.light);
    const sat = Math.min(52, Math.max(32, Math.round((Number.isFinite(baseSat) ? baseSat : 50) * 0.72)));
    const lightTop = Math.min(52, Math.max(42, Math.round((Number.isFinite(baseLight) ? baseLight : 55) * 0.55 + 18)));
    const lightMid = Math.max(36, lightTop - 6);
    const lightBot = Math.max(28, lightTop - 14);
    const satMid = Math.max(28, sat - 4);
    const satBot = Math.max(26, sat - 6);
    const grad = ctx.createLinearGradient(0, y, 0, y + rh);
    grad.addColorStop(0, `hsl(${tier.hue}, ${sat}%, ${lightTop}%)`);
    grad.addColorStop(0.55, `hsl(${tier.hue}, ${satMid}%, ${lightMid}%)`);
    grad.addColorStop(1, `hsl(${tier.hue}, ${satBot}%, ${lightBot}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, labelW, rh);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitAndWrap(ctx, tier.name, labelW/2, y + rh/2, labelW - 16, 11, Math.min(22, Math.round(cardW*0.28)));

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(labelW, y, width - labelW, rh);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
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
          const r = CARD_SHAPE === 'landscape'
            ? Math.max(2, Math.min(4, Math.round(cardW * 0.015)))
            : Math.max(6, Math.round(cardW * (CARD_SHAPE === 'square' ? 0.14 : 0.12)));
          ctx.save();
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(x, cy, cardW, cardH, r);
          else ctx.rect(x, cy, cardW, cardH);
          if(CARD_SHAPE === 'square' || THEME_GOLD){
            ctx.fillStyle = 'rgba(24,18,36,0.95)';
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fill();
          }
          ctx.clip();
          // contain: keep image aspect, center in card (no stretch)
          (function(){
            const iw = img.naturalWidth || img.width || 1;
            const ih = img.naturalHeight || img.height || 1;
            const ir = iw / ih;
            const br = cardW / cardH;
            let dw, dh, dx, dy;
            if(ir > br){
              dw = cardW; dh = cardW / ir;
              dx = x; dy = cy + (cardH - dh) / 2;
            } else {
              dh = cardH; dw = cardH * ir;
              dx = x + (cardW - dw) / 2; dy = cy;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
          })();
          ctx.restore();
          if(CARD_SHAPE === 'square' || THEME_GOLD){
            ctx.save();
            ctx.beginPath();
            if(ctx.roundRect) ctx.roundRect(x + 0.5, cy + 0.5, cardW - 1, cardH - 1, CARD_SHAPE === 'landscape' ? r : Math.max(5, r - 1));
            else ctx.rect(x + 0.5, cy + 0.5, cardW - 1, cardH - 1);
            ctx.strokeStyle = THEME_GOLD ? 'rgba(201,168,240,0.55)' : 'rgba(220,180,120,0.4)';
            ctx.lineWidth = Math.max(1, Math.min(1.5, cardW * 0.012));
            ctx.stroke();
            ctx.restore();
          }
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
  const listTitleEl = document.getElementById('listTitle');
  const customTitle = (listTitleEl && listTitleEl.textContent || '').trim();
  const rightLabel = BLANK_MODE
    ? (customTitle || 'Custom Tier List')
    : (TEMPLATE_FOOTER || TEMPLATE_TITLE || 'RankMe');
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
  const raw = String(text || '').replace(/\r/g, '').trim() || 'ROW';
  // Explicit newlines from editor → one canvas line each, own size
  if(raw.includes('\n')){
    const parts = raw.split('\n');
    const sized = parts.map(function(line){
      let size = labelLineFontSize(line);
      size = Math.max(minSize, Math.min(maxSize, size));
      ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
      // Shrink if a single line is wider than label
      while(size > minSize && ctx.measureText(line).width > maxWidth){
        size -= 1;
        ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
      }
      return { line: line.length ? line : ' ', size };
    });
    const totalH = sized.reduce(function(a, s){ return a + s.size * 1.15; }, 0);
    let cy = y - totalH / 2;
    sized.forEach(function(s){
      ctx.font = '800 ' + s.size + 'px Montserrat, system-ui, sans-serif';
      cy += s.size * 1.15 / 2;
      ctx.fillText(s.line, x, cy);
      cy += s.size * 1.15 / 2;
    });
    return;
  }
  let size = maxSize;
  let lines = [raw];
  while(size >= minSize){
    ctx.font = `800 ${size}px Montserrat, system-ui, sans-serif`;
    lines = wrapLines(ctx, raw, maxWidth);
    if(lines.length <= 3) break;
    size--;
  }
  ctx.font = `800 ${size}px Montserrat, system-ui, sans-serif`;
  lines = wrapLines(ctx, raw, maxWidth);
  const lh = size * 1.12;
  const startY = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lh));
}
function wrapLines(ctx, text, maxWidth){
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  const pushChunk = (chunk)=>{
    if(!chunk) return;
    if(ctx.measureText(chunk).width <= maxWidth){
      if(line && ctx.measureText(line + ' ' + chunk).width <= maxWidth){
        line = line + ' ' + chunk;
      } else {
        if(line) lines.push(line);
        line = chunk;
      }
      return;
    }
    // Long unbroken string - split by characters
    if(line){ lines.push(line); line = ''; }
    let buf = '';
    for(const ch of chunk){
      const t = buf + ch;
      if(ctx.measureText(t).width > maxWidth && buf){
        lines.push(buf);
        buf = ch;
      } else buf = t;
    }
    if(buf) line = buf;
  };
  for(const w of words) pushChunk(w);
  if(line) lines.push(line);
  return lines.length ? lines : [''];
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
  const file = meta.file; // e.g. card_046.webp
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

let pendingNav = '#';
window.allowLeave = false;

/** Allow leaving page without native browser dialog */
function setAllowLeave(v){
  window.allowLeave = !!v;
  try{
    if(v) sessionStorage.setItem('rankme_nav_ok', '1');
    else sessionStorage.removeItem('rankme_nav_ok');
  }catch(_){}
}
window.setAllowLeave = setAllowLeave;

function rankmeBeforeUnload(e){
  try{ if(sessionStorage.getItem('rankme_nav_ok') === '1') return; }catch(_){}
  if(window.allowLeave) return;
  if(typeof hasProgress === 'function' && !hasProgress()) return;
  e.preventDefault();
  e.returnValue = '';
}
window.addEventListener('beforeunload', rankmeBeforeUnload);

/** Account is always allowed - ranking is stashed, never blocked */
function navigateToAccount(){
  setAllowLeave(true);
  try{
    // Keep ranking in session for later, but never auto-bounce from Account
    if(typeof hasProgress === 'function' && hasProgress() && typeof stashDraftBeforeLogin === 'function'){
      stashDraftBeforeLogin({ needReturn: false });
    } else {
      sessionStorage.removeItem('rankme_login_return');
    }
  }catch(_){}
  window.location.assign(new URL('account.html', location.href).href);
}
window.navigateToAccount = navigateToAccount;

function bindLeaveGuard(el, href){
  if(!el || el.dataset.leaveBound) return;
  el.dataset.leaveBound = '1';
  el.addEventListener('click', (e)=>{
    const target = href || el.getAttribute('href') || '';
    if(!target || target === '#' || target.startsWith('javascript')) return;
    // Account / login always free to open
    if(/account\.html/i.test(target)){
      e.preventDefault();
      navigateToAccount();
      return;
    }
    try{
      const u = new URL(target, location.href);
      if(u.pathname === location.pathname && u.search === location.search && !u.hash){
        e.preventDefault();
        return;
      }
    }catch(_){}
    if(typeof hasProgress === 'function' && !hasProgress()) return;
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
  loginBtn.dataset.accountNav = '1'; // prevent supabaseClient double-bind
  loginBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    navigateToAccount();
  }, true);
}

document.getElementById('stayBtn')?.addEventListener('click', ()=>{
  document.getElementById('leaveModal')?.classList.remove('open');
});
document.getElementById('leaveBtn')?.addEventListener('click', ()=>{
  document.getElementById('leaveModal')?.classList.remove('open');
  setAllowLeave(true);
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
      const assignment = {};
      Object.keys(data.assignment).forEach(k=>{
        assignment[k] = (data.assignment[k] || []).map(id=>{
          const n = parseInt(id, 10);
          return (String(n) === String(id) && !isNaN(n)) ? n : id;
        });
      });
      state.assignment = assignment;
      const used = new Set();
      Object.values(state.assignment).forEach(arr => arr.forEach(id=>{
        used.add(id); used.add(String(id));
      }));
      state.pool = freshPool().filter(id=>!used.has(id) && !used.has(String(id)));
      window.__rankmeFromCabinet = true;
      sanitizeState();
      // + My images only after explicit Remix
    }
  }
}catch(e){}


function normalizeCardId(id){
  if(typeof id === 'number' && Number.isFinite(id)) return id;
  const s = String(id);
  if(/^\d+$/.test(s)){
    const n = parseInt(s, 10);
    // Prefer numeric key if CARD_META uses numbers
    if(CARD_META[n]) return n;
    if(CARD_META[s]) return s;
    return n;
  }
  return s;
}

function applyBattleResult(){
  try{
    const params = new URLSearchParams(location.search);
    const wantBattle = params.get('battle') === '1';
    let raw = sessionStorage.getItem('rankme_battle_result');
    if(!raw){
      try { raw = localStorage.getItem('rankme_battle_result'); } catch(_){}
    }
    // Also accept if open_payload already applied but pool still full? handled below
    if(!raw){
      if(!wantBattle) return false;
      return false;
    }
    const data = JSON.parse(raw);
    try { sessionStorage.removeItem('rankme_battle_result'); } catch(_){}
    try { localStorage.removeItem('rankme_battle_result'); } catch(_){}
    if(!data || !data.payload || !data.payload.tiers || !data.payload.assignment) return false;
    if(data.templateId && data.templateId !== TEMPLATE_ID){
      console.warn('battle template mismatch', data.templateId, TEMPLATE_ID);
      return false;
    }

    const tiers = data.payload.tiers;
    const assignment = {};
    Object.keys(data.payload.assignment).forEach(k=>{
      const arr = data.payload.assignment[k] || [];
      assignment[k] = arr.map(normalizeCardId);
    });

    // Ensure every ranked id exists in CARD_META or custom
    let placed = 0;
    Object.values(assignment).forEach(arr => { placed += arr.length; });
    if(placed === 0){
      console.warn('battle assignment empty');
      return false;
    }

    state.tiers = tiers.map(t=>({
      id: t.id,
      name: t.name,
      hue: t.hue,
      sat: t.sat,
      light: t.light
    }));
    state.assignment = assignment;

    const used = new Set();
    Object.values(state.assignment).forEach(arr=>{
      arr.forEach(id=>{
        used.add(id);
        used.add(String(id));
        if(typeof id === 'number') used.add(id);
      });
    });
    state.pool = freshPool().filter(id=>!used.has(id) && !used.has(String(id)));
    window.__rankmeFromCabinet = true;
    window.__rankmeFromBattle = true;
    if(typeof sanitizeState === 'function') sanitizeState();
    console.log('battle result applied', placed, 'cards');
    return true;
  }catch(e){
    console.warn('applyBattleResult failed', e);
    return false;
  }
}

(async ()=>{
  if(CARD_SHAPE === 'square') document.body.classList.add('card-square');
  if(CARD_SHAPE === 'landscape') {
    document.body.classList.add('card-landscape');
    const s = document.getElementById('sizeSlider');
    if(s && !s.dataset.landscapeInit) {
      s.dataset.landscapeInit = '1';
      s.min = '50';
      s.max = '140';
      s.value = '78';
      setCardSize(78);
    }
  }
  if(THEME_GOLD) document.body.classList.add('theme-gold');
  if(NO_FACTIONS) document.body.classList.add('no-factions');
  // Battle Mode → Open ranking
  applyBattleResult();
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
  // Restore draft after login redirect (Save / Account while ranking)
  restoreDraftIfAny();
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
    function loadImageSize(src){
      return new Promise((resolve)=>{
        const img = new Image();
        img.onload = ()=> resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
        img.onerror = ()=> resolve({ w: 1, h: 1 });
        img.src = src;
      });
    }
    async function autoFitCardShape(){
      // Only for blank / custom uploads — majority rules
      const ids = Object.keys(state.customCards || {});
      if(!ids.length) return;
      let square = 0, portrait = 0, landscape = 0;
      for(const id of ids){
        const src = state.customCards[id].src;
        if(!src) continue;
        const { w, h } = await loadImageSize(src);
        const r = w / h;
        if(r >= 0.85 && r <= 1.15) square++;
        else if(r < 0.85) portrait++;
        else landscape++;
      }
      // prefer square if most are square-ish; else portrait frame
      const useSquare = square >= portrait && square >= landscape;
      document.body.classList.toggle('card-square', useSquare);
      const px = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 64;
      if(useSquare){
        document.documentElement.style.setProperty('--card-h', px + 'px');
      } else {
        const aspect = 1.35;
        document.documentElement.style.setProperty('--card-h', Math.round(px * aspect) + 'px');
      }
    }
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
      await autoFitCardShape();
      renderPool();
      showToast(files.length + ' image(s) added');
      e.target.value = '';
    });
  }
  // Preload images chosen on Create page
  try{
    const raw = sessionStorage.getItem('rankme_blank_images');
    if(raw){
      const list = JSON.parse(raw);
      if(Array.isArray(list)){
        list.forEach(it=>{
          if(!it || !it.dataUrl) return;
          const id = customIdSeq++;
          state.customCards[id] = { src: it.dataUrl, name: (it.name||'image').replace(/\.[^.]+$/, '') };
          state.pool.push(id);
        });
        sessionStorage.removeItem('rankme_blank_images');
        autoFitCardShape().then(()=>{ renderPool(); if(list.length) showToast(list.length + ' image(s) added'); });
      }
    }
  }catch(err){}
  try{
    const tag = sessionStorage.getItem('rankme_blank_tag');
    if(tag) sessionStorage.setItem('rankme_list_tag', tag);
  }catch(err){}
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


/* Battle Mode launch from tier page — under description */
(function(){
  function resolveId(){
    try{
      if(typeof TEMPLATE_ID !== 'undefined' && TEMPLATE_ID && TEMPLATE_ID !== 'blank') return String(TEMPLATE_ID);
    }catch(e){}
    try{
      if(window.RANKME_TEMPLATE && window.RANKME_TEMPLATE.id && window.RANKME_TEMPLATE.id !== 'blank')
        return String(window.RANKME_TEMPLATE.id);
    }catch(e){}
    try{
      var p = new URLSearchParams(location.search);
      var t = (p.get('t') || '').trim();
      if(t && t !== 'blank') return t;
    }catch(e){}
    try{
      var s = sessionStorage.getItem('rankme_t');
      if(s && s !== 'blank') return s;
    }catch(e){}
    try{
      var m = location.pathname.match(/\/(sf-duel-ex|sf-duel|lol|sf6)(?:\.html)?/);
      if(m) return m[1];
    }catch(e){}
    return '';
  }
  function goBattle(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    var id = resolveId();
    if(!id){
      console.warn('Battle: no template id');
      alert('Open a template first, then start Battle Mode.');
      return;
    }
    try{ sessionStorage.setItem('rankme_t', id); }catch(err){}
    try{
      window.allowLeave = true;
      sessionStorage.setItem('rankme_nav_ok', '1');
    }catch(err){}
    window.location.assign('battle.html?t=' + encodeURIComponent(id));
  }
  function bind(){
    var btn = document.getElementById('battleModeBtn');
    if(!btn) return;
    var id = resolveId();
    if(!id){
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
    btn.disabled = false;
    btn.onclick = goBattle;
  }
  bind();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind);
  }
  setTimeout(bind, 0);
  setTimeout(bind, 200);
  setTimeout(bind, 800);
})();

