-- Pre-register all provincial governments from the official territorial catalogue.
-- Institutional records remain proposed until each government validates them.

insert into angola_agritech.emergency_institutions
  (institution_code,name,institution_type,jurisdiction_level,integration_status,mandate_notes)
select 'AO-GP-'||p.official_code,'Governo Provincial de '||p.name,
       'local_administration','provincial','proposed',
       'Pré-registo institucional automático a partir do catálogo territorial e código oficial da Lei n.º 8/25. Designação orgânica, contactos, representante e autorização de integração pendentes de validação.'
from angola_agritech.provinces p
where p.official_code is not null and p.code_system='LEI_8_25'
on conflict (institution_code) do nothing;

insert into angola_agritech.institution_territorial_scopes
  (institution_id,province_id,scope_status,source_reference)
select i.id,p.id,'proposed','Pré-registo territorial a partir do catálogo nacional; validar formalmente com o Governo Provincial.'
from angola_agritech.provinces p
join angola_agritech.emergency_institutions i on i.institution_code='AO-GP-'||p.official_code
where p.official_code is not null and p.code_system='LEI_8_25'
and not exists (
  select 1 from angola_agritech.institution_territorial_scopes s
  where s.institution_id=i.id and s.province_id=p.id and s.municipality_id is null and s.commune_id is null
);
