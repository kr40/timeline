create table if not exists votes (
	id          uuid primary key default gen_random_uuid(),
	voter_id    text not null,
	choice      text not null check (choice in ('boy', 'girl')),
	voter_name  text,
	created_at  timestamptz default now(),
	unique (voter_id)
);

create table if not exists wishes (
	id          uuid primary key default gen_random_uuid(),
	author_name text not null,
	message     text not null,
	created_at  timestamptz default now()
);

create table if not exists birth_capsule (
	id                uuid primary key default gen_random_uuid(),
	birth_date        date,
	birth_time        text,
	weight_kg         numeric,
	length_cm         numeric,
	location          text,
	headlines         text[] default '{}',
	sports_results    text[] default '{}',
	top_song          text,
	top_movie         text,
	famous_birthdays  text[] default '{}',
	weather           text,
	notes             text,
	created_at        timestamptz default now()
);
