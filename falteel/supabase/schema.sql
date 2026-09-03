-- Caminho: ./supabase/schema.sql
-- FaltEEL — Etapa 2: schema completo + RLS
--
-- Como aplicar: cole este arquivo inteiro no Supabase Dashboard > SQL Editor > New query > Run.
-- Seguro para rodar mais de uma vez (idempotente): tabelas/tipos/policies existentes não são duplicados.

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type notification_timing as enum ('before', 'during', 'after');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_credito as enum ('simples', 'duplo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_aula as enum ('simples', 'dobradinha');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_aula as enum ('presente', 'falta', 'cancelada', 'greve', 'prova');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABELAS
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  notification_timing notification_timing not null default 'before',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.semestres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.professores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.disciplinas_globais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  professor_id uuid not null references public.professores (id) on delete restrict,
  tipo_credito tipo_credito not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.disciplinas_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  semestre_id uuid not null references public.semestres (id) on delete cascade,
  disciplina_global_id uuid not null references public.disciplinas_globais (id) on delete restrict,
  dias_semana int[] not null,
  horario_inicio time not null,
  tipo_aula tipo_aula not null,
  limite_faltas int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.registros_aula (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  disciplina_usuario_id uuid not null references public.disciplinas_usuario (id) on delete cascade,
  data date not null,
  status status_aula not null,
  justificativa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (disciplina_usuario_id, data)
);

-- ============================================================
-- Auto-criação de profile no signup (necessário pro app funcionar:
-- sem isso, nenhuma linha existe em profiles e o Painel Admin nunca
-- lista ninguém, nem o is_admin funciona)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- updated_at automático em registros_aula
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_registros_aula_updated_at on public.registros_aula;
create trigger set_registros_aula_updated_at
  before update on public.registros_aula
  for each row execute function public.set_updated_at();

-- ============================================================
-- Busca acento-insensível pro autocomplete de professor/disciplina
-- (ilike sozinho é case-insensitive mas NÃO ignora acento — "fisica"
-- não bate com "Física" sem isso)
-- ============================================================
create extension if not exists unaccent;

create or replace function public.buscar_professores(termo text)
returns setof public.professores
language sql
stable
as $$
  select * from public.professores
  where unaccent(nome) ilike unaccent('%' || termo || '%')
  order by nome
  limit 6;
$$;

create or replace function public.buscar_disciplinas_globais(termo text)
returns setof public.disciplinas_globais
language sql
stable
as $$
  select * from public.disciplinas_globais
  where unaccent(nome) ilike unaccent('%' || termo || '%')
  order by nome
  limit 6;
$$;

-- ============================================================
-- Helper: checa is_admin sem causar recursão de RLS em profiles
-- (security definer bypassa a RLS na leitura interna)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.semestres enable row level security;
alter table public.professores enable row level security;
alter table public.disciplinas_globais enable row level security;
alter table public.disciplinas_usuario enable row level security;
alter table public.registros_aula enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

-- ---------- semestres ----------
drop policy if exists "semestres_all_own" on public.semestres;
create policy "semestres_all_own" on public.semestres
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "semestres_admin_select_all" on public.semestres;
create policy "semestres_admin_select_all" on public.semestres
  for select using (public.is_admin());

-- ---------- disciplinas_usuario ----------
drop policy if exists "disciplinas_usuario_all_own" on public.disciplinas_usuario;
create policy "disciplinas_usuario_all_own" on public.disciplinas_usuario
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "disciplinas_usuario_admin_select_all" on public.disciplinas_usuario;
create policy "disciplinas_usuario_admin_select_all" on public.disciplinas_usuario
  for select using (public.is_admin());

-- ---------- registros_aula ----------
drop policy if exists "registros_aula_all_own" on public.registros_aula;
create policy "registros_aula_all_own" on public.registros_aula
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "registros_aula_admin_select_all" on public.registros_aula;
create policy "registros_aula_admin_select_all" on public.registros_aula
  for select using (public.is_admin());

-- ---------- professores (crowdsourced: leitura pública, criação livre, edição só do dono ou admin) ----------
drop policy if exists "professores_select_authenticated" on public.professores;
create policy "professores_select_authenticated" on public.professores
  for select to authenticated using (true);

drop policy if exists "professores_insert_authenticated" on public.professores;
create policy "professores_insert_authenticated" on public.professores
  for insert to authenticated with check (true);

drop policy if exists "professores_update_authenticated" on public.professores;
drop policy if exists "professores_update_owner_or_admin" on public.professores;
create policy "professores_update_owner_or_admin" on public.professores
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

-- ---------- disciplinas_globais (crowdsourced: leitura pública, escrita livre, edição só do dono ou admin) ----------
drop policy if exists "disciplinas_globais_select_authenticated" on public.disciplinas_globais;
create policy "disciplinas_globais_select_authenticated" on public.disciplinas_globais
  for select to authenticated using (true);

drop policy if exists "disciplinas_globais_insert_authenticated" on public.disciplinas_globais;
create policy "disciplinas_globais_insert_authenticated" on public.disciplinas_globais
  for insert to authenticated with check (true);

drop policy if exists "disciplinas_globais_update_owner_or_admin" on public.disciplinas_globais;
create policy "disciplinas_globais_update_owner_or_admin" on public.disciplinas_globais
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
