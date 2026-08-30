// ========================================
// MÓDULO: PEDIDOS/ORÇAMENTOS (Serviços Gráficos)
// ========================================
// Etapa anterior à emissão de O.S.: pedidos/orçamentos com estimativa de
// custo por itens de catálogo e controle de prazo de entrega.

let pedidosGraficosCache = [];
let itensPedidoSelecionados = [];
let pedidoEditandoId = null;
let _catalogoPedidoGrafico = null;

// Pedidos marcados para virar uma ÚNICA O.S. Sobrevive à re-renderização da
// lista (que acontece a cada mudança de filtro), mas é podado para conter só
// pedidos ainda visíveis — emitir com um pedido fora da tela seria surpresa.
let _pedidosSelecionados = new Set();

async function renderizarPedidosGraficos() {
    try {
        const filtros = {};
        const busca = document.getElementById('filtro-pedido-grafico')?.value.trim();
        const status = document.getElementById('filtro-pedido-status')?.value;
        const atraso = document.getElementById('filtro-pedido-atraso')?.value;
        if (busca) filtros.busca = busca;
        if (status) filtros.status = status;
        if (atraso) filtros.atraso = atraso;

        const [pedidos, resumo] = await Promise.all([
            APIClient.listarPedidosGraficos(filtros),
            APIClient.resumoPedidosGraficos()
        ]);
        pedidosGraficosCache = pedidos || [];
        renderizarResumoPedidosGraficos(resumo || {});
        renderizarListaPedidosGraficos(pedidosGraficosCache);
    } catch (e) {
        console.error('Erro ao carregar pedidos gráficos:', e);
    }
}

function renderizarResumoPedidosGraficos(resumo) {
    const el = document.getElementById('pedidos-graficos-resumo');
    if (!el) return;
    const cards = [
        // "Em aberto" e não "Pendentes": no card o rótulo "Pendente" é o status de
        // conversão em O.S., que é outra coisa — um pedido já entregue continua
        // com status "Pendente" até virar O.S., mas não está mais em aberto.
        { label: 'Em aberto', valor: resumo.pendentes || 0, cor: '#1565c0' },
        { label: '⚠️ Atrasados', valor: resumo.atrasados || 0, cor: '#c62828' },
        { label: '⏰ Vencendo em breve', valor: resumo.vencendoEmBreve || 0, cor: '#ef6c00' },
        { label: 'Aguardando entrega', valor: resumo.aguardandoEntrega || 0, cor: '#6a1b9a' },
    ];
    el.innerHTML = cards.map(c => `
        <div style="background:#fff;border-left:4px solid ${c.cor};border-radius:8px;padding:.75rem 1.1rem;box-shadow:0 1px 4px rgba(0,0,0,.08);min-width:150px;">
            <div style="font-size:1.5rem;font-weight:700;color:${c.cor};">${c.valor}</div>
            <div style="font-size:.8rem;color:#555;">${c.label}</div>
        </div>
    `).join('');
}

function classificarUrgenciaPedido(pedido) {
    if (pedido.status === 'cancelado') return 'cancelado';
    if (pedido.entregue) return 'concluido';
    if (!pedido.prazoEntrega) return 'sem_prazo';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(pedido.prazoEntrega + 'T00:00:00');
    const diffDias = Math.round((prazo - hoje) / 86400000);

    if (diffDias < 0) return 'atrasado';
    if (diffDias <= 3) return 'vencendo';
    return 'ok';
}

function badgeUrgenciaPedido(urgencia) {
    const mapa = {
        atrasado: { texto: '⚠️ Atrasado', cor: '#c62828', bg: '#ffebee' },
        vencendo: { texto: '⏰ Vencendo em breve', cor: '#ef6c00', bg: '#fff3e0' },
        ok: { texto: '🟢 No prazo', cor: '#2e7d32', bg: '#e8f5e9' },
        sem_prazo: { texto: 'Sem prazo definido', cor: '#616161', bg: '#f5f5f5' },
        concluido: { texto: '✅ Entregue', cor: '#2e7d32', bg: '#e8f5e9' },
        cancelado: { texto: '✕ Cancelado', cor: '#616161', bg: '#eeeeee' },
    };
    const m = mapa[urgencia] || mapa.ok;
    return `<span style="background:${m.bg};color:${m.cor};padding:.2rem .6rem;border-radius:12px;font-size:.75rem;font-weight:600;white-space:nowrap;">${m.texto}</span>`;
}

