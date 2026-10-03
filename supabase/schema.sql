-- Quiet Ritual Spa · complete Supabase schema
-- Run this entire file once in Supabase Dashboard → SQL Editor.

begin;

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at bigint not null default (extract(epoch from now())::bigint),
  updated_by text not null default 'system'
);

create table if not exists public.therapist_profiles (
  id text primary key check (id ~ '^t[1-6]$'),
  name_en text not null,
  name_hi text not null default '',
  speciality_en text not null,
  speciality_hi text not null default '',
  image_key text,
  active boolean not null default true,
  updated_at bigint not null default (extract(epoch from now())::bigint)
);

create table if not exists public.therapist_photos (
  id uuid primary key default gen_random_uuid(),
  therapist_id text not null references public.therapist_profiles(id) on delete cascade,
  image_key text not null unique,
  created_at bigint not null default (extract(epoch from now())::bigint)
);
create index if not exists idx_therapist_photos_profile on public.therapist_photos(therapist_id);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  idempotency_key uuid not null unique,
  name text not null default '[protected]',
  first_name text not null default '',
  last_name text not null default '',
  button_id text not null default 'legacy',
  encrypted_details text not null,
  phone text,
  gender text not null default '[protected]',
  age integer not null default 0,
  service text not null default '[protected]',
  therapist_preference text,
  marketing_consent boolean not null default false,
  created_at bigint not null default (extract(epoch from now())::bigint),
  delete_after bigint not null
);
create index if not exists idx_enquiries_created_at on public.enquiries(created_at desc);
create index if not exists idx_enquiries_delete_after on public.enquiries(delete_after);

create table if not exists public.enquiry_rate_limits (
  fingerprint text primary key,
  count integer not null default 1 check (count >= 0),
  window_start bigint not null
);

create or replace function public.consume_rate_limit(
  p_fingerprint text,
  p_max integer,
  p_window_start bigint
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  insert into public.enquiry_rate_limits as limits(fingerprint, count, window_start)
  values (p_fingerprint, 1, p_window_start)
  on conflict (fingerprint) do update set
    count = case when limits.window_start < p_window_start then 1 else limits.count + 1 end,
    window_start = case when limits.window_start < p_window_start then p_window_start else limits.window_start end
  returning count into new_count;
  return new_count <= p_max;
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, bigint) to service_role;

create table if not exists public.analytics_sessions (
  id uuid primary key,
  visitor_hash text not null,
  first_seen bigint not null,
  last_seen bigint not null,
  duration_seconds integer not null default 0,
  page_count integer not null default 1,
  source text not null default 'direct',
  medium text not null default 'none',
  campaign text,
  landing_path text not null,
  referrer_host text,
  device text not null,
  country text,
  region text,
  consent_version text not null
);
create index if not exists idx_analytics_sessions_last_seen on public.analytics_sessions(last_seen desc);
create index if not exists idx_analytics_sessions_visitor on public.analytics_sessions(visitor_hash);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  event_name text not null,
  path text not null,
  occurred_at bigint not null,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_analytics_events_session on public.analytics_events(session_id);
create index if not exists idx_analytics_events_name_time on public.analytics_events(event_name, occurred_at desc);

create table if not exists public.app_heartbeat (
  id smallint primary key check (id = 1),
  last_ping timestamptz not null default now(),
  note text not null default 'Supabase database heartbeat'
);
insert into public.app_heartbeat(id) values (1) on conflict (id) do nothing;

insert into public.site_settings(key, value, updated_by) values
  ('site_name', 'Quiet Ritual Spa', 'seed'),
  ('telegram_username', 'SpaYakshini1', 'seed'),
  ('telegram_cta_en', 'Chat on Telegram', 'seed'),
  ('collect_user_details', 'on', 'seed'),
  ('registration_fee', '₹199', 'seed'),
  ('package_hour_1', '₹1,700', 'seed'),
  ('package_hour_2', '₹2,000', 'seed'),
  ('package_hour_3', '₹3,000', 'seed'),
  ('package_hour_4', '₹4,000', 'seed'),
  ('package_full_day', '₹5,000', 'seed'),
  ('package_full_night', '₹5,000', 'seed')
on conflict (key) do nothing;

insert into public.therapist_profiles(id, name_en, name_hi, speciality_en, speciality_hi, active) values
  ('t1', 'Relaxation Care', 'Relaxation Care', 'Gentle relaxation massage', 'Gentle relaxation massage', true),
  ('t2', 'Deep-Pressure Care', 'Deep-Pressure Care', 'Focused pressure techniques', 'Focused pressure techniques', true),
  ('t3', 'Aroma Care', 'Aroma Care', 'Botanical oils and gentle relaxation', 'Botanical oils and gentle relaxation', true),
  ('t4', 'Glow Care', 'Glow Care', 'Facial relaxation and light wellness care', 'Facial relaxation and light wellness care', true)
on conflict (id) do nothing;

-- All app data is server-only. The service/secret key bypasses RLS; browsers do not.
alter table public.site_settings enable row level security;
alter table public.therapist_profiles enable row level security;
alter table public.therapist_photos enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_rate_limits enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.app_heartbeat enable row level security;

revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.therapist_profiles from anon, authenticated;
revoke all on table public.therapist_photos from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;
revoke all on table public.enquiry_rate_limits from anon, authenticated;
revoke all on table public.analytics_sessions from anon, authenticated;
revoke all on table public.analytics_events from anon, authenticated;
revoke all on table public.app_heartbeat from anon, authenticated;

grant all on table public.site_settings to service_role;
grant all on table public.therapist_profiles to service_role;
grant all on table public.therapist_photos to service_role;
grant all on table public.enquiries to service_role;
grant all on table public.enquiry_rate_limits to service_role;
grant all on table public.analytics_sessions to service_role;
grant all on table public.analytics_events to service_role;
grant all on table public.app_heartbeat to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spa-media', 'spa-media', false, 5000000, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;

-- The job also removes expired enquiries and old rate-limit counters.
create extension if not exists pg_cron;
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'quiet-ritual-heartbeat' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;
select cron.schedule(
  'quiet-ritual-heartbeat',
  '0 */2 * * *',
  $$
    update public.app_heartbeat set last_ping = now() where id = 1;
    delete from public.enquiries where delete_after < extract(epoch from now())::bigint;
    delete from public.enquiry_rate_limits where window_start < extract(epoch from now() - interval '2 days')::bigint;
  $$
);
