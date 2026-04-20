/**
 * portal-empresa.js — Portal da Detentora (perfil: empresa)
 * Gerencia inbox e detalhe das O.S., ações de aceite/revisão/recusa/execução.
 */

// ============================================================
// Utilitários
// ============================================================

let _csrfToken = null;

async function getCsrfToken() {
    if (_csrfToken) return _csrfToken;
    const resp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
    const data = await resp.json();
    _csrfToken = data.csrf_token;
    return _csrfToken;
}

async function apiFetch(url, options = {}) {
    const defaults = { credentials: 'same-origin', headers: {} };
    const merged = { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } };

    if (merged.method && merged.method !== 'GET') {
        merged.headers['Content-Type'] = merged.headers['Content-Type'] || 'application/json';
        merged.headers['X-CSRF-Token'] = await getCsrfToken();
    }

    return fetch(url, merged);
}

function mostrarToast(msg, tipo = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) { console.warn('[toast]', msg); return; }
    toast.textContent = msg;
    toast.className = `toast toast-${tipo}`;
    // Garantir que o toast aparece acima de qualquer modal
    toast.style.cssText = `display:block;z-index:99999;position:fixed;`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 4000);
}

function abrirModal(id) {
    const el = document.getElementById(id);
    if (!el) { console.error('[abrirModal] elemento não encontrado:', id); return; }
    // Mover para body garante que position:fixed não seja afetado por overflow:hidden do layout
    if (el.parentNode !== document.body) {
        document.body.appendChild(el);
    }
    el.style.cssText = [
        'display:flex',
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.55)',
        'z-index:9999',
        'align-items:center',
        'justify-content:center',
        'padding:1rem',
    ].join(';');
}

function fecharModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

const STATUS_LABEL = {
    emitida: { texto: 'Emitida', classe: 'badge-emitida' },
    enviada_empresa: { texto: 'Aguardando Aceite', classe: 'badge-enviada' },
    em_revisao: { texto: 'Em Revisão', classe: 'badge-revisao' },
    aceita: { texto: 'Aceita', classe: 'badge-aceita' },
    em_execucao: { texto: 'Em Execução', classe: 'badge-execucao' },
    executada: { texto: 'Executada', classe: 'badge-executada' },
    recusada: { texto: 'Recusada', classe: 'badge-recusada' },
    cancelada: { texto: 'Cancelada', classe: 'badge-cancelada' },
};

function badgeHtml(status) {
    const cfg = STATUS_LABEL[status] || { texto: status, classe: '' };
    return `<span class="status-badge ${cfg.classe}">${cfg.texto}</span>`;
}

function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('pt-BR');
}

function formatarDataHora(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('pt-BR');
}

// ============================================================
// INBOX
// ============================================================

let _statusAtivo = '';
let _buscaTimer = null;

