// ========================================
// MÓDULO: EMITIR-OS - Emissão de Ordens de Serviço
// ========================================

async function renderizarEmitirOS() {
    // Carregar dados e grupos do módulo atual sempre que renderizar
    dadosAlimentacao = await APIClient.listarAlimentacao();
    await carregarGruposDropdown();

    // Inicializar signatários dinâmicos
    inicializarSignatarios();

    // ✅ CORRIGIR: Restaurar botões do formulário
    const containerBotoes = document.getElementById('botoes-formulario-os');
    if (containerBotoes) {
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
            <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
        `;
    }

    // Definir data de emissão padrão como hoje (apenas se não foi preenchida pela edição)
    const campoDataEmissao = document.getElementById('os-data-emissao');
    if (campoDataEmissao && !campoDataEmissao.value) {
        campoDataEmissao.value = new Date().toISOString().slice(0, 10);
    }

    // Verificar rascunho salvo — ignorar se estamos em modo edição
    // (restaurarOSParaEdicao irá preencher os campos com dados reais da OS)
    if (!localStorage.getItem('osEditandoId')) {
        _verificarRascunhoOS();
    }

    // Salvar rascunho imediatamente ao alterar qualquer campo do formulário
    const form = document.getElementById('form-emitir-os');
    if (form && !form._rascunhoListenerAdded) {
        form.addEventListener('input', salvarRascunhoOS);
        form._rascunhoListenerAdded = true;
    }
}

async function carregarGruposDropdown() {
    const grupoSelect = document.getElementById('os-grupo-select');
    if (!grupoSelect) return;

    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const cfg = getModuleConfig();

    // Atualizar labels estáticos do formulário conforme o módulo
    _atualizarLabelsFormulario(cfg);

    if (moduloAtual === 'organizacao') {
        // Para organização: 3 grupos fixos com nomes + dropdown de detentora
        const nomeGrupos = { 1: 'Capital/RMSP', 2: 'Interior', 3: 'Litoral' };
        grupoSelect.innerHTML = `<option value="">-- Selecione o ${cfg.grupoLabel} --</option>`;
        for (let g = 1; g <= 3; g++) {
            const option = document.createElement('option');
            option.value = g;
            option.textContent = `${cfg.grupoLabel} ${g} - ${nomeGrupos[g]}`;
            grupoSelect.appendChild(option);
        }
        // Mudar handler para carregar detentoras do grupo
        grupoSelect.onchange = function() { onGrupoOrganizacaoChange(this.value); };
        // Adicionar select de detentora se não existir
        _criarDropdownDetentora();
    } else {
        try {
            console.log('📡 [Emitir OS] Carregando grupos disponíveis...');
            const grupos = await APIClient.obterGruposDetentoras();

            grupoSelect.innerHTML = `<option value="">-- Selecione o ${cfg.grupoLabel} --</option>`;

            if (grupos && grupos.length > 0) {
                grupos.forEach(grupo => {
                    const option = document.createElement('option');
                    option.value = grupo;
                    option.textContent = `${cfg.grupoLabel} ${grupo}`;
                    grupoSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Nenhuma detentora cadastrada";
                grupoSelect.appendChild(option);
            }
            // Restaurar handler padrão
            grupoSelect.onchange = function() { carregarDadosDetentora(); };
        } catch (error) {
            console.error('❌ Erro ao carregar grupos:', error);
        }
    }
}

/**
 * Atualiza labels estáticos do formulário HTML conforme o módulo atual.
 * Chamado ao renderizar a aba "Emitir O.S." para refletir a terminologia correta.
 */
function _atualizarLabelsFormulario(cfg) {
    // Label do select de grupo/região
    const labelGrupoSelect = document.querySelector('label[for="os-grupo-select"]');
    if (labelGrupoSelect) {
        labelGrupoSelect.innerHTML = `
            🏢 Selecione o ${cfg.grupoLabel}/Região *
            <small style="display: block; color: #6c757d; font-weight: 400; margin-top: 5px;">
                Os dados do contrato serão preenchidos automaticamente
            </small>
        `;
    }

    // Label do campo Grupo (readonly, nos dados do contrato)
    const labelGrupo = document.querySelector('label[for="os-grupo"]');
    if (labelGrupo) {
        labelGrupo.innerHTML = `${cfg.grupoLabel} <small style="color: #6c757d;">(região do estoque)</small>`;
    }

    // Mostrar campo "Qtd. Pessoas Atendidas" somente para módulo organização
    const campoQtdPessoas = document.getElementById('campo-qtd-pessoas');
    if (campoQtdPessoas) {
        const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
        campoQtdPessoas.style.display = moduloAtual === 'organizacao' ? '' : 'none';
    }
}

function _criarDropdownDetentora() {
    // Verificar se já existe o select de detentora
    let detentoraSelect = document.getElementById('os-detentora-select');
    if (detentoraSelect) return;

    // Encontrar o container do campo detentora e substituir por select
    const detentoraInput = document.getElementById('os-detentora');
    if (!detentoraInput) return;
    const detentoraContainer = detentoraInput.parentElement;
    detentoraContainer.innerHTML = `
        <label for="os-detentora-select">Nome da Detentora *</label>
        <select id="os-detentora-select" required onchange="onDetentoraOrganizacaoChange(this.value)">
            <option value="">Selecione o Grupo primeiro</option>
        </select>
        <input type="hidden" id="os-detentora" value="">
    `;
}

async function onGrupoOrganizacaoChange(grupo) {
    const detentoraSelect = document.getElementById('os-detentora-select');
    if (!detentoraSelect) return;

    // Limpar campos de contrato
    ['os-contrato-num', 'os-data-assinatura', 'os-prazo-vigencia', 'os-cnpj', 'os-servico'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const hiddenDet = document.getElementById('os-detentora');
    if (hiddenDet) hiddenDet.value = '';

    // Atualizar campo oculto de grupo
    const grupoInput = document.getElementById('os-grupo');
    if (grupoInput) grupoInput.value = grupo || '';

    if (!grupo) {
        detentoraSelect.innerHTML = '<option value="">Selecione o Grupo primeiro</option>';
        return;
    }

    detentoraSelect.innerHTML = '<option value="">Carregando...</option>';

    try {
        const detentoras = await APIClient.listarDetentorasPorGrupo(grupo);
        detentoraSelect.innerHTML = '<option value="">Selecione a Detentora</option>';

        if (detentoras.length === 0) {
            detentoraSelect.innerHTML = '<option value="">Nenhuma detentora cadastrada para este grupo</option>';
            return;
        }

        detentoras.forEach(det => {
            const option = document.createElement('option');
            option.value = det.id;
            option.textContent = det.nome;
            option.setAttribute('data-contrato', det.contratoNum || '');
            option.setAttribute('data-data-assinatura', det.dataAssinatura || '');
            option.setAttribute('data-prazo', det.prazoVigencia || '');
            option.setAttribute('data-cnpj', det.cnpj || '');
            option.setAttribute('data-servico', det.servico || '');
            option.setAttribute('data-nome', det.nome || '');
            detentoraSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar detentoras:', error);
        detentoraSelect.innerHTML = '<option value="">Erro ao carregar detentoras</option>';
    }
}

function onDetentoraOrganizacaoChange(detentoraId) {
    const detentoraSelect = document.getElementById('os-detentora-select');
    if (!detentoraSelect || !detentoraId) return;

    const opt = detentoraSelect.options[detentoraSelect.selectedIndex];

    document.getElementById('os-contrato-num').value = opt.getAttribute('data-contrato') || '';
    document.getElementById('os-cnpj').value = opt.getAttribute('data-cnpj') || '';
    document.getElementById('os-servico').value = opt.getAttribute('data-servico') || '';
    document.getElementById('os-detentora').value = opt.getAttribute('data-nome') || '';

    const dataAss = opt.getAttribute('data-data-assinatura') || '';
    if (dataAss) {
        const inputData = document.getElementById('os-data-assinatura');
        if (dataAss.includes('/')) {
            const parts = dataAss.split('/');
            if (parts.length === 3) inputData.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
            inputData.value = dataAss;
        }
    }

    document.getElementById('os-prazo-vigencia').value = opt.getAttribute('data-prazo') || '';
}

// ========================================
// SELETOR DE ITENS EM LOTE (NOVO)
// ========================================

// itensOSSelecionados declarado em globals.js

function _calcularDisponivelItem(item, grupo) {
    const regiao = item.regioes && item.regioes[grupo];
    if (!regiao) return null;
    const parseQtd = v => parseFloat(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;
    return parseQtd(regiao.inicial) - parseQtd(regiao.gasto);
}

function _badgeEstoque(disponivel, unidade) {
    if (disponivel === null) return '';
    if (disponivel <= 0) {
        return `<span class="badge-estoque sem-estoque">Sem estoque</span>`;
    }
    const fmt = disponivel.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    return `<span class="badge-estoque com-estoque">Estoque: ${fmt} ${unidade || ''}</span>`;
}

function _validarQtdVsEstoque(inputQtd) {
    const row = inputQtd.closest('.seletor-item-row');
    const disponivel = parseFloat(row.getAttribute('data-disponivel'));
    if (isNaN(disponivel)) return;

    const cfgSeletor = getModuleConfig();
    const qtd = parseFloat(inputQtd.value) || 0;
    const diarias = cfgSeletor.usaDiarias
        ? (parseInt(row.querySelector('.seletor-diarias')?.value) || 1)
        : 1;
    const total = qtd * diarias;

    const aviso = row.querySelector('.aviso-estoque');
    if (total > disponivel && disponivel >= 0) {
        inputQtd.style.borderColor = '#dc3545';
        if (aviso) aviso.textContent = `⚠️ Excede estoque (disp: ${disponivel.toLocaleString('pt-BR', { maximumFractionDigits: 2 })})`;
    } else {
        inputQtd.style.borderColor = '';
        if (aviso) aviso.textContent = '';
    }
}

function abrirSeletorItens() {
    if (!dadosAlimentacao || Object.keys(dadosAlimentacao).length === 0) {
        alert('Nenhum item disponível. Verifique se há itens cadastrados para este módulo.');
        return;
    }

    const grupoAtual = document.getElementById('os-grupo')?.value || '1';

    const container = document.getElementById('seletor-categorias');
    container.innerHTML = '';

    const categorias = Object.keys(dadosAlimentacao).sort();

    categorias.forEach((cat, catIdx) => {
        const catData = dadosAlimentacao[cat];
        const catNome = formatarNomeCategoria(cat);
        const itens = catData.itens || [];

        // Quantos itens desta categoria já estão selecionados
        const selecionadosNaCat = itensOSSelecionados.filter(i => i.categoria === cat).length;

        const catDiv = document.createElement('div');
        catDiv.className = 'seletor-categoria';
        catDiv.setAttribute('data-cat', cat);

        let itensHtml = '';
        itens.forEach(item => {
            const jaSelecionado = itensOSSelecionados.some(i => i.itemId === item.id && i.categoria === cat);
            const itemExistente = jaSelecionado ? itensOSSelecionados.find(i => i.itemId === item.id && i.categoria === cat) : null;

            const disponivel = _calcularDisponivelItem(item, grupoAtual);
            const badge = _badgeEstoque(disponivel, item.unidade);
            const dispAttr = disponivel !== null ? `data-disponivel="${disponivel}"` : '';

            const cfgSeletor = getModuleConfig();
            itensHtml += `
                <div class="seletor-item-row ${jaSelecionado ? 'selecionado' : ''}" data-item-id="${item.id}" data-cat="${cat}" data-nome="${item.descricao.toLowerCase()}" ${dispAttr}>
                    <input type="checkbox" ${jaSelecionado ? 'checked' : ''} onchange="toggleItemSeletor(this)">
                    <span class="item-nome" onclick="this.previousElementSibling.click()">${item.descricao}</span>
                    <span class="item-unidade">${item.unidade || ''}</span>
                    ${badge}
                    ${cfgSeletor.usaDiarias ? `
                    <div class="seletor-campo">
                        <label>Diárias:</label>
                        <input type="number" class="seletor-diarias" min="1" value="${itemExistente ? itemExistente.diarias : 1}" placeholder="1" oninput="_validarQtdVsEstoque(this.closest('.seletor-item-row').querySelector('.seletor-qtd'))">
                    </div>` : '<input type="hidden" class="seletor-diarias" value="1">'}
                    <div class="seletor-campo">
                        <label>${cfgSeletor.colunaQtdCompacta}:</label>
                        <input type="number" class="seletor-qtd" min="0" step="any" value="${itemExistente ? itemExistente.qtdSolicitada : ''}" placeholder="0" oninput="_validarQtdVsEstoque(this)">
                    </div>
                    <span class="aviso-estoque"></span>
                </div>
            `;
        });

        catDiv.innerHTML = `
            <div class="seletor-cat-header" onclick="toggleCategoriaSeletor(this)">
                <span class="cat-toggle">▶</span>
                <span class="cat-nome">${catNome}</span>
                <span class="cat-contagem">${itens.length} itens</span>
                <span class="cat-badge ${selecionadosNaCat > 0 ? 'ativo' : ''}">${selecionadosNaCat}</span>
            </div>
            <div class="seletor-cat-itens">
                ${itensHtml}
            </div>
        `;

        container.appendChild(catDiv);
    });

    // Expandir a primeira categoria automaticamente
    if (container.firstChild) {
        const primeiroHeader = container.firstChild.querySelector('.seletor-cat-header');
        if (primeiroHeader) toggleCategoriaSeletor(primeiroHeader);
    }

    // Limpar busca
    document.getElementById('seletor-busca').value = '';
    atualizarContadorSeletor();

    document.getElementById('modal-seletor-itens').style.display = 'flex';
}

function fecharSeletorItens() {
    document.getElementById('modal-seletor-itens').style.display = 'none';
}

function toggleCategoriaSeletor(header) {
    const catDiv = header.parentElement;
    const itensDiv = catDiv.querySelector('.seletor-cat-itens');
    const toggle = header.querySelector('.cat-toggle');

    const isOpen = itensDiv.classList.contains('aberto');
    itensDiv.classList.toggle('aberto');
    toggle.classList.toggle('aberto');
}

function expandirTodasCategorias() {
    document.querySelectorAll('.seletor-cat-itens').forEach(el => el.classList.add('aberto'));
    document.querySelectorAll('.cat-toggle').forEach(el => el.classList.add('aberto'));
}

function recolherTodasCategorias() {
    document.querySelectorAll('.seletor-cat-itens').forEach(el => el.classList.remove('aberto'));
    document.querySelectorAll('.cat-toggle').forEach(el => el.classList.remove('aberto'));
}

function toggleItemSeletor(checkbox) {
    const row = checkbox.closest('.seletor-item-row');
    row.classList.toggle('selecionado', checkbox.checked);

    // Se marcou e não tem quantidade, focar no campo de quantidade
    if (checkbox.checked) {
        const qtdInput = row.querySelector('.seletor-qtd');
        if (!qtdInput.value || qtdInput.value === '0') {
            setTimeout(() => qtdInput.focus(), 50);
        }
    }

    atualizarContadorSeletor();
    atualizarBadgeCategoria(row.closest('.seletor-categoria'));
}

function atualizarContadorSeletor() {
    const total = document.querySelectorAll('#seletor-categorias .seletor-item-row input[type="checkbox"]:checked').length;
    document.getElementById('seletor-contador').textContent = `${total} ${total === 1 ? 'item selecionado' : 'itens selecionados'}`;
}

function atualizarBadgeCategoria(catDiv) {
    const checked = catDiv.querySelectorAll('.seletor-item-row input[type="checkbox"]:checked').length;
    const badge = catDiv.querySelector('.cat-badge');
    badge.textContent = checked;
    badge.classList.toggle('ativo', checked > 0);
}

function filtrarItensSeletor() {
    const busca = document.getElementById('seletor-busca').value.toLowerCase().trim();

    document.querySelectorAll('.seletor-item-row').forEach(row => {
        const nome = row.getAttribute('data-nome');
        const match = !busca || nome.includes(busca);
        row.classList.toggle('oculto', !match);
    });

    // Mostrar/ocultar categorias sem itens visíveis
    document.querySelectorAll('.seletor-categoria').forEach(catDiv => {
        const visíveis = catDiv.querySelectorAll('.seletor-item-row:not(.oculto)').length;
        catDiv.style.display = visíveis > 0 ? '' : 'none';

        // Expandir categorias com resultados na busca
        if (busca && visíveis > 0) {
            catDiv.querySelector('.seletor-cat-itens').classList.add('aberto');
            catDiv.querySelector('.cat-toggle').classList.add('aberto');
        }
    });
}

function confirmarSelecaoItens() {
    const rows = document.querySelectorAll('#seletor-categorias .seletor-item-row input[type="checkbox"]:checked');

    if (rows.length === 0) {
        alert('Selecione pelo menos um item.');
        return;
    }

    // Verificar que todos os itens marcados têm quantidade
    let faltaQtd = false;
    rows.forEach(cb => {
        const row = cb.closest('.seletor-item-row');
        const qtd = parseFloat(row.querySelector('.seletor-qtd').value) || 0;
        if (qtd <= 0) faltaQtd = true;
    });

    if (faltaQtd) {
        if (!confirm('Alguns itens selecionados estão sem quantidade. Deseja continuar? (itens sem quantidade serão ignorados)')) {
            return;
        }
    }

    // Coletar itens novos (que não estão já na lista)
    rows.forEach(cb => {
        const row = cb.closest('.seletor-item-row');
        const itemId = parseInt(row.getAttribute('data-item-id'));
        const cat = row.getAttribute('data-cat');
        const diarias = parseInt(row.querySelector('.seletor-diarias').value) || 1;
        const qtd = parseFloat(row.querySelector('.seletor-qtd').value) || 0;

        if (qtd <= 0) return; // Ignorar sem quantidade

        // Verificar se já existe na lista
        const existente = itensOSSelecionados.findIndex(i => i.itemId === itemId && i.categoria === cat);

        const catData = dadosAlimentacao[cat];
        const item = catData.itens.find(i => i.id === itemId);
        if (!item) return;

        if (existente >= 0) {
            // Atualizar quantidade e diárias
            itensOSSelecionados[existente].diarias = diarias;
            itensOSSelecionados[existente].qtdSolicitada = qtd;
            itensOSSelecionados[existente].qtdTotal = diarias * qtd;
        } else {
            // Adicionar novo
            itensOSSelecionados.push({
                categoria: cat,
                itemId: itemId,
                descricao: item.descricao,
                unidade: item.unidade || '',
                itemBec: item.natureza || catData.natureza || '',
                diarias: diarias,
                qtdSolicitada: qtd,
                qtdTotal: diarias * qtd
            });
        }
    });

    // Remover itens que foram desmarcados
    const idsNoSeletor = new Set();
    document.querySelectorAll('#seletor-categorias .seletor-item-row').forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        const itemId = parseInt(row.getAttribute('data-item-id'));
        const cat = row.getAttribute('data-cat');
        if (cb.checked) {
            idsNoSeletor.add(`${cat}:${itemId}`);
        }
    });

    itensOSSelecionados = itensOSSelecionados.filter(i => idsNoSeletor.has(`${i.categoria}:${i.itemId}`));

    renderizarTabelaItensOS();
    salvarRascunhoOS();
    fecharSeletorItens();
}

// ========================================
// TABELA COMPACTA DE ITENS
// ========================================

function renderizarTabelaItensOS() {
    const tbody = document.getElementById('itens-os');
    const msgVazio = document.getElementById('itens-os-vazio');
    const btnLimpar = document.getElementById('btn-limpar-itens');
    const tabela = document.getElementById('tabela-itens-os');
    const cfg = getModuleConfig();

    // Atualizar cabeçalho da tabela dinamicamente
    const thead = tabela.querySelector('thead tr');
    if (thead) {
        if (cfg.usaDiarias) {
            thead.innerHTML = `
                <th style="width: 35px;">#</th>
                <th>${cfg.descLabel === 'ESPECIFICAÇÃO' ? 'Especificação' : 'Descrição'}</th>
                <th style="width: 130px;">Categoria</th>
                <th style="width: 80px;">Diárias</th>
                <th style="width: 90px;">${cfg.colunaQtdCompacta}</th>
                <th style="width: 80px;">Total</th>
                <th style="width: 45px;"></th>
            `;
        } else {
            // Transporte: inclui colunas de trajeto por item
            thead.innerHTML = `
                <th style="width: 35px;">#</th>
                <th>${cfg.descLabel === 'ESPECIFICAÇÃO' ? 'Especificação' : 'Descrição'}</th>
                <th style="width: 130px;">Categoria</th>
                <th style="width: 100px;">${cfg.colunaQtdCompacta}</th>
                <th style="width: 140px;">Origem</th>
                <th style="width: 140px;">Destino</th>
                <th style="width: 90px;">Ida/Volta</th>
                <th style="width: 75px;" title="➕ duplicar linha | ✕ remover"></th>
            `;
        }
    }

    tbody.innerHTML = '';

    if (itensOSSelecionados.length === 0) {
        msgVazio.style.display = 'block';
        tabela.style.display = 'none';
        if (btnLimpar) btnLimpar.style.display = 'none';
        return;
    }

    msgVazio.style.display = 'none';
    tabela.style.display = 'table';
    if (btnLimpar) btnLimpar.style.display = '';

    itensOSSelecionados.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-idx', idx);

        const total = (item.diarias || 1) * (item.qtdSolicitada || 0);
        item.qtdTotal = total;

        if (cfg.usaDiarias) {
            tr.innerHTML = `
                <td style="text-align: center; color: #888;">${idx + 1}</td>
                <td class="item-descricao">${item.descricao}</td>
                <td class="item-categoria">${formatarNomeCategoria(item.categoria)}</td>
                <td><input type="number" value="${item.diarias}" min="1" oninput="atualizarItemTabela(${idx}, 'diarias', this.value)"></td>
                <td><input type="number" value="${item.qtdSolicitada}" min="0" step="any" oninput="atualizarItemTabela(${idx}, 'qtd', this.value)"></td>
                <td class="td-total">${total}</td>
                <td><button type="button" class="btn-remover-item" onclick="removerItemOS(${idx})" title="Remover item">✕</button></td>
            `;
        } else {
            // Transporte: sem diárias, com campos de trajeto por item
            const origem = item.trajetoOrigem || '';
            const destino = item.trajetoDestino || '';
            const tipo = item.trajetoTipo || '';
            tr.innerHTML = `
                <td style="text-align: center; color: #888;">${idx + 1}</td>
                <td class="item-descricao">${item.descricao}</td>
                <td class="item-categoria">${formatarNomeCategoria(item.categoria)}</td>
                <td><input type="number" value="${item.qtdSolicitada}" min="0" step="any" oninput="atualizarItemTabela(${idx}, 'qtd', this.value)" style="width:90px;"></td>
                <td><input type="text" value="${origem}" placeholder="Cidade origem" maxlength="100"
                    oninput="atualizarItemTabela(${idx}, 'trajetoOrigem', this.value)"
                    style="width:130px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:.85rem;"></td>
                <td><input type="text" value="${destino}" placeholder="Cidade destino" maxlength="100"
                    oninput="atualizarItemTabela(${idx}, 'trajetoDestino', this.value)"
                    style="width:130px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:.85rem;"></td>
                <td><select onchange="atualizarItemTabela(${idx}, 'trajetoTipo', this.value)"
                    style="padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:.85rem;">
                    <option value="" ${tipo === '' ? 'selected' : ''}>—</option>
                    <option value="ida" ${tipo === 'ida' ? 'selected' : ''}>Ida</option>
                    <option value="volta" ${tipo === 'volta' ? 'selected' : ''}>Volta</option>
                </select></td>
                <td style="white-space:nowrap;">
                    <button type="button" title="Adicionar mesma linha com trajeto diferente"
                        onclick="duplicarItemTransporte(${idx})"
                        style="background:#1565c0;color:#fff;border:none;border-radius:4px;padding:3px 7px;font-size:1rem;cursor:pointer;margin-right:3px;">➕</button>
                    <button type="button" class="btn-remover-item" onclick="removerItemOS(${idx})" title="Remover item">✕</button>
                </td>
            `;
        }

        tbody.appendChild(tr);
    });
}

function atualizarItemTabela(idx, campo, valor) {
    if (idx < 0 || idx >= itensOSSelecionados.length) return;

    if (campo === 'diarias') {
        itensOSSelecionados[idx].diarias = parseInt(valor) || 1;
    } else if (campo === 'qtd') {
        itensOSSelecionados[idx].qtdSolicitada = parseFloat(valor) || 0;
    } else if (campo === 'trajetoOrigem') {
        itensOSSelecionados[idx].trajetoOrigem = valor;
    } else if (campo === 'trajetoDestino') {
        itensOSSelecionados[idx].trajetoDestino = valor;
    } else if (campo === 'trajetoTipo') {
        itensOSSelecionados[idx].trajetoTipo = valor;
    }

    // Recalcular total
    const item = itensOSSelecionados[idx];
    item.qtdTotal = (item.diarias || 1) * (item.qtdSolicitada || 0);

    // Atualizar célula de total na tabela
    const tr = document.querySelector(`#itens-os tr[data-idx="${idx}"]`);
    if (tr) {
        const totalCell = tr.querySelector('.td-total');
        if (totalCell) totalCell.textContent = item.qtdTotal;
    }
}

function removerItemOS(idx) {
    itensOSSelecionados.splice(idx, 1);
    renderizarTabelaItensOS();
}

function duplicarItemTransporte(idx) {
    const original = itensOSSelecionados[idx];
    if (!original) return;

    // Inverter automaticamente origem/destino e ida/volta como sugestão
    const novoTipo = original.trajetoTipo === 'ida' ? 'volta'
                   : original.trajetoTipo === 'volta' ? 'ida'
                   : '';

    const novaLinha = {
        categoria: original.categoria,
        itemId: original.itemId,
        descricao: original.descricao,
        unidade: original.unidade,
        itemBec: original.itemBec,
        valorUnit: original.valorUnit,
        diarias: original.diarias,
        qtdSolicitada: original.qtdSolicitada,
        qtdTotal: original.qtdTotal,
        // Inverter trajeto como sugestão
        trajetoOrigem: original.trajetoDestino || '',
        trajetoDestino: original.trajetoOrigem || '',
        trajetoTipo: novoTipo,
    };

    // Inserir logo abaixo da linha original
    itensOSSelecionados.splice(idx + 1, 0, novaLinha);
    renderizarTabelaItensOS();
}

function limparTodosItensOS() {
    if (itensOSSelecionados.length === 0) return;
    if (!confirm(`Remover todos os ${itensOSSelecionados.length} itens?`)) return;
    itensOSSelecionados = [];
    renderizarTabelaItensOS();
}

// Manter compatibilidade: adicionar avulso (modo antigo simplificado)
function adicionarItemOS() {
    if (!dadosAlimentacao || Object.keys(dadosAlimentacao).length === 0) {
        alert('Nenhum item disponível. Verifique o módulo selecionado.');
        return;
    }
    // Abrir o seletor diretamente como forma principal
    abrirSeletorItens();
}

async function visualizarOS() {
    const form = document.getElementById('form-emitir-os');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;

    // 🔍 DEBUG: Verificar dados coletados
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DEBUG visualizarOS() - Dados coletados do formulário:');
    console.log('='.repeat(60));
    console.log('Total de itens:', dadosOS.itens.length);
    dadosOS.itens.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log('  Descrição:', item.descricao);
        console.log('  Diárias:', item.diarias, typeof item.diarias);
        console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
        console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
    });
    console.log('='.repeat(60) + '\n');

    // 🔢 Buscar próximo número do backend se for nova O.S. (sequência por módulo+grupo)
    if (!osEditandoId) {
        try {
            const moduloAtualOS = localStorage.getItem('modulo_atual') || 'coffee';
            const grupoSelect = document.getElementById('os-grupo-select');
            const grupoAtualOS = grupoSelect ? grupoSelect.value : (document.getElementById('os-grupo')?.value || '');
            const params = new URLSearchParams({ modulo: moduloAtualOS });
            if (grupoAtualOS) params.append('grupo', grupoAtualOS);
            const response = await fetch(`/api/ordens-servico/proximo-numero?${params}`);
            const data = await response.json();
            dadosOS.numeroOS = data.proximoNumero;
            console.log('🔢 Próximo número obtido do backend:', dadosOS.numeroOS);
        } catch (error) {
            console.error('❌ Erro ao buscar próximo número:', error);
            alert('Erro ao buscar número da O.S. Verifique a conexão com o servidor.');
            return;
        }
    }

    const preview = gerarPreviewOS(dadosOS);
    document.getElementById('preview-os').innerHTML = preview;
    document.getElementById('modal-visualizar-os').style.display = 'flex';
}

