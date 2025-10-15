// TRECHO CORRIGIDO - SUBSTITUIR NO app.js a partir da linha 1355

        // Substituir botões do formulário pelo padrão de edição
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="visualizarOS()">👁️ Visualizar</button>
            <button type="button" class="btn btn-success" onclick="salvarEFecharOS()">💾 Salvar e Fechar</button>
            <button type="button" class="btn btn-warning" onclick="salvarEContinuarOS()">💾 Salvar e Continuar</button>
            <button type="button" class="btn btn-danger" onclick="cancelarEdicaoOS()">❌ Cancelar</button>
        `;
        
        alert('✏️ Modo Edição ativado! Altere os campos necessários e use os botões para salvar ou cancelar.');
        
    } catch (error) {
        console.error('Erro ao carregar O.S. para edição:', error);
        alert('Erro ao carregar dados da O.S. para edição.');
    }
}

// Nova função: Salvar e Fechar
async function salvarEFecharOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
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
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                qtdTotal: item.qtdTotal
            }))
        };
        
        // Atualizar O.S. existente
        await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
        alert('✅ O.S. atualizada com sucesso! Estoque recalculado.');
        
        // Limpar estado de edição
        osEditandoId = null;
        
        // Restaurar botões originais
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
            <button type="submit" class="btn btn-success">✅ Emitir O.S.</button>
        `;
        
        // Limpar formulário
        document.getElementById('form-emitir-os').reset();
        document.getElementById('itens-os').innerHTML = '';
        
        // Recarregar dados
        await renderizarAlimentacao();
        await renderizarOrdensServico();
        
        // Voltar para aba de O.S.
        document.querySelector('[data-tab="ordens-servico"]').click();
        
    } catch (error) {
        console.error('❌ Erro ao salvar O.S.:', error);
        alert('Erro ao salvar O.S.: ' + error.message);
    }
}

// Nova função: Salvar e Continuar
async function salvarEContinuarOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
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
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                qtdTotal: item.qtdTotal
            }))
        };
        
        // Atualizar O.S. existente
        await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
        alert('✅ O.S. atualizada com sucesso! Continue editando ou clique em "Salvar e Fechar".');
        
        // Recarregar dados (mas mantém modo edição)
        await renderizarAlimentacao();
        await renderizarOrdensServico();
        
    } catch (error) {
        console.error('❌ Erro ao salvar O.S.:', error);
        alert('Erro ao salvar O.S.: ' + error.message);
    }
}

// Atualizar função cancelarEdicaoOS
function cancelarEdicaoOS() {
    if (!confirm('❌ Deseja realmente cancelar a edição? Todas as alterações não salvas serão perdidas.')) {
        return;
    }
    
    osEditandoId = null;
    
    // Limpar formulário
    document.getElementById('form-emitir-os').reset();
    document.getElementById('itens-os').innerHTML = '';
    
    // Restaurar botões originais
    const containerBotoes = document.getElementById('botoes-formulario-os');
    containerBotoes.innerHTML = `
        <button type="button" class="btn btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
        <button type="submit" class="btn btn-success">✅ Emitir O.S.</button>
    `;
    
    alert('✅ Edição cancelada. Formulário limpo.');
}
