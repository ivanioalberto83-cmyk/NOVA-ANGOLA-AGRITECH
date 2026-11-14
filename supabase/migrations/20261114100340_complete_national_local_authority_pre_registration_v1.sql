-- Pre-register all municipal administrations from the official territorial catalogue.
-- Commune-level territorial units remain available as scopes; their legal administrative structure
-- must be confirmed before creating separate institutional records.

insert into angola_agritech.emergency_institutions
  (institution_code,name,institution_type,jurisdiction_level,integration_status,mandate_notes)
select 'AO-AM-'||m.official_code,'Administração Municipal de '||m.name,
       'local_administration','municipal','proposed',
       'Pré-registo institucional automático a partir do catálogo territorial e código oficial da Lei n.º 8/25. Designação orgânica, contactos, representante e autorização de integração pendentes de validação.'
from angola_agritech.municipalities m
where m.official_code is not null and m.code_system='ANGOLA_LAW_8_25'
on conflict (institution_code) do nothing;

insert into angola_agritech.institution_territorial_scopes
  (institution_id,province_id,municipality_id,scope_status,source_reference)
select i.id,m.province_id,m.id,'proposed','Pré-registo territorial a partir do catálogo nacional; validar formalmente com a Administração Municipal.'
from angola_agritech.municipalities m
join angola_agritech.emergency_institutions i on i.institution_code='AO-AM-'||m.official_code
where m.official_code is not null and m.code_system='ANGOLA_LAW_8_25'
and not exists (
  select 1 from angola_agritech.institution_territorial_scopes s
  where s.institution_id=i.id and s.province_id=m.province_id and s.municipality_id=m.id and s.commune_id is null
);
