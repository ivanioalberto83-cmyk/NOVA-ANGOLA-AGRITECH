-- Fonte oficial: Lei n.º 8/25, Diário da República, I Série n.º 176, 16-09-2025, pp. 20321-20322.
-- Codificação territorial oficial de Malanje (MJE / 09).
insert into agritech.unidades_territoriais
(codigo_pais,tipo,codigo_oficial,nome_oficial,nome_normalizado,sede_administrativa,estado,diploma_legal,fonte_url,fonte_pagina,validado_em)
values ('AO','PROVINCIA','AOMJE09','Malanje','malanje','Malanje','ACTIVO','Lei n.º 14/24; Lei n.º 8/25','https://files.lex.ao/assembleia-nacional/2025/lei-n-o-8-25-de-16-de-setembro/download/lei-n-o-8-25-de-16-de-setembro_assembleia-nacional_lex-ao.pdf','20321-20322',now())
on conflict (codigo_oficial) do update set nome_oficial=excluded.nome_oficial,nome_normalizado=excluded.nome_normalizado,sede_administrativa=excluded.sede_administrativa,fonte_url=excluded.fonte_url,fonte_pagina=excluded.fonte_pagina,validado_em=excluded.validado_em;

with dados(codigo,nome) as (values
('01','Calandula'),('02','Malanje'),('03','Cacuso'),('04','Massango'),('05','Marimba'),('06','Quela'),('07','Quirima'),('08','Cangandala'),('09','Cahombo'),('10','Kunda dya Baze'),('11','Cambundi Catembo'),('12','Caculama'),('13','Kiwaba Nzoji'),('14','Luquembo'),('15','Cateco Cangola'),('16','Mbanji ya Ngola'),('17','Cuale'),('18','Pungo a Ndongo'),('19','Ngola Luiji'),('20','Quihuhu'),('21','Xandel'),('22','Cambo Suinginge'),('23','Milando'),('24','Quitapa'),('25','Capunda'),('26','Muquixe'),('27','Quessua')
)
insert into agritech.unidades_territoriais
(codigo_pais,tipo,unidade_pai_id,codigo_oficial,nome_oficial,nome_normalizado,estado,diploma_legal,fonte_url,fonte_pagina,validado_em)
select 'AO','MUNICIPIO',p.id,'AOMJE09'||d.codigo,d.nome,lower(d.nome),'ACTIVO','Lei n.º 8/25, de 16 de Setembro','https://files.lex.ao/assembleia-nacional/2025/lei-n-o-8-25-de-16-de-setembro/download/lei-n-o-8-25-de-16-de-setembro_assembleia-nacional_lex-ao.pdf','20321-20322',now()
from dados d cross join agritech.unidades_territoriais p where p.codigo_oficial='AOMJE09'
on conflict (codigo_oficial) do update set nome_oficial=excluded.nome_oficial,nome_normalizado=excluded.nome_normalizado,unidade_pai_id=excluded.unidade_pai_id,fonte_url=excluded.fonte_url,fonte_pagina=excluded.fonte_pagina,validado_em=excluded.validado_em;

with dados(municipio,codigo,nome) as (values
('01','01','Calandula'),('01','02','Cota'),('02','01','Malanje'),('02','02','Lombe'),('03','01','Cacuso'),('03','02','Socueco'),('05','01','Marimba'),('05','02','Mangando'),('06','01','Quela'),('06','02','Bângalas'),('07','01','Quirima'),('07','02','Sautar'),('08','01','Cangandala'),('08','02','Caribo'),('08','03','Culamagia'),('09','01','Cahombo'),('09','02','Micanda'),('10','01','Kunda dya Baze'),('10','02','Lemba'),('11','01','Cambundi Catembo'),('11','02','Dumba Cambango'),('12','01','Caculama'),('12','02','Caxinga'),('13','01','Kiwaba Nzoji'),('13','02','Mufuma'),('14','01','Luquembo'),('14','02','Dombo wa Zanga'),('16','01','Mbanji ya Ngola'),('16','02','Cabombo'),('19','01','Ngola Luiji'),('19','02','Cambaxe'),('20','01','Quihuhu'),('20','02','Quinguengue'),('21','01','Xandel'),('21','02','Moma'),('25','01','Capunda'),('25','02','Quimbango'),('25','03','Cunga Palanga')
)
insert into agritech.unidades_territoriais
(codigo_pais,tipo,unidade_pai_id,codigo_oficial,nome_oficial,nome_normalizado,estado,diploma_legal,fonte_url,fonte_pagina,validado_em)
select 'AO','COMUNA',m.id,'AOMJE09'||d.municipio||d.codigo,d.nome,lower(d.nome),'ACTIVO','Lei n.º 8/25, de 16 de Setembro','https://files.lex.ao/assembleia-nacional/2025/lei-n-o-8-25-de-16-de-setembro/download/lei-n-o-8-25-de-16-de-setembro_assembleia-nacional_lex-ao.pdf','20321-20322',now()
from dados d join agritech.unidades_territoriais m on m.codigo_oficial='AOMJE09'||d.municipio
on conflict (codigo_oficial) do update set nome_oficial=excluded.nome_oficial,nome_normalizado=excluded.nome_normalizado,unidade_pai_id=excluded.unidade_pai_id,fonte_url=excluded.fonte_url,fonte_pagina=excluded.fonte_pagina,validado_em=excluded.validado_em;

insert into agritech.culturas(codigo,nome,nome_cientifico,grupo,estado)
values ('MAN','Mandioca','Manihot esculenta','RAIZES_E_TUBERCULOS','ACTIVA')
on conflict (codigo) do update set nome=excluded.nome,nome_cientifico=excluded.nome_cientifico,grupo=excluded.grupo;

insert into agritech.regioes_agricolas(codigo,nome,tipo,descricao,fonte_dados,nivel_confianca,estado)
values ('MAL-PILOT-001','Malanje — Área de Estudo Piloto','PRODUCAO','Área de estudo do piloto de monitorização de mandioca. A delimitação espacial e os municípios abrangidos permanecem por validar no terreno; não representa uma região administrativa oficial.','Projecto NOVA ANGOLA AGRITECH; delimitação provisória por BBOX a validar','BAIXO','RASCUNHO')
on conflict (codigo) do update set descricao=excluded.descricao,fonte_dados=excluded.fonte_dados,nivel_confianca=excluded.nivel_confianca,estado=excluded.estado;
