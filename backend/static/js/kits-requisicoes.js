// ========================================
// MÓDULO: KITS-REQUISICOES - Requisições e Formulários
// ========================================

function adicionarItemRequisicao() {
    const container = document.getElementById('itens-requisicao');
    const index = container.children.length;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-requisicao';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group flex-2">
                <label>Item *</label>
                <select class="req-item-select" required onchange="atualizarEstoqueDisponivel(this)">
                    <option value="">Selecione um item</option>
                    ${estoque.map(item => `
                        <option value="${item.id}" data-max="${item.quantidade}" data-unidade="${item.unidade}">
                            ${item.nome} (Disponível: ${item.quantidade} ${item.unidade})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" class="req-item-qtd" min="1" required>
            </div>
            <div class="form-group form-group-btn">
                <button type="button" class="btn-small btn-danger" onclick="removerItemRequisicao(this)">🗑️</button>
            </div>
        </div>
        <small class="estoque-info"></small>
    `;

    container.appendChild(itemDiv);
}

function removerItemRequisicao(btn) {
    btn.closest('.item-requisicao').remove();
}

function atualizarEstoqueDisponivel(select) {
    const itemDiv = select.closest('.item-requisicao');
    const info = itemDiv.querySelector('.estoque-info');
    const qtdInput = itemDiv.querySelector('.req-item-qtd');

    const option = select.options[select.selectedIndex];
    const max = parseInt(option.getAttribute('data-max')) || 0;
    const unidade = option.getAttribute('data-unidade') || 'unidade';

    qtdInput.max = max;
    qtdInput.value = Math.min(1, max);

    if (max === 0) {
        info.textContent = '⚠️ Item sem estoque disponível';
        info.style.color = '#dc3545';
        qtdInput.disabled = true;
    } else if (max < 5) {
        info.textContent = `⚠️ Estoque baixo: apenas ${max} ${unidade} disponível(is)`;
        info.style.color = '#ff9800';
        qtdInput.disabled = false;
    } else {
        info.textContent = `✓ ${max} ${unidade} disponível(is)`;
        info.style.color = '#28a745';
        qtdInput.disabled = false;
    }
}

// ========================================
// FORMULÁRIOS
// ========================================

function configurarFormularios() {
    // Form: Adicionar/Editar Item
    document.getElementById('form-item').addEventListener('submit', async function(e) {
        e.preventDefault();

        const categoriaSelecionada = document.getElementById('item-categoria').value;
        const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
        
        if (!categoriaSelecionada) {
            alert('Por favor, selecione uma categoria.');
            return;
        }

        const dados = {
            categoria: categoriaSelecionada,
            nome: document.getElementById('item-nome').value,
            quantidade: parseInt(document.getElementById('item-quantidade').value),
            unidade: document.getElementById('item-unidade').value,
            natureza: document.getElementById('item-codigo-bec')?.value || null  // Código BEC/CATSER
        };

        if (itemEditandoId) {
            // Editar localmente (backend não implementa PUT ainda)
            const item = estoque.find(i => i.id === itemEditandoId);
            Object.assign(item, dados);
            salvarDados();
            alert('✅ Item atualizado!');
        } else {
            try {
                // Buscar categoria_id dinâmico
                const categoriaNome = categoriaSelecionada;
                const categoriaObj = dadosAlimentacao[categoriaNome];
                
                if (!categoriaObj || !categoriaObj.categoria_db_id) {
                    alert('❌ Erro: Categoria inválida');
                    return;
                }
                
                // Determinar quantidade de regiões conforme config do módulo
                const cfg = getModuleConfig();
                const maxRegioes = cfg.regioes.quantidade;
                const regioes = {};
                for (let i = 1; i <= maxRegioes; i++) {
                    regioes[i.toString()] = { inicial: dados.quantidade.toString(), gasto: '0' };
                }
                
                // Gerar próximo item_codigo (número sequencial)
                const itemsCat = categoriaObj.itens || [];
                const maxCodigo = itemsCat.length > 0 ? Math.max(...itemsCat.map(it => parseInt(it.item) || 0)) : 0;
                const novoItemCodigo = (maxCodigo + 1).toString();
                
                // Adicionar - ENVIAR PARA BACKEND
                const response = await fetch('/api/itens', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        item: novoItemCodigo,
                        descricao: dados.nome,
                        categoria_id: categoriaObj.categoria_db_id,
                        unidade: dados.unidade,
                        natureza: dados.natureza,
                        regioes: regioes
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                
                await response.json();
                alert('✅ Item adicionado com sucesso!');
                
                // Recarregar dados do módulo
                await renderizarAlimentacao();
                
            } catch (erro) {
                console.error('Erro ao salvar item no banco:', erro);
                alert('❌ Erro ao salvar item: ' + erro.message);
            }
        }

        fecharModalItem();
    });

    // Form: Adicionar/Editar Categoria
    document.getElementById('form-categoria').addEventListener('submit', function(e) {
        e.preventDefault();

        const form = document.getElementById('form-categoria');
        const catId = document.getElementById('categoria-id').value.trim();
        const catNome = document.getElementById('categoria-nome').value.trim();
        const catIcone = document.getElementById('categoria-icone').value.trim();
        const catNatureza = document.getElementById('categoria-natureza').value.trim();
        const catDesc = document.getElementById('categoria-descricao').value.trim();
        const itensTexto = document.getElementById('categoria-itens').value.trim();
        const catIdBD = form.dataset.catIdBD;
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';

        if (!catId || !catNome) {
            alert('❌ Identificador e Nome são obrigatórios!');
            return;
        }

        const payload = {
            nome: catNome,
            tipo: catId,
            natureza: catNatureza,
            icone: catIcone,
            descricao: catDesc,
            modulo: modulo
        };

        // Se está editando do banco
        if (catIdBD) {
            fetch(`/api/categorias/${catIdBD}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) throw new Error(`Erro ao atualizar`);
                return response.json();
            })
            .then(() => {
                alert('✅ Categoria atualizada!');
                fecharModalCategoria();
                renderizarCategorias();
            })
            .catch(erro => alert('❌ Erro: ' + erro.message));
            return;
        }

        // Criar nova categoria
        fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) return response.json().then(d => { throw new Error(d.erro || 'Erro ao salvar') });
            return response.json();
        })
        .then(data => {
            // Se houver itens iniciais, cadastrá-los também
            const itens = itensTexto.split('\n').map(i => i.trim()).filter(i => i.length > 0);
            if (itens.length > 0) {
                debugLog(`Cadastrando ${itens.length} itens iniciais...`);
            }

            alert('✅ Categoria criada com sucesso!');
            fecharModalCategoria();
            renderizarCategorias();
        })
        .catch(erro => alert('❌ Erro: ' + erro.message));
    });

    // Form: Nova Requisição
    document.getElementById('form-requisicao').addEventListener('submit', function(e) {
        e.preventDefault();

        const itensReq = [];
        const itensDiv = document.querySelectorAll('#itens-requisicao .item-requisicao');

        if (itensDiv.length === 0) {
            alert('Adicione pelo menos um item à requisição.');
            return;
        }

        let temErro = false;
        itensDiv.forEach(div => {
            const select = div.querySelector('.req-item-select');
            const qtdInput = div.querySelector('.req-item-qtd');

            // Verificar se os elementos existem
            if (!select || !qtdInput) {
                return; // Pula este item se os elementos não existem
            }

            const itemId = parseInt(select.value);
            const qtd = parseInt(qtdInput.value);

            // Se não tiver valor selecionado, pula (não considera erro)
            if (!itemId || !qtd || isNaN(qtd)) {
                return;
            }

            const item = estoque.find(i => i.id === itemId);

            if (!item) {
                alert('Item não encontrado no estoque.');
                temErro = true;
                return;
            }

            if (qtd > item.quantidade) {
                alert(`Quantidade solicitada de "${item.nome}" excede o estoque disponível.`);
                temErro = true;
                return;
            }

            itensReq.push({
                itemId: itemId,
                itemNome: item.nome,
                quantidade: qtd,
                unidade: item.unidade
            });
        });

        if (temErro) return;

        // Verificar se pelo menos um item válido foi adicionado
        if (itensReq.length === 0) {
            alert('Adicione pelo menos um item válido à requisição.');
            return;
        }

        const requisicao = {
            id: proximoIdRequisicao++,
            solicitante: document.getElementById('req-solicitante').value,
            recebedor: document.getElementById('req-recebedor').value,
            dataUso: document.getElementById('req-data-uso').value,
            observacao: document.getElementById('req-observacao').value,
            itens: itensReq,
            status: 'pendente',
            dataSolicitacao: new Date().toISOString()
        };

        requisicoes.push(requisicao);
        salvarDados();

        alert('Requisição enviada com sucesso! Aguarde aprovação.');
        this.reset();
        document.getElementById('itens-requisicao').innerHTML = '';
        inicializarDataAtual();

        atualizarInterface();
    });

    // Form: Criar/Editar Kit
    document.getElementById('form-kit').addEventListener('submit', function(e) {
        e.preventDefault();

        const itensKitDiv = document.querySelectorAll('#itens-kit .item-requisicao');

        if (itensKitDiv.length === 0) {
            alert('Adicione pelo menos um item ao kit.');
            return;
        }

        const itensKit = [];
        let valid = true;

        itensKitDiv.forEach(div => {
            const select = div.querySelector('.kit-item-select');
            const qtdInput = div.querySelector('.kit-item-qtd');

            // Verificar se os elementos existem
            if (!select || !qtdInput) {
                valid = false;
                return;
            }

            const itemId = parseInt(select.value);
            const qtd = parseInt(qtdInput.value);

            if (!itemId || !qtd) {
                valid = false;
                return;
            }

            const item = estoque.find(i => i.id === itemId);

            if (!item) {
                alert('Item não encontrado no estoque.');
                valid = false;
                return;
            }

            itensKit.push({
                itemId: itemId,
                itemNome: item.nome,
                quantidade: qtd,
                unidade: item.unidade
            });
        });

        if (!valid) {
            alert('Preencha todos os campos do kit.');
            return;
        }

        const dadosKit = {
            nome: document.getElementById('kit-nome').value,
            descricao: document.getElementById('kit-descricao').value,
            itens: itensKit
        };

        if (kitEditandoId) {
            // Editar kit existente
            const kit = kits.find(k => k.id === kitEditandoId);
            Object.assign(kit, dadosKit);
        } else {
            // Criar novo kit
            kits.push({
                id: proximoIdKit++,
                ...dadosKit,
                dataCriacao: new Date().toISOString()
            });
        }

        salvarDados();
        fecharModalKit();
        alert('Kit salvo com sucesso!');
        atualizarInterface();
    });
}

// ========================================
// REQUISIÇÕES PENDENTES
// ========================================

function renderizarPendentes() {
    const container = document.getElementById('lista-pendentes');
    const pendentes = requisicoes.filter(r => r.status === 'pendente');

    container.innerHTML = '';

    if (pendentes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma requisição pendente.</p>';
        return;
    }

    pendentes.forEach(req => {
        const card = document.createElement('div');
        card.className = 'requisicao-card';

        card.innerHTML = `
            <div class="req-header">
                <div>
                    <strong>Requisição #${req.id}</strong>
                    <span class="badge badge-warning">Pendente</span>
                </div>
                <small>${formatarData(req.dataSolicitacao)}</small>
            </div>
            <div class="req-body">
                <p><strong>Solicitante:</strong> ${req.solicitante}</p>
                <p><strong>Recebedor:</strong> ${req.recebedor}</p>
                <p><strong>Data de uso:</strong> ${formatarDataSimples(req.dataUso)}</p>
                <p><strong>Itens:</strong> ${req.itens.length} item(ns)</p>
                ${req.observacao ? `<p><strong>Obs:</strong> ${req.observacao}</p>` : ''}
            </div>
            <div class="req-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesRequisicao(${req.id})">👁️ Detalhes</button>
                <button class="btn-small btn-success" onclick="aprovarRequisicao(${req.id})">✓ Aprovar</button>
                <button class="btn-small btn-danger" onclick="rejeitarRequisicao(${req.id})">✗ Rejeitar</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function verDetalhesRequisicao(id) {
    const req = requisicoes.find(r => r.id === id);
    if (!req) return;

    const detalhes = document.getElementById('detalhes-requisicao');

    detalhes.innerHTML = `
        <h2>Requisição #${req.id}</h2>
        <div class="detalhes-grid">
            <div class="detalhe-item">
                <strong>Status:</strong>
                <span class="badge badge-${req.status === 'pendente' ? 'warning' : req.status === 'aprovada' ? 'success' : 'danger'}">
                    ${req.status.toUpperCase()}
                </span>
            </div>
            <div class="detalhe-item">
                <strong>Solicitante:</strong> ${req.solicitante}
            </div>
            <div class="detalhe-item">
                <strong>Recebedor:</strong> ${req.recebedor}
            </div>
            <div class="detalhe-item">
                <strong>Data de Uso:</strong> ${formatarDataSimples(req.dataUso)}
            </div>
            <div class="detalhe-item">
                <strong>Data de Solicitação:</strong> ${formatarData(req.dataSolicitacao)}
            </div>
            ${req.dataAprovacao ? `
                <div class="detalhe-item">
                    <strong>Data de ${req.status === 'aprovada' ? 'Aprovação' : 'Rejeição'}:</strong>
                    ${formatarData(req.dataAprovacao)}
                </div>
            ` : ''}
            ${req.aprovadoPor ? `
                <div class="detalhe-item">
                    <strong>${req.status === 'aprovada' ? 'Aprovado' : 'Rejeitado'} por:</strong>
                    ${req.aprovadoPor}
                </div>
            ` : ''}
        </div>

        ${req.observacao ? `
            <div class="detalhe-item-full">
                <strong>Observações:</strong>
                <p>${req.observacao}</p>
            </div>
        ` : ''}

        ${req.motivoRejeicao ? `
            <div class="detalhe-item-full alert-danger">
                <strong>Motivo da Rejeição:</strong>
                <p>${req.motivoRejeicao}</p>
            </div>
        ` : ''}

        <h3>Itens Solicitados</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Estoque Atual</th>
                </tr>
            </thead>
            <tbody>
                ${req.itens.map(item => {
                    const estoqueItem = estoque.find(e => e.id === item.itemId);
                    const qtdDisponivel = estoqueItem ? estoqueItem.quantidade : 0;
                    return `
                        <tr>
                            <td>${item.itemNome}</td>
                            <td>${item.quantidade} ${item.unidade}</td>
                            <td>${qtdDisponivel} ${item.unidade}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('modal-requisicao').style.display = 'flex';
}

function fecharModalRequisicao() {
    document.getElementById('modal-requisicao').style.display = 'none';
}

function aprovarRequisicao(id) {
    const req = requisicoes.find(r => r.id === id);
    if (!req) return;

    // Verificar se há estoque suficiente
    for (let item of req.itens) {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (!estoqueItem || estoqueItem.quantidade < item.quantidade) {
            alert(`Estoque insuficiente para "${item.itemNome}". Requisição não pode ser aprovada.`);
            return;
        }
    }

    const aprovador = prompt('Digite seu nome para confirmar a aprovação:');
    if (!aprovador) return;

    // Dar baixa no estoque
    req.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        estoqueItem.quantidade -= item.quantidade;
    });

    // Atualizar requisição
    req.status = 'aprovada';
    req.dataAprovacao = new Date().toISOString();
    req.aprovadoPor = aprovador;

    // Adicionar ao histórico
    historico.push({
        id: Date.now(),
        tipo: 'aprovacao',
        requisicaoId: req.id,
        ...req,
        dataHistorico: new Date().toISOString()
    });

    salvarDados();
    alert('Requisição aprovada! Estoque atualizado.');
    atualizarInterface();
}

function rejeitarRequisicao(id) {
    const motivo = prompt('Digite o motivo da rejeição:');
    if (!motivo) return;

    const aprovador = prompt('Digite seu nome para confirmar a rejeição:');
    if (!aprovador) return;

    const req = requisicoes.find(r => r.id === id);
    if (!req) return;

    req.status = 'rejeitada';
    req.dataAprovacao = new Date().toISOString();
    req.aprovadoPor = aprovador;
    req.motivoRejeicao = motivo;

    // Adicionar ao histórico
    historico.push({
        id: Date.now(),
        tipo: 'rejeicao',
        requisicaoId: req.id,
        ...req,
        dataHistorico: new Date().toISOString()
    });

    salvarDados();
    alert('Requisição rejeitada.');
    atualizarInterface();
}

// ========================================
// HISTÓRICO
// ========================================

function renderizarHistorico() {
    const container = document.getElementById('lista-historico');
    filtrarHistorico();
}

function filtrarHistorico() {
    const container = document.getElementById('lista-historico');
    const busca = document.getElementById('filtro-historico').value.toLowerCase();
    const status = document.getElementById('filtro-status').value;

    let itensFiltrados = requisicoes.filter(r => r.status !== 'pendente');

    if (busca) {
        itensFiltrados = itensFiltrados.filter(r =>
            r.solicitante.toLowerCase().includes(busca) ||
            r.recebedor.toLowerCase().includes(busca) ||
            r.id.toString().includes(busca)
        );
    }

    if (status) {
        itensFiltrados = itensFiltrados.filter(r => r.status === status);
    }

    // Ordenar por data (mais recente primeiro)
    itensFiltrados.sort((a, b) => new Date(b.dataAprovacao) - new Date(a.dataAprovacao));

    container.innerHTML = '';

    if (itensFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum registro encontrado.</p>';
        return;
    }

    itensFiltrados.forEach(req => {
        const card = document.createElement('div');
        card.className = 'historico-item';

        const badgeClass = req.status === 'aprovada' ? 'badge-success' : 'badge-danger';

        card.innerHTML = `
            <div class="historico-header">
                <div>
                    <strong>Requisição #${req.id}</strong>
                    <span class="badge ${badgeClass}">${req.status.toUpperCase()}</span>
                </div>
                <small>${formatarData(req.dataAprovacao)}</small>
            </div>
            <div class="historico-body">
                <div class="historico-info">
                    <p><strong>Solicitante:</strong> ${req.solicitante}</p>
                    <p><strong>Recebedor:</strong> ${req.recebedor}</p>
                    <p><strong>Data de uso:</strong> ${formatarDataSimples(req.dataUso)}</p>
                </div>
                <div class="historico-info">
                    <p><strong>${req.status === 'aprovada' ? 'Aprovado' : 'Rejeitado'} por:</strong> ${req.aprovadoPor}</p>
                    <p><strong>Itens:</strong> ${req.itens.length} item(ns)</p>
                </div>
            </div>
            <div class="historico-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesRequisicao(${req.id})">👁️ Ver Detalhes</button>
            </div>
        `;

        container.appendChild(card);
    });
}
