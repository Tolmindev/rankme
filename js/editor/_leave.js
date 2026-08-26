/* RankMe editor · unsaved leave guard */

/* ---------------- Leave warning ---------------- */

function hasProgress(){
  return Object.values(state.assignment || {}).some(function (arr) {
    return arr && arr.length > 0;
  });
}

/** True only when user has unsaved edits (not community view, not after Save). */
let rankingDirty = false;

function markDirty() {
  if (communityMode) return;
  rankingDirty = true;
  setAllowLeave(false);
}

function markClean() {
  rankingDirty = false;
  setAllowLeave(true);
}

function needsLeaveWarn() {
  if (communityMode) return false;
  if (window.allowLeave) return false;
  if (!rankingDirty) return false;
  return hasProgress();
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
  if (!needsLeaveWarn()) return;
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
    if (!needsLeaveWarn()) return;
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
