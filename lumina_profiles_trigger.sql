-- Run once in Supabase Dashboard > SQL Editor.
-- Automatically create public.profiles rows when a new auth user is registered.
-- Expected existing columns: id, full_name, username, created_at.

create or replace function public.handle_new_lumina_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, username)
    values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'username'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_lumina_auth_user_created on auth.users;

create trigger on_lumina_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_lumina_user();

-- Allow each signed-in student to read only their own profile.
-- The trigger above creates the row at signup; this policy lets the dashboard fetch it.
alter table public.profiles enable row level security;

drop policy if exists "Students can read their own profile" on public.profiles;
create policy "Students can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- My Account uses upsert(), so authenticated users also need INSERT and UPDATE
-- permission for their own profile row. These policies do not permit cross-user access.
drop policy if exists "Students can insert their own profile" on public.profiles;
create policy "Students can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
