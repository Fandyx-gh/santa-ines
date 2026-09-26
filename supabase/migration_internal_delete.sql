grant delete on table public.discovery_submissions to anon, authenticated;

drop policy if exists "internal access can delete submissions" on public.discovery_submissions;
create policy "internal access can delete submissions"
  on public.discovery_submissions
  for delete
  to anon, authenticated
  using (
    public.request_header('x-internal-access-key') is not null
    and length(public.request_header('x-internal-access-key')) > 0
  );
