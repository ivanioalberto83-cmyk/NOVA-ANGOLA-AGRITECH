-- NOVA ANGOLA: Demografia, riscos e protecção civil (fundação institucional)
-- Dados agregados; não armazenar dados pessoais de vítimas nesta camada.
alter table angola_agritech.population_statistics
  add column if not exists births_total bigint check (births_total is null or births_total >= 0),
  add column if not exists deaths_total bigint check (deaths_total is null or deaths_total >= 0),
  add column if not exists births_registered bigint check (births_registered is null or births_registered >= 0),
  add column if not exists population_urban bigint check (population_urban is null or population_urban >= 0),
  add column if not exists population_rural bigint check (population_rural is null or population_rural >= 0),
  add column if not exists net_migration bigint,
  add column if not exists age_distribution jsonb not null default '{}'::jsonb,
  add column if not exists data_period text,
  add column if not exists methodology text;

create table if not exists angola_agritech.territorial_area_metrics (
 id uuid primary key default gen_random_uuid(),
 province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 area_km2 numeric(14,3) not null check(area_km2 > 0),
 boundary_source text not null,
 boundary_reference text not null,
 validation_status text not null default 'pending_review' check(validation_status in ('pending_review','verified','official','rejected')),
 valid_from date,
 valid_to date,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(province_id,municipality_id,commune_id)
);

