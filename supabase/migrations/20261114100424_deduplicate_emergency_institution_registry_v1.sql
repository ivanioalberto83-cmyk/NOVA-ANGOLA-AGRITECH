-- Consolidate service-number links with the existing national institution records.
update angola_agritech.emergency_service_contacts
set institution_id=(select id from angola_agritech.emergency_institutions where institution_code='AO-MININT-PNA'),updated_at=now()
where service_code='AO-EMG-113';

update angola_agritech.emergency_service_contacts
set institution_id=(select id from angola_agritech.emergency_institutions where institution_code='AO-SPCB'),updated_at=now()
where service_code='AO-EMG-115';

update angola_agritech.emergency_institutions
set official_source_url='https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf',
    mandate_notes='Número 113 atribuído à Polícia Nacional no Plano Nacional de Numeração. Disponibilidade operacional por rede e província ainda carece de confirmação.'
where institution_code='AO-MININT-PNA';

update angola_agritech.emergency_institutions
set official_source_url='https://inacom.gov.ao/wp-content/uploads/2025/06/decreto_presidencial_no_181_19-28_maio_de_2019-9_de_dezembro_de_2019-1.pdf',
    mandate_notes='Número 115 atribuído a Bombeiros no Plano Nacional de Numeração. Integração técnica e disponibilidade operacional carecem de confirmação formal.'
where institution_code='AO-SPCB';

delete from angola_agritech.emergency_institutions where institution_code in ('AO-PNA','AO-SNPCB');
