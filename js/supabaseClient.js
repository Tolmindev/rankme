/**
 * RankMe · Supabase client
 * - Publishable key is safe in the browser; protect data with RLS.
 * - Stats / likes / card ratings: RPC only (no direct table writes from the client).
 * - Tierlists CRUD: direct table access, scoped by auth.uid() via RLS.
 */
window.RANKME_SB = {
  url: 'https://nphnspkuuvshhigkiaae.supabase.co',
  key: 'sb_publishable_o0uO7GMOdUO9JX_6GYV4oQ_bkqBAYR9',
};

window.sb = null;

async function initSupabase() {
  if (window.sb) return window.sb;
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('[RankMe] Supabase SDK not loaded');
    return null;
  }
  window.sb = supabase.createClient(window.RANKME_SB.url, window.RANKME_SB.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return window.sb;
}

async function getSessionUser() {
  const client = await initSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  let session = data?.session || null;
  const expMs = session && session.expires_at ? session.expires_at * 1000 : 0;
  if (session && expMs && expMs < Date.now() + 30000) {
    const { data: refreshed } = await client.auth.refreshSession();
    session = (refreshed && refreshed.session) || null;
  }
  return (session && session.user) || null;
}

function rankmeDisplayName(user) {
  if (!user) return 'User';
  const meta = user.user_metadata || {};
  const fromMeta = (
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    meta.custom_claims?.global_name ||
    meta.user_name ||
    meta.preferred_username ||
    (meta.given_name && meta.family_name ? (meta.given_name + ' ' + meta.family_name) : null) ||
    meta.given_name ||
    (user.email ? user.email.split('@')[0] : null)
  );
  const s = String(fromMeta || 'User').replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim();
  return s || 'User';
}

function sanitizeDisplayName(raw) {
  return String(raw || '').replace(/[—–]/g, '-').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function validateDisplayName(raw) {
  const s = sanitizeDisplayName(raw);
  if (s.length < 2) return { ok: false, error: 'At least 2 characters' };
  if (s.length > 18) return { ok: false, error: '18 characters max' };
  if (/@|https?:\/\/|www\./i.test(s)) return { ok: false, error: 'No links or @handles' };
  return { ok: true, clean: s };
}

async function setRankmeDisplayName(raw) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const check = validateDisplayName(raw);
  if (!check.ok) throw new Error(check.error);
  const { error } = await client.auth.updateUser({ data: { display_name: check.clean } });
  if (error) throw error;
  try {
    await client.from('tierlists').update({ author_name: check.clean }).eq('user_id', user.id);
  } catch (e) {}
  try { await syncMyProfile(user, check.clean); } catch (e) {}
  return check.clean;
}

async function rankmeSignIn(provider) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase not ready');
  const redirectTo = location.origin + location.pathname.replace(/[^/]*$/, 'account.html');
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}

async function rankmeSignOut() {
  const client = await initSupabase();
  if (!client) return;
  await client.auth.signOut();
}

/* ---- Exclusive tierlists (user-owned rows; RLS: auth.uid() = user_id) ---- */

async function saveExclusiveTierlist({ title, templateId, payload, id }) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const authorName = rankmeDisplayName(user);
  const authorAvatar = (user.user_metadata || {}).avatar_url || (user.user_metadata || {}).picture || (user.user_metadata || {}).avatar || '';
  const now = new Date().toISOString();
  const row = {
    user_id: user.id,
    title: title || 'Untitled',
    template_id: templateId || 'sf-duel',
    payload,
    author_name: authorName,
    author_avatar: authorAvatar,
    updated_at: now,
  };
  // Overwrite own save when id is known (edit existing ranking)
  if (id) {
    const { data, error } = await client
      .from('tierlists')
      .update(row)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single();
    if (!error && data) return data;
    // fall through to insert if row missing
  }
  const { data, error } = await client
    .from('tierlists')
    .insert(Object.assign({ created_at: now }, row))
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function listMyTierlists() {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) return [];
  const selectFull = 'id, title, template_id, payload, created_at, updated_at, is_public, like_count, view_count, author_name, author_avatar';
  const selectMin = 'id, title, template_id, payload, created_at, updated_at, is_public, like_count';
  async function query(sel) {
    return client.from('tierlists').select(sel).eq('user_id', user.id).order('updated_at', { ascending: false });
  }
  let { data, error } = await query(selectFull);
  if (error && /jwt|expired/i.test(error.message || '')) {
    await client.auth.refreshSession();
    ({ data, error } = await query(selectFull));
  }
  if (error) {
    const { data: d2, error: e2 } = await query(selectMin);
    if (e2) throw e2;
    return d2 || [];
  }
  return data || [];
}

