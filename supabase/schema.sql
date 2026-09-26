create extension if not exists pgcrypto;

create table if not exists public.discovery_submissions (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  is_test boolean not null default false,
  client_slug text not null,
  current_step integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'IN_PROGRESS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz null,
  constraint discovery_submissions_step_check check (current_step between 0 and 8),
  constraint discovery_submissions_status_check check (status in ('IN_PROGRESS', 'SUBMITTED')),
  constraint discovery_submissions_client_slug_check check (length(trim(client_slug)) > 0),
  constraint discovery_submissions_token_check check (length(trim(token)) >= 16),
  constraint discovery_submissions_token_mode_key unique (token, is_test)
);

create index if not exists discovery_submissions_updated_at_idx
  on public.discovery_submissions (updated_at desc);

create index if not exists discovery_submissions_client_slug_idx
  on public.discovery_submissions (client_slug);

create index if not exists discovery_submissions_token_mode_idx
  on public.discovery_submissions (token, is_test);

create or replace function public.request_header(header_name text)
returns text
language sql
stable
as $$
  select current_setting('request.headers', true)::json ->> header_name;
$$;

alter table public.discovery_submissions enable row level security;

revoke all on table public.discovery_submissions from anon, authenticated;
grant select, insert, update on table public.discovery_submissions to anon, authenticated;

drop policy if exists "discovery token can read its submission" on public.discovery_submissions;
create policy "discovery token can read its submission"
  on public.discovery_submissions
  for select
  to anon, authenticated
  using (
    token = public.request_header('x-discovery-token')
    or (
      public.request_header('x-internal-access-key') is not null
      and length(public.request_header('x-internal-access-key')) > 0
    )
  );

drop policy if exists "discovery token can create its submission" on public.discovery_submissions;
create policy "discovery token can create its submission"
  on public.discovery_submissions
  for insert
  to anon, authenticated
  with check (token = public.request_header('x-discovery-token'));

drop policy if exists "discovery token can update its submission" on public.discovery_submissions;
create policy "discovery token can update its submission"
  on public.discovery_submissions
  for update
  to anon, authenticated
  using (token = public.request_header('x-discovery-token'))
  with check (token = public.request_header('x-discovery-token'));

create or replace function public.set_discovery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists discovery_submissions_updated_at on public.discovery_submissions;
create trigger discovery_submissions_updated_at
  before update on public.discovery_submissions
  for each row
  execute function public.set_discovery_updated_at();
