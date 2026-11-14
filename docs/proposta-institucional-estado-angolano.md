# NOVA ANGOLA — Proposta de Plataforma Nacional de Inteligência Territorial, Demográfica, Agrícola e de Protecção Civil

**Documento de trabalho para apreciação institucional do Estado Angolano**  
**Versão:** 0.1 — 14 de Novembro de 2026  
**Proponente tecnológico:** NOVA ANGOLA AGRITECH  
**Estado do documento:** Proposta técnica em desenvolvimento; não constitui aprovação, homologação ou parceria institucional.

## 1. Resumo executivo

A NOVA ANGOLA é proposta como uma plataforma digital integrada de apoio à administração pública, ao planeamento territorial, à segurança alimentar, à gestão ambiental e à redução do risco de desastres. Pretende reunir, numa arquitectura nacional, informação territorial, demográfica, agrícola, climática, infra-estrutural e de protecção civil, com níveis de acesso e responsabilidade definidos por âmbito administrativo.

A plataforma pretende apoiar a tomada de decisão nacional, provincial e municipal através de indicadores rastreáveis, cartografia validada, monitorização de eventos, registo de ocorrências, planeamento de investimentos e coordenação de operações de emergência.

A solução não substitui o Instituto Nacional de Estatística, os serviços meteorológicos, os órgãos de Protecção Civil, as administrações locais ou outras entidades competentes. Funciona como instrumento tecnológico de integração, análise, alerta e apoio à coordenação, sujeito à governação e validação das instituições públicas.

## 2. Problema e oportunidade

A informação relevante para o planeamento e resposta pública encontra-se distribuída por diferentes entidades, sistemas, formatos e escalas territoriais. A falta de interoperabilidade e de uma visão geográfica comum pode dificultar:
- a identificação de localidades e populações expostas a riscos;
- o planeamento de serviços públicos e infra-estruturas;
- o acompanhamento de indicadores demográficos e de desenvolvimento;
- a monitorização da produção agrícola e das condições ambientais;
- a preparação de rotas, abrigos, recursos e operações de evacuação;
- a produção de relatórios consistentes para decisão e prestação de contas.

A proposta é criar uma camada de integração nacional, preservando a autoridade das fontes oficiais e a competência das entidades responsáveis por cada domínio.

## 3. Objectivos

1. Disponibilizar um cadastro territorial nacional coerente e auditável.
2. Integrar estatísticas demográficas oficiais, com série temporal e proveniência.
3. Apoiar o planeamento do desenvolvimento local e da distribuição de serviços.
4. Monitorizar agricultura, clima, água, solos e factores ambientais.
5. Identificar e acompanhar riscos naturais e tecnológicos.
6. Apoiar a preparação e coordenação de alertas, evacuação e assistência.
7. Facilitar relatórios nacionais, provinciais e municipais com dados verificáveis.

## 4. Módulos funcionais

### 4.1 Atlas e cadastro territorial
- Províncias, municípios e comunas segundo a divisão administrativa oficial aplicável.
- Registo complementar de bairros, aldeias, vilas, cidades e localidades.
- Geometrias administrativas, limites e áreas apenas quando provenientes de cartografia oficial ou validadas pela entidade competente.
- Histórico de alterações, fontes, datas de vigência e estado de validação.

### 4.2 Demografia e desenvolvimento
- População total por unidade administrativa e ano.
- Estrutura etária, sexo, agregados familiares e distribuição urbano/rural.
- Nascimentos, óbitos, registo de nascimento, migração e crescimento natural.
- Densidade populacional calculada apenas com população e área territorial compatíveis e validadas.
- Indicadores de acesso à água, energia, saneamento, educação, saúde, habitação e emprego.
- Metadados de fonte, metodologia, período de referência e qualidade.

A plataforma deverá utilizar os resultados do RGPH 2024 e as estimativas oficiais do INE para 2025–2027, nos termos de acesso e utilização definidos pela entidade produtora. Os dados preliminares, estimados e definitivos devem permanecer claramente distinguidos.