async function setTierlistPublic(id, isPublic) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const authorName = rankmeDisplayName(user);
  const authorAvatar = (user.user_metadata || {}).avatar_url || (user.user_metadata || {}).picture || (user.user_metadata || {}).avatar || '';
  const patch = {
    is_public: !!isPublic,
    updated_at: new Date().toISOString(),
    author_name: authorName,
    author_avatar: authorAvatar,
  };
  const { error } = await client
    .from('tierlists')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

async function listPublicTierlists(limit) {
  const client = await initSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from('tierlists')
    .select('id, title, template_id, updated_at, created_at, user_id, is_public, like_count, view_count, author_name, author_avatar, payload')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit || 24);
  if (error) {
    console.warn('[RankMe] listPublicTierlists', error.message);
    const { data: d2 } = await client
      .from('tierlists')
      .select('id, title, template_id, updated_at, user_id, is_public, like_count')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit || 24);
    return d2 || [];
  }
  return data || [];
}

/** Public profile: only is_public lists for a given user_id (works without login). */
async function listPublicTierlistsByUser(userId, limit) {
  const client = await initSupabase();
  if (!client || !userId) return [];
  const { data, error } = await client
    .from('tierlists')
    .select('id, title, template_id, updated_at, created_at, user_id, is_public, like_count, view_count, author_name, author_avatar, payload')
    .eq('is_public', true)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit || 48);
  if (error) {
    console.warn('[RankMe] listPublicTierlistsByUser', error.message);
    const { data: d2 } = await client
      .from('tierlists')
      .select('id, title, template_id, updated_at, user_id, is_public, like_count, author_name, author_avatar')
      .eq('is_public', true)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit || 48);
    return d2 || [];
  }
  return data || [];
}

async function getTierlistById(id) {
  const client = await initSupabase();
  if (!client || !id) return null;
  // Wait for session restore so RLS sees auth.uid() when logged in
  try { await client.auth.getSession(); } catch (e) {}
  const cols = 'id, title, template_id, payload, updated_at, created_at, user_id, is_public, like_count, view_count, author_name, author_avatar';
  let { data, error } = await client
    .from('tierlists')
    .select(cols)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.warn('[RankMe] getTierlistById', error.message);
    data = null;
  }
  if (data && data.payload) return data;
  // Fallback without maybeSingle
  const { data: rows, error: e2 } = await client
    .from('tierlists')
    .select(cols)
    .eq('id', id)
    .limit(1);
  if (e2) console.warn('[RankMe] getTierlistById fallback', e2.message);
  return (rows && rows[0]) || null;
}

async function incrementTierlistView(id) {
  if (!id) return;
  const client = await initSupabase();
  if (!client) return;
  try {
    await client.rpc('increment_tierlist_view', { tid: id });
  } catch (e) {
    // optional RPC / column
  }
}

/* Display helpers */
function formatCount(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 7) {
    const days = Math.floor(s / 86400);
    return days === 1 ? '1 day ago' : days + ' days ago';
  }
  if (s < 86400 * 30) {
    const w = Math.floor(s / (86400 * 7));
    return w === 1 ? '1 week ago' : w + ' weeks ago';
  }
  if (s < 86400 * 365) {
    const m = Math.floor(s / (86400 * 30));
    return m === 1 ? '1 month ago' : m + ' months ago';
  }
  const y = Math.floor(s / (86400 * 365));
  return y === 1 ? '1 year ago' : y + ' years ago';
}

