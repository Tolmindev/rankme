-- RankMe studio. Private constructor for official homepage templates.
-- Paste in Supabase → SQL Editor → Run once.
-- Door opens for lolrankme@gmail.com. To add another login:
--   insert into public.studio_admins (user_id) values ('uuid-from-authentication-users');

create table if not exists public.studio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.studio_templates (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  title text not null check (char_length(title) between 2 and 80),
  description text not null default '' check (char_length(description) <= 240),
  category text not null default 'games' check (category in (
    'games', 'anime', 'movies', 'tv', 'sports', 'music', 'memes', 'technology', 'other'
  )),
  item_label text not null default 'items' check (char_length(item_label) between 2 and 24),
  cover_url text not null,
  cover_thumb_url text not null default '',
  card_path text not null,
  cards jsonb not null,
  names text not null default '',
  item_count int not null check (item_count between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.studio_admins enable row level security;
alter table public.studio_templates enable row level security;

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.studio_admins a where a.user_id = auth.uid())
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'lolrankme@gmail.com';
$$;

drop policy if exists studio_admins_read on public.studio_admins;
create policy studio_admins_read on public.studio_admins
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists studio_templates_read on public.studio_templates;
create policy studio_templates_read on public.studio_templates
  for select using (true);

drop policy if exists studio_templates_insert on public.studio_templates;
create policy studio_templates_insert on public.studio_templates
  for insert to authenticated
  with check (public.is_studio_admin());

drop policy if exists studio_templates_update on public.studio_templates;
create policy studio_templates_update on public.studio_templates
  for update to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

drop policy if exists studio_templates_delete on public.studio_templates;
create policy studio_templates_delete on public.studio_templates
  for delete to authenticated
  using (public.is_studio_admin());

grant select on public.studio_admins to authenticated;
grant select on public.studio_templates to anon, authenticated;
grant insert, update, delete on public.studio_templates to authenticated;
grant execute on function public.is_studio_admin() to authenticated;

insert into storage.buckets (id, name, public)
values ('studio', 'studio', true)
on conflict (id) do update set public = true;

drop policy if exists studio_public_read on storage.objects;
create policy studio_public_read on storage.objects
  for select using (bucket_id = 'studio');

drop policy if exists studio_admin_insert on storage.objects;
create policy studio_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'studio' and public.is_studio_admin());

drop policy if exists studio_admin_update on storage.objects;
create policy studio_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'studio' and public.is_studio_admin());

drop policy if exists studio_admin_delete on storage.objects;
create policy studio_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'studio' and public.is_studio_admin());
