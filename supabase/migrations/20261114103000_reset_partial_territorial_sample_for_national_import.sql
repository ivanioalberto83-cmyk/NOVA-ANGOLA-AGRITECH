-- Remove a amostra territorial parcial e não validada introduzida na fase anterior.
-- O cadastro passa a aguardar importação integral, linha a linha, do Anexo da Lei 8/25.
delete from agritech.regioes_agricolas_municipios;
delete from agritech.regiao_culturas;
delete from agritech.regioes_agricolas where codigo='MAL-PILOT-001';
delete from agritech.unidades_territoriais;
-- A cultura Mandioca permanece no catálogo nacional de culturas.