async function deleteTierlist(id) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const { error } = await client
    .from('tierlists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

/* ---- Short links (optional table) ---- */

async function createShortLink(payload) {
  const client = await initSupabase();
  if (!client) return null;
  const code = Math.random().toString(36).slice(2, 8);
  const { error } = await client.from('short_links').insert({
    code,
    payload,
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.warn('[RankMe] createShortLink', error.message);
    return null;
  }
  return code;
}

async function loadShortLink(code) {
  const client = await initSupabase();
  if (!client || !code) return null;
  const { data, error } = await client
    .from('short_links')
    .select('payload')
    .eq('code', code)
    .maybeSingle();
  if (error || !data) return null;
  return data.payload;
}

/* ---- Nav auth UI ---- */

function updateNavAuth() {
  return (async function () {
    try {
      const user = await getSessionUser();
      document.querySelectorAll('[data-auth-login]').forEach(function (el) {
        el.hidden = !!user;
      });
      document.querySelectorAll('[data-auth-account]').forEach(function (el) {
        el.hidden = !user;
      });
      var displayName = user ? rankmeDisplayName(user) : 'Account';
      document.querySelectorAll('[data-auth-name]').forEach(function (el) {
        el.textContent = displayName;
      });
      document.querySelectorAll('[data-auth-avatar]').forEach(function (el) {
        var url = user && (user.user_metadata?.avatar_url || user.user_metadata?.picture);
        if (url && el.tagName === 'IMG') el.src = url;
      });
      /* Shared header: avatar circle when logged in, label when guest */
      var loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        loginBtn.classList.toggle('logged-in', !!user);
        var avatarUrl = user && (user.user_metadata?.avatar_url || user.user_metadata?.picture);
        if (user && avatarUrl) {
          loginBtn.classList.add('login-btn-avatar');
          loginBtn.setAttribute('title', displayName);
          loginBtn.setAttribute('aria-label', displayName);
          loginBtn.innerHTML = '<img class="nav-avatar" src="' + avatarUrl + '" alt="">';
        } else if (user) {
          loginBtn.classList.remove('login-btn-avatar');
          loginBtn.textContent = displayName;
        } else {
          loginBtn.classList.remove('login-btn-avatar');
          if (loginBtn.tagName === 'A' || loginBtn.tagName === 'BUTTON') {
            loginBtn.textContent = 'Account';
          }
        }
      }
    } catch (e) {
      console.warn('[RankMe] updateNavAuth', e);
    }
  })();
}


/* ---- Account nav (all pages; app.js may override with draft-stash on tier) ---- */
function bindAccountButton() {
  var btn = document.getElementById('loginBtn');
  if (!btn || btn.dataset.navBound === '1') return; // app.js owns tier (draft stash)
  /* Prefer native <a href="account.html"> — no JS required.
     If still a <button>, add one click handler. */
  if (btn.tagName === 'A' && btn.getAttribute('href')) return;
  if (btn.dataset.accountBound === '1') return;
  btn.dataset.accountBound = '1';
  btn.addEventListener('click', function () {
    location.href = 'account.html';
  });
}


if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    bindAccountButton();
    updateNavAuth();
  });
  bindAccountButton();
  updateNavAuth();
}

/* ---- Social: likes (RPC only — atomic, RLS-safe) ---- */

async function toggleTierlistLike(tierlistId) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const { data, error } = await client.rpc('toggle_tierlist_like', { tid: tierlistId });
  if (error) throw error;
  return data; // { liked, like_count }
}

async function getMyLikedIds(ids) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user || !ids || !ids.length) return new Set();
  const { data, error } = await client
    .from('tierlist_likes')
    .select('tierlist_id')
    .eq('user_id', user.id)
    .in('tierlist_id', ids);
  if (error) {
    console.warn('[RankMe] getMyLikedIds', error.message);
    return new Set();
  }
  return new Set((data || []).map(function (r) { return String(r.tierlist_id); }));
}

/* ---- Template usage (RPC only) ---- */

async function trackTemplateUse(templateId, kind) {
  if (!templateId || templateId === 'blank') return;
  var key = 'rankme_tracked_' + kind + '_' + templateId;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (_) {}
  const client = await initSupabase();
  if (!client) return;
  const { error } = await client.rpc('increment_template_stat', {
    tid: templateId,
    kind: kind === 'battle' ? 'battle' : 'open',
  });
  if (error) console.warn('[RankMe] trackTemplateUse', error.message);
}

