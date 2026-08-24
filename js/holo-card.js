/* RankMe achievements — holo tilt, focus zoom, unlocks.
   First unlock: any signed-in user has "Not An Alien". */
(function (global) {
  'use strict';

  var CARDS = [
    {
      id: 'not-an-alien',
      title: 'Not An Alien',
      desc: "You're in. Welcome to RankMe - make yourself at home.",
      img: 'assets/achievements/achiev_1.webp'
    }
  ];

  function setPointer(el, e) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    el.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    el.style.setProperty('--posx', ((x - 0.5) * 100).toFixed(2) + '%');
    el.style.setProperty('--posy', ((y - 0.5) * 100).toFixed(2) + '%');
    el.style.setProperty('--rx', ((x - 0.5) * 28).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((0.5 - y) * 20).toFixed(2) + 'deg');
  }

  function resetPointer(el) {
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.setProperty('--posx', '0%');
    el.style.setProperty('--posy', '0%');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function cardHtml(item) {
    return (
      '<button type="button" class="ach-card" data-ach="' + esc(item.id) + '" aria-label="' + esc(item.title) + '">' +
        '<span class="ach-card-face">' +
          '<img class="ach-art" src="' + item.img + '" alt="">' +
          '<span class="ach-foil" aria-hidden="true"></span>' +
          '<span class="ach-sheen" aria-hidden="true"></span>' +
          '<span class="ach-glare" aria-hidden="true"></span>' +
        '</span>' +
      '</button>'
    );
  }

  function bindCard(el, stage, item) {
    el.addEventListener('pointermove', function (e) { setPointer(el, e); });
    el.addEventListener('pointerleave', function () { resetPointer(el); });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openStage(el, stage, item);
    });
  }

  var closeTimer = 0;

  function openStage(source, stage, item) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    var from = source.getBoundingClientRect();
    stage.hidden = false;
    stage.innerHTML =
      '<div class="ach-focus-wrap">' +
        cardHtml(item) +
        '<div class="ach-focus-copy">' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p>' + esc(item.desc) + '</p>' +
        '</div>' +
      '</div>';

    var wrap = stage.querySelector('.ach-focus-wrap');
    var card = stage.querySelector('.ach-card');
    card.classList.add('is-focus');
    resetPointer(card);
    card.addEventListener('pointermove', function (e) { setPointer(card, e); });
    card.addEventListener('pointerleave', function () { resetPointer(card); });
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });

    var to = card.getBoundingClientRect();
    var dx = from.left + from.width / 2 - (to.left + to.width / 2);
    var dy = from.top + from.height / 2 - (to.top + to.height / 2);
    var s = from.width / to.width;
    card.style.transition = 'none';
    card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    wrap.classList.remove('is-in');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        card.style.transition = 'transform 0.62s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'none';
        wrap.classList.add('is-in');
      });
    });

    document.body.classList.add('ach-focus-open');
    stage._source = source;
    stage._item = item;
  }

  function closeStage(stage) {
    var card = stage.querySelector('.ach-card');
    var wrap = stage.querySelector('.ach-focus-wrap');
    var source = stage._source;
    if (!card || !source) {
      stage.hidden = true;
      stage.innerHTML = '';
      document.body.classList.remove('ach-focus-open');
      return;
    }
    var from = card.getBoundingClientRect();
    var to = source.getBoundingClientRect();
    var dx = to.left + to.width / 2 - (from.left + from.width / 2);
    var dy = to.top + to.height / 2 - (from.top + from.height / 2);
    var s = to.width / from.width;
    if (wrap) wrap.classList.remove('is-in');
    card.style.transition = 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    closeTimer = setTimeout(function () {
      stage.hidden = true;
      stage.innerHTML = '';
      document.body.classList.remove('ach-focus-open');
      closeTimer = 0;
    }, 380);
  }

  function mount(grid, stage) {
    if (!grid || !stage) return;
    grid.innerHTML = CARDS.map(cardHtml).join('');
    grid.querySelectorAll('.ach-card').forEach(function (el) {
      var id = el.getAttribute('data-ach');
      var item = CARDS.filter(function (c) { return c.id === id; })[0];
      resetPointer(el);
      bindCard(el, stage, item);
    });
    if (!stage._bound) {
      stage.addEventListener('click', function () { closeStage(stage); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !stage.hidden) closeStage(stage);
      });
      stage._bound = true;
    }
    var stat = document.getElementById('statAch');
    if (stat) stat.textContent = String(CARDS.length);
  }

  global.RankMeHolo = { mount: mount, CARDS: CARDS };
})(window);
