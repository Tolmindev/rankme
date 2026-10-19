/* Creators: approved rows from Supabase. Send requires login. Ten per 24 hours. */
(function () {
  var list = document.getElementById('creatorsList');
  var form = document.getElementById('creatorsAsk');
  var DAY = 24 * 60 * 60 * 1000;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
  }

  function safeHttps(url) {
    try {
      var u = new URL(url);
      return u.protocol === 'https:' ? u.href : '';
    } catch (e) { return ''; }
  }

  function safeTier(path) {
    return /^t\/[a-z0-9-]+$/.test(path) ? path : '';
  }

  function cardHtml(row) {
    var id = row.youtube_id;
    var watch = 'https://youtu.be/' + id;
    var authorUrl = safeHttps(row.author_url);
    var tier = safeTier(row.tier_path);
    var author = row.author_name
      ? (authorUrl
        ? '<a class="creators-by" href="' + esc(authorUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(row.author_name) + '</a>'
        : '<span class="creators-by">' + esc(row.author_name) + '</span>')
      : '';
    var tierHtml = tier && row.tier_label
      ? '<a class="creators-tier" href="' + esc(tier) + '">' + esc(row.tier_label) + '</a>'
      : '';
    return '<article class="creators-card">' +
      '<a class="creators-thumb" href="' + watch + '" target="_blank" rel="noopener noreferrer">' +
        '<img src="https://i.ytimg.com/vi/' + esc(id) + '/hqdefault.jpg" alt="">' +
        '<span class="creators-play" aria-hidden="true"></span>' +
      '</a>' +
      '<div class="creators-copy">' +
        '<h2><a href="' + watch + '" target="_blank" rel="noopener noreferrer">' + esc(row.title) + '</a></h2>' +
        author + tierHtml +
      '</div>' +
    '</article>';
  }

  var CAP = 6;
  var all = [];
  var open = false;

  function paint() {
    if (!list) return;
    var rows = open ? all : all.slice(0, CAP);
    list.classList.toggle('is-multi', rows.length > 1);
    var html = rows.map(cardHtml).join('');
    if (!open && all.length > CAP) {
      html += '<div class="show-all-wrap"><button type="button" class="show-all-btn" id="creatorsMore">Show more</button></div>';
    }
    list.innerHTML = html;
    var more = document.getElementById('creatorsMore');
    if (more) more.addEventListener('click', function () {
      open = true;
      paint();
    });
  }

  function youtubeId(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    var u;
    try { u = new URL(s); } catch (e) { return ''; }
    var host = u.hostname.replace(/^www\./, '').toLowerCase();
    var id = '';
    if (host === 'youtu.be') id = (u.pathname.split('/').filter(Boolean)[0] || '');
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
      else {
        var parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') id = parts[1] || '';
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
  }

  async function load() {
    try {
      var client = await initSupabase();
      if (!client || !list) return;
      var res = await client.from('creator_videos')
        .select('youtube_id, title, author_name, author_url, tier_path, tier_label, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (res.error) return;
      all = res.data || [];
      open = false;
      paint();
    } catch (e) {}
  }

  function bind() {
    if (!form) return;
    var input = document.getElementById('creatorsUrl');
    var msg = document.getElementById('creatorsMsg');

    function note(text, kind) {
      msg.textContent = text || '';
      msg.classList.toggle('is-bad', kind === 'bad' && !!text);
      msg.classList.toggle('is-ok', kind === 'ok' && !!text);
    }

    function flash(text, kind) {
      note(text, kind || 'bad');
      clearTimeout(msg._t);
      msg._t = setTimeout(function () {
        if (msg.textContent === text) note('');
      }, 4000);
    }

    async function waitText(client, userId) {
      var since = new Date(Date.now() - DAY).toISOString();
      var res = await client.from('creator_videos')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(1);
      var oldest = res.data && res.data[0] && res.data[0].created_at;
      var ms = oldest ? (new Date(oldest).getTime() + DAY - Date.now()) : DAY;
      var hours = Math.max(1, Math.ceil(ms / 3600000));
      return 'You can send another video in ' + (hours === 1 ? '1 hour.' : hours + ' hours.');
    }

    function mail(user, link) {
      var sent = false;
      var fallback = 'https://rankme.lol/account.html?u=' + encodeURIComponent(user.id);
      var name = typeof rankmeDisplayName === 'function' ? rankmeDisplayName(user) : '';
      function send(profile) {
        if (sent) return;
        sent = true;
        fetch('https://formsubmit.co/ajax/lolrankme@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: 'RankMe Creators video',
            _template: 'box',
            _captcha: 'false',
            name: name,
            message: 'A creator sent a video.',
            youtube: link,
            profile: profile,
            user_id: user.id
          })
        }).catch(function () {});
      }
      if (typeof getProfileByUserId !== 'function') {
        send(fallback);
        return;
      }
      var timer = setTimeout(function () { send(fallback); }, 1500);
      getProfileByUserId(user.id).then(function (p) {
        clearTimeout(timer);
        send((p && p.handle) ? ('https://rankme.lol/u/' + p.handle) : fallback);
      }).catch(function () {
        clearTimeout(timer);
        send(fallback);
      });
    }

    var sending = false;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (sending) return;
      var id = youtubeId(input.value);
      if (!id) {
        flash('That\'s not a YouTube link.');
        input.focus();
        return;
      }
      var user = await getSessionUser();
      if (!user) {
        flash('Log in first. No anonymous fame.');
        return;
      }
      var client = await initSupabase();
      if (!client) {
        flash('Server blinked. Try again.');
        return;
      }
      note('');
      sending = true;
      var field = input.parentNode;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var started = Date.now();
      if (!reduce) field.classList.add('is-loading');
      var meta = { title: 'YouTube video', author_name: '', author_url: '' };
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var stop = setTimeout(function () { if (ctrl) ctrl.abort(); }, 350);
      try {
        var info = await fetch('https://noembed.com/embed?url=' + encodeURIComponent('https://youtu.be/' + id), ctrl ? { signal: ctrl.signal } : {});
        var data = await info.json();
        if (data && data.title) meta.title = String(data.title).trim().slice(0, 140);
        if (data && data.author_name) meta.author_name = String(data.author_name).trim().slice(0, 80);
        if (data && data.author_url) meta.author_url = safeHttps(data.author_url).slice(0, 300);
      } catch (err) {}
      clearTimeout(stop);
      var res;
      try {
        res = await client.from('creator_videos').insert({
          youtube_id: id,
          title: meta.title || 'YouTube video',
          author_name: meta.author_name,
          author_url: meta.author_url,
          status: 'pending'
        });
      } catch (err) {
        res = { error: { message: 'network' } };
      }
      function finish() {
        field.classList.remove('is-loading');
        field.classList.remove('is-done');
        sending = false;
      }
      if (res.error) {
        finish();
        var m = res.error.message || '';
        if (m.indexOf('CREATOR_LIMIT') !== -1) {
          flash(await waitText(client, user.id));
          return;
        }
        if (res.error.code === '23505' || /duplicate/i.test(m)) {
          flash('We already have this one.');
          return;
        }
        flash('Could not send. Try again.');
        return;
      }
      mail(user, 'https://youtu.be/' + id);
      var wait = reduce ? 0 : Math.max(0, 1100 - (Date.now() - started));
      setTimeout(function () {
        if (reduce) {
          input.value = '';
          finish();
          flash('Sent. We\'ll watch it.', 'ok');
          return;
        }
        field.classList.remove('is-loading');
        field.classList.add('is-done');
        setTimeout(function () {
          input.value = '';
          finish();
          flash('Sent. We\'ll watch it.', 'ok');
        }, 260);
      }, wait);
    });
  }

  load();
  bind();
})();
