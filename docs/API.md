# 📡 Documentação da API REST

**Versão**: 2.0.0  
**Base URL**: `http://localhost:5100`  
**Autenticação**: Sessão (login obrigatório)

## 🔐 Autenticação

### Login
```http
POST /login
Content-Type: application/json

{
  "email": "admin@example.com",
  "senha": "admin123"
}
```

**Resposta (200 OK)**:
```json
{
  "message": "Login realizado com sucesso",
  "usuario_id": 1
}
```

### Logout
```http
POST /logout
```

**Resposta (200 OK)**:
```json
{
  "message": "Logout realizado com sucesso"
}
```

## 📦 Items/Estoque

### Listar todos os itens
```http
GET /api/itens
```

**Resposta (200 OK)**:
```json
{
  "items": [
    {
      "id": 1,
      "descricao": "Água 1.5L",
      "codigo_bec": "3.3.90.30.21",
      "categoria": "Bebidas",
      "unidade": "UN",
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
  ],
  "total": 45
}
```

### Criar novo item
```http
POST /api/itens
Content-Type: application/json

{
  "descricao": "Café Coado 1L",
  "codigo_bec": "3.3.90.30.21",
  "categoria": "Bebidas",
  "unidade": "L",
  "quantidade_atual": 100
}
```

**Resposta (201 Created)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Item criado com sucesso",
  "id": 46,
  "auditoria_id": 1234
}
```

### Obter item específico
```http
GET /api/itens/1
```

**Resposta (200 OK)**:
```json
{
  "id": 1,
  "descricao": "Água 1.5L",
  "codigo_bec": "3.3.90.30.21",
  "categoria": "Bebidas",
  "unidade": "UN",
  "quantidade_atual": 250,
  "estoques": {
    "Região 1": 100,
    "Região 2": 75,
    "Região 3": 45,
    "Região 4": 20,
    "Região 5": 10,
    "Região 6": 0
  },
  "criado_em": "2024-01-15T10:30:00",
  "ativo": true
}
```

### Atualizar item
```http
PUT /api/itens/1
Content-Type: application/json

{
  "descricao": "Água Filtrada 1.5L",
  "quantidade_atual": 300,
  "estoques": {
    "Região 1": 150,
    "Região 2": 100,
    "Região 3": 50
  }
}
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Item atualizado com sucesso",
  "auditoria_id": 1235
}
```

### Atualizar apenas estoques
```http
PUT /api/alimentacao/item/1/estoque
Content-Type: application/json

{
  "estoques": {
    "Região 1": 200,
    "Região 2": 150,
    "Região 3": 75,
    "Região 4": 40,
    "Região 5": 20,
    "Região 6": 10
  }
}
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Estoques atualizados com sucesso",
  "auditoria_id": 1236
}
```

### Deletar item
```http
DELETE /api/itens/1
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Item deletado com sucesso",
  "auditoria_id": 1237
}
```

## 📋 Ordens de Serviço

### Listar todas O.S.
```http
GET /api/os
```

**Query Parameters**:
- `detentora_id` (opcional): Filtrar por detentora
- `status` (opcional): EM_PROGRESSO, CONCLUIDA, CANCELADA
- `page` (opcional): Página (padrão: 1)

**Resposta (200 OK)**:
```json
{
  "ordens": [
    {
      "id": 1,
      "numero": "001/2025",
      "detentora_id": 5,
      "detentora_nome": "Empresa XYZ",
      "data_emissao": "2025-01-15",
      "evento": "Reunião Diretoria",
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
  ],
  "total": 120,
  "page": 1,
  "pages": 3
}
```

### Criar nova O.S.
```http
POST /api/os
Content-Type: application/json

{
  "detentora_id": 5,
  "evento": "Reunião Diretoria",
  "responsavel": "João Silva",
  "data_evento": "2025-01-20",
  "itens": [
    {
      "item_id": 1,
      "quantidade": 50,
      "valor_unitario": 3.50
    },
    {
      "item_id": 2,
      "quantidade": 100,
      "valor_unitario": 2.00
    }
  ]
}
```

**Resposta (201 Created)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Ordem de Serviço criada com sucesso",
  "numero": "001/2025",
  "id": 121,
  "auditoria_id": 1238
}
```

### Obter O.S. específica
```http
GET /api/os/1
```

**Resposta (200 OK)**:
```json
{
  "id": 1,
  "numero": "001/2025",
  "detentora": {
    "id": 5,
    "nome": "Empresa XYZ",
    "cnpj": "12.345.678/0001-90",
    "contato": "contato@empresa.com"
  },
  "data_emissao": "2025-01-15",
  "evento": "Reunião Diretoria",
  "responsavel": "João Silva",
  "data_evento": "2025-01-20",
  "itens": [
    {
      "id": 1,
      "item_id": 1,
      "descricao": "Água 1.5L",
      "quantidade": 50,
      "valor_unitario": 3.50,
      "subtotal": 175.00
    }
  ],
  "total": 175.00,
  "observacoes": "Entrega até 18h",
  "status": "CONCLUIDA"
}
```

### Atualizar O.S.
```http
PUT /api/os/1
Content-Type: application/json

{
  "evento": "Reunião Diretoria Atualizada",
  "responsavel": "Maria Silva",
  "observacoes": "Entrega até 19h",
  "itens": [
    {
      "item_id": 1,
      "quantidade": 60,
      "valor_unitario": 3.50
    }
  ],
  "status": "CONCLUIDA"
}
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Ordem de Serviço atualizada com sucesso",
  "auditoria_id": 1239
}
```

### Gerar PDF da O.S.
```http
GET /api/os/1/pdf
```

**Resposta**: Arquivo PDF (Content-Type: application/pdf)

### Deletar O.S.
```http
DELETE /api/os/1
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Ordem de Serviço deletada com sucesso",
  "auditoria_id": 1240
}
```

## 🏢 Detentoras

### Listar detentoras
```http
GET /api/detentoras
```

**Query Parameters**:
- `ativo` (opcional): true/false
- `page` (opcional): Página
- `search` (opcional): Buscar por nome/CNPJ

**Resposta (200 OK)**:
```json
{
  "detentoras": [
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
  ],
  "total": 45
}
```

### Criar detentora
```http
POST /api/detentoras
Content-Type: application/json

{
  "nome": "Nova Empresa",
  "cnpj": "98.765.432/0001-11",
  "contato": "novo@empresa.com",
  "telefone": "(11) 99999-9999",
  "grupo": "Standard",
  "vigencia_inicio": "2025-01-01",
  "vigencia_fim": "2025-12-31",
  "responsavel": "Maria Silva"
}
```

**Resposta (201 Created)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Detentora criada com sucesso",
  "id": 46,
  "auditoria_id": 1241
}
```

### Atualizar detentora
```http
PUT /api/detentoras/5
Content-Type: application/json

