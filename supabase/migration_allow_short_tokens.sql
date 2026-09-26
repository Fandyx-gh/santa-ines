alter table public.discovery_submissions
  drop constraint if exists discovery_submissions_token_check;

alter table public.discovery_submissions
  add constraint discovery_submissions_token_check check (length(trim(token)) > 0);