function filtrarStatus(btn, status) {
    document.querySelectorAll('.status-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _statusAtivo = status;
    carregarInbox();
}

function debouncarBusca(valor) {
    clearTimeout(_buscaTimer);
    _buscaTimer = setTimeout(() => carregarInbox(), 400);
}

async function carregarInbox() {
    const lista = document.getElementById('inbox-lista');
    if (!lista) return;

    lista.innerHTML = `
        <div class="inbox-loading">
            <div class="spinner"></div>
            <p>Carregando ordens...</p>
        </div>`;

    const busca = document.getElementById('busca-input')?.value?.trim() || '';
    const params = new URLSearchParams();
    if (_statusAtivo) params.set('status', _statusAtivo);
    if (busca) params.set('busca', busca);

    try {
        const resp = await apiFetch(`/api/empresa/inbox?${params}`);
        if (resp.status === 503) {
            lista.innerHTML = '<div class="inbox-empty">Portal temporariamente indisponível.</div>';
            return;
        }
        if (!resp.ok) throw new Error('Erro ao carregar inbox');

        const data = await resp.json();

        if (data.relogin) {
            lista.innerHTML = `
                <div class="inbox-empty inbox-error" style="background:#fff3e0;border:1px solid #ffb74d;border-radius:10px;padding:2rem;text-align:center;">
                    <div style="font-size:2rem;margin-bottom:.5rem;">⚠️</div>
                    <p style="color:#e65100;font-weight:600;margin-bottom:.75rem;">Sessão desatualizada</p>
                    <p style="color:#555;margin-bottom:1rem;">Sua conta foi recentemente vinculada a uma detentora.<br>Faça logout e login novamente para acessar as ordens.</p>
                    <a href="/auth/logout" style="background:#1565c0;color:#fff;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;font-weight:600;">🚪 Fazer Login novamente</a>
                </div>`;
            return;
        }

        const ordens = data.ordens || [];
        atualizarBadgesAbas(data.totais || {});
        renderizarInbox(ordens);
    } catch (e) {
        lista.innerHTML = `<div class="inbox-empty inbox-error">Erro ao carregar. <a href="javascript:void(0)" onclick="carregarInbox()">Tentar novamente</a></div>`;
    }
}

function atualizarBadgesAbas(totais) {
    const map = {
        '': 'badge-todas',
        'enviada_empresa': 'badge-enviada',
        'em_revisao': 'badge-revisao',
        'aceita': 'badge-aceita',
        'em_execucao': 'badge-execucao',
        'recusada': 'badge-recusada',
    };
    const total = Object.values(totais).reduce((a, b) => a + b, 0);
    const el = document.getElementById('badge-todas');
    if (el) el.textContent = total || '';

    for (const [status, id] of Object.entries(map)) {
        if (!status) continue;
        const badge = document.getElementById(id);
        if (badge) badge.textContent = totais[status] || '';
    }
}

function renderizarInbox(ordens) {
    const lista = document.getElementById('inbox-lista');
    if (!lista) return;

    if (ordens.length === 0) {
        lista.innerHTML = `
            <div class="inbox-empty">
                <div class="inbox-empty-icon">📭</div>
                <p>Nenhuma ordem encontrada.</p>
            </div>`;
        return;
    }

    lista.innerHTML = ordens.map(os => `
        <a href="/empresa/ordens/${os.id}" class="os-card-link">
            <div class="os-card">
                <div class="os-card-head">
                    <span class="os-numero">${os.numero_os || '#' + os.id}</span>
                    ${badgeHtml(os.status)}
                </div>
                <div class="os-card-body">
                    <div class="os-evento">${os.evento || '—'}</div>
                    <div class="os-meta">
                        <span>📅 ${formatarData(os.data)}</span>
                        ${os.modulo ? `<span>📦 ${os.modulo}</span>` : ''}
                    </div>
                </div>
                <div class="os-card-arrow">›</div>
            </div>
        </a>
    `).join('');
}

// ============================================================
// DETALHE
// ============================================================

let _osAtual = null;

async function carregarDetalhe(osId) {
    try {
        const resp = await apiFetch(`/api/empresa/ordens/${osId}`);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            document.getElementById('os-header').innerHTML =
                `<div class="inbox-error">Erro: ${err.erro || resp.status}</div>`;
            return;
        }
        _osAtual = await resp.json();
        renderizarDetalhe(_osAtual);
    } catch (e) {
        document.getElementById('os-header').innerHTML =
            `<div class="inbox-error">Falha ao carregar a O.S.</div>`;
    }
}

