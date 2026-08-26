/* RankMe - Battle Mode UI */
(function () {
  'use strict';

  var B = window.RankMeBattle;
  if (!B) {
    console.error('RankMeBattle engine missing');
    return;
  }
  var esc = B.escapeHtml;

  var els = {
    arena: document.getElementById('battleArena'),
    vsRow: document.getElementById('battleVsRow'),
    fill: document.getElementById('battleFill'),
    progressLabel: document.getElementById('battleProgressLabel'),
    back: document.getElementById('battleBack'),
    how: document.getElementById('battleHow'),
    overlay: document.getElementById('battleOverlay'),
    panel: document.getElementById('battlePanel'),
    top: document.querySelector('.battle-top'),
  };

  var templateId = B.resolveTemplateId();
  if (!templateId) {
    showError('No template selected', 'Open Battle Mode from a template on the homepage.');
  } else {
    fetch('templates/' + templateId + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Template not found');
        return r.json();
      })
      .then(showModeSelect)
      .catch(function (e) {
        showError('Could not load template', e.message || '');
      });
  }

  var tpl, items, itemById, cardPath, engine, target, completed, currentPair, mode, locked;
  var historyStack = [];
  var HISTORY_MAX = 15;

  function showError(title, msg) {
    if (!els.arena) return;
    els.arena.innerHTML =
      '<div class="battle-panel" style="margin:0 auto;opacity:1;transform:none">' +
      '<h2>' + esc(title) + '</h2>' +
      '<p>' + esc(msg) + '</p>' +
      '<a class="cta primary" href="index.html">Back to RankMe</a></div>';
  }

  function setChrome(phase) {
    if (els.top) {
      els.top.style.display = '';
      els.top.classList.toggle('is-select', phase === 'select');
      els.top.classList.toggle('is-play', phase === 'play');
      els.top.classList.toggle('is-done', phase === 'done');
    }
    if (els.how) {
      if (phase === 'select') {
        els.how.hidden = false;
        els.how.removeAttribute('hidden');
        els.how.innerHTML = 'Each round you pick a winner. Those picks become a ranking.<br>More rounds - clearer order. You can edit after.';
      } else {
        els.how.hidden = true;
        els.how.setAttribute('hidden', '');
        els.how.textContent = '';
      }
    }
  }

  function openOverlay(html) {
    if (!els.panel || !els.overlay) return;
    els.panel.innerHTML = html;
    els.overlay.classList.add('open');
  }
  function closeOverlay() {
    if (els.overlay) els.overlay.classList.remove('open');
  }

  function lookupItem(id) {
    if (itemById[id]) return itemById[id];
    if (itemById[String(id)]) return itemById[String(id)];
    var n = parseInt(id, 10);
    if (!isNaN(n) && itemById[n]) return itemById[n];
    return null;
  }

  function cardSrc(c) {
    if (!c) return '';
    if (c.file) return (cardPath ? cardPath.replace(/\/?$/, '/') : '') + c.file;
    if (c.img) return (cardPath ? cardPath.replace(/\/?$/, '/') : '') + c.img;
    return '';
  }

  function pushHistory() {
    if (!engine || !currentPair) return;
    try {
      historyStack.push({
        state: JSON.parse(JSON.stringify(engine.exportState())),
        completed: completed,
        pair: [currentPair[0], currentPair[1]],
      });
      if (historyStack.length > HISTORY_MAX) historyStack.shift();
    } catch (e) {}
    updateUndoBtn();
  }

  function updateUndoBtn() {
    var btn = document.getElementById('battleUndoMid');
    if (!btn) return;
    var empty = historyStack.length === 0;
    btn.disabled = empty;
    btn.classList.toggle('is-disabled', empty);
  }

  function doUndo() {
    if (locked || !historyStack.length || !engine) return;
    locked = true;
    var snap = historyStack.pop();
    try {
      engine.importState(snap.state);
      completed = snap.completed || 0;
      currentPair = snap.pair ? [snap.pair[0], snap.pair[1]] : null;
    } catch (e) {
      locked = false;
      return;
    }
    persist();
    updateProgressUi();
    updateUndoBtn();
    // Restore THE SAME pair, do not pick a new one
    if (currentPair && currentPair[0] != null && currentPair[1] != null) {
      showPair(currentPair, true);
    } else {
      locked = false;
      renderNextPair(true);
    }
  }

  function doEqual() {
    if (locked || !currentPair) return;
    locked = true;
    var a = currentPair[0], b = currentPair[1];
    var ca = els.vsRow && els.vsRow.querySelector('.battle-card[data-id="' + cssEsc(a) + '"]');
    var cb = els.vsRow && els.vsRow.querySelector('.battle-card[data-id="' + cssEsc(b) + '"]');
    if (ca) { ca.classList.add('chosen'); ca.classList.add('equal-pick'); }
    if (cb) { cb.classList.add('chosen'); cb.classList.add('equal-pick'); }
    /* keep mid controls still while cards animate */
    var mid = document.querySelector('.battle-vs-center');
    if (mid) mid.classList.add('is-steady');
    pushHistory();
    engine.recordChoice(a, b, false, true);
    completed++;
    persist();
    // short flash only — no long stall
    scheduleAfterPick(document.querySelector(".battle-card.chosen") || document.querySelector(".battle-card"));
  }

  function showModeSelect(t) {
    tpl = t;
    items = (Array.isArray(t.cards) ? t.cards : []).map(function (c) {
      return Object.assign({}, c, { id: String(c.id) });
    });
    cardPath = t.cardPath || '';
    itemById = {};
    items.forEach(function (c) {
      itemById[c.id] = c;
      itemById[String(c.id)] = c;
    });

    document.title = 'Battle Mode - ' + (t.title || 'RankMe');
    setChrome('select');
    historyStack = [];
    if (els.arena) els.arena.style.visibility = '';

    var n = items.length;
    var qN = B.quickTargetCount(n);
    var fN = B.fullTargetCount(n);
    var qMin = B.estimateMinutes(qN);
    var fMin = B.estimateMinutes(fN);
    var savedQ = B.loadProgress(t.id, 'quick');
    var savedF = B.loadProgress(t.id, 'full');

    els.arena.innerHTML =
      '<div class="battle-mode-select">' +
        '<h1 class="battle-question">Battle Mode</h1>' +
        '<p class="battle-sub">' + esc(t.title || 'Template') + ' · ' + n + ' items</p>' +
        '<div class="battle-mode-cards">' +
          modeCardHtml('quick', ICONS.bolt, 'Quick', qN, qMin,
            'Fast draft ranking. Great for a first look.',
            savedQ) +
          modeCardHtml('full', ICONS.trophy, 'Full Ranking', fN, fMin,
            'Complete order from your picks. For real fans.',
            savedF, true) +
        '</div>' +
      '</div>';

    els.arena.querySelectorAll('.battle-mode-card').forEach(function (card) {
      var modeKey = card.getAttribute('data-mode');
      card.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var act = btn.getAttribute('data-action');
          if (act === 'new' && tpl) {
            /* Reset only: clear progress, stay on select screen */
            try { B.clearProgress(tpl.id, modeKey); } catch (err) {}
            showModeSelect(tpl);
            return;
          }
          startMode(modeKey, false);
        });
      });
      card.addEventListener('click', function (e) {
        if (e.target.closest('[data-action]')) return;
        startMode(modeKey, false);
      });
    });
    if (els.back) {
      els.back.onclick = function (e) { e.preventDefault(); location.href = 'index.html'; };
    }
  }

  var ICONS = {
    bolt: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M13 2 4 13.5h6.2L9 22l11-13.2h-6.5L13 2z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M6 4h12v2.2c2.3.4 4 2.2 4 4.4 0 2.4-1.8 4.4-4.1 4.8A5.5 5.5 0 0 1 12.5 19v1.2H16v1.6H8v-1.6h3.5V19A5.5 5.5 0 0 1 6.1 15.4C3.8 15 2 13 2 10.6c0-2.2 1.7-4 4-4.4V4zm0 3.8c-1.2.3-2 1.4-2 2.8s.8 2.5 2 2.8V7.8zm12 0v5.6c1.2-.3 2-1.4 2-2.8s-.8-2.5-2-2.8z"/></svg>'
  };

  function modeCardHtml(modeKey, icon, title, count, mins, desc, saved, isFull) {
    var hasSave = !!(saved && saved.completed > 0);
    var primary = hasSave ? 'Continue' : 'Start';
    /* always reserve Reset row height so Start/Continue stay aligned */
    var reset = hasSave
      ? '<button type="button" class="bmc-reset" data-action="new">Reset</button>'
      : '<span class="bmc-reset-slot" aria-hidden="true"></span>';
    var electric = isFull ? '<span class="bmc-electric" aria-hidden="true"></span>' : '';
    return (
      '<div class="battle-mode-card battle-mode-' + modeKey + '" data-mode="' + modeKey + '">' +
        electric +
        '<div class="bmc-icon">' + icon + '</div>' +
        '<div class="bmc-title">' + title + '</div>' +
        '<div class="bmc-meta">' + count + ' comparisons - ' + mins + ' min</div>' +
        '<div class="bmc-desc">' + desc + '</div>' +
        '<div class="bmc-actions">' +
          '<span class="bmc-resume' + (hasSave ? ' is-continue' : '') + '" data-action="continue">' + primary + '</span>' +
          reset +
        '</div>' +
      '</div>'
    );
  }

  function startMode(m, forceNew) {
    mode = m === 'full' ? 'full' : 'quick';
    var itemIds = items.map(function (c) { return c.id; });
    if (itemIds.length < 2) {
      showError('Not enough items', 'Need at least 2 cards.');
      return;
    }

    if (forceNew) {
      try { B.clearProgress(tpl.id, mode); } catch (e) {}
    }

    target = mode === 'full' ? B.fullTargetCount(itemIds.length) : B.quickTargetCount(itemIds.length);
    engine = B.createEngine(itemIds, mode);
    completed = 0;
    historyStack = [];

    var saved = forceNew ? null : B.loadProgress(tpl.id, mode);
    if (saved && saved.engineState && saved.completed > 0 && saved.completed < (saved.target || target)) {
      try {
        engine.importState(saved.engineState);
        completed = saved.completed || 0;
        target = saved.target || target;
      } catch (e) {}
    }

    setChrome('play');
    if (els.arena) els.arena.style.visibility = '';
    els.arena.innerHTML =
      '<h1 class="battle-question">Who wins?</h1>' +
      '<p class="battle-sub">Pick one · <span id="battleTitle"></span> · ' +
        '<span class="battle-mode-badge ' + mode + '">' + (mode === 'full' ? 'Full' : 'Quick') + '</span></p>' +
      '<div class="battle-progress-wrap battle-progress-in-arena">' +
        '<div class="battle-progress-bar"><div class="fill" id="battleFill"></div></div>' +
        '<div class="battle-progress-label"><span id="battleProgressLabel">0 / 0</span></div>' +
      '</div>' +
      '<div class="battle-vs-row" id="battleVsRow"></div>';

    els.vsRow = document.getElementById('battleVsRow');
    els.fill = document.getElementById('battleFill');
    els.progressLabel = document.getElementById('battleProgressLabel');
    var titleEl = document.getElementById('battleTitle');
    if (titleEl) titleEl.textContent = tpl.title || '';
    if (els.back) {
      els.back.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        showModeSelect(tpl);
      };
    }

    try {
      if (typeof trackTemplateUse === 'function') trackTemplateUse(tpl.id, 'battle');
    } catch (e) {}

    updateProgressUi();
    renderNextPair(false);
  }

  function persist() {
    if (!tpl || !engine) return;
    B.saveProgress(tpl.id, {
      mode: mode,
      completed: completed,
      target: target,
      engineState: engine.exportState(),
    });
  }

  function updateProgressUi() {
    var pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
    if (els.fill) els.fill.style.width = pct + '%';
    if (els.progressLabel) els.progressLabel.textContent = completed + ' / ' + target;
  }

  function centerControlsHtml() {
    return (
      '<div class="battle-vs-center">' +
        '<button type="button" class="battle-mid-btn" id="battleUndoMid" title="Undo last pick">' +
          '<img src="assets/icons/undo.svg" alt="Undo">' +
        '</button>' +
        '<div class="battle-vs-divider">VS</div>' +
        '<button type="button" class="battle-mid-btn" id="battleEqualMid" title="Too close to call">' +
          '<img src="assets/icons/equal.svg" alt="Equal">' +
        '</button>' +
      '</div>'
    );
  }

  function cardHtml(c) {
    if (!c) c = {};
    var src = cardSrc(c);
    var name = c.name || '';
    return (
      '<div class="battle-side">' +
        '<div class="battle-card" data-id="' + esc(c.id) + '" tabindex="0" role="button">' +
          '<div class="battle-card-frame">' +
            '<div class="battle-card-art">' +
              (src
                ? '<img src="' + esc(src) + '" alt="" draggable="false">'
                : '<div class="fallback">?</div>') +
            '</div>' +
            '<div class="battle-card-name">' + esc(name) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindMidControls() {
    var undoBtn = document.getElementById('battleUndoMid');
    var eqBtn = document.getElementById('battleEqualMid');
    if (undoBtn) {
      undoBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        doUndo();
      };
    }
    if (eqBtn) {
      eqBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        doEqual();
      };
    }
    updateUndoBtn();
  }

  function showPair(pair, animateIn) {
    locked = false;
    currentPair = pair;
    var a = lookupItem(pair[0]);
    var b = lookupItem(pair[1]);
    if (!a || !b) {
      renderNextPair(false);
      return;
    }
    updateProgressUi();
    els.vsRow = document.getElementById('battleVsRow') || els.vsRow;
    if (!els.vsRow) return;
    els.vsRow.className = 'battle-vs-row' + (animateIn ? ' entering' : '');
    els.vsRow.innerHTML =
      cardHtml(a) +
      centerControlsHtml() +
      cardHtml(b);

    if (animateIn) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          els.vsRow.classList.add('enter-active');
        });
      });
    }
    bindPairEvents();
    bindMidControls();
  }

  function renderNextPair(animateIn) {
    locked = false;
    if (isDone()) {
      showComplete();
      return;
    }
    var pair = engine.pickNextPair();
    if (!pair || !pair[0] || !pair[1]) {
      showComplete();
      return;
    }
    showPair(pair, animateIn);
  }

  function bindPairEvents() {
    locked = false;
    els.vsRow.querySelectorAll('.battle-card').forEach(function (card) {
      card.addEventListener('click', function () {
        choose(card.getAttribute('data-id'));
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose(card.getAttribute('data-id'));
        }
      });
    });
  }

  
  function pickAnimMs() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 600;
      }
    } catch (e) {}
    return 900;
  }

  function scheduleAfterPick(primaryCard) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      afterPick();
    }
    if (primaryCard) {
      primaryCard.addEventListener('animationend', function onEnd(e) {
        if (e.target !== primaryCard) return;
        primaryCard.removeEventListener('animationend', onEnd);
        finish();
      });
    }
    setTimeout(finish, pickAnimMs());
  }

  function choose(winnerIdStr) {
    if (locked || !currentPair) return;
    locked = true;

    var winnerId = currentPair[0];
    var loserId = currentPair[1];
    if (String(currentPair[1]) === String(winnerIdStr)) {
      winnerId = currentPair[1];
      loserId = currentPair[0];
    }

    var winCard = els.vsRow.querySelector('.battle-card[data-id="' + cssEsc(winnerId) + '"]');
    var loseCard = els.vsRow.querySelector('.battle-card[data-id="' + cssEsc(loserId) + '"]');
    if (winCard) winCard.classList.add('chosen');
    if (loseCard) loseCard.classList.add('rejected');

    pushHistory();
    engine.recordChoice(winnerId, loserId, false);
    completed++;
    persist();

    try {
      if (typeof reportCardBattle === 'function') reportCardBattle(tpl.id, winnerId, loserId);
    } catch (e) {}

    scheduleAfterPick(winCard || loseCard);
  }

  function afterPick() {
    var mid = document.querySelector('.battle-vs-center');
    if (mid) mid.classList.remove('is-steady');

    if (isDone()) showComplete();
    else renderNextPair(true);
  }

  function isDone() {
    if (mode === 'full' && engine.isDone && engine.isDone()) return true;
    if (mode === 'quick' && completed >= target) return true;
    return false;
  }

  function cssEsc(v) {
    return String(v).replace(/["\\]/g, '\\$&');
  }

  function launchConfetti() {
    var colors = ['#c9a3ff', '#e6a9e8', '#ffd27a', '#7bd88f', '#6fc4ff'];
    for (var i = 0; i < 40; i++) {
      var el = document.createElement('div');
      el.className = 'confetti-piece';
      var size = 6 + Math.random() * 6;
      el.style.left = Math.random() * 100 + 'vw';
      el.style.width = size + 'px';
      el.style.height = (size * (0.4 + Math.random() * 0.8)) + 'px';
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      el.style.animationDelay = (Math.random() * 0.4) + 's';
      document.body.appendChild(el);
      (function (node) {
        node.addEventListener('animationend', function () { node.remove(); });
        setTimeout(function () { if (node.parentNode) node.remove(); }, 4500);
      })(el);
    }
  }

  function showComplete() {
    updateProgressUi();
    setChrome('done');
    historyStack = [];
    B.clearProgress(tpl.id, mode);
    try {
      if (typeof recordUserBattleComplete === 'function') recordUserBattleComplete(tpl && tpl.id);
    } catch (e) {}

    var ranked = engine.finalRanking();
    ranked = ranked.map(function (id) {
      var n = parseInt(id, 10);
      return (String(n) === String(id) && !isNaN(n)) ? n : id;
    });
    var assignment = B.generateTiers(ranked);
    Object.keys(assignment).forEach(function (k) {
      assignment[k] = (assignment[k] || []).map(function (id) {
        var n = parseInt(id, 10);
        return (String(n) === String(id) && !isNaN(n)) ? n : id;
      });
    });
    var tiers = B.TIER_DEFS.map(function (t) {
      return { id: t.id, name: t.name, hue: t.hue, sat: t.sat, light: t.light };
    });
    var payload = { tiers: tiers, assignment: assignment };
    var packet = {
      templateId: tpl.id,
      mode: mode,
      payload: payload,
      ranked: ranked,
      fromBattle: true
    };
    try {
      sessionStorage.setItem('rankme_battle_result', JSON.stringify(packet));
      sessionStorage.setItem('rankme_open_payload', JSON.stringify(payload));
      sessionStorage.setItem('rankme_t', tpl.id);
      localStorage.setItem('rankme_battle_result', JSON.stringify(packet));
      sessionStorage.setItem('rankme_nav_ok', '1');
      window.allowLeave = true;
    } catch (e) {
      console.warn('battle save', e);
    }

    var builderHref = 'tier.html?t=' + encodeURIComponent(tpl.id) + '&battle=1';
    var top = ranked.slice(0, 10);
    var listHtml = top.map(function (id, i) {
      var it = lookupItem(id) || { name: 'Item ' + id };
      var src = cardSrc(it);
      return (
        '<li>' +
          '<span class="battle-result-rank">' + (i + 1) + '</span>' +
          (src
            ? '<img src="' + esc(src) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
            : '<span class="battle-result-ph"></span>') +
          '<span class="name">' + esc(it.name || ('Item ' + id)) + '</span>' +
        '</li>'
      );
    }).join('');

    if (els.arena) els.arena.style.visibility = 'hidden';
    openOverlay(
      '<div class="icon">' + ICONS.trophy + '</div>' +
      '<h2>Battle Complete!</h2>' +
      '<p>Your ranking is ready.</p>' +
      '<ul class="battle-result-list">' + listHtml + '</ul>' +
      '<div class="row battle-panel-actions" style="flex-direction:column;">' +
        '<a class="btn primary" id="battleOpenRanking" href="' + builderHref + '">Open Ranking</a>' +
        '<button type="button" class="btn ghost" id="battleExitComplete">Close</button>' +
      '</div>'
    );
    launchConfetti();

    var openBtn = document.getElementById('battleOpenRanking');
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        try {
          sessionStorage.setItem('rankme_nav_ok', '1');
          window.allowLeave = true;
        } catch (err) {}
      });
    }
    function bindExitWarn() {
      var exitBtn = document.getElementById('battleExitComplete');
      if (exitBtn) {
        exitBtn.onclick = function (e) {
          e.preventDefault();
          openOverlay(
            '<h2>Leave?</h2>' +
            '<p>Your ranking is ready. Open it or discard it.</p>' +
            '<div class="battle-panel-actions" style="flex-direction:column;width:100%;">' +
              '<a class="btn primary" id="battleOpenFromWarn" href="' + builderHref + '">Open Ranking</a>' +
              '<button type="button" class="btn ghost" id="battleLeaveComplete">Leave</button>' +
            '</div>'
          );
          var openFromWarn = document.getElementById('battleOpenFromWarn');
          if (openFromWarn) {
            openFromWarn.addEventListener('click', function () {
              try {
                sessionStorage.setItem('rankme_nav_ok', '1');
                window.allowLeave = true;
              } catch (err) {}
            });
          }
          document.getElementById('battleLeaveComplete').onclick = function () {
            try {
              sessionStorage.setItem('rankme_nav_ok', '1');
              window.allowLeave = true;
            } catch (err) {}
            location.href = 'index.html';
          };
        };
      }
    }
    bindExitWarn();
    if (els.back) {
      els.back.onclick = function (e) {
        e.preventDefault();
        var btn = document.getElementById('battleExitComplete');
        if (btn) btn.click();
        else location.href = 'index.html';
      };
    }
  }

})();
