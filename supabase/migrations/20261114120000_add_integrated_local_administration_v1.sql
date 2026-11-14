-- NOVA ANGOLA AGRITECH: Administração territorial integrada
-- Sem dados fictícios. Âmbitos administrativos são atribuídos explicitamente a utilizadores.
create table if not exists angola_agritech.administrative_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null check (role_code in ('national_admin','provincial_admin','municipal_admin','communal_admin','territorial_technician','territorial_reader')),
  province_id uuid references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint administrative_scope_shape_ck check (
    (role_code='national_admin' and province_id is null and municipality_id is null and commune_id is null) or
    (role_code='provincial_admin' and province_id is not null and municipality_id is null and commune_id is null) or
    (role_code in ('municipal_admin','territorial_technician','territorial_reader') and municipality_id is not null and commune_id is null) or
    (role_code='communal_admin' and commune_id is not null)
  )
);
create index if not exists administrative_scope_user_idx on angola_agritech.administrative_scope_assignments(user_id,is_active);

create table if not exists angola_agritech.localities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  locality_type text not null check (locality_type in ('bairro','aldeia','povoacao','vila','cidade','sede_municipal','sede_comunal','outro')),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  latitude numeric(10,7) check(latitude between -90 and 90),
  longitude numeric(10,7) check(longitude between -180 and 180),
  population_estimate integer check(population_estimate is null or population_estimate>=0),
  source_authority text,
  source_reference text,
  validation_status text not null default 'pending_review' check(validation_status in ('pending_review','field_verified','official','rejected')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists localities_admin_idx on angola_agritech.localities(province_id,municipality_id,commune_id);
create index if not exists localities_name_idx on angola_agritech.localities using gin(to_tsvector('simple',name));

create table if not exists angola_agritech.public_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  facility_type text not null check(facility_type in ('school','health','water','energy','road','bridge','market','warehouse','telecom','sanitation','security','other')),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  locality_id uuid references angola_agritech.localities(id) on delete set null,
  latitude numeric(10,7) check(latitude between -90 and 90),
  longitude numeric(10,7) check(longitude between -180 and 180),
  operational_status text not null default 'unknown' check(operational_status in ('operational','partial','not_operational','under_construction','unknown')),
  capacity numeric(14,2),
  responsible_entity text,
  source_authority text,
  source_reference text,
  last_verified_at date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists public_facilities_admin_idx on angola_agritech.public_facilities(province_id,municipality_id,commune_id);

create table if not exists angola_agritech.population_statistics (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  reference_year integer not null check(reference_year between 1900 and 2200),
  population_total bigint check(population_total is null or population_total>=0),
  households_total bigint check(households_total is null or households_total>=0),
  male_total bigint check(male_total is null or male_total>=0),
  female_total bigint check(female_total is null or female_total>=0),
  source_authority text not null,
  source_reference text,
  validation_status text not null default 'pending_review' check(validation_status in ('pending_review','verified','official','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(province_id,municipality_id,commune_id,reference_year)
);

create table if not exists angola_agritech.territorial_occurrences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  occurrence_type text not null check(occurrence_type in ('water','road','education','health','energy','agriculture','drought','flood','erosion','sanitation','security','other')),
  priority text not null default 'medium' check(priority in ('low','medium','high','urgent')),
  status text not null default 'open' check(status in ('open','assigned','in_progress','resolved','closed','rejected')),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  locality_id uuid references angola_agritech.localities(id) on delete set null,
  latitude numeric(10,7) check(latitude between -90 and 90),
  longitude numeric(10,7) check(longitude between -180 and 180),
  estimated_cost_aoa numeric(18,2) check(estimated_cost_aoa is null or estimated_cost_aoa>=0),
  responsible_entity text,
  evidence jsonb not null default '{}'::jsonb,
  reported_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists territorial_occurrences_scope_idx on angola_agritech.territorial_occurrences(province_id,municipality_id,commune_id,status);

create table if not exists angola_agritech.municipal_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique,
  name text not null,
  description text,
  sector text not null check(sector in ('agriculture','water','health','education','energy','roads','housing','sanitation','environment','other')),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  estimated_budget_aoa numeric(18,2) check(estimated_budget_aoa is null or estimated_budget_aoa>=0),
  approved_budget_aoa numeric(18,2) check(approved_budget_aoa is null or approved_budget_aoa>=0),
  physical_progress_percent numeric(5,2) not null default 0 check(physical_progress_percent between 0 and 100),
  financial_progress_percent numeric(5,2) not null default 0 check(financial_progress_percent between 0 and 100),
  status text not null default 'proposed' check(status in ('proposed','approved','in_progress','suspended','completed','cancelled')),
  funding_source text,
  implementing_entity text,
  start_date date,
  expected_end_date date,
  source_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists municipal_projects_scope_idx on angola_agritech.municipal_projects(province_id,municipality_id,commune_id,status);

create or replace function angola_agritech.can_access_scope(p_province uuid,p_municipality uuid default null,p_commune uuid default null)
returns boolean language sql stable security definer set search_path=angola_agritech,public
as $$
 select exists (
  select 1 from angola_agritech.administrative_scope_assignments s
  where s.user_id=auth.uid() and s.is_active
   and (s.role_code='national_admin'
    or (s.province_id is not null and s.province_id=p_province and s.municipality_id is null)
    or (s.municipality_id is not null and s.municipality_id=p_municipality and s.commune_id is null)
    or (s.commune_id is not null and s.commune_id=p_commune))
 );
$$;
create or replace function angola_agritech.can_manage_scope(p_province uuid,p_municipality uuid default null,p_commune uuid default null)
returns boolean language sql stable security definer set search_path=angola_agritech,public
as $$
 select exists (
  select 1 from angola_agritech.administrative_scope_assignments s
  where s.user_id=auth.uid() and s.is_active
   and (s.role_code='national_admin'
    or (s.role_code in ('provincial_admin') and s.province_id=p_province)
    or (s.role_code='municipal_admin' and s.municipality_id=p_municipality)
    or (s.role_code='communal_admin' and s.commune_id=p_commune)
    or (s.role_code='territorial_technician' and
       ((s.municipality_id is not null and s.municipality_id=p_municipality) or (s.commune_id is not null and s.commune_id=p_commune))))
 );
$$;
alter table angola_agritech.administrative_scope_assignments enable row level security;
alter table angola_agritech.localities enable row level security;
alter table angola_agritech.public_facilities enable row level security;
alter table angola_agritech.population_statistics enable row level security;
alter table angola_agritech.territorial_occurrences enable row level security;
alter table angola_agritech.municipal_projects enable row level security;

drop policy if exists scope_assignments_read_self on angola_agritech.administrative_scope_assignments;
create policy scope_assignments_read_self on angola_agritech.administrative_scope_assignments for select to authenticated using(user_id=auth.uid());
drop policy if exists localities_read_scope on angola_agritech.localities;
create policy localities_read_scope on angola_agritech.localities for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
drop policy if exists localities_insert_scope on angola_agritech.localities;
create policy localities_insert_scope on angola_agritech.localities for insert to authenticated with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
drop policy if exists localities_update_scope on angola_agritech.localities;
create policy localities_update_scope on angola_agritech.localities for update to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
drop policy if exists facilities_read_scope on angola_agritech.public_facilities;
create policy facilities_read_scope on angola_agritech.public_facilities for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
drop policy if exists facilities_write_scope on angola_agritech.public_facilities;
create policy facilities_write_scope on angola_agritech.public_facilities for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
drop policy if exists population_read_scope on angola_agritech.population_statistics;
create policy population_read_scope on angola_agritech.population_statistics for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
drop policy if exists population_write_scope on angola_agritech.population_statistics;
create policy population_write_scope on angola_agritech.population_statistics for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
drop policy if exists occurrences_read_scope on angola_agritech.territorial_occurrences;
create policy occurrences_read_scope on angola_agritech.territorial_occurrences for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
drop policy if exists occurrences_insert_scope on angola_agritech.territorial_occurrences;
create policy occurrences_insert_scope on angola_agritech.territorial_occurrences for insert to authenticated with check(angola_agritech.can_access_scope(province_id,municipality_id,commune_id) and reported_by=auth.uid());
drop policy if exists occurrences_update_scope on angola_agritech.territorial_occurrences;
create policy occurrences_update_scope on angola_agritech.territorial_occurrences for update to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
drop policy if exists projects_read_scope on angola_agritech.municipal_projects;
create policy projects_read_scope on angola_agritech.municipal_projects for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
drop policy if exists projects_write_scope on angola_agritech.municipal_projects;
create policy projects_write_scope on angola_agritech.municipal_projects for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

grant usage on schema angola_agritech to authenticated;
grant select on angola_agritech.administrative_scope_assignments,angola_agritech.localities,angola_agritech.public_facilities,angola_agritech.population_statistics,angola_agritech.territorial_occurrences,angola_agritech.municipal_projects to authenticated;
grant insert,update on angola_agritech.localities,angola_agritech.public_facilities,angola_agritech.population_statistics,angola_agritech.territorial_occurrences,angola_agritech.municipal_projects to authenticated;
comment on table angola_agritech.localities is 'Cadastro de localidades; classificação e coordenadas requerem fonte e validação, não são inferidas automaticamente.';
comment on table angola_agritech.public_facilities is 'Inventário georreferenciado de infraestruturas e serviços públicos, com estado e proveniência.';
comment on table angola_agritech.population_statistics is 'Indicadores demográficos com ano, fonte e estado de validação.';
comment on table angola_agritech.territorial_occurrences is 'Registo e acompanhamento de problemas e necessidades territoriais.';
comment on table angola_agritech.municipal_projects is 'Carteira de projectos e investimentos locais com progresso físico e financeiro.';
