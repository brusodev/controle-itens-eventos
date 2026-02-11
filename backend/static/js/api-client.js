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
        // ✅ Obter modulo atual do localStorage
        const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
        
        // ✅ Concatenar o módulo à URL para persistência de contexto
        let separator = endpoint.includes('?') ? '&' : '?';
        // Se já tiver modulo na URL, não repetir
        let url;
        if (endpoint.includes('modulo=')) {
            url = `${API_BASE_URL}${endpoint}`;
        } else {
            url = `${API_BASE_URL}${endpoint}${separator}modulo=${moduloAtual}`;
        }
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            console.log(`🌐 [API] Request: ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // Se for 404, retornar null ao invés de erro (detentora não encontrada)
                if (response.status === 404 && endpoint.includes('/grupo/')) {
                    console.warn('⚠️ [API] Detentora não encontrada para o grupo');
                    return null;
                }
                
                const error = await response.json();
                throw new Error(error.erro || 'Erro na requisição');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na API:', url, error);
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
    
    // ==================== CATEGORIAS ====================
    static async listarCategorias() {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        return this.request(`/categorias/?modulo=${modulo}`);
    }

    static async obterCategoria(id) {
        return this.request(`/categorias/${id}`);
    }

    static async criarCategoria(dados) {
        return this.request('/categorias/', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    static async atualizarCategoria(id, dados) {
        return this.request(`/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    static async deletarCategoria(id) {
        return this.request(`/categorias/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== ALIMENTAÇÃO ====================
    
    static async listarAlimentacao() {
        // Adicionar timestamp para evitar cache do navegador e modulo para filtro
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        const timestamp = new Date().getTime();
        const url = `/alimentacao/?modulo=${modulo}&_t=${timestamp}`;
        console.log(`🌐 [API] Chamando listarAlimentacao: ${url}`);
        return this.request(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }
    
    static async listarCategoriasAlimentacao() {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        return this.request(`/alimentacao/categorias?modulo=${modulo}`);
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
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        const params = new URLSearchParams();
        params.append('modulo', modulo);
        if (busca) params.append('busca', busca);
        
        const url = `/ordens-servico/?${params.toString()}`;
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
    
    static async deletarOrdemServico(id, motivo = null) {
        // ✅ Enviar motivo da exclusão se fornecido
        const body = motivo ? { motivo } : {};
        return this.request(`/ordens-servico/${id}`, {
            method: 'DELETE',
            body: motivo ? JSON.stringify(body) : undefined
        });
    }
    
    static async estatisticasOS() {
        return this.request('/ordens-servico/estatisticas');
    }
    
    // ==================== DETENTORAS ====================
    
    static async listarDetentoras(incluirInativas = false) {
        const query = new URLSearchParams({ incluir_inativas: incluirInativas }).toString();
        return this.request(`/detentoras/?${query}`);
    }
    
    static async listarGrupos() {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        return this.request(`/detentoras/grupos?modulo=${modulo}`);
    }

    // Alias para listarGrupos
    static async obterGruposDetentoras() {
        return this.listarGrupos();
    }
    
    static async obterDetentoraByGrupo(grupo) {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        return this.request(`/detentoras/grupo/${encodeURIComponent(grupo)}?modulo=${modulo}`);
    }

    static async listarDetentorasPorGrupo(grupo) {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        return this.request(`/detentoras/grupo/${encodeURIComponent(grupo)}/lista?modulo=${modulo}`);
    }
    
    static async obterDetentora(id) {
        return this.request(`/detentoras/${id}`);
    }
    
    static async criarDetentora(dados) {
        return this.request('/detentoras/', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }
    
    static async atualizarDetentora(id, dados) {
        return this.request(`/detentoras/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }
    
    static async deletarDetentora(id) {
        return this.request(`/detentoras/${id}`, {
            method: 'DELETE'
        });
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
