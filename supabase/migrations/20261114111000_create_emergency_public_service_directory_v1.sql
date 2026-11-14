-- Public emergency service directory for NOVA ANGOLA AGRITECH.
-- Additive migration: does not modify territorial, agricultural or pilot records.

create table if not exists angola_agritech.emergency_service_contacts (
  id uuid primary key default gen_random_uuid(),
  service_code text not null unique,
  service_name text not null,
  service_category text not null check (service_category in ('general_emergency','police','fire_rescue','ambulance')),
  dial_number text not null check (dial_number ~ '^[0-9]{3,6}$'),
  institution_id uuid null references angola_agritech.emergency_institutions(id) on delete restrict,
  coverage_level text not null default 'national' check (coverage_level in ('national','provincial','municipal','local')),
  source_authority text not null,
  source_reference text not null,
  source_url text not null,
  allocation_status text not null default 'official_assignment' check (allocation_status in ('official_assignment','pending_confirmation','withdrawn')),
  operational_status text not null default 'unverified' check (operational_status in ('unverified','verified','unavailable','restricted')),
  public_visible boolean not null default true,
  click_to_call boolean not null default true,
  last_verified_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists emergency_service_contacts_public_idx
  on angola_agritech.emergency_service_contacts (public_visible, service_category, dial_number);

alter table angola_agritech.emergency_service_contacts enable row level security;
revoke all on table angola_agritech.emergency_service_contacts from anon, authenticated;
grant select on table angola_agritech.emergency_service_contacts to authenticated;
drop policy if exists emergency_service_contacts_read_authenticated on angola_agritech.emergency_service_contacts;
create policy emergency_service_contacts_read_authenticated
  on angola_agritech.emergency_service_contacts
  for select to authenticated
  using (true);

insert into angola_agritech.emergency_institutions
  (institution_code,name,institution_type,jurisdiction_level,integration_status,official_source_url,mandate_notes)
values
  ('AO-CISP','Centro Integrado de Segurança Pública (CISP)','police','national','proposed',
   'https://c2a.portais.gov.ao/uploads/3revista_digital_minint_web_2021_v_1_6_1_9264214766141cafbc5d2e_86aaf563e2.pdf',
   'Entidade identificada em publicação institucional do MININT; integração técnica e canais operacionais carecem de acordo formal.'),
  ('AO-PNA','Polícia Nacional de Angola','police','national','proposed',
   'https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf',
   'Número 113 atribuído à Polícia Nacional no Plano Nacional de Numeração; confirmar disponibilidade operacional por operador e província.'),
  ('AO-SNPCB','Serviço Nacional de Protecção Civil e Bombeiros','civil_protection_fire','national','proposed',
   'https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf',
   'Número 115 atribuído a Bombeiros no Plano Nacional de Numeração; integração institucional ainda não autorizada.'),
  ('AO-INEMA','Instituto Nacional de Emergências Médicas (INEMA)','health_emergency','national','proposed',
   null,
   'Entidade incluída no cadastro nacional. A associação operacional do número 116 ao INEMA carece de confirmação formal.')
on conflict (institution_code) do update set
  name=excluded.name,
  institution_type=excluded.institution_type,
  jurisdiction_level=excluded.jurisdiction_level,
  official_source_url=coalesce(angola_agritech.emergency_institutions.official_source_url,excluded.official_source_url),
  mandate_notes=excluded.mandate_notes,
  updated_at=now();

insert into angola_agritech.emergency_service_contacts
  (service_code,service_name,service_category,dial_number,institution_id,source_authority,source_reference,source_url,allocation_status,operational_status,notes)
select v.service_code,v.service_name,v.service_category,v.dial_number,
       case when v.dial_number='116' then null else i.id end,
       v.source_authority,v.source_reference,v.source_url,
       'official_assignment','unverified',v.notes
from (values
 ('AO-EMG-111','CISP — Número de Emergência','general_emergency','111','MININT / INACOM','CISP identificado como número nacional de emergência; Plano Nacional de Numeração, Decreto Presidencial n.º 181/19','https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf','Número atribuído; disponibilidade operacional actual por rede e território ainda não testada.'),
 ('AO-EMG-112','CISP — Número Nacional de Emergência','general_emergency','112','INACOM','Plano Nacional de Numeração, Decreto Presidencial n.º 181/19','https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf','Número previsto no plano nacional; confirmar funcionamento actual com INACOM e operadores.'),
 ('AO-EMG-113','Polícia Nacional','police','113','INACOM','Plano Nacional de Numeração, Decreto Presidencial n.º 181/19','https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf','Número atribuído à Polícia Nacional; disponibilidade operacional ainda não testada.'),
 ('AO-EMG-115','Bombeiros','fire_rescue','115','INACOM','Plano Nacional de Numeração, Decreto Presidencial n.º 181/19','https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf','Número atribuído a Bombeiros; confirmar cobertura e atendimento actual.'),
 ('AO-EMG-116','Serviço de Ambulância (entidade operadora a confirmar)','ambulance','116','INACOM','Plano Nacional de Numeração, Decreto Presidencial n.º 181/19','https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf','O Plano Nacional de Numeração atribui 116 ao Serviço de Ambulância. A ligação operacional directa ao INEMA deve ser confirmada pela instituição e pelo INACOM.')
) as v(service_code,service_name,service_category,dial_number,source_authority,source_reference,source_url,notes)
left join angola_agritech.emergency_institutions i on i.institution_code =
  case v.dial_number when '111' then 'AO-CISP' when '112' then 'AO-CISP' when '113' then 'AO-PNA' when '115' then 'AO-SNPCB' else 'AO-INEMA' end
on conflict (service_code) do update set
 service_name=excluded.service_name,
 service_category=excluded.service_category,
 dial_number=excluded.dial_number,
 institution_id=excluded.institution_id,
 source_authority=excluded.source_authority,
 source_reference=excluded.source_reference,
 source_url=excluded.source_url,
 allocation_status='official_assignment',
 operational_status='unverified',
 notes=excluded.notes,
 updated_at=now();
