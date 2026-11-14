create or replace view angola_agritech.v_demographic_indicators
with (security_invoker=true) as
select p.id,p.province_id,p.municipality_id,p.commune_id,p.reference_year,
 p.population_total,p.households_total,p.male_total,p.female_total,
 p.births_total,p.deaths_total,p.births_registered,p.population_urban,p.population_rural,p.net_migration,p.age_distribution,
 case when p.population_total>0 and p.births_total is not null then round(p.births_total::numeric/p.population_total*1000,2) end as crude_birth_rate_per_1000,
 case when p.population_total>0 and p.deaths_total is not null then round(p.deaths_total::numeric/p.population_total*1000,2) end as crude_death_rate_per_1000,
 case when p.births_total is not null and p.deaths_total is not null then p.births_total-p.deaths_total end as natural_increase,
 case when p.births_total>0 and p.births_registered is not null then round(p.births_registered::numeric/p.births_total*100,2) end as birth_registration_percent,
 p.source_authority,p.source_reference,p.validation_status
from angola_agritech.population_statistics p;
grant select on angola_agritech.v_demographic_indicators to authenticated;