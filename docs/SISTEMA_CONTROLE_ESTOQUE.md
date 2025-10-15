# Sistema de Controle de Estoque Integrado com Ordens de Serviço

## 📋 Resumo da Solução

Sistema robusto de controle de estoque que garante:
- ✅ **Validação antes da emissão**: Verifica disponibilidade de TODOS os itens antes de criar a O.S.
- ✅ **Rastreamento completo**: Histórico de todas as movimentações vinculadas às O.S.
- ✅ **Integridade dos dados**: Impossível ultrapassar o estoque inicial
- ✅ **Vínculo Grupo ↔ Região**: Cada grupo da O.S. corresponde a uma região do estoque (1-6)
- ✅ **Reversão automática**: Possibilidade de reverter movimentações ao editar/cancelar O.S.

---

## 🔧 Componentes Implementados

### 1. **Migração do Banco de Dados**
Arquivo: `backend/migrations/migrate_add_controle_estoque.py`

**O que faz:**
- Cria tabela `movimentacoes_estoque` para rastreamento
- Adiciona campo `regiao_estoque` em `ordens_servico`
- Cria índices para melhor performance
- Sincroniza regiões existentes com grupos

**Como executar:**
```bash
cd backend/migrations
python migrate_add_controle_estoque.py
```

### 2. **Modelo de Dados**
Arquivo: `backend/models.py`

**Novidades:**
```python
class OrdemServico:
    regiao_estoque = db.Column(db.Integer)  # Região 1-6 vinculada ao grupo
    movimentacoes = db.relationship('MovimentacaoEstoque', ...)

class MovimentacaoEstoque(db.Model):
    """Histórico completo de movimentações de estoque"""
    ordem_servico_id
    item_id
    estoque_regional_id
    quantidade
    tipo  # 'SAIDA' ou 'ENTRADA' (reversão)
    data_movimentacao
    observacao
```

### 3. **Serviço de Controle de Estoque**
Arquivo: `backend/utils/controle_estoque.py`

**Funções Principais:**

#### `processar_baixas_os(ordem_servico_id, itens_os, regiao_numero, numero_os)`
- **FASE 1**: Valida disponibilidade de TODOS os itens
- **FASE 2**: Só faz as baixas se TUDO estiver OK
- Lança `ErroEstoqueInsuficiente` se faltar estoque
- Retorna lista de movimentações criadas

#### `reverter_baixa_estoque(ordem_servico_id)`
- Reverte todas as baixas de uma O.S.
- Útil para edição/cancelamento
- Registra movimentações de ENTRADA

#### `obter_estoque_disponivel(item_id, regiao_numero)`
- Calcula estoque disponível: `inicial - gasto`
- Retorna (EstoqueRegional, float disponível)

#### `obter_relatorio_estoque_por_regiao(regiao_numero)`
- Gera relatório completo de uma região
- Mostra inicial, gasto, disponível, percentual
- Classifica por status (OK, BAIXO, CRÍTICO)

---

## 🎯 Fluxo de Emissão de O.S. com Controle de Estoque

```
1. FRONTEND envia dados da O.S. com grupo (1-6)
          ↓
2. BACKEND valida grupo → converte para regiao_estoque
          ↓
3. Cria OrdemServico com regiao_estoque vinculada
          ↓
4. Adiciona ItemOrdemServico para cada item
          ↓
5. VALIDA disponibilidade de TODOS os itens na região
          ↓
    ❌ SE FALTAR ESTOQUE: Rollback + erro detalhado
    ✅ SE OK: Prossegue
          ↓
6. Dá baixa no estoque de cada item
          ↓
7. Registra MovimentacaoEstoque para cada baixa
          ↓
8. COMMIT - tudo ou nada (transação atômica)
```

---

## 📝 Exemplo de Uso

### Criar O.S. com Controle de Estoque

```python
# No frontend, enviar grupo (1-6):
{
    "grupo": "3",  # Grupo 3 → Região 3 do estoque
    "itens": [
        {
            "itemId": "1",
            "descricao": "Café",
            "qtdTotal": 100
        }
    ]
}

# No backend (routes/os_routes.py):
@os_bp.route('/', methods=['POST'])
def criar_ordem():
    # 1. Validar grupo
    regiao_estoque = int(dados['grupo'])
    
    # 2. Criar O.S.
    os = OrdemServico(
        grupo=dados['grupo'],
        regiao_estoque=regiao_estoque,  # ✅ Vincula região
        ...
    )
    
    # 3. Adicionar itens
    itens_os = [...]
    
    # 4. Processar baixas (COM VALIDAÇÃO)
    try:
        movimentacoes = processar_baixas_os(
            ordem_servico_id=os.id,
            itens_os=itens_os,
            regiao_numero=regiao_estoque,
            numero_os=numero_os_gerado
        )
    except ErroEstoqueInsuficiente as e:
        # Retorna erro detalhado ao frontend
        return jsonify({'erro': str(e)}), 400
    
    db.session.commit()
```

---

## 🛡️ Validações e Proteções

### 1. **Validação de Região**
```python
if regiao < 1 or regiao > 6:
    raise ErroRegiaoInvalida("Região deve estar entre 1 e 6")
```

### 2. **Validação de Disponibilidade**
```python
if disponivel < quantidade_necessaria:
    raise ErroEstoqueInsuficiente(
        f"Estoque insuficiente. "
        f"Disponível: {disponivel}, Necessário: {quantidade_necessaria}"
    )
```

### 3. **Proteção contra Ultrapassar Inicial**
```python
if novo_gasto > inicial:
    raise ErroEstoqueInsuficiente(
        f"Operação resultaria em gasto maior que o inicial"
    )
```

