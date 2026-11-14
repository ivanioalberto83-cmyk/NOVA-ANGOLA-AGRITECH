import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const authorization=req.headers.get("Authorization")||"";
  if(!authorization.startsWith("Bearer "))return json({error:"Authentication required"},401);
  const supabaseUrl=Deno.env.get("SUPABASE_URL"), anonKey=Deno.env.get("SUPABASE_ANON_KEY"), dbUrl=Deno.env.get("SUPABASE_DB_URL");
  if(!supabaseUrl||!anonKey||!dbUrl)return json({error:"Server configuration is incomplete"},503);
  const auth=createClient(supabaseUrl,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await auth.auth.getUser(authorization.slice(7));
  if(authError||!authData.user)return json({error:"Invalid or expired user session"},401);
  const sql=postgres(dbUrl,{max:1,connect_timeout:10,idle_timeout:5,prepare:false});
  try{
    const userId=authData.user.id;
    const [territorialScopes,institutionAssignments,institutions]=await Promise.all([
      sql`select role_code,province_id,municipality_id,commune_id from angola_agritech.administrative_scope_assignments where user_id=${userId} and is_active=true`,
      sql`select institution_id,role_code,province_id,municipality_id,commune_id from angola_agritech.institution_user_assignments where user_id=${userId} and is_active=true`,
      sql`select id,institution_code,name,institution_type,jurisdiction_level,integration_status,agreement_reference,approved_at from angola_agritech.emergency_institutions order by institution_type,name`
    ]);
    const nationalAdmin=territorialScopes.some((s:any)=>s.role_code==="national_admin");
    const operationalAccess=nationalAdmin||territorialScopes.length>0;
    const scopeFilter=(alias:string)=>{
      if(nationalAdmin)return sql`true`;
      const clauses=territorialScopes.map((s:any)=>{
        const a=sql.unsafe(alias);
        if(s.role_code==="provincial_admin")return sql`${a}.province_id=${s.province_id}`;
        if(["municipal_admin","territorial_technician","territorial_reader"].includes(s.role_code))return sql`${a}.municipality_id=${s.municipality_id}`;
        if(s.role_code==="communal_admin")return sql`${a}.commune_id=${s.commune_id}`;
        return null;
      }).filter(Boolean);
      return clauses.length?sql`(${sql.join(clauses,sql` OR `)})`:sql`false`;
    };
    const [provinceCount,municipalityCount,communeCount]=await Promise.all([
      sql`select count(*)::int as total from angola_agritech.provinces`,
      sql`select count(*)::int as total from angola_agritech.municipalities`,
      sql`select count(*)::int as total from angola_agritech.communes`
    ]);
    const result:any={
      ok:true,generated_at:new Date().toISOString(),
      access:{operational:operationalAccess,national_admin:nationalAdmin,territorial_scopes:territorialScopes,institution_assignments:institutionAssignments,
        message:operationalAccess?"Acesso limitado às competências e ao território atribuídos à conta.":institutionAssignments.length>0?"A conta tem uma ligação institucional, mas ainda não tem uma atribuição territorial para consultar os painéis nacionais.":"A conta está autenticada, mas ainda não tem uma atribuição territorial ou institucional activa. Solicite ao administrador nacional a concessão formal de acesso."},
      territorial_catalogue:{provinces:provinceCount[0]?.total??0,municipalities:municipalityCount[0]?.total??0,communes:communeCount[0]?.total??0,province_list:provinceList,source_note:"Contagens do catálogo interno; códigos NOVA_INTERNAL não substituem códigos oficiais."},
      institutions:institutions.map((i:any)=>({id:i.id,code:i.institution_code,name:i.name,type:i.institution_type,jurisdiction:i.jurisdiction_level,integration_status:i.integration_status,agreement_reference:i.agreement_reference,approved_at:i.approved_at})),
      metrics:null,latest_alerts:[],latest_risks:[],latest_dispatches:[],latest_evacuation:[],resources:[],population_latest:[]
    };
    if(!operationalAccess)return json(result);
    const [alerts,risks,dispatches,resources,evacuation,population,counts]=await Promise.all([
      sql`select a.id,a.alert_code,a.title,a.hazard_type,a.alert_level,a.status,a.created_at,a.issued_at,p.name as province,m.name as municipality from angola_agritech.emergency_alerts a left join angola_agritech.provinces p on p.id=a.province_id left join angola_agritech.municipalities m on m.id=a.municipality_id where ${scopeFilter("a")} order by a.created_at desc limit 12`,
      sql`select r.id,r.hazard_type,r.risk_level,r.status,r.probability_percent,r.confidence_percent,r.exposed_population_estimate,r.observed_at,p.name as province,m.name as municipality from angola_agritech.risk_assessments r left join angola_agritech.provinces p on p.id=r.province_id left join angola_agritech.municipalities m on m.id=r.municipality_id where ${scopeFilter("r")} order by r.observed_at desc nulls last limit 12`,
      sql`select d.id,d.request_code,d.requested_service,d.urgency,d.title,d.status,d.created_at,p.name as province,m.name as municipality from angola_agritech.emergency_dispatch_requests d left join angola_agritech.provinces p on p.id=d.province_id left join angola_agritech.municipalities m on m.id=d.municipality_id where ${scopeFilter("d")} order by d.created_at desc limit 12`,
      sql`select r.id,r.resource_code,r.resource_type,r.operational_status,r.capacity_count,i.name as institution,p.name as province,m.name as municipality from angola_agritech.emergency_resource_registry r join angola_agritech.emergency_institutions i on i.id=r.institution_id left join angola_agritech.provinces p on p.id=r.province_id left join angola_agritech.municipalities m on m.id=r.municipality_id where ${scopeFilter("r")} order by r.updated_at desc limit 20`,
      sql`select o.id,o.operation_code,o.operation_status,o.people_evacuated_count,o.people_assisted_count,o.lead_authority,o.started_at,p.name as province,m.name as municipality from angola_agritech.evacuation_operations o left join angola_agritech.provinces p on p.id=o.province_id left join angola_agritech.municipalities m on m.id=o.municipality_id where ${scopeFilter("o")} order by o.created_at desc limit 12`,
      sql`select ps.id,ps.reference_year,ps.population_total,ps.births_total,ps.deaths_total,ps.households_total,ps.validation_status,p.name as province,m.name as municipality from angola_agritech.population_statistics ps left join angola_agritech.provinces p on p.id=ps.province_id left join angola_agritech.municipalities m on m.id=ps.municipality_id where ${scopeFilter("ps")} order by ps.reference_year desc limit 12`,
      sql`select (select count(*)::int from angola_agritech.emergency_alerts a where ${scopeFilter("a")}) as alerts,(select count(*)::int from angola_agritech.risk_assessments r where ${scopeFilter("r")}) as risks,(select count(*)::int from angola_agritech.emergency_dispatch_requests d where ${scopeFilter("d")}) as dispatches,(select count(*)::int from angola_agritech.emergency_resource_registry r where ${scopeFilter("r")}) as resources,(select count(*)::int from angola_agritech.evacuation_operations o where ${scopeFilter("o")}) as evacuations,(select count(*)::int from angola_agritech.population_statistics ps where ${scopeFilter("ps")}) as population_records`
    ]);
    result.metrics=counts[0]??null;result.latest_alerts=alerts;result.latest_risks=risks;result.latest_dispatches=dispatches;result.resources=resources;result.latest_evacuation=evacuation;result.population_latest=population;
    return json(result);
  }catch(error){console.error("governance dashboard error",error);return json({error:"Could not assemble governance dashboard data",detail:String(error).slice(0,400)},502);}
  finally{await sql.end({timeout:5});}
});