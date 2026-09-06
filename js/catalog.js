/* RankMe catalog — single source for template cover/title.
   New exclusives only need templates/catalog.json. */
(function (global) {
  'use strict';
  var byId = {};
  var pending = null;

  function load() {
    if (pending) return pending;
    pending = fetch('templates/catalog.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : { templates: [] }; })
      .then(function (data) {
        byId = {};
        (data.templates || []).forEach(function (t) {
          if (t && t.id) byId[t.id] = t;
        });
        return data;
      })
      .catch(function () {
        byId = {};
        return { templates: [] };
      });
    return pending;
  }

  function get(id) {
    return byId[id] || null;
  }

  function cover(id) {
    var t = byId[id];
    if (t) return t.coverThumb || t.cover || '';
    return '';
  }

  function title(id, fallback) {
    var t = byId[id];
    var base = (t && t.title) || id || 'Ranking';
    var raw = (fallback && fallback !== 'Untitled') ? String(fallback) : base;
    raw = raw.replace(/\s+list$/i, '').trim();
    return raw || base;
  }

  function revealCovers(root) {
    var scope = root || document;
    var hosts = scope.querySelectorAll('.cover, .cc-cover, .sc-cover');
    for (var i = 0; i < hosts.length; i++) {
      (function (host) {
        var img = host.querySelector('img');
        if (!img || host.classList.contains('is-ready') || host.classList.contains('is-fallback')) return;
        function show() {
          host.classList.remove('skel');
          host.classList.add('is-ready');
        }
        function fail() {
          host.classList.remove('skel');
          host.classList.add('is-fallback');
        }
        if (img.complete) {
          if (img.naturalWidth) show();
          else fail();
          return;
        }
        host.classList.add('skel');
        img.addEventListener('load', show, { once: true });
        img.addEventListener('error', fail, { once: true });
      })(hosts[i]);
    }
  }

  global.RankMeCatalog = { load: load, get: get, cover: cover, title: title, revealCovers: revealCovers };
})(window);
