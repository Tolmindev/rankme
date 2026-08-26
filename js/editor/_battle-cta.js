/* RankMe editor · Battle Mode button on tier page */

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
      var path = location.pathname.replace(/\/+$/, '').replace(/\.html$/i, '');
      var parts = path.split('/').filter(Boolean);
      var cand = '';
      if (parts.length === 1) cand = parts[0];
      else if (parts.length === 2 && parts[0] === 't') cand = parts[1];
      var skip = { account:1, battle:1, builder:1, create:1, dmca:1, index:1, privacy:1, terms:1, tier:1 };
      if (cand && !skip[cand] && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(cand)) return cand;
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