function fecharModalVisualizarOS() {
    const modal = document.getElementById('modal-visualizar-os');
    modal.style.display = 'none';

    // Limpar conteúdo para evitar exibir dados antigos na próxima abertura
    const preview = document.getElementById('preview-os');
    if (preview) {
        preview.innerHTML = '<p style="text-align: center; padding: 20px;">Carregando...</p>';
    }
}

function coletarDadosOS() {
    // Construir itens a partir do array global itensOSSelecionados
    const grupoSelect = document.getElementById('os-grupo-select');
    const grupo = grupoSelect ? grupoSelect.value : document.getElementById('os-grupo').value || '1';

    const itensOS = itensOSSelecionados.map((sel, index) => {
        const catData = dadosAlimentacao[sel.categoria];
        const item = catData ? catData.itens.find(i => i.id === sel.itemId) : null;

        // Buscar preço da região
        let valorUnit = 0;
        if (item && item.regioes && item.regioes[grupo]) {
            const precoOriginal = item.regioes[grupo].preco;
            if (precoOriginal !== undefined && precoOriginal !== null) {
                try {
                    const precoStr = typeof precoOriginal === 'number'
                        ? precoOriginal.toString()
                        : String(precoOriginal).includes(',')
                            ? String(precoOriginal).replace(/\./g, '').replace(',', '.')
                            : String(precoOriginal);
                    valorUnit = parseFloat(precoStr) || 0;
                } catch (e) {
                    valorUnit = 0;
                }
            }
        }

        return {
            num: index + 1,
            descricao: sel.descricao,
            unidade: sel.unidade,
            itemBec: sel.itemBec,
            diarias: sel.diarias,
            qtdSolicitada: sel.qtdSolicitada,
            qtdTotal: sel.qtdTotal,
            valorUnit: valorUnit,
            categoria: sel.categoria,
            itemId: sel.itemId,
            trajetoOrigem: sel.trajetoOrigem || null,
            trajetoDestino: sel.trajetoDestino || null,
            trajetoTipo: sel.trajetoTipo || null,
        };
    });

    if (itensOS.length === 0) {
        alert('Adicione pelo menos um item à O.S.');
        return null;
    }

    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';

    return {
        modulo: moduloAtual,
        servico: document.getElementById('os-servico').value || (moduloAtual === 'transporte' ? 'TRANSPORTE' : moduloAtual === 'organizacao' ? 'ORGANIZAÇÃO DE EVENTOS' : moduloAtual === 'hospedagem' ? 'HOSPEDAGEM' : 'COFFEE BREAK'),
        contratoNum: document.getElementById('os-contrato-num').value,
        dataAssinatura: document.getElementById('os-data-assinatura').value,
        prazoVigencia: document.getElementById('os-prazo-vigencia').value,
        detentora: document.getElementById('os-detentora').value,
        cnpj: document.getElementById('os-cnpj').value,
        servico: document.getElementById('os-servico').value,
        grupo: document.getElementById('os-grupo').value,
        evento: document.getElementById('os-evento').value,
        dataEvento: document.getElementById('os-data-evento').value,
        horario: document.getElementById('os-horario').value,
        local: document.getElementById('os-local').value,
        justificativa: document.getElementById('os-justificativa').value,
        observacoes: document.getElementById('os-observacoes').value,
        qtdPessoasAtendidas: (() => {
            const v = document.getElementById('os-qtd-pessoas')?.value;
            return (v && parseInt(v) > 0) ? parseInt(v) : null;
        })(),
        signatarios: signatariosOS.filter(s => s.nome.trim() !== ''),
        gestor: signatariosOS[0]?.nome || '',
        fiscal: signatariosOS[1]?.nome || '',
        fiscalTipo: signatariosOS[1]?.cargo || 'Fiscal do Contrato',
        responsavel: document.getElementById('os-responsavel').value,
        itens: itensOS,
        dataEmissao: (() => {
            const v = document.getElementById('os-data-emissao')?.value;
            if (v && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = v.split('-');
                return `${d}/${m}/${y}`;
            }
            return new Date().toLocaleDateString('pt-BR');
        })(),
        numeroOS: `${proximoIdOS}/2025`
    };
}

