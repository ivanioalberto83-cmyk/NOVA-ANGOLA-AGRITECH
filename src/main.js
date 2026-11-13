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
let latestResult = null;
let latestError = '';

const confirmedSnapshot = {
  acquired_at: '2026-11-04T09:00:51.024Z',
  resolution_m: 100,
  sample_dimensions: { width: 549, height: 443 },
  quality_status: 'usable',
  summary: {
    ndvi_mean: '0.615517', ndvi_min: '-1.000000', ndvi_max: '0.896631',
    ndwi_mean: '-0.546828', valid_pixel_count: '218060', nodata_pixel_count: '25147'
  },
  note: 'Estatísticas de área. A AOI é provisória e não corresponde a uma parcela de mandioca validada.'
};

const icon = '<span class="brand-mark">N<span>+</span></span>';
const fmt = (value, digits=2) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits).replace('.', ',') : '—';
};
function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function shell(content) {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#">${icon}<span>NOVA <b>ANGOLA AGRITECH</b><small>AGRICULTURAL INTELLIGENCE PLATFORM</small></span></a>
      <div class="topbar-right"><span class="environment"><i></i> AMBIENTE DE PRODUÇÃO</span><span class="user-chip">NA</span></div>
    </header>
    ${content}
    <footer><span>© ${new Date().getFullYear()} NOVA ANGOLA AGRITECH</span><span>Dados geoespaciais para decisões no terreno · Angola</span></footer>`;
}
function renderSetup() {
  shell(`<main class="center"><section class="panel auth-panel"><div class="eyebrow">CONFIGURAÇÃO NECESSÁRIA</div><h1>Preparar ligação segura</h1><p>A aplicação foi publicada sem credenciais no código. Adiciona as variáveis públicas de ligação ao Supabase nas definições do projecto Vercel.</p><div class="notice">VITE_SUPABASE_URL<br><code>https://rojyxfjaidyvtmsmefcf.supabase.co</code></div><div class="notice">VITE_SUPABASE_ANON_KEY<br><code>Chave publishable/anon do projecto UNIVERSO NOVA</code></div><p class="muted">Não coloques aqui o CDSE Client Secret nem a chave service_role. Essas credenciais permanecem nos Secrets do Supabase.</p></section></main>`);
}
function renderLogin(message='') {
  shell(`<main class="center"><section class="panel auth-panel">
    <div class="eyebrow">ACESSO SEGURO · UNIVERSO NOVA</div><h1>Inteligência agrícola para Angola.</h1>
    <p>Entra na plataforma para consultar o piloto de Malanje e executar análises Sentinel-2 com a tua sessão autenticada.</p>
    <form id="login-form"><label for="email">Email institucional</label><input id="email" name="email" type="email" autocomplete="username" required value="ivanioalberto83@gmail.com" /><label for="password">Palavra-passe</label><input id="password" name="password" type="password" autocomplete="current-password" required placeholder="A tua palavra-passe NOVA" /><button class="primary" type="submit" ${busy?'disabled':''}>${busy?'A autenticar…':'Entrar na plataforma'} <span>→</span></button></form>
    <p class="form-message" role="status">${escapeHtml(message)}</p><div class="secure-note">Sessão Supabase · JWT de utilizador · Segredos Copernicus mantidos no servidor</div>
  </section></main>`);
  document.querySelector('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    busy = true; renderLogin();
    const { data, error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
    busy = false;
    if (error) return renderLogin(error.message);
    session = data.session; renderDashboard();
  });
}
function metric(label, value, helper, tone='') {
  return `<article class="metric-card ${tone}"><span class="metric-label">${label}</span><strong>${value}</strong><small>${helper}</small></article>`;
}
function renderDashboard() {
  const user = session?.user?.email || '';
  const data = latestResult || confirmedSnapshot;
  const summary = data.summary || {};
  const total = Number(summary.valid_pixel_count || 0) + Number(summary.nodata_pixel_count || 0);
  const validPct = total ? (Number(summary.valid_pixel_count) / total * 100) : 0;
  const isLive = Boolean(latestResult);
  const acquired = data.acquired_at ? new Date(data.acquired_at).toLocaleString('pt-PT', {dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Luanda'}) : 'Sem aquisição registada';
  shell(`<main class="workspace">
    <aside class="sidebar"><div class="side-label">PLATAFORMA</div><a class="side-link active" href="#overview"><span>◫</span> Visão geral</a><a class="side-link" href="#pilot"><span>⌖</span> Projectos agrícolas</a><a class="side-link" href="#satellite"><span>◉</span> Inteligência satélite</a><a class="side-link" href="#quality"><span>◈</span> Qualidade dos dados</a><div class="side-label side-spacer">GESTÃO</div><span class="side-link disabled"><span>▤</span> Histórico temporal <em>EM PREPARAÇÃO</em></span><span class="side-link disabled"><span>⚑</span> Alertas agrícolas <em>EM PREPARAÇÃO</em></span><div class="side-bottom"><div class="avatar">${escapeHtml(user.slice(0,1).toUpperCase())}</div><div><b>${escapeHtml(user)}</b><small>Sessão autenticada</small></div><button id="logout" title="Terminar sessão">↗</button></div></aside>
    <section class="main-content" id="overview">
      <div class="page-heading"><div><div class="eyebrow">CENTRO DE COMANDO AGRÍCOLA <span class="crumb">/ ANGOLA</span></div><h1>Visão geral</h1><p>Monitorização geoespacial e indicadores de vegetação para apoio à decisão.</p></div><div class="live-tag"><i></i> COPERNICUS · LIGAÇÃO CONFIGURADA</div></div>
      <section class="hero-panel" id="pilot"><div class="hero-copy"><div class="eyebrow light">PROJECTO-PILOTO · NAAT-MAL-CASSAVA-001</div><h2>Malanje <span>/</span> Mandioca</h2><p>Primeiro território de validação operacional da NOVA ANGOLA AGRITECH.</p><div class="hero-meta"><span>ANGOLA</span><span>·</span><span>SENTINEL-2 L2A</span><span>·</span><span>NDVI + NDWI</span></div></div><div class="hero-orbit"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-core">NA<span>+</span></div><div class="orbit-caption">MONITORIZAÇÃO<br/>POR SATÉLITE</div></div><div class="hero-foot"><span><i></i> Piloto com processamento real confirmado</span><span>AOI provisória · não validada como parcela</span></div></section>
      <div class="section-heading"><div><div class="eyebrow">INDICADORES DO ÚLTIMO PROCESSAMENTO</div><h2>Condição espectral da área</h2></div><span class="data-tag ${isLive?'live':'historic'}">${isLive?'SESSÃO ACTUAL':'ÚLTIMO TESTE CONFIRMADO'}</span></div>
      <div class="metrics-grid">
        ${metric('NDVI MÉDIO',fmt(summary.ndvi_mean,3),'Índice de vegetação · escala -1 a +1','primary-metric')}
        ${metric('NDWI MÉDIO',fmt(summary.ndwi_mean,3),'Índice de água Green–NIR')}
        ${metric('PIXELS VÁLIDOS',Number(summary.valid_pixel_count||0).toLocaleString('pt-PT'),fmt(validPct,1)+'% da grelha')}
        ${metric('RESOLUÇÃO ESPACIAL',String(data.resolution_m||100)+' m',`${data.sample_dimensions?.width||549} × ${data.sample_dimensions?.height||443} células`)}
      </div>
      <div class="content-grid">
        <section class="surface satellite-panel" id="satellite"><div class="surface-head"><div><div class="eyebrow">OBSERVAÇÃO DA TERRA</div><h3>Estado do processamento</h3></div><span class="status-pill"><i></i> ${escapeHtml(data.quality_status||'usable').toUpperCase()}</span></div><div class="satellite-visual"><div class="scan-grid"></div><div class="scan-ring ring-a"></div><div class="scan-ring ring-b"></div><div class="scan-point"></div><div class="scan-label">SENTINEL-2<br/><b>ANÁLISE ESPECTRAL</b></div></div><div class="detail-list"><div><span>Data de aquisição</span><b>${escapeHtml(acquired)}</b></div><div><span>Pixels sem dados</span><b>${Number(summary.nodata_pixel_count||0).toLocaleString('pt-PT')}</b></div><div><span>Grelha analisada</span><b>${(data.sample_dimensions?.width||549)+' × '+(data.sample_dimensions?.height||443)}</b></div></div></section>
        <section class="surface run-panel"><div class="eyebrow">MOTOR DE ANÁLISE</div><h3>Executar nova observação</h3><p>Solicita ao Copernicus Statistical API as estatísticas da área de interesse e guarda o resumo no Supabase.</p><div class="run-spec"><span>Fonte</span><b>Copernicus Data Space</b><span>Produto</span><b>Sentinel-2 L2A</b><span>Indicadores</span><b>NDVI · NDWI</b><span>Autorização</span><b>JWT autenticado</b></div><button id="process" class="primary process-btn" ${busy?'disabled':''}>${busy?'A processar dados…':'Executar processamento'} <span>→</span></button>${latestError?'<p class="inline-error">'+escapeHtml(latestError)+'</p>':''}<p class="run-foot">O processamento pode demorar alguns instantes, conforme a resposta do serviço externo.</p></section>
      </div>
      <section class="surface quality-panel" id="quality"><div class="surface-head"><div><div class="eyebrow">RASTREABILIDADE E CONFIANÇA</div><h3>Qualidade e limites da observação</h3></div><span class="quality-score">${fmt(validPct,1)}% <small>pixels válidos</small></span></div><div class="quality-bar"><span style="width:${Math.max(0,Math.min(100,validPct))}%"></span></div><div class="quality-notes"><p><b>O que os dados confirmam</b><br/>A API devolveu estatísticas NDVI/NDWI e o resumo foi gravado com estado técnico “usable”.</p><p><b>O que ainda não confirmam</b><br/>A caixa geográfica é provisória. Não prova a localização de uma parcela de mandioca, nem permite concluir stress hídrico ou produtividade.</p></div><div class="provenance">Referência STAC seleccionada: ${escapeHtml(data.scene||'S2A_MSIL2A_20261104T090051_N0513_R007_T33LXK_20261104T153105')} · ${isLive?'resultado recebido nesta sessão':'resultado confirmado em 13 Nov 2026'}.</div></section>
      <div class="next-step"><div><span class="eyebrow">PRÓXIMA FASE</span><b>Delimitação real das parcelas agrícolas</b><small>Associar polígonos geográficos validados antes de interpretar os índices à escala da exploração.</small></div><span class="coming-soon">A SEGUIR</span></div>
    </section>
  </main>`);
  document.querySelector('#logout').addEventListener('click', async () => { await supabase.auth.signOut(); session=null; latestResult=null; renderLogin(); });
  document.querySelector('#process').addEventListener('click', async () => {
    busy=true; latestError=''; renderDashboard();
    try {
      const { data: current } = await supabase.auth.getSession();
      if (!current.session?.access_token) throw new Error('A sessão expirou. Termina a sessão e volta a entrar.');
      const { data, error } = await supabase.functions.invoke('agritech-process-ndvi', { body: {} });
      if (error) {
        let detail = error.message;
        try { const ctx=error.context; if(ctx&&typeof ctx.json==='function') detail=JSON.stringify(await ctx.json()); } catch {}
        throw new Error(detail);
      }
      latestResult=data; busy=false; renderDashboard();
    } catch (e) {
      busy=false; latestError=e.message||String(e); renderDashboard();
    }
  });
}
async function start() {
  if (!configured) return renderSetup();
  const { data } = await supabase.auth.getSession();
  session = data.session;
  supabase.auth.onAuthStateChange((_event,next) => { session=next; if(next) renderDashboard(); else renderLogin(); });
  if(session) renderDashboard(); else renderLogin();
}
start();