### 4.3 Agricultura e segurança alimentar
- Cadastro de explorações, parcelas, culturas e regiões agrícolas.
- Calendários agrícolas, áreas cultivadas, produção e produtividade.
- Monitorização por satélite e análise de vegetação.
- Estimativa de risco de perda de culturas, seca e stress hídrico.
- Integração progressiva de dados de campo e fontes institucionais.

### 4.4 Clima, água e ambiente
- Precipitação, temperatura, humidade, vento e outros parâmetros.
- Indicadores de seca, chuva extrema, disponibilidade hídrica e alterações de cobertura do solo.
- Observação por satélite e dados de estações, sempre com indicação da fonte, resolução e data.
- Separação entre observação, previsão e estimativa.

### 4.5 Gestão de riscos
- Cheias e inundações rápidas.
- Seca e escassez de água.
- Incêndios e queimadas.
- Tempestades, vento extremo e chuva intensa.
- Deslizamentos, erosão costeira e outros perigos relevantes.
- Avaliação de exposição, vulnerabilidade, probabilidade, confiança e população potencialmente afectada.

### 4.6 Protecção civil, alertas e evacuação
- Registo e classificação de alertas por nível e área afectada.
- Fluxo de validação, aprovação independente e registo de emissão.
- Inventário de abrigos, capacidade, água, saneamento, acessibilidade e apoio de saúde.
- Rotas de evacuação com estado de verificação e condicionantes.
- Operações, meios mobilizados e indicadores agregados de pessoas evacuadas e assistidas.
- Registo técnico da distribuição e entrega de mensagens por canal.

A emissão pública de alertas, a activação de sirenes e as ordens de evacuação dependem de autorização das autoridades competentes, de protocolos institucionais e da integração com operadores e sistemas de comunicação. A detecção automática não constitui, por si só, autorização para evacuar.

## 5. Modelo de governação e responsabilidades

Propõe-se que a governação institucional seja definida pelo Estado, com:
- coordenação nacional e definição de políticas de dados;
- pontos focais sectoriais para estatística, meteorologia, agricultura, ambiente, saúde, água, energia e infra-estruturas;
- articulação com os órgãos e comissões de Protecção Civil nos níveis nacional, provincial e municipal;
- validação técnica e administrativa dos dados por entidade competente;
- perfis de acesso por função e território;
- auditoria de consultas sensíveis, alterações, aprovações e emissões;
- mecanismos de correcção, contestação e retirada de dados desactualizados.

O proponente tecnológico não assume competências de autoridade pública nem valida dados em nome do Estado.

## 6. Princípios de dados e segurança

- Fonte, data, período, método e estado de validação em cada conjunto de dados.
- Separação clara entre dado oficial, dado administrativo, observação de satélite, estimativa e informação reportada no terreno.
- Princípio do mínimo acesso necessário e segregação por território.
- Protecção de dados pessoais, especialmente em situações de emergência.
- A camada de análise nacional deverá privilegiar contagens agregadas, evitando recolher nomes e dados individuais de vítimas sem base legal, necessidade e controlos adequados.
- Registos de auditoria e conservação de histórico.
- Cópias de segurança, recuperação de desastre, continuidade operacional e testes de segurança.
- Interoperabilidade por APIs documentadas e formatos abertos sempre que possível.

## 7. Enquadramento institucional e fontes de referência

A proposta deverá ser apreciada à luz do quadro legal e institucional vigente, incluindo:
- Lei n.º 28/03, de 7 de Novembro — Lei de Bases da Protecção Civil.
- Lei n.º 14/20, de 22 de Maio — enquadramento do Sistema Nacional de Protecção Civil e Bombeiros, incluindo comissões e centros operacionais.
- Resultados definitivos do Recenseamento Geral da População e Habitação 2024 e estimativas da população 2025–2027, publicados pelo INE.
- Divisão político-administrativa e cartografia oficial aplicáveis.

Referências públicas para consulta:
- INE — Resultados definitivos do RGPH 2024: https://www.ine.gov.ao/publicacoes/detalhes/NDc0MTE%3D
- INE — Estimativas da população 2025–2027: https://www.ine.gov.ao/noticias/detalhes/MjgxNTY%3D
- Lei n.º 28/03 — cópia de consulta: https://disasterlaw.ifrc.org/sites/default/files/media/disaster_law/2021-07/Angola%20-%20Lei%20No.%2028-03%20de%207%20de%20Novembro.pdf
- Lei n.º 14/20 — consulta: https://lex.ao/docs/assembleia-nacional/2020/lei-n-o-14-20-de-22-de-maio/

