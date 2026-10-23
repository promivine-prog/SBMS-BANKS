-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  persona text unique not null,          -- 'bunch' | 'samson'
  bmoni_user_id text not null,
  email text not null,
  created_at timestamptz default now()
);
alter table app_users enable row level security; -- no policies: only the server's service key can read/write
