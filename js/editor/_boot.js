/* RankMe editor · init, community, blank upload */

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
      try {
        const sid = sessionStorage.getItem('rankme_saved_id');
        if (sid) { savedTierlistId = sid; sessionStorage.removeItem('rankme_saved_id'); }
        const ot = sessionStorage.getItem('rankme_open_title');
        const os = sessionStorage.getItem('rankme_open_subtitle');
        sessionStorage.removeItem('rankme_open_title');
        sessionStorage.removeItem('rankme_open_subtitle');
        if (ot) window.__rankmeOpenTitle = ot;
        if (os) window.__rankmeOpenSubtitle = os;
        if (data.subtitle) window.__rankmeOpenSubtitle = data.subtitle;
        if (sessionStorage.getItem('rankme_remix_pending') === '1') {
          sessionStorage.removeItem('rankme_remix_pending');
          window.__rankmeRemixPending = true;
        }
      } catch (_) {}
      sanitizeState();
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
    return true;
  }catch(e){
    console.warn('applyBattleResult failed', e);
    return false;
  }
}

(async ()=>{
  if(CARD_SHAPE === 'square') document.body.classList.add('card-square');
  if(CARD_SHAPE === 'landscape') document.body.classList.add('card-landscape');
  if(CARD_FRAME === 'thin') document.body.classList.add('card-thin');
  if(THEME_GOLD) document.body.classList.add('theme-gold');
  if(NO_FACTIONS) document.body.classList.add('no-factions');
  if (sizeSlider) {
    sizeSlider.min = String(SIZE_MIN);
    sizeSlider.max = String(SIZE_MAX);
    sizeSlider.value = String(DEFAULT_CARD_SIZE);
    setCardSize(DEFAULT_CARD_SIZE);
  }

/* Community ranking UI (public list via ?c=id) */
async function tryLoadCommunityFromQuery() {
  try {
    const params = new URLSearchParams(location.search);
    const cid = params.get('c');
    if (!cid) return;

    let row = null;
    if (typeof getTierlistById === 'function') {
      try { row = await getTierlistById(cid); } catch (e) { row = null; }
    }
    // Direct REST fallback (bypasses SDK issues)
    if ((!row || !row.payload) && window.RANKME_SB && window.RANKME_SB.url) {
      try {
        const q = window.RANKME_SB.url + '/rest/v1/tierlists?id=eq.' + encodeURIComponent(cid) +
          '&select=id,title,template_id,payload,updated_at,created_at,user_id,is_public,like_count,view_count,author_name,author_avatar';
        const res = await fetch(q, {
          headers: {
            apikey: window.RANKME_SB.key,
            Authorization: 'Bearer ' + window.RANKME_SB.key,
          },
        });
        if (res.ok) {
          const arr = await res.json();
          if (arr && arr[0]) row = arr[0];
        }
      } catch (e) {
        console.warn('[RankMe] community REST fallback', e);
      }
    }
    // Fallback: full row stashed when clicking community card on home
    if (!row || !row.payload) {
      try {
        const sid = sessionStorage.getItem('rankme_community_id');
        const raw = sessionStorage.getItem('rankme_community_row');
        if (raw && sid && String(sid) === String(cid)) {
          const stashed = JSON.parse(raw);
          row = Object.assign({}, stashed, row || {});
          if (!row.payload && stashed.payload) row.payload = stashed.payload;
          sessionStorage.removeItem('rankme_community_row');
          sessionStorage.removeItem('rankme_community_id');
        }
      } catch (e) {}
    }
    if (!row || !row.payload) {
      console.warn('[RankMe] community: no payload for', cid, row);
      if (typeof showToast === 'function') showToast('Could not load this community ranking');
      return;
    }

    const data = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    if (!data.tiers || !data.assignment) return;

    state.tiers = data.tiers;
    const assignment = {};
    Object.keys(data.assignment).forEach(k => {
      assignment[k] = (data.assignment[k] || []).map(id => {
        const n = parseInt(id, 10);
        return (String(n) === String(id) && !isNaN(n)) ? n : id;
      });
    });
    state.assignment = assignment;
    const used = new Set();
    Object.values(state.assignment).forEach(arr => arr.forEach(id => {
      used.add(id); used.add(String(id));
    }));
    state.pool = freshPool().filter(id => !used.has(id) && !used.has(String(id)));

    communityMode = true;
    window.__rankmeFromCabinet = true;
    communityMeta = {
      id: row.id || cid,
      userId: row.user_id || '',
      authorName: row.author_name || 'User',
      authorAvatar: row.author_avatar || '',
      likes: row.like_count || 0,
      views: row.view_count || 0,
      updatedAt: row.updated_at || row.created_at,
    };
    try {
      const ht = document.getElementById('heroTitle');
      const hd = document.getElementById('heroDesc');
      if (ht && row.title) ht.textContent = String(row.title).replace(/\s+list$/i, '').trim();
      if (hd && row.payload && row.payload.subtitle) hd.textContent = String(row.payload.subtitle);
    } catch (e) {}
    savedTierlistId = null;
    sanitizeState();

    if (typeof render === 'function') render();
    if (!BLANK_MODE && typeof renderFactionFilters === 'function') renderFactionFilters();
    if (typeof renderPortals === 'function') renderPortals();
    setupCommunityUI();
    if (typeof incrementTierlistView === 'function') incrementTierlistView(row.id || cid);
  } catch (err) {
    console.warn('[RankMe] community load failed:', err && (err.message || String(err)));
  }
}



function applyOpenHeroMeta() {
  try {
    const ht = document.getElementById('heroTitle');
    const hd = document.getElementById('heroDesc');
    if (ht && window.__rankmeOpenTitle) {
      ht.textContent = String(window.__rankmeOpenTitle);
      window.__rankmeOpenTitle = null;
    }
    if (hd && window.__rankmeOpenSubtitle) {
      hd.textContent = String(window.__rankmeOpenSubtitle);
      window.__rankmeOpenSubtitle = null;
    }
  } catch (e) {}
}

var HERO_TITLE_MAX = 48;
var HERO_DESC_MAX = 180;

function clampHeroText(el, opts) {
  if (!el || !el.id) return;
  var max = el.id === 'heroTitle' ? HERO_TITLE_MAX : HERO_DESC_MAX;
  var text = (el.textContent || '').replace(/\r\n/g, '\n');
  if (text.length <= max) return;
  el.textContent = text.slice(0, max);
  /* Only restore caret while the user is typing - never on boot/clamp */
  if (!opts || !opts.keepCaret) return;
  if (document.activeElement !== el) return;
  try {
    var range = document.createRange();
    var sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
}

function bindHeroLimits() {
  if (window.__rankmeHeroLimitsBound) return;
  window.__rankmeHeroLimitsBound = true;
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || (t.id !== 'heroTitle' && t.id !== 'heroDesc')) return;
    if (t.getAttribute('contenteditable') !== 'true') return;
    clampHeroText(t, { keepCaret: true });
    if (typeof markDirty === 'function') markDirty();
  });
  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (!t || (t.id !== 'heroTitle' && t.id !== 'heroDesc')) return;
    if (t.getAttribute('contenteditable') !== 'true') return;
    e.preventDefault();
    var max = t.id === 'heroTitle' ? HERO_TITLE_MAX : HERO_DESC_MAX;
    var paste = '';
    try {
      paste = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    } catch (err) {}
    paste = paste.replace(/\r\n/g, '\n');
    var cur = t.textContent || '';
    var sel = window.getSelection();
    var before = cur;
    var after = '';
    if (sel && sel.rangeCount && sel.anchorNode && t.contains(sel.anchorNode)) {
      var range = sel.getRangeAt(0);
      var pre = range.cloneRange();
      pre.selectNodeContents(t);
      pre.setEnd(range.startContainer, range.startOffset);
      before = pre.toString();
      var post = range.cloneRange();
      post.selectNodeContents(t);
      post.setStart(range.endContainer, range.endOffset);
      after = post.toString();
    }
    var room = max - before.length - after.length;
    if (room < 0) room = 0;
    var insert = paste.slice(0, room);
    t.textContent = (before + insert + after).slice(0, max);
    clampHeroText(t, { keepCaret: true });
    if (typeof markDirty === 'function') markDirty();
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || t.id !== 'heroTitle') return;
    if (t.getAttribute('contenteditable') !== 'true') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      t.blur();
    }
  });
}