function renderizarDetalhe(os) {
    const numOS = os.numeroOS || os.numero_os || ('#' + os.id);
    // Header
    document.getElementById('os-header').innerHTML = `
        <div class="os-detalhe-titulo">
            <h1>O.S. ${numOS}</h1>
            ${badgeHtml(os.status)}
        </div>
        <p class="os-detalhe-evento">${os.evento || '—'}</p>
    `;
    document.getElementById('breadcrumb-os').textContent = `O.S. ${numOS}`;
    document.getElementById('os-body').style.display = '';

    // Info grid — linha 1: identificação
    const horarioFmt = (os.horario || '').replace(/\n/g, ' • ');
    document.getElementById('os-info-grid').innerHTML = `
        <div class="info-item"><span class="info-label">Número O.S.</span><span class="info-value">${os.numeroOS || os.numero_os || '—'}</span></div>
        <div class="info-item"><span class="info-label">Status</span><span class="info-value">${badgeHtml(os.status)}</span></div>
        <div class="info-item"><span class="info-label">Módulo</span><span class="info-value">${os.modulo || '—'}</span></div>
        <div class="info-item"><span class="info-label">Grupo</span><span class="info-value">${os.grupo || '—'}</span></div>
        <div class="info-item info-item-full"><span class="info-label">Evento</span><span class="info-value">${os.evento || '—'}</span></div>
        <div class="info-item"><span class="info-label">Data do Evento</span><span class="info-value">${os.data ? formatarData(os.data) : '—'}</span></div>
        <div class="info-item"><span class="info-label">Horário</span><span class="info-value">${horarioFmt || '—'}</span></div>
        <div class="info-item info-item-full"><span class="info-label">Local</span><span class="info-value">${os.local || '—'}</span></div>
        ${os.responsavel ? `<div class="info-item info-item-full"><span class="info-label">Responsável</span><span class="info-value">${os.responsavel}</span></div>` : ''}
        ${os.contrato ? `<div class="info-item"><span class="info-label">Contrato</span><span class="info-value">${os.contrato}</span></div>` : ''}
        ${os.detentora ? `<div class="info-item"><span class="info-label">Detentora</span><span class="info-value">${os.detentora}</span></div>` : ''}
        ${os.justificativa ? `<div class="info-item info-item-full"><span class="info-label">Justificativa</span><span class="info-value info-value-pre">${os.justificativa}</span></div>` : ''}
        ${os.observacoes ? `<div class="info-item info-item-full"><span class="info-label">Observações</span><span class="info-value info-value-pre">${os.observacoes}</span></div>` : ''}
    `;

    // Itens
    const itens = os.itens || [];
    document.getElementById('os-itens-lista').innerHTML = itens.length === 0
        ? '<p class="lista-vazia">Nenhum item registrado.</p>'
        : `<table class="os-itens-tabela">
            <thead><tr><th>Item</th><th>Qtd Solicitada</th><th>Qtd Total</th><th>Unidade</th></tr></thead>
            <tbody>${itens.map(it => `
                <tr>
                    <td>${it.descricao || it.nome || '—'}</td>
                    <td>${it.qtdSolicitada ?? it.quantidade ?? '—'}</td>
                    <td>${it.qtdTotal ?? '—'}</td>
                    <td>${it.unidade || '—'}</td>
                </tr>`).join('')}
            </tbody>
           </table>`;

    // Revisões
    const revisoes = os.revisoes || [];
    document.getElementById('os-revisoes-lista').innerHTML = revisoes.length === 0
        ? '<p class="lista-vazia">Nenhuma revisão registrada.</p>'
        : revisoes.map(r => `
            <div class="revisao-item ${r.descricao && r.descricao.includes('[RECUSA]') ? 'revisao-recusa' : ''}">
                <div class="revisao-descricao">${r.descricao || '—'}</div>
                <div class="revisao-meta">${formatarDataHora(r.criadoEm || r.criado_em)}</div>
            </div>`).join('');

    // Comentários
    renderizarComentarios(os.comentarios || []);

    // Ocultar formulário de comentário em estados terminais
    const formComentario = document.getElementById('comentario-form');
    if (formComentario) {
        const terminal = ['executada', 'recusada'].includes(os.status);
        formComentario.style.display = terminal ? 'none' : '';
    }

    // Aceite
    renderizarAceite(os.aceites || []);

    // Botão de download do PDF
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) btnPdf.href = `/api/empresa/ordens/${os.id}/pdf`;

    // Ações
    renderizarAcoes(os.status);
}

function renderizarComentarios(comentarios) {
    const el = document.getElementById('os-comentarios-lista');
    if (!el) return;
    if (comentarios.length === 0) {
        el.innerHTML = '<p class="lista-vazia">Nenhuma mensagem ainda.</p>';
        return;
    }
    el.innerHTML = comentarios.map(c => {
        const isOperador = c.autorPerfil === 'admin' || c.autorPerfil === 'comum';
        const autor = isOperador ? (c.autorNome || 'Operador') : 'Você';
        return `
            <div class="msg-bubble ${isOperador ? 'msg-operador' : 'msg-empresa'}">
                <div class="msg-autor">${isOperador ? '🏢 ' : '🏭 '}${autor}</div>
                <div class="msg-texto">${c.texto || '—'}</div>
                <div class="msg-data">${formatarDataHora(c.criadoEm || c.criado_em)}</div>
            </div>`;
    }).join('');
}

