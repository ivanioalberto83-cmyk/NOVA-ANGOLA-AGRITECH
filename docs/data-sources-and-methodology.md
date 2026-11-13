# NOVA ANGOLA AGRITECH — fontes e metodologia

## Princípio de governação dos dados

Cada observação apresentada deve identificar a fonte, produto, data/período, unidade, cobertura espacial, resolução, metodologia e limitações. Valores demonstrativos nunca devem ser apresentados como medições reais. Quando não há dados, a interface apresenta explicitamente a indisponibilidade.

## Dados actualmente ligados

### Copernicus Sentinel-2 L2A

- Serviço: Copernicus Data Space Ecosystem / Sentinel Hub Statistical API.
- Colecção: `sentinel-2-l2a`.
- Índice NDVI: `(B08 - B04) / (B08 + B04)`.
- Índice NDWI utilizado: `(B03 - B08) / (B03 + B08)` — formulação Green–NIR de McFeeters; não confundir com NDMI.
- Grelha actual do piloto: 100 m, calculada a partir da AOI provisória.
- Máscara: classes SCL 0, 1, 3, 8, 9, 10 e 11 excluídas.
- Composição temporal: intervalo diário UTC. O produto STAC seleccionado é uma referência de cena, não uma restrição exclusiva de todos os pixels àquele Product ID.
- Limitação territorial: a AOI actual é uma bbox provisória, não uma parcela de mandioca verificada no terreno.

Último resultado de referência conhecido (aquisição 2026-11-04):
- NDVI médio: 0.615517; mínimo: -1.000000; máximo: 0.896631.
- NDWI médio: -0.546828.
- Pixels válidos: 218060; sem dados: 25147; total da grelha: 243207.
- Cobertura válida calculada: aproximadamente 89,7%.
- Estado interno: `usable`; este estado representa suficiência técnica de pixels/API, não validação agronómica independente.

### NASA POWER Daily API

A nova Edge Function `agritech-dashboard-data` consulta a API diária NASA POWER com a comunidade Agroclimatology (AG), para o centro da AOI provisória do piloto. A janela é de 30 dias, até ao dia UTC anterior à consulta.

Parâmetros solicitados:
- `PRECTOTCORR`: precipitação corrigida (mm/dia).
- `T2M`, `T2M_MAX`, `T2M_MIN`: temperatura (°C).
- `RH2M`: humidade relativa (%).
- `WS10M`: velocidade do vento a 10 m (m/s).
- `ALLSKY_SFC_SW_DWN`: radiação solar descendente em céu real (unidade devolvida pela NASA POWER, descrita nos metadados da resposta).

Limitações:
- É uma estimativa em grelha para um ponto representativo, não uma observação de estação meteorológica.
- Valores indisponíveis são convertidos em nulos; não são interpolados nem preenchidos artificialmente.
- Nesta fase, a série é obtida em tempo de consulta e ainda não é persistida em `weather_observations`.

## Cartografia

- O mapa usa Leaflet com OpenStreetMap e uma camada de imagem de referência Esri World Imagery.
- O contorno nacional é obtido através do geoBoundaries gbOpen ADM0.
- A consulta geoBoundaries ADM1 disponível para Angola representa 18 unidades administrativas e dados de 2021. Não é usada como limite provincial actual.
- A Lei n.º 14/24 estabelece 21 províncias, 326 municípios e 378 comunas. A camada poligonal administrativa actual só será activada depois de obter geometria oficial compatível com essa divisão.
- A bbox de Malanje é apresentada como provisória e não como limite de exploração.

## Segurança e acesso

- A função de dados exige JWT válido e confirma o utilizador através do Supabase Auth `getUser`.
- A consulta de dados do piloto ocorre exclusivamente no servidor e está limitada ao código `NAAT-MAL-CASSAVA-001`.
- As tabelas do schema `angola_agritech` mantêm RLS activo. A auditoria identificou ausência de políticas no schema; por isso, não se concede acesso directo do navegador às tabelas nem se cria política genérica.
- Nenhuma tabela, política RLS ou registo de produção foi alterado nesta fase.

## Integrações planeadas — ainda não activas

- CHIRPS v3: precipitação histórica e anomalias; cálculo de SPI só após histórico e climatologia de referência adequados.
- ERA5: reanálise climática para contexto histórico e anomalias.
- INAMET: confronto com observações nacionais, quando houver acesso e formatos autorizados.
- Solo e água: humidade do solo, evapotranspiração, relevo e erosão.
- Ambiente: fogo activo/área ardida e mudanças de cobertura do solo.
- Fitossanidade: serviços oficiais e registos de campo verificados.
- Produção: área plantada, colheita, produtividade e perdas confirmadas.

## Referências principais

- geoBoundaries API: https://www.geoboundaries.org/api.html
- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- CHIRPS v3 — Climate Hazards Center: https://www.chc.ucsb.edu/data/chirps3
- Lei n.º 14/24 — Divisão Político-Administrativa de Angola.
