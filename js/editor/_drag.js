/* RankMe editor · pointer drag / drop / portals hit */

/* ---------------- Drag & drop (pointer-based, mouse+touch) ---------------- */

let drag = null;
let autoScrollRAF = null;

function blockTouchScroll(e){
  if(!drag) return;
  try { e.preventDefault(); } catch(err){}
}

function lockTouchScroll(){
  if(!drag || !drag.isTouch) return;
  document.documentElement.classList.add('rankme-dragging');
  document.addEventListener('touchmove', blockTouchScroll, { passive: false, capture: true });
}

function unlockTouchScroll(){
  document.documentElement.classList.remove('rankme-dragging');
  document.removeEventListener('touchmove', blockTouchScroll, { capture: true });
}

function onCardPointerDown(e){
  if (communityMode) return;

  if(drag) return;
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
  lockTouchScroll();
  window.addEventListener('pointermove', onDragMove, { passive: false });
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
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
  source.style.display = 'none';

  const ph = document.createElement('div');
  ph.className = 'card placeholder';
  ph.innerHTML = '<img src="'+cardSrc(drag.cid)+'">';
  drag.placeholder = ph;
  if(source.parentNode) source.parentNode.insertBefore(ph, source);
  drag.targetContainer = source.parentElement;
}

function containerAt(x,y){
  const el = document.elementFromPoint(x, y);
  if(el){
    const hit = el.closest('.tier-cards, .pool');
    if(hit) return hit;
    const row = el.closest('.tier-row');
    if(row){
      const cards = row.querySelector('.tier-cards');
      if(cards) return cards;
    }
  }
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

function visibleDragCards(cont){
  return [...cont.children].filter(c =>
    c !== (drag && drag.source) &&
    !c.classList.contains('placeholder') &&
    c.style.display !== 'none' &&
    c.style.visibility !== 'hidden'
  );
}

function isDragGhost(n){
  return !n || n === (drag && drag.source) || n.classList.contains('placeholder') || n.style.display === 'none';
}

function nextDragCard(el){
  let n = el.nextElementSibling;
  while(n && isDragGhost(n)) n = n.nextElementSibling;
  return n;
}

function sameRow(a, b, slop){
  return a.top < b.bottom + slop && a.bottom > b.top - slop;
}

function placePlaceholder(cont, ph, ref){
  if(ref){
    if(ph.parentNode !== cont || nextDragCard(ph) !== ref) cont.insertBefore(ph, ref);
  } else if(ph.parentNode !== cont || nextDragCard(ph) !== null){
    cont.appendChild(ph);
  }
}

/* Swap as soon as the pointer overlaps a neighbor. Placeholder hole stays put
   while the pointer is still inside it, so the original slot does not jump. */
function insertPlaceholderAt(cont, ph, x, y){
  if(cont.classList.contains('pool')){
    if(ph.parentNode !== cont) cont.appendChild(ph);
    return;
  }
  const slop = 8;
  const cards = visibleDragCards(cont);
  if(!cards.length){
    if(ph.parentNode !== cont) cont.appendChild(ph);
    return;
  }

  const phHere = ph.parentNode === cont;
  const phRect = phHere ? ph.getBoundingClientRect() : null;
  if(phRect && x >= phRect.left && x <= phRect.right && y >= phRect.top && y <= phRect.bottom){
    return;
  }

  let over = null;
  for(const child of cards){
    const r = child.getBoundingClientRect();
    if(x >= r.left && x <= r.right && y >= r.top && y <= r.bottom){
      over = child;
      break;
    }
  }

  if(over){
    const r = over.getBoundingClientRect();
    const toRight = phRect && sameRow(r, phRect, slop) && r.left >= (phRect.left + phRect.right) / 2;
    placePlaceholder(cont, ph, toRight ? nextDragCard(over) : over);
    return;
  }

  let ref = null;
  for(const child of cards){
    const r = child.getBoundingClientRect();
    if(y >= r.bottom + slop) continue;
    if(y < r.top - slop || x < r.left){
      ref = child;
      break;
    }
  }
  placePlaceholder(cont, ph, ref);
}

function onDragMove(e){
  if(!drag || e.pointerId !== drag.pointerId) return;
  try { e.preventDefault(); } catch(err){}
  drag.lastY = e.clientY;

  const dx = Math.abs(e.clientX - drag.startX);
  const dy = Math.abs(e.clientY - drag.startY);
  if(!drag.active){
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

  const cont = containerAt(e.clientX, e.clientY);
  const overRow = (cont && cont.classList.contains('tier-cards'))
    ? cont.closest('.tier-row')
    : null;
  if(drag.overRow !== overRow){
    if(drag.overRow) drag.overRow.classList.remove('drag-over');
    if(overRow) overRow.classList.add('drag-over');
    drag.overRow = overRow;
  }

  if(cont){
    let ph = drag.placeholder;
    if(!ph){
      ph = document.createElement('div');
      ph.className = 'card placeholder';
      ph.innerHTML = '<img src="'+cardSrc(drag.cid)+'">';
      drag.placeholder = ph;
    }
    insertPlaceholderAt(cont, ph, e.clientX, e.clientY);
    drag.targetContainer = cont;
  } else if(drag.placeholder){
    drag.placeholder.remove();
    drag.targetContainer = null;
  }

  const portal = portalAt(e.clientX, e.clientY);
  if(drag.overPortal !== portal){
    if(drag.overPortal) drag.overPortal.classList.remove('drag-over');
    if(portal) portal.classList.add('drag-over');
    drag.overPortal = portal;
  }
  drag.targetPortal = portal || null;
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
  unlockTouchScroll();
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
    markDirty();
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
    markDirty();
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
