# CHIRPS v3 Edge Function — first-stage implementation

**Function:** `agritech-sync-chirps`  
**Branch:** `feature/national-agritech-command-center`  
**Status:** source discovery only; not deployed and not connected to Supabase data writes.

## Current behaviour

- Requires a valid Supabase Auth user JWT.
- Accepts only `action=discover_monthly` and one `period=YYYY-MM`.
- Reads the official CHC CHIRPS v3 `monthly_global` directory index.
- Follows only HTTPS links on `data.chc.ucsb.edu` under `/products/CHIRPS/v3.0/`.
- Limits directory requests, response sizes, request body size and network timeouts.
- Returns matching GeoTIFF/NetCDF asset links for inspection.
- Does not accept caller-supplied URLs, download raster files, write database rows, or change Supabase schema.

## Deliberate limitations

This is not yet the rainfall ingestion pipeline. The official archive's exact asset layout and representative raster metadata must be verified from a real response before implementing raster window reads, NoData handling, pixel aggregation, checksum strategy and persistence. The pilot AOI is provisional and is currently represented by a bounding box, not a verified farm polygon.

The next implementation stage is:
1. Run source discovery against one known completed month.
2. Inspect the returned asset and its HTTP metadata.
3. Verify CRS, pixel size, raster bounds, band count, units and NoData.
4. Read only the raster window intersecting the pilot AOI.
5. Validate the cell counts and rainfall range against a reproducible sample.
6. Add idempotent persistence only after the dedicated table migration and server-side permissions have been separately approved.

## Official references

- CHIRPS v3 overview: https://www.chc.ucsb.edu/data/chirps3
- Official v3 README: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/README-CHIRPSv3.0.txt
- Official repository: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/
- CHC downloader reference implementation: https://github.com/chc-ucsb/chc-data-download

