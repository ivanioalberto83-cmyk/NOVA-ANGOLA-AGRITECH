-- NOVA ANGOLA AGRITECH: national territorial atlas
-- Administrative names seeded from Lei n.º 14/24. Internal codes are not official government codes.
-- Municipality/commune names and harvest-region mappings are deliberately not fabricated.

alter table angola_agritech.provinces
  add column if not exists code_system text not null default 'NOVA_INTERNAL',
  add column if not exists source_authority text,
  add column if not exists source_reference text,
  add column if not exists effective_from date,
  add column if not exists effective_to date;

alter table angola_agritech.municipalities
  add column if not exists code_system text not null default 'NOVA_INTERNAL',
  add column if not exists source_authority text,
  add column if not exists source_reference text,
  add column if not exists effective_from date,
  add column if not exists effective_to date;

create table if not exists angola_agritech.communes (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  code text not null,
  name text not null,
  code_system text not null default 'NOVA_INTERNAL',
  boundary_geojson jsonb,
  source_authority text,
  source_reference text,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  constraint communes_code_per_municipality_key unique (municipality_id, code),
  constraint communes_name_per_municipality_key unique (municipality_id, name),
  constraint communes_boundary_object check (boundary_geojson is null or jsonb_typeof(boundary_geojson) = 'object'),
  constraint communes_effective_dates_check check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists angola_agritech.harvest_regions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  classification text not null,
  classification_version text not null,
  source_authority text not null,
  source_reference text,
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint harvest_regions_code_version_key unique (code, classification, classification_version),
  constraint harvest_regions_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint harvest_regions_valid_dates_check check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists angola_agritech.province_harvest_regions (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references angola_agritech.provinces(id) on delete restrict,
  harvest_region_id uuid not null references angola_agritech.harvest_regions(id) on delete restrict,
  mapping_status text not null default 'pending_review'
    check (mapping_status in ('confirmed','pending_review','historical')),
  source_authority text,
  source_reference text,
  valid_from date,
  valid_to date,
  notes text,
  created_at timestamptz not null default now(),
  constraint province_harvest_region_dates_check check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create unique index if not exists province_harvest_regions_unique_active
  on angola_agritech.province_harvest_regions(province_id, harvest_region_id, coalesce(valid_from, date '0001-01-01'));

create table if not exists angola_agritech.crop_production_statistics (
  id uuid primary key default gen_random_uuid(),
  reporting_year integer not null check (reporting_year between 1900 and 2200),
  reporting_period text,
  crop_id uuid not null references angola_agritech.crop_catalog(id) on delete restrict,
  province_id uuid references angola_agritech.provinces(id) on delete restrict,
  municipality_id uuid references angola_agritech.municipalities(id) on delete restrict,
  commune_id uuid references angola_agritech.communes(id) on delete restrict,
  area_sown_hectares numeric(16,2) check (area_sown_hectares is null or area_sown_hectares >= 0),
  area_harvested_hectares numeric(16,2) check (area_harvested_hectares is null or area_harvested_hectares >= 0),
  production_tonnes numeric(18,2) check (production_tonnes is null or production_tonnes >= 0),
  yield_tonnes_per_hectare numeric(12,4) check (yield_tonnes_per_hectare is null or yield_tonnes_per_hectare >= 0),
  losses_tonnes numeric(18,2) check (losses_tonnes is null or losses_tonnes >= 0),
  source_authority text not null,
  source_document text,
  source_reference text,
  source_record_id text,
  publication_date date,
  validation_status text not null default 'unverified'
    check (validation_status in ('unverified','verified','estimated','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint crop_production_one_admin_level check (num_nonnulls(province_id, municipality_id, commune_id) = 1),
  constraint crop_production_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists communes_municipality_idx on angola_agritech.communes(municipality_id);
create index if not exists province_harvest_regions_region_idx on angola_agritech.province_harvest_regions(harvest_region_id);
create index if not exists crop_production_year_crop_idx on angola_agritech.crop_production_statistics(reporting_year, crop_id);
create index if not exists crop_production_province_idx on angola_agritech.crop_production_statistics(province_id) where province_id is not null;
create index if not exists crop_production_municipality_idx on angola_agritech.crop_production_statistics(municipality_id) where municipality_id is not null;
create index if not exists crop_production_commune_idx on angola_agritech.crop_production_statistics(commune_id) where commune_id is not null;

alter table angola_agritech.communes enable row level security;
alter table angola_agritech.harvest_regions enable row level security;
alter table angola_agritech.province_harvest_regions enable row level security;
alter table angola_agritech.crop_production_statistics enable row level security;

insert into angola_agritech.provinces (code, name, code_system, source_authority, source_reference, effective_from)
values
 ('NAAT-PR-001','Bengo','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-002','Benguela','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-003','Bié','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-004','Cabinda','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-005','Cuando','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-006','Cubango','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-007','Cuanza-Norte','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-008','Cuanza-Sul','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-009','Cunene','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-010','Huambo','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-011','Huíla','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-012','Icolo e Bengo','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-013','Luanda','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-014','Lunda-Norte','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-015','Lunda-Sul','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-016','Malanje','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-017','Moxico','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-018','Moxico Leste','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-019','Namibe','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-020','Uíge','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05'),
 ('NAAT-PR-021','Zaire','NOVA_INTERNAL','Diário da República de Angola','Lei n.º 14/24, de 5 de Setembro','2024-09-05')
on conflict (name) do nothing;

insert into angola_agritech.harvest_regions
  (code, name, classification, classification_version, source_authority, source_reference, metadata)
values
 ('NORTE','Norte','INE statistical region','ICAPP 2023/2024','Instituto Nacional de Estatística','ICAPP 2023/2024','{"status":"historical_reference","note":"Agrupamento estatístico histórico; não aplicar automaticamente à nova divisão de 21 províncias."}'),
 ('CENTRO','Centro','INE statistical region','ICAPP 2023/2024','Instituto Nacional de Estatística','ICAPP 2023/2024','{"status":"historical_reference","note":"Agrupamento estatístico histórico; não aplicar automaticamente à nova divisão de 21 províncias."}'),
 ('LESTE','Leste','INE statistical region','ICAPP 2023/2024','Instituto Nacional de Estatística','ICAPP 2023/2024','{"status":"historical_reference","note":"Agrupamento estatístico histórico; não aplicar automaticamente à nova divisão de 21 províncias."}'),
 ('SUL','Sul','INE statistical region','ICAPP 2023/2024','Instituto Nacional de Estatística','ICAPP 2023/2024','{"status":"historical_reference","note":"Agrupamento estatístico histórico; não aplicar automaticamente à nova divisão de 21 províncias."}')
on conflict (code, classification, classification_version) do nothing;
