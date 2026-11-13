# CHIRPS v3 source validation — stage 2

**Branch:** `feature/national-agritech-command-center`  
**Status:** monthly and pentad archive paths confirmed from live official CHC directory indexes; metadata-only inspection implemented in GitHub; runtime Edge Function check and raster-header inspection remain pending; not deployed.

## Confirmed final monthly source

Official directory:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/`

The live index advertises:

`chirps-v3.0.2026.09.tif`

Candidate URL:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/chirps-v3.0.2026.09.tif`

Filename convention: `chirps-v3.0.YYYY.MM.tif`.

The CHC README says final CHIRPS products are typically complete during the third week of the following month. On 2026-11-13, September 2026 is the latest confirmed completed monthly candidate in the fetched directory listing; October 2026 must not be assumed final yet.

## Confirmed final pentad source

Official directory:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/pentads/global/tifs/`

The live index advertises the 2026 pentad files through:

`chirps-v3.0.2026.09.6.tif`

Candidate URL:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/pentads/global/tifs/chirps-v3.0.2026.09.6.tif`

Filename convention: `chirps-v3.0.YYYY.MM.N.tif`, where N is 1–6. Pentad windows are treated as days 1–5, 6–10, 11–15, 16–20, 21–25 and 26–month-end. The sixth window therefore varies in length.

## Edge Function changes prepared

`supabase/functions/agritech-sync-chirps/index.ts` now supports:
- `inspect_final_monthly` with `period: YYYY-MM`;
- `inspect_final_pentad` with `period: YYYY-MM` and `pentad: 1..6`;
- fixed official CHC source paths and generated filenames (no caller-supplied URL);
- authenticated Supabase user validation;
- metadata-only HEAD request, with one-byte Range fallback for HTTP 405/501;
- response fields for HTTP status, content type, content length, total size when available, ETag, Last-Modified and range support.

The function does not download full rasters, inspect TIFF internals, process pixels, write Storage/database rows or change schema.

## Remaining validation gates

1. Run the function against monthly `2026-09` and pentad `2026-09`, `pentad=6`.
2. Record actual HTTP response metadata from the function runtime.
3. Inspect GeoTIFF signature, CRS, transform, dimensions, bounds, band count, dtype, NoData, scale/offset and units.
4. Read a bounded window intersecting the provisional Malanje AOI; verify valid/NoData counts and plausible precipitation values.
5. Keep final monthly and final pentad as separate time series. Do not merge preliminary or daily `rnl` / `sat` products.
6. Only implement persistence after a separate review and explicit approval of the schema/security plan.

## Safety and limits

- No Supabase function has been deployed.
- No Supabase schema, row, Storage object, secret or production setting has been changed.
- No paid branch or upgrade has been created.
- The Malanje pilot AOI remains provisional and is not a verified cassava parcel.

## References

- CHC CHIRPS v3 README: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt
- CHC final monthly GeoTIFF index: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/
- CHC final pentad GeoTIFF index: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/pentads/global/tifs/
- CHC downloader reference: https://github.com/chc-ucsb/chc-data-download
- CHIRPS v3 paper: https://doi.org/10.1038/s41597-026-07096-4
