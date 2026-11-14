-- Institutional integration foundation for Angola emergency and public-safety services.
create table if not exists angola_agritech.emergency_institutions (
 id uuid primary key default gen_random_uuid(),
 institution_code text not null unique,
 name text not null,
 institution_type text not null check (institution_type in ('police','civil_protection_fire','health_emergency','hospital','armed_forces','red_cross','maritime','aviation','local_administration','utilities','other')),
 jurisdiction_level text not null default 'national' check (jurisdiction_level in ('national','provincial','municipal','local')),
 integration_status text not null default 'proposed' check (integration_status in ('proposed','under_review','approved','sandbox','active','suspended')),
 official_website text,
 official_source_url text,
 mandate_notes text,
 agreement_reference text,
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (integration_status not in ('approved','sandbox','active') or (approved_at is not null and agreement_reference is not null))
);

create table if not exists angola_agritech.institution_territorial_scopes (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references angola_agritech.emergency_institutions(id) on delete cascade,
 province_id uuid references angola_agritech.provinces(id),
 municipality_id uuid references angola_agritech.municipalities(id),
 commune_id uuid references angola_agritech.communes(id),
 scope_status text not null default 'proposed' check(scope_status in ('proposed','validated','inactive')),
 source_reference text,
 validated_by uuid references auth.users(id),
 validated_at timestamptz,
 created_at timestamptz not null default now(),
 check (scope_status <> 'validated' or (validated_by is not null and validated_at is not null))
);

create table if not exists angola_agritech.institution_user_assignments (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references angola_agritech.emergency_institutions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role_code text not null check(role_code in ('institution_liaison','operator','dispatcher','incident_commander','observer','integration_admin')),
 province_id uuid references angola_agritech.provinces(id),
 municipality_id uuid references angola_agritech.municipalities(id),
 commune_id uuid references angola_agritech.communes(id),
 is_active boolean not null default false,
 granted_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(institution_id,user_id,role_code,province_id,municipality_id,commune_id)
);

create table if not exists angola_agritech.institution_integration_channels (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references angola_agritech.emergency_institutions(id) on delete cascade,
 channel_code text not null,
 channel_type text not null check(channel_type in ('secure_api','signed_webhook','secure_file_exchange','manual_portal','radio_gateway','cell_broadcast_gateway','sms_gateway','other')),
 environment text not null default 'planning' check(environment in ('planning','sandbox','production')),
 status text not null default 'proposed' check(status in ('proposed','under_review','configured','tested','active','suspended','retired')),
 auth_method text check(auth_method in ('oauth2_client_credentials','mutual_tls','signed_request','vpn_private_link','manual_account','other')),
 endpoint_url text,
 data_contract_version text,
 agreement_reference text,
 security_reviewed_at timestamptz,
 tested_at timestamptz,
 activated_at timestamptz,
 last_success_at timestamptz,
 last_failure_at timestamptz,
 last_failure_code text,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(institution_id,channel_code),
 check(status <> 'active' or (environment='production' and agreement_reference is not null and security_reviewed_at is not null and tested_at is not null and activated_at is not null))
);

