# 🎛️ PRÓXIMA IMPLEMENTAÇÃO: Interface Administrativa de Configuração de Módulos

## 📋 Objetivo

Criar uma **página administrativa** onde o usuário pode configurar dinamicamente:
- Quantidade de Regiões/Grupos/Âmbitos por módulo
- Nomenclatura de cada região/grupo
- Labels personalizados (Região, Grupo, Âmbito, Lote, etc.)
- Salvar configurações no banco de dados

---

## 🎯 Estado Atual (Opção 1 - IMPLEMENTADA)

✅ **Configuração em `globals.js`**:
```javascript
MODULE_CONFIG = {
  transporte: {
    regioes: {
      tipo: 'ambito',
      tipoLabel: 'Âmbito',
      tipoLabelPlural: 'Âmbitos',
      quantidade: 3,
      nomes: {
        1: 'Municipal',
        2: 'Intermunicipal',
        3: 'Interestadual'
      }
    }
  }
}
```

**Vantagens**:
- ✅ Centralizado em um único arquivo
- ✅ Fácil de manter para desenvolvedores
- ✅ Todos os hardcodes eliminados

**Limitações**:
- ❌ Requer editar código para mudar configurações
- ❌ Não permite mudanças em produção sem deploy
- ❌ Configuração não persiste no banco de dados

---

## 🚀 Próxima Etapa (Opção 2)

### 1️⃣ **Modelo de Dados (Backend)**

Criar tabela `ModuloConfig` no banco:

```python
# backend/models.py

class ModuloConfig(db.Model):
    """Configurações dinâmicas por módulo"""
    __tablename__ = 'modulo_config'
    
    id = db.Column(db.Integer, primary_key=True)
    modulo = db.Column(db.String(50), unique=True, nullable=False)  # 'coffee', 'transporte', etc
    
    # Labels
    grupo_label = db.Column(db.String(50), default='Grupo')
    item_code_label = db.Column(db.String(50), default='ITEM BEC')
    desc_label = db.Column(db.String(50), default='DESCRIÇÃO')
    
    # Configuração de regiões/grupos
    regiao_tipo = db.Column(db.String(50), default='regiao')  # 'regiao', 'grupo', 'ambito', 'lote'
    regiao_label = db.Column(db.String(50), default='Região')
    regiao_label_plural = db.Column(db.String(50), default='Regiões')
    regiao_quantidade = db.Column(db.Integer, default=6)
    
    # JSON com nomes personalizados
    regiao_nomes = db.Column(db.JSON, default={})  # {1: 'Municipal', 2: 'Intermunicipal', ...}
    
    # Configuração de tabelas
    usa_diarias = db.Column(db.Boolean, default=True)
    coluna_qtd = db.Column(db.String(100))
    coluna_valor_unit = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=get_datetime_br)
    updated_at = db.Column(db.DateTime, onupdate=get_datetime_br)
    
    def to_dict(self):
        return {
            'modulo': self.modulo,
            'grupoLabel': self.grupo_label,
            'itemCodeLabel': self.item_code_label,
            'descLabel': self.desc_label,
            'regioes': {
                'tipo': self.regiao_tipo,
                'tipoLabel': self.regiao_label,
                'tipoLabelPlural': self.regiao_label_plural,
                'quantidade': self.regiao_quantidade,
                'nomes': self.regiao_nomes or {}
            },
            'usaDiarias': self.usa_diarias,
            'colunaQtd': self.coluna_qtd,
            'colunaValorUnit': self.coluna_valor_unit
        }
```

---

### 2️⃣ **API Routes (Backend)**

```python
# backend/routes/admin_routes.py

@admin_bp.route('/api/modulo-config', methods=['GET'])
@login_requerido
@admin_requerido
def listar_configs():
    """Lista configurações de todos os módulos"""
    configs = ModuloConfig.query.all()
    return jsonify([c.to_dict() for c in configs]), 200


@admin_bp.route('/api/modulo-config/<modulo>', methods=['GET'])
@login_requerido
@admin_requerido
def obter_config(modulo):
    """Obtém configuração de um módulo específico"""
    config = ModuloConfig.query.filter_by(modulo=modulo).first()
    if not config:
        # Retornar defaults do globals.js
        return jsonify(get_default_config(modulo)), 200
    return jsonify(config.to_dict()), 200


@admin_bp.route('/api/modulo-config/<modulo>', methods=['PUT'])
@login_requerido
@admin_requerido
def atualizar_config(modulo):
    """Atualiza configuração de um módulo"""
    dados = request.json
    
    config = ModuloConfig.query.filter_by(modulo=modulo).first()
    if not config:
        config = ModuloConfig(modulo=modulo)
        db.session.add(config)
    
    # Atualizar campos
    config.grupo_label = dados.get('grupoLabel', 'Grupo')
    config.item_code_label = dados.get('itemCodeLabel', 'ITEM BEC')
    config.desc_label = dados.get('descLabel', 'DESCRIÇÃO')
    config.usa_diarias = dados.get('usaDiarias', True)
    
    # Configuração de regiões
    if 'regioes' in dados:
        reg = dados['regioes']
        config.regiao_tipo = reg.get('tipo', 'regiao')
        config.regiao_label = reg.get('tipoLabel', 'Região')
        config.regiao_label_plural = reg.get('tipoLabelPlural', 'Regiões')
        config.regiao_quantidade = reg.get('quantidade', 6)
        config.regiao_nomes = reg.get('nomes', {})
    
    db.session.commit()
    
    # Registrar auditoria
    registrar_auditoria(
        'UPDATE',
        'MODULO_CONFIG',
        f'Atualizou configuração do módulo: {modulo}',
        entidade_tipo='modulo_config',
        entidade_id=config.id
    )
    
    return jsonify(config.to_dict()), 200
```

