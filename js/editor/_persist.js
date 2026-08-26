/* RankMe editor · remix, save, drafts */

// Remix = editable copy + option to add own images into the pool
let remixFlag = false;
let savedTierlistId = null;   // overwrite own ranking on Save
let communityMode = false;    // viewing someone else's public list
let communityMeta = null;
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
function doRemix() {
  try {
    if (BLANK_MODE) {
      showToast('Remix: Exclusive only');
      return;
    }

    // From public/community: same path as Open from Save —
    // full reload into editor (no leftover community lock).
    if (communityMode || document.body.classList.contains('community-view') ||
        /[?&]c=/.test(location.search)) {
      var title = '';
      var subtitle = '';
      try {
        title = (document.getElementById('heroTitle') && document.getElementById('heroTitle').textContent || '').trim();
        subtitle = (document.getElementById('heroDesc') && document.getElementById('heroDesc').textContent || '').trim();
      } catch (e) {}
      var payload = {
        tiers: state.tiers,
        assignment: state.assignment,
        customCards: state.customCards || {},
        subtitle: subtitle || null,
      };
      sessionStorage.setItem('rankme_open_payload', JSON.stringify(payload));
      sessionStorage.setItem('rankme_open_title', title || '');
      if (subtitle) sessionStorage.setItem('rankme_open_subtitle', subtitle);
      else sessionStorage.removeItem('rankme_open_subtitle');
      sessionStorage.setItem('rankme_remix_pending', '1');
      sessionStorage.removeItem('rankme_saved_id');
      var tid = TEMPLATE_ID || 'sf-duel';
      setAllowLeave(true);
      location.href = 'tier.html?t=' + encodeURIComponent(tid);
      return;
    }

    // Already in editor: in-place remix
    state.tiers = JSON.parse(JSON.stringify(state.tiers || []));
    state.assignment = JSON.parse(JSON.stringify(state.assignment || {}));
    var used = new Set();
    Object.keys(state.assignment).forEach(function (k) {
      (state.assignment[k] || []).forEach(function (id) {
        used.add(id);
        used.add(String(id));
        var n = Number(id);
        if (!isNaN(n)) used.add(n);
      });
    });
    var pool = typeof freshPool === 'function' ? freshPool() : [];
    state.pool = pool.filter(function (id) {
      return !used.has(id) && !used.has(String(id)) && !used.has(Number(id));
    });
    remixFlag = true;
    savedTierlistId = null;
    window.__rankmeFromCabinet = true;
    setRemixUI(true);
    if (typeof wireRemixUpload === 'function') wireRemixUpload();
    if (typeof render === 'function') render();
    if (!BLANK_MODE && typeof renderFactionFilters === 'function') renderFactionFilters();
    if (typeof renderPortals === 'function') renderPortals();
    if (typeof setHeroEditable === 'function') setHeroEditable(true);
    if (typeof markDirty === 'function') markDirty();
    showToast('Remix ready');
  } catch (err) {
    console.error('[RankMe] remix failed', err && (err.message || err));
    showToast('Remix failed - try refresh');
  }
}
document.getElementById('remixBtn')?.addEventListener('click', function (e) {
  e.preventDefault();
  doRemix();
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
      title: (document.getElementById('heroTitle')?.textContent || document.getElementById('listTitle')?.textContent || '').trim() || null,
      subtitle: (document.getElementById('heroDesc')?.textContent || '').trim() || null
    }));
  }catch(e){ console.warn('stash draft', e); }
}

function restoreDraftIfAny(){
  try{
    if(communityMode) return false;
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
        const h = document.getElementById('heroTitle') || document.getElementById('listTitle');
        if(h) h.textContent = data.title;
      }
      if(data.subtitle){
        const d = document.getElementById('heroDesc');
        if(d) d.textContent = data.subtitle;
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
    const heroT = (document.getElementById('heroTitle')?.textContent || '').trim();
    const heroD = (document.getElementById('heroDesc')?.textContent || '').trim();
    const base = heroT || TEMPLATE_TITLE || 'Ranking';
    const title = remixFlag && !heroT.startsWith('Remix') ? ('Remix · ' + base) : base;
    sanitizeState();
    const payload = {
      tiers: state.tiers,
      assignment: state.assignment,
      customCards: state.customCards || {},
      subtitle: heroD || null,
    };
    const overwriteId = (!remixFlag && savedTierlistId) ? savedTierlistId : null;
    const row = await saveExclusiveTierlist({
      title,
      templateId: TEMPLATE_ID || 'sf-duel',
      payload,
      id: overwriteId || undefined,
    });
    if (row && row.id) savedTierlistId = row.id;
    remixFlag = false;
    if (document.body.classList.contains('community-view') || communityMode) {
      exitCommunityToEditor();
    }
    markClean();
    showToast('Ranking Saved');
  }catch(e){
    console.error(e);
    showToast('Could not save. Try again in a moment.');
  }
});
