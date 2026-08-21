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

  /* ---- Community rankings grid (cover + stats + author) ---- */
  function coverForTemplate(tid) {
    var map = {
      'lol': 'assets/brand/LoL_Cover_thumb.webp',
      'sf-duel': 'assets/brand/SF_Cover_1_thumb.webp',
      'sf-duel-ex': 'assets/brand/SFD_EX_Cover_thumb.webp',
      'sf6': 'assets/brand/SF6_Cover_thumb.webp',
      'dota2': 'assets/brand/Dota2_Cover_thumb.webp',
    };
    return map[tid] || 'assets/brand/SF_Cover_1_thumb.webp';
  }

  function titleForTemplate(tid, fallback) {
    var map = {
      'lol': 'League of Legends',
      'sf-duel': 'Street Fighter: Duel',
      'sf-duel-ex': 'SF Duel EX-Move',
      'sf6': 'Street Fighter 6',
      'dota2': 'Dota 2',
    };
    var base = map[tid] || tid || 'Ranking';
    var raw = (fallback && fallback !== 'Untitled') ? String(fallback) : base;
    // Never show trailing " list" (legacy save titles)
    raw = raw.replace(/\s+list$/i, '').trim();
    return raw || base;
  }

  function communityCardHtml(row) {
    var tid = row.template_id || 'sf-duel';
    var cover = coverForTemplate(tid);
    var titleText = titleForTemplate(tid, row.title);
    var title = escapeHtml(titleText);
    var href = 'tier.html?t=' + encodeURIComponent(tid) + '&c=' + encodeURIComponent(String(row.id));
    var ago = typeof timeAgo === 'function'
      ? timeAgo(row.updated_at || row.created_at)
      : fmtDate(row.updated_at || row.created_at);
    var likes = typeof formatCount === 'function' ? formatCount(row.like_count) : String(row.like_count || 0);
    var views = typeof formatCount === 'function' ? formatCount(row.view_count) : String(row.view_count || 0);
    var author = escapeHtml(row.author_name || 'User');
    var av = row.author_avatar
      ? '<img class="cc-av" src="' + escapeHtml(row.author_avatar) + '" alt="">'
      : '<span class="cc-av cc-av-fallback">' + author.charAt(0).toUpperCase() + '</span>';
    var profileHref = row.user_id
      ? 'account.html?u=' + encodeURIComponent(String(row.user_id))
      : '';
    var authorBlock = profileHref
      ? '<a class="cc-author" href="' + profileHref + '" data-profile="1">' + av + '<span class="cc-author-name">' + author + '</span></a>'
      : '<div class="cc-author">' + av + '<span class="cc-author-name">' + author + '</span></div>';
    try {
      if (!window.__rmCommunityRows) window.__rmCommunityRows = {};
      window.__rmCommunityRows[String(row.id)] = row;
    } catch (e) {}
    return (
      '<article class="cc-card" data-href="' + escapeHtml(href) + '" data-cid="' + escapeHtml(String(row.id)) + '" role="link" tabindex="0">' +
        '<div class="cc-cover"><img src="' + escapeHtml(cover) + '" alt="" loading="lazy"></div>' +
        '<div class="cc-body">' +
          '<div class="cc-title"><span class="cc-title-text">' + title + '</span></div>' +
          '<div class="cc-stats">' +
            (ago ? '<span class="cc-ago">' + escapeHtml(ago) + '</span>' : '') +
            '<span class="cc-stat"><img src="assets/icons/heart.svg" alt="">' + likes + '</span>' +
            '<span class="cc-stat"><img src="assets/icons/view.svg" alt="">' + views + '</span>' +
          '</div>' +
          authorBlock +
        '</div>' +
      '</article>'
    );
  }

  function wireCommunityCards(root) {
    if (!root) return;
    root.querySelectorAll('.cc-card[data-cid]').forEach(function (card) {
      function openCard() {
        var cid = card.getAttribute('data-cid');
        var href = card.getAttribute('data-href');
        var row = window.__rmCommunityRows && window.__rmCommunityRows[cid];
        if (row) {
          try {
            sessionStorage.setItem('rankme_community_row', JSON.stringify(row));
            sessionStorage.setItem('rankme_community_id', String(cid));
          } catch (err) {}
        }
        if (href) location.href = href;
      }
      card.addEventListener('click', function (ev) {
        if (ev.target.closest && ev.target.closest('[data-profile]')) return;
        ev.preventDefault();
        openCard();
      });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openCard();
        }
      });
      // Marquee only when title overflows
      var titleEl = card.querySelector('.cc-title');
      var textEl = card.querySelector('.cc-title-text');
      if (titleEl && textEl && textEl.scrollWidth > titleEl.clientWidth + 2) {
        titleEl.classList.add('is-long');
      }
    });
  }

  async function loadCommunity() {
    if (!els.community) return;
    try {
      if (typeof listPublicTierlists !== 'function') throw new Error('no api');
      var rows = await listPublicTierlists(24);
      if (!rows || !rows.length) throw new Error('empty');
      var isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
      var limit = isMobile ? 3 : 6;
      var visible = rows.slice(0, limit);
      var rest = rows.slice(limit);
      var html =
        '<h2 class="community-rankings-title">Community Rankings</h2>' +
        '<div class="community-grid">' + visible.map(communityCardHtml).join('') + '</div>';
      if (rest.length) {
        html +=
          '<button type="button" class="cc-show-all" id="communityShowAll">Show all</button>' +
          '<div class="community-grid community-grid-more" id="communityGridMore" hidden>' +
            rest.map(communityCardHtml).join('') +
          '</div>';
      }
      els.community.innerHTML = html;
      wireCommunityCards(els.community);
      var showBtn = document.getElementById('communityShowAll');
      var more = document.getElementById('communityGridMore');
      if (showBtn && more) {
        showBtn.addEventListener('click', function () {
          more.hidden = false;
          more.removeAttribute('hidden');
          showBtn.hidden = true;
          wireCommunityCards(more);
        });
      }
    } catch (e) {
      els.community.innerHTML =
        '<h2 class="community-rankings-title">Community Rankings</h2>' +
        '<div class="community-empty"><p>No public lists yet</p></div>';
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
