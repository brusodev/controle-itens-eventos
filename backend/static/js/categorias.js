// ========================================
// MÓDULO: CATEGORIAS - Modal de Item e Gestão de Categorias
// ========================================

// Modal de Item
let itemEditandoId = null;

function mostrarModalNovoItem() {
    itemEditandoId = null;
    
    // Atualizar título do modal de acordo com o módulo
    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const titulosModal = {
        'coffee': 'Adicionar Item de Alimentação',
        'transporte': 'Adicionar Item de Transporte',
        'hospedagem': 'Adicionar Item de Hospedagem',
        'organizacao': 'Adicionar Item de Organização'
    };
    document.getElementById('modal-titulo').textContent = titulosModal[moduloAtual] || 'Adicionar Item ao Estoque';
    
    document.getElementById('form-item').reset();
    document.getElementById('item-unidade').value = 'unidade';
    
    // Carregar categorias do módulo atual
    const selectCategoria = document.getElementById('item-categoria');
    selectCategoria.innerHTML = '<option value="">Selecione a categoria</option>';
    
    if (dadosAlimentacao && Object.keys(dadosAlimentacao).length > 0) {
        Object.keys(dadosAlimentacao).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = formatarCategoriaAlimentacao(cat);
            if (dadosAlimentacao[cat].natureza) {
                option.textContent += ` (${dadosAlimentacao[cat].natureza})`;
            }
            selectCategoria.appendChild(option);
        });
    }
    
    // Atualizar label do código BEC/CATSER baseado no módulo
    const cfg = getModuleConfig();
    const labelCodigoBec = document.getElementById('label-item-codigo-bec');
    if (labelCodigoBec) {
        labelCodigoBec.textContent = `Código ${cfg.itemCodeLabel}`;
    }
    
    document.getElementById('modal-item').style.display = 'flex';
}

function editarItem(id) {
    const item = estoque.find(i => i.id === id);
    if (!item) return;

    itemEditandoId = id;
    document.getElementById('modal-titulo').textContent = 'Editar Item';
    document.getElementById('item-categoria').value = item.categoria;
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-quantidade').value = item.quantidade;
    document.getElementById('item-unidade').value = item.unidade;
    
    // Preencher código BEC/CATSER se existir
    const codigoBecInput = document.getElementById('item-codigo-bec');
    if (codigoBecInput) {
        codigoBecInput.value = item.natureza || '';
    }
    
    // Atualizar label do código BEC/CATSER baseado no módulo
    const cfg = getModuleConfig();
    const labelCodigoBec = document.getElementById('label-item-codigo-bec');
    if (labelCodigoBec) {
        labelCodigoBec.textContent = `Código ${cfg.itemCodeLabel}`;
    }
    
    document.getElementById('modal-item').style.display = 'flex';
}

function fecharModalItem() {
    document.getElementById('modal-item').style.display = 'none';
    itemEditandoId = null;
}

function removerItem(id) {
    if (!confirm('Deseja realmente remover este item do estoque?')) return;

    estoque = estoque.filter(item => item.id !== id);
    salvarDados();
    renderizarEstoque();
}

// ========================================
// GERENCIAR CATEGORIAS
// ========================================

function mostrarAbaCategories() {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    // Mostrar aba de categorias
    const abaCategories = document.getElementById('tab-categorias');
    if (abaCategories) {
        abaCategories.style.display = 'block';
        abaCategories.classList.add('active');
        abaCategories.scrollIntoView({ behavior: 'smooth' });
    }

    // Atualizar menu lateral
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const menuCat = document.getElementById('menu-categorias');
    if (menuCat) menuCat.classList.add('active');

    // Renderizar categorias
    renderizarCategorias();
}

// --- GESTÃO DE CATEGORIAS ---

function atualizarSlugCategoria(nome) {
    const slugInput = document.getElementById('categoria-id');
    // Se estiver editando (desabilitado), não auto-atualiza
    if (slugInput.disabled) return;

    const slug = nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    slugInput.value = slug;
}

