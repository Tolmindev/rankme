/* RankMe guide — TOC spy + tiny click-to-rank demo. */
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

  var board = document.getElementById('miniBoard');
  if (!board) return;

  var pick = null;

  function clearPick() {
    board.querySelectorAll('.g-card.is-pick').forEach(function (c) { c.classList.remove('is-pick'); });
    pick = null;
  }

  board.addEventListener('click', function (e) {
    var card = e.target.closest('.g-card');
    var row = e.target.closest('.g-row');
    if (card) {
      if (pick === card) { clearPick(); return; }
      clearPick();
      pick = card;
      card.classList.add('is-pick');
      return;
    }
    if (row && pick) {
      row.querySelector('.g-cells').appendChild(pick);
      clearPick();
    }
  });

  var reset = document.getElementById('miniReset');
  if (reset) {
    reset.addEventListener('click', function () {
      var pool = board.querySelector('.g-row[data-t="pool"] .g-cells');
      board.querySelectorAll('.g-card').forEach(function (c) { pool.appendChild(c); });
      clearPick();
    });
  }

  var pBtn = document.getElementById('miniPortals');
  var pBar = document.getElementById('miniPortalsBar');
  if (pBtn && pBar) {
    pBtn.addEventListener('click', function () {
      var on = pBar.hasAttribute('hidden');
      if (on) pBar.removeAttribute('hidden');
      else pBar.setAttribute('hidden', '');
      pBtn.classList.toggle('is-on', on);
    });
    pBar.addEventListener('click', function (e) {
      var slot = e.target.closest('.g-portal');
      if (!slot || !pick) return;
      var row = board.querySelector('.g-row[data-t="' + slot.getAttribute('data-t') + '"] .g-cells');
      if (row) row.appendChild(pick);
      clearPick();
    });
  }
})();
