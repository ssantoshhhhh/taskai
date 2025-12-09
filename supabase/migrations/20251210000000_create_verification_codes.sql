create table public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.verification_codes enable row level security;

create policy "Service role can manage verification codes"
  on public.verification_codes
  using (true)
  with check (true);
