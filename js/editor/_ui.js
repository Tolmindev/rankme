/* RankMe editor · row settings, size, confirm, share, download */

/* ---------------- Row settings popover ---------------- */

let openPopover = null;
let openPopoverGear = null;

function closePopover(){
  if(openPopover){ openPopover.remove(); openPopover=null; document.removeEventListener('click', outsideClose); }
  if(openPopoverGear){ openPopoverGear.classList.remove('active'); openPopoverGear=null; }
}

function openRowSettings(tierId, anchorBtn){
  if (communityMode) return;
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
    hueInput.style.setProperty('--thumb', `hsl(${v}, ${ROW_SAT}%, ${ROW_LIGHT}%)`);
    hueInput.style.setProperty('--thumb-glow', `hsla(${v}, ${ROW_SAT}%, ${ROW_LIGHT}%, .65)`);
  };
  setHueThumb(t.hue);
  hueInput.addEventListener('input', (e)=>{
    t.hue = parseInt(e.target.value, 10);
    t.sat = ROW_SAT;
    t.light = ROW_LIGHT;
    setHueThumb(t.hue);
    const row = document.querySelector(`.tier-row[data-tier-id="${tierId}"]`);
    if(row){
      row.style.setProperty('--hue', t.hue);
      row.style.setProperty('--sat', t.sat+'%');
      row.style.setProperty('--light', t.light+'%');
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
  state.tiers.push({id, name:'NEW ROW', hue:200, sat:ROW_SAT, light:ROW_LIGHT});
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
    var minS = SIZE_MIN, maxS = SIZE_MAX;
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
  const def = DEFAULT_CARD_SIZE;
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
  showConfirm('Clear all?', 'Cards go back to the pool.', ()=>{
    state.assignment = {};
    state.tiers.forEach(t=>state.assignment[t.id]=[]);
    markDirty();
    // Stock cards + custom uploads both return to pool
    const stock = freshPool();
    const customIds = Object.keys(state.customCards||{}).map(Number).filter(Boolean);
    state.pool = [...stock, ...customIds.filter(id => !stock.includes(id))];
    history.replaceState(null,'',location.pathname + location.search);
    render();
    showToast('Cleared');
  });
});

document.querySelectorAll('.js-remove-cards').forEach(function (btn) {
  btn.addEventListener('click', function () {
    if(communityMode || !BLANK_MODE) return;
    setPoolDeleteMode(!poolDeleteMode);
    showToast(poolDeleteMode ? 'Tap a pool card to remove' : 'Done');
  });
});

document.getElementById('fillAllBtn').addEventListener('click', ()=>{
  showConfirm('Fill randomly?', 'Cards in the pool go to random rows.', ()=>{
    const shuffled = [...state.pool].sort(()=>Math.random()-0.5);
    shuffled.forEach(cid=>{
      const t = state.tiers[Math.floor(Math.random()*state.tiers.length)];
      state.assignment[t.id].push(cid);
      markDirty();
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
  return prettyShareBase() + '#' + payload;
}

function prettyShareBase(){
  if (!BLANK_MODE && TEMPLATE_ID && TEMPLATE_ID !== 'blank') {
    return location.origin + '/t/' + encodeURIComponent(TEMPLATE_ID) + '.html';
  }
  return location.origin + location.pathname;
}

function shareCaption(){
  if(BLANK_MODE) return 'My ranking on RankMe';
  const t = (typeof TEMPLATE_TITLE === 'string' && TEMPLATE_TITLE) ? TEMPLATE_TITLE : 'RankMe';
  return 'My ' + t + ' ranking on RankMe';
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
        const su = new URL(prettyShareBase());
        const cur = new URL(location.href);
        const cid = cur.searchParams.get('c');
        if (cid) su.searchParams.set('c', cid);
        su.searchParams.set('s', code);
        url = su.toString();
      }
    }
  }catch(e){}
  const text = caption;
  if(kind === 'native'){
    if(navigator.share){
      try{
        await navigator.share({ title: text, text: text, url: url });
        showToast('Link Ready');
        return;
      }catch(e){
        if(e && e.name === 'AbortError') return;
      }
    }
    navigator.clipboard?.writeText(url).then(()=> showToast('Link copied'))
      .catch(()=> showToast(url));
    return;
  }
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
document.getElementById('shareBtn')?.addEventListener('click', ()=> shareLinkOrImage('native'));

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
