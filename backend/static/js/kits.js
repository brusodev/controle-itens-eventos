// ========================================
// MÓDULO: KITS - Gestão de Kits
// ========================================

function renderizarKits() {
    filtrarKits();
}

function filtrarKits() {
    const container = document.getElementById('lista-kits');
    const busca = document.getElementById('filtro-kits').value.toLowerCase();

    let kitsFiltrados = kits;

    if (busca) {
        kitsFiltrados = kitsFiltrados.filter(kit =>
            kit.nome.toLowerCase().includes(busca) ||
            (kit.descricao && kit.descricao.toLowerCase().includes(busca))
        );
    }

    container.innerHTML = '';

    if (kitsFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum kit encontrado. Crie seu primeiro kit!</p>';
        return;
    }

    kitsFiltrados.forEach(kit => {
        const card = document.createElement('div');
        card.className = 'item-card kit-card';

        const totalItens = kit.itens.length;

        card.innerHTML = `
            <div class="item-header">
                <span class="item-categoria">🎁 KIT</span>
                <span class="badge badge-success">${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>
            </div>
            <div class="item-body">
                <h3>${kit.nome}</h3>
                ${kit.descricao ? `<p class="kit-descricao">${kit.descricao}</p>` : ''}
            </div>
            <div class="item-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesKit(${kit.id})">👁️ Ver</button>
                <button class="btn-small btn-secondary" onclick="editarKit(${kit.id})">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="removerKit(${kit.id})">🗑️ Remover</button>
            </div>
        `;

        container.appendChild(card);
    });
}

// Modal de Kit
let kitEditandoId = null;

function mostrarModalNovoKit() {
    kitEditandoId = null;
    document.getElementById('modal-kit-titulo').textContent = 'Criar Novo Kit';
    document.getElementById('form-kit').reset();
    document.getElementById('itens-kit').innerHTML = '';
    document.getElementById('modal-kit').style.display = 'flex';

    // Adicionar primeiro item automaticamente
    adicionarItemKit();
}

function editarKit(id) {
    const kit = kits.find(k => k.id === id);
    if (!kit) return;

    kitEditandoId = id;
    document.getElementById('modal-kit-titulo').textContent = 'Editar Kit';
    document.getElementById('kit-nome').value = kit.nome;
    document.getElementById('kit-descricao').value = kit.descricao || '';

    // Limpar e adicionar itens do kit
    const container = document.getElementById('itens-kit');
    container.innerHTML = '';

    kit.itens.forEach(item => {
        adicionarItemKit(item.itemId, item.quantidade);
    });

    document.getElementById('modal-kit').style.display = 'flex';
}

function fecharModalKit() {
    document.getElementById('modal-kit').style.display = 'none';
    kitEditandoId = null;
}

function adicionarItemKit(itemIdPreSelecionado = null, quantidadePreSelecionada = 1) {
    const container = document.getElementById('itens-kit');

    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-requisicao';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group flex-2">
                <label>Item *</label>
                <select class="kit-item-select" required>
                    <option value="">Selecione um item</option>
                    ${estoque.map(item => `
                        <option value="${item.id}" ${itemIdPreSelecionado === item.id ? 'selected' : ''}>
                            ${item.nome}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" class="kit-item-qtd" min="1" value="${quantidadePreSelecionada}" required>
            </div>
            <div class="form-group form-group-btn">
                <button type="button" class="btn-small btn-danger" onclick="removerItemKit(this)">🗑️</button>
            </div>
        </div>
    `;

    container.appendChild(itemDiv);
}

function removerItemKit(btn) {
    btn.closest('.item-requisicao').remove();
}

function removerKit(id) {
    if (!confirm('Deseja realmente remover este kit?')) return;

    kits = kits.filter(kit => kit.id !== id);
    salvarDados();
    renderizarKits();
}

function verDetalhesKit(id) {
    const kit = kits.find(k => k.id === id);
    if (!kit) return;

    const container = document.getElementById('conteudo-detalhes-kit');

    let html = `
        <h2>🎁 ${kit.nome}</h2>
        ${kit.descricao ? `<p class="kit-descricao-detalhes">${kit.descricao}</p>` : ''}

        <h3>Itens do Kit</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Estoque Atual</th>
                </tr>
            </thead>
            <tbody>
    `;

    kit.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (estoqueItem) {
            const statusClass = estoqueItem.quantidade >= item.quantidade ? 'badge-success' : 'badge-danger';
            html += `
                <tr>
                    <td>${item.itemNome}</td>
                    <td>${item.quantidade} ${item.unidade}</td>
                    <td><span class="badge ${statusClass}">${estoqueItem.quantidade} ${item.unidade}</span></td>
                </tr>
            `;
        }
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
    document.getElementById('modal-detalhes-kit').style.display = 'flex';
}

function fecharModalDetalhesKit() {
    document.getElementById('modal-detalhes-kit').style.display = 'none';
}

// Atualizar select de kits na requisição
function atualizarSelectKits() {
    const select = document.getElementById('select-kit');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um kit</option>';

    kits.forEach(kit => {
        const option = document.createElement('option');
        option.value = kit.id;
        option.textContent = `${kit.nome} (${kit.itens.length} ${kit.itens.length === 1 ? 'item' : 'itens'})`;
        select.appendChild(option);
    });
}

// Adicionar kit na requisição
function adicionarKitNaRequisicao() {
    const selectKit = document.getElementById('select-kit');
    const kitId = parseInt(selectKit.value);

    if (!kitId) {
        alert('Selecione um kit primeiro.');
        return;
    }

    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;

    // Verificar se há estoque suficiente para todos os itens do kit
    let estoqueInsuficiente = false;
    kit.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (!estoqueItem || estoqueItem.quantidade < item.quantidade) {
            estoqueInsuficiente = true;
        }
    });

    if (estoqueInsuficiente) {
        if (!confirm('ATENÇÃO: Alguns itens do kit não possuem estoque suficiente. Deseja adicionar mesmo assim?')) {
            return;
        }
    }

    // Adicionar todos os itens do kit
    kit.itens.forEach(item => {
        const container = document.getElementById('itens-requisicao');

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-requisicao';
        itemDiv.innerHTML = `
            <div class="form-row">
                <div class="form-group flex-2">
                    <label>Item *</label>
                    <select class="req-item-select" required onchange="atualizarEstoqueDisponivel(this)">
                        <option value="">Selecione um item</option>
                        ${estoque.map(e => `
                            <option value="${e.id}" data-max="${e.quantidade}" data-unidade="${e.unidade}" ${e.id === item.itemId ? 'selected' : ''}>
                                ${e.nome} (Disponível: ${e.quantidade} ${e.unidade})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" class="req-item-qtd" min="1" value="${item.quantidade}" required>
                </div>
                <div class="form-group form-group-btn">
                    <button type="button" class="btn-small btn-danger" onclick="removerItemRequisicao(this)">🗑️</button>
                </div>
            </div>
            <small class="estoque-info"></small>
        `;

        container.appendChild(itemDiv);

        // Atualizar info de estoque
        const select = itemDiv.querySelector('.req-item-select');
        atualizarEstoqueDisponivel(select);
    });

    // Resetar select do kit
    selectKit.value = '';

    alert(`Kit "${kit.nome}" adicionado com ${kit.itens.length} ${kit.itens.length === 1 ? 'item' : 'itens'}!`);
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}
