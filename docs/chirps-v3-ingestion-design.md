# CHIRPS v3 ingestion and climate intelligence design

**Project:** NOVA ANGOLA AGRITECH  
**Pilot:** NAAT-MAL-CASSAVA-001 — Malanje / cassava  
**Status:** technical design for implementation; no production schema or data changes made  
**Review date:** 2026-11-13

## 1. Objective

Add CHIRPS v3 precipitation as a separate, traceable gridded-data source for the Malanje pilot. The first deliverable is a defensible rainfall history and area summary, not a drought diagnosis. The integration must preserve the distinction between preliminary and final products and between the two CHIRPS daily disaggregation variants.

Official source: https://www.chc.ucsb.edu/data/chirps3  
Data repository: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/

## 2. Current verified baseline

Read-only inspection of Supabase project `rojyxfjaidyvtmsmefcf` on 2026-11-13 found:

- `angola_agritech.satellite_scenes`: 10 rows.
- `angola_agritech.pilot_scene_candidates`: 10 rows.
- `angola_agritech.pilot_vegetation_summaries`: 1 row.
- `angola_agritech.ingestion_jobs`: 5 rows, including a successful Sentinel-2 discovery and a successful NDVI/NDWI summary.
- `angola_agritech.weather_observations`: 0 rows.
- `angola_agritech.provinces`: 1 row; `municipalities`, farmers, farms and farm plots: 0 rows.
- All inspected Agritech tables have RLS enabled. A read-only query of `pg_policies` returned no policies for schema `angola_agritech`. Keep browser access blocked; do not add permissive policies as a shortcut.
- Pilot AOI bbox is [16.1, -9.7, 16.6, -9.3] and `aoi_status=provisional`. It is not an official provincial boundary or a confirmed cassava parcel.
- `agritech-dashboard-data` v2 is ACTIVE and verifies the user's JWT with Supabase Auth. It reads pilot vegetation summaries server-side and requests the latest 30 days from NASA POWER Daily API for the AOI centroid. NASA POWER values are gridded estimates, not station measurements, and are not persisted.
- `agritech-process-ndvi` v18 is ACTIVE and JWT-protected. Its latest successful job produced a 100 m grid summary over the provisional AOI. This is area-level evidence, not parcel-level crop validation.

No DDL, DML, RLS policy, secret, or production deployment was changed during this inspection.

## 3. CHIRPS v3 product handling

CHIRPS v3 is a 0.05-degree gridded rainfall dataset spanning 1981 to near-present. It combines satellite infrared estimates and station observations. The CHC publishes preliminary and final products and several temporal aggregations.

Store these product families separately:

| Product family | Intended use | Handling |
|---|---|---|
| Final pentad | Operational rainfall monitoring and historical balances | Preferred first integration |
| Preliminary pentad | Early indication before final release | Mark preliminary; never silently replace final |
| Final monthly | Monthly balances and climatology | Preferred for monthly anomalies and SPI input |
| Daily rnl | Daily disaggregation using ERA5 | Separate series and explicit method label |
| Daily sat | Daily disaggregation using IMERG Late V07 | Separate series and explicit method label |

CHIRPS is fundamentally a pentad/monthly product. Daily values are disaggregated from pentad totals. The daily date is a consistent label, not a uniform local rain-gauge observation window. The rnl and sat variants must not be blended into one series.

Use millimetres per product period. Respect each product's native period boundaries and UTC/date-label conventions. Treat NoData values (including -9999 where present in source products) as missing, never as zero rainfall.

## 4. Recommended first implementation

### Stage A — source discovery and reproducibility

1. Read the official v3 repository and product README before hardcoding paths or file naming rules.
2. Select Africa or global COG/GeoTIFF assets that fully cover the pilot AOI.
3. Record the exact source URL, product family, version, preliminary/final status, period, retrieval time, source checksum/ETag where available, native resolution, CRS, nodata value and parser/processing version.
4. Validate the source raster metadata and sample values before processing a full historical range.
5. Keep a failed ingestion attempt visible with a useful error summary; never mark partial data as complete.

### Stage B — AOI aggregation

1. Initially calculate an area summary only for the explicitly provisional pilot AOI.
2. Intersect raster cells with the AOI; use an area-weighted mean where the chosen raster library permits it. Document the aggregation method.
3. Report mean, minimum, maximum, valid-cell count, nodata-cell count, valid coverage and spatial resolution.
4. Attach the exact AOI snapshot and a stable geometry hash to every summary.
5. Mark all results `provisional_aoi` until the pilot polygon is surveyed or otherwise verified.
6. Do not label an AOI average as a farm or parcel measurement.

### Stage C — historical rainfall intelligence

1. Begin with final pentad and monthly products.
2. Build monthly totals and compare them with a documented 1991–2020 climatological reference where the source series is complete and suitable.
3. Calculate rainfall anomalies only after validating period completeness and units.
4. Calculate SPI-1/3/6/12 only after a continuous monthly history, distribution fitting, missing-data rules and reference period have been reviewed. Keep the method and software version with every result.
5. Add preliminary near-real-time values as a separate layer with an explicit preliminary badge and release timestamp.

