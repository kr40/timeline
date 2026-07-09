-- supabase/migrations/20260708_add_phase2_tables.sql

create table trait_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  trait       text not null check (trait in ('eyes', 'nose', 'hair', 'smile')),
  choice      text not null check (choice in ('mum', 'dad', 'mix')),
  created_at  timestamptz default now(),
  unique (voter_id, trait)
);

create table guesses (
  id            uuid primary key default gen_random_uuid(),
  voter_id      text not null unique,
  guesser_name  text not null,
  guess_date    date not null,
  is_winner     boolean default false,
  created_at    timestamptz default now()
);

create table wish_reactions (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  wish_id     uuid not null references wishes(id) on delete cascade,
  emoji       text not null check (emoji in ('❤️', '😂', '🥹', '🎉')),
  created_at  timestamptz default now(),
  unique (voter_id, wish_id, emoji)
);

create table questions (
  id           uuid primary key default gen_random_uuid(),
  asker_name   text not null,
  question     text not null,
  answer       text,
  answered_at  timestamptz,
  created_at   timestamptz default now()
);
