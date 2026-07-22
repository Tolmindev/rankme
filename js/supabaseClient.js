// RankMe — Supabase client (publishable key is safe in browser; protect data with RLS)
window.RANKME_SB = {
  url: 'https://nphnspkuuvshhigkiaae.supabase.co',
  key: 'sb_publishable_o0uO7GMOdUO9JX_6GYV4oQ_bkqBAYR9',
};

window.sb = null;

async function initSupabase() {
  if (window.sb) return window.sb;
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('Supabase SDK not loaded');
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

/** Save exclusive ranking JSON for current user */
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
    .select('id, title, template_id, payload, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteTierlist(id) {
  const client = await initSupabase();
  const user = await getSessionUser();
  if (!client || !user) throw new Error('Login required');
  const { error } = await client.from('tierlists').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

/** Optional short link: stores payload, returns code */
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
    console.warn('short_links', error);
    return null;
  }
  return code;
}

async function loadShortLink(code) {
  const client = await initSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from('short_links')
    .select('payload')
    .eq('code', code)
    .maybeSingle();
  if (error || !data) return null;
  return data.payload;
}

// Show nickname on Login button across all pages (wait for DOM)
function updateNavAuth(){
  return (async function(){
    try{
      if(typeof supabase === 'undefined') return;
      await initSupabase();
      const user = await getSessionUser();
      const btn = document.getElementById('loginBtn');
      if(!btn) return;
      if(user){
        const name = user.user_metadata?.full_name || user.user_metadata?.custom_claims?.global_name || user.user_metadata?.name || user.email || 'Account';
        btn.textContent = String(name).split(' ')[0] || 'Account';
      } else {
        btn.textContent = 'Login';
      }
      btn.onclick = ()=>{ location.href = 'account.html'; };
    }catch(e){}
  })();
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', updateNavAuth);
} else {
  updateNavAuth();
}
