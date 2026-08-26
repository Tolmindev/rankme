/* RankMe editor · board, labels, pool, filters, portals */

/* ---------------- Rendering ---------------- */

const boardInner = document.getElementById('boardInner');
const poolEl = document.getElementById('pool');

function render(){
  boardInner.innerHTML = '';
  state.tiers.forEach((t, idx)=>{
    const row = document.createElement('div');
    row.className = 'tier-row';
    row.dataset.tierId = t.id;
    row.style.setProperty('--hue', t.hue);
    row.style.setProperty('--sat', t.sat+'%');
    row.style.setProperty('--light', t.light+'%');

    const labelWrap = document.createElement('div');
    labelWrap.className = 'tier-label-wrap';

    const label = document.createElement('div');
    label.className = 'tier-label';
    label.contentEditable = (communityMode) ? 'false' : 'true';
    label.spellcheck = false;
    label.textContent = t.name;
    fitLabelFont(label, t.name);
    label.addEventListener('focus', ()=>{
      if (communityMode) { label.blur(); return; }
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
      // Resize lines in place — do not rebuild DOM (rebuild ate spaces)
      sizeLabelLinesInPlace(label);
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
  if(len <= 1) return 34;
  if(len === 2) return 26;
  if(len <= 4) return 18;
  if(len <= 8) return 14;
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

function sizeLabelLinesInPlace(el){
  const spans = el.querySelectorAll('.tier-label-line');
  if(spans.length){
    spans.forEach(function(span){
      let line = (span.textContent || '').replace(/\u00a0/g, ' ');
      if(line === '\u00a0' || line === '\xa0') line = '';
      span.style.fontSize = labelLineFontSize(line) + 'px';
    });
    return;
  }
  // Plain text fallback while editing
  const text = (el.innerText || '').replace(/\u00a0/g, ' ');
  const lines = text.split('\n');
  let maxLen = 1;
  lines.forEach(function(line){
    const n = line.replace(/\s+/g, '').length;
    if(n > maxLen) maxLen = n;
  });
  el.style.fontSize = labelLineFontSize(maxLen <= 1 ? 'A' : 'A'.repeat(maxLen)) + 'px';
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
    const hue = tier.hue;
    const sat = Math.min(62, tier.sat);
    const light = Math.min(58, tier.light);
    slot.style.background = `linear-gradient(180deg, hsla(${hue}, ${sat}%, ${light}%, 0.4), hsla(${hue}, ${sat}%, ${Math.max(24, light - 14)}%, 0.12))`;
    slot.style.border = `1.5px solid hsla(${hue}, 70%, 62%, 0.5)`;
    slot.style.setProperty('--glow', `hsla(${hue}, 70%, 60%, 0.65)`);
    bar.appendChild(slot);
  });
}

function portalAt(x, y){
  if(!portalsOn) return null;
  const slots = document.querySelectorAll('.portal-slot');
  for(const s of slots){
    const b = s.getBoundingClientRect();
    if (x >= b.left && x <= b.right && y >= b.top - 10 && y <= b.bottom + 10) return s;
  }
  return null;
}

document.getElementById('portalBtn').addEventListener('click', ()=>{
  portalsOn = !portalsOn;
  document.getElementById('portalBtn').classList.toggle('active', portalsOn);
  renderPortals();
  showToast(portalsOn ? 'Portals on' : 'Portals off');
});
