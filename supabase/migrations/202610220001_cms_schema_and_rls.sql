-- =============================================================================
-- Migration: 202610220001_cms_schema_and_rls.sql
-- Project: Dr. Malak Alsaif Website (د. ملاك السيف) — Arabic-First CMS
-- Description:
--   Creates the CMS schema with separate draft/published states, revision
--   history, media library metadata, slug redirect mappings, role-based
--   authorization (owner vs editor), Row-Level Security (RLS) policies, and
--   Supabase Storage buckets (cms-public-media & cms-private-media).
-- =============================================================================

begin;

-- 1. CMS Authorized Users Table (No public registration)
create table if not exists public.cms_users (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  password_hash text,
  display_name text not null,
  role text not null check (role in ('owner', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function to resolve current authenticated user's CMS role in RLS
create or replace function public.current_cms_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.cms_users
  where is_active = true
    and (
      auth_user_id = auth.uid()
      or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  limit 1;
$$;

-- 2. Keyed Structured CMS Documents (homepage, doctor_profile, faq, contact_settings)
create table if not exists public.cms_documents (
  key text primary key check (key in ('homepage', 'doctor_profile', 'faq', 'contact_settings')),
  draft_json jsonb not null,
  published_json jsonb not null,
  has_unpublished_changes boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);

-- 3. Specialties Table
create table if not exists public.cms_specialties (
  id text primary key,
  slug text not null unique,
  display_order integer not null default 1,
  status text not null default 'published' check (status in ('draft', 'published')),
  has_unpublished_changes boolean not null default false,
  draft_json jsonb not null,
  published_json jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_cms_specialties_order on public.cms_specialties (display_order asc);
create index if not exists idx_cms_specialties_status on public.cms_specialties (status);

-- 4. Articles Table (Bilingual AR/EN with independent or paired draft/published state)
create table if not exists public.cms_articles (
  id text primary key,
  translation_key text not null unique,
  slug_ar text not null,
  slug_en text not null,
  category text not null default 'consultation-prep',
  status_ar text not null default 'draft' check (status_ar in ('draft', 'published')),
  status_en text not null default 'draft' check (status_en in ('draft', 'published')),
  has_unpublished_changes boolean not null default false,
  draft_json jsonb not null,
  published_json jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_cms_articles_slug_ar on public.cms_articles (slug_ar);
create index if not exists idx_cms_articles_slug_en on public.cms_articles (slug_en);
create index if not exists idx_cms_articles_status on public.cms_articles (status_ar, status_en);

-- 5. Media Library Assets Table
create table if not exists public.cms_media_assets (
  id text primary key,
  filename text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 8388608),
  width integer not null default 1200,
  height integer not null default 800,
  storage_path text not null,
  public_url text not null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  alt_ar text not null default '',
  alt_en text not null default '',
  focal_point_x numeric(5,2) not null default 50.00 check (focal_point_x >= 0 and focal_point_x <= 100),
  focal_point_y numeric(5,2) not null default 50.00 check (focal_point_y >= 0 and focal_point_y <= 100),
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_media_visibility on public.cms_media_assets (visibility);

-- 6. Slug Redirects Table (Preserves SEO & links when specialty or article slugs change)
create table if not exists public.cms_redirects (
  id text primary key,
  entity_type text not null check (entity_type in ('specialty', 'article')),
  entity_id text not null,
  locale text not null check (locale in ('ar', 'en', 'all')),
  from_slug text not null,
  to_slug text not null,
  created_at timestamptz not null default now(),
  unique (entity_type, locale, from_slug)
);

-- 7. Immutable Revision History Table
create table if not exists public.cms_revisions (
  id text primary key,
  entity_type text not null check (entity_type in ('homepage', 'doctor_profile', 'faq', 'contact_settings', 'specialty', 'article')),
  entity_id text not null,
  action text not null check (action in ('seed', 'save_draft', 'publish', 'unpublish', 'restore_to_draft')),
  summary_ar text not null,
  snapshot_json jsonb not null,
  actor_email text not null,
  actor_role text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cms_revisions_entity on public.cms_revisions (entity_type, entity_id, created_at desc);
create index if not exists idx_cms_revisions_created on public.cms_revisions (created_at desc);

-- =============================================================================
-- Row-Level Security (RLS) Policies
-- =============================================================================

alter table public.cms_users enable row level security;
alter table public.cms_documents enable row level security;
alter table public.cms_specialties enable row level security;
alter table public.cms_articles enable row level security;
alter table public.cms_media_assets enable row level security;
alter table public.cms_redirects enable row level security;
alter table public.cms_revisions enable row level security;

-- cms_users: Only owners can view/manage users; editors can read their own row; anon blocked
create policy "cms_users_select_self_or_owner" on public.cms_users
  for select using (
    public.current_cms_role() = 'owner'
    or (public.current_cms_role() = 'editor' and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

create policy "cms_users_manage_owner_only" on public.cms_users
  for all using (public.current_cms_role() = 'owner')
  with check (public.current_cms_role() = 'owner');

-- cms_documents: Authenticated owner/editor can read; editors update draft_json; owners can publish
create policy "cms_documents_select_admin" on public.cms_documents
  for select using (public.current_cms_role() in ('owner', 'editor'));

create policy "cms_documents_write_admin" on public.cms_documents
  for update using (public.current_cms_role() in ('owner', 'editor'))
  with check (public.current_cms_role() in ('owner', 'editor'));

-- cms_specialties: Public can read published only; owner/editor can read all
create policy "cms_specialties_select_public_published" on public.cms_specialties
  for select using (
    status = 'published'
    or public.current_cms_role() in ('owner', 'editor')
  );

create policy "cms_specialties_write_admin" on public.cms_specialties
  for all using (public.current_cms_role() in ('owner', 'editor'))
  with check (public.current_cms_role() in ('owner', 'editor'));

-- cms_articles: Public can read only rows with published content; owner/editor can read all
create policy "cms_articles_select_public_published" on public.cms_articles
  for select using (
    (status_ar = 'published' or status_en = 'published')
    or public.current_cms_role() in ('owner', 'editor')
  );

create policy "cms_articles_write_admin" on public.cms_articles
  for all using (public.current_cms_role() in ('owner', 'editor'))
  with check (public.current_cms_role() in ('owner', 'editor'));

-- cms_media_assets: Public can read 'public' visibility only; owner/editor can read/insert all; only owner can delete
create policy "cms_media_select_policy" on public.cms_media_assets
  for select using (
    visibility = 'public'
    or public.current_cms_role() in ('owner', 'editor')
  );

create policy "cms_media_insert_update_admin" on public.cms_media_assets
  for insert with check (public.current_cms_role() in ('owner', 'editor'));

create policy "cms_media_update_admin" on public.cms_media_assets
  for update using (public.current_cms_role() in ('owner', 'editor'))
  with check (public.current_cms_role() in ('owner', 'editor'));

create policy "cms_media_delete_owner_only" on public.cms_media_assets
  for delete using (public.current_cms_role() = 'owner');

-- cms_redirects: Public readable for routing; admin writable
create policy "cms_redirects_select_all" on public.cms_redirects
  for select using (true);

create policy "cms_redirects_write_admin" on public.cms_redirects
  for all using (public.current_cms_role() in ('owner', 'editor'))
  with check (public.current_cms_role() in ('owner', 'editor'));

-- cms_revisions: Private to owner and editor only
create policy "cms_revisions_select_admin" on public.cms_revisions
  for select using (public.current_cms_role() in ('owner', 'editor'));

create policy "cms_revisions_insert_admin" on public.cms_revisions
  for insert with check (public.current_cms_role() in ('owner', 'editor'));

-- =============================================================================
-- Supabase Storage Buckets (cms-public-media & cms-private-media)
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cms-public-media', 'cms-public-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('cms-private-media', 'cms-private-media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

commit;