function renderizarAceite(aceites) {
    const card = document.getElementById('aceite-card');
    const info = document.getElementById('aceite-info');
    if (!card || !info) return;
    if (aceites.length === 0) { card.style.display = 'none'; return; }
    const aceite = aceites[0];
    const path = aceite.assinaturaPath || aceite.assinatura_path;
    card.style.display = '';
    info.innerHTML = `
        <div class="aceite-nome">Responsável: <strong>${aceite.nomeResponsavel || aceite.nome_responsavel || '—'}</strong></div>
        <div class="aceite-data">📅 ${formatarDataHora(aceite.dataHora || aceite.data_hora)}</div>
        ${path ? `
            <div style="margin-top:.75rem;">
                <div style="font-size:.7rem;color:#9e9e9e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.3rem;">Assinatura digital registrada</div>
                <img src="/static/${path}" class="aceite-assinatura" alt="Assinatura digital">
            </div>` : ''}
        <div style="font-size:.72rem;color:#9e9e9e;margin-top:.5rem;">🔐 Evidência com hash criptográfico registrada</div>
    `;
}

function renderizarAcoes(status) {
    const el = document.getElementById('acoes-botoes');
    if (!el) return;

    const botoes = [];

    if (status === 'enviada_empresa') {
        botoes.push(`<button class="btn-success btn-acao" onclick="_abrirModalAceitar()">✅ Aceitar</button>`);
        botoes.push(`<button class="btn-danger btn-acao" onclick="_abrirModalRecusar()">❌ Recusar</button>`);
    } else if (status === 'em_revisao') {
        botoes.push(`<p class="acoes-info">Revisão solicitada. Use os comentários para comunicação com o operador.</p>`);
        botoes.push(`<button class="btn-danger btn-acao" onclick="_abrirModalRecusar()">❌ Recusar definitivamente</button>`);
    } else if (status === 'aceita' || status === 'em_execucao') {
        botoes.push(`<p class="acoes-sem-acao">✅ O.S. aceita. Aguardando execução do serviço.</p>`);
    }

    if (botoes.length === 0) {
        el.innerHTML = `<p class="acoes-sem-acao">Nenhuma ação disponível para este status.</p>`;
    } else {
        el.innerHTML = botoes.join('');
    }
}

// ============================================================
// ASSINATURA DIGITAL (por declaração — modelo SEI/GovBR)
// ============================================================

