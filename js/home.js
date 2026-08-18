/* RankMe - Homepage discovery engine
   Loads templates/catalog.json, then powers search + category filter + sort
   for the template grid, and (best-effort) surfaces real public community
   activity from Supabase. No numbers are ever fabricated: if we don't have
   real data for a stat, we simply don't render that stat.
*/
(function () {
  'use strict';

  var state = {
    all: [],
    categoryMeta: {},
    category: 'all',
    query: '',
    sort: 'newest',
  };

  var els = {};

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function fmtDate(d) {
    try {
      var date = new Date(d);
      if (isNaN(date.getTime())) return '';
      var days = Math.floor((Date.now() - date.getTime()) / 86400000);
      if (days <= 0) return 'today';
      if (days === 1) return '1 day ago';
      if (days < 30) return days + ' days ago';
      var months = Math.floor(days / 30);
      if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
      var years = Math.floor(months / 12);
      return years + (years === 1 ? ' year ago' : ' years ago');
    } catch (e) { return ''; }
  }

  function matchesQuery(t, q) {
    if (!q) return true;
    var raw = q.toLowerCase().trim();
    var tokens = raw.split(/\s+/).filter(Boolean);
    // expand short aliases
    var expand = { sf: 'street fighter', lol: 'league of legends', ex: 'ex-move' };
    tokens = tokens.map(function (tok) { return expand[tok] || tok; });
    var hay = [t.title, t.description, t.category, t.id].concat(t.tags || []).join(' ').toLowerCase();
    // each token must match (AND); also accept original raw substring
    if (hay.indexOf(raw) !== -1) return true;
    return tokens.every(function (tok) { return hay.indexOf(tok) !== -1; });
  }

  function computeCategoryCounts(items) {
    var counts = {};
    items.forEach(function (t) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }

  function sortItems(items, sort) {
    var arr = items.slice();
    switch (sort) {
      case 'alphabetical':
        arr.sort(function (a, b) { return a.title.localeCompare(b.title); });
        break;
      case 'newest':
        arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        break;
      case 'items':
      case 'popular':
        arr.sort(function (a, b) {
          var ua = a.useCount || 0, ub = b.useCount || 0;
          if (ub !== ua) return ub - ua;
          return (b.itemCount || 0) - (a.itemCount || 0);
        });
        break;
      case 'featured':
      default:
        arr.sort(function (a, b) {
          var fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
          if (fb !== fa) return fb - fa;
          var ua = a.useCount || 0, ub = b.useCount || 0;
          if (ub !== ua) return ub - ua;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
    }
    return arr;
  }

  function renderCategoryChips() {
    var counts = computeCategoryCounts(state.all);
    var order = ['games','anime','movies','tv','sports','music','memes','technology','other'];
    var html = '';
    html += chipHtml('all', 'All', state.all.length);
    order.forEach(function (cat) {
      var meta = state.categoryMeta[cat] || { label: cat };
      var n = counts[cat] || 0;
      html += chipHtml(cat, meta.label || cat, n);
    });
    els.chips.innerHTML = html;
    els.chips.querySelectorAll('.cat-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.category = btn.getAttribute('data-cat');
        renderCategoryChips();
        renderGrid();
      });
    });
  }

  function chipHtml(cat, label, count) {
    var active = state.category === cat ? ' active' : '';
    return '<button type="button" class="cat-chip' + active + '" data-cat="' + escapeHtml(cat) + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<span class="cnt">' + count + '</span></button>';
  }

  function cardHtml(t) {
    var meta = state.categoryMeta[t.category] || { label: t.category || 'Other' };
    var exclusiveTag = t.exclusive ? '<span class="tag">Exclusive</span>' : '';
    var catTag = t.category ? '<span class="tag tag-cat" data-cat="' + escapeHtml(t.category) + '">' + escapeHtml(meta.label || t.category) + '</span>' : '';
    var epicClass = t.parallax ? ' epic' : '';
    var uses = t.useCount || 0;
    var metaLine = (t.itemCount ? t.itemCount + ' ' + (t.itemLabel || 'items') : '');
    if (uses > 0) metaLine = (metaLine ? metaLine + ' · ' : '') + uses + ' used';
    return (
      '<div class="tl-card exclusive' + epicClass + '" data-id="' + escapeHtml(t.id) + '">' +
        '<a class="cover" href="' + escapeHtml(t.href) + '" data-stash="' + escapeHtml(t.id) + '">' +
          exclusiveTag + catTag +
          '<img class="cover-art" src="' + escapeHtml(t.coverThumb || t.cover) + '" alt="' + escapeHtml(t.title) + '" loading="lazy">' +
        '</a>' +
        '<div class="body">' +
          '<a class="title" href="' + escapeHtml(t.href) + '" data-stash="' + escapeHtml(t.id) + '">' + escapeHtml(t.title) + '</a>' +
          '<div class="meta">' + escapeHtml(metaLine) + '</div>' +
          '<div class="card-actions">' +
            '<a class="btn-mini primary" href="' + escapeHtml(t.href) + '" data-stash="' + escapeHtml(t.id) + '">Open</a>' +
            '<a class="btn-mini open-outline" href="battle.html?t=' + encodeURIComponent(t.id) + '" data-stash="' + escapeHtml(t.id) + '">Battle Mode</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderGrid() {
    var q = state.query.trim().toLowerCase();
    var filtered = state.all.filter(function (t) {
      var inCat = state.category === 'all' || t.category === state.category;
      return inCat && matchesQuery(t, q);
    });
    var sorted = sortItems(filtered, state.sort);

    els.meta.innerHTML = '<b>' + sorted.length + '</b>'
      + (q ? ' "' + escapeHtml(state.query.trim()) + '"' : '')
      + (state.category !== 'all' ? ' in ' + escapeHtml((state.categoryMeta[state.category] || {}).label || state.category) : '');

    if (!sorted.length) {
      els.grid.removeAttribute('aria-busy');
      els.grid.innerHTML =
        '<div class="no-results">' +
          '<div class="big">🔍</div>' +
          '<div>No results</div>' +
          '<button type="button" class="reset-link" id="resetFilters">Clear</button>' +
        '</div>';
      var reset = document.getElementById('resetFilters');
      if (reset) reset.addEventListener('click', function () {
        state.query = '';
        state.category = 'all';
        els.search.value = '';
        els.clearBtn.hidden = true;
        renderCategoryChips();
        renderGrid();
      });
      return;
    }

    var ROW_LIMIT = (window.matchMedia && window.matchMedia('(max-width: 720px)').matches) ? 3 : 6;
    var showAll = !!window.__rankmeShowAllTemplates;
    var visible = (showAll || sorted.length <= ROW_LIMIT) ? sorted : sorted.slice(0, ROW_LIMIT);
    var html = visible.map(cardHtml).join('');
    if (!showAll && sorted.length > ROW_LIMIT) {
      html +=
        '<div class="show-all-wrap">' +
          '<button type="button" class="show-all-btn" id="showAllTemplates">Show all · ' + sorted.length + '</button>' +
        '</div>';
    }
    els.grid.innerHTML = html;
    els.grid.removeAttribute('aria-busy');
    var sab = document.getElementById('showAllTemplates');
    if (sab) {
      sab.addEventListener('click', function () {
        window.__rankmeShowAllTemplates = true;
        renderGrid();
      });
    }
    bindCardStashAndParallax();
  }

  function bindCardStashAndParallax() {
    els.grid.querySelectorAll('[data-stash]').forEach(function (a) {
      a.addEventListener('click', function () {
        try { sessionStorage.setItem('rankme_t', a.getAttribute('data-stash')); } catch (e) {}
      });
    });
    els.grid.querySelectorAll('.tl-card.epic .cover').forEach(function (host) {
      var img = host.querySelector('img.cover-art');
      if (!img) return;
      var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, max = 6;
      function tick() {
        cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
        img.style.transform = 'scale(1.06) translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
        if (Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04) raf = requestAnimationFrame(tick); else raf = 0;
      }
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        tx = -((e.clientX - r.left) / r.width - 0.5) * max * 2;
        ty = -((e.clientY - r.top) / r.height - 0.5) * max * 2;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      host.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
  }

  /* ---- Community: best-effort, real data only, graceful no-op if unavailable ---- */
  function communityItemHtml(row, templateById) {
    var tpl = templateById[row.template_id];
    var title = escapeHtml((row.title && row.title !== 'Untitled') ? row.title : (tpl ? tpl.title : 'Ranking'));
    var cover = tpl ? tpl.cover : 'assets/brand/favicon.svg';
    var href = tpl ? tpl.href : '#';
    var when = escapeHtml(fmtDate(row.updated_at || row.created_at));
    return (
      '<a class="community-item" href="' + escapeHtml(href) + '">' +
        '<img src="' + escapeHtml(cover) + '" alt="">' +
        '<div><div class="ci-title">' + title + '</div><div class="ci-meta">' + when + '</div></div>' +
      '</a>'
    );
  }

  async function loadCommunity() {
    if (!els.community) return;
    try {
      if (typeof listPublicTierlists !== 'function') throw new Error('no api');
      var rows = await listPublicTierlists(12);
      if (!rows || !rows.length) throw new Error('empty');
      var ids = rows.map(function (r) { return r.id; });
      var liked = new Set();
      try {
        if (typeof getMyLikedIds === 'function') liked = await getMyLikedIds(ids);
      } catch (e) {}
      els.community.innerHTML = '<div class="community-list">' + rows.map(function (r) {
        var tid = r.template_id || 'sf-duel';
        var href = 'tier.html?t=' + encodeURIComponent(tid);
        var when = r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '';
        var lc = r.like_count || 0;
        var isLiked = liked.has(String(r.id));
        return '<div class="community-item" data-id="' + escapeHtml(String(r.id)) + '">' +
          '<a class="ci-main" href="' + href + '">' +
            '<div class="ci-title">' + escapeHtml(r.title || 'Untitled') + '</div>' +
            '<div class="ci-meta">' + escapeHtml(tid) + (when ? ' · ' + when : '') + '</div>' +
          '</a>' +
          '<button type="button" class="heart-btn' + (isLiked ? ' on' : '') + '" data-like="' + escapeHtml(String(r.id)) + '" aria-label="Like">' +
            '<span class="heart-ico">' + (isLiked ? '♥' : '♡') + '</span>' +
            '<span class="heart-n">' + lc + '</span>' +
          '</button>' +
          '</div>';
      }).join('') + '</div>';
      els.community.querySelectorAll('[data-like]').forEach(function (btn) {
        btn.addEventListener('click', async function (e) {
          e.preventDefault();
          e.stopPropagation();
          try {
            if (typeof toggleTierlistLike !== 'function') return;
            var res = await toggleTierlistLike(btn.getAttribute('data-like'));
            btn.classList.toggle('on', !!res.liked);
            btn.querySelector('.heart-ico').textContent = res.liked ? '♥' : '♡';
            btn.querySelector('.heart-n').textContent = String(res.like_count || 0);
          } catch (err) {
            if (String(err.message || err).indexOf('Login') >= 0) {
              location.href = 'account.html';
            }
          }
        });
      });
    } catch (e) {
      els.community.innerHTML =
        '<div class="community-empty">' +
          '<p>No public lists yet</p>' +
        '</div>';
    }
  }

  function init(catalog) {
    state.all = catalog.templates || [];
    state.categoryMeta = catalog.categoryMeta || {};

    els.search = document.getElementById('homeSearch');
    els.clearBtn = document.getElementById('homeSearchClear');
    els.chips = document.getElementById('categoryChips');
    els.dd = document.getElementById('sortDd');
    els.ddTrigger = document.getElementById('sortDdTrigger');
    els.ddLabel = document.getElementById('sortDdLabel');
    els.ddMenu = document.getElementById('sortDdMenu');
    els.grid = document.getElementById('discoverGrid');
    els.meta = document.getElementById('resultsMeta');
    els.community = document.getElementById('communityBody');

    if (!els.grid) return; // not on homepage

    state.sort = 'featured';

    var onSearch = debounce(function () {
      state.query = els.search.value;
      els.clearBtn.hidden = !state.query;
      renderGrid();
    }, 120);
    els.search.addEventListener('input', onSearch);
    els.clearBtn.addEventListener('click', function () {
      els.search.value = '';
      state.query = '';
      els.clearBtn.hidden = true;
      els.search.focus();
      renderGrid();
    });

    function closeDd() {
      els.dd.classList.remove('open');
      els.ddTrigger.setAttribute('aria-expanded', 'false');
    }
    function openDd() {
      els.dd.classList.add('open');
      els.ddTrigger.setAttribute('aria-expanded', 'true');
    }
    els.ddTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (els.dd.classList.contains('open')) closeDd(); else openDd();
    });
    els.ddMenu.querySelectorAll('li').forEach(function (li) {
      li.addEventListener('click', function () {
        state.sort = li.getAttribute('data-value');
        els.ddLabel.textContent = li.textContent;
        els.ddMenu.querySelectorAll('li').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        li.setAttribute('aria-selected', 'true');
        closeDd();
        renderGrid();
      });
    });
    document.addEventListener('click', function (e) {
      if (!els.dd.contains(e.target)) closeDd();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDd();
    });

    renderCategoryChips();
    renderGrid();
    loadCommunity();
  }

  function mergeUseCounts(catalog, stats) {
    (catalog.templates || []).forEach(function (t) {
      var s = stats[t.id];
      t.useCount = s ? (s.uses || 0) : 0;
    });
    return catalog;
  }

  fetch('templates/catalog.json')
    .then(function (r) { return r.json(); })
    .then(async function (catalog) {
      var stats = {};
      try { if (typeof fetchTemplateStats === 'function') stats = await fetchTemplateStats(); } catch (e) {}
      init(mergeUseCounts(catalog, stats));
    })
    .catch(function (e) {
      console.error('Failed to load catalog', e);
      var grid = document.getElementById('discoverGrid');
      if (grid) grid.innerHTML = '<div class="no-results"><div class="big">⚠️</div><div>Could not load templates. Please refresh.</div></div>';
    });
})();
