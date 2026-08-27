/* RankMe battle starfield — quiet depth behind the arena.
   Rollback: drop this file + #battleStars + RankMeStars calls. */
(function () {
  'use strict';

  var canvas, ctx, stars, raf, w, h, dpr;
  var running = false;
  var paused = false;
  var fadeTimer = 0;

  var COLORS = [
    [196, 170, 240],
    [176, 150, 230],
    [214, 186, 248],
    [168, 186, 240]
  ];

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function starCount() {
    var short = Math.min(window.innerWidth, window.innerHeight);
    if (short < 520) return 80;
    if (short < 860) return 140;
    return 220;
  }

  function seed() {
    var n = starCount();
    var out = new Array(n);
    for (var i = 0; i < n; i++) {
      out[i] = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: 0.12 + Math.random() * 0.88,
        s: 0.4 + Math.random() * 1.15,
        tw: Math.random() * Math.PI * 2,
        c: (Math.random() * COLORS.length) | 0
      };
    }
    stars = out;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensure() {
    if (ctx) return;
    canvas = document.getElementById('battleStars');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    seed();
  }

  function tick() {
    if (!running || paused || !ctx) return;
    raf = requestAnimationFrame(tick);

    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.5;
    var cy = h * 0.5;
    var span = Math.max(w, h) * 0.62;

    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      st.z -= 0.00115;
      if (st.z < 0.08) {
        st.z = 1;
        st.x = Math.random() * 2 - 1;
        st.y = Math.random() * 2 - 1;
      }
      var k = span / (st.z * 2.4);
      var px = cx + st.x * k;
      var py = cy + st.y * k;
      if (px < -3 || py < -3 || px > w + 3 || py > h + 3) continue;

      var near = 1 - st.z;
      st.tw += 0.012;
      var tw = 0.72 + 0.28 * Math.sin(st.tw);
      var a = (0.08 + near * 0.32) * tw;
      var r = st.s * (0.45 + near * 1.05);
      var col = COLORS[st.c];
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a.toFixed(3) + ')';
      if (r < 1.15) {
        ctx.fillRect(px, py, 1, 1);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function play() {
    if (running) return;
    running = true;
    paused = document.hidden;
    if (!paused) tick();
  }

  function halt() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function start() {
    if (reduced()) return;
    ensure();
    if (!canvas) return;
    canvas.classList.add('is-on');
    play();
    if (fadeTimer) clearTimeout(fadeTimer);
  }

  function stop() {
    if (!canvas) return;
    canvas.classList.remove('is-on');
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(halt, 700);
  }

  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    if (paused) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (running) {
      tick();
    }
  });

  window.addEventListener('resize', function () {
    if (!ctx) return;
    resize();
    if (stars && Math.abs(stars.length - starCount()) > 40) seed();
  });

  window.RankMeStars = { start: start, stop: stop };
})();
