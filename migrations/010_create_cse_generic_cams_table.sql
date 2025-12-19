-- Migration: create cse_generic_cams table
-- Note: Table already exists in Supabase, kept here for local parity

create table if not exists public.cse_generic_cams (
  id uuid not null default gen_random_uuid(),
  make text not null,
  family text not null,
  brand text not null,
  pn text not null,
  cam_name text,
  dur_int_050 numeric(6, 2) not null,
  dur_exh_050 numeric(6, 2) not null,
  lsa numeric(5, 2) not null,
  lift_int numeric(6, 3) not null,
  lift_exh numeric(6, 3) not null,
  peak_hp_rpm integer not null,
  boost_ok text not null,
  notes text,
  source_url text,
  family_tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cse_generic_cams_pkey primary key (id),
  constraint cse_generic_cams_boost_ok_check check (
    boost_ok = any (array['yes'::text, 'no'::text, 'either'::text])
  )
);

create unique index if not exists idx_cse_generic_cams_make_family_pn
  on public.cse_generic_cams using btree (make, family, pn);

create index if not exists idx_cse_generic_cams_tags
  on public.cse_generic_cams using gin (family_tags);
