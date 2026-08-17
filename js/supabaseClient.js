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
  return data?.session?.user || null;
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

async function saveExclusiveTierlist({ title, templateId, payload }) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const row = {
    user_id: user.id,
    title: title || 'Untitled',
    template_id: templateId || 'sf-duel',
    payload,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from('tierlists')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function listMyTierlists() {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) return [];
  const { data, error } = await client
    .from('tierlists')
    .select('id, title, template_id, payload, created_at, updated_at, is_public, like_count')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function setTierlistPublic(id, isPublic) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const { error } = await client
    .from('tierlists')
    .update({ is_public: !!isPublic, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

async function listPublicTierlists(limit) {
  const client = await initSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from('tierlists')
    .select('id, title, template_id, updated_at, user_id, is_public, like_count')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit || 24);
  if (error) {
    console.warn('[RankMe] listPublicTierlists', error.message);
    return [];
  }
  return data || [];
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
      var displayName = 'Account';
      if (user) {
        displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          user.email ||
          'Account';
      }
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
        loginBtn.classList.toggle('is-logged-in', !!user);
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

async function fetchCardStats(templateId) {
  const client = await initSupabase();
  if (!client || !templateId) return {};
  try {
    const { data, error } = await client
      .from('card_stats')
      .select('card_id, wins, losses, rating')
      .eq('template_id', templateId);
    if (error || !data) return {};
    const map = {};
    data.forEach(function (r) {
      map[String(r.card_id)] = r;
    });
    return map;
  } catch (e) {
    console.warn('[RankMe] fetchCardStats', e);
    return {};
  }
}