async function fetchTemplateStats() {
  const client = await initSupabase();
  if (!client) return {};
  try {
    const { data, error } = await client
      .from('template_stats')
      .select('template_id, open_count, battle_count');
    if (error || !data) return {};
    const map = {};
    data.forEach(function (r) {
      map[r.template_id] = {
        open: r.open_count || 0,
        battle: r.battle_count || 0,
        uses: (r.open_count || 0) + (r.battle_count || 0),
      };
    });
    return map;
  } catch (e) {
    console.warn('[RankMe] fetchTemplateStats', e);
    return {};
  }
}

/* ---- Card battle priors (RPC only) ---- */


/* ---- User battle completions (profile counter) ---- */

async function recordUserBattleComplete(templateId) {
  try {
    if (typeof trackTemplateUse === 'function' && templateId) {
      // allow a second battle track on complete (session key uses different suffix)
      try { sessionStorage.removeItem('rankme_tracked_battle_' + templateId); } catch (_) {}
      trackTemplateUse(templateId, 'battle');
    }
  } catch (e) {}
  const client = await initSupabase();
  let user = null;
  try {
    if (client) {
      const { data } = await client.auth.getUser();
      user = data && data.user;
    }
  } catch (e) {}
  // Local mirror (always works, even offline / free plan)
  if (user && user.id) {
    try {
      const key = 'rankme_battles_' + user.id;
      const n = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
      localStorage.setItem(key, String(n));
    } catch (e) {}
  }
  // Optional server counter (run SUPABASE_USER_BATTLES.sql once)
  if (client && user) {
    try {
      const { error } = await client.rpc('increment_user_battle');
      if (error) console.warn('[RankMe] increment_user_battle', error.message);
    } catch (e) {}
  }
}

async function getUserBattleCount(userId) {
  if (!userId) return 0;
  let local = 0;
  try {
    local = parseInt(localStorage.getItem('rankme_battles_' + userId) || '0', 10) || 0;
  } catch (e) {}
  const client = await initSupabase();
  if (!client) return local;
  try {
    const { data, error } = await client
      .from('user_stats')
      .select('battle_count')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data && data.battle_count != null) {
      const server = Number(data.battle_count) || 0;
      // Prefer higher of local/server so we never go backwards after SQL is added later
      return Math.max(local, server);
    }
  } catch (e) {}
  return local;
}

async function reportCardBattle(templateId, winnerId, loserId) {
  if (!templateId || winnerId == null || loserId == null) return;
  const client = await initSupabase();
  if (!client) return;
  const { error } = await client.rpc('apply_card_battle', {
    tid: String(templateId),
    winner: String(winnerId),
    loser: String(loserId),
  });
  if (error) console.warn('[RankMe] reportCardBattle', error.message);
}

/* ---- Expert badge ---- */

function expertBadgeHtml(opts) {
  opts = opts || {};
  var on = !!opts.on;
  var clickable = !!opts.clickable && !on;
  if (!on && !clickable) return '';
  var cls = 'expert-badge' + (on ? ' is-on' : ' is-off');
  var label = on ? 'RankMe Expert' : 'Become a RankMe Expert';
  var src = on ? 'assets/icons/expert-badge.svg?v=20260901am' : 'assets/icons/expert-badge-off.svg';
  var inner = '<img src="' + src + '" alt="">';
  if (on) {
    return '<span class="' + cls + '" title="' + label + '" aria-label="' + label + '">' + inner + '</span>';
  }
  return '<button type="button" class="' + cls + ' is-btn" data-expert-btn="1" aria-label="' + label + '">' + inner + '</button>';
}

async function fetchApprovedExpertIds() {
  if (window.__rmExpertIds instanceof Set) return window.__rmExpertIds;
  try {
    var client = await initSupabase();
    if (!client) return new Set();
    var res = await client.from('expert_requests').select('user_id').eq('status', 'approved');
    if (res.error) {
      console.warn('[RankMe] expert_requests', res.error.message);
      return new Set();
    }
    window.__rmExpertIds = new Set((res.data || []).map(function (r) { return r.user_id; }));
    return window.__rmExpertIds;
  } catch (e) {
    return new Set();
  }
}

function isApprovedExpert(userId) {
  return !!(userId && window.__rmExpertIds && window.__rmExpertIds.has(userId));
}

