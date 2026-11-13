# CHIRPS v3 source validation — stage 2

**Branch:** `feature/national-agritech-command-center`  
**Status:** implementation updated; runtime source check not yet executed; not deployed.

## Confirmed monthly candidate path

The monthly GeoTIFF convention used by the downloader reference is:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/chirps-v3.0.YYYY.MM.tif`

Example candidate for October 2026:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/chirps-v3.0.2026.10.tif`

The function now performs a metadata-only HTTP HEAD request for a requested month. If the archive responds with 405/501, it falls back to a one-byte Range request and cancels the response body. It does not download the raster.

## Pentad source path — deliberately pending

The scientific description confirms CHIRPS v3 is calculated at pentadal and monthly scales, but the exact final-pentad directory and file naming convention on the official v3 archive have not yet been independently confirmed from an official CHC index/README. A legacy USGS mirror is not sufficient evidence to hard-code the official CHC source path.

Therefore the Edge Function currently exposes only `inspect_final_monthly`. It does not guess a pentad URL or mix in CHIRPS v2 / other mirrors. Add pentad discovery only after confirming the official v3 path and a real asset.

## Safety and limits

- Authenticated Supabase user required.
- Request action and period are allow-listed.
- HTTPS host is fixed to `data.chc.ucsb.edu`; callers cannot supply URLs.
- No raster download, pixel processing, Storage upload, table write, migration, or deployment.
- The Malanje AOI remains provisional; no farm-level claim is permitted.

## Next validation gates

1. Invoke against a known completed month, e.g. `2026-10`.
2. Record HTTP status, content type, length, ETag and Last-Modified.
3. If the asset exists, use a raster-aware environment to inspect CRS, transform, dimensions, NoData, band and units.
4. Independently confirm the official final-pentad directory and a real period file.
5. Only then implement bounded AOI window processing and reproducible summaries.

## References

- CHC CHIRPS v3 overview: https://www.chc.ucsb.edu/data/chirps3
- CHC v3 README: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt
- CHC v3 archive: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/
- Public downloader reference for monthly path convention: https://waterinag.github.io/Data4WA/datasets/pcp_chirps/
- CHIRPS v3 paper: https://doi.org/10.1038/s41597-026-07096-4
