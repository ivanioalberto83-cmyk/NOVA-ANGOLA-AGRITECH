# CHIRPS v3 — validation of the final monthly source

**Project:** NOVA ANGOLA AGRITECH  
**Pilot:** NAAT-MAL-CASSAVA-001 (Malanje; provisional AOI)  
**Branch:** feature/national-agritech-command-center  
**Validation date:** 2026-11-13  
**Status:** source directory and candidate asset confirmed; raster internals not yet inspected.

## Confirmed official source

The CHC archive exposes the final monthly global GeoTIFFs at:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/`

The directory index was fetched successfully. It lists the candidate:

`chirps-v3.0.2026.09.tif`

Candidate asset URL:

`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/chirps-v3.0.2026.09.tif`

The filename convention is `chirps-v3.0.YYYY.MM.tif`. The official CHC README states that final products are updated monthly and are typically complete during the third week of the following month. Therefore September 2026 is a suitable completed-month sample for this validation date; October 2026 should not be assumed final yet.

## What this confirms

- The correct monthly GeoTIFF directory is `monthly/global/tifs/`, not the legacy-style `monthly_global/` directory.
- The candidate naming pattern is confirmed by the live directory index.
- The September 2026 file is advertised by the official archive.
- The Edge Function's metadata-only approach (HEAD, with a one-byte Range fallback) is appropriate for the next check and avoids downloading the full raster if the origin supports it.

## What remains unverified

The directory listing is not raster validation. Before pixel processing, the function or a controlled validation runner must capture and verify:

- HTTP status, Content-Length, ETag and Last-Modified;
- TIFF signature and whether the server supports byte ranges;
- CRS, transform, pixel size, width, height, bounds and band count;
- data type, scale/offset and the actual NoData representation (do not assume a NoData tag exists);
- units and whether monthly values are accumulated precipitation in mm;
- a small Malanje AOI window, valid-cell count, NoData count and plausible rainfall range.

Do not infer these properties from the filename or from a different CHIRPS version. Do not download the full global file as part of a routine Edge Function request.

## Safety and scope

- This is source validation only; no raster has been ingested.
- No Supabase schema, rows, secrets, functions or production settings were changed.
- The function remains undeployed.
- The pilot AOI remains provisional; summaries must not be represented as verified farm-parcel measurements.
- CHIRPS final monthly and final pentad remain separate products. Preliminary and daily `rnl` / `sat` products must not be merged into these series.

## Official references

- CHIRPS v3 README: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt
- Official monthly GeoTIFF index: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/
- Official CHC downloader (uses the current v3 directory structure): https://github.com/chc-ucsb/chc-data-download