function setHeroEditable(on) {
  on = !!on;
  document.body.setAttribute('data-editor', on ? '1' : '0');
  if (on) document.body.classList.remove('community-view');
  bindHeroLimits();
  ['heroTitle', 'heroDesc'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.contentEditable = on ? 'true' : 'false';
    el.setAttribute('contenteditable', on ? 'true' : 'false');
    el.classList.toggle('is-editable', on);
    el.spellcheck = false;
    if (on) {
      el.setAttribute('tabindex', '0');
      clampHeroText(el);
    } else {
      el.removeAttribute('tabindex');
    }
  });
}


function enterCommunityView() {
  document.body.classList.add('community-view');
  markClean();
  setHeroEditable(false);
  portalsOn = false;
  var pb = document.getElementById('portalBtn');
  if (pb) pb.classList.remove('active');
  if (typeof renderPortals === 'function') renderPortals();
}

function exitCommunityToEditor() {
  communityMode = false;
  communityMeta = null;
  document.body.classList.remove('community-view');
  setHeroEditable(true);
  var bar = document.getElementById('communityBar');
  if (bar) bar.hidden = true;
  ['board', 'toolbar', 'poolWrap'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.removeAttribute('hidden');
  });
}

function setupCommunityUI() {
  if (!communityMode || !communityMeta) return;
  enterCommunityView();
  let bar = document.getElementById('communityBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'communityBar';
    bar.className = 'community-bar';
    const hero = document.getElementById('heroSection') || document.querySelector('.hero');
    let wrap = document.getElementById('communityToolbar');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'communityToolbar';
      wrap.className = 'community-toolbar';
      wrap.appendChild(bar);
      if (hero && hero.parentNode) hero.parentNode.insertBefore(wrap, hero.nextSibling);
      else document.body.appendChild(wrap);
    } else {
      wrap.insertBefore(bar, wrap.firstChild);
    }
  }
  const m = communityMeta;
  const ago = typeof timeAgo === 'function' ? timeAgo(m.updatedAt) : '';
  const likes = typeof formatCount === 'function' ? formatCount(m.likes) : String(m.likes || 0);
  const views = typeof formatCount === 'function' ? formatCount(m.views) : String(m.views || 0);
  const av = m.authorAvatar
    ? '<img class="cb-avatar" src="' + String(m.authorAvatar).replace(/"/g, '') + '" alt="">'
    : '<div class="cb-avatar cb-fallback">' + String(m.authorName || 'U').charAt(0).toUpperCase() + '</div>';
  const profileHref = m.userId ? ('account.html?u=' + encodeURIComponent(String(m.userId))) : '';
  const nameHtml = profileHref
    ? ('<a class="cb-name" href="' + profileHref + '">' + String(m.authorName || 'User').replace(/</g, '') + '</a>')
    : ('<b class="cb-name">' + String(m.authorName || 'User').replace(/</g, '') + '</b>');
  bar.innerHTML =
    '<div class="cb-left">' + (profileHref ? ('<a class="cb-av-link" href="' + profileHref + '">' + av + '</a>') : av) +
      '<div class="cb-meta">' + nameHtml +
      (ago ? '<span class="cb-ago">Updated ' + ago + '</span>' : '') + '</div></div>' +
    '<div class="cb-stats">' +
      '<span class="cb-stat" title="Views"><img src="assets/icons/view.svg" alt="" class="cb-ico"> ' + views + '</span>' +
      '<button type="button" class="cb-like" id="communityLikeBtn" aria-label="Like">' +
        '<span class="cb-heart">' +
          '<img src="assets/icons/heart.svg" alt="" class="cb-ico heart-empty">' +
          '<img src="assets/icons/heart_full.svg" alt="" class="cb-ico heart-full">' +
        '</span>' +
        '<span class="cb-like-n">' + likes + '</span></button></div>';
  bar.hidden = false;
  const likeBtn = document.getElementById('communityLikeBtn');
  if (likeBtn) {
    if (typeof getMyLikedIds === 'function') {
      getMyLikedIds([m.id]).then(function (set) {
        if (set && set.has(String(m.id))) likeBtn.classList.add('on');
      }).catch(function () {});
    }
    likeBtn.onclick = async function () {
      try {
        if (typeof toggleTierlistLike !== 'function') return;
        const res = await toggleTierlistLike(m.id);
        likeBtn.classList.toggle('on', !!res.liked);
        var heart = likeBtn.querySelector('.cb-heart');
        if (heart && res.liked) {
          heart.classList.remove('pop');
          void heart.offsetWidth;
          heart.classList.add('pop');
          setTimeout(function () { heart.classList.remove('pop'); }, 450);
        }
        const n = likeBtn.querySelector('.cb-like-n');
        if (n) n.textContent = typeof formatCount === 'function' ? formatCount(res.like_count) : String(res.like_count || 0);
        m.likes = res.like_count || 0;
      } catch (err) {
        if (String(err.message || err).indexOf('Login') >= 0) location.href = 'account.html';
      }
    };
  }
}

  // Community (?c=)
  if (typeof tryLoadCommunityFromQuery === 'function') {
    await tryLoadCommunityFromQuery();
  }
  // Battle Mode → Open ranking
  applyBattleResult();
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
  var ingested = ingestCreateImages();
  // If still only sync-hash (legacy eyJ / r...), ensure rendered
  if(location.hash && location.hash.length > 2){
    applyHashState();
  }
  render();
  if(!BLANK_MODE) renderFactionFilters();
  renderPortals();
  if(ingested){
    autoFitCardShape().then(function () {
      renderPool();
      if(typeof showToast === 'function') showToast(ingested + ' image(s) added');
    });
  }
  applyOpenHeroMeta();
  setHeroEditable(!communityMode);
  try {
    var ae = document.activeElement;
    if (ae && (ae.id === 'heroTitle' || ae.id === 'heroDesc')) ae.blur();
  } catch (e) {}
  if (window.__rankmeRemixPending) {
    window.__rankmeRemixPending = false;
    remixFlag = true;
    savedTierlistId = null;
    setRemixUI(true);
    wireRemixUpload();
    setHeroEditable(true);
    markDirty();
    showToast('Remix ready');
  }
})();