function renderizarCategorias() {
    const container = document.getElementById('lista-categorias');
    container.innerHTML = '<p class="empty-message">Carregando categorias...</p>';

    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const nomesModulo = { 'coffee': 'Coffee Break', 'transporte': 'Transportes', 'organizacao': 'Organização' };
    const iconesModulo = { 'coffee': '📦', 'transporte': '🚗', 'organizacao': '📋' };

    APIClient.listarCategorias()
        .then(categoriasBD => {
            container.innerHTML = '';

            if (!categoriasBD || categoriasBD.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhuma categoria encontrada para o módulo ${nomesModulo[moduloAtual] || 'Coffee Break'}.</p>`;
                return;
            }

            categoriasBD.forEach(cat => {
                const icone = cat.icone || (iconesModulo[moduloAtual] || '📦');
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <div class="item-header">
                        <span class="item-categoria">${icone} ${cat.nome}</span>
                        <span class="badge badge-info">${cat.natureza || 'Geral'}</span>
                    </div>
                    <div class="item-body">
                        <p style="font-size: 0.85rem; color: #666; margin-bottom: 5px;"><strong>ID:</strong> ${cat.tipo}</p>
                        <p style="font-size: 0.9rem; color: #333;">
                            ${cat.descricao || '<i>Sem descrição cadastrada.</i>'}
                        </p>
                    </div>
                    <div class="item-footer">
                        <button class="btn-small btn-secondary" onclick="editarCategoriaDB(${cat.id})">✏️ Editar</button>
                        <button class="btn-small btn-danger" onclick="removerCategoriaDB(${cat.id})">🗑️ Remover</button>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(erro => {
            console.error('Erro ao carregar categorias:', erro);
            container.innerHTML = `<p class="empty-message">❌ Erro: ${erro.message}</p>`;
        });
}

function mostrarModalNovaCategoria() {
    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const titulosModal = { 'coffee': 'Nova Categoria de Alimentação', 'transporte': 'Nova Modalidade de Transporte', 'organizacao': 'Nova Categoria de Organização' };
    const iconesModal = { 'coffee': '📦', 'transporte': '🚗', 'organizacao': '📋' };

    document.getElementById('modal-categoria-titulo').textContent = `🏷️ ${titulosModal[moduloAtual] || titulosModal['coffee']}`;
    document.getElementById('form-categoria').reset();
    document.getElementById('categoria-id').disabled = false;
    document.getElementById('container-itens-categoria').style.display = 'block';
    document.getElementById('categoria-icone').value = iconesModal[moduloAtual] || '📦';
    document.getElementById('modal-categoria').style.display = 'flex';
}

function editarCategoria(catId) {
    document.getElementById('modal-categoria-titulo').textContent = 'Editar Categoria';
    document.getElementById('categoria-id').value = catId;
    document.getElementById('categoria-id').disabled = true;

    const nomes = {
        'estrutura_e_espaco': 'Estrutura e Espaço',
        'equipamentos': 'Equipamentos',
        'materiais_de_apoio': 'Materiais de Apoio'
    };

    document.getElementById('categoria-nome').value = nomes[catId] || catId;
    document.getElementById('categoria-itens').value = categorias[catId].join('\n');
    document.getElementById('modal-categoria').style.display = 'flex';
}

function fecharModalCategoria() {
    document.getElementById('modal-categoria').style.display = 'none';
    document.getElementById('form-categoria').reset();
    document.getElementById('form-categoria').dataset.catIdBD = '';
    document.getElementById('categoria-id').disabled = false;
}

function removerCategoria(catId) {
    if (!confirm('Deseja realmente remover esta categoria?\n\nTodos os itens serão perdidos!')) return;

    delete categorias[catId];
    salvarCategoriasLocalStorage();
    renderizarCategorias();
}

function editarCategoriaDB(catId) {
    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const titulosEditar = { 'coffee': 'Editar Categoria', 'transporte': 'Editar Modalidade', 'organizacao': 'Editar Categoria' };
    const iconesEditar = { 'coffee': '📦', 'transporte': '🚗', 'organizacao': '📋' };

    fetch(`/api/categorias/${catId}`)
        .then(response => {
            if (!response.ok) throw new Error('Categoria não encontrada');
            return response.json();
        })
        .then(cat => {
            document.getElementById('modal-categoria-titulo').textContent = `✏️ ${titulosEditar[moduloAtual] || 'Editar Categoria'}`;
            document.getElementById('categoria-id').value = cat.tipo;
            document.getElementById('categoria-id').disabled = true;
            document.getElementById('categoria-nome').value = cat.nome;
            document.getElementById('categoria-icone').value = cat.icone || (iconesEditar[moduloAtual] || '📦');
            document.getElementById('categoria-natureza').value = cat.natureza || '';
            document.getElementById('categoria-descricao').value = cat.descricao || '';

            // Ocultar campo de itens iniciais na edição (melhor gerenciar pela aba de itens)
            document.getElementById('container-itens-categoria').style.display = 'none';

            document.getElementById('modal-categoria').style.display = 'flex';
            document.getElementById('form-categoria').dataset.catIdBD = catId;
        })
        .catch(erro => {
            console.error('Erro ao carregar categoria:', erro);
            alert('❌ Erro: ' + erro.message);
        });
}

function removerCategoriaDB(catId) {
    if (!confirm('Deseja realmente remover esta categoria do banco de dados?')) return;

    fetch(`/api/categorias/${catId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('✅ Categoria removida com sucesso!');
        renderizarCategorias();
    })
    .catch(erro => {
        console.error('Erro ao remover categoria:', erro);
        alert('❌ Erro ao remover categoria: ' + erro.message);
    });
}

function salvarCategoriasLocalStorage() {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

async function carregarCategoriasLocalStorage() {
    try {
        // Tentar carregar do backend
        const response = await fetch('/api/categorias');
        if (response.ok) {
            const categoriasBackend = await response.json();
            // Converter para formato esperado
            categoriasBackend.forEach(cat => {
                if (cat.nome && !categorias[cat.tipo]) {
                    categorias[cat.tipo] = []; // Será preenchido com itens
                }
            });
        }
    } catch (erro) {
        console.warn('Não foi possível carregar categorias do backend, usando localStorage', erro);
    }

    // Fallback: carregar do localStorage
    const saved = localStorage.getItem('categorias');
    if (saved) {
        try {
            const savedCats = JSON.parse(saved);
            Object.assign(categorias, savedCats);
        } catch (e) {
            console.error('Erro ao carregar categorias do localStorage:', e);
        }
    }
}