function _abrirModalAceitar() {
    // Remover instância anterior se existir
    const anterior = document.getElementById('modal-aceitar-dinamico');
    if (anterior) anterior.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-aceitar-dinamico';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
                <h2 style="margin:0;font-size:1.1rem;color:#1a237e;">✅ Aceitar Ordem de Serviço</h2>
                <button id="btn-fechar-aceitar" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="padding:1.25rem;">
                <div style="display:flex;gap:.75rem;align-items:flex-start;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.85rem;color:#2e7d32;">
                    <span style="font-size:1.4rem;flex-shrink:0;">🔐</span>
                    <div>
                        <strong style="display:block;margin-bottom:.2rem;">Assinatura Digital</strong>
                        <span style="color:#555;line-height:1.45;">Ao confirmar, sua identidade é registrada com data, hora e IP do dispositivo — equivalente à assinatura eletrônica do SEI.</span>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.35rem;color:#333;">Nome completo do responsável *</label>
                    <input type="text" id="din-aceitar-nome" placeholder="Digite seu nome completo" maxlength="120"
                        style="width:100%;padding:.55rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.95rem;box-sizing:border-box;"
                        oninput="atualizarPreviewAssinatura(this.value)">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.35rem;color:#333;">Cargo / Função</label>
                    <input type="text" id="din-aceitar-cargo" placeholder="Ex: Gerente de Contratos" maxlength="100"
                        style="width:100%;padding:.55rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.95rem;box-sizing:border-box;">
                </div>
                <div style="border:1.5px solid #c5cae9;border-radius:8px;padding:1rem 1.25rem;background:#fafafa;margin-bottom:1rem;min-height:90px;">
                    <span style="display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9e9e9e;margin-bottom:.5rem;">Prévia da assinatura</span>
                    <div id="din-preview-nome" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:1.6rem;color:#1a237e;border-bottom:1px solid #c5cae9;padding-bottom:.4rem;margin-bottom:.35rem;min-height:2.2rem;">—</div>
                    <div id="din-preview-meta" style="font-size:.72rem;color:#aaa;"></div>
                </div>
                <label style="display:flex;gap:.6rem;align-items:flex-start;font-size:.85rem;color:#444;line-height:1.5;cursor:pointer;padding:.75rem;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;">
                    <input type="checkbox" id="din-aceitar-check" style="margin-top:.15rem;flex-shrink:0;width:16px;height:16px;cursor:pointer;accent-color:#1a237e;">
                    <span>Declaro que sou o responsável autorizado e estou ciente dos termos desta Ordem de Serviço, assumindo responsabilidade legal pela execução.</span>
                </label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding:1rem 1.25rem;border-top:1px solid #eee;">
                <button onclick="document.getElementById('modal-aceitar-dinamico').remove()" style="padding:.55rem 1.2rem;border-radius:8px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;cursor:pointer;font-size:.9rem;">Cancelar</button>
                <button onclick="confirmarAceite()" id="btn-confirmar-aceite" style="padding:.55rem 1.2rem;border-radius:8px;border:none;background:#2e7d32;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;">Assinar e Aceitar</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('btn-fechar-aceitar').onclick = () => overlay.remove();
    document.getElementById('din-aceitar-nome').focus();
}

function atualizarPreviewAssinatura(nome) {
    const previewNome = document.getElementById('din-preview-nome');
    const previewMeta = document.getElementById('din-preview-meta');
    if (!previewNome) return;
    previewNome.textContent = nome.trim() || '—';
    if (previewMeta) {
        const agora = new Date().toLocaleString('pt-BR');
        previewMeta.textContent = nome.trim() ? `Assinado digitalmente em ${agora}` : '';
    }
}

function _gerarAssinaturaBase64(nome, cargo) {
    // Gera uma imagem PNG com o nome em estilo cursivo (equivalente ao SEI)
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha de assinatura
    ctx.strokeStyle = '#c5cae9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 80);
    ctx.lineTo(460, 80);
    ctx.stroke();

    // Nome em cursiva
    ctx.fillStyle = '#1a237e';
    ctx.font = 'italic 28px Georgia, serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(nome, 20, 74);

    // Cargo abaixo (se informado)
    if (cargo) {
        ctx.fillStyle = '#555';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText(cargo, 20, 96);
    }

    // Data/hora no canto
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleString('pt-BR'), 460, 112);

    return canvas.toDataURL('image/png');
}

// ============================================================
// AÇÕES — confirmar
// ============================================================

async function confirmarAceite() {
    console.log('[confirmarAceite] chamado, _osAtual=', _osAtual?.id);
    const nome = document.getElementById('din-aceitar-nome')?.value?.trim();
    const cargo = document.getElementById('din-aceitar-cargo')?.value?.trim() || '';
    const confirmado = document.getElementById('din-aceitar-check')?.checked;
    console.log('[confirmarAceite] nome=', nome, 'confirmado=', confirmado);

    if (!nome) { mostrarToast('Informe o nome completo do responsável.', 'erro'); return; }
    if (!confirmado) { mostrarToast('É necessário marcar a declaração de responsabilidade.', 'erro'); return; }

    const assinaturaBase64 = _gerarAssinaturaBase64(nome, cargo);

    const btn = document.getElementById('btn-confirmar-aceite');
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
        const resp = await apiFetch(`/api/empresa/ordens/${_osAtual.id}/aceitar`, {
            method: 'POST',
            body: JSON.stringify({
                nome_responsavel: nome,
                assinatura_base64: assinaturaBase64,
                observacoes: cargo ? `Cargo: ${cargo}` : '',
            }),
        });
        const data = await resp.json();
        if (resp.ok) {
            const overlay = document.getElementById('modal-aceitar-dinamico');
            if (overlay) overlay.remove();
            mostrarToast('O.S. aceita e assinada digitalmente!', 'sucesso');
            await carregarDetalhe(_osAtual.id);
        } else {
            mostrarToast(data.erro || 'Erro ao aceitar O.S.', 'erro');
            btn.disabled = false;
            btn.textContent = 'Assinar e Aceitar';
        }
    } catch {
        mostrarToast('Erro de conexão.', 'erro');
        btn.disabled = false;
        btn.textContent = 'Assinar e Aceitar';
    }
}