function _formatarDataBRPedido(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function _formatarMoedaPedido(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Preços vêm do banco como string BR ("90,00", "1.234,56"). parseFloat direto
// truncaria "1.234,56" para 1.234 — mesmo tratamento usado em emitir-os.js.
function _parsePrecoBR(valor) {
    if (typeof valor === 'number') return valor;
    const s = String(valor ?? '0');
    return parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s) || 0;
}

function renderizarListaPedidosGraficos(pedidos) {
    const container = document.getElementById('lista-pedidos-graficos');
    if (!container) return;

    // Poda a seleção: só permanece marcado o que ainda está visível e pendente
    const idsVisiveis = new Set((pedidos || []).filter(p => p.status === 'pendente').map(p => p.id));
    _pedidosSelecionados = new Set([..._pedidosSelecionados].filter(id => idsVisiveis.has(id)));

    if (!pedidos || pedidos.length === 0) {
        container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Nenhum pedido encontrado.</p>';
        atualizarBarraSelecaoPedidos();
        return;
    }

    container.innerHTML = pedidos.map(p => {
        const urgencia = classificarUrgenciaPedido(p);
        const dataPedidoFmt = _formatarDataBRPedido(p.dataPedido);
        const prazoFmt = _formatarDataBRPedido(p.prazoEntrega);
        const selecionavel = p.status === 'pendente';
        const marcado = _pedidosSelecionados.has(p.id);

        // Todo dado vindo do banco passa por escaparHtml() (utils.js) antes de
        // ir para innerHTML — solicitante/descricao/setor são texto livre do usuário.
        return `
        <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:1rem 1.25rem;margin-bottom:.75rem;border:2px solid ${marcado ? '#1565c0' : 'transparent'};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
                <div style="flex:1;min-width:220px;display:flex;gap:.6rem;align-items:flex-start;">
                    ${selecionavel ? `
                    <input type="checkbox" ${marcado ? 'checked' : ''} title="Selecionar para emitir uma O.S. única"
                        onchange="togglePedidoSelecionado(${p.id}, this.checked)"
                        style="width:18px;height:18px;cursor:pointer;accent-color:#1565c0;margin-top:.15rem;flex-shrink:0;">
                    ` : '<span style="width:18px;flex-shrink:0;"></span>'}
                    <div style="flex:1;">
                    <div style="font-weight:700;font-size:1rem;margin-bottom:.2rem;">${escaparHtml(p.solicitante)}</div>
                    <div style="color:#444;font-size:.9rem;margin-bottom:.4rem;">${escaparHtml(p.descricao)}</div>
                    <div style="font-size:.8rem;color:#777;">
                        ${dataPedidoFmt ? 'Pedido em ' + dataPedidoFmt : ''}
                        ${prazoFmt ? ' · Prazo: ' + prazoFmt : ' · Sem prazo definido'}
                        ${p.setorSolicitante ? ' · Setor: ' + escaparHtml(p.setorSolicitante) : ''}
                    </div>
                    </div>
                </div>
                <div style="text-align:right;min-width:150px;">
                    <div style="font-weight:700;font-size:1.05rem;color:#1a237e;">${_formatarMoedaPedido(p.valorTotal)}</div>
                    <div style="margin-top:.3rem;">${badgeUrgenciaPedido(urgencia)}</div>
                    <div style="margin-top:.3rem;font-size:.8rem;color:#555;">${escaparHtml(p.statusLabel || p.status)}${p.numeroOS ? ' · ' + escaparHtml(p.numeroOS) : ''}</div>
                </div>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem;border-top:1px solid #eee;padding-top:.6rem;">
                ${p.status === 'pendente' ? `
                    <button type="button" class="btn-small btn-primary" onclick="abrirModalPedidoGrafico(${p.id})">✏️ Editar</button>
                    <button type="button" class="btn-small btn-success" onclick="emitirOSDoPedido(${p.id})">📝 Emitir OS</button>
                    <button type="button" class="btn-small btn-danger" onclick="cancelarPedidoGraficoUI(${p.id})">✕ Cancelar</button>
                ` : ''}
                ${p.status !== 'cancelado' ? `
                    <button type="button" class="btn-small btn-warning" onclick="toggleEntreguePedido(${p.id}, ${!p.entregue})">
                        ${p.entregue ? '↩️ Desmarcar entrega' : '📦 Marcar como entregue'}
                    </button>
                ` : ''}
            </div>
        </div>`;
    }).join('');

    atualizarBarraSelecaoPedidos();
}

// ========================================
// SELEÇÃO MÚLTIPLA → O.S. ÚNICA
// ========================================

function togglePedidoSelecionado(id, marcado) {
    if (marcado) _pedidosSelecionados.add(id);
    else _pedidosSelecionados.delete(id);
    // Re-render para atualizar a borda de destaque do card e a barra
    renderizarListaPedidosGraficos(pedidosGraficosCache);
}

function limparSelecaoPedidos() {
    _pedidosSelecionados.clear();
    renderizarListaPedidosGraficos(pedidosGraficosCache);
}

function atualizarBarraSelecaoPedidos() {
    let barra = document.getElementById('pg-barra-selecao');
    const n = _pedidosSelecionados.size;

    if (n === 0) {
        if (barra) barra.remove();
        return;
    }

    if (!barra) {
        barra = document.createElement('div');
        barra.id = 'pg-barra-selecao';
        // Fixa no rodapé para não deslocar a lista ao aparecer/sumir
        barra.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:900;background:#1a237e;color:#fff;' +
            'padding:.75rem 1.25rem;display:flex;align-items:center;justify-content:center;gap:1rem;' +
            'flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.25);';
        document.body.appendChild(barra);
    }

    const total = [..._pedidosSelecionados]
        .map(id => pedidosGraficosCache.find(p => p.id === id))
        .reduce((s, p) => s + (p ? (p.valorTotal || 0) : 0), 0);

    barra.innerHTML = `
        <span style="font-weight:600;">
            ${n} ${n === 1 ? 'pedido selecionado' : 'pedidos selecionados'}
            · Total estimado: ${_formatarMoedaPedido(total)}
        </span>
        <button type="button" onclick="emitirOSDosPedidos()"
            style="padding:.5rem 1.1rem;border:none;border-radius:6px;background:#2e7d32;color:#fff;font-weight:600;cursor:pointer;">
            📝 Emitir O.S. única
        </button>
        <button type="button" onclick="limparSelecaoPedidos()"
            style="padding:.5rem 1rem;border:1px solid rgba(255,255,255,.5);border-radius:6px;background:transparent;color:#fff;cursor:pointer;">
            Limpar seleção
        </button>`;
}

async function toggleEntreguePedido(id, novoValor) {
    try {
        await APIClient.marcarEntregaPedido(id, novoValor);
        await renderizarPedidosGraficos();
    } catch (e) {
        alert('Erro ao atualizar entrega: ' + e.message);
    }
}

async function cancelarPedidoGraficoUI(id) {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo || !motivo.trim()) return;
    try {
        await APIClient.cancelarPedidoGrafico(id, motivo.trim());
        await renderizarPedidosGraficos();
    } catch (e) {
        alert('Erro ao cancelar pedido: ' + e.message);
    }
}