function gerarPreviewOS(dados) {
    // Usa o módulo dos dados da OS (para visualização de OS salvas) ou o módulo atual
    const modulo = dados.modulo || localStorage.getItem('modulo_atual') || 'coffee';
    const cfg = MODULE_CONFIG[modulo] || MODULE_CONFIG.coffee;

    // Garantir que valorUnit seja número para todos os itens
    const valorTotal = dados.itens.reduce((sum, item) => {
        const valor = parseFloat(item.valorUnit) || 0;
        const qtd = parseFloat(item.qtdTotal) || 0;
        return sum + (valor * qtd);
    }, 0);

    console.log('💰 gerarPreviewOS - Cálculo do valor total:');
    console.log('   - Itens:', dados.itens.length);
    dados.itens.forEach((item, idx) => {
        const valor = parseFloat(item.valorUnit) || 0;
        const qtd = parseFloat(item.qtdTotal) || 0;
        const subTotal = valor * qtd;
        console.log(`   Item ${idx + 1}: R$ ${valor.toFixed(2)} × ${qtd} = R$ ${subTotal.toFixed(2)}`);
    });
    console.log('   - TOTAL FINAL: R$', valorTotal.toFixed(2));

    return `
        <div class="os-document">
            <div class="os-header">
                <img src="/static/timbrado.png" alt="Logo" class="os-logo-img">
                <div class="os-title">
                    <h2>GOVERNO DO ESTADO DE SÃO PAULO</h2>
                    <h3>SECRETARIA DE ESTADO DA EDUCAÇÃO</h3>
                    <h3>COORDENADORIA GERAL DE SUPORTE ADMINISTRATIVO</h3>
                    <h2 style="margin-top: 10px;">ORDEM DE SERVIÇO</h2>
                </div>
                <div class="os-info-box">
                    <div>DATA DE EMISSÃO:</div>
                    <div><strong>${dados.dataEmissao}</strong></div>
                    <div style="margin-top: 5px;">NÚMERO:</div>
                    <div><strong>${dados.numeroOS}</strong></div>
                </div>
            </div>

            <div class="os-section">
                <table class="os-table">
                    <tr>
                        <td style="width: 30%;"><strong>CONTRATO Nº:</strong></td>
                        <td>${dados.contratoNum || ''}</td>
                        <td style="width: 30%;"><strong>DATA ASSINATURA:</strong></td>
                        <td>${dados.dataAssinatura || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>DETENTORA:</strong></td>
                        <td colspan="3">${dados.detentora}</td>
                    </tr>
                    <tr>
                        <td><strong>SERVIÇO:</strong></td>
                        <td>${dados.servico || ({'transporte':'TRANSPORTE','organizacao':'ORGANIZAÇÃO DE EVENTOS','hospedagem':'HOSPEDAGEM'}[localStorage.getItem('modulo_atual')] || 'COFFEE BREAK')}</td>
                        <td><strong>PRAZO VIGÊNCIA:</strong></td>
                        <td>${dados.prazoVigencia || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>CNPJ:</strong></td>
                        <td>${dados.cnpj}</td>
                        <td><strong>${cfg.grupoLabelUpper}:</strong></td>
                        <td>${dados.grupo || ''}</td>
                    </tr>
                </table>
            </div>

            <div class="os-section">
                <table class="os-table">
                    <tr>
                        <td style="width: 30%;"><strong>EVENTO:</strong></td>
                        <td colspan="3">${dados.evento}</td>
                    </tr>
                    <tr>
                        <td><strong>${cfg.osDataLabel}:</strong></td>
                        <td colspan="3">${dados.dataEvento}</td>
                    </tr>
                    <tr>
                        <td><strong>${cfg.osHorarioLabel}:</strong></td>
                        <td colspan="3">${dados.horario || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>${cfg.osLocalLabel}:</strong></td>
                        <td colspan="3">${dados.local}</td>
                    </tr>
                    <tr>
                        <td><strong>RESPONSÁVEL:</strong></td>
                        <td colspan="3">${dados.responsavel || ''}</td>
                    </tr>
                </table>
            </div>

            <div class="os-section">
                <table class="os-items-table">
                    <thead>
                        <tr style="background-color: #c6e0b4;">
                            <th style="width: 5%;">Nº</th>
                            <th style="width: ${cfg.usaDiarias ? '25' : '35'}%;">${cfg.descLabel}</th>
                            <th style="width: 10%;">${cfg.itemCodeLabelUpper}</th>
                            ${cfg.usaDiarias ? '<th style="width: 8%;">DIÁRIAS</th>' : ''}
                            <th style="width: ${cfg.usaDiarias ? '10' : '15'}%;">${cfg.colunaQtd}</th>
                            ${cfg.colunaQtdTotal ? `<th style="width: 12%;">${cfg.colunaQtdTotal}</th>` : ''}
                            <th style="width: 15%;">${cfg.colunaValorUnit}</th>
                            <th style="width: 15%;">VALOR<br/>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.itens.map(item => {
                            const diarias = parseInt(item.diarias) || 1;
                            const qtdTotal = parseFloat(item.qtdTotal) || 0;
                            const qtdSolicitada = parseFloat(item.qtdSolicitada) || (qtdTotal / diarias);
                            const valorUnit = parseFloat(item.valorUnit) || 0;
                            const valorTotalItem = valorUnit * qtdTotal;

                            // Formatar números com separador de milhares
                            const qtdSolFmt = qtdSolicitada.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 3});
                            const qtdTotalFmt = qtdTotal.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 3});
                            const valorUnitFmt = valorUnit.toFixed(2).replace('.', ',');
                            const valorTotalFmt = valorTotalItem.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

                            return `
                            <tr style="background-color: #e2efd9;">
                                <td style="text-align: center;">${item.num}</td>
                                <td style="text-align: left; padding-left: 8px;">${item.descricao}</td>
                                <td style="text-align: center;">${item.itemBec || ''}</td>
                                ${cfg.usaDiarias ? `<td style="text-align: center;">${diarias}</td>` : ''}
                                <td style="text-align: right; padding-right: 8px;">${cfg.usaDiarias ? qtdSolFmt : qtdTotalFmt}</td>
                                ${cfg.colunaQtdTotal ? `<td style="text-align: right; padding-right: 8px;">${qtdTotalFmt}</td>` : ''}
                                <td style="text-align: right; padding-right: 8px;">R$ ${valorUnitFmt}</td>
                                <td style="text-align: right; padding-right: 8px;">R$ ${valorTotalFmt}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #c6e0b4;">
                            <td colspan="${cfg.usaDiarias ? (cfg.colunaQtdTotal ? 7 : 6) : (cfg.colunaQtdTotal ? 6 : 5)}" style="text-align: right; padding-right: 8px;"><strong>VALOR TOTAL:</strong></td>
                            <td style="text-align: right; padding-right: 8px;"><strong>R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="os-section">
                <p style="margin: 5px 0;"><strong>JUSTIFICATIVA:</strong></p>
                <div class="os-justificativa">${(dados.justificativa || '').replace(/\n/g, '<br>')}</div>
            </div>

            ${dados.observacoes ? `
            <div class="os-section">
                <p style="margin: 5px 0;"><strong>OBSERVAÇÕES:</strong></p>
                <div class="os-justificativa">${dados.observacoes.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            <div class="os-footer">
                <p style="text-align: center; margin-bottom: 20px;">São Paulo, ${formatarDataExtenso(dados.dataEmissao)}.</p>
                ${gerarSignatariosPreview(dados)}
            </div>
        </div>
    `;
}

// Formulário de Emissão de O.S.
document.getElementById('form-emitir-os').addEventListener('submit', function(e) {
    e.preventDefault();
    visualizarOS();
});

async function confirmarEmissaoOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;

    console.log('🔍 confirmarEmissaoOS - Modo:', osEditandoId ? 'EDIÇÃO' : 'CRIAÇÃO');
    console.log('📋 osEditandoId:', osEditandoId);

    // 🔍 DEBUG: Verificar dados ANTES do mapeamento
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DEBUG confirmarEmissaoOS() - ANTES do mapeamento:');
    console.log('='.repeat(60));
    dadosOS.itens.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log('  Descrição:', item.descricao);
        console.log('  Diárias:', item.diarias, typeof item.diarias);
        console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
        console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
    });
    console.log('='.repeat(60) + '\n');

    try {
        // Mapear dados para o formato esperado pela API
        const dadosAPI = {
            numeroOS: dadosOS.numeroOS,
            contrato: dadosOS.contratoNum,
            dataAssinatura: dadosOS.dataAssinatura,
            prazoVigencia: dadosOS.prazoVigencia,
            detentora: dadosOS.detentora,
            cnpj: dadosOS.cnpj,
            servico: dadosOS.servico,
            grupo: dadosOS.grupo,
            evento: dadosOS.evento,
            data: dadosOS.dataEvento,
            horario: dadosOS.horario,
            local: dadosOS.local,
            justificativa: dadosOS.justificativa,
            observacoes: dadosOS.observacoes,
            qtdPessoasAtendidas: dadosOS.qtdPessoasAtendidas || null,
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            fiscalTipo: dadosOS.fiscalTipo,
            signatarios: dadosOS.signatarios,
            responsavel: dadosOS.responsavel,
            dataEmissao: dadosOS.dataEmissao,
            modulo: localStorage.getItem('modulo_atual') || 'coffee',
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                diarias: item.diarias,
                qtdSolicitada: item.qtdSolicitada,
                qtdTotal: item.qtdTotal,
                valorUnit: item.valorUnit,
                trajetoOrigem: item.trajetoOrigem || null,
                trajetoDestino: item.trajetoDestino || null,
                trajetoTipo: item.trajetoTipo || null,
            }))
        };

        // 🔍 DEBUG: Verificar dados DEPOIS do mapeamento
        console.log('\n' + '='.repeat(60));
        console.log('🔍 DEBUG confirmarEmissaoOS() - DEPOIS do mapeamento (dadosAPI):');
        console.log('='.repeat(60));
        dadosAPI.itens.forEach((item, idx) => {
            console.log(`\nItem ${idx + 1}:`);
            console.log('  Descrição:', item.descricao);
            console.log('  Diárias:', item.diarias, typeof item.diarias);
            console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
            console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
        });
        console.log('='.repeat(60) + '\n');

        console.log('🚀 Dados para enviar à API:', dadosAPI);

        // Verificar se é criação ou atualização
        const eraEdicao = !!osEditandoId; // Guardar estado antes de zerar

        if (osEditandoId) {
            // Atualizar O.S. existente (chamado pelo modal de visualização)
            console.log(`📡 Enviando PUT para /api/ordens-servico/${osEditandoId}`);
            const osAtualizada = await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
            console.log('✅ Resposta da API:', osAtualizada);
            alert('O.S. atualizada com sucesso! Estoque recalculado.');

            // Limpar estado de edição
            osEditandoId = null;

            // Restaurar botões originais
            const containerBotoes = document.getElementById('botoes-formulario-os');
            containerBotoes.innerHTML = `
                <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
                <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
            `;
        } else {
            // Criar nova O.S.
            const novaOS = await APIClient.criarOrdemServico(dadosAPI);
            alert('O.S. emitida com sucesso! Estoque atualizado.');
        }

        // Salvo com sucesso: não avisar "alterações não salvas" ao redirecionar
        if (typeof marcarFormularioSalvo === 'function') marcarFormularioSalvo();

        // Limpar formulário e fechar modal
        descartarRascunhoOS();
        document.getElementById('form-emitir-os').reset();
        itensOSSelecionados = [];
        renderizarTabelaItensOS();
        limparCamposDetentora(); // Limpar campos da Detentora também

        // Recarregar dados ANTES de fechar modal
        console.log('🔄 Recarregando alimentação...');
        await renderizarAlimentacao();
        console.log('🔄 Recarregando lista de O.S. do banco...');
        await renderizarOrdensServico();
        console.log('✅ Listas recarregadas com dados atualizados do banco!');

        // Agora sim fechar modal
        fecharModalVisualizarOS();
        renderizarEmitirOS();

        // Se criou nova O.S. (não edição), redirecionar para página de O.S.
        if (!eraEdicao) {
            console.log('📂 Nova O.S. criada - redirecionando para lista de Ordens de Serviço');
            // Pequeno delay para garantir que o formulário foi limpo antes de redirecionar
            setTimeout(() => {
                window.location.href = '/ordens-servico';
            }, 100);
        }

    } catch (error) {
        console.error('❌ Erro ao emitir O.S.:', error);
        alert('Erro ao emitir O.S.: ' + error.message);
    }
}