---

### 3️⃣ **Interface Administrativa (Frontend)**

**Página**: `templates/admin-configurar-modulos.html`

```html
<div class="admin-config-container">
    <h1>⚙️ Configurar Módulos</h1>
    
    <!-- Seletor de Módulo -->
    <div class="modulo-selector">
        <button onclick="carregarConfigModulo('coffee')">☕ Coffee Break</button>
        <button onclick="carregarConfigModulo('transporte')">🚗 Transporte</button>
        <button onclick="carregarConfigModulo('hospedagem')">🏨 Hospedagem</button>
        <button onclick="carregarConfigModulo('organizacao')">📋 Organização</button>
    </div>
    
    <!-- Formulário de Configuração -->
    <form id="form-config-modulo">
        <h2 id="titulo-modulo">Configurando: Coffee Break</h2>
        
        <!-- Seção: Labels Gerais -->
        <section class="config-section">
            <h3>🏷️ Nomenclatura</h3>
            
            <div class="form-group">
                <label>Código do Item (ex: ITEM BEC, CATSER)</label>
                <input type="text" id="config-item-code-label" placeholder="ITEM BEC">
            </div>
            
            <div class="form-group">
                <label>Campo de Descrição (ex: DESCRIÇÃO, ESPECIFICAÇÃO)</label>
                <input type="text" id="config-desc-label" placeholder="DESCRIÇÃO">
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="config-usa-diarias">
                    Este módulo usa campo "Diárias"
                </label>
            </div>
        </section>
        
        <!-- Seção: Regiões/Grupos/Âmbitos -->
        <section class="config-section">
            <h3>🌍 Divisões Regionais</h3>
            
            <div class="form-group">
                <label>Tipo de Divisão</label>
                <select id="config-regiao-tipo">
                    <option value="regiao">Região</option>
                    <option value="grupo">Grupo</option>
                    <option value="ambito">Âmbito</option>
                    <option value="lote">Lote</option>
                    <option value="custom">Personalizado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nome Singular (ex: Região, Grupo, Âmbito)</label>
                <input type="text" id="config-regiao-label" placeholder="Região">
            </div>
            
            <div class="form-group">
                <label>Nome Plural (ex: Regiões, Grupos, Âmbitos)</label>
                <input type="text" id="config-regiao-label-plural" placeholder="Regiões">
            </div>
            
            <div class="form-group">
                <label>Quantidade de Divisões</label>
                <input type="number" id="config-regiao-quantidade" min="1" max="10" value="6">
            </div>
            
            <!-- Nomes Personalizados para cada Região/Grupo -->
            <div class="form-group">
                <label>Nomes Personalizados</label>
                <div id="container-nomes-regioes">
                    <!-- Gerado dinamicamente via JS -->
                </div>
            </div>
        </section>
        
        <!-- Ações -->
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="resetarPadroes()">
                ↺ Resetar para Padrões
            </button>
            <button type="submit" class="btn-primary">
                💾 Salvar Configuração
            </button>
        </div>
    </form>
    
    <!-- Preview das Mudanças -->
    <section class="config-preview">
        <h3>👁️ Preview</h3>
        <div id="preview-labels"></div>
    </section>
</div>
```

**JavaScript**: `static/js/admin-config.js`

