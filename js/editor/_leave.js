/* RankMe editor · unsaved leave guard */

function hasProgress(){
  return Object.values(state.assignment || {}).some(function (arr) {
    return arr && arr.length > 0;
  });
}

/** True only when user has unsaved edits (not community view, not after Save). */
let rankingDirty = false;
let leaveTrapOn = false;
let pendingNav = '#';
window.allowLeave = false;

function markDirty() {
  if (communityMode) return;
  rankingDirty = true;
  setAllowLeave(false);
  armLeaveTrap();
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

function setAllowLeave(v){
  window.allowLeave = !!v;
  try{
    if(v) sessionStorage.setItem('rankme_nav_ok', '1');
    else sessionStorage.removeItem('rankme_nav_ok');
  }catch(_){}
}
window.setAllowLeave = setAllowLeave;

function armLeaveTrap() {
  if (leaveTrapOn || communityMode) return;
  try {
    history.pushState({ rankmeTrap: 1 }, '', location.href);
    leaveTrapOn = true;
  } catch (_) {}
}

function openLeaveModal(nav) {
  pendingNav = nav;
  var modal = document.getElementById('leaveModal');
  if (modal) modal.classList.add('open');
}

function rankmeBeforeUnload(e){
  try{ if(sessionStorage.getItem('rankme_nav_ok') === '1') return; }catch(_){}
  if (!needsLeaveWarn()) return;
  e.preventDefault();
  e.returnValue = '';
}
window.addEventListener('beforeunload', rankmeBeforeUnload);

window.addEventListener('popstate', function () {
  var wasTrap = leaveTrapOn;
  leaveTrapOn = false;
  if (needsLeaveWarn()) {
    armLeaveTrap();
    openLeaveModal('__back__');
    return;
  }
  if (wasTrap) {
    setTimeout(function () { history.back(); }, 0);
  }
});

window.addEventListener('pageshow', function (e) {
  if (e.persisted && needsLeaveWarn()) {
    leaveTrapOn = false;
    armLeaveTrap();
  }
});

/** Account is always allowed - ranking is stashed, never blocked */
function navigateToAccount(){
  setAllowLeave(true);
  try{
    if(typeof hasProgress === 'function' && hasProgress() && typeof stashDraftBeforeLogin === 'function'){
      stashDraftBeforeLogin({ needReturn: false });
    } else {
      sessionStorage.removeItem('rankme_login_return');
    }
  }catch(_){}
  window.location.assign(new URL('account.html', location.href).href);
}
window.navigateToAccount = navigateToAccount;

document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  if (a.target && a.target !== '_self') return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var target = a.getAttribute('href') || '';
  if (!target || target === '#' || target.indexOf('javascript:') === 0) return;
  if (/account\.html/i.test(target)) {
    e.preventDefault();
    navigateToAccount();
    return;
  }
  try {
    var u = new URL(target, location.href);
    if (u.pathname === location.pathname && u.search === location.search && !u.hash) {
      e.preventDefault();
      return;
    }
  } catch (_) { return; }
  if (!needsLeaveWarn()) return;
  e.preventDefault();
  e.stopPropagation();
  openLeaveModal(target);
}, true);

const loginBtn = document.getElementById('loginBtn');
if(loginBtn){
  loginBtn.dataset.navBound = '1';
  loginBtn.dataset.accountNav = '1';
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
  rankingDirty = false;
  if (pendingNav === '__back__') {
    history.back();
  } else {
    window.location.href = pendingNav;
  }
});
