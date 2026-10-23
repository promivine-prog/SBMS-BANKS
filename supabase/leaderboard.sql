-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists leaderboard (
  id uuid primary key,
  nickname text not null,
  secret_hash text not null,           -- hash of a secret only the user's device knows
  points integer not null default 0,
  streak integer not null default 0,
  last_day date,
  state jsonb not null default '{}'::jsonb,   -- per-day caps, one-time rewards, activity counts
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists leaderboard_nick_ci on leaderboard (lower(nickname));
create index if not exists leaderboard_points_idx on leaderboard (points desc);
alter table leaderboard enable row level security;  -- no policies: only the server's secret key can read or write
