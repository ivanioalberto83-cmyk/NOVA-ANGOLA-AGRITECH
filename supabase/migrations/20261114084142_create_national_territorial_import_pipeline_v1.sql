-- National territorial import pipeline for NOVA ANGOLA AGRITECH.
-- Source of truth: Lei n.º 8/25, de 16 de Setembro, Annex (Diário da República I Série n.º 176).
-- The official codes are staged and validated before they are promoted to the live territorial catalogue.
create table if not exists angola_agritech.territorial_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_title text not null default 'Lei n.º 8/25, de 16 de Setembro — Anexo',
  source_url text not null,
  source_reference text not null default 'Diário da República, I Série, n.º 176, 16-09-2025',
  source_checksum text,
  import_version text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','STAGED','VALIDATED','IMPORTED','REJECTED')),
  source_rows integer not null default 0 check (source_rows >= 0),
  provinces_expected integer not null default 21,
  municipalities_expected integer not null default 326,
  communes_expected integer not null default 378,
  provinces_validated integer not null default 0,
  municipalities_validated integer not null default 0,
  communes_validated integer not null default 0,
  validation_report jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_report) = 'object'),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  imported_at timestamptz,
  created_by uuid
);
create table if not exists angola_agritech.territorial_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references angola_agritech.territorial_import_batches(id) on delete cascade,
  source_page text,
  source_row_number integer not null check (source_row_number > 0),
  country_code text not null default 'AO' check (country_code = 'AO'),
  province_code text not null,
  province_name text not null,
  municipality_code text not null,
  municipality_name text not null,
  commune_code text not null,
  commune_name text,
  official_alphanumeric_code text not null,
  validation_status text not null default 'PENDING' check (validation_status in ('PENDING','VALID','INVALID','DUPLICATE')),
  validation_errors jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_errors) = 'array'),
  raw_source jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_source) = 'object'),
  created_at timestamptz not null default now(),
  unique (batch_id, source_row_number),
  unique (batch_id, official_alphanumeric_code)
);
alter table angola_agritech.provinces add column if not exists official_code text,
  add column if not exists import_batch_id uuid references angola_agritech.territorial_import_batches(id) on delete restrict;
alter table angola_agritech.municipalities add column if not exists official_code text,
  add column if not exists import_batch_id uuid references angola_agritech.territorial_import_batches(id) on delete restrict;
alter table angola_agritech.communes add column if not exists official_code text,
  add column if not exists import_batch_id uuid references angola_agritech.territorial_import_batches(id) on delete restrict;
create unique index if not exists provinces_official_code_uidx on angola_agritech.provinces(official_code) where official_code is not null;
create unique index if not exists municipalities_official_code_uidx on angola_agritech.municipalities(official_code) where official_code is not null;
create unique index if not exists communes_official_code_uidx on angola_agritech.communes(official_code) where official_code is not null;
create index if not exists territorial_import_rows_batch_status_idx on angola_agritech.territorial_import_rows(batch_id, validation_status);
create index if not exists territorial_import_rows_province_idx on angola_agritech.territorial_import_rows(province_code, municipality_code);
alter table angola_agritech.territorial_import_batches enable row level security;
alter table angola_agritech.territorial_import_rows enable row level security;
comment on table angola_agritech.territorial_import_batches is 'Lotes auditáveis para importação integral do Anexo da Lei n.º 8/25; staging antes de publicação.';
comment on table angola_agritech.territorial_import_rows is 'Linhas brutas do anexo oficial, com códigos originais, página, validação e rastreabilidade.';
comment on column angola_agritech.provinces.official_code is 'Código provincial oficial da Lei n.º 8/25; não preencher por cálculo ou aproximação.';
comment on column angola_agritech.municipalities.official_code is 'Código alfanumérico oficial do município conforme anexo da Lei n.º 8/25.';
comment on column angola_agritech.communes.official_code is 'Código alfanumérico oficial da comuna conforme anexo da Lei n.º 8/25.';
