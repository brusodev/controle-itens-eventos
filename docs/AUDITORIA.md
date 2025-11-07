# 📊 Sistema de Auditoria

**Status**: ✅ Ativo e funcional  
**Versão**: 2.0.0  
**Última atualização**: Novembro 2025

## 🎯 O que é Auditoria?

Auditoria é um **registro automático e rastreável** de todas as ações realizadas no sistema. Funciona como um **histórico completo** que mostra:

- ✅ **O quê**: Qual ação foi executada (criar, editar, deletar)
- ✅ **Quem**: Qual usuário realizou a ação
- ✅ **Quando**: Data e hora exata
- ✅ **Onde**: De qual IP/navegador
- ✅ **Antes/Depois**: Comparação dos dados

Exemplo real:
```
Admin alterou estoque: 
  Antes: Água 1.5L - Região 1 = 100 unidades
  Depois: Água 1.5L - Região 1 = 600 unidades
  Usuário: admin@example.com
  Data: 15/11/2025 14:30:45
  IP: 192.168.1.100
```

## 📋 Módulos Auditados

### ✅ 1. ITEM (Estoque)

**Ações rastreadas**:
- CREATE: Novo item criado
- UPDATE: Item editado (descrição, categoria, estoque)
- DELETE: Item removido

**Dados capturados**:
```json
{
  "id": 1,
  "descricao": "Água 1.5L",
  "codigo_bec": "3.3.90.30.21",
  "categoria": "Bebidas",
  "quantidade_atual": 250,
  "estoques": {
    "Região 1": 100,
    "Região 2": 75,
    "Região 3": 45,
    "Região 4": 20,
    "Região 5": 10,
    "Região 6": 0
  },
  "ativo": true
}
```

**Exemplo de auditoria**:
```
AÇÃO: UPDATE
DESCRIÇÃO: Atualizou estoques do item: Água 1.5L
ANTES: {quantidade_atual: 200, estoques: {Região 1: 50}}
DEPOIS: {quantidade_atual: 600, estoques: {Região 1: 600}}
```

### ✅ 2. OS (Ordem de Serviço)

**Ações rastreadas**:
- CREATE: Nova O.S. emitida
- UPDATE: O.S. editada (evento, itens, valores)
- DELETE: O.S. cancelada/deletada

**Dados capturados**:
```json
{
  "id": 1,
  "numero": "001/2025",
  "detentora_id": 5,
  "evento": "Reunião Diretoria",
  "responsavel": "João Silva",
  "data_emissao": "2025-01-15",
  "itens": [
    {
      "item_id": 1,
      "descricao": "Água 1.5L",
      "quantidade": 50,
      "valor_unitario": 3.50,
      "subtotal": 175.00
    }
  ],
  "total": 175.00,
  "status": "CONCLUIDA"
}
```

**Exemplo de auditoria**:
```
AÇÃO: CREATE
DESCRIÇÃO: Criou Ordem de Serviço: 001/2025
ANTES: null
DEPOIS: {numero: "001/2025", total: 175.00, ...}
```

### ✅ 3. DETENTORA (Fornecedor)

**Ações rastreadas**:
- CREATE: Nova detentora cadastrada
- UPDATE: Dados da detentora alterados
- DELETE: Detentora removida

**Dados capturados**:
```json
{
  "id": 5,
  "nome": "Empresa XYZ Ltda",
  "cnpj": "12.345.678/0001-90",
  "contato": "contato@empresa.com",
  "telefone": "(11) 98765-4321",
  "grupo": "Premium",
  "vigencia_inicio": "01/01/2025",
  "vigencia_fim": "31/12/2025",
  "responsavel": "João Silva",
  "ativo": true
}
```

**Exemplo de auditoria**:
```
AÇÃO: UPDATE
DESCRIÇÃO: Atualizou dados de: Empresa XYZ Ltda
ANTES: {vigencia_fim: "31/12/2024"}
DEPOIS: {vigencia_fim: "31/12/2025"}
```

## 🔍 Como Acessar Auditoria

### Via Interface Web (Recomendado)

1. **Fazer login como Admin**
   - Email: `admin@example.com`
   - Senha: (sua senha admin)

2. **Clicar em "Auditoria" no menu**
   - Sidebar esquerdo → "Auditoria"
   - Ou navbar superior (dependendo layout)

3. **Visualizar registros**
   - Tabela com até 50 registros por página
   - Mostra: Usuário, Ação, Módulo, Descrição, Data/Hora

