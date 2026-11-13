import { createClient } from "npm:@supabase/supabase-js@2";

const CHC_ROOT = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/";
const ALLOWED_DIRS = new Set(["monthly_global", "pentads_global"]);
const MAX_INDEX_BYTES = 2_000_000;
const MAX_DIRECTORY_REQUESTS = 12;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function safePath(url: URL): boolean {
  return url.protocol === "https:" &&
    url.hostname === "data.chc.ucsb.edu" &&
    url.pathname.startsWith("/products/CHIRPS/v3.0/") &&
    !url.username && !url.password && !url.search && !url.hash;
}

function parseLinks(html: string, current: URL): URL[] {
  const links: URL[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = match[1];
    if (!href || ["#", "?", "mailto:", "javascript:"].some((prefix) => href.startsWith(prefix)) || href === "../") continue;
    let url: URL;
    try { url = new URL(href, current); } catch { continue; }
    if (!safePath(url) || seen.has(url.href) || url.href === current.href) continue;
    seen.add(url.href);
    links.push(url);
  }
  return links;
}

async function readIndex(url: URL): Promise<{ html: string; etag: string | null; modified: string | null }> {
  if (!safePath(url) || !url.pathname.endsWith("/")) throw new Error("Invalid CHIRPS directory URL");
  const response = await fetch(url, {
    headers: { "User-Agent": "NOVA-ANGOLA-AGRITECH/0.1 (+CHIRPS source discovery)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`CHC directory returned HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") && !type.includes("text/plain")) {
    throw new Error("CHC directory did not return an HTML/text index");
  }
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_INDEX_BYTES) throw new Error("CHC directory index exceeds size limit");
  const html = await response.text();
  if (html.length > MAX_INDEX_BYTES) throw new Error("CHC directory index exceeds size limit");
  return { html, etag: response.headers.get("etag"), modified: response.headers.get("last-modified") };
}

function monthMatches(name: string, period: string): boolean {
  const [year, month] = period.split("-");
  const escapedMonth = month.padStart(2, "0");
  const patterns = [
    new RegExp(`(?:^|[^0-9])${year}[._-]${escapedMonth}(?:[^0-9]|$)`, "i"),
    new RegExp(`(?:^|[^0-9])${year}${escapedMonth}(?:[^0-9]|$)`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(name));
}

async function discoverMonthly(period: string) {
  const root = new URL("monthly_global/", CHC_ROOT);
  const queue = [root];
  const visited = new Set<string>();
  const files: Array<{ name: string; url: string; extension: string }> = [];
  let requests = 0;

  while (queue.length && requests < MAX_DIRECTORY_REQUESTS) {
    const directory = queue.shift()!;
    if (visited.has(directory.href)) continue;
    visited.add(directory.href);
    const index = await readIndex(directory);
    requests++;
    for (const link of parseLinks(index.html, directory)) {
      if (link.pathname.endsWith("/")) {
        if (link.pathname.split("/").filter(Boolean).length <= 7) queue.push(link);
        continue;
      }
      const name = decodeURIComponent(link.pathname.split("/").pop() || "");
      const lower = name.toLowerCase();
      const supported = lower.endsWith(".tif") || lower.endsWith(".tiff") ||
        lower.endsWith(".tif.gz") || lower.endsWith(".tiff.gz") || lower.endsWith(".nc");
      if (supported && monthMatches(name, period)) {
        files.push({
          name,
          url: link.href,
          extension: lower.endsWith(".nc") ? "netcdf" : lower.includes(".gz") ? "geotiff-gzip" : "geotiff",
        });
      }
    }
    if (files.length >= 10) break;
  }

  return {
    directory_requests: requests,
    search_limit_reached: queue.length > 0 && requests >= MAX_DIRECTORY_REQUESTS,
    assets: files.slice(0, 10),
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

  const token = authorization.slice(7);
  const auth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return json({ error: "Invalid or expired user session" }, 401);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "Request body exceeds size limit" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.action !== "discover_monthly") {
    return json({
      error: "Unsupported action",
      supported_actions: ["discover_monthly"],
      note: "This first-stage endpoint only discovers official CHIRPS assets. It does not download rasters or write to Supabase.",
    }, 400);
  }

  const period = typeof body.period === "string" ? body.period : "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return json({ error: "period must use YYYY-MM format" }, 400);
  }
  const year = Number(period.slice(0, 4));
  if (year < 1981 || year > new Date().getUTCFullYear()) {
    return json({ error: "Requested period is outside the CHIRPS v3 date range" }, 400);
  }

  try {
    const result = await discoverMonthly(period);
    return json({
      ok: true,
      stage: "source_discovery",
      pilot: "NAAT-MAL-CASSAVA-001",
      provider: "Climate Hazards Center, UCSB",
      dataset: "CHIRPS v3.0",
      product_family: "final_monthly",
      temporal_resolution: "monthly",
      period,
      source_directory: new URL("monthly_global/", CHC_ROOT).href,
      ...result,
      ingestion_performed: false,
      database_changed: false,
      next_stage: result.assets.length
        ? "Validate the discovered raster metadata and AOI window before implementing persistence."
        : "No matching asset was found in the bounded directory scan; inspect the official index before retrying.",
      caveat: "The Malanje pilot AOI is still provisional. Any later area summary is not a verified farm-parcel measurement.",
    });
  } catch (error) {
    return json({
      error: "CHIRPS source discovery failed",
      detail: String(error).slice(0, 300),
      database_changed: false,
    }, 502);
  }
});
