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

  function paintForm(rows) {
    var cats = CATS.map(function (c) {
      return '<option value="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
    }).join('');
    var list = rows.map(function (row) {
      return '<li data-id="' + esc(row.id) + '"><a href="play.html?t=' + encodeURIComponent(row.id) + '">' + esc(row.title) + '</a>' +
        '<button type="button" class="studio-del" data-del="' + esc(row.id) + '">Delete</button></li>';
    }).join('');
    root.innerHTML =
      '<form id="studioForm">' +
        '<label>Title<input id="studioTitle" maxlength="80" required></label>' +
        '<label>Description<textarea id="studioDesc" maxlength="240" rows="3"></textarea></label>' +
        '<div class="studio-row">' +
          '<label>Category<select id="studioCat">' + cats + '</select></label>' +
          '<label>Item label<input id="studioLabel" maxlength="24" value="items" required></label>' +
        '</div>' +
        '<label>Cover<input id="studioCover" type="file" accept="image/*" required></label>' +
        '<label>Cards<input id="studioCards" type="file" accept="image/*" multiple required></label>' +
        '<button class="show-all-btn" type="submit">Publish to homepage</button>' +
      '</form>' +
      (list ? '<ul class="studio-list">' + list + '</ul>' : '');
    document.getElementById('studioForm').addEventListener('submit', onSubmit);
    root.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () { onDelete(btn); });
    });
  }

  async function onDelete(btn) {
    if (btn.dataset.arm !== '1') {
      btn.dataset.arm = '1';
      btn.textContent = 'Confirm';
      return;
    }
    say('Removing…');
    var client = await initSupabase();
    var res = await client.from('studio_templates').delete().eq('id', btn.getAttribute('data-del'));
    if (res.error) {
      say(res.error.message || 'Could not delete', true);
      return;
    }
    say('Removed.');
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

  async function onSubmit(e) {
    e.preventDefault();
    var title = document.getElementById('studioTitle').value.trim();
    var description = document.getElementById('studioDesc').value.trim();
    var category = document.getElementById('studioCat').value;
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
    var btn = e.target.querySelector('button[type="submit"]');
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
        item_count: cards.length
      });
      if (res.error) throw new Error(res.error.message || 'Could not save');
      say('Live on the homepage.');
      boot();
    } catch (err) {
      say(err.message || 'Could not publish', true);
      if (btn) btn.disabled = false;
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
    var res = await client.from('studio_templates').select('id,title').order('created_at', { ascending: false });
    paintForm(res.data || []);
  }

  boot().catch(function (err) { say(err.message || 'Could not open', true); });
})();