4. **Filtrar dados** (opcional)
   - Selecione usuário específico
   - Escolha módulo (ITEM, OS, DETENTORA)
   - Selecione ação (CREATE, UPDATE, DELETE)
   - Defina intervalo de datas

5. **Ver detalhes**
   - Clique no botão "📋 Detalhes"
   - Abre modal com comparação antes/depois
   - Mostra IP, User-Agent, etc.

### Via API REST

```bash
# Listar últimas ações
curl -X GET http://localhost:5100/api/auditoria/?page=1 \
  -H "Cookie: session=..."

# Filtrar por usuário
curl -X GET http://localhost:5100/api/auditoria/?usuario_id=1 \
  -H "Cookie: session=..."

# Filtrar por módulo
curl -X GET http://localhost:5100/api/auditoria/?modulo=ITEM \
  -H "Cookie: session=..."

# Filtrar por ação
curl -X GET http://localhost:5100/api/auditoria/?acao=UPDATE \
  -H "Cookie: session=..."

# Filtrar por data
curl -X GET "http://localhost:5100/api/auditoria/?data_inicio=2025-01-01&data_fim=2025-01-31" \
  -H "Cookie: session=..."
```

**Resposta**:
```json
{
  "auditoria": [
    {
      "id": 1,
      "usuario": {"id": 1, "email": "admin@example.com"},
      "acao": "UPDATE",
      "modulo": "ITEM",
      "descricao": "Atualizou estoques do item: Água 1.5L",
      "dados_antes": {...},
      "dados_depois": {...},
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "data_hora": "2025-01-15T14:30:45"
    }
  ],
  "total": 542,
  "page": 1,
  "pages": 11
}
```

## 📊 Relatórios e Estatísticas

### Endpoint de Estatísticas

```bash
curl -X GET http://localhost:5100/api/auditoria/estatisticas \
  -H "Cookie: session=..."
```

**Resposta**:
```json
{
  "total_acoes": 1542,
  "total_24h": 87,
  "por_modulo": {
    "ITEM": 650,
    "OS": 750,
    "DETENTORA": 142
  },
  "por_acao": {
    "CREATE": 200,
    "UPDATE": 1100,
    "DELETE": 242
  },
  "ultimas_24h": 87,
  "usuarios_ativos": 5
}
```

### Usuários que Fizeram Ações

```bash
curl -X GET http://localhost:5100/api/auditoria/usuarios \
  -H "Cookie: session=..."
```

**Resposta**:
```json
{
  "usuarios": [
    {
      "id": 1,
      "email": "admin@example.com",
      "total_acoes": 450,
      "ultima_acao": "2025-01-15T15:45:30"
    },
    {
      "id": 2,
      "email": "user@example.com",
      "total_acoes": 320,
      "ultima_acao": "2025-01-15T14:20:15"
    }
  ]
}
```

## 🔒 Controle de Acesso

### Quem Pode Acessar?

| Grupo | Acesso | Permissão |
|-------|--------|-----------|
| Admin | Sim ✅ | Ver, Filtrar, Exportar tudo |
| Usuário Comum | Não ❌ | Nenhum acesso |
| Visitante | Não ❌ | Nenhum acesso |

### Proteção

- ✅ Login obrigatório
- ✅ Verificação de perfil (apenas ADMIN)
- ✅ Sessão segura
- ✅ Registra IP e User-Agent de quem acessa
- ✅ Sem exposição de dados sensíveis

**Tentativa de acesso não autorizado**:
```
GET /api/auditoria/ (como usuário comum)
├─ Verificação de autenticação: ✅ OK
├─ Verificação de perfil: ❌ FALHA
└─ Resposta: 403 Forbidden
   {
     "error": "Acesso negado. Apenas administradores podem acessar auditoria."
   }
```

## 🔍 Casos de Uso Reais

### 1️⃣ Investigar mudança inesperada de estoque

**Situação**: Gerente nota que estoque de água passou de 100 para 600 unidades.

**Processo**:
1. Acessar Auditoria → Filtrar por módulo "ITEM"
2. Procurar item "Água 1.5L"
3. Clicar em "Detalhes" do UPDATE
4. Comparar: Antes (100) vs Depois (600)
5. Ver: Quem fez, quando, de qual IP

**Resultado**: Descobrir se foi operador correto ou erro

### 2️⃣ Auditar todas ações de um dia

**Situação**: Gerenciador quer relatório do dia 15/01/2025

