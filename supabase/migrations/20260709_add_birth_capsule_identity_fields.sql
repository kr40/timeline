-- supabase/migrations/20260709_add_birth_capsule_identity_fields.sql

alter table birth_capsule
  add column baby_name      text,
  add column name_meaning   text,
  add column nicknames      text[] default '{}',
  add column letter_to_baby text,
  add column visitors       text[] default '{}';

create unique index if not exists birth_capsule_singleton_idx on birth_capsule ((true));