create table if not exists angola_agritech.emergency_dispatch_requests (
 id uuid primary key default gen_random_uuid(),
 request_code text not null unique,
 alert_id uuid references angola_agritech.emergency_alerts(id),
 occurrence_id uuid references angola_agritech.territorial_occurrences(id),
 source_institution_id uuid references angola_agritech.emergency_institutions(id),
 requested_service text not null check(requested_service in ('police','fire_rescue','ambulance','hospital_bed','search_rescue','evacuation','civil_protection','military_support','maritime_rescue','utilities','other')),
 urgency text not null check(urgency in ('routine','urgent','immediate')),
 title text not null,
 incident_description text not null,
 province_id uuid not null references angola_agritech.provinces(id),
 municipality_id uuid references angola_agritech.municipalities(id),
 commune_id uuid references angola_agritech.communes(id),
 locality_description text,
 latitude numeric(10,7),
 longitude numeric(10,7),
 people_affected_estimate integer check(people_affected_estimate is null or people_affected_estimate>=0),
 safe_contact_channel text,
 status text not null default 'draft' check(status in ('draft','submitted','triaged','assigned','accepted','rejected','in_progress','resolved','closed','cancelled')),
 created_by uuid not null references auth.users(id),
 submitted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create table if not exists angola_agritech.emergency_dispatch_assignments (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references angola_agritech.emergency_dispatch_requests(id) on delete cascade,
 institution_id uuid not null references angola_agritech.emergency_institutions(id),
 assigned_by uuid not null references auth.users(id),
 assignment_status text not null default 'sent' check(assignment_status in ('sent','acknowledged','accepted','rejected','en_route','on_scene','completed','cancelled')),
 assigned_at timestamptz not null default now(),
 acknowledged_at timestamptz,
 accepted_at timestamptz,
 completed_at timestamptz,
 response_summary text,
 external_case_reference text,
 unique(request_id,institution_id)
);

create table if not exists angola_agritech.emergency_resource_registry (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references angola_agritech.emergency_institutions(id),
 resource_code text not null,
 resource_type text not null check(resource_type in ('ambulance','fire_engine','rescue_vehicle','police_unit','boat','helicopter','medical_team','search_rescue_team','shelter','other')),
 province_id uuid not null references angola_agritech.provinces(id),
 municipality_id uuid references angola_agritech.municipalities(id),
 commune_id uuid references angola_agritech.communes(id),
 operational_status text not null default 'unknown' check(operational_status in ('available','deployed','maintenance','unavailable','unknown')),
 capacity_count integer check(capacity_count is null or capacity_count>=0),
 last_status_at timestamptz,
 status_source text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(institution_id,resource_code)
);

create table if not exists angola_agritech.integration_event_audit (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid references angola_agritech.emergency_institutions(id),
 channel_id uuid references angola_agritech.institution_integration_channels(id),
 event_direction text not null check(event_direction in ('inbound','outbound','internal')),
 event_type text not null,
 external_event_reference text,
 payload_sha256 text,
 processing_status text not null default 'received' check(processing_status in ('received','validated','rejected','processed','failed')),
 error_code text,
 received_at timestamptz not null default now(),
 processed_at timestamptz,
 correlation_id uuid,
 unique(institution_id,external_event_reference)
);

create index if not exists idx_institution_assignments_user_active on angola_agritech.institution_user_assignments(user_id,is_active);
create index if not exists idx_dispatch_scope_status on angola_agritech.emergency_dispatch_requests(province_id,municipality_id,status,created_at desc);
create index if not exists idx_dispatch_assignment_institution_status on angola_agritech.emergency_dispatch_assignments(institution_id,assignment_status);
create index if not exists idx_resource_scope_type_status on angola_agritech.emergency_resource_registry(province_id,municipality_id,resource_type,operational_status);
create index if not exists idx_integration_audit_received on angola_agritech.integration_event_audit(received_at desc);

alter table angola_agritech.emergency_institutions enable row level security;
alter table angola_agritech.institution_territorial_scopes enable row level security;
alter table angola_agritech.institution_user_assignments enable row level security;
alter table angola_agritech.institution_integration_channels enable row level security;
alter table angola_agritech.emergency_dispatch_requests enable row level security;
alter table angola_agritech.emergency_dispatch_assignments enable row level security;
alter table angola_agritech.emergency_resource_registry enable row level security;
alter table angola_agritech.integration_event_audit enable row level security;

create policy emergency_institutions_read_authenticated on angola_agritech.emergency_institutions for select to authenticated using (true);
create policy emergency_institutions_manage_national on angola_agritech.emergency_institutions for all to authenticated using (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin')) with check (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));

create policy institution_scopes_read_scope on angola_agritech.institution_territorial_scopes for select to authenticated using (province_id is null or angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy institution_scopes_manage_scope on angola_agritech.institution_territorial_scopes for all to authenticated using (province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin') or province_id is not null and angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check (province_id is null and exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin') or province_id is not null and angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

create policy institution_assignments_read_self_or_scope on angola_agritech.institution_user_assignments for select to authenticated using (user_id=(select auth.uid()) or (province_id is not null and angola_agritech.can_access_scope(province_id,municipality_id,commune_id)) or exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));
create policy institution_assignments_manage_national on angola_agritech.institution_user_assignments for all to authenticated using (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin')) with check (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));

create policy integration_channels_read_scope on angola_agritech.institution_integration_channels for select to authenticated using (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));
create policy integration_channels_manage_national on angola_agritech.institution_integration_channels for all to authenticated using (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin')) with check (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));

create policy dispatch_requests_read_scope on angola_agritech.emergency_dispatch_requests for select to authenticated using (angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy dispatch_requests_insert_scope on angola_agritech.emergency_dispatch_requests for insert to authenticated with check (created_by=(select auth.uid()) and angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy dispatch_requests_update_scope on angola_agritech.emergency_dispatch_requests for update to authenticated using (angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check (angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

create policy dispatch_assignments_read_scope on angola_agritech.emergency_dispatch_assignments for select to authenticated using (exists(select 1 from angola_agritech.emergency_dispatch_requests r where r.id=request_id and angola_agritech.can_access_scope(r.province_id,r.municipality_id,r.commune_id)) or exists(select 1 from angola_agritech.institution_user_assignments ua where ua.institution_id=emergency_dispatch_assignments.institution_id and ua.user_id=(select auth.uid()) and ua.is_active));
create policy dispatch_assignments_manage_scope on angola_agritech.emergency_dispatch_assignments for all to authenticated using (exists(select 1 from angola_agritech.emergency_dispatch_requests r where r.id=request_id and angola_agritech.can_manage_scope(r.province_id,r.municipality_id,r.commune_id))) with check (exists(select 1 from angola_agritech.emergency_dispatch_requests r where r.id=request_id and angola_agritech.can_manage_scope(r.province_id,r.municipality_id,r.commune_id)));

create policy resource_registry_read_scope on angola_agritech.emergency_resource_registry for select to authenticated using (angola_agritech.can_access_scope(province_id,municipality_id,commune_id));
create policy resource_registry_manage_scope on angola_agritech.emergency_resource_registry for all to authenticated using (angola_agritech.can_manage_scope(province_id,municipality_id,commune_id)) with check (angola_agritech.can_manage_scope(province_id,municipality_id,commune_id));

create policy integration_audit_read_national on angola_agritech.integration_event_audit for select to authenticated using (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));
create policy integration_audit_insert_authenticated on angola_agritech.integration_event_audit for insert to authenticated with check (exists(select 1 from angola_agritech.administrative_scope_assignments s where s.user_id=(select auth.uid()) and s.is_active and s.role_code='national_admin'));

grant select,insert,update,delete on angola_agritech.emergency_institutions to authenticated;
grant select,insert,update,delete on angola_agritech.institution_territorial_scopes to authenticated;
grant select,insert,update,delete on angola_agritech.institution_user_assignments to authenticated;
grant select,insert,update,delete on angola_agritech.institution_integration_channels to authenticated;
grant select,insert,update,delete on angola_agritech.emergency_dispatch_requests to authenticated;
grant select,insert,update,delete on angola_agritech.emergency_dispatch_assignments to authenticated;
grant select,insert,update,delete on angola_agritech.emergency_resource_registry to authenticated;
grant select,insert,update,delete on angola_agritech.integration_event_audit to authenticated;

insert into angola_agritech.emergency_institutions(institution_code,name,institution_type,jurisdiction_level,integration_status,official_website,official_source_url,mandate_notes)
values
('AO-MININT-PNA','Polícia Nacional de Angola','police','national','proposed','https://minint.gov.ao','https://minint.gov.ao/web/estrutura-organica','Entidade a contactar para definir o protocolo e o âmbito de integração.'),
('AO-SPCB','Serviço de Protecção Civil e Bombeiros','civil_protection_fire','national','proposed','https://spcb.gov.ao','https://spcb.gov.ao/spcb/contactos','Entidade central de coordenação operacional e protecção civil.'),
('AO-INEMA','Instituto Nacional de Emergência Médica de Angola','health_emergency','national','proposed',null,'https://lex.ao/docs/presidente-da-republica/2023/decreto-presidencial-n-o-96-23-de-06-de-abril/','Serviço de emergência médica; confirmar entidade, interface e protocolo aplicáveis.'),
('AO-MINSA','Ministério da Saúde / serviços de saúde','health_emergency','national','proposed',null,null,'Articulação sectorial a formalizar com a tutela da saúde.'),
('AO-HOSP-PUBLIC','Hospitais públicos de referência','hospital','national','proposed',null,'https://lex.ao/docs/presidente-da-republica/2023/decreto-presidencial-n-o-96-23-de-06-de-abril/','Registo institucional agregado; cada unidade hospitalar deverá ser validada antes da activação.'),
('AO-FAA','Forças Armadas Angolanas','armed_forces','national','proposed',null,'https://lex.ao/docs/assembleia-nacional/2020/lei-n-o-14-20-de-22-de-maio/','Cooperação apenas nos termos legais e mediante autorização competente.'),
('AO-CRUZ-VERMELHA','Cruz Vermelha de Angola','red_cross','national','proposed',null,'https://lex.ao/docs/presidente-da-republica/2023/decreto-presidencial-n-o-96-23-de-06-de-abril/','Parceiro de cooperação humanitária sujeito a protocolo.'),
('AO-MARITIME','Serviços marítimos e autoridade marítima','maritime','national','proposed',null,'https://lex.ao/docs/presidente-da-republica/2023/decreto-presidencial-n-o-96-23-de-06-de-abril/','Busca e salvamento marítimo, conforme competências próprias.'),
('AO-AVIATION','Serviços aeronáuticos e busca e salvamento','aviation','national','proposed',null,'https://lex.ao/docs/presidente-da-republica/2023/decreto-presidencial-n-o-96-23-de-06-de-abril/','Coordenação de busca e salvamento aeronáutico, conforme competências próprias.'),
('AO-LOCAL-ADMIN','Administrações locais do Estado','local_administration','national','proposed',null,null,'Coordenação territorial, logística, abrigos e assistência local.')
on conflict(institution_code) do update set name=excluded.name,institution_type=excluded.institution_type,official_website=excluded.official_website,official_source_url=excluded.official_source_url,mandate_notes=excluded.mandate_notes,updated_at=now();
