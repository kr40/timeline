-- supabase/migrations/20260709_add_birth_capsule_identity_fields.sql

alter table birth_capsule
  add column baby_name      text,
  add column name_meaning   text,
  add column nicknames      text[],
  add column letter_to_baby text,
  add column visitors       text[];