{
  "nome": "Empresa XYZ Atualizada",
  "contato": "novo@empresa.com",
  "vigencia_fim": "2025-12-31"
}
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Detentora atualizada com sucesso",
  "auditoria_id": 1242
}
```

### Deletar detentora
```http
DELETE /api/detentoras/5
```

**Resposta (200 OK)** ⭐ **COM AUDITORIA**:
```json
{
  "message": "Detentora deletada com sucesso",
  "auditoria_id": 1243
}
```

## 📊 Auditoria (Admin Only)

### Listar registros de auditoria
```http
GET /api/auditoria/?usuario_id=1&modulo=ITEM&acao=UPDATE&data_inicio=2025-01-01&data_fim=2025-01-31&page=1
```

**Query Parameters**:
- `usuario_id` (opcional): Filtrar por usuário
- `modulo` (opcional): ITEM, OS, DETENTORA
- `acao` (opcional): CREATE, UPDATE, DELETE
- `data_inicio` (opcional): YYYY-MM-DD
- `data_fim` (opcional): YYYY-MM-DD
- `page` (opcional): Página (padrão: 1)

**Resposta (200 OK)**:
```json
{
  "auditoria": [
    {
      "id": 1,
      "usuario": {
        "id": 1,
        "email": "admin@example.com"
      },
      "acao": "UPDATE",
      "modulo": "ITEM",
      "descricao": "Atualizou estoques do item: Água 1.5L",
      "entidade_tipo": "itens",
      "entidade_id": 1,
      "dados_antes": {
        "id": 1,
        "descricao": "Água 1.5L",
        "quantidade_atual": 200
      },
      "dados_depois": {
        "id": 1,
        "descricao": "Água 1.5L",
        "quantidade_atual": 250
      },
      "ip_address": "192.168.1.100",
      "data_hora": "2025-01-15T14:30:45"
    }
  ],
  "total": 542,
  "page": 1,
  "pages": 11
}
```

### Estatísticas de auditoria
```http
GET /api/auditoria/estatisticas
```

**Resposta (200 OK)**:
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

### Usuários que fizeram ações
```http
GET /api/auditoria/usuarios
```

**Resposta (200 OK)**:
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

## ❌ Códigos de Erro

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| 400 | Bad Request | JSON inválido |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão (admin required) |
| 404 | Not Found | Recurso não existe |
| 409 | Conflict | Violação de constraint (ex: CNPJ duplicado) |
| 422 | Unprocessable Entity | Validação falhou |
| 500 | Server Error | Erro interno |

**Exemplo de erro (400)**:
```json
{
  "error": "Validação falhou",
  "details": {
    "descricao": "Campo obrigatório",
    "codigo_bec": "Formato inválido"
  }
}
```

## 🔄 Fluxo Completo: Criar O.S. com Auditoria

```
1. POST /login
   ├─ Usuário se autentica
   └─ Session criada

2. POST /api/os
   ├─ Sistema valida dados
   ├─ Cria registro na tabela 'ordens_servico'
   ├─ Cria registros em 'items_ordem_servico'
   ├─ COMMIT na transação
   ├─ Registra em 'auditoria' com dados_antes=null, dados_depois=<dados criados>
   └─ Resposta 201 Created

3. GET /api/auditoria/?modulo=OS&acao=CREATE&page=1
   ├─ Admin filtra auditoria
   ├─ Visualiza novo registro
   └─ Pode ver detalhes (dados antes/depois)

4. GET /api/os/1/pdf
   ├─ Sistema gera PDF com dados
   └─ Download arquivo
```

## 💡 Dicas de Uso

✅ **Sempre validar resposta antes de usar dados**

```javascript
if (response.status === 200) {
  const data = response.json();
  console.log(data);
}
```

✅ **Usar filtros para reduzir dados**

```javascript
// ❌ Ruim - traz todos os itens
GET /api/itens

// ✅ Bom - traz apenas itens de uma categoria
GET /api/itens?categoria=Bebidas&page=1
```

✅ **Verificar se usuário é admin antes de acessar auditoria**

```javascript
// Cliente-side
const isAdmin = user.perfil === 'ADMIN';
if (isAdmin) {
  window.location.href = '/api/auditoria/view';
}
```

---

**Documentação versão 2.0.0 - Atualizado em Novembro 2025**