async function getMyExpertRequest() {
  var user = await getSessionUser();
  if (!user) return null;
  var client = await initSupabase();
  if (!client) return null;
  var res = await client.from('expert_requests').select('user_id, social_link, status, created_at').eq('user_id', user.id).maybeSingle();
  if (res.error) {
    console.warn('[RankMe] getMyExpertRequest', res.error.message);
    return null;
  }
  return res.data || null;
}

function normalizeHttpUrl(s) {
  var raw = String(s || '').trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  try {
    var u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    var host = u.hostname.replace(/\.$/, '');
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(host)) return '';
    return u.href;
  } catch (e) { return ''; }
}

async function submitExpertRequest(socialLink) {
  var link = normalizeHttpUrl(socialLink);
  if (!link) throw new Error('Paste a valid link');
  var user = await getSessionUser();
  if (!user) throw new Error('Log in first');
  var client = await initSupabase();
  if (!client) throw new Error('Could not reach server');
  var existing = await getMyExpertRequest();
  if (existing && existing.status === 'approved') throw new Error('Already an Expert');
  if (existing && existing.status === 'pending') throw new Error('Application already sent');
  var row = { social_link: link, status: 'pending' };
  var res;
  if (existing) {
    res = await client.from('expert_requests').update(row).eq('user_id', user.id);
  } else {
    res = await client.from('expert_requests').insert(row);
  }
  if (res.error) throw new Error(res.error.message || 'Could not send');
  notifyExpertApplication(user, link);
  return true;
}

async function cancelExpertRequest() {
  var user = await getSessionUser();
  if (!user) throw new Error('Log in first');
  var client = await initSupabase();
  if (!client) throw new Error('Could not reach server');
  var res = await client.from('expert_requests').delete().eq('user_id', user.id).eq('status', 'pending');
  if (res.error) throw new Error(res.error.message || 'Could not cancel');
  return true;
}

function notifyExpertApplication(user, link) {
  var name = rankmeDisplayName(user);
  function send(profile) {
    fetch('https://formsubmit.co/ajax/lolrankme@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'RankMe Expert application — ' + name,
        _template: 'box',
        name: name,
        profile: profile,
        channel: link,
        user_id: user.id,
      }),
    }).catch(function () {});
  }
  getProfileByUserId(user.id).then(function (p) {
    send((p && p.handle) ? ('https://rankme.lol/u/' + p.handle) : ('https://rankme.lol/account.html?u=' + encodeURIComponent(user.id)));
  }).catch(function () {
    send('https://rankme.lol/account.html?u=' + encodeURIComponent(user.id));
  });
}

/* ---- Profile handles ---- */

var HANDLE_RE = /^[a-z0-9_]{3,16}$/;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var HANDLE_RESERVED = {
  admin:1, api:1, css:1, js:1, account:1, battle:1, builder:1, create:1, dmca:1,
  index:1, privacy:1, terms:1, tier:1, t:1, assets:1, templates:1, u:1, login:1,
  logout:1, profile:1, profiles:1, expert:1, experts:1, support:1, help:1, www:1,
  static:1, auth:1, settings:1, rankme:1, 'null':1, undefined:1
};
window.__rmHandles = window.__rmHandles || {};
var PROFILE_COLS = 'user_id, handle, handle_changed_at, display_name, avatar_url';

function sanitizeHandle(raw) {
  return String(raw || '').trim().toLowerCase();
}

function validateHandle(raw) {
  var h = sanitizeHandle(raw);
  if (h.length < 3) return { ok: false, error: 'At least 3 characters' };
  if (h.length > 16) return { ok: false, error: '16 characters max' };
  if (!/^[a-z0-9_]+$/.test(h)) return { ok: false, error: 'Letters, numbers, _' };
  if (HANDLE_RESERVED[h]) return { ok: false, error: 'This handle is reserved' };
  return { ok: true, clean: h };
}

async function isHandleTaken(handle) {
  var h = sanitizeHandle(handle);
  if (!h) return false;
  try {
    var client = await initSupabase();
    if (!client) return false;
    var res = await client.from('profiles').select('user_id').eq('handle', h).maybeSingle();
    if (res.error || !res.data) return false;
    var user = await getSessionUser();
    return !user || String(res.data.user_id) !== String(user.id);
  } catch (e) {
    return false;
  }
}

