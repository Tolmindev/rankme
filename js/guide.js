/* RankMe guide — TOC spy + live board toy (same drag/portals, no save). */
(function () {
  'use strict';

  var nav = document.getElementById('guideNav');
  var links = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var secs = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  function setOn(id) {
    links.forEach(function (a) {
      a.classList.toggle('is-on', a.getAttribute('href') === '#' + id);
    });
  }

  if (secs.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      if (!vis.length) return;
      vis.sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
      setOn(vis[0].target.id);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.2, 0.5] });
    secs.forEach(function (s) { io.observe(s); });
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOn(el.id);
    });
  });

  var sim = document.getElementById('guideSim');
  if (!sim) return;

  var pool = document.getElementById('guidePool');
  var pBtn = document.getElementById('guidePortalBtn');
  var pBar = document.getElementById('guidePortalsBar');
  var portalsOn = false;
  var drag = null;
  var scrollRAF = null;

  function paintSlot(el, row) {
    var hue = row.style.getPropertyValue('--hue').trim() || '0';
    var sat = parseFloat(row.style.getPropertyValue('--sat')) || 70;
    var light = parseFloat(row.style.getPropertyValue('--light')) || 62;
    el.style.background = 'linear-gradient(180deg, hsla(' + hue + ', ' + sat + '%, ' + light + '%, 0.4), hsla(' + hue + ', ' + sat + '%, ' + Math.max(24, light - 14) + '%, 0.12))';
    el.style.border = '1.5px solid hsla(' + hue + ', 78%, 68%, 0.92)';
    el.style.setProperty('--glow', 'hsla(' + hue + ', 78%, 62%, 0.75)');
  }

  function renderPortals() {
    pBar.innerHTML = '';
    if (!portalsOn) {
      pBar.hidden = true;
      return;
    }
    pBar.hidden = false;
    sim.querySelectorAll('.tier-row').forEach(function (row) {
      var slot = document.createElement('div');
      slot.className = 'portal-slot';
      slot.dataset.tierId = row.getAttribute('data-tier-id');
      paintSlot(slot, row);
      pBar.appendChild(slot);
    });
  }

  pBtn.addEventListener('click', function () {
    portalsOn = !portalsOn;
    pBtn.classList.toggle('active', portalsOn);
    renderPortals();
  });

  document.getElementById('guideReset').addEventListener('click', function () {
    sim.querySelectorAll('.card:not(.placeholder):not(.floating)').forEach(function (c) {
      pool.appendChild(c);
    });
    portalsOn = false;
    pBtn.classList.remove('active');
    renderPortals();
  });

  function blockTouch(e) {
    if (!drag) return;
    try { e.preventDefault(); } catch (err) {}
  }

  function lockScroll() {
    if (!drag || !drag.isTouch) return;
    document.documentElement.classList.add('rankme-dragging');
    document.addEventListener('touchmove', blockTouch, { passive: false, capture: true });
  }

  function unlockScroll() {
    document.documentElement.classList.remove('rankme-dragging');
    document.removeEventListener('touchmove', blockTouch, { capture: true });
  }

  function onDown(e) {
    if (drag) return;
    var source = e.currentTarget;
    var isTouch = e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === '';
    if (!isTouch && e.button !== undefined && e.button > 0) return;
    try { e.preventDefault(); } catch (err) {}
    var rect = source.getBoundingClientRect();
    drag = {
      source: source,
      pointerId: e.pointerId,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      floater: null,
      placeholder: null,
      startedContainer: source.parentElement,
      lastY: e.clientY,
      active: false,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      isTouch: isTouch,
      overRow: null,
      overPortal: null,
      targetContainer: source.parentElement,
      targetPortal: null
    };
    try { source.setPointerCapture(e.pointerId); } catch (err) {}
    lockScroll();
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    if (isTouch) {
      beginVisual();
    }
  }

  function beginVisual() {
    if (!drag || drag.active) return;
    drag.active = true;
    var source = drag.source;
    var rect = drag.startRect;
    var floater = source.cloneNode(true);
    floater.classList.add('floating');
    floater.style.width = rect.width + 'px';
    floater.style.height = rect.height + 'px';
    floater.style.left = rect.left + 'px';
    floater.style.top = rect.top + 'px';
    floater.style.transform = 'none';
    floater.style.pointerEvents = 'none';
    document.body.appendChild(floater);
    drag.floater = floater;
    source.classList.add('dragging');
    source.style.display = 'none';
    var ph = document.createElement('div');
    ph.className = 'card placeholder';
    ph.innerHTML = '<img src="' + (source.querySelector('img') || {}).src + '">';
    drag.placeholder = ph;
    if (source.parentNode) source.parentNode.insertBefore(ph, source);
    drag.targetContainer = source.parentElement;
  }

  function containerAt(x, y) {
    var el = document.elementFromPoint(x, y);
    if (el && sim.contains(el)) {
      var hit = el.closest('.tier-cards, .pool');
      if (hit && sim.contains(hit)) return hit;
      var row = el.closest('.tier-row');
      if (row && sim.contains(row)) {
        var cards = row.querySelector('.tier-cards');
        if (cards) return cards;
      }
    }
    var rows = sim.querySelectorAll('.tier-cards, .pool');
    for (var i = 0; i < rows.length; i++) {
      var b = rows[i].getBoundingClientRect();
      if (x >= b.left - 14 && x <= b.right + 14 && y >= b.top - 14 && y <= b.bottom + 14) return rows[i];
    }
    return null;
  }

  function portalAt(x, y) {
    if (!portalsOn) return null;
    var slots = pBar.querySelectorAll('.portal-slot');
    for (var i = 0; i < slots.length; i++) {
      var b = slots[i].getBoundingClientRect();
      if (x >= b.left && x <= b.right && y >= b.top - 10 && y <= b.bottom + 10) return slots[i];
    }
    return null;
  }

  function visibleCards(cont) {
    return [].slice.call(cont.children).filter(function (c) {
      return c !== (drag && drag.source) &&
        !c.classList.contains('placeholder') &&
        c.style.display !== 'none';
    });
  }

  function isGhost(n) {
    return !n || n === (drag && drag.source) || n.classList.contains('placeholder') || n.style.display === 'none';
  }

  function nextCard(el) {
    var n = el.nextElementSibling;
    while (n && isGhost(n)) n = n.nextElementSibling;
    return n;
  }

  function sameRow(a, b, slop) {
    return a.top < b.bottom + slop && a.bottom > b.top - slop;
  }

  function placePh(cont, ph, ref) {
    if (ref) {
      if (ph.parentNode !== cont || nextCard(ph) !== ref) cont.insertBefore(ph, ref);
    } else if (ph.parentNode !== cont || nextCard(ph) !== null) {
      cont.appendChild(ph);
    }
  }

  function insertPh(cont, ph, x, y) {
    if (cont.classList.contains('pool')) {
      if (ph.parentNode !== cont) cont.appendChild(ph);
      return;
    }
    var slop = 8;
    var cards = visibleCards(cont);
    if (!cards.length) {
      if (ph.parentNode !== cont) cont.appendChild(ph);
      return;
    }
    var phHere = ph.parentNode === cont;
    var phRect = phHere ? ph.getBoundingClientRect() : null;
    if (phRect && x >= phRect.left && x <= phRect.right && y >= phRect.top && y <= phRect.bottom) return;

    var over = null;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        over = cards[i];
        break;
      }
    }
    if (over) {
      var or = over.getBoundingClientRect();
      var toRight = phRect && sameRow(or, phRect, slop) && or.left >= (phRect.left + phRect.right) / 2;
      placePh(cont, ph, toRight ? nextCard(over) : over);
      return;
    }
    var ref = null;
    for (var j = 0; j < cards.length; j++) {
      var cr = cards[j].getBoundingClientRect();
      if (y >= cr.bottom + slop) continue;
      if (y < cr.top - slop || x < cr.left) {
        ref = cards[j];
        break;
      }
    }
    placePh(cont, ph, ref);
  }

  function scrollTick() {
    if (!drag) { scrollRAF = null; return; }
    var margin = 90, maxSpeed = 22, y = drag.lastY;
    if (y < margin) window.scrollBy(0, -maxSpeed * (1 - y / margin));
    else if (y > window.innerHeight - margin) window.scrollBy(0, maxSpeed * (1 - (window.innerHeight - y) / margin));
    scrollRAF = requestAnimationFrame(scrollTick);
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    try { e.preventDefault(); } catch (err) {}
    drag.lastY = e.clientY;
    var dx = Math.abs(e.clientX - drag.startX);
    var dy = Math.abs(e.clientY - drag.startY);
    if (!drag.active) {
      if (dx < 3 && dy < 3) return;
      beginVisual();
    }
    if (!drag.floater) return;
    if (!scrollRAF) scrollRAF = requestAnimationFrame(scrollTick);
    drag.floater.style.left = (e.clientX - drag.offX) + 'px';
    drag.floater.style.top = (e.clientY - drag.offY) + 'px';
    drag.floater.style.transform = 'none';

    var cont = containerAt(e.clientX, e.clientY);
    var overRow = (cont && cont.classList.contains('tier-cards')) ? cont.closest('.tier-row') : null;
    if (drag.overRow !== overRow) {
      if (drag.overRow) drag.overRow.classList.remove('drag-over');
      if (overRow) overRow.classList.add('drag-over');
      drag.overRow = overRow;
    }
    if (cont) {
      insertPh(cont, drag.placeholder, e.clientX, e.clientY);
      drag.targetContainer = cont;
    } else if (drag.placeholder) {
      drag.placeholder.remove();
      drag.targetContainer = null;
    }
    var portal = portalAt(e.clientX, e.clientY);
    if (drag.overPortal !== portal) {
      if (drag.overPortal) drag.overPortal.classList.remove('drag-over');
      if (portal) portal.classList.add('drag-over');
      drag.overPortal = portal;
    }
    drag.targetPortal = portal || null;
  }

  function cleanup(source) {
    if (!source) return;
    source.classList.remove('dragging');
    source.style.display = '';
    source.style.visibility = '';
  }

  function onUp(e) {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    unlockScroll();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    sim.querySelectorAll('.tier-row').forEach(function (r) { r.classList.remove('drag-over'); });
    pBar.querySelectorAll('.portal-slot').forEach(function (s) { s.classList.remove('drag-over'); });

    if (!drag.active) {
      sim.querySelectorAll('.card.placeholder').forEach(function (p) { p.remove(); });
      cleanup(drag.source);
      if (drag.floater) try { drag.floater.remove(); } catch (err) {}
      drag = null;
      return;
    }

    var source = drag.source;
    var floater = drag.floater;
    var targetContainer = drag.targetContainer;
    var targetPortal = drag.targetPortal || portalAt(e.clientX, e.clientY);
    var ph = drag.placeholder;

    if (!targetContainer) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        var hit = el.closest('.tier-cards, .pool');
        if (hit && sim.contains(hit)) targetContainer = hit;
      }
    }

    var insertBefore = null;
    if (targetContainer && !(targetPortal && portalsOn) && ph && ph.parentNode === targetContainer) {
      insertBefore = nextCard(ph);
    }

    sim.querySelectorAll('.card.placeholder').forEach(function (p) { p.remove(); });

    if (targetPortal && portalsOn) {
      var row = sim.querySelector('.tier-row[data-tier-id="' + targetPortal.dataset.tierId + '"] .tier-cards');
      cleanup(source);
      if (row) row.appendChild(source);
      floater.style.transition = 'transform .25s ease, opacity .25s ease';
      floater.style.transform = 'scale(0.3)';
      floater.style.opacity = '0';
      setTimeout(function () {
        try { floater.remove(); } catch (err) {}
      }, 260);
      drag = null;
      return;
    }

    cleanup(source);
    if (targetContainer) {
      if (insertBefore) targetContainer.insertBefore(source, insertBefore);
      else targetContainer.appendChild(source);
    }
    if (floater) {
      floater.style.transition = 'opacity .12s ease';
      floater.style.opacity = '0';
      setTimeout(function () { try { floater.remove(); } catch (err) {} }, 120);
    }
    drag = null;
  }

  sim.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointerdown', onDown);
  });
})();