```javascript
let moduloEditando = null;
let configAtual = {};

async function carregarConfigModulo(modulo) {
    moduloEditando = modulo;
    
    try {
        const response = await fetch(`/api/modulo-config/${modulo}`);
        configAtual = await response.json();
        
        // Preencher formulário
        document.getElementById('config-item-code-label').value = configAtual.itemCodeLabel;
        document.getElementById('config-desc-label').value = configAtual.descLabel;
        document.getElementById('config-usa-diarias').checked = configAtual.usaDiarias;
        
        // Regiões
        const reg = configAtual.regioes;
        document.getElementById('config-regiao-tipo').value = reg.tipo;
        document.getElementById('config-regiao-label').value = reg.tipoLabel;
        document.getElementById('config-regiao-label-plural').value = reg.tipoLabelPlural;
        document.getElementById('config-regiao-quantidade').value = reg.quantidade;
        
        // Renderizar campos de nomes
        renderizarCamposNomes(reg.quantidade, reg.nomes);
        
        // Atualizar preview
        atualizarPreview();
        
    } catch (error) {
        console.error('Erro ao carregar config:', error);
        alert('Erro ao carregar configuração do módulo');
    }
}

function renderizarCamposNomes(quantidade, nomes) {
    const container = document.getElementById('container-nomes-regioes');
    container.innerHTML = '';
    
    for (let i = 1; i <= quantidade; i++) {
        const div = document.createElement('div');
        div.className = 'nome-regiao-input';
        div.innerHTML = `
            <label>${document.getElementById('config-regiao-label').value} ${i}:</label>
            <input type="text" 
                   id="nome-regiao-${i}" 
                   value="${nomes[i] || ''}" 
                   placeholder="Nome da ${document.getElementById('config-regiao-label').value} ${i}">
        `;
        container.appendChild(div);
    }
}

// Atualizar campos quando quantidade mudar
document.getElementById('config-regiao-quantidade').addEventListener('change', function() {
    const qtd = parseInt(this.value);
    const nomesAtuais = {};
    
    // Preservar nomes já digitados
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById(`nome-regiao-${i}`);
        if (input) nomesAtuais[i] = input.value;
    }
    
    renderizarCamposNomes(qtd, nomesAtuais);
});

document.getElementById('form-config-modulo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Coletar nomes das regiões
    const quantidade = parseInt(document.getElementById('config-regiao-quantidade').value);
    const nomes = {};
    for (let i = 1; i <= quantidade; i++) {
        const input = document.getElementById(`nome-regiao-${i}`);
        if (input && input.value) {
            nomes[i] = input.value;
        }
    }
    
    const dados = {
        itemCodeLabel: document.getElementById('config-item-code-label').value,
        descLabel: document.getElementById('config-desc-label').value,
        usaDiarias: document.getElementById('config-usa-diarias').checked,
        regioes: {
            tipo: document.getElementById('config-regiao-tipo').value,
            tipoLabel: document.getElementById('config-regiao-label').value,
            tipoLabelPlural: document.getElementById('config-regiao-label-plural').value,
            quantidade: quantidade,
            nomes: nomes
        }
    };
    
    try {
        const response = await fetch(`/api/modulo-config/${moduloEditando}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            alert('✅ Configuração salva com sucesso!');
            // Recarregar globals.js da API
            await recarregarGlobalsFromAPI();
        } else {
            throw new Error('Erro ao salvar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar configuração');
    }
});

async function recarregarGlobalsFromAPI() {
    // Buscar configs atualizadas do banco
    const response = await fetch('/api/modulo-config');
    const configs = await response.json();
    
    // Atualizar MODULE_CONFIG em memória
    configs.forEach(cfg => {
        if (window.MODULE_CONFIG[cfg.modulo]) {
            window.MODULE_CONFIG[cfg.modulo] = cfg;
        }
    });
    
    // Opcional: Salvar no localStorage
    localStorage.setItem('MODULE_CONFIG_OVERRIDE', JSON.stringify(configs));
}
```

---

### 4️⃣ **Migração e Seed Inicial**

```python
# migrations/add_modulo_config.py

def seed_default_configs():
    """Popula configurações padrão baseadas no globals.js atual"""
    
    configs_padrao = [
        {
            'modulo': 'coffee',
            'grupo_label': 'Grupo',
            'item_code_label': 'ITEM BEC',
            'regiao_quantidade': 6,
            'regiao_nomes': {i: f'Região {i}' for i in range(1, 7)}
        },
        {
            'modulo': 'transporte',
            'grupo_label': 'Grupo',
            'item_code_label': 'CATSER',
            'desc_label': 'ESPECIFICAÇÃO',
            'usa_diarias': False,
            'regiao_tipo': 'ambito',
            'regiao_label': 'Âmbito',
            'regiao_label_plural': 'Âmbitos',
            'regiao_quantidade': 3,
            'regiao_nomes': {
                1: 'Municipal',
                2: 'Intermunicipal',
                3: 'Interestadual'
            }
        },
        # ... outros módulos
    ]
    
    for cfg in configs_padrao:
        config = ModuloConfig(**cfg)
        db.session.add(config)
    
    db.session.commit()
