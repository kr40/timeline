-- supabase/migrations/20260729_add_blessings_polls_shower.sql

alter table wishes add column category text check (category in ('blessing', 'advice'));

create table fun_poll_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  poll        text not null check (poll in ('sleep', 'diaper', 'inherit', 'pushover', 'googler')),
  choice      text not null check (choice in ('aditi', 'kartik')),
  created_at  timestamptz default now(),
  unique (voter_id, poll)
);

create table shower_posts (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  message      text not null,
  image_url    text,
  created_at   timestamptz default now()
);
