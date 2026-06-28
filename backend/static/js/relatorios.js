// ========================================
// MÓDULO: RELATORIOS - Todos os Relatórios
// ========================================

/**
 * Carregar categorias no filtro de relatório de estoque
 */
async function carregarCategoriasRelatorio() {
    try {
        const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
        const response = await fetch(`/api/alimentacao/categorias?modulo=${moduloAtual}`);
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('rel-estoque-categoria');
            if (select) {
                select.innerHTML = '<option value="">Todas</option>';

                data.categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nome;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Carregar categorias quando abrir aba de relatórios
document.addEventListener('DOMContentLoaded', function() {
    // A navegação de Relatórios é por link (recarrega a página), então aplicamos
    // a visibilidade dos cards específicos de módulo direto no carregamento.
    atualizarVisibilidadeRelatoriosPorModulo();

    const tabRelatorios = document.querySelector('[data-tab="relatorios"]');
    if (tabRelatorios) {
        tabRelatorios.addEventListener('click', () => {
            carregarCategoriasRelatorio();
            atualizarVisibilidadeRelatoriosPorModulo();
        });
    }
});

/**
 * Gerar Relatório de Ordens de Serviço
 */
async function gerarRelatorioOS() {
    const dataInicio = document.getElementById('rel-os-data-inicio').value;
    const dataFim = document.getElementById('rel-os-data-fim').value;
    const regiao = document.getElementById('rel-os-regiao').value;
    const contratada = document.getElementById('rel-os-contratada').value;
    const servico = document.getElementById('rel-os-servico').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);
    if (contratada) params.append('contratada', contratada);
    if (servico) params.append('servico', servico);

    try {
        const response = await fetch(`/api/relatorios/ordens-servico?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioOS(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioOS(data) {
    const resultado = document.getElementById('resultado-rel-os');
    const stats = document.getElementById('stats-rel-os');
    const tabela = document.getElementById('tabela-rel-os');

    // Mostrar resultado
    resultado.style.display = 'block';

    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.total_os}</div>
            <div class="stat-label">Total de O.S.</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.regioes_atendidas}</div>
            <div class="stat-label">Regiões Atendidas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Object.keys(data.estatisticas.por_servico).length}</div>
            <div class="stat-label">Tipos de Serviço</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Object.keys(data.estatisticas.por_contratada).length}</div>
            <div class="stat-label">Contratadas</div>
        </div>
    `;

    // Tabela
    const statusLabelsRel = {
        'emitida': { texto: 'Emitida', cor: '#1565c0', bg: '#e3f2fd' },
        'enviada_empresa': { texto: 'Ag. Empresa', cor: '#e65100', bg: '#fff3e0' },
        'em_revisao': { texto: 'Em Revisão', cor: '#c62828', bg: '#fce4ec' },
        'aceita': { texto: 'Aceita', cor: '#2e7d32', bg: '#e8f5e9' },
        'em_execucao': { texto: 'Em Execução', cor: '#283593', bg: '#e8eaf6' },
        'executada': { texto: 'Executada', cor: '#6a1b9a', bg: '#f3e5f5' },
        'recusada': { texto: 'Recusada', cor: '#b71c1c', bg: '#ffebee' },
        'cancelada': { texto: 'Cancelada', cor: '#555', bg: '#eee' },
    };

    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Nº O.S.</th>
                        <th>Data Emissão</th>
                        <th>Status</th>
                        <th>Serviço</th>
                        <th>Evento</th>
                        <th>Contratada</th>
                        <th>Região</th>
                        <th>Itens</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.ordens.forEach(os => {
        const dataEmissao = os.dataEmissao ? new Date(os.dataEmissao).toLocaleDateString('pt-BR') : '-';
        const stCfg = statusLabelsRel[os.status] || { texto: os.status || '-', cor: '#555', bg: '#eee' };
        const badgeStatus = `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;background:${stCfg.bg};color:${stCfg.cor}">${stCfg.texto}</span>`;
        tabelaHTML += `
            <tr>
                <td><strong>${os.numeroOS}</strong></td>
                <td>${dataEmissao}</td>
                <td>${badgeStatus}</td>
                <td>${os.servico || '-'}</td>
                <td>${os.evento || '-'}</td>
                <td>${os.detentora || '-'}</td>
                <td>${os.regiaoEstoque || '-'}</td>
                <td>${os.itens ? os.itens.length : 0}</td>
            </tr>
        `;
    });

    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;

    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar PDF do Relatório de O.S.
 */
function gerarPDFRelatorioOS() {
    const dataInicio = document.getElementById('rel-os-data-inicio').value;
    const dataFim = document.getElementById('rel-os-data-fim').value;
    const regiao = document.getElementById('rel-os-regiao').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);

    window.open(`/api/relatorios/pdf/ordens-servico?${params}`, '_blank');
}

/**
 * Gerar Relatório de Estoque
 */
async function gerarRelatorioEstoque() {
    const categoriaId = document.getElementById('rel-estoque-categoria').value;
    const regiao = document.getElementById('rel-estoque-regiao').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (categoriaId) params.append('categoria_id', categoriaId);
    if (regiao) params.append('regiao', regiao);

    try {
        const response = await fetch(`/api/relatorios/estoque-posicao?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioEstoque(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioEstoque(data) {
    const resultado = document.getElementById('resultado-rel-estoque');
    const stats = document.getElementById('stats-rel-estoque');
    const tabela = document.getElementById('tabela-rel-estoque');

    resultado.style.display = 'block';

    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_itens}</div>
            <div class="stat-label">Total de Itens</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_inicial.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Quantidade Inicial</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_gasto.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Quantidade Gasta</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.percentual_uso_geral.toFixed(1)}%</div>
            <div class="stat-label">Percentual de Uso</div>
        </div>
    `;

    // Tabela
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Item</th>
                        <th>Unidade</th>
                        <th>Região</th>
                        <th>Inicial</th>
                        <th>Gasto</th>
                        <th>Disponível</th>
                        <th>% Uso</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.estoque.forEach(item => {
        const corUso = item.percentual_uso > 80 ? 'color: #dc3545; font-weight: bold;' :
                       item.percentual_uso > 50 ? 'color: #ff9800; font-weight: bold;' : '';

        tabelaHTML += `
            <tr>
                <td>${item.categoria}</td>
                <td>${item.descricao}</td>
                <td>${item.unidade}</td>
                <td>${item.regiao}</td>
                <td>${item.quantidade_inicial.toLocaleString('pt-BR')}</td>
                <td>${item.quantidade_gasto.toLocaleString('pt-BR')}</td>
                <td>${item.quantidade_disponivel.toLocaleString('pt-BR')}</td>
                <td style="${corUso}">${item.percentual_uso.toFixed(1)}%</td>
            </tr>
        `;
    });

    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;

    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar PDF do Relatório de Estoque
 */
function gerarPDFRelatorioEstoque() {
    const categoriaId = document.getElementById('rel-estoque-categoria').value;
    const regiao = document.getElementById('rel-estoque-regiao').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (categoriaId) params.append('categoria_id', categoriaId);
    if (regiao) params.append('regiao', regiao);

    window.open(`/api/relatorios/pdf/estoque?${params}`, '_blank');
}

/**
 * Gerar Relatório de Movimentações
 */
async function gerarRelatorioMovimentacoes() {
    const dataInicio = document.getElementById('rel-mov-data-inicio').value;
    const dataFim = document.getElementById('rel-mov-data-fim').value;
    const regiao = document.getElementById('rel-mov-regiao').value;
    const tipo = document.getElementById('rel-mov-tipo').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);
    if (tipo) params.append('tipo', tipo);

    try {
        const response = await fetch(`/api/relatorios/movimentacoes?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioMovimentacoes(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioMovimentacoes(data) {
    const resultado = document.getElementById('resultado-rel-mov');
    const stats = document.getElementById('stats-rel-mov');
    const tabela = document.getElementById('tabela-rel-mov');

    resultado.style.display = 'block';

    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_movimentacoes}</div>
            <div class="stat-label">Total de Movimentações</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_saidas.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Total de Saídas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_entradas.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Total de Entradas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.saldo.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Saldo</div>
        </div>
    `;

    // Tabela
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Item</th>
                        <th>O.S.</th>
                        <th>Região</th>
                        <th>Quantidade</th>
                        <th>Tipo</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.movimentacoes.forEach(mov => {
        const badgeClass = mov.tipo === 'SAIDA' ? 'badge-saida' : 'badge-entrada';

        tabelaHTML += `
            <tr>
                <td>${mov.data}</td>
                <td>${mov.item_descricao}</td>
                <td>${mov.numero_os}</td>
                <td>${mov.regiao}</td>
                <td>${mov.quantidade.toLocaleString('pt-BR')}</td>
                <td><span class="${badgeClass}">${mov.tipo}</span></td>
                <td>${mov.observacao || '-'}</td>
            </tr>
        `;
    });

    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;

    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar Relatório de Consumo por Categoria
 */
async function gerarRelatorioCategoria() {
    const dataInicio = document.getElementById('rel-cat-data-inicio').value;
    const dataFim = document.getElementById('rel-cat-data-fim').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);

    try {
        const response = await fetch(`/api/relatorios/consumo-por-categoria?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioCategoria(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioCategoria(data) {
    const resultado = document.getElementById('resultado-rel-cat');
    const tabela = document.getElementById('tabela-rel-cat');

    resultado.style.display = 'block';

    // Tabela agrupada por categoria
    let tabelaHTML = '<div class="relatorio-tabela">';

    data.categorias.forEach(cat => {
        tabelaHTML += `
            <h5 style="margin-top: 20px; color: #667eea;">${cat.categoria} (BEC: ${cat.natureza || 'N/A'})</h5>
            <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 10px;">
                Total de itens diferentes: ${cat.total_itens_diferentes} |
                Consumo total: ${cat.total_consumo.toLocaleString('pt-BR')}
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Unidade</th>
                        <th>Quantidade Consumida</th>
                        <th>Vezes Utilizado</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cat.itens.forEach(item => {
            tabelaHTML += `
                <tr>
                    <td>${item.descricao}</td>
                    <td>${item.unidade}</td>
                    <td>${item.total_consumido.toLocaleString('pt-BR')}</td>
                    <td>${item.vezes_utilizado}</td>
                </tr>
            `;
        });

        tabelaHTML += `
                </tbody>
            </table>
        `;
    });

    tabelaHTML += '</div>';
    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar Relatório de Top Itens
 */
async function gerarRelatorioTopItens() {
    const dataInicio = document.getElementById('rel-top-data-inicio').value;
    const dataFim = document.getElementById('rel-top-data-fim').value;
    const limite = document.getElementById('rel-top-limite').value;
    const grupo = document.getElementById('rel-top-grupo').value;
    const ordenarPor = document.getElementById('rel-top-ordenar').value;

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (limite) params.append('limite', limite);
    if (grupo) params.append('grupo', grupo);
    if (ordenarPor) params.append('ordenar_por', ordenarPor);

    try {
        const response = await fetch(`/api/relatorios/itens-mais-utilizados?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioTopItens(data);
            document.getElementById('btn-excel-top').style.display = '';
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exportarTopItensExcel() {
    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    const dataInicio = document.getElementById('rel-top-data-inicio').value;
    const dataFim    = document.getElementById('rel-top-data-fim').value;
    const limite     = document.getElementById('rel-top-limite').value;
    const grupo      = document.getElementById('rel-top-grupo').value;
    const ordenarPor = document.getElementById('rel-top-ordenar').value;
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim)    params.append('data_fim', dataFim);
    if (limite)     params.append('limite', limite);
    if (grupo)      params.append('grupo', grupo);
    if (ordenarPor) params.append('ordenar_por', ordenarPor);
    window.open(`/api/relatorios/itens-mais-utilizados/excel?${params}`, '_blank');
}

// Referência global para destruir o gráfico antes de recriar
let _graficoPizzaItens = null;

function exibirResultadoRelatorioTopItens(data) {
    const resultado = document.getElementById('resultado-rel-top');
    const tabela = document.getElementById('tabela-rel-top');

    resultado.style.display = 'block';

    // Tabela com ranking
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Item</th>
                        <th>Categoria</th>
                        <th>Unidade</th>
                        <th>Quantidade Consumida</th>
                        <th>Vezes Utilizado</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.ranking.forEach(item => {
        const posClass = item.posicao <= 3 ? `top-${item.posicao}` : '';

        tabelaHTML += `
            <tr>
                <td><span class="ranking-position ${posClass}">${item.posicao}</span></td>
                <td><strong>${item.descricao}</strong></td>
                <td>${item.categoria}</td>
                <td>${item.unidade}</td>
                <td>${item.total_consumido.toLocaleString('pt-BR')}</td>
                <td>${item.vezes_utilizado}</td>
            </tr>
        `;
    });

    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;

    tabela.innerHTML = tabelaHTML;

    // Gráfico de pizza
    _renderizarGraficoPizza(data.ranking);
}

function _renderizarGraficoPizza(ranking) {
    const canvas = document.getElementById('grafico-pizza-itens');
    if (!canvas || typeof Chart === 'undefined') return;

    if (_graficoPizzaItens) {
        _graficoPizzaItens.destroy();
        _graficoPizzaItens = null;
    }

    const labels = ranking.map(i => i.descricao.length > 30 ? i.descricao.substring(0, 28) + '…' : i.descricao);
    const valores = ranking.map(i => i.total_consumido);

    const cores = [
        '#1565c0','#e65100','#2e7d32','#6a1b9a','#c62828',
        '#00695c','#283593','#4e342e','#37474f','#f57f17',
        '#558b2f','#0277bd','#ad1457','#6d4c41','#5c6bc0',
    ];

    _graficoPizzaItens = new Chart(canvas, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: cores.slice(0, labels.length),
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 14 } },
                title: { display: true, text: 'Itens mais utilizados (por qtd. consumida)', font: { size: 13 } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString('pt-BR')}`
                    }
                }
            }
        }
    });
}

// ────────────────────────────────────────────────────
// RELATÓRIO DE EVENTOS — MÓDULO ORGANIZAÇÃO
// ────────────────────────────────────────────────────

const ORG_STATUS_CFG = {
    emitida:         { texto: 'Emitida',      cor: '#374151', bg: '#F3F4F6' },
    enviada_empresa: { texto: 'Ag. Empresa',  cor: '#92400E', bg: '#FEF3C7' },
    em_revisao:      { texto: 'Em Revisão',   cor: '#991B1B', bg: '#FEE2E2' },
    aceita:          { texto: 'Aceita',       cor: '#1E3A8A', bg: '#DBEAFE' },
    em_execucao:     { texto: 'Em Execução',  cor: '#92400E', bg: '#FFF7ED' },
    executada:       { texto: 'Executada',    cor: '#14532D', bg: '#DCFCE7' },
    recusada:        { texto: 'Recusada',     cor: '#7F1D1D', bg: '#FEE2E2' },
    cancelada:       { texto: 'Cancelada',    cor: '#374151', bg: '#E5E7EB' },
};

function _getOrgParams() {
    const params = new URLSearchParams();
    const grupo  = document.getElementById('rel-org-grupo').value;
    const status = document.getElementById('rel-org-status').value;
    const inicio = document.getElementById('rel-org-data-inicio').value;
    const fim    = document.getElementById('rel-org-data-fim').value;
    const emp    = document.getElementById('rel-org-empresa').value;
    if (grupo)  params.append('grupo', grupo);
    if (status) params.append('status', status);
    if (inicio) params.append('data_inicio', inicio);
    if (fim)    params.append('data_fim', fim);
    if (emp)    params.append('empresa', emp);
    return params;
}

function _fmtBRL(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function gerarRelatorioOrgEventos() {
    const params = _getOrgParams();
    try {
        const response = await fetch(`/api/relatorios/organizacao/eventos?${params}`);
        const data = await response.json();
        if (!data.success) { alert('Erro: ' + data.error); return; }

        const resultado = document.getElementById('resultado-rel-org');
        const statsDiv  = document.getElementById('stats-rel-org');
        const tabelaDiv = document.getElementById('tabela-rel-org');
        const btnExcel  = document.getElementById('btn-excel-org');

        resultado.style.display = 'block';
        btnExcel.style.display  = 'inline-flex';

        const e = data.estatisticas;

        statsDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${e.total_eventos}</div>
                <div class="stat-label">Eventos</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #3B82F6;">
                <div class="stat-value">${e.total_pessoas.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Pessoas Atendidas</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #10B981;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${_fmtBRL(e.custo_total_geral)}</div>
                <div class="stat-label">Custo Total Geral</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #8B5CF6;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${_fmtBRL(e.custo_medio_evento)}</div>
                <div class="stat-label">Custo Médio / Evento</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #F59E0B;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${_fmtBRL(e.custo_medio_pessoa)}</div>
                <div class="stat-label">Custo Médio / Pessoa</div>
            </div>
        `;

        if (data.eventos.length === 0) {
            tabelaDiv.innerHTML = '<p style="color:#6c757d;padding:1rem 0;">Nenhum evento encontrado para os filtros selecionados.</p>';
            return;
        }

        let html = `
            <div class="relatorio-tabela" style="overflow-x:auto;">
                <table style="min-width:1100px;">
                    <thead>
                        <tr>
                            <th>Nº O.S.</th>
                            <th>Evento</th>
                            <th>Data</th>
                            <th>Grupo</th>
                            <th>Empresa</th>
                            <th>Status</th>
                            <th style="text-align:right;">Pessoas</th>
                            <th style="text-align:right;">Montagem/Dec.</th>
                            <th style="text-align:right;">Rec. Humanos</th>
                            <th style="text-align:right;">Equip. TI</th>
                            <th style="text-align:right;">Mat. Gráfico</th>
                            <th class="col-destaque" style="text-align:right;">CUSTO TOTAL</th>
                            <th style="text-align:right;">Custo/Pessoa</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.eventos.forEach(ev => {
            const stCfg = ORG_STATUS_CFG[ev.status] || { texto: ev.status, cor: '#555', bg: '#eee' };
            const badge = `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;background:${stCfg.bg};color:${stCfg.cor};">${stCfg.texto}</span>`;
            const fmtV = v => v > 0 ? 'R$ ' + _fmtBRL(v) : '<span style="color:#9CA3AF">—</span>';

            html += `
                <tr>
                    <td><strong>${ev.numeroOS}</strong></td>
                    <td title="${ev.evento}">${ev.evento.length > 35 ? ev.evento.substring(0, 33) + '…' : ev.evento}</td>
                    <td>${ev.dataEvento}</td>
                    <td>${ev.grupoNome}</td>
                    <td title="${ev.empresa}">${ev.empresa.length > 30 ? ev.empresa.substring(0, 28) + '…' : ev.empresa}</td>
                    <td>${badge}</td>
                    <td style="text-align:right;">${ev.qtdPessoas > 0 ? ev.qtdPessoas.toLocaleString('pt-BR') : '—'}</td>
                    <td style="text-align:right;">${fmtV(ev.custoMontagem)}</td>
                    <td style="text-align:right;">${fmtV(ev.custoRH)}</td>
                    <td style="text-align:right;">${fmtV(ev.custoTI)}</td>
                    <td style="text-align:right;">${fmtV(ev.custoGrafico)}</td>
                    <td class="col-destaque" style="text-align:right;">${fmtV(ev.custoTotal)}</td>
                    <td style="text-align:right;">${fmtV(ev.custoPorPessoa)}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tabelaDiv.innerHTML = html;

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao gerar relatório de eventos de organização');
    }
}

function exportarOrgEventosExcel() {
    const params = _getOrgParams();
    window.open(`/api/relatorios/organizacao/excel?${params}`, '_blank');
}

// ────────────────────────────────────────────────────
// Relatório de Transporte por Setor Solicitante
// ────────────────────────────────────────────────────
function _getTranspParams() {
    const params = new URLSearchParams();
    const setor  = document.getElementById('rel-transp-setor').value;
    const status = document.getElementById('rel-transp-status').value;
    const inicio = document.getElementById('rel-transp-data-inicio').value;
    const fim    = document.getElementById('rel-transp-data-fim').value;
    const emp    = document.getElementById('rel-transp-empresa').value;
    if (setor)  params.append('setor', setor);
    if (status) params.append('status', status);
    if (inicio) params.append('data_inicio', inicio);
    if (fim)    params.append('data_fim', fim);
    if (emp)    params.append('empresa', emp);
    return params;
}

async function gerarRelatorioTransporteSetores() {
    const params = _getTranspParams();
    try {
        const response = await fetch(`/api/relatorios/transporte/setores?${params}`);
        const data = await response.json();
        if (!data.success) { alert('Erro: ' + data.error); return; }

        const resultado = document.getElementById('resultado-rel-transp');
        const statsDiv  = document.getElementById('stats-rel-transp');
        const tabelaDiv = document.getElementById('tabela-rel-transp');
        const btnExcel  = document.getElementById('btn-excel-transp');

        resultado.style.display = 'block';
        btnExcel.style.display  = 'inline-flex';

        const e = data.estatisticas;

        statsDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${e.total_os}</div>
                <div class="stat-label">Ordens de Serviço</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #3B82F6;">
                <div class="stat-value">${e.total_setores}</div>
                <div class="stat-label">Setores Solicitantes</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #10B981;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${_fmtBRL(e.valor_total_geral)}</div>
                <div class="stat-label">Valor Total Geral</div>
            </div>
            <div class="stat-card" style="border-left:4px solid #8B5CF6;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${_fmtBRL(e.valor_medio_os)}</div>
                <div class="stat-label">Valor Médio / O.S.</div>
            </div>
        `;

        if (data.ordens.length === 0) {
            tabelaDiv.innerHTML = '<p style="color:#6c757d;padding:1rem 0;">Nenhuma O.S. de transporte encontrada para os filtros selecionados.</p>';
            return;
        }

        // Tabela 1: resumo por setor
        let html = `
            <h4 style="margin-top:1rem;">Resumo por Setor</h4>
            <div class="relatorio-tabela" style="overflow-x:auto;">
                <table style="min-width:480px;">
                    <thead>
                        <tr>
                            <th>Setor Solicitante</th>
                            <th style="text-align:right;">Qtd. O.S.</th>
                            <th class="col-destaque" style="text-align:right;">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        data.setores.forEach(s => {
            html += `
                <tr>
                    <td><strong>${s.setor}</strong></td>
                    <td style="text-align:right;">${s.qtdOS}</td>
                    <td class="col-destaque" style="text-align:right;">R$ ${_fmtBRL(s.valorTotal)}</td>
                </tr>
            `;
        });
        html += `
                <tr class="linha-total">
                    <td>TOTAL GERAL</td>
                    <td style="text-align:right;">${e.total_os}</td>
                    <td style="text-align:right;">R$ ${_fmtBRL(e.valor_total_geral)}</td>
                </tr>
        `;
        html += '</tbody></table></div>';

        // Tabela 2: detalhamento das O.S.
        html += `
            <h4 style="margin-top:1.5rem;">Detalhamento das O.S.</h4>
            <div class="relatorio-tabela" style="overflow-x:auto;">
                <table style="min-width:900px;">
                    <thead>
                        <tr>
                            <th>Nº O.S.</th>
                            <th>Setor</th>
                            <th>Evento</th>
                            <th>Data Evento</th>
                            <th>Empresa</th>
                            <th>Status</th>
                            <th style="text-align:right;">Itens</th>
                            <th class="col-destaque" style="text-align:right;">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        data.ordens.forEach(o => {
            const stCfg = ORG_STATUS_CFG[o.status] || { texto: o.status, cor: '#555', bg: '#eee' };
            const badge = `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;background:${stCfg.bg};color:${stCfg.cor};">${stCfg.texto}</span>`;
            html += `
                <tr>
                    <td><strong>${o.numeroOS}</strong></td>
                    <td>${o.setor}</td>
                    <td title="${o.evento}">${o.evento.length > 30 ? o.evento.substring(0, 28) + '…' : o.evento}</td>
                    <td>${o.dataEvento}</td>
                    <td title="${o.empresa}">${o.empresa.length > 28 ? o.empresa.substring(0, 26) + '…' : o.empresa}</td>
                    <td>${badge}</td>
                    <td style="text-align:right;">${o.totalItens}</td>
                    <td class="col-destaque" style="text-align:right;">R$ ${_fmtBRL(o.valorTotal)}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        tabelaDiv.innerHTML = html;

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao gerar relatório de transporte por setor');
    }
}

function exportarTransporteSetoresExcel() {
    const params = _getTranspParams();
    window.open(`/api/relatorios/transporte/excel?${params}`, '_blank');
}

/**
 * Mostra/oculta cards de relatório específicos de cada módulo,
 * conforme o módulo atualmente selecionado.
 */
function atualizarVisibilidadeRelatoriosPorModulo() {
    const modulo = localStorage.getItem('modulo_atual') || 'coffee';

    // Cards específicos de módulo: id do card -> módulo em que aparece
    const cardsPorModulo = {
        'card-rel-transporte': 'transporte',
        'card-rel-organizacao': 'organizacao',
    };

    Object.entries(cardsPorModulo).forEach(([cardId, moduloAlvo]) => {
        const card = document.getElementById(cardId);
        if (card) card.style.display = modulo === moduloAlvo ? '' : 'none';
    });
}

// ────────────────────────────────────────────────────
// RELATÓRIO DE CONTROLE DE PAGAMENTOS
// ────────────────────────────────────────────────────

const PAG_STATUS_CFG = {
    pago:      { texto: '✅ Pago',      cor: '#155724', bg: '#d4edda' },
    pendente:  { texto: '⏳ Pendente',  cor: '#856404', bg: '#fff3cd' },
    vencido:   { texto: '🔴 VENCIDO',   cor: '#721c24', bg: '#f8d7da' },
    sem_prazo: { texto: '— Sem Prazo',  cor: '#495057', bg: '#e9ecef' },
};

function _getPagamentosParams() {
    const status  = document.getElementById('rel-pag-status').value;
    const inicio  = document.getElementById('rel-pag-data-inicio').value;
    const fim     = document.getElementById('rel-pag-data-fim').value;
    const modulo  = document.getElementById('rel-pag-modulo').value;
    const empresa = document.getElementById('rel-pag-empresa').value;

    const params = new URLSearchParams();
    if (status)  params.append('status', status);
    if (inicio)  params.append('data_inicio_vencimento', inicio);
    if (fim)     params.append('data_fim_vencimento', fim);
    if (modulo)  params.append('modulo', modulo);
    if (empresa) params.append('empresa', empresa);
    return params;
}

async function gerarRelatorioPagamentos() {
    const params = _getPagamentosParams();
    try {
        const response = await fetch(`/api/relatorios/pagamentos?${params}`);
        const data = await response.json();
        if (!data.success) { alert('Erro: ' + data.error); return; }

        const resultado = document.getElementById('resultado-rel-pag');
        const statsDiv  = document.getElementById('stats-rel-pag');
        const tabelaDiv = document.getElementById('tabela-rel-pag');
        const btnExcel  = document.getElementById('btn-excel-pagamentos');

        resultado.style.display = 'block';
        btnExcel.style.display  = 'inline-flex';

        const e = data.estatisticas;
        const valorFmt = e.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        statsDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${e.total}</div>
                <div class="stat-label">Total de O.S.</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #28a745;">
                <div class="stat-value" style="color:#155724">${e.pagos}</div>
                <div class="stat-label">Pagas</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #ffc107;">
                <div class="stat-value" style="color:#856404">${e.pendentes}</div>
                <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #dc3545;">
                <div class="stat-value" style="color:#721c24">${e.vencidos}</div>
                <div class="stat-label">Vencidas</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #6c757d;">
                <div class="stat-value" style="color:#495057">${e.sem_prazo}</div>
                <div class="stat-label">Sem Prazo</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #17a2b8;">
                <div class="stat-value" style="font-size:1rem;">R$&nbsp;${valorFmt}</div>
                <div class="stat-label">Valor Total</div>
            </div>
        `;

        if (data.pagamentos.length === 0) {
            tabelaDiv.innerHTML = '<p style="color:#6c757d;padding:1rem 0;">Nenhum registro encontrado para os filtros selecionados.</p>';
            return;
        }

        let html = `
            <div class="relatorio-tabela">
                <table>
                    <thead>
                        <tr>
                            <th>Nº O.S.</th>
                            <th>Empresa</th>
                            <th>Módulo</th>
                            <th>Região</th>
                            <th>Data Emissão</th>
                            <th>Vencimento</th>
                            <th>Valor Total (R$)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.pagamentos.forEach(p => {
            const cfg = PAG_STATUS_CFG[p.status] || { texto: p.status, cor: '#000', bg: '#fff' };
            const badge = `<span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:0.78rem;font-weight:600;background:${cfg.bg};color:${cfg.cor};">${cfg.texto}</span>`;
            const valorFmt = p.valorTotal > 0
                ? p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—';
            const rowStyle = p.status === 'vencido' ? 'background:#fff5f5;' : '';

            html += `
                <tr style="${rowStyle}">
                    <td><strong>${p.numeroOS}</strong></td>
                    <td>${p.empresa}</td>
                    <td>${p.modulo}</td>
                    <td>${p.regiao}</td>
                    <td>${p.dataEmissao}</td>
                    <td><strong>${p.vencimento}</strong></td>
                    <td style="text-align:right;">${valorFmt === '—' ? '—' : 'R$ ' + valorFmt}</td>
                    <td style="text-align:center;">${badge}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        tabelaDiv.innerHTML = html;

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao gerar relatório de pagamentos');
    }
}

function exportarPagamentosExcel() {
    const params = _getPagamentosParams();
    window.open(`/api/relatorios/pagamentos/excel?${params}`, '_blank');
}

console.log('✅ Funções de relatórios carregadas!');
