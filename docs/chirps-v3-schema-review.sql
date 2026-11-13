-- NOVA ANGOLA AGRITECH — CHIRPS v3 schema review proposal
-- STATUS: REVIEW ONLY. NOT A SUPABASE MIGRATION.
-- DO NOT EXECUTE against any database until separately reviewed and approved.
-- Prepared from read-only inspection of the current angola_agritech schema.
--
-- Design intent:
--   * Keep raster/AOI rainfall summaries separate from point observations.
--   * Preserve CHIRPS preliminary/final and daily rnl/sat product families.
--   * Preserve source identity, AOI snapshot, processing version and coverage.
--   * Keep direct browser access closed. RLS is enabled with no client policies
--     in this proposal; access is intended through an authenticated server-side
--     Edge Function using a controlled server identity.
--
-- Dependencies verified in the current project:
--   angola_agritech.pilot_projects(id uuid)
--   angola_agritech.ingestion_jobs(id uuid)
--   Both tables already exist. ingestion_jobs currently has no FK from other
--   Agritech tables in the inspected baseline.

begin;

create table if not exists angola_agritech.rainfall_grid_summaries (
  id uuid primary key default gen_random_uuid(),

  pilot_project_id uuid not null
    references angola_agritech.pilot_projects(id) on delete restrict,

  provider text not null default 'CHC',
  dataset_version text not null default 'CHIRPS v3.0',

  product_family text not null
    check (product_family in (
      'final_pentad',
      'preliminary_pentad',
      'final_monthly',
      'daily_rnl',
      'daily_sat'
    )),

  temporal_resolution text not null
    check (temporal_resolution in ('pentad', 'monthly', 'daily')),

  period_start date not null,
  period_end date not null,
  constraint rainfall_grid_summaries_period_check
    check (period_end >= period_start),

  source_asset_uri text not null,
  source_checksum text not null,
  source_published_at timestamptz,
  retrieved_at timestamptz not null default now(),

  native_resolution_degrees numeric(10,6) not null
    check (native_resolution_degrees > 0),
  crs text not null,
  unit text not null default 'mm'
    check (unit = 'mm'),

  aoi_snapshot jsonb not null
    check (jsonb_typeof(aoi_snapshot) = 'object'),
  aoi_hash text not null,
  aoi_status text not null
    check (aoi_status in ('provisional', 'field_verified', 'official_boundary')),

  mean_mm numeric(12,4),
  min_mm numeric(12,4),
  max_mm numeric(12,4),
  valid_cell_count bigint not null check (valid_cell_count >= 0),
  nodata_cell_count bigint not null check (nodata_cell_count >= 0),
  valid_coverage_percent numeric(6,3) not null
    check (valid_coverage_percent between 0 and 100),

  aggregation_method text not null,
  processing_version text not null,
  quality_status text not null
    check (quality_status in ('usable', 'degraded', 'rejected')),
  quality_notes text,

  ingestion_job_id uuid
    references angola_agritech.ingestion_jobs(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint rainfall_grid_summaries_stats_nonnegative
    check (
      (mean_mm is null or mean_mm >= 0) and
      (min_mm is null or min_mm >= 0) and
      (max_mm is null or max_mm >= 0)
    ),
  constraint rainfall_grid_summaries_stats_order
    check (
      (min_mm is null or mean_mm is null or min_mm <= mean_mm) and
      (mean_mm is null or max_mm is null or mean_mm <= max_mm) and
      (min_mm is null or max_mm is null or min_mm <= max_mm)
    )
);

-- Idempotency: a repeat of the same source asset, checksum, AOI and processor
-- must resolve to the same summary identity rather than duplicate the row.
create unique index if not exists rainfall_grid_summaries_source_aoi_processor_uidx
  on angola_agritech.rainfall_grid_summaries
  (source_asset_uri, source_checksum, aoi_hash, processing_version);

create index if not exists rainfall_grid_summaries_project_period_idx
  on angola_agritech.rainfall_grid_summaries
  (pilot_project_id, period_start desc, period_end desc);

create index if not exists rainfall_grid_summaries_product_period_idx
  on angola_agritech.rainfall_grid_summaries
  (product_family, period_start desc, period_end desc);

alter table angola_agritech.rainfall_grid_summaries enable row level security;

comment on table angola_agritech.rainfall_grid_summaries is
  'CHIRPS v3 AOI-level raster rainfall summaries with source, AOI and processing provenance. Not point-gauge observations.';

comment on column angola_agritech.rainfall_grid_summaries.aoi_status is
  'AOI verification state at processing time; provisional AOIs must not be presented as verified farm parcels.';

comment on column angola_agritech.rainfall_grid_summaries.product_family is
  'Keeps final/preliminary pentad, final monthly and daily rnl/sat products in separate series.';

-- Intentionally no GRANT and no client RLS policies here.
-- Before implementation, confirm schema exposure, service-function access,
-- role model, Data API settings and security advisors. Do not add broad
-- authenticated/anon policies as a shortcut.

rollback;
