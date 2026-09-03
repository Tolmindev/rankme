/* RankMe achievement cards — tilt + focus zoom. No unlock logic. */
(function (global) {
  'use strict';

  var closeTimer = 0;

  function setPointer(el, e) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    el.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    el.style.setProperty('--rx', ((x - 0.5) * 28).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((0.5 - y) * 20).toFixed(2) + 'deg');
  }

  function resetPointer(el) {
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cardHtml(item) {
    var rare = item && item.rarity === 'legendary' ? ' is-legendary' : '';
    return (
      '<button type="button" class="ach-card' + rare + '" data-ach="' + esc(item.id) + '" aria-label="' + esc(item.title) + '">' +
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

  function mount(grid, stage, items) {
    if (!grid || !stage) return;
    var show = items || [];
    grid.innerHTML = show.map(cardHtml).join('');
    grid.querySelectorAll('.ach-card').forEach(function (el) {
      var id = el.getAttribute('data-ach');
      var item = null;
      for (var i = 0; i < show.length; i++) if (show[i].id === id) { item = show[i]; break; }
      resetPointer(el);
      if (item) bindCard(el, stage, item);
    });
    if (!stage._bound) {
      stage.addEventListener('click', function () { closeStage(stage); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !stage.hidden) closeStage(stage);
      });
      stage._bound = true;
    }
  }

  global.RankMeHolo = { mount: mount };
})(window);
