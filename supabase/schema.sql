create table if not exists public.posts (
  slug text primary key,
  title text not null,
  date date not null default current_date,
  summary text not null default '',
  tags text[] not null default '{}',
  category text not null,
  content text not null,
  published boolean not null default true,
  language text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_spots (
  id text primary key,
  name text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  departure_name text not null,
  departure_lat double precision not null,
  departure_lng double precision not null,
  date text,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

drop trigger if exists travel_spots_set_updated_at on public.travel_spots;
create trigger travel_spots_set_updated_at
before update on public.travel_spots
for each row
execute function public.set_updated_at();

alter table public.posts enable row level security;
alter table public.travel_spots enable row level security;

drop policy if exists "Public can read posts" on public.posts;
create policy "Public can read posts"
on public.posts
for select
using (published = true);

drop policy if exists "Authenticated can write posts" on public.posts;
create policy "Authenticated can write posts"
on public.posts
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read travel spots" on public.travel_spots;
create policy "Public can read travel spots"
on public.travel_spots
for select
using (true);

drop policy if exists "Authenticated can write travel spots" on public.travel_spots;
create policy "Authenticated can write travel spots"
on public.travel_spots
for all
to authenticated
using (true)
with check (true);
