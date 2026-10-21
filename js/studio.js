/* RankMe studio. Official templates. Owner only. */
(function () {
  'use strict';

  var CATS = ['games', 'anime', 'movies', 'tv', 'sports', 'music', 'memes', 'technology', 'other'];
  var root = document.getElementById('studio');
  var msg = document.getElementById('studioMsg');

  function say(text, bad) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.classList.toggle('is-bad', !!bad);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
  }

  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  }

  function fileSlug(name) {
    return String(name || '').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'card';
  }

  function pretty(name) {
    var s = String(name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s.slice(0, 48);
  }

  function toWebp(file, maxW) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, maxW / img.width);
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) {
          if (!blob) reject(new Error('Could not encode image'));
          else resolve(blob);
        }, 'image/webp', 0.82);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image'));
      };
      img.src = url;
    });
  }

  async function upload(client, path, blob) {
    var res = await client.storage.from('studio').upload(path, blob, {
      contentType: 'image/webp',
      upsert: true
    });
    if (res.error) throw new Error(res.error.message || 'Upload failed');
    return client.storage.from('studio').getPublicUrl(path).data.publicUrl;
  }

  function paintLocked(html) {
    root.innerHTML = html;
  }

  async function signIn() {
    var client = await initSupabase();
    if (!client) throw new Error('Could not reach server');
    var res = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
    if (res.error) throw new Error(res.error.message || 'Log in failed');
  }

  var previewUrls = [];
  var modal = document.getElementById('studioModal');

  function closeModal() {
    if (modal) modal.hidden = true;
  }

  function openModal(title, body, actions) {
    document.getElementById('studioModalTitle').textContent = title;
    document.getElementById('studioModalBody').innerHTML = body;
    var bar = document.getElementById('studioModalActions');
    bar.innerHTML = actions;
    modal.hidden = false;
    bar.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.act === 'close') closeModal();
      });
    });
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  function revokePreview() {
    previewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    previewUrls = [];
  }

  function catButtons() {
    return CATS.map(function (c, i) {
      var label = c.charAt(0).toUpperCase() + c.slice(1);
      return '<button type="button" data-cat="' + c + '"' + (i === 0 ? ' class="is-on"' : '') + '>' + label + '</button>';
    }).join('');
  }

  function itemCard(row) {
    var live = row.status !== 'draft';
    var thumb = row.cover_thumb_url || row.cover_url || '';
    return '<article class="studio-item">' +
      (thumb ? '<img src="' + esc(thumb) + '" alt="">' : '<img alt="">') +
      '<div><strong>' + esc(row.title) + '</strong>' +
      '<em>' + (row.item_count || 0) + ' ' + esc(row.item_label || 'items') + '</em>' +
      '<div class="studio-item-actions">' +
        '<button type="button" class="studio-mini" data-look="' + esc(row.id) + '">Preview</button>' +
        (live ? '<a class="studio-mini" href="play.html?t=' + encodeURIComponent(row.id) + '">Open</a>' : '<button type="button" class="studio-mini" data-ship="' + esc(row.id) + '">Publish</button>') +
        '<button type="button" class="studio-mini is-danger" data-del="' + esc(row.id) + '" data-name="' + esc(row.title) + '">Delete</button>' +
      '</div></div></article>';
  }

  function paintForm(rows) {
    revokePreview();
    var drafts = rows.filter(function (r) { return r.status === 'draft'; });
    var live = rows.filter(function (r) { return r.status !== 'draft'; });
    root.innerHTML =
      '<form class="studio-form" id="studioForm">' +
        '<label>Title<input id="studioTitle" maxlength="80"></label>' +
        '<label>Description<textarea id="studioDesc" maxlength="240" rows="3"></textarea></label>' +
        '<div class="studio-row">' +
          '<div class="studio-field">Category<div class="studio-pills" id="studioCat">' + catButtons() + '</div></div>' +
          '<label>Item label<input id="studioLabel" maxlength="24" value="items"></label>' +
        '</div>' +
        '<div class="studio-field">Cover<div class="studio-file"><button type="button" id="studioCoverBtn">Choose cover</button><span id="studioCoverName">None yet</span><input id="studioCover" type="file" accept="image/*" hidden></div></div>' +
        '<div class="studio-field">Cards<div class="studio-file"><button type="button" id="studioCardsBtn">Choose cards</button><span id="studioCardsName">None yet</span><input id="studioCards" type="file" accept="image/*" multiple hidden></div></div>' +
        '<div class="studio-preview" id="studioPreview" hidden></div>' +
        '<div class="studio-actions">' +
          '<button type="button" class="studio-ghost" id="studioDraft">Save draft</button>' +
          '<button type="button" class="show-all-btn" id="studioPublish">Publish</button>' +
        '</div>' +
      '</form>' +
      '<h2>Drafts</h2>' +
      (drafts.length ? '<div class="studio-grid">' + drafts.map(itemCard).join('') + '</div>' : '<p class="lead">No drafts.</p>') +
      '<h2>Live</h2>' +
      (live.length ? '<div class="studio-grid">' + live.map(itemCard).join('') + '</div>' : '<p class="lead">Nothing public yet.</p>');
    wireForm();
    root.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () { askDelete(btn); });
    });
    root.querySelectorAll('[data-look]').forEach(function (btn) {
      btn.addEventListener('click', function () { look(btn.getAttribute('data-look')); });
    });
    root.querySelectorAll('[data-ship]').forEach(function (btn) {
      btn.addEventListener('click', function () { ship(btn.getAttribute('data-ship')); });
    });
  }

  function wireForm() {
    var cover = document.getElementById('studioCover');
    var cards = document.getElementById('studioCards');
    document.getElementById('studioCoverBtn').addEventListener('click', function () { cover.click(); });
    document.getElementById('studioCardsBtn').addEventListener('click', function () { cards.click(); });
    cover.addEventListener('change', refreshPreview);
    cards.addEventListener('change', refreshPreview);
    document.getElementById('studioCat').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;
      document.querySelectorAll('#studioCat button').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
    });
    document.getElementById('studioDraft').addEventListener('click', function () { save('draft', this); });
    document.getElementById('studioPublish').addEventListener('click', function () { save('live', this); });
  }

  function refreshPreview() {
    var cover = document.getElementById('studioCover').files[0];
    var files = Array.prototype.slice.call(document.getElementById('studioCards').files || []);
    document.getElementById('studioCoverName').textContent = cover ? cover.name : 'None yet';
    document.getElementById('studioCardsName').textContent = files.length ? files.length + ' cards' : 'None yet';
    revokePreview();
    var box = document.getElementById('studioPreview');
    if (!cover && !files.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    var html = '';
    if (cover) {
      var curl = URL.createObjectURL(cover);
      previewUrls.push(curl);
      html += '<img class="cover" src="' + curl + '" alt="">';
    }
    if (files.length) {
      html += '<div class="studio-cards">' + files.map(function (file) {
        var url = URL.createObjectURL(file);
        previewUrls.push(url);
        return '<figure><img src="' + url + '" alt=""><figcaption>' + esc(pretty(file.name)) + '</figcaption></figure>';
      }).join('') + '</div>';
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  function askDelete(btn) {
    var id = btn.getAttribute('data-del');
    var name = btn.getAttribute('data-name') || 'this list';
    openModal('Delete ' + name + '?', '<p>This removes the list. A live one leaves the homepage.</p>',
      '<button type="button" class="studio-ghost" data-act="close">Keep</button><button type="button" class="show-all-btn" id="studioDoDelete">Delete</button>');
    document.getElementById('studioDoDelete').addEventListener('click', function () { removeList(id); });
  }

  async function removeList(id) {
    closeModal();
    say('Removing…');
    var client = await initSupabase();
    try {
      var listed = await client.storage.from('studio').list(id);
      var paths = (listed.data || []).map(function (f) { return id + '/' + f.name; });
      if (paths.length) await client.storage.from('studio').remove(paths);
    } catch (e) {}
    var res = await client.from('studio_templates').delete().eq('id', id);
    if (res.error) {
      say(res.error.message || 'Could not delete', true);
      return;
    }
    say('Removed.');
    boot();
  }

  async function look(id) {
    say('Opening preview…');
    var t = await getStudioTemplate(id);
    if (!t) return say('Could not open preview', true);
    var cards = (t.cards || []).map(function (card) {
      var src = (t.cardPath || '') + card.file;
      return '<figure><img src="' + esc(src) + '" alt=""><figcaption>' + esc(card.name || '') + '</figcaption></figure>';
    }).join('');
    openModal(t.title, '<div class="studio-look">' +
      (t.cover ? '<img class="cover" src="' + esc(t.cover) + '" alt="">' : '') +
      '<div class="studio-look-cards">' + cards + '</div></div>',
      '<button type="button" class="studio-ghost" data-act="close">Close</button>');
    say('');
  }

  async function ship(id) {
    say('Publishing…');
    var client = await initSupabase();
    var res = await client.from('studio_templates').update({ status: 'live' }).eq('id', id);
    if (res.error) return say(res.error.message || 'Could not publish', true);
    say('Live on the homepage.');
    boot();
  }

  async function takenIds() {
    var ids = {};
    try {
      var r = await fetch('templates/catalog.json', { cache: 'no-cache' });
      var data = r.ok ? await r.json() : { templates: [] };
      (data.templates || []).forEach(function (t) { if (t && t.id) ids[t.id] = true; });
    } catch (e) {}
    var client = await initSupabase();
    var res = await client.from('studio_templates').select('id');
    (res.data || []).forEach(function (row) { ids[row.id] = true; });
    return ids;
  }

  async function save(status, btn) {
    var title = document.getElementById('studioTitle').value.trim();
    var description = document.getElementById('studioDesc').value.trim();
    var on = document.querySelector('#studioCat button.is-on');
    var category = on ? on.getAttribute('data-cat') : 'games';
    var label = document.getElementById('studioLabel').value.trim() || 'items';
    var cover = document.getElementById('studioCover').files[0];
    var files = Array.prototype.slice.call(document.getElementById('studioCards').files || []);
    var id = slug(title);
    if (title.length < 2) return say('Title is too short', true);
    if (!id) return say('Title needs letters or numbers', true);
    if (!cover) return say('Add a cover', true);
    if (!files.length) return say('Add cards', true);
    if (label.length < 2) return say('Item label is too short', true);
    if (files.length > 200) return say('200 cards max', true);
    btn.disabled = true;
    try {
      var used = await takenIds();
      var base = id;
      var n = 2;
      while (used[id]) {
        id = (base + '-' + n).slice(0, 40);
        n += 1;
      }
      var client = await initSupabase();
      say('Cover…');
      var coverBlob = await toWebp(cover, 1600);
      var thumbBlob = await toWebp(cover, 640);
      var coverUrl = await upload(client, id + '/cover.webp', coverBlob);
      var thumbUrl = await upload(client, id + '/cover_thumb.webp', thumbBlob);
      var cards = [];
      var names = [];
      for (var i = 0; i < files.length; i++) {
        say('Cards ' + (i + 1) + ' / ' + files.length);
        var blob = await toWebp(files[i], 480);
        var fname = String(i + 1).padStart(2, '0') + '_' + fileSlug(files[i].name) + '.webp';
        await upload(client, id + '/' + fname, blob);
        var name = pretty(files[i].name);
        cards.push({ id: i + 1, file: fname, name: name, faction: 'ALL' });
        names.push(name);
      }
      var cardPath = coverUrl.replace(/cover\.webp(\?.*)?$/, '');
      var res = await client.from('studio_templates').insert({
        id: id,
        title: title,
        description: description,
        category: category,
        item_label: label,
        cover_url: coverUrl,
        cover_thumb_url: thumbUrl,
        card_path: cardPath,
        cards: cards,
        names: names.join('\n'),
        item_count: cards.length,
        status: status
      });
      if (res.error) throw new Error(res.error.message || 'Could not save');
      say(status === 'live' ? 'Live on the homepage.' : 'Saved as a draft.');
      boot();
    } catch (err) {
      say(err.message || 'Could not save', true);
      btn.disabled = false;
    }
  }

  async function boot() {
    var user = await getSessionUser();
    if (!user) {
      paintLocked('<p>Log in with the RankMe account.</p><button type="button" class="show-all-btn" id="studioIn">Log in</button>');
      document.getElementById('studioIn').addEventListener('click', function () {
        signIn().catch(function (err) { say(err.message || 'Log in failed', true); });
      });
      return;
    }
    var ok = false;
    try { ok = await isStudioAdmin(); } catch (e) { ok = false; }
    if (!ok) {
      paintLocked('<p>This account cannot open the constructor.</p>');
      say('Run sql/studio.sql if you have not yet. The door is lolrankme@gmail.com.', true);
      return;
    }
    var client = await initSupabase();
    var res = await client.from('studio_templates')
      .select('id,title,status,cover_url,cover_thumb_url,item_count,item_label')
      .order('created_at', { ascending: false });
    if (res.error) {
      say('Run sql/studio.sql again. Drafts need that update.', true);
      return;
    }
    paintForm(res.data || []);
  }

  boot().catch(function (err) { say(err.message || 'Could not open', true); });
})();
