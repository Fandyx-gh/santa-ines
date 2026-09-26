-- Safe migration for an existing Santa Inés discovery_submissions table.
alter table public.discovery_submissions
  add column if not exists is_test boolean not null default false;

-- The original schema used a unique token. Drop it so one real row and one
-- independently testable row can share the same client token.
alter table public.discovery_submissions
  drop constraint if exists discovery_submissions_token_key;

alter table public.discovery_submissions
  drop constraint if exists discovery_submissions_token_mode_key;

alter table public.discovery_submissions
  add constraint discovery_submissions_token_mode_key unique (token, is_test);

create index if not exists discovery_submissions_token_mode_idx
  on public.discovery_submissions (token, is_test);