create table if not exists angola_agritech.risk_assessments (
 id uuid primary key default gen_random_uuid(),
 hazard_type text not null check(hazard_type in ('flood','flash_flood','drought','wildfire','storm','landslide','coastal_erosion','heatwave','epidemic','dam_failure','other')),
 risk_level text not null check(risk_level in ('low','moderate','high','very_high','critical')),
 status text not null default 'monitoring' check(status in ('monitoring','confirmed','escalated','closed','false_positive')),
 province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 locality_id uuid references angola_agritech.localities(id) on delete set null,
 observed_at timestamptz not null,
 forecast_start timestamptz,
 forecast_end timestamptz,
 probability_percent numeric(5,2) check(probability_percent between 0 and 100),
 confidence_percent numeric(5,2) check(confidence_percent between 0 and 100),
 exposed_population_estimate bigint check(exposed_population_estimate is null or exposed_population_estimate>=0),
 evidence_sources jsonb not null default '[]'::jsonb,
 geometry_geojson jsonb,
 source_authority text not null,
 source_reference text,
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists risk_assessments_scope_time_idx on angola_agritech.risk_assessments(province_id,municipality_id,observed_at desc);
create index if not exists risk_assessments_active_idx on angola_agritech.risk_assessments(status,risk_level,forecast_end);

create table if not exists angola_agritech.emergency_alerts (
 id uuid primary key default gen_random_uuid(),
 alert_code text not null unique,
 title text not null,
 message text not null,
 hazard_type text not null check(hazard_type in ('flood','flash_flood','drought','wildfire','storm','landslide','coastal_erosion','heatwave','epidemic','dam_failure','other')),
 alert_level text not null check(alert_level in ('advisory','watch','warning','emergency')),
 status text not null default 'draft' check(status in ('draft','pending_approval','approved','issued','cancelled','expired')),
 province_id uuid references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 target_geometry_geojson jsonb,
 instructions jsonb not null default '{}'::jsonb,
 source_risk_assessment_id uuid references angola_agritech.risk_assessments(id) on delete set null,
 created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
 approved_at timestamptz,
 issued_at timestamptz,
 issued_by uuid references auth.users(id) on delete set null,
 expires_at timestamptz,
 cancellation_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((municipality_id is null and commune_id is null) or province_id is not null),
 check (commune_id is null or municipality_id is not null)
);
create index if not exists emergency_alerts_status_idx on angola_agritech.emergency_alerts(status,alert_level,created_at desc);

create table if not exists angola_agritech.emergency_alert_approvals (
 id uuid primary key default gen_random_uuid(),
 alert_id uuid not null references angola_agritech.emergency_alerts(id) on delete cascade,
 approver_user_id uuid not null references auth.users(id) on delete restrict,
 decision text not null check(decision in ('approve','reject')),
 decision_note text,
 decided_at timestamptz not null default now(),
 unique(alert_id,approver_user_id)
);

create table if not exists angola_agritech.evacuation_shelters (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 shelter_type text not null check(shelter_type in ('school','sports_hall','community_center','health_facility','temporary_camp','other')),
 province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 locality_id uuid references angola_agritech.localities(id) on delete set null,
 latitude numeric(10,7) check(latitude between -90 and 90),
 longitude numeric(10,7) check(longitude between -180 and 180),
 capacity_people integer check(capacity_people is null or capacity_people>=0),
 accessible boolean,
 water_available boolean,
 sanitation_available boolean,
 medical_support boolean,
 operational_status text not null default 'unverified' check(operational_status in ('unverified','available','full','closed','damaged')),
 last_inspected_at date,
 managing_authority text,
 source_reference text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists angola_agritech.evacuation_routes (
 id uuid primary key default gen_random_uuid(),
 route_name text not null,
 province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 origin_description text not null,
 destination_shelter_id uuid references angola_agritech.evacuation_shelters(id) on delete set null,
 route_geojson jsonb not null,
 route_status text not null default 'unverified' check(route_status in ('unverified','safe','restricted','blocked','closed')),
 verified_by uuid references auth.users(id) on delete set null,
 verified_at timestamptz,
 verification_source text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists angola_agritech.evacuation_operations (
 id uuid primary key default gen_random_uuid(),
 operation_code text not null unique,
 alert_id uuid references angola_agritech.emergency_alerts(id) on delete set null,
 province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
 municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
 commune_id uuid references angola_agritech.communes(id) on delete restrict,
 operation_status text not null default 'planned' check(operation_status in ('planned','authorised','active','suspended','completed','cancelled')),
 authorised_by uuid references auth.users(id) on delete set null,
 authorised_at timestamptz,
 people_evacuated_count bigint not null default 0 check(people_evacuated_count>=0),
 people_assisted_count bigint not null default 0 check(people_assisted_count>=0),
 households_assisted_count bigint not null default 0 check(households_assisted_count>=0),
 lead_authority text,
 operational_notes text,
 started_at timestamptz,
 ended_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists angola_agritech.emergency_notification_log (
 id uuid primary key default gen_random_uuid(),
 alert_id uuid not null references angola_agritech.emergency_alerts(id) on delete restrict,
 channel text not null check(channel in ('sms','cell_broadcast','mobile_push','radio','email',' siren','other')),
 provider_name text,
 provider_reference text,
 target_area_description text,
 recipients_targeted integer not null default 0 check(recipients_targeted>=0),
 recipients_delivered integer not null default 0 check(recipients_delivered>=0),
 recipients_failed integer not null default 0 check(recipients_failed>=0),
 delivery_status text not null default 'queued' check(delivery_status in ('queued','submitted','partial','delivered','failed')),
 sent_at timestamptz,
 delivery_report jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

-- RLS e privilégios mínimos: só utilizadores autenticados com âmbito territorial atribuído.
alter table angola_agritech.territorial_area_metrics enable row level security;
alter table angola_agritech.risk_assessments enable row level security;
alter table angola_agritech.emergency_alerts enable row level security;
alter table angola_agritech.emergency_alert_approvals enable row level security;
alter table angola_agritech.evacuation_shelters enable row level security;
alter table angola_agritech.evacuation_routes enable row level security;
alter table angola_agritech.evacuation_operations enable row level security;
alter table angola_agritech.emergency_notification_log enable row level security;

grant usage on schema angola_agritech to authenticated;
grant select,insert,update on angola_agritech.territorial_area_metrics to authenticated;
grant select,insert,update on angola_agritech.risk_assessments to authenticated;
grant select,insert,update on angola_agritech.emergency_alerts to authenticated;
grant select,insert on angola_agritech.emergency_alert_approvals to authenticated;
grant select,insert,update on angola_agritech.evacuation_shelters to authenticated;
grant select,insert,update on angola_agritech.evacuation_routes to authenticated;
grant select,insert,update on angola_agritech.evacuation_operations to authenticated;
grant select,insert on angola_agritech.emergency_notification_log to authenticated;
grant select,insert,update on angola_agritech.population_statistics to authenticated;

create policy area_metrics_read on angola_agritech.territorial_area_metrics for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy area_metrics_write on angola_agritech.territorial_area_metrics for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

create policy risk_assessments_read on angola_agritech.risk_assessments for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy risk_assessments_write on angola_agritech.risk_assessments for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

create policy emergency_alerts_read on angola_agritech.emergency_alerts for select to authenticated using(
 (province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin'))
 or (province_id is not null and angola_agritech.can_access_scope(province_id,municipality_id,commune_id))
);
create policy emergency_alerts_create on angola_agritech.emergency_alerts for insert to authenticated with check(
 created_by=auth.uid() and ((province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin')) or (province_id is not null and angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)))
);
create policy emergency_alerts_update on angola_agritech.emergency_alerts for update to authenticated using(
 (province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin'))
 or (province_id is not null and angola_agritech.can_manage_scope(province_id,municipality_id,commune_id))
) with check(
 (province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin'))
 or (province_id is not null and angola_agritech.can_manage_scope(province_id,municipality_id,commune_id))
);

create policy alert_approvals_read on angola_agritech.emergency_alert_approvals for select to authenticated using(exists(select 1 from angola_agritech.emergency_alerts a where a.id=alert_id and ((a.province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin')) or (a.province_id is not null and angola_agritech.can_access_scope(a.province_id,a.municipality_id,a.commune_id)))));
create policy alert_approvals_insert on angola_agritech.emergency_alert_approvals for insert to authenticated with check(approver_user_id=auth.uid() and decision in ('approve','reject') and exists(select 1 from angola_agritech.emergency_alerts a where a.id=alert_id and ((a.province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin')) or (a.province_id is not null and angola_agritech.can_manage_scope(a.province_id,a.municipality_id,a.commune_id)))));

create policy shelters_read on angola_agritech.evacuation_shelters for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy shelters_write on angola_agritech.evacuation_shelters for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
create policy routes_read on angola_agritech.evacuation_routes for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy routes_write on angola_agritech.evacuation_routes for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
create policy operations_read on angola_agritech.evacuation_operations for select to authenticated using(angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy operations_write on angola_agritech.evacuation_operations for all to authenticated using(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check(angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));
create policy notification_log_read on angola_agritech.emergency_notification_log for select to authenticated using(exists(select 1 from angola_agritech.emergency_alerts a where a.id=alert_id and ((a.province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin')) or (a.province_id is not null and angola_agritech.can_access_scope(a.province_id,a.municipality_id,a.commune_id)))));
create policy notification_log_insert on angola_agritech.emergency_notification_log for insert to authenticated with check(exists(select 1 from angola_agritech.emergency_alerts a where a.id=alert_id and ((a.province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=auth.uid() and s.is_active and s.role_code='national_admin')) or (a.province_id is not null and angola_agritech.can_manage_scope(a.province_id,a.municipality_id,a.commune_id)))));

-- Densidade apenas quando existir área territorial validada e população validada.
create or replace view angola_agritech.v_population_density
with (security_invoker=true) as
select p.province_id,p.municipality_id,p.commune_id,p.reference_year,p.population_total,
       a.area_km2,
       case when a.area_km2>0 and p.population_total is not null then round(p.population_total::numeric/a.area_km2,2) end as population_density_per_km2,
       p.source_authority,p.source_reference,p.validation_status as population_validation_status,
       a.validation_status as area_validation_status
from angola_agritech.population_statistics p
join angola_agritech.territorial_area_metrics a
 on a.province_id=p.province_id
 and a.municipality_id is not distinct from p.municipality_id
 and a.commune_id is not distinct from p.commune_id
where p.validation_status in ('verified','official') and a.validation_status in ('verified','official');
grant select on angola_agritech.v_population_density to authenticated;
