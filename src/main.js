import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

const app = document.querySelector('#app');
let session = null;
let busy = false;
let dashboardData = null;
let activeModule = 'national';

const provinces = [
  'Bengo','Benguela','Bié','Cabinda','Cuando','Cubango','Cuanza-Norte','Cuanza-Sul',
  'Cunene','Huambo','Huíla','Icolo e Bengo','Luanda','Lunda-Norte','Lunda-Sul',
  'Malanje','Moxico','Moxico Leste','Namibe','Uíge','Zaire'
];

const modules = [
  ['national','⌂','Centro nacional'],
  ['territory','◎','Território e mapa'],
  ['satellite','◉','Satélite e vegetação'],
  ['climate','☼','Clima e meteorologia'],
  ['water','≈','Seca e recursos hídricos'],
  ['health','✳','Pragas e doenças'],
  ['environment','♧','Solo e ambiente'],
  ['production','▥','Produção agrícola'],
  ['reports','▤','Balanços e relatórios']
];

const icon = '<span class="brand-mark">N<span>+</span></span>';
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v, digits=2) => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? '—' : Number(v).toLocaleString('pt-PT',{maximumFractionDigits:digits});
const dateLabel = value => value ? new Date(value).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}) : '—';

function shell(content) {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#"><span class="brand-mark">N<span>+</span></span><span>NOVA <b>ANGOLA AGRITECH</b><small>INTELIGÊNCIA AGRÍCOLA E AMBIENTAL</small></span></a>
      <div class="top-meta"><span class="live-dot"></span> CENTRO NACIONAL <span class="meta-divider"></span> ANGOLA · WGS84</div>
    </header>${content}
    <footer>© ${new Date().getFullYear()} NOVA ANGOLA AGRITECH <span>Observação territorial · ciência de dados · apoio à decisão</span></footer>`;
}
function renderSetup() {
  shell(`<main class="auth-wrap"><section class="auth-card"><div class="eyebrow">CONFIGURAÇÃO NECESSÁRIA</div><h1>Preparar ligação segura</h1><p>Configura as variáveis públicas do projecto Vercel para ligar esta aplicação ao Supabase.</p><div class="config-item">VITE_SUPABASE_URL <code>https://rojyxfjaidyvtmsmefcf.supabase.co</code></div><div class="config-item">VITE_SUPABASE_ANON_KEY <code>Chave publishable/anon do projecto UNIVERSO NOVA</code></div><p class="muted">Não coloques aqui o CDSE Client Secret nem a chave service_role.</p></section></main>`);
}
function renderLogin(message='') {
  shell(`<main class="auth-wrap"><section class="auth-card">
    <div class="eyebrow">ACESSO SEGURO · UNIVERSO NOVA</div><h1>Inteligência agrícola para Angola.</h1>
    <p>Entra para consultar dados de satélite, clima e monitorização do projecto-piloto.</p>
    <form id="login-form"><label>Email</label><input name="email" type="email" autocomplete="username" required value="ivanioalberto83@gmail.com"/><label>Palavra-passe</label><input name="password" type="password" autocomplete="current-password" required placeholder="A tua palavra-passe NOVA"/><button class="primary" type="submit" ${busy?'disabled':''}>${busy?'A autenticar…':'Entrar na plataforma'} <span>→</span></button></form>
    <p class="form-message">${esc(message)}</p><div class="secure-note">▣ Sessão Supabase segura · JWT obrigatório · sem credenciais administrativas no navegador</div>
  </section></main>`);
  document.querySelector('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    busy = true; renderLogin();
    const {data,error} = await supabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});
    busy = false;
    if(error) return renderLogin(error.message);
    session = data.session;
    await loadDashboard();
  });
}
function metric(label,value,unit,detail,kind='') {
  return `<article class="metric-card ${kind}"><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${unit||''}</small></div><div class="metric-detail">${detail}</div></article>`;
}
function navMarkup() {
  return modules.map(([id,ic,label])=>`<button class="nav-item ${activeModule===id?'active':''}" data-module="${id}"><span>${ic}</span>${label}</button>`).join('');
}
function emptyState(title,detail) {
  return `<div class="empty-state"><span class="empty-icon">◌</span><strong>${title}</strong><p>${detail}</p></div>`;
}
function lineChart(series,key,colorLabel,unit) {
  const vals = series.map(x=>x[key]).filter(x=>x!==null && Number.isFinite(Number(x)));
  if(vals.length<2) return emptyState('Série temporal insuficiente','São necessárias pelo menos duas observações válidas para desenhar uma evolução. Não serão inventados pontos.');
  const w=760,h=190,p=24,min=Math.min(...vals),max=Math.max(...vals),span=(max-min)||1;
  const points = series.map((x,i)=>x[key]===null?null:[p+i*(w-2*p)/(series.length-1),h-p-((Number(x[key])-min)/span)*(h-2*p)]).filter(Boolean);
  const poly=points.map(p=>p.join(',')).join(' ');
  const last=vals[vals.length-1];
  return `<div class="chart-wrap"><div class="chart-top"><span>${colorLabel}</span><b>${fmt(last,1)} ${unit}</b></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${colorLabel}"><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" class="chart-axis"/><line x1="${p}" y1="${p}" x2="${w-p}" y2="${p}" class="chart-grid"/><polyline points="${poly}" class="chart-line" /><circle cx="${points.at(-1)[0]}" cy="${points.at(-1)[1]}" r="4" class="chart-point"/></svg><div class="chart-foot"><span>${series[0]?.date||''}</span><span>${series.at(-1)?.date||''}</span></div></div>`;
}
function barChart(rows) {
  if(!rows.length) return emptyState('Sem observações de vegetação','O histórico ainda não contém observações suficientes.');
  const v=rows[0], min=Number(v.ndvi_min),mean=Number(v.ndvi_mean),max=Number(v.ndvi_max);
  const items=[['Mínimo',min],['Média',mean],['Máximo',max]];
  return `<div class="range-bars">${items.map(([name,val])=>`<div class="range-row"><span>${name}</span><div class="range-track"><i style="width:${Math.max(0,Math.min(100,(Number(val)+1)*50))}%"></i></div><b>${fmt(val,3)}</b></div>`).join('')}</div><div class="chart-foot">Observação: ${dateLabel(v.observed_at)} · NDVI adimensional · ${esc(v.quality_status||'')}</div>`;
}
function weatherPanel(weather) {
  if(!weather || weather.status!=='available') return emptyState('Dados meteorológicos indisponíveis',weather?.error||'A consulta à NASA POWER ainda não devolveu uma série válida.');
  const series=weather.series||[];
  return `<div class="weather-kpis">
    <div><small>PRECIPITAÇÃO ACUMULADA</small><strong>${fmt(weather.summary?.rainfall_total_mm,1)} <em>mm</em></strong><span>${weather.coverage?.valid_rain_days||0} dias válidos</span></div>
    <div><small>TEMPERATURA MÉDIA</small><strong>${fmt(weather.summary?.temperature_mean_c,1)} <em>°C</em></strong><span>média do período</span></div>
    <div><small>HUMIDADE RELATIVA</small><strong>${fmt(weather.summary?.humidity_mean_percent,1)} <em>%</em></strong><span>média do período</span></div>
    <div><small>VENTO MÉDIO</small><strong>${fmt(weather.summary?.wind_mean_m_s,1)} <em>m/s</em></strong><span>média do período</span></div>
  </div>
  <div class="chart-grid"><div class="chart-card"><div class="eyebrow">CHUVA · mm/dia</div>${lineChart(series,'rainfall_mm','Precipitação diária','mm')}</div><div class="chart-card"><div class="eyebrow">TEMPERATURA · °C</div>${lineChart(series,'temperature_c','Temperatura média diária','°C')}</div></div>
  <div class="source-note"><b>Fonte:</b> NASA POWER Daily API · Agroclimatology (AG) · ${weather.period?.start} a ${weather.period?.end} UTC · ponto representativo do centro da AOI provisória (${fmt(weather.coordinates?.latitude,4)}, ${fmt(weather.coordinates?.longitude,4)}). ${esc(weather.caveat||'')}</div>`;
}
function renderDashboard(error='') {
  const data=dashboardData||{};
  const pilot=data.pilot||{};
  const veg=data.vegetation||[];
  const latest=veg[0]||null;
  const weather=data.weather||{};
  const validPct=latest ? (Number(latest.valid_pixel_count)/(Number(latest.valid_pixel_count)+Number(latest.nodata_pixel_count)||1))*100 : null;
  const activeTitle=modules.find(x=>x[0]===activeModule)?.[2]||'Centro nacional';
  shell(`<div class="app-shell">
    <aside class="sidebar"><div class="side-label">NAVEGAÇÃO PRINCIPAL</div>${navMarkup()}<div class="side-bottom"><div class="secure-pill"><i></i> Ambiente autenticado</div><button id="logout" class="logout">Terminar sessão ↗</button></div></aside>
    <main class="workspace">
      <div class="page-head"><div><div class="eyebrow">NOVA ANGOLA AGRITECH / ${activeTitle.toUpperCase()}</div><h1>Centro Nacional de Inteligência Agrícola</h1><p>Monitorização geoespacial, climática e ambiental para apoio à decisão.</p></div><div class="head-actions"><span class="data-clock">Actualizado: ${data.generated_at?new Date(data.generated_at).toLocaleString('pt-PT'):'—'}</span><button id="refresh" class="secondary" ${busy?'disabled':''}>${busy?'A actualizar…':'↻ Actualizar dados'}</button></div></div>
      ${error?`<div class="error-banner">${esc(error)}</div>`:''}
      <section class="filter-bar"><div><small>ESCALA TERRITORIAL</small><select id="province-filter"><option value="Angola">Angola · Nacional</option>${provinces.map(p=>`<option value="${p}" ${p==='Malanje'?'selected':''}>${p}</option>`).join('')}</select></div><div><small>PROJECTO-PILOTO</small><strong>Malanje · Mandioca</strong></div><div><small>PERÍODO CLIMÁTICO</small><strong>Últimos 30 dias</strong></div><div class="filter-state"><span class="live-dot"></span> Fontes identificadas</div></section>
      <section class="metrics-grid">
        ${metric('CENAS / CANDIDATOS REGISTADOS',fmt(pilot.scene_candidates_registered,0),'','Registo Sentinel-2 do piloto')}
        ${metric('NDVI MÉDIO · ÚLTIMA OBSERVAÇÃO',latest?fmt(latest.ndvi_mean,3):'—','',latest?`Aquisição ${dateLabel(latest.observed_at)}`:'Sem observação carregada','accent')}
        ${metric('PRECIPITAÇÃO · 30 DIAS',weather.status==='available'?fmt(weather.summary?.rainfall_total_mm,1):'—',weather.status==='available'?'mm':'','NASA POWER · série diária')}
        ${metric('TEMPERATURA MÉDIA · 30 DIAS',weather.status==='available'?fmt(weather.summary?.temperature_mean_c,1):'—',weather.status==='available'?'°C':'','NASA POWER · série diária')}
      </section>
      <section class="map-section" id="territory"><div class="section-heading"><div><div class="eyebrow">INTELIGÊNCIA GEOGRÁFICA</div><h2>Território nacional</h2><p>Exploração cartográfica de Angola e localização do projecto-piloto.</p></div><span class="status-chip">MAPA INTERACTIVO</span></div>
        <div class="map-layout"><div class="map-frame"><div id="angola-map"></div><div class="map-overlay"><b>ANGOLA</b><span>Limite nacional · cartografia aberta</span></div></div><div class="map-aside">
          <div class="map-aside-head"><small>LOCALIZAÇÃO EM FOCO</small><strong>Malanje</strong><span>Projecto-piloto · Mandioca</span></div>
          <div class="map-stat"><span>Identificador</span><b>NAAT-MAL-CASSAVA-001</b></div>
          <div class="map-stat"><span>Estado da AOI</span><b class="warning-text">${esc(pilot.aoi_status||'provisional')}</b></div>
          <div class="map-stat"><span>Limites administrativos</span><b>21 províncias · pendente</b></div>
          <div class="map-warning">A área assinalada é uma caixa geográfica provisória. Não representa uma parcela agrícola validada.</div>
          <div class="map-legend"><span><i class="legend-dot"></i> Centro aproximado do piloto</span><span><i class="legend-box"></i> AOI provisória</span></div>
          <div class="map-source">Cartografia nacional: geoBoundaries ADM0 · contorno nacional. A camada ADM1 aberta consultada representa 18 províncias (2021) e não foi usada como divisão actual.</div>
        </div></div>
      </section>
      <section class="section-block" id="climate"><div class="section-heading"><div><div class="eyebrow">OBSERVAÇÕES ATMOSFÉRICAS</div><h2>Clima e meteorologia</h2><p>Série diária de precipitação, temperatura, humidade e vento.</p></div><span class="source-badge">NASA POWER</span></div><div class="data-panel">${weatherPanel(weather)}</div></section>
      <section class="section-block" id="satellite"><div class="section-heading"><div><div class="eyebrow">OBSERVAÇÃO DA TERRA</div><h2>Satélite e saúde da vegetação</h2><p>Indicadores espectrais Sentinel-2 disponíveis no histórico do piloto.</p></div><span class="source-badge">COPERNICUS · SENTINEL-2</span></div>
        <div class="satellite-grid"><div class="data-panel"><div class="panel-title"><strong>NDVI · resumo da última recolha</strong><span>${latest?dateLabel(latest.observed_at):'Sem dados'}</span></div>${barChart(veg)}</div><div class="data-panel"><div class="panel-title"><strong>Qualidade da observação</strong><span>${latest?esc(latest.quality_status):'—'}</span></div><div class="quality-number">${validPct===null?'—':fmt(validPct,1)+'%'}<small>pixels válidos</small></div><div class="quality-track"><i style="width:${validPct===null?0:Math.min(100,validPct)}%"></i></div><div class="quality-details"><span>Válidos: ${latest?fmt(latest.valid_pixel_count,0):'—'}</span><span>Sem dados: ${latest?fmt(latest.nodata_pixel_count,0):'—'}</span></div><div class="source-note">Produto: ${esc(latest?.product_id||'—')} · Processamento: ${esc(latest?.processing_version||'—')}</div></div></div>
        <div class="method-note">NDVI e NDWI são indicadores espectrais. Não identificam automaticamente a cultura, não confirmam pragas e não constituem diagnóstico agronómico sem validação no terreno.</div>
      </section>
      <section class="section-block" id="water"><div class="section-heading"><div><div class="eyebrow">RISCO HIDROCLIMÁTICO</div><h2>Seca e recursos hídricos</h2><p>Défice de precipitação, SPI, humidade do solo e balanço hídrico.</p></div><span class="status-chip muted-chip">EM PREPARAÇÃO</span></div><div class="data-panel placeholder-grid">${emptyState('Balanço hídrico ainda não calculado','É necessário histórico climático validado e dados de evapotranspiração/solo. A precipitação de 30 dias, isoladamente, não confirma seca.')}${emptyState('SPI ainda não disponível','O SPI exige uma série histórica suficientemente longa e uma escala temporal definida (por exemplo, SPI-3 ou SPI-6).')}</div></section>
      <section class="section-block" id="health"><div class="section-heading"><div><div class="eyebrow">VIGILÂNCIA FITOSSANITÁRIA</div><h2>Pragas e doenças</h2><p>Ocorrências, condições favoráveis e validação no terreno.</p></div><span class="status-chip muted-chip">SEM REGISTOS</span></div><div class="data-panel">${emptyState('Nenhuma ocorrência validada','Ainda não existem observações fitossanitárias registadas. Não serão emitidos alertas de pragas com base apenas em índices de satélite.')}</div></section>
      <section class="section-block" id="environment"><div class="section-heading"><div><div class="eyebrow">SISTEMAS TERRESTRES</div><h2>Solo e ambiente</h2><p>Humidade do solo, relevo, erosão, queimadas e uso do solo.</p></div><span class="status-chip muted-chip">CAMADAS POR INTEGRAR</span></div><div class="data-panel">${emptyState('Camadas ambientais em integração','A próxima fase irá acrescentar dados de solo, relevo, fogo activo e cobertura do solo, sempre com fonte e resolução identificadas.')}</div></section>
      <section class="section-block" id="production"><div class="section-heading"><div><div class="eyebrow">CAMPANHAS E PRODUTIVIDADE</div><h2>Produção agrícola</h2><p>Área plantada, calendário, colheitas, produtividade e perdas.</p></div><span class="status-chip muted-chip">SEM DADOS DE CAMPO</span></div><div class="data-panel">${emptyState('Sem estimativas de produção validadas','A estimativa de colheita depende de parcelas delimitadas, cultura confirmada, calendário e observações de campo.')}</div></section>
      <section class="section-block" id="reports"><div class="section-heading"><div><div class="eyebrow">PRESTAÇÃO DE CONTAS</div><h2>Balanços e relatórios</h2><p>Relatórios provinciais, municipais e por exploração.</p></div><span class="status-chip muted-chip">EM PREPARAÇÃO</span></div><div class="data-panel">${emptyState('Relatórios técnicos ainda não gerados','Os relatórios serão activados quando existirem séries suficientes e metodologias de balanço documentadas.')}</div></section>
      <div class="footer-note">Dados carregados através de serviço autenticado. O painel distingue observações medidas, estimativas de modelos e informação ainda não disponível.</div>
    </main>
  </div>`);
  document.querySelector('#logout').addEventListener('click',async()=>{await supabase.auth.signOut();session=null;dashboardData=null;renderLogin();});
  document.querySelector('#refresh').addEventListener('click',loadDashboard);
  document.querySelectorAll('[data-module]').forEach(btn=>btn.addEventListener('click',()=>{activeModule=btn.dataset.module;const target={national:null,territory:'territory',satellite:'satellite',climate:'climate',water:'water',health:'health',environment:'environment',production:'production',reports:'reports'}[activeModule];renderDashboard();if(target)document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'});}));
  document.querySelector('#province-filter').addEventListener('change',e=>{if(e.target.value!=='Angola'&&e.target.value!=='Malanje'){showToast('Os limites oficiais das 21 províncias ainda não estão carregados. O mapa mantém a cartografia nacional e o piloto de Malanje.');}else if(e.target.value==='Malanje'){window.agritechMap?.setView([-9.5,16.35],8);}});
  initMap(pilot);
}
function showToast(message){const el=document.querySelector('#toast');if(el){el.textContent=message;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),5000);}}
async function initMap(pilot) {
  const node=document.querySelector('#angola-map');
  if(!node||!window.L)return;
  if(window.agritechMap){window.agritechMap.remove();window.agritechMap=null;}
  const L=window.L;
  const map=L.map(node,{zoomControl:true,scrollWheelZoom:false}).setView([-11.8,17.8],5);
  window.agritechMap=map;
  const streets=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'});
  const imagery=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Tiles © Esri'});
  streets.addTo(map);
  L.control.layers({'Mapa de estradas':streets,'Imagem de satélite':imagery},{},{collapsed:true}).addTo(map);
  try {
    const metaResponse=await fetch('https://www.geoboundaries.org/api/current/gbOpen/AGO/ADM0/');
    if(!metaResponse.ok)throw new Error('Boundary metadata unavailable');
    const meta=await metaResponse.json();
    const geoResponse=await fetch(meta.gjDownloadURL);
    if(!geoResponse.ok)throw new Error('National geometry unavailable');
    const geo=await geoResponse.json();
    const boundary=L.geoJSON(geo,{style:{color:'#d7e8b2',weight:2,fillColor:'#8cae6b',fillOpacity:.08}}).addTo(map);
    map.fitBounds(boundary.getBounds(),{padding:[18,18]});
  } catch(e) {
    L.rectangle([[-18.1,11.6],[-4.3,24.1]],{color:'#a7c878',weight:1,dashArray:'5 6',fillOpacity:0.02}).addTo(map);
  }
  const bbox=Array.isArray(pilot.aoi_bbox)?pilot.aoi_bbox:[16.1,-9.7,16.6,-9.3];
  const center=[(Number(bbox[1])+Number(bbox[3]))/2,(Number(bbox[0])+Number(bbox[2]))/2];
  L.rectangle([[bbox[1],bbox[0]],[bbox[3],bbox[2]]],{color:'#f4b942',weight:2,dashArray:'7 5',fillColor:'#f4b942',fillOpacity:.12}).addTo(map).bindPopup('<b>AOI provisória · Malanje</b><br>Não validada como parcela agrícola.');
  L.circleMarker(center,{radius:7,color:'#fff',weight:2,fillColor:'#f4b942',fillOpacity:1}).addTo(map).bindPopup('<b>NAAT-MAL-CASSAVA-001</b><br>Centro aproximado da área de interesse.');
  L.control.scale({imperial:false}).addTo(map);
  setTimeout(()=>map.invalidateSize(),250);
}
async function loadDashboard() {
  if(busy)return;
  busy=true;
  if(!dashboardData){renderDashboard();}
  const button=document.querySelector('#refresh');if(button){button.disabled=true;button.textContent='A actualizar…';}
  try{
    const {data,error}=await supabase.functions.invoke('agritech-dashboard-data',{body:{}});
    if(error){let message=error.message;try{if(error.context?.json)message=JSON.stringify(await error.context.json());}catch{}throw new Error(message);}
    dashboardData=data;
    busy=false;
    renderDashboard();
  }catch(e){
    busy=false;
    if(dashboardData)renderDashboard(e.message||String(e));
    else renderLogin('Não foi possível carregar os dados do painel: '+(e.message||String(e)));
  }
}
async function start(){
  if(!configured)return renderSetup();
  const {data}=await supabase.auth.getSession();
  session=data.session;
  supabase.auth.onAuthStateChange((_event,next)=>{session=next;if(!next){dashboardData=null;renderLogin();}});
  if(session)await loadDashboard();else renderLogin();
}
start();