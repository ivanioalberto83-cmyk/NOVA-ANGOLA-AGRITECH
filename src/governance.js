const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = v => v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-PT');
const date = v => v ? new Date(v).toLocaleDateString('pt-PT') : '—';
const label = v => String(v || '—').replaceAll('_',' ');

function empty(title, detail) {
  return `<div class="gov-empty"><strong>${esc(title)}</strong><p>${esc(detail)}</p></div>`;
}
function table(rows, columns, emptyTitle, emptyDetail) {
  if (!rows?.length) return empty(emptyTitle, emptyDetail);
  return `<div class="gov-table-wrap"><table class="gov-table"><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td>${esc(c.render ? c.render(row) : row[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function stat(labelText, value, hint='') {
  return `<article class="gov-stat"><small>${esc(labelText)}</small><strong>${esc(value)}</strong><span>${esc(hint)}</span></article>`;
}
function accessNotice(access) {
  if (access?.operational) return `<div class="gov-access good"><b>Acesso operacional atribuído</b><span>${esc(access.message)}</span></div>`;
  return `<div class="gov-access locked"><b>Permissões institucionais ainda não atribuídas</b><span>${esc(access?.message || 'A sessão está autenticada, mas não existe uma atribuição territorial activa.')}</span><small>Por segurança, os dados operacionais de ocorrências, alertas e recursos não são apresentados sem uma atribuição aprovada.</small></div>`;
}

export function renderGovernancePanel(data, error='') {
  const d = data || {};
  const cat = d.territorial_catalogue || {};
  const m = d.metrics || {};
  const access = d.access || {};
  const institutions = d.institutions || [];
  const protectedRows = access.operational;
  const operational = protectedRows ? '' : empty('Dados operacionais protegidos','Não existem permissões activas para esta conta. Os registos operacionais não são substituídos por dados fictícios.');
  return `
    <section class="section-block gov-section" id="gov-administration">
      <div class="section-heading"><div><div class="eyebrow">GOVERNAÇÃO TERRITORIAL</div><h2>Administração nacional e territorial</h2><p>Catálogo administrativo nacional e indicadores de cobertura da plataforma.</p></div><span class="status-chip">CATÁLOGO SUPABASE</span></div>
      <div class="gov-stats">
        ${stat('Províncias',fmt(cat.provinces),'Catálogo territorial registado')}
        ${stat('Municípios',fmt(cat.municipalities),'Relação provincial existente')}
        ${stat('Comunas',fmt(cat.communes),'Relação municipal existente')}
      </div>
      <div class="gov-note">${esc(cat.source_note || 'Contagens do catálogo interno.')} A cobertura cartográfica, os códigos oficiais e a validação documental devem ser confirmados pelas entidades competentes antes de uso administrativo oficial.</div>
    </section>

    <section class="section-block gov-section" id="civil-protection">
      <div class="section-heading"><div><div class="eyebrow">GESTÃO DE RISCOS E EMERGÊNCIAS</div><h2>Protecção Civil e Centro de Operações</h2><p>Alertas, avaliação de riscos, pedidos de socorro, meios e evacuação.</p></div><span class="status-chip">${protectedRows?'ACESSO CONFORME ÂMBITO':'ACESSO PENDENTE'}</span></div>
      ${accessNotice(access)}
      ${protectedRows ? `
        <div class="gov-stats">
          ${stat('Alertas',fmt(m.alerts),'Registos no âmbito autorizado')}
          ${stat('Avaliações de risco',fmt(m.risks),'Registos no âmbito autorizado')}
          ${stat('Pedidos de despacho',fmt(m.dispatches),'Registos no âmbito autorizado')}
          ${stat('Meios registados',fmt(m.resources),'Registos no âmbito autorizado')}
          ${stat('Operações de evacuação',fmt(m.evacuations),'Registos no âmbito autorizado')}
        </div>
        <div class="gov-subpanel"><h3>Alertas de emergência</h3>${table(d.latest_alerts,[{key:'alert_code',label:'Código'},{key:'title',label:'Alerta'},{key:'hazard_type',label:'Risco',render:r=>label(r.hazard_type)},{key:'alert_level',label:'Nível',render:r=>label(r.alert_level)},{key:'status',label:'Estado',render:r=>label(r.status)},{key:'province',label:'Província'},{key:'created_at',label:'Criado',render:r=>date(r.created_at)}],'Sem alertas registados','Ainda não existem alertas no âmbito autorizado.')}</div>
        <div class="gov-subpanel"><h3>Avaliações de risco</h3>${table(d.latest_risks,[{key:'hazard_type',label:'Ameaça',render:r=>label(r.hazard_type)},{key:'risk_level',label:'Nível',render:r=>label(r.risk_level)},{key:'status',label:'Estado',render:r=>label(r.status)},{key:'probability_percent',label:'Probabilidade',render:r=>r.probability_percent==null?'—':r.probability_percent+'%'},{key:'exposed_population_estimate',label:'População exposta',render:r=>fmt(r.exposed_population_estimate)},{key:'province',label:'Província'},{key:'observed_at',label:'Observado',render:r=>date(r.observed_at)}],'Sem avaliações registadas','Ainda não existem avaliações de risco no âmbito autorizado.')}</div>
        <div class="gov-subpanel"><h3>Pedidos de intervenção e despacho</h3>${table(d.latest_dispatches,[{key:'request_code',label:'Referência'},{key:'title',label:'Ocorrência'},{key:'requested_service',label:'Serviço',render:r=>label(r.requested_service)},{key:'urgency',label:'Urgência',render:r=>label(r.urgency)},{key:'status',label:'Estado',render:r=>label(r.status)},{key:'province',label:'Província'},{key:'created_at',label:'Data',render:r=>date(r.created_at)}],'Sem pedidos de despacho','Ainda não existem pedidos no âmbito autorizado.')}</div>
        <div class="gov-subpanel"><h3>Meios e recursos de emergência</h3>${table(d.resources,[{key:'resource_code',label:'Código'},{key:'resource_type',label:'Meio',render:r=>label(r.resource_type)},{key:'institution',label:'Instituição'},{key:'operational_status',label:'Disponibilidade',render:r=>label(r.operational_status)},{key:'capacity_count',label:'Capacidade'},{key:'province',label:'Província'}],'Sem meios registados','O inventário de meios ainda não contém registos no âmbito autorizado.')}</div>
        <div class="gov-subpanel"><h3>Operações de evacuação</h3>${table(d.latest_evacuation,[{key:'operation_code',label:'Operação'},{key:'operation_status',label:'Estado',render:r=>label(r.operation_status)},{key:'lead_authority',label:'Entidade líder'},{key:'people_evacuated_count',label:'Evacuados',render:r=>fmt(r.people_evacuated_count)},{key:'people_assisted_count',label:'Assistidos',render:r=>fmt(r.people_assisted_count)},{key:'province',label:'Província'}],'Sem operações registadas','Ainda não existem operações de evacuação no âmbito autorizado.')}</div>
      ` : operational}
    </section>

    <section class="section-block gov-section" id="demography">
      <div class="section-heading"><div><div class="eyebrow">INDICADORES POPULACIONAIS</div><h2>Demografia, natalidade e densidade</h2><p>População, agregados familiares, nascimentos e óbitos com referência e fonte.</p></div><span class="status-chip">${protectedRows?'DADOS POR ÂMBITO':'SEM PERMISSÃO'}</span></div>
      ${protectedRows ? table(d.population_latest,[{key:'province',label:'Província'},{key:'municipality',label:'Município'},{key:'reference_year',label:'Ano'},{key:'population_total',label:'População',render:r=>fmt(r.population_total)},{key:'births_total',label:'Nascimentos',render:r=>fmt(r.births_total)},{key:'deaths_total',label:'Óbitos',render:r=>fmt(r.deaths_total)},{key:'households_total',label:'Agregados',render:r=>fmt(r.households_total)},{key:'validation_status',label:'Validação',render:r=>label(r.validation_status)}],'Sem estatísticas demográficas','Não existem estatísticas populacionais carregadas no âmbito autorizado.') : operational}
      <div class="gov-note">Densidade populacional exige população validada e área territorial oficial compatível. Não é calculada enquanto não houver dados demográficos e geográficos validados para o mesmo ano e unidade administrativa.</div>
    </section>

    <section class="section-block gov-section" id="institutions">
      <div class="section-heading"><div><div class="eyebrow">ARTICULAÇÃO INTERINSTITUCIONAL</div><h2>Instituições e integração com o Estado</h2><p>Registo de entidades, situação de homologação e canais de integração.</p></div><span class="status-chip">REGISTO INSTITUCIONAL</span></div>
      ${table(institutions,[{key:'code',label:'Código'},{key:'name',label:'Instituição'},{key:'type',label:'Área',render:r=>label(r.type)},{key:'jurisdiction',label:'Jurisdição',render:r=>label(r.jurisdiction)},{key:'integration_status',label:'Integração',render:r=>label(r.integration_status)},{key:'agreement_reference',label:'Acordo',render:r=>r.agreement_reference||'Não registado'}],'Sem instituições registadas','Não foram encontrados registos institucionais.')}
      <div class="gov-note">O registo de uma instituição não significa que exista ligação técnica ou autorização governamental. Integrações reais exigem acordo, avaliação de segurança, testes em ambiente controlado e aprovação formal da entidade responsável.</div>
    </section>
    ${error ? `<div class="error-banner">${esc(error)}</div>` : ''}
  `;
}
