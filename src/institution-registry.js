const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const label = value => String(value || '—').replaceAll('_', ' ');

const categoryLabels = {
  local_administration: 'Administração local',
  police: 'Polícia',
  civil_protection_fire: 'Protecção Civil e Bombeiros',
  health_emergency: 'Emergência médica',
  hospital: 'Hospital',
  armed_forces: 'Forças Armadas',
  aviation: 'Aviação',
  maritime: 'Marítimo',
  red_cross: 'Cruz Vermelha'
};

const statusLabels = {
  proposed: 'Proposto',
  under_review: 'Em análise',
  verified: 'Verificado',
  approved: 'Aprovado',
  inactive: 'Inactivo',
  rejected: 'Rejeitado'
};

function stat(labelText, value, hint) {
  return `<article class="gov-stat"><small>${esc(labelText)}</small><strong>${esc(value)}</strong><span>${esc(hint)}</span></article>`;
}

function renderTable(rows) {
  if (!rows.length) {
    return '<div class="gov-empty"><strong>Sem registos institucionais</strong><p>Não existem entidades disponíveis para consulta.</p></div>';
  }

  return `
    <div class="gov-table-wrap">
      <table class="gov-table">
        <thead><tr>
          <th>Código</th><th>Instituição</th><th>Categoria</th>
          <th>Âmbito</th><th>Estado</th><th>Referência de acordo</th>
        </tr></thead>
        <tbody>${rows.map(row => `
          <tr>
            <td>${esc(row.code)}</td>
            <td>${esc(row.name)}</td>
            <td>${esc(categoryLabels[row.type] || label(row.type))}</td>
            <td>${esc(label(row.jurisdiction))}</td>
            <td><span class="institution-status status-${esc(row.integration_status || 'unknown')}">${esc(statusLabels[row.integration_status] || label(row.integration_status))}</span></td>
            <td>${esc(row.agreement_reference || 'Não registada')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

export function renderInstitutionRegistry(institutions = []) {
  const rows = Array.isArray(institutions) ? institutions : [];
  const byCategory = rows.reduce((counts, row) => {
    const key = row.type || 'uncategorised';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const proposed = rows.filter(row => row.integration_status === 'proposed').length;
  const verified = rows.filter(row => row.integration_status === 'verified').length;
  const approved = rows.filter(row => row.integration_status === 'approved').length;
  const categories = Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0]));

  return `
    <section class="section-block gov-section" id="institutions">
      <div class="section-heading">
        <div>
          <div class="eyebrow">CADASTRO NACIONAL INSTITUCIONAL</div>
          <h2>Instituições e entidades públicas</h2>
          <p>Consulta dos registos institucionais actualmente existentes na base de dados.</p>
        </div>
        <span class="status-chip">CONSULTA · SOMENTE LEITURA</span>
      </div>
      <div class="gov-stats">
        ${stat('Registos existentes', rows.length, 'Tabela institucional de emergência')}
        ${stat('Propostos', proposed, 'Aguardam validação documental')}
        ${stat('Verificados', verified, 'Informação documental verificada')}
        ${stat('Aprovados', approved, 'Aprovação institucional registada')}
      </div>
      <div class="institution-category-grid">
        ${categories.map(([key, count]) => `
          <article class="institution-category-card">
            <span>${esc(categoryLabels[key] || label(key))}</span>
            <strong>${esc(count)}</strong>
          </article>`).join('')}
      </div>
      <div class="gov-subpanel">
        <h3>Registo institucional disponível</h3>
        ${renderTable(rows)}
      </div>
      <div class="gov-note">
        <strong>Limite dos dados actuais:</strong> esta consulta utiliza a tabela existente
        <code>emergency_institutions</code>. Não representa ainda o Cadastro Nacional Institucional
        completo. Ministérios, institutos, empresas públicas, reguladores e concessionárias só
        serão apresentados depois de serem registados e validados. Os estados apresentados
        correspondem ao campo de integração actualmente existente e não constituem, por si só,
        homologação oficial.
      </div>
    </section>`;
}
