create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  session_types text[] not null default '{}',
  session_duration_minutes integer not null default 0 check (session_duration_minutes >= 0),
  breathwork_minutes integer not null default 0 check (breathwork_minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_entries_updated_at on log_entries;
create trigger trg_log_entries_updated_at
before update on log_entries
for each row execute function set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when new.email = current_setting('app.admin_email', true) then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table profiles enable row level security;
alter table log_entries enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "read own profile"
on profiles for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "read own logs or admin"
on log_entries for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "insert own logs"
on log_entries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update own logs"
on log_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

alter table allowed_emails enable row level security;

create policy "admin manage allowed emails"
on allowed_emails
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

