/* RankMe achievement holo preview — tilt + foil, click to focus.
   Original RankMe effect (not a copy of third-party card CSS). */
(function (global) {
  'use strict';

  var PREVIEW = [
    { title: 'First Ranking', img: 'assets/brand/Skullgirls_Cover_thumb.webp' },
    { title: 'Battle Ready', img: 'assets/brand/LoL_Cover_thumb.webp' },
    { title: 'Street King', img: 'assets/brand/SF_Cover_1_thumb.webp' },
    { title: 'Draft Master', img: 'assets/brand/Dota2_Cover_thumb.webp' },
    { title: 'World Warrior', img: 'assets/brand/SF6_Cover_thumb.webp' },
    { title: 'EX Collector', img: 'assets/brand/SFD_EX_Cover_thumb.webp' }
  ];

  function setPointer(el, e) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    el.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(2) + '%');
    el.style.setProperty('--rx', ((x - 0.5) * 36).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((0.5 - y) * 24).toFixed(2) + 'deg');
  }

  function resetPointer(el) {
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  function cardHtml(item) {
    return (
      '<button type="button" class="ach-card" aria-label="' + item.title + '">' +
        '<span class="ach-card-face">' +
          '<img class="ach-art" src="' + item.img + '" alt="">' +
          '<span class="ach-foil" aria-hidden="true"></span>' +
          '<span class="ach-glare" aria-hidden="true"></span>' +
          '<span class="ach-meta">' + item.title + '</span>' +
        '</span>' +
      '</button>'
    );
  }

  function bindCard(el, stage) {
    el.addEventListener('pointermove', function (e) { setPointer(el, e); });
    el.addEventListener('pointerleave', function () { resetPointer(el); });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openStage(el, stage);
    });
  }

  function openStage(source, stage) {
    stage.innerHTML = source.outerHTML;
    var clone = stage.querySelector('.ach-card');
    clone.classList.add('is-focus');
    resetPointer(clone);
    clone.addEventListener('pointermove', function (e) { setPointer(clone, e); });
    clone.addEventListener('pointerleave', function () { resetPointer(clone); });
    clone.addEventListener('click', function (e) {
      e.stopPropagation();
      closeStage(stage);
    });
    stage.hidden = false;
    document.body.classList.add('ach-focus-open');
  }

  function closeStage(stage) {
    stage.hidden = true;
    stage.innerHTML = '';
    document.body.classList.remove('ach-focus-open');
  }

  function mount(grid, stage) {
    if (!grid || !stage) return;
    grid.innerHTML = PREVIEW.map(cardHtml).join('');
    grid.querySelectorAll('.ach-card').forEach(function (el) {
      resetPointer(el);
      bindCard(el, stage);
    });
    stage.addEventListener('click', function () { closeStage(stage); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !stage.hidden) closeStage(stage);
    });
  }

  global.RankMeHolo = { mount: mount };
})(window);
