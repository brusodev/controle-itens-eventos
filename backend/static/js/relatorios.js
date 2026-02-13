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
    const tabRelatorios = document.querySelector('[data-tab="relatorios"]');
    if (tabRelatorios) {
        tabRelatorios.addEventListener('click', carregarCategoriasRelatorio);
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
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Nº O.S.</th>
                        <th>Data Emissão</th>
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
        tabelaHTML += `
            <tr>
                <td><strong>${os.numeroOS}</strong></td>
                <td>${dataEmissao}</td>
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

    const params = new URLSearchParams();
    params.append('modulo', localStorage.getItem('modulo_atual') || 'coffee');
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (limite) params.append('limite', limite);

    try {
        const response = await fetch(`/api/relatorios/itens-mais-utilizados?${params}`);
        const data = await response.json();

        if (data.success) {
            exibirResultadoRelatorioTopItens(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

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
}

console.log('✅ Funções de relatórios carregadas!');