function profileHrefFor(userId) {
  if (!userId) return '';
  var h = window.__rmHandles[userId];
  if (h) return '/u/' + encodeURIComponent(h);
  return 'account.html?u=' + encodeURIComponent(String(userId));
}

function publicHandleUrl(handle) {
  return 'https://rankme.lol/u/' + handle;
}

function handleCooldownMs(changedAt) {
  if (!changedAt) return 0;
  var t = new Date(changedAt).getTime();
  if (!isFinite(t)) return 0;
  return Math.max(0, t + 30 * 24 * 60 * 60 * 1000 - Date.now());
}

function handleWaitLabel(changedAt) {
  var t = new Date(new Date(changedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  return 'Change again ' + t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function getProfileByUserId(userId) {
  if (!userId) return null;
  try {
    var client = await initSupabase();
    if (!client) return null;
    var res = await client.from('profiles').select(PROFILE_COLS).eq('user_id', userId).maybeSingle();
    if (res.error) return null;
    var row = res.data || null;
    if (row && row.handle) window.__rmHandles[row.user_id] = row.handle;
    return row;
  } catch (e) { return null; }
}

async function getProfileByHandle(handle) {
  var h = sanitizeHandle(handle);
  if (!HANDLE_RE.test(h)) return null;
  try {
    var client = await initSupabase();
    if (!client) return null;
    var res = await client.from('profiles').select(PROFILE_COLS).eq('handle', h).maybeSingle();
    if (res.error || !res.data) return null;
    window.__rmHandles[res.data.user_id] = res.data.handle;
    return res.data;
  } catch (e) { return null; }
}

async function resolveProfileKey(u) {
  var raw = String(u || '').trim();
  if (!raw) return null;
  if (UUID_RE.test(raw)) {
    var byId = await getProfileByUserId(raw);
    return { userId: raw, handle: (byId && byId.handle) || null, handle_changed_at: (byId && byId.handle_changed_at) || null, display_name: (byId && byId.display_name) || null, avatar_url: (byId && byId.avatar_url) || null };
  }
  var byH = await getProfileByHandle(raw);
  if (!byH) return null;
  return { userId: byH.user_id, handle: byH.handle, handle_changed_at: byH.handle_changed_at, display_name: byH.display_name, avatar_url: byH.avatar_url };
}

async function fetchProfileHandles(ids) {
  var list = [];
  var seen = {};
  (ids || []).forEach(function (id) {
    if (!id || seen[id] || Object.prototype.hasOwnProperty.call(window.__rmHandles, id)) return;
    seen[id] = 1;
    list.push(id);
  });
  if (!list.length) return window.__rmHandles;
  try {
    var client = await initSupabase();
    if (!client) return window.__rmHandles;
    var res = await client.from('profiles').select('user_id, handle').in('user_id', list);
    list.forEach(function (id) {
      if (window.__rmHandles[id] == null) window.__rmHandles[id] = '';
    });
    (res.data || []).forEach(function (r) {
      if (r.handle) window.__rmHandles[r.user_id] = r.handle;
    });
  } catch (e) {}
  return window.__rmHandles;
}

async function setProfileHandle(raw) {
  var check = validateHandle(raw);
  if (!check.ok) throw new Error(check.error);
  var user = await getSessionUser();
  if (!user) throw new Error('Log in first');
  var client = await initSupabase();
  if (!client) throw new Error('Could not reach server');
  var res = await client.rpc('set_profile_handle', { new_handle: check.clean });
  if (res.error) throw new Error(res.error.message || 'Could not save');
  var row = res.data || { handle: check.clean };
  if (typeof row === 'string') {
    try { row = JSON.parse(row); } catch (e) { row = { handle: check.clean }; }
  }
  window.__rmHandles[user.id] = row.handle;
  return row;
}

async function syncMyProfile(user, nameOverride) {
  if (!user) return;
  try {
    var client = await initSupabase();
    if (!client) return;
    var name = nameOverride || (typeof rankmeDisplayName === 'function' ? rankmeDisplayName(user) : '');
    var av = (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || '';
    await client.rpc('sync_my_profile', { p_name: name || null, p_avatar: av || null });
  } catch (e) {}
}
