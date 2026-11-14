create schema if not exists agritech;

create table if not exists agritech.unidades_territoriais (
  id uuid primary key default gen_random_uuid(),
  codigo_pais text not null default 'AO' check (codigo_pais = 'AO'),
  tipo text not null check (tipo in ('PROVINCIA','MUNICIPIO','COMUNA')),
  unidade_pai_id uuid references agritech.unidades_territoriais(id) on delete restrict,
  codigo_oficial text not null unique,
  nome_oficial text not null,
  nome_normalizado text,
  sede_administrativa text,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO','INACTIVO','EM_TRANSICAO')),
  valido_desde date,
  valido_ate date,
  diploma_legal text not null default 'Lei n.º 14/24, de 5 de Setembro; Lei n.º 8/25, de 16 de Setembro',
  fonte_url text,
  fonte_pagina text,
  validado_em timestamptz,
  metadados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unidade_hierarquia_ck check (
    (tipo = 'PROVINCIA' and unidade_pai_id is null) or
    (tipo in ('MUNICIPIO','COMUNA') and unidade_pai_id is not null)
  )
);
create index if not exists unidades_territoriais_pai_idx on agritech.unidades_territoriais(unidade_pai_id);
create index if not exists unidades_territoriais_tipo_idx on agritech.unidades_territoriais(tipo);
create index if not exists unidades_territoriais_nome_idx on agritech.unidades_territoriais using gin (to_tsvector('simple', nome_oficial));
create table if not exists agritech.regioes_agricolas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  tipo text not null check (tipo in ('AGROECOLOGICA','PRODUCAO','IRRIGACAO','BACIA_HIDROGRAFICA','OUTRA')),
  descricao text,
  classificacao_climatica text,
  precipitacao_media_anual_mm numeric(8,2),
  temperatura_media_anual_c numeric(5,2),
  altitude_media_m numeric(8,2),
  caracteristicas_solo jsonb not null default '{}'::jsonb,
  disponibilidade_agua text,
  fonte_dados text,
  nivel_confianca text not null default 'NAO_AVALIADO' check (nivel_confianca in ('ALTO','MEDIO','BAIXO','NAO_AVALIADO')),
  estado text not null default 'RASCUNHO' check (estado in ('RASCUNHO','VALIDADA','INACTIVA')),
  geometry_geojson jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists agritech.regioes_agricolas_municipios (
  regiao_id uuid not null references agritech.regioes_agricolas(id) on delete cascade,
  municipio_id uuid not null references agritech.unidades_territoriais(id) on delete restrict,
  papel text not null default 'ABRANGIDO' check (papel in ('NUCLEO','ABRANGIDO','LIMITE')),
  primary key (regiao_id, municipio_id)
);
create table if not exists agritech.culturas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null unique,
  nome_cientifico text,
  grupo text,
  ciclo_dias_min integer,
  ciclo_dias_max integer,
  estado text not null default 'ACTIVA' check (estado in ('ACTIVA','INACTIVA')),
  created_at timestamptz not null default now(),
  constraint culturas_ciclo_ck check (ciclo_dias_min is null or ciclo_dias_max is null or ciclo_dias_max >= ciclo_dias_min)
);
create table if not exists agritech.regiao_culturas (
  regiao_id uuid not null references agritech.regioes_agricolas(id) on delete cascade,
  cultura_id uuid not null references agritech.culturas(id) on delete restrict,
  aptidao text not null default 'POR_AVALIAR' check (aptidao in ('MUITO_APTA','APTA','MODERADAMENTE_APTA','POUCO_APTA','NAO_APTA','POR_AVALIAR')),
  epoca_sementeira jsonb not null default '[]'::jsonb,
  observacoes text,
  fonte text,
  primary key (regiao_id, cultura_id)
);
alter table agritech.unidades_territoriais enable row level security;
alter table agritech.regioes_agricolas enable row level security;
alter table agritech.regioes_agricolas_municipios enable row level security;
alter table agritech.culturas enable row level security;
alter table agritech.regiao_culturas enable row level security;
comment on schema agritech is 'Dados territoriais e agronómicos do NOVA ANGOLA AGRITECH; separado dos módulos NOVA Escolar.';
comment on table agritech.unidades_territoriais is 'Cadastro administrativo oficial: províncias, municípios e comunas. Códigos conforme Lei 8/25.';
comment on table agritech.regioes_agricolas is 'Regiões agroecológicas e zonas de produção; não são unidades administrativas oficiais.';
