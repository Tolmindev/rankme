/* RankMe — Classic / One by One picker. Reuses battle-mode-select chrome. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
  }

  var arena = document.getElementById('battleArena');
  var how = document.getElementById('battleHow');
  var back = document.getElementById('battleBack');
  var params = new URLSearchParams(location.search);
  var templateId = (params.get('t') || '').trim();

  if (params.get('blank') === '1') {
    location.replace('builder.html?blank=1&play=classic');
    return;
  }

  try {
    sessionStorage.removeItem('rankme_open_payload');
    sessionStorage.removeItem('rankme_remix_pending');
  } catch (e) {}

  if (how) {
    how.hidden = false;
    how.removeAttribute('hidden');
    how.textContent = 'Same board. Drag every card, or place them one at a time.';
  }
  if (back) {
    back.onclick = function (e) {
      e.preventDefault();
      location.href = 'index.html';
    };
  }

  function cardHtml(mode, icon, title, desc, electric) {
    return (
      '<div class="battle-mode-card' + (electric ? ' battle-mode-full' : '') + '" data-play="' + mode + '">' +
        (electric ? '<span class="bmc-electric" aria-hidden="true"></span>' : '') +
        '<div class="bmc-icon"><img src="' + icon + '" alt=""></div>' +
        '<div class="bmc-title">' + title + '</div>' +
        '<div class="bmc-desc">' + desc + '</div>' +
        '<div class="bmc-actions"><span class="bmc-resume" data-action="start">Start</span></div>' +
      '</div>'
    );
  }

  function go(mode) {
    var play = mode === 'one' ? 'one' : 'classic';
    if (!templateId) return;
    var next = 'tier.html?t=' + encodeURIComponent(templateId) + '&play=' + play;
    var s = params.get('s');
    var c = params.get('c');
    if (s) next += '&s=' + encodeURIComponent(s);
    if (c) next += '&c=' + encodeURIComponent(c);
    location.href = next + location.hash;
  }

  if (params.get('s') || params.get('c')) {
    go('classic');
    return;
  }

  function setHaze(src) {
    if (window.matchMedia && !window.matchMedia('(min-width: 721px)').matches) return;
    var wrap = document.getElementById('playHaze');
    var img = document.getElementById('playHazeImg');
    if (!wrap || !img || !src) return;
    img.onload = function () {
      wrap.hidden = false;
      wrap.classList.add('is-on');
      document.body.classList.add('has-play-haze');
    };
    img.src = src;
  }

  function paint(title, countLabel) {
    document.title = 'Choose Mode - ' + title;
    if (!arena) return;
    arena.innerHTML =
      '<div class="battle-mode-select play-pick">' +
        '<h1 class="battle-question">Choose Mode</h1>' +
        '<p class="battle-sub">' + esc(title) + (countLabel ? ' · ' + esc(countLabel) : '') + '</p>' +
        '<div class="battle-mode-cards">' +
          cardHtml('classic', 'assets/icons/classic.svg', 'Classic Board',
            'All cards at once. Full control.', true) +
          cardHtml('one', 'assets/icons/one-by-one.svg', 'One by One',
            'One card at a time. Great for mobile.', false) +
        '</div>' +
      '</div>';
    arena.querySelectorAll('.battle-mode-card').forEach(function (card) {
      var mode = card.getAttribute('data-play');
      card.addEventListener('click', function (e) {
        e.preventDefault();
        go(mode);
      });
    });
  }

  if (!templateId) {
    if (arena) {
      arena.innerHTML =
        '<div class="battle-panel" style="margin:0 auto;opacity:1;transform:none">' +
        '<h2>No template</h2><p>Open a list from Explore.</p>' +
        '<a class="cta primary" href="index.html">Back to RankMe</a></div>';
    }
    return;
  }

  fetch('templates/' + encodeURIComponent(templateId) + '.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('not found');
      return r.json();
    })
    .then(function (t) {
      var n = (t.cards || []).length;
      function finish() {
        var label = 'cards';
        var meta = window.RankMeCatalog && RankMeCatalog.get(templateId);
        if (meta && meta.itemLabel) label = meta.itemLabel;
        if (window.RankMeCatalog && RankMeCatalog.cover) setHaze(RankMeCatalog.cover(templateId));
        paint(t.title || templateId, n + ' ' + label);
      }
      if (window.RankMeCatalog && RankMeCatalog.load) {
        RankMeCatalog.load().then(finish).catch(finish);
      } else finish();
    })
    .catch(function () {
      if (arena) {
        arena.innerHTML =
          '<div class="battle-panel" style="margin:0 auto;opacity:1;transform:none">' +
          '<h2>Could not load</h2>' +
          '<a class="cta primary" href="index.html">Back to RankMe</a></div>';
      }
    });
})();