Daily rnl/sat series can be added after the pentad/monthly path is validated.

## 5. Database design proposal — requires approval before DDL

The existing `weather_observations` table is shaped like a point observation (latitude/longitude and one `observed_at`) and is currently empty. It does not represent an AOI-level raster summary with period start/end, product variant, geometry version, raster resolution and pixel coverage. Do not overload it for CHIRPS raster aggregates.

Proposed dedicated table: `angola_agritech.rainfall_grid_summaries`.

Suggested fields:

- `id` UUID primary key.
- `pilot_project_id` UUID foreign key to `pilot_projects`.
- `provider` and `dataset_version` (for example, CHC / CHIRPS v3.0).
- `product_family` (final_pentad, preliminary_pentad, final_monthly, daily_rnl, daily_sat).
- `temporal_resolution` and `period_start`, `period_end`.
- `source_asset_uri`, `source_checksum`, `source_published_at`, `retrieved_at`.
- `native_resolution_degrees`, `crs`, `unit`.
- `aoi_snapshot` JSONB, `aoi_hash`, `aoi_status`.
- `mean_mm`, `min_mm`, `max_mm`, optional percentiles, `valid_cell_count`, `nodata_cell_count`, `valid_coverage_percent`.
- `aggregation_method`, `processing_version`, `quality_status`, `quality_notes`.
- `ingestion_job_id` UUID reference to the existing ingestion job where compatible.
- `created_at`.

Preserve revised source releases as new records rather than overwriting history. Enforce idempotency using a key based on source asset identity/checksum, AOI hash and processing version. The final schema must be checked against existing naming conventions and constraints before migration authoring.

Security requirements:
- Keep the Agritech schema inaccessible directly from the browser.
- Keep RLS enabled and design policies only after the tenant/role access model is verified.
- Run ingestion server-side. Manual triggers must require an authenticated, explicitly authorized operator; scheduled ingestion should use a controlled server-side identity.
- Never put service-role credentials, database URLs or Copernicus credentials in frontend code or request bodies.
- Record each ingestion attempt in `ingestion_jobs` and each product's provenance in the new summary table.

## 6. Edge Function proposal

Create a dedicated `agritech-sync-chirps` function only after the source access and database design are approved.

Responsibilities:
- Validate the caller or scheduled-job identity.
- Accept a bounded product/period request; do not accept arbitrary external URLs.
- Resolve source paths from a fixed allowlisted CHIRPS v3 repository.
- Download only the required raster window or COG range.
- Validate HTTP status, file metadata, CRS, pixel size, nodata and period.
- Aggregate the AOI and persist provenance and statistics in one controlled transaction.
- Use timeouts, bounded retries, rate limits, idempotency and structured error logs.
- Return product identity, period, AOI hash, counts, summary statistics and quality status.

Do not run a nationwide historical backfill in one Edge Function invocation. Backfill should be partitioned into bounded period batches with resumable job state.

## 7. Dashboard requirements

Add a climate section with clearly separated views:

- CHIRPS final pentad rainfall.
- CHIRPS final monthly rainfall.
- Preliminary pentad rainfall (visibly marked preliminary).
- NASA POWER daily point series (visibly marked gridded estimate at AOI centroid).
- Later: daily CHIRPS rnl and sat as separate selectable series.

Every chart and KPI must display source, product variant, period, unit, native resolution, AOI status, retrieval/update time and quality coverage. Missing values must appear as gaps, not zeroes. Comparisons must never mix product families or units without explicit conversion.

## 8. Acceptance criteria

The first release is acceptable only when:

1. At least one final CHIRPS pentad and monthly asset for the pilot period is downloaded and its metadata validated.
2. Source URL, product/version, period, checksum or equivalent identity, CRS, native resolution, nodata and processing version are retained.
3. AOI aggregation is reproducible from the stored source asset and AOI snapshot.
4. Valid and NoData cells reconcile to the raster window; coverage is reported.
5. Independent spot checks against the source raster reproduce the stored statistics within documented numeric tolerance.
6. Re-running the same source/AOI/processor does not create duplicate summaries.
7. Preliminary/final and daily rnl/sat products remain distinct.
8. The dashboard labels the pilot AOI as provisional and never presents its summary as a parcel measurement.
9. Security checks confirm no direct browser access to protected tables and no secrets in client bundles.
10. Build, function tests and preview deployment checks pass before any production release.

## 9. Explicitly out of scope for this first release

- SPI and drought classifications before a validated historical series and method review.
- Parcel-level claims before verified parcel boundaries exist.
- Crop yield forecasts before crop/season/field observations are available.
- Pest/disease alerts based only on rainfall or vegetation indices.
- National coverage claims before official administrative geometries and data pipelines are validated.

## 10. Official references

- CHIRPS v3 overview and product definitions: https://www.chc.ucsb.edu/data/chirps3
- CHIRPS v3 repository: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/
- CHIRPS v3 daily README: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/daily/readme.txt
- CHIRPS v3 diagnostics: https://www.chc.ucsb.edu/data/chirps3/diagnostics
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
