-- Assign the province-level official code prefix exactly as published in the Annex to Law 8/25.
-- Keep the existing NOVA internal code in the "code" column to avoid breaking current foreign references.
update angola_agritech.provinces as p
set official_code = v.official_code,
    code_system = 'LEI_8_25',
    source_authority = 'Assembleia Nacional — Diário da República',
    source_reference = 'Lei n.º 8/25, de 16 de Setembro, Anexo sobre a Codificação Nacional',
    effective_from = date '2025-09-16'
from (values
  ('Cabinda','AOCDA01'),('Zaire','AOZRE02'),('Uíge','AOUGE03'),('Bengo','AOBGO04'),
  ('Luanda','AOLDA05'),('Icolo e Bengo','AOIBE06'),('Cuanza-Norte','AOCNO07'),
  ('Cuanza-Sul','AOCSU08'),('Malanje','AOMJE09'),('Lunda-Norte','AOLNO10'),
  ('Lunda-Sul','AOLSU11'),('Moxico','AOMCO12'),('Moxico Leste','AOMLE13'),
  ('Bié','AOBIE14'),('Huambo','AOHBO15'),('Benguela','AOBLA16'),('Namibe','AONBE17'),
  ('Huíla','AOHLA18'),('Cunene','AOCNE19'),('Cubango','AOCGO20'),('Cuando','AOCDO21')
) as v(name, official_code)
where p.name = v.name;
