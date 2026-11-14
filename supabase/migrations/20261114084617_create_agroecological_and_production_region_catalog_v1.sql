create table if not exists angola_agritech.agricultural_data_sources (
  id uuid primary key default gen_random_uuid(),
  source_code text not null unique,
  title text not null,
  provider text not null,
  dataset_name text,
  dataset_version text,
  domain text not null check (domain in ('territorial','agroecological','soil','climate','water','land_cover','satellite','production','pests','food_security','other')),
  source_url text,
  license_or_terms text,
  methodology text,
  temporal_resolution text,
  spatial_resolution text,
  geographic_coverage text,
  publication_date date,
  retrieved_at timestamptz,
  validation_status text not null default 'pending_review'
    check (validation_status in ('pending_review','verified','restricted','deprecated')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists angola_agritech.agroecological_regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  classification_framework text not null,
  classification_version text not null,
  region_level text not null default 'national'
    check (region_level in ('national','subnational','local')),
  description text,
  boundary_geojson jsonb,
  primary_source_id uuid references angola_agritech.agricultural_data_sources(id) on delete restrict,
  source_authority text,
  source_reference text,
  valid_from date,
  valid_to date,
  status text not null default 'draft'
    check (status in ('draft','under_review','validated','retired')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agroecological_regions_boundary_geojson_check
    check (boundary_geojson is null or jsonb_typeof(boundary_geojson)='object'),
  constraint agroecological_regions_valid_dates_check
    check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists angola_agritech.agroecological_region_municipalities (
  id uuid primary key default gen_random_uuid(),
  agroecological_region_id uuid not null references angola_agritech.agroecological_regions(id) on delete cascade,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  overlap_percent numeric(7,4) check (overlap_percent is null or (overlap_percent >= 0 and overlap_percent <= 100)),
  mapping_method text not null default 'pending'
    check (mapping_method in ('spatial_intersection','official_source','expert_review','pending')),
  mapping_status text not null default 'pending_review'
    check (mapping_status in ('pending_review','confirmed','rejected')),
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  unique (agroecological_region_id, municipality_id)
);

create table if not exists angola_agritech.agricultural_production_regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  production_focus text,
  description text,
  boundary_geojson jsonb,
  primary_source_id uuid references angola_agritech.agricultural_data_sources(id) on delete restrict,
  source_authority text,
  source_reference text,
  classification_version text,
  valid_from date,
  valid_to date,
  status text not null default 'draft'
    check (status in ('draft','under_review','validated','retired')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agricultural_production_regions_boundary_geojson_check
    check (boundary_geojson is null or jsonb_typeof(boundary_geojson)='object'),
  constraint agricultural_production_regions_valid_dates_check
    check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists angola_agritech.agricultural_production_region_municipalities (
  id uuid primary key default gen_random_uuid(),
  production_region_id uuid not null references angola_agritech.agricultural_production_regions(id) on delete cascade,
  municipality_id uuid not null references angola_agritech.municipalities(id) on delete restrict,
  participation_type text not null default 'unclassified'
    check (participation_type in ('core','secondary','emerging','unclassified')),
  area_share_percent numeric(7,4)
    check (area_share_percent is null or (area_share_percent >= 0 and area_share_percent <= 100)),
  mapping_status text not null default 'pending_review'
    check (mapping_status in ('pending_review','confirmed','rejected')),
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  unique (production_region_id, municipality_id)
);

create table if not exists angola_agritech.agricultural_production_region_crops (
  id uuid primary key default gen_random_uuid(),
  production_region_id uuid not null references angola_agritech.agricultural_production_regions(id) on delete cascade,
  crop_id uuid not null references angola_agritech.crop_catalog(id) on delete restrict,
  production_role text not null default 'candidate'
    check (production_role in ('principal','secondary','candidate','historical')),
  evidence_status text not null default 'unverified'
    check (evidence_status in ('unverified','official_statistic','field_verified','remote_sensing_estimate')),
  valid_from_year integer check (valid_from_year is null or valid_from_year between 1900 and 2200),
  valid_to_year integer check (valid_to_year is null or valid_to_year between 1900 and 2200),
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  unique (production_region_id, crop_id, production_role),
  check (valid_to_year is null or valid_from_year is null or valid_to_year >= valid_from_year)
);

create index if not exists idx_agroecological_region_municipalities_municipality
  on angola_agritech.agroecological_region_municipalities(municipality_id);
create index if not exists idx_agricultural_production_region_municipalities_municipality
  on angola_agritech.agricultural_production_region_municipalities(municipality_id);
create index if not exists idx_agricultural_production_region_crops_crop
  on angola_agritech.agricultural_production_region_crops(crop_id);
create index if not exists idx_agricultural_data_sources_domain_status
  on angola_agritech.agricultural_data_sources(domain, validation_status);

alter table angola_agritech.agricultural_data_sources enable row level security;
alter table angola_agritech.agroecological_regions enable row level security;
alter table angola_agritech.agroecological_region_municipalities enable row level security;
alter table angola_agritech.agricultural_production_regions enable row level security;
alter table angola_agritech.agricultural_production_region_municipalities enable row level security;
alter table angola_agritech.agricultural_production_region_crops enable row level security;

comment on table angola_agritech.agroecological_regions is
  'Regiões agroecológicas derivadas de dados ambientais e metodologia documentada; distintas da divisão político-administrativa.';
comment on table angola_agritech.agricultural_production_regions is
  'Regiões de produção agrícola suportadas por estatística, cadastro de explorações, observação de campo e/ou dados de deteção remota validados.';
comment on table angola_agritech.agricultural_data_sources is
  'Catálogo de proveniência e qualidade das fontes usadas pelo NOVA ANGOLA AGRITECH.';
comment on column angola_agritech.agroecological_regions.boundary_geojson is
  'GeoJSON em EPSG:4326 até ativação e validação de PostGIS no projeto; não usar para análises espaciais métricas sem reprojeção.';
comment on column angola_agritech.agricultural_production_regions.boundary_geojson is
  'GeoJSON em EPSG:4326 até ativação e validação de PostGIS no projeto; não usar para análises espaciais métricas sem reprojeção.';
