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

export function renderInstitutionRegistry(institutions = [], canCreate = false) {
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
          <p>Consulta e registo de entidades públicas, com validação documental e controlo de estado.</p>
        </div>
        ${canCreate ? `<div class="institution-actions"><span class="status-chip">REGISTO AUTENTICADO</span><button type="button" class="primary institution-add-button" id="new-institution">+ Novo registo</button></div>` : '<span class="status-chip">CONSULTA · ACESSO CONTROLADO</span>'}
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
      ${canCreate ? `      <dialog class="institution-dialog" id="institution-dialog" aria-labelledby="institution-dialog-title">
        <form id="institution-form" class="institution-form">
          <div class="institution-dialog-head">
            <div><div class="eyebrow">CADASTRO NACIONAL</div><h3 id="institution-dialog-title">Novo registo institucional</h3></div>
            <button type="button" class="institution-close" id="close-institution-dialog" aria-label="Fechar">×</button>
          </div>
          <p class="institution-form-intro">Preenche os dados identificativos. O registo será guardado como <b>Proposto</b> até à validação documental e aprovação competentes.</p>
          <label>Nome oficial da instituição <span>*</span><input name="name" maxlength="200" required placeholder="Ex.: Ministério, instituto, comando ou hospital"/></label>
          <div class="institution-form-grid">
            <label>Categoria <span>*</span><select name="institution_type" required>
              <option value="">Seleccionar categoria</option>
              <option value="local_administration">Administração local</option>
              <option value="police">Polícia</option>
              <option value="civil_protection_fire">Protecção Civil e Bombeiros</option>
              <option value="health_emergency">Emergência médica</option>
              <option value="hospital">Hospital</option>
              <option value="armed_forces">Forças Armadas</option>
              <option value="red_cross">Cruz Vermelha</option>
              <option value="maritime">Marítimo</option>
              <option value="aviation">Aviação</option>
              <option value="utilities">Serviços públicos essenciais</option>
              <option value="other">Outra entidade</option>
            </select></label>
            <label>Âmbito territorial <span>*</span><select name="jurisdiction_level" required>
              <option value="national">Nacional</option><option value="provincial">Provincial</option><option value="municipal">Municipal</option><option value="local">Local</option>
            </select></label>
          </div>
          <label>Website oficial<input name="official_website" type="url" maxlength="500" placeholder="https://..."/></label>
          <label>Fonte oficial / ligação documental<input name="official_source_url" type="url" maxlength="500" placeholder="https://..."/></label>
          <label>Mandato / competência institucional<textarea name="mandate_notes" maxlength="2000" rows="3" placeholder="Descrição breve, baseada em fonte oficial."></textarea></label>
          <label>Referência de acordo ou protocolo<input name="agreement_reference" maxlength="120" placeholder="Opcional — não representa aprovação"/></label>
          <div class="institution-form-message" id="institution-form-message" role="status"></div>
          <div class="institution-form-actions"><button type="button" class="secondary institution-cancel" id="cancel-institution">Cancelar</button><button type="submit" class="primary" id="save-institution">Guardar registo <span>→</span></button></div>
        </form>
      </dialog>` : ''}
    </section>`;
}
