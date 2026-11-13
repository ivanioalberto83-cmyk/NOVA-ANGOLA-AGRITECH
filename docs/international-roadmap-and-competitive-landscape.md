# NOVA ANGOLA AGRITECH — Roadmap internacional e análise competitiva
Data: 13 de Novembro de 2026
Estado: plano de produto e validação; não representa funcionalidades já implementadas.

## Posicionamento
Construir uma plataforma angolana de inteligência agrícola e ambiental, com capacidade nacional e extensível a África Austral e outros mercados africanos. O diferencial não será apenas mostrar NDVI: será combinar observação da Terra, clima, água, solo, vigilância fitossanitária, produção, economia agrícola, operações de campo e relatórios rastreáveis.

## Concorrência e referências identificadas publicamente

### Angola — concorrência e alternativas locais
1. Observa+ (https://observamais.ao/agro/): monitorização agrícola por satélite, saúde da vegetação, aptidão dos campos, dados agroclimáticos, desenho de fazendas e relatórios. A página apresenta cobertura declarada de 21 províncias, 326 municípios e 57 milhões de hectares. Concorrente local directo no espaço de monitorização satélite e referência institucional relevante. Não presumir que a cobertura declarada equivale a validação operacional de cada parcela.
2. Multitel Agro (https://www.multitelagro.com/): agricultura de precisão com sensores LoRaWAN, dados de solo/ambiente/clima, plataforma Tago.IO, alertas e operação de sensores em campo. Concorrente adjacente forte em IoT e monitorização em tempo quase real.
3. Kilunga (https://www.kilunga.com/): posiciona-se em agricultura de precisão para África, com Sentinel-1/2, NDVI/NWI, monitorização de parcelas, gestão operacional e recomendações. Declara hectares monitorizados e resultados; tratar números como declarações do fornecedor até verificação independente.
4. AgroKuia (https://www.agrokuia.com/): IA agrícola com diagnóstico por fotografia, assistência técnica, meteorologia, voz/offline e foco em dados locais das províncias angolanas. Concorrente adjacente em assistência agronómica e experiência do agricultor.
5. SoilByte (https://soilbyte.com/): inteligência agrícola com satélite, confirmação por drones e equipas de campo; posiciona relatórios como evidência para financiadores e seguradoras. Concorrente em monitorização e verificação de explorações.
6. AgroCIA (https://www.agrocia.tech/) e Kuteca (https://kiahenda.ao/): digitalização, ligação entre produtores, transporte, mercado e investimento. Concorrência adjacente em cadeia de valor e serviços agrícolas.

### África e referências internacionais
- FAO ASIS, GIEWS, WaPOR e AQUASTAT: referências institucionais e potenciais fontes/metodologias para seca agrícola, segurança alimentar, produtividade da água e recursos hídricos. São sobretudo referências e alternativas institucionais, não necessariamente concorrentes comerciais directos.
- FEWS NET / USGS: monitorização e alerta precoce de seca, cheias e insegurança alimentar em vários países africanos. Referência em análise regional e alerta precoce.
- CHC Early Warning Explorer: visualização, análise e exportação de séries de precipitação e produtos CHIRPS.
- Plataformas comerciais internacionais a avaliar em benchmark formal: SatSure, AWhere, Satelligence, Farmonaut, Farmdar, CropWatch e soluções de agricultura de precisão com sensores e drones. Lista indicativa, não classificação de mercado.

## Diferenciação que a NOVA deve conquistar
1. Angola-first: nomenclatura administrativa actual, culturas, calendário agrícola, sazonalidade e idiomas/contexto local.
2. Nacional até parcela: mapa nacional, província, município, exploração e parcela, com geometria e proveniência verificadas.
3. Multi-fonte e independente: Sentinel-1/2, CHIRPS v3, NASA POWER, ERA5, WaPOR, dados oficiais INAMET e registos de campo.
4. Evidência rastreável: fonte, produto, versão, resolução, data de aquisição/publicação, unidade, cobertura, método, qualidade e limitações em cada indicador.
5. Integração campo-satélite: fotografias, sensores, amostras de solo, visitas, validação fitossanitária e confirmação de alertas.
6. Alertas explicáveis: evidência e confiança, distinguindo risco potencial de ocorrência confirmada.
7. Economia agrícola: custos, insumos, produtividade, colheita, perdas, armazenamento e preços quando existirem fontes fiáveis.
8. Operação em conectividade limitada: PWA/mobile, cache de mapas e formulários offline, sincronização com controlo de conflitos.
9. Relatórios para decisões: PDF técnico e executivo, exportação de dados, trilho de auditoria e metodologia reproduzível.
10. Modelo institucional e comercial: perfis para governo, províncias, cooperativas, empresas agrícolas, técnicos e agricultores; isolamento de dados por organização.

## Plano de construção — ordem de execução

### Fase 0 — corrigir e homologar o acesso e a versão
- Confirmar que o URL de preview abre a página de login Supabase, e não apenas página informativa ou versão de produção anterior.
- Validar variáveis Vercel em Preview, domínio e commit efectivamente servido.
- Testar login, logout, sessão persistente, refresh e chamada autenticada à Edge Function.
- Não remover JWT nem expor tabelas directamente no browser.

### Fase 1 — CHIRPS v3 e clima histórico
- Integrar CHIRPS v3 preliminar e final como produtos separados.
- Manter diariamente os dois métodos rnl (particionamento ERA5) e sat (particionamento IMERG Late V07) em séries distintas.
- Usar pentad e mensal como bases de balanço; usar daily com caveat de data-label e método de desagregação.
- Guardar proveniência, versão, unidade mm, domínio, período, tipo de produto, data de ingestão e estado preliminar/final.
- Calcular totais mensais/estacionais, anomalias contra climatologia de referência e SPI-1/3/6/12 apenas depois de validar série e método.
- Não tratar CHIRPS como pluviometria de estação; cruzar com INAMET sempre que houver dados acessíveis.

### Fase 2 — mapa nacional e território
- Obter geometrias oficiais compatíveis com a divisão político-administrativa em vigor.
- Validar limites de 21 províncias, municípios e comunas, nomes/códigos e datas de vigência.
- Permitir desenhar/importar parcelas GeoJSON/KML/Shapefile; calcular área e guardar versão da geometria.
- Activar camadas Sentinel-2, Sentinel-1, CHIRPS, fogo, relevo, solos e limites, com legenda, escala, datas e opacidade.
- A AOI actual de Malanje permanece provisória até ser substituída por polígono validado.

### Fase 3 — água, seca e ambiente
- Integrar ERA5/ERA5-Land, NASA POWER e FAO WaPOR, verificando escalas, unidades e licenças.
- Construir balanço hídrico com precipitação, evapotranspiração de referência/cultura, armazenamento no solo e irrigação quando houver dados.
- Criar indicadores de seca meteorológica, agrícola e hidrológica separadamente.
- Integrar humidade do solo, declive/erosão, uso/cobertura do solo, fogo activo e área ardida.
- Não inferir disponibilidade de água ou seca hidrológica só a partir de NDWI ou precipitação de 30 dias.

### Fase 4 — pragas, doenças e trabalho de campo
- Registo georreferenciado com cultura, estádio fenológico, sintomas, fotografia, severidade, data e técnico.
- Base de conhecimento por cultura e região, com fontes fitossanitárias oficiais.
- Modelo de risco climático como triagem, nunca como diagnóstico confirmado.
- Fluxo de validação: alerta potencial → inspecção → confirmação → recomendação → encerramento.
- Alertas e recomendações devem guardar evidência e responsável.

### Fase 5 — produção, economia e balanços
- Registar campanha, cultura, variedade, datas de sementeira/plantio, área, operações, insumos e custos.
- Colheita pesada/medida, produtividade por hectare, perdas e grau de confiança.
- Balanços por unidade e período: água (mm/m³), produção (t), produtividade (t/ha), custos (Kz), perdas e stocks.
- Não agregar indicadores com unidades ou cobertura incompatíveis.

### Fase 6 — relatórios, APIs e escala
- PDF provincial, municipal, exploração e parcela; mapas, gráficos, fontes e notas metodológicas.
- API versionada, exportação CSV/GeoJSON/COG/NetCDF quando aplicável.
- Auditoria, RBAC, isolamento multi-organização, backups e testes de recuperação.
- Monitorização de ingestão, freshness, falhas, custos e qualidade.
- PWA com modo offline e sincronização robusta.

## Modelo de dados mínimo a validar antes de qualquer migração
- data_sources, source_products, ingestion_runs
- territorial_units, farms, farm_parcels, parcel_geometry_versions
- climate_observations, rainfall_grid_summaries, drought_indices
- satellite_observations, vegetation_summaries, environmental_events
- field_observations, pest_disease_reports, alert_events
- campaigns, crop_areas, farm_operations, harvest_records, input_costs
- report_jobs, audit_events

Este é um modelo lógico proposto, não uma instrução para criar tabelas sem auditoria do schema actual.

## Critérios de nível internacional
- 100% dos indicadores publicados com fonte, data, unidade, resolução/cobertura e método.
- Nenhum dado sintético apresentado como observado.
- Testes de reconciliação de unidades e totais; detecção de duplicados e atrasos.
- Linhagem até ao produto original e versão de processamento.
- Alertas com níveis de confiança e validação humana para fitossanidade.
- Cobertura e qualidade espacial visíveis no mapa.
- Testes de segurança multi-tenant, RLS e controlo de acesso.
- PDFs reproduzíveis e exportação de dados.
- Benchmarks de precisão contra estações, parcelas e observações de campo angolanas.

## Fontes de referência
- CHC CHIRPS v3: https://www.chc.ucsb.edu/data/chirps3
- CHC Data Repository: https://data.chc.ucsb.edu/products/CHIRPS/v3.0/
- CHC Data Downloader: https://github.com/chc-ucsb/chc-data-download
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- FAO Drought Monitoring: https://www.fao.org/in-action/drought-portal/preparedness/monitoring-and-early-warning-system/
- FEWS NET / USGS: https://www.usgs.gov/international-programs/fews-net
- FAO WaPOR: https://www.fao.org/in-action/remote-sensing-for-water-productivity/
- Observa+: https://observamais.ao/agro/
- Multitel Agro: https://www.multitelagro.com/
- Kilunga: https://www.kilunga.com/
- AgroKuia: https://www.agrokuia.com/
- SoilByte: https://soilbyte.com/
- AgroCIA: https://www.agrocia.tech/
- Kuteca: https://kiahenda.ao/