```

---

### 5️⃣ **Integração com Frontend Existente**

**Atualizar `globals.js`** para buscar do banco quando disponível:

```javascript
// ========================================
// CARREGAR CONFIGURAÇÕES DO BANCO (se existir)
// ========================================

let MODULE_CONFIG_DB = null;

async function carregarConfigsDB() {
    try {
        const response = await fetch('/api/modulo-config');
        if (response.ok) {
            const configs = await response.json();
            MODULE_CONFIG_DB = {};
            configs.forEach(cfg => {
                MODULE_CONFIG_DB[cfg.modulo] = cfg;
            });
            console.log('✅ Configurações carregadas do banco de dados');
        }
    } catch (error) {
        console.warn('⚠️ Usando configurações padrão do globals.js');
    }
}

// Chamar ao carregar a página
document.addEventListener('DOMContentLoaded', carregarConfigsDB);

// Atualizar getModuleConfig() para priorizar DB
function getModuleConfig() {
    const modulo = localStorage.getItem('modulo_atual') || 'coffee';
    
    // Priorizar config do banco se existir
    if (MODULE_CONFIG_DB && MODULE_CONFIG_DB[modulo]) {
        return MODULE_CONFIG_DB[modulo];
    }
    
    // Fallback para config hardcoded
    return MODULE_CONFIG[modulo] || MODULE_CONFIG.coffee;
}
```

---

## 📊 Cronograma Estimado

| Etapa | Tempo Estimado | Prioridade |
|-------|----------------|------------|
| 1. Modelo de Dados + Migrations | 1-2 horas | Alta |
| 2. API Routes | 2-3 horas | Alta |
| 3. Interface Admin | 4-6 horas | Média |
| 4. Integração Frontend | 2-3 horas | Alta |
| 5. Testes + Ajustes | 2-3 horas | Alta |
| **TOTAL** | **11-17 horas** | - |

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar modelo `ModuloConfig` em `models.py`
- [ ] Criar migration para tabela `modulo_config`
- [ ] Criar seed com configurações padrão
- [ ] Implementar rotas GET/PUT em `admin_routes.py`
- [ ] Adicionar validações (quantidade 1-10, campos obrigatórios)
- [ ] Registrar auditoria nas alterações

### Frontend
- [ ] Criar página `admin-configurar-modulos.html`
- [ ] Criar `admin-config.js` com lógica de CRUD
- [ ] Adicionar menu "Configurar Módulos" na área admin
- [ ] Atualizar `globals.js` para buscar configs do banco
- [ ] Adicionar fallback para configurações padrão
- [ ] Criar preview em tempo real das mudanças

### Testes
- [ ] Testar criação/edição de configs
- [ ] Verificar atualização dinâmica nas telas
- [ ] Testar com diferentes quantidades de regiões (1-10)
- [ ] Validar comportamento em módulos sem config no BD
- [ ] Testar migração de dados existentes

### Documentação
- [ ] Atualizar README com nova funcionalidade
- [ ] Documentar estrutura da tabela `modulo_config`
- [ ] Criar guia para administradores
- [ ] Adicionar screenshots da interface

---

## 🎨 Melhorias Futuras (Opcional)

### Fase 3 (Futuro)
- [ ] **Presets**: Templates prontos ("3 Regiões - Capital/Interior/Litoral")
- [ ] **Exportar/Importar**: Backup de configurações em JSON
- [ ] **Histórico**: Mostrar alterações anteriores com rollback
- [ ] **Cores Personalizadas**: Definir cores para cada região/grupo
- [ ] **Validação Avançada**: Regras de negócio específicas por módulo
- [ ] **Multi-Idioma**: Suportar PT-BR, EN, ES

---

## 🚨 Considerações Importantes

1. **Migração Gradual**: Sistema deve funcionar com configs antigas até migração completa
2. **Cache**: Implementar cache de configs para performance
3. **Validação**: Garantir integridade dos dados (ex: quantidade mínima 1)
4. **Auditoria**: Registrar todas as mudanças de configuração
5. **Permissões**: Apenas administradores podem alterar configs
6. **Fallback**: Sempre ter defaults caso banco esteja indisponível

---

## 📝 Anotações

**Data de Criação**: 19/02/2026  
**Versão Atual**: Opção 1 implementada (globals.js)  
**Próxima Versão**: Opção 2 (Interface Admin com BD)  
**Responsável**: A definir  
**Status**: 📋 Planejado

---

**Dúvidas ou Sugestões?**  
Abrir issue no repositório ou discutir com a equipe antes de iniciar implementação.