// ========================================
// SIGNATÁRIOS DINÂMICOS
// ========================================

function inicializarSignatarios() {
    // Se já tem signatários (modo edição), apenas renderizar
    if (signatariosOS.length > 0) {
        renderizarSignatarios();
        return;
    }
    // Default: 2 linhas (Gestor + Fiscal)
    signatariosOS = [
        { cargo: 'Gestor do Contrato', nome: '' },
        { cargo: 'Fiscal do Contrato', nome: '' }
    ];
    renderizarSignatarios();
}

function renderizarSignatarios() {
    const container = document.getElementById('signatarios-container');
    if (!container) return;

    container.innerHTML = '';
    signatariosOS.forEach((sig, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 6px;';

        const removivel = signatariosOS.length > 2;

        row.innerHTML = `
            <input type="text" list="lista-cargos-signatario" value="${sig.cargo}"
                   placeholder="Cargo" style="flex: 1; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px;"
                   onchange="atualizarSignatario(${idx}, 'cargo', this.value)">
            <input type="text" list="lista-nomes-signatario" value="${sig.nome}"
                   placeholder="Nome completo" style="flex: 1.5; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px;"
                   onchange="atualizarSignatario(${idx}, 'nome', this.value)"
                   oninput="atualizarSignatario(${idx}, 'nome', this.value)">
            ${removivel ? `<button type="button" onclick="removerSignatario(${idx})" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 6px 10px; cursor: pointer;" title="Remover">✕</button>` : '<div style="width: 34px;"></div>'}
        `;
        container.appendChild(row);
    });
}

function adicionarSignatario() {
    signatariosOS.push({ cargo: '', nome: '' });
    renderizarSignatarios();
}

function removerSignatario(index) {
    if (signatariosOS.length <= 2) return;
    signatariosOS.splice(index, 1);
    renderizarSignatarios();
}

function atualizarSignatario(index, campo, valor) {
    if (signatariosOS[index]) {
        signatariosOS[index][campo] = valor;
    }
}

function gerarSignatariosPreview(dados) {
    const sigs = dados.signatarios || [];
    if (sigs.length === 0) return '';

    // Montar linhas de 2 em 2
    let html = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; margin-top: 10px;">';
    sigs.forEach(sig => {
        html += `
            <div style="text-align: center; min-width: 200px; flex: 1; max-width: 45%;">
                <div style="border-bottom: 1px solid #000; width: 100%; margin-bottom: 4px;">&nbsp;</div>
                <div style="font-weight: bold; font-size: 11px;">${sig.nome}</div>
                <div style="font-size: 10px;">${sig.cargo}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ========================================
// RASCUNHO AUTOMÁTICO
// ========================================

let _autoSaveTimer = null;
let _rascunhoPendente = null;

function _chaveRascunho() {
    const modulo = localStorage.getItem('modulo_atual') || 'coffee';
    return `rascunho_os_${modulo}`;
}

function salvarRascunhoOS() {
    const campos = {};
    const ids = [
        'os-contrato-num', 'os-data-assinatura', 'os-prazo-vigencia',
        'os-detentora', 'os-cnpj', 'os-servico', 'os-grupo',
        'os-evento', 'os-data-evento', 'os-horario', 'os-local',
        'os-justificativa', 'os-observacoes', 'os-responsavel', 'os-qtd-pessoas'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) campos[id] = el.value;
    });

    const grupoSelect = document.getElementById('os-grupo-select');
    if (grupoSelect) campos['os-grupo-select'] = grupoSelect.value;

    const detentoraSelectEl = document.getElementById('os-detentora-select');
    if (detentoraSelectEl) campos['os-detentora-select'] = detentoraSelectEl.value;

    const rascunho = {
        timestamp: Date.now(),
        campos,
        itens: itensOSSelecionados,
        signatarios: signatariosOS
    };

    try {
        localStorage.setItem(_chaveRascunho(), JSON.stringify(rascunho));
    } catch (e) {
        // localStorage cheio — ignorar silenciosamente
    }
}

function descartarRascunhoOS() {
    localStorage.removeItem(_chaveRascunho());
    if (_autoSaveTimer) {
        clearInterval(_autoSaveTimer);
        _autoSaveTimer = null;
    }
    const banner = document.getElementById('banner-rascunho');
    if (banner) banner.remove();
}

function _iniciarAutoSave() {
    if (_autoSaveTimer) clearInterval(_autoSaveTimer);
    _autoSaveTimer = setInterval(salvarRascunhoOS, 30000);
}

function _restaurarCamposRascunho(campos) {
    Object.entries(campos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.value = valor;
    });
}