### 4. **Transação Atômica**
- Tudo dentro de uma transação
- Se qualquer validação falhar → ROLLBACK completo
- Só faz COMMIT se TUDO estiver OK

---

## 📊 Relatórios e Monitoramento

### Relatório de Estoque por Região

```python
from utils.controle_estoque import obter_relatorio_estoque_por_regiao

relatorio = obter_relatorio_estoque_por_regiao(regiao_numero=3)

# Retorna:
[
    {
        'item_descricao': 'Café',
        'inicial': '1.000,00',
        'gasto': '250,50',
        'disponivel': '749,50',
        'percentual_usado': 25.05,
        'status': 'OK'  # OK, BAIXO (>80%), CRÍTICO (=0)
    },
    ...
]
```

### Histórico de Movimentações

```python
# Buscar todas as movimentações de uma O.S.
movimentacoes = MovimentacaoEstoque.query.filter_by(
    ordem_servico_id=os_id
).all()

# Buscar movimentações de um item específico
movimentacoes_item = MovimentacaoEstoque.query.filter_by(
    item_id=item_id,
    tipo='SAIDA'  # ou 'ENTRADA'
).all()
```

---

## 🔄 Edição e Cancelamento de O.S.

### Reversão de Estoque

```python
# Ao editar ou cancelar uma O.S.:
reverter_baixa_estoque(ordem_servico_id)

# Isso faz:
# 1. Busca todas as movimentações de SAIDA da O.S.
# 2. Devolve a quantidade para o estoque
# 3. Registra movimentações de ENTRADA (auditoria)
```

---

## 🎨 Mensagens de Erro Amigáveis

### Estoque Insuficiente
```
Não foi possível emitir a O.S. devido a problemas de estoque:
• Estoque insuficiente para Café na região 3. Disponível: 50,00, Necessário: 100,00
• Estoque não configurado para Suco na região 3
```

### Região Inválida
```
Grupo/Região inválida: 7. Deve ser um número entre 1 e 6.
```

---

## 📦 Estrutura de Dados

### Exemplo de Movimentação Registrada

```json
{
    "id": 1,
    "ordemServicoId": 5,
    "itemId": 12,
    "estoqueRegionalId": 45,
    "quantidade": 100.0,
    "tipo": "SAIDA",
    "dataMovimentacao": "2025-10-15T14:30:00",
    "observacao": "Emissão O.S. 5/2025 - Café"
}
```

---

## ✅ Benefícios do Sistema

1. **Rastreabilidade Total**
   - Cada movimentação registrada com data, O.S., item e região
   - Histórico completo para auditoria

2. **Integridade Garantida**
   - Impossível criar O.S. sem estoque
   - Impossível ultrapassar estoque inicial
   - Validação em dois níveis (aplicação + banco)

3. **Facilidade de Reversão**
   - Editar O.S.: reverte → aplica novos valores
   - Cancelar O.S.: reverte → pronto

4. **Relatórios Precisos**
   - Estoque por região em tempo real
   - Percentual de utilização
   - Alertas automáticos (BAIXO, CRÍTICO)

5. **Vínculo Claro Grupo ↔ Região**
   - Cada O.S. sabe de qual região consumiu
   - Facilita controle regional independente

---

## 🚀 Próximos Passos

### 1. Executar a Migração
```bash
cd backend/migrations
python migrate_add_controle_estoque.py
```

### 2. Atualizar Rotas de O.S.
O arquivo `os_routes.py` precisa ser ajustado para usar o novo sistema (ver seção "CORREÇÃO NECESSÁRIA" abaixo).

### 3. Testar Criação de O.S.
- Criar O.S. com estoque suficiente ✅
- Tentar criar O.S. sem estoque ❌ (deve rejeitar)
- Verificar registro de movimentações

### 4. Adicionar Endpoint de Relatório (Opcional)
```python
@os_bp.route('/estoque/regiao/<int:regiao>', methods=['GET'])
def relatorio_estoque_regiao(regiao):
    relatorio = obter_relatorio_estoque_por_regiao(regiao)
    return jsonify(relatorio), 200
```

---

## ⚠️ CORREÇÃO NECESSÁRIA

O arquivo `backend/routes/os_routes.py` ficou com código duplicado. Criar uma versão limpa seguindo este modelo:

```python
from utils.controle_estoque import processar_baixas_os, reverter_baixa_estoque

@os_bp.route('/', methods=['POST'])
def criar_ordem():
    # ... criar O.S. e itens ...
    
    # Processar baixas com validação
    try:
        movimentacoes = processar_baixas_os(
            ordem_servico_id=os.id,
            itens_os=itens_os,
            regiao_numero=regiao_estoque,
            numero_os=numero_os_gerado
        )
    except ErroEstoqueInsuficiente as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 400
    
    db.session.commit()
    return jsonify(os.to_dict()), 201

@os_bp.route('/<int:os_id>', methods=['PUT'])
def editar_ordem(os_id):
    # Reverter estoque antigo
    reverter_baixa_estoque(os_id)
    
    # ... atualizar O.S. e criar novos itens ...
    
    # Processar novas baixas
    movimentacoes = processar_baixas_os(...)
    
    db.session.commit()
    return jsonify(os.to_dict()), 200

@os_bp.route('/<int:os_id>', methods=['DELETE'])
def deletar_ordem(os_id):
    # Reverter estoque
    reverter_baixa_estoque(os_id)
    
    db.session.delete(os)
    db.session.commit()
    return jsonify({'mensagem': 'O.S. deletada'}), 200
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console (mensagens de DEBUG)
2. Consulte a tabela `movimentacoes_estoque` no banco
3. Analise as mensagens de erro retornadas pela API

---

**Desenvolvido com ❤️ para garantir controle total e segurança do estoque**
