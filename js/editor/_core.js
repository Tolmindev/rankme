/* RankMe editor · core: template, state, hash */

/* ---- Template override (EX-Move etc.) ---- */
const TMPL = window.RANKME_TEMPLATE || null;
const CARD_SHAPE = (TMPL && TMPL.cardShape) || 'portrait';
const CARD_ASPECT = (TMPL && TMPL.cardAspect) || (CARD_SHAPE === 'square' ? 1 : 1.35);
const CARD_FRAME = (TMPL && TMPL.cardFrame) || 'default';
const DEFAULT_CARD_SIZE = Number(TMPL && TMPL.defaultSize) || (CARD_SHAPE === 'landscape' ? 78 : 64);
const SIZE_MIN = Number(TMPL && TMPL.sizeMin) || (CARD_SHAPE === 'landscape' ? 50 : 40);
const SIZE_MAX = Number(TMPL && TMPL.sizeMax) || (CARD_SHAPE === 'landscape' ? 140 : 100);
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
const FACTION_ICON_ONLY = !!(TMPL && TMPL.factionIconOnly);

const BLANK_MODE = !!window.RANKME_BLANK;
/* Card data lives in templates/*.json only (loaded as window.RANKME_TEMPLATE). */
const CARD_META_LIST = BLANK_MODE
  ? []
  : ((TMPL && Array.isArray(TMPL.cards) && TMPL.cards.length)
      ? TMPL.cards
      : (console.warn('[RankMe] No template cards — load via boot.js / templates/*.json'), []));
const CARD_META = {};
CARD_META_LIST.forEach(c => CARD_META[c.id] = c);
const N_CARDS = CARD_META_LIST.length;
const FACTIONS = NO_FACTIONS ? [] : (
  FACTION_ORDER || [...new Set(CARD_META_LIST.flatMap(c => Array.isArray(c.roles) ? c.roles : [c.faction]))]
);
const FACTION_HUE = Object.assign({
  MASTER:210, INFERNAL:275, WIND:210, THUNDER:48, FLAME:8, LEGENDARY:290, 'A+':32,
  Fighter:30, Tank:200, Mage:270, Assassin:0, Marksman:50, Support:160,
  Strength:270, Agility:280, Intelligence:265, Universal:275,
  Bronze:22, Silver:210, Gold:42, Diamond:300
}, (TMPL && TMPL.factionHues) || {});
const FACTION_ICON = {};
FACTIONS.forEach(f => {
  FACTION_ICON[f] = (FACTION_ICON_MAP && FACTION_ICON_MAP[f]) || (`assets/factions/${f}_icon.svg`);
});
const ALL_ICON = 'assets/factions/ALL_icon.svg';

const cardSrc = id => {
  if(state.customCards && state.customCards[id]) return state.customCards[id].src;
  if(CARD_META[id]) return CARD_PATH + encodeURIComponent(CARD_META[id].file);
  return CARD_PATH + `card_${String(id).padStart(3,'0')}.webp`;
};


const BLANK_TIERS = [
  {id:'t1', name:'S', hue:0,   sat:70, light:62},
  {id:'t2', name:'A', hue:28,  sat:65, light:58},
  {id:'t3', name:'B', hue:48,  sat:55, light:55},
  {id:'t4', name:'C', hue:140, sat:40, light:50},
  {id:'t5', name:'D', hue:220, sat:35, light:48},
];

let state = {
  // Exclusive opens with standard S-D strips
  tiers: JSON.parse(JSON.stringify(BLANK_TIERS)),
  assignment: {},
  pool: [],
  rowIdSeq: 6,
  customCards: {}, // id -> {src dataURL, name}
};

let customIdSeq = 10000;
let poolDeleteMode = false;

function removeCardFromRanking(cid){
  const id = +cid;
  if(!id) return;
  state.pool = state.pool.filter(x => x !== id);
  Object.keys(state.assignment || {}).forEach(k => {
    state.assignment[k] = (state.assignment[k] || []).filter(x => x !== id);
  });
  if(state.customCards && state.customCards[id]) delete state.customCards[id];
  if(typeof markDirty === 'function') markDirty();
  if(typeof render === 'function') render();
}

function setPoolDeleteMode(on){
  poolDeleteMode = !!on;
  document.body.classList.toggle('pool-delete', poolDeleteMode);
  document.querySelectorAll('.js-remove-cards').forEach(function (btn) {
    btn.classList.toggle('on', poolDeleteMode);
    btn.setAttribute('aria-pressed', poolDeleteMode ? 'true' : 'false');
  });
}

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
  if(communityMode) return;
  if(!BLANK_MODE && loadFromHash()) return;
  if(BLANK_MODE && loadFromHash()) return;
  state.assignment = {};
  state.tiers.forEach(t=> state.assignment[t.id] = []);
  state.pool = freshPool();
  Object.keys(state.customCards || {}).forEach(function (k) {
    var id = +k;
    if (id && state.pool.indexOf(id) < 0) state.pool.push(id);
  });
  if(BLANK_MODE){
    let title = null;
    try { title = sessionStorage.getItem('rankme_blank_title'); } catch(e){}
    if(!title){ try { title = localStorage.getItem('rankme_draft_title'); } catch(e){} }
    const el = (document.getElementById('heroTitle') || document.getElementById('listTitle'));
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
