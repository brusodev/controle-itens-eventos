/**
 * API Client - Classe para fazer requisições ao backend Flask
 * 
 * Substitui o uso de localStorage e leitura direta do itens.json
 */

const API_BASE_URL = '/api';

class APIClient {
    /**
     * Método auxiliar para fazer requisições
     */
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.erro || 'Erro na requisição');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }
    
    // ==================== ITENS ====================
    
    static async listarItens(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/itens/?${query}`);
    }
    
    static async obterItem(id) {
        return this.request(`/itens/${id}`);
    }
    
    static async criarItem(dados) {
        return this.request('/itens/', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }
    
    static async atualizarItem(id, dados) {
        return this.request(`/itens/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }
    
    static async deletarItem(id) {
        return this.request(`/itens/${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== ALIMENTAÇÃO ====================
    
    static async listarAlimentacao() {
        return this.request('/alimentacao/');
    }
    
    static async listarCategoriasAlimentacao() {
        return this.request('/alimentacao/categorias');
    }
    
    static async criarCategoriaAlimentacao(dados) {
        return this.request('/alimentacao/categorias', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }
    
    static async filtrarAlimentacao(categoria = '', busca = '') {
        const params = new URLSearchParams({ categoria, busca }).toString();
        return this.request(`/alimentacao/filtrar?${params}`);
    }
    
    static async atualizarEstoqueItem(itemId, regioes) {
        return this.request(`/alimentacao/item/${itemId}/estoque`, {
            method: 'PUT',
            body: JSON.stringify(regioes)
        });
    }
    
    static async resumoEstoque(regiao = null) {
        const params = regiao ? `?regiao=${regiao}` : '';
        return this.request(`/alimentacao/resumo${params}`);
    }
    
    // ==================== ORDENS DE SERVIÇO ====================
    
    static async listarOrdensServico(busca = '') {
        const params = busca ? `?busca=${busca}` : '';
        const url = `/ordens-servico/${params}`;
        console.log('🌐 APIClient.listarOrdensServico: Fazendo request para', url);
        const result = await this.request(url);
        console.log('✅ APIClient.listarOrdensServico: Recebido', result.length, 'items');
        if (result.length > 0) {
            console.log('📋 APIClient.listarOrdensServico: Primeiro item:', result[0]);
        }
        return result;
    }
    
    static async obterOrdemServico(id) {
        return this.request(`/ordens-servico/${id}`);
    }
    
    static async criarOrdemServico(dados) {
        return this.request('/ordens-servico/', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }
    
    static async atualizarOrdemServico(id, dados) {
        return this.request(`/ordens-servico/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }
    
    static async deletarOrdemServico(id, reverterEstoque = false) {
        const params = reverterEstoque ? '?reverter_estoque=true' : '';
        return this.request(`/ordens-servico/${id}${params}`, {
            method: 'DELETE'
        });
    }
    
    static async estatisticasOS() {
        return this.request('/ordens-servico/estatisticas');
    }
}

// ==================== EXEMPLO DE USO ====================

/**
 * Exemplo: Carregar dados de alimentação
 * 
 * Antes:
 * const response = await fetch('itens.json');
 * const dados = await response.json();
 * const dadosAlimentacao = dados.alimentacao;
 * 
 * Agora:
 * const dadosAlimentacao = await APIClient.listarAlimentacao();
 */

/**
 * Exemplo: Criar Ordem de Serviço
 * 
 * const novaOS = await APIClient.criarOrdemServico({
 *     numeroOS: "1/2025",
 *     contrato: "123/2024",
 *     detentora: "Empresa XYZ",
 *     cnpj: "12.345.678/0001-90",
 *     evento: "Workshop",
 *     data: "25/08/2025",
 *     local: "Auditório",
 *     justificativa: "Capacitação",
 *     gestorContrato: "João",
 *     fiscalContrato: "Maria",
 *     itens: [
 *         {
 *             categoria: "coffee_break_bebidas_quentes",
 *             itemId: "1",
 *             descricao: "Coffee Break Tipo 1",
 *             unidade: "Pessoa",
 *             qtdTotal: 50
 *         }
 *     ]
 * });
 */

/**
 * Exemplo: Atualizar estoque de um item
 * 
 * await APIClient.atualizarEstoqueItem(1, {
 *     "1": { inicial: "20000", gasto: "100" },
 *     "2": { inicial: "800", gasto: "50" }
 * });
 */
