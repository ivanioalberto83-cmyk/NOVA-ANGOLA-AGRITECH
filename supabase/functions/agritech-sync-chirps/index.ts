import { createClient } from "npm:@supabase/supabase-js@2";

const CHC_ROOT = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/";
const MAX_BODY_BYTES = 4096;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function validPeriod(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 1981 && year <= new Date().getUTCFullYear();
}

async function inspectAsset(url: URL) {
  const headers = { "User-Agent": "NOVA-ANGOLA-AGRITECH/0.2 (+CHIRPS metadata inspection)" };
  let response = await fetch(url, {
    method: "HEAD",
    headers,
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });

  // Some static archive servers do not implement HEAD. A one-byte range request
  // obtains headers without downloading the raster payload.
  if (response.status === 405 || response.status === 501) {
    response = await fetch(url, {
      method: "GET",
      headers: { ...headers, Range: "bytes=0-0" },
      signal: AbortSignal.timeout(12000),
      redirect: "error",
    });
    await response.body?.cancel();
  }

  return {
    http_status: response.status,
    exists: response.ok,
    content_type: response.headers.get("content-type"),
    content_length: response.headers.get("content-length"),
    content_range: response.headers.get("content-range"),
    etag: response.headers.get("etag"),
    last_modified: response.headers.get("last-modified"),
    accept_ranges: response.headers.get("accept-ranges"),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "Supabase Auth configuration is missing" }, 503);

  const auth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await auth.auth.getUser(authorization.slice(7));
  if (error || !data.user) return json({ error: "Invalid or expired user session" }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: "Request body exceeds size limit" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.action !== "inspect_final_monthly") {
    return json({
      error: "Unsupported action",
      supported_actions: ["inspect_final_monthly"],
      note: "Pentad source layout is intentionally not guessed. No raster is downloaded and no database write is performed.",
    }, 400);
  }

  if (!validPeriod(body.period)) {
    return json({ error: "period must use YYYY-MM format and fall within the CHIRPS v3 date range" }, 400);
  }

  const [year, month] = body.period.split("-");
  const filename = `chirps-v3.0.${year}.${month}.tif`;
  const assetUrl = new URL(`monthly/global/tifs/${filename}`, CHC_ROOT);

  try {
    const metadata = await inspectAsset(assetUrl);
    return json({
      ok: metadata.exists,
      stage: "source_metadata_inspection",
      pilot: "NAAT-MAL-CASSAVA-001",
      provider: "Climate Hazards Center, UCSB",
      dataset: "CHIRPS v3.0",
      product_family: "final_monthly",
      temporal_resolution: "monthly",
      period: body.period,
      asset: { filename, url: assetUrl.href, ...metadata },
      downloaded: false,
      ingestion_performed: false,
      database_changed: false,
      next_stage: metadata.exists
        ? "Inspect raster geospatial metadata and validate the Malanje AOI window before any pixel processing."
        : "The candidate asset was not confirmed. Check the official archive index and do not proceed to raster processing.",
      caveat: "The Malanje pilot AOI remains provisional and is not a verified cassava parcel.",
    }, metadata.exists ? 200 : 502);
  } catch (error) {
    return json({
      error: "CHIRPS metadata inspection failed",
      detail: String(error).slice(0, 240),
      database_changed: false,
    }, 502);
  }
});