async function _aplicarRascunho(rascunho) {
    const banner = document.getElementById('banner-rascunho');
    if (banner) banner.remove();

    // Restaurar campos salvos primeiro (os campos de detentora virão do evento change abaixo)
    _restaurarCamposRascunho(rascunho.campos);

    // Disparar mudança de grupo DEPOIS de restaurar campos:
    // carregarDadosDetentora() (ou onGrupoOrganizacaoChange) escreve por último,
    // sobrescrevendo corretamente quaisquer valores de detentora desatualizados no rascunho.
    if (rascunho.campos['os-grupo-select']) {
        const grupoSelect = document.getElementById('os-grupo-select');
        if (grupoSelect) {
            grupoSelect.value = rascunho.campos['os-grupo-select'];
            grupoSelect.dispatchEvent(new Event('change'));

            // Para organizacao: aguardar a lista de detentoras carregar e re-selecionar
            const detentoraSelect = document.getElementById('os-detentora-select');
            if (detentoraSelect && rascunho.campos['os-detentora-select']) {
                await new Promise(r => setTimeout(r, 500));
                detentoraSelect.value = rascunho.campos['os-detentora-select'];
                if (detentoraSelect.value) {
                    onDetentoraOrganizacaoChange(detentoraSelect.value);
                }
            }
        }
    }

    itensOSSelecionados = rascunho.itens || [];
    renderizarTabelaItensOS();

    if (rascunho.signatarios && rascunho.signatarios.length > 0) {
        signatariosOS = rascunho.signatarios;
        renderizarSignatarios();
    }

    _iniciarAutoSave();
}

