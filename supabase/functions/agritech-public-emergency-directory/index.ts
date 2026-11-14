import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) return json({ error: "Directory service is not configured" }, 503);

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, idle_timeout: 5, prepare: false });
  try {
    const [contacts, institutions] = await Promise.all([
      sql`
        select c.service_code,c.service_name,c.service_category,c.dial_number,
          c.coverage_level,c.source_authority,c.source_reference,c.source_url,
          c.allocation_status,c.operational_status,c.last_verified_at,c.notes,
          i.name as institution_name
        from angola_agritech.emergency_service_contacts c
        left join angola_agritech.emergency_institutions i on i.id=c.institution_id
        where c.public_visible=true and c.allocation_status='official_assignment'
        order by case c.service_category
          when 'general_emergency' then 1 when 'police' then 2
          when 'fire_rescue' then 3 when 'ambulance' then 4 else 9 end,
          c.dial_number
      `,
      sql`
        select institution_code,name,institution_type,jurisdiction_level,
          integration_status,official_website,official_source_url,mandate_notes
        from angola_agritech.emergency_institutions
        order by institution_type,name
      `
    ]);
    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      directory_status: "official_numbering_allocations_operational_status_unverified",
      warning: "Os números constam do Plano Nacional de Numeração. A disponibilidade operacional actual e a cobertura por rede/província ainda carecem de confirmação institucional.",
      contacts,
      institutions
    });
  } catch (error) {
    console.error("public emergency directory error", error);
    return json({ error: "Could not load the public emergency directory" }, 502);
  } finally {
    await sql.end({ timeout: 5 });
  }
});