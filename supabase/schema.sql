-- ============================================================================
-- AppGym - Esquema de Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto de Supabase (una sola vez).
--
-- No hay login ni registro: cada persona elige un nombre en el propio
-- dispositivo (se guarda en el navegador) y ese nombre se usa como
-- identificador de sus planes y entrenos. Por eso estas tablas no dependen
-- de auth.users y las politicas son abiertas (cualquiera con la clave
-- publica puede leer/escribir). No comparta la URL de esta app fuera de
-- quienes deban usarla.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Planes de entrenamiento
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  name text not null,
  description text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Acceso abierto a planes"
  on public.plans for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Dias del plan
-- ---------------------------------------------------------------------------
create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  day_index int not null default 0,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.plan_days enable row level security;

create policy "Acceso abierto a dias"
  on public.plan_days for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Ejercicios dentro de cada dia (guarda el id del ejercicio del dataset JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days (id) on delete cascade,
  order_index int not null default 0,
  exercise_id text not null,
  original_exercise_id text,
  sets int not null default 3,
  reps text not null default '12',
  rest_seconds int not null default 60,
  notes text,
  substituted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.plan_exercises enable row level security;

create policy "Acceso abierto a ejercicios de plan"
  on public.plan_exercises for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Sesiones de entrenamiento (cuando le das a "Empezar entreno")
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  plan_id uuid references public.plans (id) on delete set null,
  plan_day_id uuid references public.plan_days (id) on delete set null,
  day_name text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

alter table public.workout_sessions enable row level security;

create policy "Acceso abierto a sesiones"
  on public.workout_sessions for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Registro de series (reps/peso reales que hiciste)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  plan_exercise_id uuid references public.plan_exercises (id) on delete set null,
  exercise_id text not null,
  exercise_name text not null default '',
  set_index int not null default 0,
  reps_done int,
  weight_kg numeric,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.workout_set_logs enable row level security;

create policy "Acceso abierto a registros de series"
  on public.workout_set_logs for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Indices utiles
-- ---------------------------------------------------------------------------
create index if not exists idx_plans_owner on public.plans (owner);
create index if not exists idx_plan_days_plan on public.plan_days (plan_id);
create index if not exists idx_plan_exercises_day on public.plan_exercises (plan_day_id);
create index if not exists idx_sessions_owner on public.workout_sessions (owner);
create index if not exists idx_set_logs_session on public.workout_set_logs (session_id);
