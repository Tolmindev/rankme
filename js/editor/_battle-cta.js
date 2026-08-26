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
