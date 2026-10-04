-- Execute no SQL Editor do projeto Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Minha conta',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.incomes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.months (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.budgets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  planned_amount_cents bigint not null check (planned_amount_cents >= 0),
  classification text not null check (classification in ('Essencial', 'Pessoal', 'Lazer', 'Emergência', 'Outros')),
  month smallint not null check (month between 1 and 12),
  year smallint not null,
  observation text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete restrict,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  date date not null,
  observation text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.investments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Renda fixa', 'Ações', 'Fundos', 'Criptoativos', 'Outros')),
  invested_cents bigint not null check (invested_cents > 0),
  current_value_cents bigint not null check (current_value_cents >= 0),
  date date not null,
  observation text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.categories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create table if not exists public.settings (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  sync_status text not null check (sync_status in ('pending', 'synced', 'error'))
);

create unique index if not exists incomes_user_period_idx on public.incomes (user_id, year, month) where deleted_at is null;
create unique index if not exists months_user_period_idx on public.months (user_id, year, month) where deleted_at is null;
create unique index if not exists settings_user_key_idx on public.settings (user_id, key) where deleted_at is null;
create index if not exists budgets_user_period_idx on public.budgets (user_id, year, month);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date);
create index if not exists investments_user_date_idx on public.investments (user_id, date);

do $$ declare table_name text; begin
  foreach table_name in array array['profiles', 'incomes', 'months', 'budgets', 'expenses', 'investments', 'categories', 'settings'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "users can read own %1$s" on public.%1$I', table_name);
    execute format('drop policy if exists "users can write own %1$s" on public.%1$I', table_name);
    execute format('create policy "users can read own %1$s" on public.%1$I for select using (auth.uid() = user_id)', table_name);
    execute format('create policy "users can write own %1$s" on public.%1$I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  end loop;
end $$;