A equipa jurídica e as entidades públicas deverão confirmar a versão consolidada e a aplicabilidade actual de cada diploma antes de qualquer formalização.

## 8. Arquitectura tecnológica proposta

- Aplicação web modular, com interface nacional, provincial e municipal.
- Base de dados relacional com controlo de acesso por linha e por função.
- Catálogo territorial comum para todos os módulos.
- Serviços de ingestão e validação de dados oficiais e geoespaciais.
- Camada cartográfica e de análise geoespacial.
- Integração progressiva com fontes meteorológicas, satélite e sistemas públicos.
- Registo auditável de alertas, aprovações e comunicações.
- Ambientes separados de desenvolvimento, homologação e produção.

A tecnologia actualmente utilizada no ambiente de desenvolvimento inclui PostgreSQL/Supabase, aplicação web e alojamento de pré-visualização. A arquitectura final, alojamento, residência de dados, conectividade, continuidade e integração com sistemas do Estado deverão ser decididos em conjunto com as entidades públicas.

## 9. Plano de implementação proposto

### Fase 1 — Governação e validação
- Identificação das entidades proprietárias e produtoras de dados.
- Aprovação do modelo de governação, acesso e interoperabilidade.
- Inventário das fontes, qualidade, formatos, periodicidade e restrições legais.
- Validação da cartografia e do cadastro administrativo.

### Fase 2 — Demografia e cadastro nacional
- Importação controlada de dados do INE.
- Validação de correspondência entre unidades administrativas e séries estatísticas.
- Cálculo de indicadores e densidade apenas com áreas validadas.
- Painéis nacionais, provinciais e municipais.

### Fase 3 — Agricultura, clima e ambiente
- Integração de dados meteorológicos e de satélite.
- Cadastro de culturas, regiões e explorações.
- Modelos de risco agrícola, seca e precipitação extrema.
- Validação por técnicos e dados de campo.

### Fase 4 — Gestão de riscos e protecção civil
- Catálogo de perigos e avaliação de exposição.
- Inventário e verificação de abrigos e rotas.
- Fluxos de aprovação e registo de alertas.
- Exercícios simulados, sem comunicação pública real.
- Integração de canais de alerta após autorização institucional.

### Fase 5 — Homologação e expansão
- Testes funcionais, de carga, segurança e recuperação.
- Exercícios interinstitucionais e formação.
- Homologação formal pelos responsáveis designados.
- Expansão nacional faseada, com metas e indicadores aprovados.

## 10. Entregáveis para apreciação

1. Plataforma demonstrativa e ambiente de homologação.
2. Arquitectura técnica e modelo de dados.
3. Catálogo territorial e relatório de validação.
4. Dicionário de indicadores e catálogo de fontes.
5. Modelo de governação, perfis e matriz de responsabilidades.
6. Plano de integração com sistemas e fontes oficiais.
7. Plano de segurança, privacidade, continuidade e recuperação.
8. Plano de formação e transferência de conhecimento.
9. Plano de testes, exercícios e homologação.
10. Proposta de operação, manutenção, suporte e sustentabilidade.

## 11. Condições ainda por definir

Não são fixados nesta fase custos, prazos contratuais, metas oficiais de cobertura, níveis de serviço, canais públicos de alerta ou compromissos de fornecimento de dados. Estes elementos dependem de levantamento técnico, disponibilidade orçamental, acordos institucionais, requisitos de segurança e processo de contratação aplicável.

## 12. Resultado pretendido

Disponibilizar ao Estado angolano uma ferramenta integrada, transparente e auditável para conhecer melhor o território, planear o desenvolvimento, apoiar a agricultura e a segurança alimentar, antecipar riscos e melhorar a coordenação de resposta a emergências — respeitando sempre a autoridade, os dados e as competências das instituições públicas.
