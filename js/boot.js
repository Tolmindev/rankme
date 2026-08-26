/* RankMe boot - resolve template id, load templates/{id}.json, then app.js */
(function () {
  function fail(msg) {
    try { document.body.classList.remove('booting'); } catch (e) {}
    const status = document.getElementById('bootStatus');
    if (status) {
      status.className = 'boot-error';
      status.hidden = false;
      status.removeAttribute('hidden');
      status.innerHTML =
        (msg || 'Failed to load') +
        '<br><br><a href="index.html" style="color:#e6a9e8">Back to RankMe</a>';
    }
  }

  function resolveId() {
    // 1) explicit id from thin page: <script>window.RANKME_TEMPLATE_ID='lol'</script>
    if (typeof window.RANKME_TEMPLATE_ID === 'string' && window.RANKME_TEMPLATE_ID.trim()) {
      return window.RANKME_TEMPLATE_ID.trim();
    }
    // 2) query ?t=
    try {
      const p = new URLSearchParams(location.search);
      const q = (p.get('t') || '').trim();
      if (q) return q;
    } catch (e) {}
    // 3) hash #t=lol or #lol
    try {
      const h = (location.hash || '').replace(/^#/, '');
      if (h.indexOf('t=') === 0) return decodeURIComponent(h.slice(2).split('&')[0]);
      if (/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(h) && h.indexOf('eyJ') !== 0 && h[0] !== 'z') {
        return h;
      }
    } catch (e) {}
    // 4) sessionStorage fallback (index can set before navigate if server strips query)
    try {
      const s = sessionStorage.getItem('rankme_t');
      if (s) {
        sessionStorage.removeItem('rankme_t');
        return s.trim();
      }
    } catch (e) {}
    return '';
  }

  const id = resolveId();
  if (!id) {
    fail('No template selected. Open from Browse or use tier.html?t=your-id');
    return;
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(id)) {
    fail('Invalid template id');
    return;
  }

  // Keep ?t= in the address bar (helps share + reload)
  try {
    const u = new URL(location.href);
    if (u.searchParams.get('t') !== id) {
      u.searchParams.set('t', id);
      history.replaceState(null, '', u.pathname + '?' + u.searchParams.toString() + u.hash);
    }
  } catch (e) {}

  const status = document.getElementById('bootStatus');

  function setMeta(sel, attr, val) {
    const el = document.getElementById(sel) || document.querySelector(sel);
    if (el && val) el.setAttribute(attr, val);
  }

  function applyHero(t) {
    document.title = (t.title || 'Tier List') + ' - RankMe';
    setMeta('metaOgTitle', 'content', (t.title || 'Tier List') + ' - RankMe');
    setMeta('metaOgDesc', 'content', t.description || 'Drag, rank, share on RankMe.');
    const coverAbs = t.cover ? 'https://rankme.lol/' + t.cover.replace(/^\//, '') : '';
    if (coverAbs) {
      setMeta('metaOgImage', 'content', coverAbs);
      setMeta('metaTwImage', 'content', coverAbs);
    }

    const img = document.getElementById('coverImg');
    const host = document.getElementById('coverHost');
    if (img && t.cover) {
      img.src = t.cover;
      img.alt = t.title || '';
    }
    const titleEl = document.getElementById('heroTitle');
    if (titleEl) titleEl.textContent = t.title || '';
    const desc = document.getElementById('heroDesc');
    if (desc) desc.textContent = t.description || '';

    const block = document.getElementById('expertsBlock');
    const strip = document.getElementById('expertsStrip');
    if (block && strip && Array.isArray(t.experts) && t.experts.length) {
      strip.innerHTML = '';
      t.experts.forEach((ex) => {
        if (!ex || !ex.name) return;
        const card = document.createElement('div');
        card.className = 'expert-card';
        const name = document.createElement('a');
        name.className = 'expert-name';
        name.textContent = ex.name;
        name.href =
          'tier.html?t=' +
          encodeURIComponent(t.id) +
          (ex.id ? '&e=' + encodeURIComponent(ex.id) : '');
        if (ex.id) name.dataset.expertId = ex.id;
        card.appendChild(name);
        if (ex.youtube) {
          const yt = document.createElement('a');
          yt.className = 'expert-yt';
          yt.href = ex.youtube;
          yt.target = '_blank';
          yt.rel = 'noopener';
          yt.title = 'YouTube ' + ex.name;
          yt.innerHTML =
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"/></svg>';
          card.appendChild(yt);
        }
        strip.appendChild(card);
      });
      block.hidden = false;
    }

    const isMobile =
      window.matchMedia && window.matchMedia('(max-width: 720px), (hover: none)').matches;
    if (!isMobile && t.parallax !== false && host && img) {
      const max = 12;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'scale(1.08) translate(' + px * max + 'px,' + py * max + 'px)';
      });
      host.addEventListener('pointerleave', () => {
        img.style.transform = 'scale(1.08)';
      });
    } else if (img) {
      img.style.transform = 'scale(1.08)';
    }
  }

  function showApp() {
    try { document.body.classList.remove('booting'); } catch (e) {}
    if (status) {
      status.remove();
    }
    ['heroSection', 'board', 'toolbar', 'poolWrap'].forEach((hid) => {
      const el = document.getElementById(hid);
      if (el) {
        el.hidden = false;
        el.removeAttribute('hidden');
      }
    });
  }

  fetch('templates/' + id + '.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('Template not found: ' + id);
      return r.json();
    })
    .then((t) => {
      if (!t || !t.id) throw new Error('Bad template');
      window.RANKME_TEMPLATE = t;
      if (Array.isArray(t.experts)) {
        window.RANKME_EXPERT_PRESETS = window.RANKME_EXPERT_PRESETS || {};
        t.experts.forEach((ex) => {
          if (ex && ex.id && ex.preset) window.RANKME_EXPERT_PRESETS[ex.id] = ex.preset;
        });
      }
      applyHero(t);
      showApp();
      const s = document.createElement('script');
      s.src = 'js/app.js?v=20260827c';
      s.onerror = () => fail('Failed to load app.js');
      document.body.appendChild(s);
    })
    .catch((err) => {
      console.error(err);
      fail(err.message || 'Load error');
    });
})();
