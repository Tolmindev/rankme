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
  var blank = params.get('blank') === '1';
  var templateId = (params.get('t') || '').trim();

  try {
    if (sessionStorage.getItem('rankme_remix_pending') !== '1') {
      sessionStorage.removeItem('rankme_open_payload');
    }
  } catch (e) {}

  if (how) {
    how.hidden = false;
    how.removeAttribute('hidden');
    how.textContent = 'Same board. Drag every card, or place them one at a time.';
  }
  if (back) {
    back.onclick = function (e) {
      e.preventDefault();
      location.href = blank ? 'create.html' : 'index.html';
    };
  }

  function cardHtml(mode, icon, title, desc, electric) {
    return (
      '<div class="battle-mode-card' + (electric ? ' battle-mode-full' : '') + '" data-play="' + mode + '">' +
        (electric ? '<span class="bmc-electric" aria-hidden="true"></span>' : '') +
        '<div class="bmc-icon"><img src="' + icon + '" alt="" width="56" height="56"></div>' +
        '<div class="bmc-title">' + title + '</div>' +
        '<div class="bmc-desc">' + desc + '</div>' +
        '<div class="bmc-actions"><span class="bmc-resume" data-action="start">Start</span></div>' +
      '</div>'
    );
  }

  function go(mode) {
    var play = mode === 'one' ? 'one' : 'classic';
    if (blank) {
      location.href = 'builder.html?blank=1&play=' + play;
      return;
    }
    if (!templateId) return;
    location.href = 'tier.html?t=' + encodeURIComponent(templateId) + '&play=' + play;
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

  if (blank) {
    var n = 0;
    var title = 'Your ranking';
    try {
      title = sessionStorage.getItem('rankme_blank_title') || title;
      var raw = sessionStorage.getItem('rankme_blank_images');
      if (raw) n = (JSON.parse(raw) || []).length;
    } catch (e) {}
    paint(title, n ? n + (n === 1 ? ' card' : ' cards') : '');
    return;
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