// ========================================
// MODAL: NOVO/EDITAR PEDIDO
// ========================================

async function abrirModalPedidoGrafico(pedidoId = null) {
    const anterior = document.getElementById('modal-pedido-grafico');
    if (anterior) anterior.remove();

    pedidoEditandoId = pedidoId;
    itensPedidoSelecionados = [];

    let pedido = null;
    if (pedidoId) {
        pedido = pedidosGraficosCache.find(p => p.id === pedidoId) || null;
        if (!pedido || !pedido.itens) {
            pedido = await APIClient.obterPedidoGrafico(pedidoId);
        }
        if (pedido && pedido.itens) {
            itensPedidoSelecionados = pedido.itens.map(i => ({ ...i }));
        }
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const overlay = document.createElement('div');
    overlay.id = 'modal-pedido-grafico';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
                <h2 style="margin:0;font-size:1.1rem;color:#1a237e;">🧾 ${pedidoId ? 'Editar Pedido' : 'Novo Pedido'}</h2>
                <button onclick="document.getElementById('modal-pedido-grafico').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="padding:1.25rem;">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.9rem;">
                    <div style="flex:1;min-width:160px;">
                        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Data do Pedido *</label>
                        <input type="date" id="pg-data-pedido" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;min-width:160px;">
                        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Prazo de Entrega</label>
                        <input type="date" id="pg-prazo-entrega" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;">
                    </div>
                </div>
                <div style="margin-bottom:.9rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Solicitante *</label>
                    <input type="text" id="pg-solicitante" placeholder="Nome de quem pediu" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:.9rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Setor Solicitante</label>
                    <input type="text" id="pg-setor" placeholder="Ex: Coordenadoria X" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:.9rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Descrição *</label>
                    <textarea id="pg-descricao" rows="2" placeholder="Ex: 500 blocos de notas" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;"></textarea>
                </div>
                <div style="margin-bottom:.9rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Observações</label>
                    <textarea id="pg-observacoes" rows="2" style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;"></textarea>
                </div>

                <div style="border-top:1px solid #eee;padding-top:.9rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
                        <label style="font-size:.85rem;font-weight:600;">Itens do Catálogo (estimativa de custo)</label>
                        <button type="button" class="btn-small btn-primary" onclick="abrirSeletorItensPedido()">➕ Adicionar Item</button>
                    </div>
                    <div id="pg-itens-lista"></div>
                    <div style="text-align:right;font-weight:700;margin-top:.5rem;color:#1a237e;">
                        Total estimado: <span id="pg-valor-total">R$ 0,00</span>
                    </div>
                </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding:1rem 1.25rem;border-top:1px solid #eee;">
                <button onclick="document.getElementById('modal-pedido-grafico').remove()" style="padding:.55rem 1.2rem;border-radius:8px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;cursor:pointer;font-size:.9rem;">Cancelar</button>
                <button onclick="salvarPedidoGrafico()" id="btn-salvar-pedido-grafico" style="padding:.55rem 1.2rem;border-radius:8px;border:none;background:#2e7d32;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;">Salvar</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    // Valores preenchidos via propriedade .value (nunca interpolados no HTML):
    // texto do usuário em atributo value=/<textarea> permitiria quebrar a tag.
    document.getElementById('pg-data-pedido').value = (pedido && pedido.dataPedido) || hoje;
    document.getElementById('pg-prazo-entrega').value = (pedido && pedido.prazoEntrega) || '';
    document.getElementById('pg-solicitante').value = (pedido && pedido.solicitante) || '';
    document.getElementById('pg-setor').value = (pedido && pedido.setorSolicitante) || '';
    document.getElementById('pg-descricao').value = (pedido && pedido.descricao) || '';
    document.getElementById('pg-observacoes').value = (pedido && pedido.observacoes) || '';

    renderizarItensPedidoModal();
    document.getElementById('pg-solicitante').focus();
}

function renderizarItensPedidoModal() {
    const container = document.getElementById('pg-itens-lista');
    if (!container) return;

    if (itensPedidoSelecionados.length === 0) {
        container.innerHTML = '<p style="color:#888;font-size:.85rem;">Nenhum item adicionado ainda. O pedido pode ser salvo sem itens e detalhado depois.</p>';
    } else {
        container.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
                <thead><tr style="text-align:left;color:#666;">
                    <th style="padding:.3rem 0;">Descrição</th>
                    <th style="width:80px;">Qtd</th>
                    <th style="width:100px;">Valor Unit.</th>
                    <th style="width:40px;"></th>
                </tr></thead>
                <tbody>
                    ${itensPedidoSelecionados.map((item, idx) => `
                        <tr>
                            <td style="padding:.3rem 0;">${escaparHtml(item.descricao)}</td>
                            <td><input type="number" min="0.01" step="any" value="${item.quantidade}" style="width:70px;padding:.3rem;border:1px solid #ccc;border-radius:4px;" oninput="atualizarQtdItemPedido(${idx}, this.value)"></td>
                            <td>R$ ${_parsePrecoBR(item.valorUnit).toFixed(2).replace('.', ',')}</td>
                            <td><button type="button" onclick="removerItemPedido(${idx})" style="background:none;border:none;color:#c62828;cursor:pointer;font-size:1rem;" title="Remover">✕</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    atualizarValorTotalPedidoModal();
}

function atualizarQtdItemPedido(idx, valor) {
    const qtd = parseFloat(valor) || 0;
    if (itensPedidoSelecionados[idx]) itensPedidoSelecionados[idx].quantidade = qtd;
    atualizarValorTotalPedidoModal();
}

function removerItemPedido(idx) {
    itensPedidoSelecionados.splice(idx, 1);
    renderizarItensPedidoModal();
}

function atualizarValorTotalPedidoModal() {
    const total = itensPedidoSelecionados.reduce((sum, item) => {
        const v = _parsePrecoBR(item.valorUnit);
        const q = parseFloat(item.quantidade) || 0;
        return sum + v * q;
    }, 0);
    const el = document.getElementById('pg-valor-total');
    if (el) el.textContent = _formatarMoedaPedido(total);
}

// Seletor de itens dedicado — deliberadamente separado do seletor de emitir-os.js,
// que está acoplado ao estado global do formulário de O.S. (grupo, diárias, estoque).
// Lista filtrável por texto (mesmo espírito de filtrarItensSeletor() em emitir-os.js):
// com 53 itens no catálogo, um <select> puro tornava o lançamento lento.
let _catalogoItensPedidoFlat = [];
let _itemPedidoSelecionadoIdx = null;

// Remove acentos para a busca: quem digita rápido escreve "impressao",
// "cartao", "grafico" — sem isso o item "Impressão..." não seria encontrado.
function _normalizarBusca(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

async function abrirSeletorItensPedido() {
    if (!_catalogoPedidoGrafico) {
        _catalogoPedidoGrafico = await APIClient.listarAlimentacao();
    }
    const catalogo = _catalogoPedidoGrafico;

    const anterior = document.getElementById('modal-seletor-item-pedido');
    if (anterior) anterior.remove();

    // Achata o catálogo num array indexado. Os dados do item ficam aqui, não em
    // atributos data-* do HTML — nada de texto do catálogo vira markup.
    _catalogoItensPedidoFlat = [];
    Object.keys(catalogo).sort().forEach(cat => {
        const nomeCat = typeof formatarNomeCategoria === 'function' ? formatarNomeCategoria(cat) : cat;
        (catalogo[cat].itens || []).forEach(item => {
            _catalogoItensPedidoFlat.push({
                itemId: item.id,
                categoria: cat,
                categoriaNome: nomeCat,
                descricao: item.descricao || '',
                unidade: item.unidade || '',
                preco: (item.regioes && item.regioes['1'] && item.regioes['1'].preco) || '0',
                busca: _normalizarBusca(`${item.descricao || ''} ${nomeCat}`),
            });
        });
    });
    _itemPedidoSelecionadoIdx = null;

    const overlay = document.createElement('div');
    overlay.id = 'modal-seletor-item-pedido';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:620px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
                <h3 style="margin:0;font-size:1rem;">Adicionar Item</h3>
                <button onclick="document.getElementById('modal-seletor-item-pedido').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="padding:1rem 1.25rem .5rem;">
                <input type="text" id="pg-seletor-busca" placeholder="🔍 Digite para buscar (ex: adesivo, banner, A4)..." autocomplete="off"
                    oninput="filtrarItensSeletorPedido()" onkeydown="_teclaBuscaSeletorPedido(event)"
                    style="width:100%;padding:.6rem .75rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;font-size:.95rem;">
                <div id="pg-seletor-contador" style="font-size:.75rem;color:#777;margin-top:.35rem;"></div>
            </div>
            <div id="pg-seletor-lista" style="flex:1;overflow-y:auto;padding:0 1.25rem;min-height:120px;"></div>
            <div style="padding:.75rem 1.25rem;border-top:1px solid #eee;">
                <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;">Quantidade</label>
                <input type="number" id="pg-seletor-qtd" min="0.01" step="any" value="1"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();confirmarAdicaoItemPedido();}"
                    style="width:100%;padding:.5rem;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding:1rem 1.25rem;border-top:1px solid #eee;">
                <button onclick="document.getElementById('modal-seletor-item-pedido').remove()" style="padding:.5rem 1rem;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;cursor:pointer;">Cancelar</button>
                <button onclick="confirmarAdicaoItemPedido()" style="padding:.5rem 1rem;border-radius:6px;border:none;background:#1565c0;color:#fff;cursor:pointer;font-weight:600;">Adicionar</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    filtrarItensSeletorPedido();
    document.getElementById('pg-seletor-busca').focus();
}

function filtrarItensSeletorPedido() {
    const termo = _normalizarBusca(document.getElementById('pg-seletor-busca')?.value || '').trim();
    const lista = document.getElementById('pg-seletor-lista');
    const contador = document.getElementById('pg-seletor-contador');
    if (!lista) return;

    // Cada palavra digitada precisa aparecer — permite buscar "adesivo a4" fora de ordem
    const termos = termo.split(/\s+/).filter(Boolean);
    const visiveis = _catalogoItensPedidoFlat
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => termos.every(t => item.busca.includes(t)));

    if (contador) {
        contador.textContent = termo
            ? `${visiveis.length} ${visiveis.length === 1 ? 'item encontrado' : 'itens encontrados'}`
            : `${_catalogoItensPedidoFlat.length} itens no catálogo`;
    }

    if (visiveis.length === 0) {
        lista.innerHTML = '<p style="color:#888;font-size:.85rem;padding:1rem 0;text-align:center;">Nenhum item encontrado.</p>';
        return;
    }

    lista.innerHTML = visiveis.map(({ item, idx }) => {
        const sel = idx === _itemPedidoSelecionadoIdx;
        return `
        <div class="pg-item-opcao" data-idx="${idx}" onclick="selecionarItemSeletorPedido(${idx})" ondblclick="confirmarAdicaoItemPedido()"
            style="padding:.5rem .6rem;border-radius:6px;cursor:pointer;border:1px solid ${sel ? '#1565c0' : 'transparent'};background:${sel ? '#e3f2fd' : 'transparent'};margin-bottom:.25rem;">
            <div style="font-size:.88rem;color:#222;line-height:1.3;">${escaparHtml(item.descricao)}</div>
            <div style="font-size:.75rem;color:#777;margin-top:.15rem;">${escaparHtml(item.categoriaNome)} · R$ ${_parsePrecoBR(item.preco).toFixed(2).replace('.', ',')}</div>
        </div>`;
    }).join('');
}

function selecionarItemSeletorPedido(idx) {
    _itemPedidoSelecionadoIdx = idx;
    filtrarItensSeletorPedido();
    const qtd = document.getElementById('pg-seletor-qtd');
    if (qtd) { qtd.focus(); qtd.select(); }
}

// Enter na busca escolhe o primeiro resultado e pula para a quantidade —
// fluxo de teclado: digita, Enter, quantidade, Enter.
function _teclaBuscaSeletorPedido(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const primeiro = document.querySelector('#pg-seletor-lista .pg-item-opcao');
    if (primeiro) selecionarItemSeletorPedido(parseInt(primeiro.getAttribute('data-idx')));
}

function confirmarAdicaoItemPedido() {
    const item = _catalogoItensPedidoFlat[_itemPedidoSelecionadoIdx];
    if (!item) { alert('Selecione um item da lista.'); return; }

    const qtd = parseFloat(document.getElementById('pg-seletor-qtd').value) || 0;
    if (qtd <= 0) { alert('Informe uma quantidade válida.'); return; }

    itensPedidoSelecionados.push({
        itemId: item.itemId,
        categoria: item.categoria,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: qtd,
        valorUnit: item.preco,
    });

    document.getElementById('modal-seletor-item-pedido').remove();
    renderizarItensPedidoModal();
}

async function salvarPedidoGrafico() {
    const solicitante = document.getElementById('pg-solicitante').value.trim();
    const descricao = document.getElementById('pg-descricao').value.trim();
    if (!solicitante || !descricao) {
        alert('Solicitante e Descrição são obrigatórios.');
        return;
    }

    const dados = {
        dataPedido: document.getElementById('pg-data-pedido').value || null,
        prazoEntrega: document.getElementById('pg-prazo-entrega').value || null,
        solicitante,
        setorSolicitante: document.getElementById('pg-setor').value.trim() || null,
        descricao,
        observacoes: document.getElementById('pg-observacoes').value.trim() || null,
        itens: itensPedidoSelecionados.map(i => ({
            itemId: i.itemId,
            categoria: i.categoria,
            descricao: i.descricao,
            unidade: i.unidade,
            quantidade: i.quantidade,
        })),
    };

    const btn = document.getElementById('btn-salvar-pedido-grafico');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

    try {
        if (pedidoEditandoId) {
            await APIClient.atualizarPedidoGrafico(pedidoEditandoId, dados);
        } else {
            await APIClient.criarPedidoGrafico(dados);
        }
        document.getElementById('modal-pedido-grafico')?.remove();
        await renderizarPedidosGraficos();
    } catch (e) {
        alert('Erro ao salvar pedido: ' + e.message);
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
    }
}

// ========================================
// EMITIR OS A PARTIR DO PEDIDO
// ========================================

// Um único caminho para 1 ou N pedidos: sempre grava um array.
function _irParaEmissaoComPedidos(ids) {
    localStorage.setItem('modulo_atual', 'servicos_graficos');
    localStorage.setItem('pedidosOrigemIds', JSON.stringify(ids));
    localStorage.removeItem('pedidoOrigemId');  // limpa a chave antiga (formato singular)
    window.location.href = '/emitir-os';
}

function emitirOSDoPedido(pedidoId) {
    _irParaEmissaoComPedidos([pedidoId]);
}

function emitirOSDosPedidos() {
    const ids = [..._pedidosSelecionados];
    if (ids.length === 0) { alert('Selecione ao menos um pedido.'); return; }
    _irParaEmissaoComPedidos(ids);
}