function _verificarRascunhoOS() {
    // Limpar itens de estado anterior
    itensOSSelecionados = [];
    renderizarTabelaItensOS();

    const raw = localStorage.getItem(_chaveRascunho());
    if (!raw) {
        _iniciarAutoSave();
        return;
    }

    let rascunho;
    try { rascunho = JSON.parse(raw); } catch (e) {
        localStorage.removeItem(_chaveRascunho());
        _iniciarAutoSave();
        return;
    }

    // Ignorar rascunhos vazios (sem itens e sem campos preenchidos)
    const temItens = rascunho.itens && rascunho.itens.length > 0;
    const temCampos = rascunho.campos && Object.values(rascunho.campos).some(v => v && v.trim && v.trim() !== '');
    if (!temItens && !temCampos) {
        localStorage.removeItem(_chaveRascunho());
        _iniciarAutoSave();
        return;
    }

    _rascunhoPendente = rascunho;

    const data = new Date(rascunho.timestamp).toLocaleString('pt-BR');
    const nItens = (rascunho.itens || []).length;

    const banner = document.createElement('div');
    banner.id = 'banner-rascunho';
    banner.innerHTML = `
        <span>📝 Rascunho salvo em ${data} — ${nItens} ${nItens === 1 ? 'item' : 'itens'}</span>
        <div style="display:flex;gap:8px;">
            <button type="button" class="btn-small btn-primary" onclick="_aplicarRascunho(_rascunhoPendente)">Restaurar</button>
            <button type="button" class="btn-small btn-secondary" onclick="descartarRascunhoOS()">Descartar</button>
        </div>
    `;

    const section = document.getElementById('tab-emitir-os');
    const anchor = section || document.getElementById('form-emitir-os')?.parentElement;
    if (anchor) anchor.insertBefore(banner, anchor.firstChild);

    _iniciarAutoSave();
}
