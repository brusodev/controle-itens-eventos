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
        
        // ✅ `headers` é mesclado por último para não ser sobrescrito pelo spread de `options`
        // (options também tem a chave `headers`; se viesse antes, o Content-Type default
        // seria perdido sempre que um caller passasse headers customizados, ex. X-CSRF-Token).
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // Sessao expirada ou nao autenticado: redirecionar para login
                if (response.status === 401) {
                    console.warn('[API] Sessao invalida ou expirada. Redirecionando para login...');
                    window.location.href = '/auth/login';
                    return;
                }

                // Se for 404, retornar null ao inves de erro (detentora nao encontrada)
                if (response.status === 404 && endpoint.includes('/grupo/')) {
                    console.warn('[API] Detentora nao encontrada para o grupo');
                    return null;
                }

                const error = await response.json();
                throw new Error(error.erro || 'Erro na requisicao');
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
    
    static async atualizarEstoqueItem(itemId, regioes, natureza = null) {
        const payload = { regioes };
        if (natureza !== null) {
            payload.natureza = natureza;
        }
        return this.request(`/alimentacao/item/${itemId}/estoque`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }
    
    static async resumoEstoque(regiao = null) {
        const params = regiao ? `?regiao=${regiao}` : '';
        return this.request(`/alimentacao/resumo${params}`);
    }
    
    // ==================== ORDENS DE SERVIÇO ====================
    
    static async listarOrdensServico(busca = '', grupo = '', filtro = '') {
        const modulo = localStorage.getItem('modulo_atual') || 'coffee';
        const params = new URLSearchParams();
        params.append('modulo', modulo);
        if (busca) params.append('busca', busca);
        if (grupo) params.append('grupo', grupo);
        if (filtro) params.append('filtro', filtro);

        const url = `/ordens-servico/?${params.toString()}`;
        const result = await this.request(url);
        if (result.length > 0) {
        }
        return result;
    }
    
    static async obterOrdemServico(id) {
        return this.request(`/ordens-servico/${id}`);
    }
    
    static async criarOrdemServico(dados) {
        const csrf = await this._csrfToken();
        return this.request('/ordens-servico/', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify(dados)
        });
    }
    
    static async atualizarOrdemServico(id, dados) {
        const csrf = await this._csrfToken();
        return this.request(`/ordens-servico/${id}`, {
            method: 'PUT',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify(dados)
        });
    }
    
    static async deletarOrdemServico(id, motivo = null) {
        // ✅ Enviar motivo da exclusão se fornecido
        const csrf = await this._csrfToken();
        const body = motivo ? { motivo } : {};
        return this.request(`/ordens-servico/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrf },
            body: motivo ? JSON.stringify(body) : undefined
        });
    }

    static async reordenarOS(modulo, grupo, ordem) {
        return this.request('/ordens-servico/reordenar', {
            method: 'PUT',
            body: JSON.stringify({ modulo, grupo, ordem })
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

    // ==================== PEDIDOS GRÁFICOS ====================
    // Rotas não usam o parâmetro `modulo` da URL (a tabela já é dedicada
    // ao módulo servicos_graficos), mas exigem CSRF em toda mutação —
    // buscado explicitamente aqui, igual ao padrão de salvarPagamento().

    static async _csrfToken() {
        const resp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const data = await resp.json();
        return data.csrf_token;
    }

    static async listarPedidosGraficos(filtros = {}) {
        const params = new URLSearchParams(filtros).toString();
        return this.request(`/pedidos-graficos/?${params}`);
    }

    static async resumoPedidosGraficos() {
        return this.request('/pedidos-graficos/resumo');
    }

    static async obterPedidoGrafico(id) {
        return this.request(`/pedidos-graficos/${id}`);
    }

    static async criarPedidoGrafico(dados) {
        const csrf = await this._csrfToken();
        return this.request('/pedidos-graficos/', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify(dados)
        });
    }

    static async atualizarPedidoGrafico(id, dados) {
        const csrf = await this._csrfToken();
        return this.request(`/pedidos-graficos/${id}`, {
            method: 'PUT',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify(dados)
        });
    }

    static async marcarEntregaPedido(id, entregue) {
        const csrf = await this._csrfToken();
        return this.request(`/pedidos-graficos/${id}/entrega`, {
            method: 'PUT',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify({ entregue })
        });
    }

    static async vincularOSAoPedido(id, ordemServicoId) {
        const csrf = await this._csrfToken();
        return this.request(`/pedidos-graficos/${id}/vincular-os`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify({ ordemServicoId })
        });
    }

    // Vincula vários pedidos à MESMA O.S. numa única transação (tudo ou nada).
    static async vincularOSAosPedidos(pedidoIds, ordemServicoId) {
        const csrf = await this._csrfToken();
        return this.request('/pedidos-graficos/vincular-os-lote', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify({ pedidoIds, ordemServicoId })
        });
    }

    static async cancelarPedidoGrafico(id, motivo) {
        const csrf = await this._csrfToken();
        return this.request(`/pedidos-graficos/${id}/cancelar`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            body: JSON.stringify({ motivo })
        });
    }

    static async deletarPedidoGrafico(id) {
        const csrf = await this._csrfToken();
        return this.request(`/pedidos-graficos/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrf }
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
