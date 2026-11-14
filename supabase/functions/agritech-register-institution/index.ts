import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const institutionTypes = new Set([
  "police", "civil_protection_fire", "health_emergency", "hospital",
  "armed_forces", "red_cross", "maritime", "aviation",
  "local_administration", "utilities", "other"
]);
const jurisdictionLevels = new Set(["national", "provincial", "municipal", "local"]);

function optionalUrl(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 500) throw new Error(field + " inválido.");
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(field + " deve ser um URL válido."); }
  if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(field + " deve usar HTTP(S) e não pode conter credenciais.");
  }
  return parsed.toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!supabaseUrl || !anonKey || !dbUrl) return json({ error: "Server configuration is incomplete" }, 503);

  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return json({ error: "Invalid or expired user session" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Corpo do pedido inválido." }, 400); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.institution_type === "string" ? body.institution_type : "";
  const jurisdiction = typeof body.jurisdiction_level === "string" ? body.jurisdiction_level : "";
  if (!name || name.length > 200) return json({ error: "Indica o nome oficial (máximo 200 caracteres)." }, 400);
  if (!institutionTypes.has(type)) return json({ error: "Categoria institucional inválida." }, 400);
  if (!jurisdictionLevels.has(jurisdiction)) return json({ error: "Âmbito territorial inválido." }, 400);

  let website: string | null, sourceUrl: string | null;
  try {
    website = optionalUrl(body.official_website, "Website oficial");
    sourceUrl = optionalUrl(body.official_source_url, "Fonte oficial");
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "URL inválido." }, 400);
  }
  const notes = typeof body.mandate_notes === "string" ? body.mandate_notes.trim() : "";
  const agreement = typeof body.agreement_reference === "string" ? body.agreement_reference.trim() : "";
  if (notes.length > 2000 || agreement.length > 120) return json({ error: "Um dos campos excede o limite permitido." }, 400);

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, idle_timeout: 5, prepare: false });
  try {
    const userId = authData.user.id;
    const [scope] = await sql`
      select exists(
        select 1 from angola_agritech.administrative_scope_assignments
        where user_id = ${userId} and is_active = true and role_code = 'national_admin'
      ) as allowed
    `;
    if (!scope?.allowed) return json({ error: "Apenas um administrador nacional activo pode criar registos institucionais." }, 403);

    const code = "NAAT-I-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const [record] = await sql`
      insert into angola_agritech.emergency_institutions
        (institution_code, name, institution_type, jurisdiction_level, integration_status,
         official_website, official_source_url, mandate_notes, agreement_reference, approved_at)
      values
        (${code}, ${name}, ${type}, ${jurisdiction}, 'proposed',
         ${website}, ${sourceUrl}, ${notes || null}, ${agreement || null}, null)
      returning id, institution_code, name, institution_type, jurisdiction_level, integration_status, created_at
    `;
    return json({ ok: true, institution: record }, 201);
  } catch (error) {
    console.error("institution registration failed", error);
    return json({ error: "Não foi possível guardar o registo institucional." }, 500);
  } finally {
    await sql.end({ timeout: 5 });
  }
});
