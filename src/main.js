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

const icon = '<span class="brand-mark">N<span>+</span></span>';
function shell(content) {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#">${icon}<span>NOVA <b>ANGOLA AGRITECH</b><small>INTELIGÊNCIA AGRÍCOLA</small></span></a>
      <span class="top-status"><i></i> PLATAFORMA DE MONITORIZAÇÃO</span>
    </header>
    ${content}
    <footer>© ${new Date().getFullYear()} NOVA ANGOLA AGRITECH <span>Dados geoespaciais para decisões no terreno.</span></footer>`;
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderSetup() {
  shell(`<main class="center"><section class="panel auth-panel"><div class="eyebrow">CONFIGURAÇÃO NECESSÁRIA</div><h1>Preparar ligação segura</h1><p>A aplicação foi publicada sem credenciais no código. Adiciona as variáveis públicas de ligação ao Supabase nas definições do projecto Vercel.</p><div class="notice">VITE_SUPABASE_URL<br><code>https://rojyxfjaidyvtmsmefcf.supabase.co</code></div><div class="notice">VITE_SUPABASE_ANON_KEY<br><code>Chave publishable/anon do projecto UNIVERSO NOVA</code></div><p class="muted">Não coloques aqui o CDSE Client Secret nem a chave service_role. Essas credenciais permanecem nos Secrets do Supabase.</p></section></main>`);
}
function renderLogin(message='') {
  shell(`<main class="center"><section class="panel auth-panel">
    <div class="eyebrow">ACESSO AUTENTICADO</div><h1>Monitorização agrícola, com dados reais.</h1>
    <p>Entra com a tua conta NOVA para executar o processamento Sentinel-2 do projecto-piloto.</p>
    <form id="login-form">
      <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required value="ivanioalberto83@gmail.com" />
      <label for="password">Palavra-passe</label><input id="password" name="password" type="password" autocomplete="current-password" required placeholder="A tua palavra-passe NOVA" />
      <button class="primary" type="submit" ${busy?'disabled':''}>${busy?'A autenticar…':'Entrar na plataforma'} <span>→</span></button>
    </form>
    <p class="form-message" role="status">${escapeHtml(message)}</p>
    <div class="secure-note"><span>▣</span> Sessão Supabase segura · JWT de utilizador · Sem credenciais administrativas no navegador</div>
  </section></main>`);
  document.querySelector('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    busy = true; renderLogin();
    const { data, error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
    busy = false;
    if (error) return renderLogin(error.message);
    session = data.session;
    renderDashboard();
  });
}
function renderDashboard(result='', error='') {
  const user = session?.user?.email || '';
  shell(`<main class="dashboard">
    <div class="welcome"><div><div class="eyebrow">PAINEL DE CONTROLO · MALANJE</div><h1>Centro de monitorização</h1><p>Bem-vindo, ${escapeHtml(user)}. Acompanha o processamento de indicadores de vegetação e água.</p></div><button id="logout" class="ghost">Terminar sessão ↗</button></div>
    <section class="pilot-card">
      <div class="pilot-head"><div><div class="eyebrow light">PROJECTO-PILOTO ACTIVO</div><h2>Malanje <span>·</span> Mandioca</h2><p>NAAT-MAL-CASSAVA-001</p></div><span class="pill"><i></i> Monitorização Sentinel-2</span></div>
      <div class="pilot-grid">
        <div><small>CULTURA-ALVO</small><strong>Mandioca</strong></div>
        <div><small>PROVÍNCIA</small><strong>Malanje</strong></div>
        <div><small>INDICADORES</small><strong>NDVI · NDWI</strong></div>
        <div><small>RESOLUÇÃO</small><strong>20 metros</strong></div>
      </div>
      <div class="pilot-note">A área de interesse actual é uma delimitação provisória por caixa geográfica (bbox), ainda não validada como parcela agrícola no terreno.</div>
    </section>
    <section class="action-row"><div><div class="eyebrow">PROCESSAMENTO DE DADOS</div><h2>Executar análise Sentinel-2</h2><p>Solicita estatísticas NDVI e NDWI à API do Copernicus Data Space e guarda o resumo no Supabase.</p></div><button id="process" class="primary process-btn" ${busy?'disabled':''}>${busy?'A processar…':'Executar processamento'} <span>→</span></button></section>
    <section class="result-panel"><div class="result-title"><div><div class="eyebrow">RESULTADO DA ÚLTIMA EXECUÇÃO</div><h3>Relatório de processamento</h3></div><span class="result-state ${error?'bad':result?'good':''}">${error?'ERRO':result?'RESPOSTA RECEBIDA':'À ESPERA DE EXECUÇÃO'}</span></div>
      ${error?'<pre class="output error">'+escapeHtml(error)+'</pre>':result?'<pre class="output">'+escapeHtml(result)+'</pre>':'<div class="empty">Ainda não foi executado qualquer processamento nesta sessão. O resultado será apresentado aqui após a chamada autenticada.</div>'}
    </section>
    <p class="disclaimer">Os índices espectrais ajudam a acompanhar sinais de vegetação e água; não identificam por si só a cultura nem substituem a validação de campo.</p>
  </main>`);
  document.querySelector('#logout').addEventListener('click', async () => { await supabase.auth.signOut(); session=null; renderLogin(); });
  document.querySelector('#process').addEventListener('click', async () => {
    busy=true; renderDashboard();
    try {
      const { data: current } = await supabase.auth.getSession();
      if (!current.session?.access_token) throw new Error('A sessão expirou. Termina a sessão e volta a entrar.');
      const { data, error } = await supabase.functions.invoke('agritech-process-ndvi', { body: {} });
      if (error) {
        let detail = error.message;
        try { const ctx = error.context; if (ctx && typeof ctx.json === 'function') detail = JSON.stringify(await ctx.json(), null, 2); } catch {}
        throw new Error(detail);
      }
      busy=false; renderDashboard(JSON.stringify(data, null, 2));
    } catch (e) {
      busy=false; renderDashboard('', e.message || String(e));
    }
  });
}
async function start() {
  if (!configured) return renderSetup();
  const { data } = await supabase.auth.getSession();
  session = data.session;
  supabase.auth.onAuthStateChange((_event, next) => { session=next; if (next) renderDashboard(); else renderLogin(); });
  if (session) renderDashboard(); else renderLogin();
}
start();