function loadImageSize(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=> resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = ()=> resolve({ w: 1, h: 1 });
    img.src = src;
  });
}

async function autoFitCardShape(){
  if(!BLANK_MODE) return;
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
  const useSquare = square >= portrait && square >= landscape;
  document.body.classList.toggle('card-square', useSquare);
  const px = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 64;
  if(useSquare){
    document.documentElement.style.setProperty('--card-h', px + 'px');
  } else {
    document.documentElement.style.setProperty('--card-h', Math.round(px * 1.35) + 'px');
  }
}

function ingestCreateImages(){
  if(!BLANK_MODE) return 0;
  let n = 0;
  try{
    const raw = sessionStorage.getItem('rankme_blank_images');
    if(!raw) return 0;
    const list = JSON.parse(raw);
    sessionStorage.removeItem('rankme_blank_images');
    if(!Array.isArray(list)) return 0;
    list.forEach(it=>{
      if(!it || !it.dataUrl) return;
      const id = customIdSeq++;
      state.customCards[id] = { src: it.dataUrl, name: (it.name||'image').replace(/\.[^.]+$/, '') };
      if(state.pool.indexOf(id) < 0) state.pool.push(id);
      n++;
    });
  }catch(err){}
  try{
    const tag = sessionStorage.getItem('rankme_blank_tag');
    if(tag) sessionStorage.setItem('rankme_list_tag', tag);
  }catch(err){}
  return n;
}

if(BLANK_MODE){
  document.body.classList.add('blank-mode');
  const ff = document.getElementById('factionFilters');
  if(ff) ff.style.display = 'none';
  const upload = document.getElementById('uploadImgs');
  if(upload){
    upload.addEventListener('change', async (e)=>{
      const files = [...(e.target.files||[])];
      const n = await addCustomImagesFromFiles(files);
      await autoFitCardShape();
      renderPool();
      showToast(n + ' image(s) added');
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
  }
});