function _abrirModalRecusar() {
    const anterior = document.getElementById('modal-recusar-dinamico');
    if (anterior) anterior.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-recusar-dinamico';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
                <h2 style="margin:0;font-size:1.1rem;color:#b71c1c;">❌ Recusar Ordem de Serviço</h2>
                <button id="btn-fechar-recusar" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="padding:1.25rem;">
                <div style="display:flex;gap:.75rem;align-items:flex-start;background:#ffebee;border:1px solid #ef9a9a;border-radius:8px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.85rem;color:#b71c1c;">
                    <span style="font-size:1.4rem;flex-shrink:0;">⚠️</span>
                    <div>
                        <strong style="display:block;margin-bottom:.2rem;">Ação irreversível</strong>
                        <span style="color:#555;line-height:1.45;">A recusa é definitiva. O operador será notificado e uma nova O.S. deverá ser emitida se necessário.</span>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.35rem;color:#333;">Motivo da recusa *</label>
                    <textarea id="din-recusar-motivo" rows="4" maxlength="1000"
                        placeholder="Descreva o motivo da recusa..."
                        style="width:100%;padding:.55rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.95rem;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>
                </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding:1rem 1.25rem;border-top:1px solid #eee;">
                <button id="btn-cancelar-recusar" style="padding:.55rem 1.2rem;border-radius:8px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;cursor:pointer;font-size:.9rem;">Cancelar</button>
                <button onclick="confirmarRecusa()" style="padding:.55rem 1.2rem;border-radius:8px;border:none;background:#c62828;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;">❌ Recusar O.S.</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('btn-fechar-recusar').onclick = () => overlay.remove();
    document.getElementById('btn-cancelar-recusar').onclick = () => overlay.remove();
    document.getElementById('din-recusar-motivo').focus();
}

async function confirmarRecusa() {
    const motivo = document.getElementById('din-recusar-motivo')?.value?.trim();
    if (!motivo) { mostrarToast('Informe o motivo da recusa.', 'erro'); return; }

    try {
        const resp = await apiFetch(`/api/empresa/ordens/${_osAtual.id}/recusar`, {
            method: 'POST',
            body: JSON.stringify({ motivo }),
        });
        const data = await resp.json();
        if (resp.ok) {
            document.getElementById('modal-recusar-dinamico')?.remove();
            mostrarToast('O.S. recusada.', 'info');
            await carregarDetalhe(_osAtual.id);
        } else {
            mostrarToast(data.erro || 'Erro ao recusar O.S.', 'erro');
        }
    } catch {
        mostrarToast('Erro de conexão.', 'erro');
    }
}


async function enviarComentario(event) {
    event.preventDefault();
    const texto = document.getElementById('comentario-texto')?.value?.trim();
    if (!texto) return;

    try {
        const resp = await apiFetch(`/api/empresa/ordens/${_osAtual.id}/comentarios`, {
            method: 'POST',
            body: JSON.stringify({ texto }),
        });
        const data = await resp.json();
        if (resp.ok) {
            document.getElementById('comentario-texto').value = '';
            // Atualizar lista de comentários
            const comentarios = data.comentarios || _osAtual.comentarios || [];
            if (data.comentario) {
                _osAtual.comentarios = [...(_osAtual.comentarios || []), data.comentario];
            }
            renderizarComentarios(_osAtual.comentarios || []);
        } else {
            mostrarToast(data.erro || 'Erro ao enviar comentário.', 'erro');
        }
    } catch {
        mostrarToast('Erro de conexão.', 'erro');
    }
}

// ============================================================
// Fechar modais ao clicar no overlay
// ============================================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});