**Processo**:
1. Acessar Auditoria
2. Filtrar: data_inicio=15/01/2025, data_fim=15/01/2025
3. Ver lista de todos registros daquele dia
4. Analisar padrões

**Resultado**: Visão completa do que foi feito no dia

### 3️⃣ Rastrear ações de um usuário específico

**Situação**: Verificar atividades do usuário "bruno@company.com"

**Processo**:
1. Auditoria → Filtro "Usuários"
2. Selecionar "bruno@company.com"
3. Ver todas as ações dele (CREATE, UPDATE, DELETE)
4. Identificar padrão de trabalho

**Resultado**: Confirmar conformidade com políticas

### 4️⃣ Analisar uso por módulo

**Situação**: Descobrir qual parte do sistema é mais usada

**Processo**:
1. Auditoria → Estatísticas
2. Ver gráfico "Por Módulo"
3. Comparar números (ITEM: 650, OS: 750, DETENTORA: 142)

**Resultado**: ITEM e OS são mais usados, focar melhorias lá

## 🛠️ Troubleshooting

### ❓ Problema: "Acesso Negado" ao entrar em Auditoria

**Causa**: Usuário não é admin

**Solução**:
1. Fazer login com conta admin
2. Ou pedir a um admin para elevar seu perfil
3. Verificar em `/api/usuario/perfil` seu perfil atual

### ❓ Problema: Não vejo ação que realizei

**Causa possível**: 
- Ação foi em menos de 1 segundo (ainda em memória)
- Filtros estão muito restritivos
- Página recarrega antes de registrar

**Solução**:
1. Atualizar página (F5)
2. Remover filtros (deixar "Todos")
3. Verificar data/hora do filtro
4. Consultar `/api/auditoria/estatisticas` para ver se há registros

### ❓ Problema: Dados Antes/Depois não aparecem

**Causa**: Modal não carregou dados JSON

**Solução**:
1. Abrir DevTools (F12)
2. Clicar em "Detalhes" novamente
3. Verificar aba "Console" para erros
4. Atualizar página

### ❓ Problema: Auditoria vazia (nenhum registro)

**Causa**: Nenhuma ação realizada após auditoria ser criada

**Solução**:
1. Criar um item novo
2. Editar um item existente
3. Criar uma O.S.
4. Voltar para auditoria e atualizar
5. Devem aparecer registros novos

## 📈 Performance

### Índices do Banco

Auditoria usa índices em:
- `usuario_id` - Busca rápida por usuário
- `acao` - Filtro por ação
- `modulo` - Filtro por módulo
- `data_hora` - Filtro por data

**Performance esperada**:
- Listar 50 registros: < 100ms
- Filtrar por usuário: < 50ms
- Estatísticas: < 200ms

### Limpeza de Dados Antigos

Recomendado manter apenas últimos 2 anos de auditoria.

Para arquivar dados antigos:
```bash
python scripts/diagnostico/arquivar_auditoria.py --antes=2023-01-01
```

## 📝 Banco de Dados

### Tabela: auditoria

```sql
CREATE TABLE auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  acao VARCHAR(10) NOT NULL,  -- CREATE, UPDATE, DELETE
  modulo VARCHAR(20) NOT NULL,  -- ITEM, OS, DETENTORA
  descricao TEXT,
  entidade_tipo VARCHAR(50),  -- nome da tabela
  entidade_id INTEGER,  -- ID do registro alterado
  dados_antes JSON,  -- Estado anterior
  dados_depois JSON,  -- Estado novo
  ip_address VARCHAR(45),
  user_agent TEXT,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Índices
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_acao ON auditoria(acao);
CREATE INDEX idx_auditoria_modulo ON auditoria(modulo);
CREATE INDEX idx_auditoria_data ON auditoria(data_hora);
```

## 🔐 Segurança

✅ **Dados antes/depois não expõem senhas**
✅ **IP registrado para rastreamento de acesso**
✅ **User-Agent registrado para detectar acesso incomum**
✅ **Timestamps em UTC**
✅ **Nenhum dado é deletado automaticamente**
✅ **Apenas admins podem acessar**

## 📞 Suporte

### Dúvidas?
Verifique [docs/API.md](./API.md) para endpoints detalhados.

### Bug encontrado?
1. Coletar screenshot da auditoria
2. Anotar timestamp exato
3. Verificar console do navegador (F12)
4. Reportar com context

---

**Documentação versão 2.0.0 - Sistema de Auditoria Completo**
