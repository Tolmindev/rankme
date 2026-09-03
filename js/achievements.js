/* RankMe achievements — catalog, unlocks, toast.
   New card = templates/achievements.json + art. New trigger = one call here. */
(function (global) {
  'use strict';

  var FALLBACK = [
    {
      id: 'not-an-alien',
      title: 'Not An Alien',
      desc: "You're in. Welcome to RankMe - make yourself at home.",
      img: 'assets/achievements/achiev_1.webp',
      unlock: 'login'
    },
    {
      id: 'certified-sheep',
      title: 'Certified Sheep',
      desc: 'Published your first tier list. Welcome to the club.',
      img: 'assets/achievements/achiev_2.webp',
      unlock: 'first-publish'
    },
    {
      id: 'main-character',
      title: 'Main Character',
      desc: 'The community actually listens to this person. For some reason.',
      img: 'assets/achievements/achiev_3.webp',
      unlock: 'expert'
    }
  ];

  var catalog = FALLBACK.slice();
  var pending = null;
  var toastQueue = [];
  var toastTimer = 0;
  var toastBusy = false;
  var toastShowing = null;
  var TOAST_MS = 4200;
  var TOAST_GAP = 420;

  function load() {
    if (pending) return pending;
    pending = fetch('templates/achievements.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : { achievements: FALLBACK }; })
      .then(function (data) {
        var list = data && data.achievements;
        if (Array.isArray(list) && list.length) catalog = list;
        return catalog;
      })
      .catch(function () {
        catalog = FALLBACK.slice();
        return catalog;
      });
    return pending;
  }

  function byId(id) {
    for (var i = 0; i < catalog.length; i++) if (catalog[i].id === id) return catalog[i];
    return null;
  }

  function uniqueIds(list) {
    var out = [];
    (list || []).forEach(function (id) {
      if (id && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }

  function loginIds() {
    return catalog.filter(function (c) { return c.unlock === 'login'; }).map(function (c) { return c.id; });
  }

  function publishIds() {
    return catalog.filter(function (c) { return c.unlock === 'first-publish'; }).map(function (c) { return c.id; });
  }

  function expertIds() {
    return catalog.filter(function (c) { return c.unlock === 'expert'; }).map(function (c) { return c.id; });
  }

  function storageKey(user) {
    return user && user.id ? ('rankme_ach_' + user.id) : 'rankme_ach';
  }

  function readLocal(user) {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey(user)) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(user, ids) {
    try { localStorage.setItem(storageKey(user), JSON.stringify(ids)); } catch (e) {}
  }

  function read(user) {
    var ids = loginIds();
    if (!user) return uniqueIds(ids);
    var meta = user.user_metadata && user.user_metadata.ach;
    if (!Array.isArray(meta)) meta = [];
    return uniqueIds(ids.concat(meta, readLocal(user)));
  }

  async function persist(user, ids) {
    writeLocal(user, ids);
    if (user) {
      user.user_metadata = user.user_metadata || {};
      user.user_metadata.ach = ids;
    }
    if (typeof initSupabase !== 'function') return;
    try {
      var client = await initSupabase();
      if (!client) return;
      await client.auth.updateUser({ data: { ach: ids } });
    } catch (e) {}
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(item) {
    if (!item || !item.id) return;
    if (toastShowing && toastShowing.id === item.id) return;
    for (var i = 0; i < toastQueue.length; i++) {
      if (toastQueue[i].id === item.id) return;
    }
    toastQueue.push(item);
    playToastQueue();
  }

  function playToastQueue() {
    if (toastBusy) return;
    var item = toastQueue.shift();
    if (!item) {
      toastShowing = null;
      return;
    }
    toastBusy = true;
    toastShowing = item;
    var el = document.getElementById('achToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'achToast';
      el.className = 'ach-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<img src="' + item.img + '" alt="">' +
      '<div class="ach-toast-copy">' +
        '<b>' + esc(item.title) + '</b>' +
        '<span>' + esc(item.desc) + '</span>' +
      '</div>';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
      toastTimer = setTimeout(function () {
        toastBusy = false;
        toastShowing = null;
        playToastQueue();
      }, TOAST_GAP);
    }, TOAST_MS);
  }

  async function grant(user, id, opts) {
    opts = opts || {};
    if (!user || !byId(id)) return false;
    var ids = read(user);
    if (ids.indexOf(id) >= 0) return false;
    ids = uniqueIds(ids.concat([id]));
    await persist(user, ids);
    if (opts.toast) toast(byId(id));
    return true;
  }

  async function grantMany(user, ids, opts) {
    var any = false;
    var show = !!(opts && opts.toast);
    for (var i = 0; i < ids.length; i++) {
      var fresh = await grant(user, ids[i], { toast: show });
      if (fresh) any = true;
    }
    return any;
  }

  async function onLogin(user) {
    return grantMany(user, loginIds(), { toast: true });
  }

  async function onPublish(user, opts) {
    return grantMany(user, publishIds(), { toast: !!(opts && opts.toast) });
  }

  async function sync(user) {
    if (!user) return;
    await onLogin(user);
    if (typeof getMyExpertRequest !== 'function') return;
    try {
      var req = await getMyExpertRequest();
      if (req && req.status === 'approved') {
        await grantMany(user, expertIds(), { toast: true });
      }
    } catch (e) {}
  }

  function itemsFor(ids) {
    var map = {};
    ids.forEach(function (id) { map[id] = true; });
    return catalog.filter(function (c) { return map[c.id]; });
  }

  function paint(user, extraIds) {
    var ids = read(user);
    (extraIds || []).forEach(function (id) {
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    var items = itemsFor(ids);
    var grid = document.getElementById('achGrid');
    var stage = document.getElementById('achStage');
    if (window.RankMeHolo) RankMeHolo.mount(grid, stage, items);
    var stat = document.getElementById('statAch');
    if (stat) stat.textContent = String(items.length);
  }

  global.RankMeAch = {
    load: load,
    read: read,
    grant: grant,
    onLogin: onLogin,
    onPublish: onPublish,
    sync: sync,
    paint: paint,
    toast: toast
  };
})(window);
