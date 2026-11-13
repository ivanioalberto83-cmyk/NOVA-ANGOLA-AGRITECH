import postgres from "npm:postgres@3.4.5";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}
function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > -900 ? n : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!supabaseUrl || !anonKey || !dbUrl) {
    return json({ error: "Required server configuration is missing" }, 503);
  }

  const token = authorization.slice(7);
  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid or expired user session" }, 401);

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, idle_timeout: 5, prepare: false });
  try {
    const pilots = await sql`
      select id, code, name, aoi_bbox, aoi_status, monitoring_goal, status
      from angola_agritech.pilot_projects
      where code = 'NAAT-MAL-CASSAVA-001' and status = 'active'
      limit 1
    `;
    if (!pilots.length) return json({ error: "Active Malanje pilot not found" }, 404);
    const pilot = pilots[0];
    const vegetation = await sql`
      select pvs.observed_at, pvs.ndvi_mean, pvs.ndvi_min, pvs.ndvi_max,
             pvs.ndwi_mean, pvs.cloud_cover_percent, pvs.valid_pixel_count,
             pvs.nodata_pixel_count, pvs.quality_status, pvs.processing_version,
             pvs.statistics, ss.product_id, ss.satellite, ss.provider
      from angola_agritech.pilot_vegetation_summaries pvs
      left join angola_agritech.satellite_scenes ss on ss.id = pvs.satellite_scene_id
      where pvs.pilot_project_id = ${pilot.id}
      order by pvs.observed_at desc
      limit 12
    `;
    const sceneCount = await sql`
      select count(*)::int as total
      from angola_agritech.pilot_scene_candidates
      where pilot_project_id = ${pilot.id}
    `;

    const bbox = Array.isArray(pilot.aoi_bbox) ? pilot.aoi_bbox : JSON.parse(String(pilot.aoi_bbox));
    const longitude = (Number(bbox[0]) + Number(bbox[2])) / 2;
    const latitude = (Number(bbox[1]) + Number(bbox[3])) / 2;

    const endDate = new Date(Date.now() - 86400000);
    const startDate = new Date(endDate.getTime() - 29 * 86400000);
    const start = ymd(startDate);
    const end = ymd(endDate);
    const params = "PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,RH2M,WS10M,ALLSKY_SFC_SW_DWN";
    const nasaUrl = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
    nasaUrl.search = new URLSearchParams({
      parameters: params,
      community: "AG",
      longitude: longitude.toFixed(4),
      latitude: latitude.toFixed(4),
      start,
      end,
      format: "JSON",
      "time-standard": "UTC",
    }).toString();

    let weather: Record<string, unknown>;
    try {
      const response = await fetch(nasaUrl, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error("NASA POWER returned HTTP " + response.status);
      const payload = await response.json();
      const values = payload.properties?.parameter ?? {};
      const dates = Object.keys(values.PRECTOTCORR ?? {}).sort();
      const series = dates.map((date) => ({
        date,
        rainfall_mm: num(values.PRECTOTCORR?.[date]),
        temperature_c: num(values.T2M?.[date]),
        temperature_max_c: num(values.T2M_MAX?.[date]),
        temperature_min_c: num(values.T2M_MIN?.[date]),
        relative_humidity_percent: num(values.RH2M?.[date]),
        wind_speed_m_s: num(values.WS10M?.[date]),
        solar_radiation_kwh_m2_day: num(values.ALLSKY_SFC_SW_DWN?.[date]),
      }));
      const validRain = series.map((x) => x.rainfall_mm).filter((x): x is number => x !== null);
      const validTemp = series.map((x) => x.temperature_c).filter((x): x is number => x !== null);
      const validHumidity = series.map((x) => x.relative_humidity_percent).filter((x): x is number => x !== null);
      const validWind = series.map((x) => x.wind_speed_m_s).filter((x): x is number => x !== null);
      weather = {
        status: "available",
        source: "NASA POWER Daily API",
        dataset: "POWER Agroclimatology (AG)",
        coordinates: { latitude, longitude, spatial_reference: "WGS84" },
        period: { start, end, time_standard: "UTC" },
        units: {
          rainfall_mm: "mm/day",
          temperature_c: "°C",
          temperature_max_c: "°C",
          temperature_min_c: "°C",
          relative_humidity_percent: "%",
          wind_speed_m_s: "m/s",
          solar_radiation_kwh_m2_day: "kWh/m²/day",
        },
        coverage: { returned_days: series.length, valid_rain_days: validRain.length, valid_temperature_days: validTemp.length },
        summary: {
          rainfall_total_mm: validRain.length ? Number(validRain.reduce((a, b) => a + b, 0).toFixed(2)) : null,
          temperature_mean_c: validTemp.length ? Number((validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(2)) : null,
          humidity_mean_percent: validHumidity.length ? Number((validHumidity.reduce((a, b) => a + b, 0) / validHumidity.length).toFixed(1)) : null,
          wind_mean_m_s: validWind.length ? Number((validWind.reduce((a, b) => a + b, 0) / validWind.length).toFixed(2)) : null,
        },
        series,
        caveat: "Gridded model/reanalysis-derived estimate for the pilot-area centroid; not a local weather-station measurement.",
      };
    } catch (error) {
      weather = {
        status: "unavailable",
        source: "NASA POWER Daily API",
        period: { start, end, time_standard: "UTC" },
        error: String(error).slice(0, 240),
        series: [],
      };
    }

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      pilot: {
        code: pilot.code,
        name: pilot.name,
        status: pilot.status,
        aoi_bbox: bbox,
        aoi_status: pilot.aoi_status,
        monitoring_goal: pilot.monitoring_goal,
        scene_candidates_registered: sceneCount[0]?.total ?? 0,
      },
      vegetation: vegetation.map((row) => ({
        ...row,
        statistics: row.statistics ?? {},
      })),
      weather,
      data_governance: {
        database_access: "Server-side, scoped to the active public pilot; no Agritech tables are exposed directly to the browser.",
        user_authentication: "Supabase Auth user JWT verified with getUser.",
        production_schema_changed: false,
      },
    });
  } catch (error) {
    return json({ error: "Could not assemble Agritech dashboard data", detail: String(error).slice(0, 500) }, 502);
  } finally {
    await sql.end({ timeout: 5 });
  }
});