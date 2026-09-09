/* RankMe editor · One by One intake (card + portals above the board) */

function isPlayOne() {
  try { return new URLSearchParams(location.search).get('play') === 'one'; }
  catch (e) { return false; }
}

var oboFlashTimer = 0;
var oboBusy = false;
var oboLockCard = false;

function oboCounts() {
  var placed = 0;
  Object.keys(state.assignment || {}).forEach(function (k) {
    placed += (state.assignment[k] || []).length;
  });
  var left = (state.pool || []).length;
  return { placed: placed, left: left, total: placed + left };
}

function oboReduceMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

var OBO_GLOW_REST = 'rgba(141, 100, 255, 0.12)';

function flashOboGlow(hue, sat, light) {
  var glow = document.getElementById('oboGlow');
  if (!glow) return;
  var h = Number(hue);
  var s = Number.isFinite(Number(sat)) ? Number(sat) : 70;
  var l = Number.isFinite(Number(light)) ? Number(light) : 55;
  if (!Number.isFinite(h)) h = 270;
  glow.style.setProperty('--obo-flash', 'hsla(' + h + ', ' + Math.min(80, s + 10) + '%, ' + Math.min(56, l + 2) + '%, 0.2)');
  if (oboFlashTimer) clearTimeout(oboFlashTimer);
  oboFlashTimer = setTimeout(function () {
    glow.style.setProperty('--obo-flash', OBO_GLOW_REST);
    oboFlashTimer = 0;
  }, 1000);
}

function oboCardName(id) {
  if (state.customCards && state.customCards[id] && state.customCards[id].name) {
    return state.customCards[id].name;
  }
  if (CARD_META[id] && CARD_META[id].name) return CARD_META[id].name;
  return '';
}

function fillOboCard(cardEl, id) {
  var src = typeof cardSrc === 'function' ? cardSrc(id) : '';
  var name = oboCardName(id);
  cardEl.style.setProperty('--obo-aspect', String(CARD_ASPECT || 1.35));
  cardEl.innerHTML =
    '<div class="battle-card-frame">' +
      (src ? '<img src="' + src + '" alt="">' : '<div class="fallback">?</div>') +
    '</div>' +
    (name ? '<div class="battle-card-name">' + String(name).replace(/</g, '') + '</div>' : '');
}

function refreshOneByOne() {
  if (!document.body.classList.contains('play-one')) return;
  var counts = oboCounts();
  var fill = document.getElementById('oboFill');
  var label = document.getElementById('oboProgress');
  var cardEl = document.getElementById('oboCard');
  var doneEl = document.getElementById('oboComplete');
  var bar = document.getElementById('oboPortals');
  var title = document.getElementById('oboTitle');
  if (title) {
    var h = document.getElementById('heroTitle');
    title.textContent = (h && h.textContent.trim()) || TEMPLATE_TITLE || '';
  }
  var pct = counts.total ? Math.round((counts.placed / counts.total) * 100) : 0;
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = counts.placed + ' / ' + counts.total;

  var done = counts.left === 0;
  if (doneEl && !oboLockCard) {
    doneEl.hidden = !done;
    if (done) doneEl.removeAttribute('hidden');
    else doneEl.setAttribute('hidden', '');
  }
  if (cardEl && !oboLockCard) {
    cardEl.className = 'obo-card';
    if (done) {
      cardEl.hidden = true;
      cardEl.setAttribute('hidden', '');
      cardEl.innerHTML = '';
    } else {
      var id = state.pool[0];
      cardEl.hidden = false;
      cardEl.removeAttribute('hidden');
      fillOboCard(cardEl, id);
    }
  }
  if (bar) {
    bar.innerHTML = '';
    (state.tiers || []).forEach(function (tier) {
      var slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'portal-slot';
      slot.dataset.tierId = tier.id;
      var hue = tier.hue;
      var sat = Number.isFinite(Number(tier.sat)) ? Number(tier.sat) : ROW_SAT;
      var light = Number.isFinite(Number(tier.light)) ? Number(tier.light) : ROW_LIGHT;
      slot.style.background = 'linear-gradient(180deg, hsla(' + hue + ', ' + sat + '%, ' + light + '%, 0.4), hsla(' + hue + ', ' + sat + '%, ' + Math.max(24, light - 14) + '%, 0.12))';
      slot.style.border = '1.5px solid hsla(' + hue + ', 78%, 68%, 0.92)';
      slot.style.setProperty('--glow', 'hsla(' + hue + ', 78%, 62%, 0.75)');
      slot.addEventListener('click', function () { sendOboCard(tier.id, hue, sat, light); });
      bar.appendChild(slot);
    });
  }
}

function sendOboCard(tierId, hue, sat, light) {
  if (oboBusy || communityMode || !state.pool.length) return;
  var cid = state.pool[0];
  var cardEl = document.getElementById('oboCard');
  var instant = oboReduceMotion();
  oboBusy = true;
  placeCardInTier(cid, tierId);
  flashOboGlow(hue, sat, light);
  if (instant || !cardEl || cardEl.hidden) {
    oboLockCard = false;
    oboBusy = false;
    render();
    return;
  }
  oboLockCard = true;
  cardEl.classList.remove('is-enter', 'is-in');
  cardEl.classList.add('is-leave');
  render();
  setTimeout(function () {
    oboLockCard = false;
    oboBusy = false;
    refreshOneByOne();
    var next = document.getElementById('oboCard');
    if (next && !next.hidden) {
      next.className = 'obo-card is-enter';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          next.classList.add('is-in');
          setTimeout(function () {
            if (next.classList.contains('is-leave')) return;
            next.classList.remove('is-enter', 'is-in');
          }, 520);
        });
      });
    }
  }, 480);
}

function initOneByOne() {
  if (!isPlayOne() || communityMode) return;
  document.body.classList.add('play-one');
  var wrap = document.getElementById('oneByOne');
  if (wrap) {
    wrap.hidden = false;
    wrap.removeAttribute('hidden');
  }
  var glow = document.getElementById('oboGlow');
  if (glow) {
    glow.hidden = false;
    glow.removeAttribute('hidden');
  }
  refreshOneByOne();
}
