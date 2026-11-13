import { createClient } from "npm:@supabase/supabase-js@2";

const CHC_ROOT = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/";
const MAX_BODY_BYTES = 4096;
const USER_AGENT = "NOVA-ANGOLA-AGRITECH/0.3 (+CHIRPS source metadata validation)";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function validYearMonth(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 1981 && year <= new Date().getUTCFullYear();
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pentadWindow(period: string, pentad: number) {
  const [yearText, monthText] = period.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const startDay = (pentad - 1) * 5 + 1;
  const endDay = pentad === 6 ? daysInMonth(year, month) : pentad * 5;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    period_start: `${yearText}-${monthText}-${pad(startDay)}`,
    period_end: `${yearText}-${monthText}-${pad(endDay)}`,
  };
}

async function inspectAsset(url: URL) {
  const headers = { "User-Agent": USER_AGENT };
  let response = await fetch(url, {
    method: "HEAD",
    headers,
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });

  // Some archive servers do not implement HEAD. A one-byte range request
  // obtains the response headers without downloading the raster payload.
  if (response.status === 405 || response.status === 501) {
    response = await fetch(url, {
      method: "GET",
      headers: { ...headers, Range: "bytes=0-0" },
      signal: AbortSignal.timeout(12000),
      redirect: "error",
    });
    await response.body?.cancel();
  }

  const contentRange = response.headers.get("content-range");
  const totalMatch = contentRange?.match(/\/(\d+)$/);
  return {
    http_status: response.status,
    exists: response.ok,
    content_type: response.headers.get("content-type"),
    content_length: response.headers.get("content-length"),
    total_size_bytes: totalMatch ? Number(totalMatch[1]) : null,
    content_range: contentRange,
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

  const action = body.action;
  const period = body.period;
  if (action !== "inspect_final_monthly" && action !== "inspect_final_pentad") {
    return json({
      error: "Unsupported action",
      supported_actions: ["inspect_final_monthly", "inspect_final_pentad"],
      note: "This endpoint inspects source metadata only. It does not download rasters, process pixels or write to Supabase.",
    }, 400);
  }

  if (!validYearMonth(period)) {
    return json({ error: "period must use YYYY-MM format and fall within the CHIRPS v3 date range" }, 400);
  }

  const [year, month] = period.split("-");
  let filename: string;
  let assetUrl: URL;
  let temporalResolution: "monthly" | "pentad";
  let window: { period_start: string; period_end: string } | null = null;

  if (action === "inspect_final_monthly") {
    filename = `chirps-v3.0.${year}.${month}.tif`;
    assetUrl = new URL(`monthly/global/tifs/${filename}`, CHC_ROOT);
    temporalResolution = "monthly";
  } else {
    const pentad = body.pentad;
    if (typeof pentad !== "number" || !Number.isInteger(pentad) || pentad < 1 || pentad > 6) {
      return json({ error: "pentad must be an integer from 1 to 6" }, 400);
    }
    filename = `chirps-v3.0.${year}.${month}.${pentad}.tif`;
    assetUrl = new URL(`pentads/global/tifs/${filename}`, CHC_ROOT);
    temporalResolution = "pentad";
    window = pentadWindow(period, pentad);
  }

  try {
    const metadata = await inspectAsset(assetUrl);
    return json({
      ok: metadata.exists,
      stage: "source_metadata_inspection",
      pilot: "NAAT-MAL-CASSAVA-001",
      provider: "Climate Hazards Center, UCSB",
      dataset: "CHIRPS v3.0",
      product_family: action,
      temporal_resolution: temporalResolution,
      period,
      ...(window || {}),
      ...(action === "inspect_final_pentad" ? { pentad: body.pentad } : {}),
      asset: { filename, url: assetUrl.href, ...metadata },
      downloaded: false,
      ingestion_performed: false,
      database_changed: false,
      next_stage: metadata.exists
        ? "Inspect GeoTIFF header, CRS, transform, dimensions, NoData and a bounded Malanje AOI window before pixel aggregation."
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
