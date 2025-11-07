# 🗄️ Documentação do Banco de Dados

**Banco Suportado**: SQLite (desenvolvimento) e PostgreSQL (produção)  
**Versão**: 2.0.0  
**Última atualização**: Novembro 2025

## 📊 Diagrama ER (Entity Relationship)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  usuario    │         │   auditoria      │         │   categoria │
├─────────────┤         ├──────────────────┤         ├─────────────┤
│ id (PK)     │◄────────│ usuario_id (FK)  │         │ id (PK)     │
│ email       │         │ acao             │         │ nome        │
│ senha_hash  │         │ modulo           │         │ descricao   │
│ perfil      │         │ descricao        │         │ criada_em   │
│ criado_em   │         │ entidade_tipo    │         └─────────────┘
└─────────────┘         │ entidade_id      │
                        │ dados_antes (JSON)
        ▲               │ dados_depois (JSON)
        │               │ ip_address
        │               │ user_agent
        │               │ data_hora (PK)
        │               └──────────────────┘
        │
   ┌────┴──────────────────────┬─────────────────────────┐
   │                           │                         │
┌──┴──────────┐        ┌───────┴──────┐        ┌────────┴─────┐
│   itens     │        │ detentoras   │        │ ordens_serv. │
├─────────────┤        ├──────────────┤        ├──────────────┤
│ id (PK)     │        │ id (PK)      │        │ id (PK)      │
│ descricao   │        │ nome         │◄───────│ detentora_id │
│ cod_bec     │        │ cnpj         │        │ numero       │
│ categoria_id├──┐     │ contato      │        │ data_emissao │
│ unidade     │  │     │ telefone     │        │ evento       │
│ qtd_atual   │  │     │ grupo        │        │ responsavel  │
│ ativo       │  │     │ vigencia_ini │        │ total        │
│ criado_em   │  │     │ vigencia_fim │        │ status       │
└─────────────┘  │     │ responsavel  │        │ criado_em    │
       ▲          │     │ ativo        │        └──────────────┘
       │          │     │ criado_em    │              ▲
       │          │     └──────────────┘              │
       │          │                                   │
       │          └────────────────────────────────────┘
       │
       │         FK relationship
   ┌───┴────────────────────────┐
   │                            │
┌──┴──────────────────┐    ┌───┴──────────────┐
│ estoques_regionais  │    │  itens_ordem_ser │
├─────────────────────┤    ├──────────────────┤
│ id (PK)             │    │ id (PK)          │
│ item_id (FK)────────┼────│ ordem_id (FK)────┼─→ ordens_serv.id
│ regiao              │    │ item_id (FK)─────┼─→ itens.id
│ quantidade          │    │ quantidade       │
│ criado_em           │    │ valor_unitario   │
└─────────────────────┘    │ criado_em        │
                           └──────────────────┘
```

## 📋 Tabelas Detalhadas

### 1️⃣ usuario

**Descrição**: Armazena credenciais e dados de usuários do sistema.

```sql
CREATE TABLE usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL DEFAULT 'USUARIO',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identificador único |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email (login) |
| senha_hash | VARCHAR(255) | NOT NULL | Senha criptografada (SHA256) |
| perfil | VARCHAR(50) | NOT NULL, DEFAULT='USUARIO' | ADMIN ou USUARIO |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Índices**:
```sql
CREATE UNIQUE INDEX idx_usuario_email ON usuario(email);
```

**Dados de exemplo**:
```json
{
  "id": 1,
  "email": "admin@example.com",
  "perfil": "ADMIN",
  "criado_em": "2024-01-01T08:00:00"
}
```

---

### 2️⃣ categoria

**Descrição**: Categorias de itens de estoque (Bebidas, Alimentos, etc).

```sql
CREATE TABLE categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| nome | VARCHAR(100) | NOT NULL, UNIQUE | Nome da categoria |
| descricao | TEXT | | Descrição opcional |
| criada_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Dados padrão**:
```json
[
  {"id": 1, "nome": "Bebidas", "descricao": "Água, sucos, refrigerantes"},
  {"id": 2, "nome": "Alimentos", "descricao": "Alimentos diversos"},
  {"id": 3, "nome": "Utensílios", "descricao": "Talheres, pratos, copos"}
]
```

---

### 3️⃣ itens

**Descrição**: Itens de estoque que podem ser usados em Ordens de Serviço.

```sql
CREATE TABLE itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao VARCHAR(255) NOT NULL,
    codigo_bec VARCHAR(50),
    categoria_id INTEGER,
    unidade VARCHAR(10) DEFAULT 'UN',
    quantidade_atual INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE SET NULL
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| descricao | VARCHAR(255) | NOT NULL | Nome do item |
| codigo_bec | VARCHAR(50) | | Código BEC/natureza da despesa |
| categoria_id | INTEGER | FK → categoria | Categoria do item |
| unidade | VARCHAR(10) | DEFAULT='UN' | Unidade (UN, L, KG, etc) |
| quantidade_atual | INTEGER | DEFAULT=0 | Total em estoque |
| ativo | BOOLEAN | DEFAULT=1 | Ativo (1) ou inativo (0) |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Índices**:
```sql
CREATE INDEX idx_itens_categoria ON itens(categoria_id);
CREATE INDEX idx_itens_ativo ON itens(ativo);
```

**Dados de exemplo**:
```json
{
  "id": 1,
  "descricao": "Água 1.5L",
  "codigo_bec": "3.3.90.30.21",
  "categoria_id": 1,
  "unidade": "UN",
  "quantidade_atual": 250,
  "ativo": 1
}
```

---

### 4️⃣ estoques_regionais

**Descrição**: Estoque de cada item divido por 6 regiões.

```sql
CREATE TABLE estoques_regionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    regiao VARCHAR(50) NOT NULL,
    quantidade INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE,
    UNIQUE(item_id, regiao)
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| item_id | INTEGER | NOT NULL, FK → itens | Item referenciado |
| regiao | VARCHAR(50) | NOT NULL | Região (1-6) |
| quantidade | INTEGER | DEFAULT=0 | Quantidade nesta região |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Constraint Único**: (item_id, regiao) - não pode ter 2 registros do mesmo item + região

**Índices**:
```sql
CREATE INDEX idx_estoques_item ON estoques_regionais(item_id);
CREATE INDEX idx_estoques_regiao ON estoques_regionais(regiao);
```

**Dados de exemplo**:
```json
[
  {"item_id": 1, "regiao": "Região 1", "quantidade": 100},
  {"item_id": 1, "regiao": "Região 2", "quantidade": 75},
  {"item_id": 1, "regiao": "Região 3", "quantidade": 45}
]
```

---

### 5️⃣ detentoras

**Descrição**: Empresas fornecedoras/contratantes.

```sql
CREATE TABLE detentoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    contato VARCHAR(255),
    telefone VARCHAR(20),
    grupo VARCHAR(100),
    vigencia_inicio DATE,
    vigencia_fim DATE,
    responsavel VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| nome | VARCHAR(255) | NOT NULL | Nome da empresa |
| cnpj | VARCHAR(20) | UNIQUE | CNPJ (XX.XXX.XXX/0001-XX) |
| contato | VARCHAR(255) | | Email de contato |
| telefone | VARCHAR(20) | | Telefone |
| grupo | VARCHAR(100) | | Grupo/classificação |
| vigencia_inicio | DATE | | Data início validade |
| vigencia_fim | DATE | | Data fim validade |
| responsavel | VARCHAR(255) | | Responsável na empresa |
| ativo | BOOLEAN | DEFAULT=1 | Ativa (1) ou inativa (0) |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Índices**:
```sql
CREATE UNIQUE INDEX idx_detentoras_cnpj ON detentoras(cnpj);
CREATE INDEX idx_detentoras_ativo ON detentoras(ativo);
```

**Dados de exemplo**:
```json
{
  "id": 5,
  "nome": "Empresa XYZ Ltda",
  "cnpj": "12.345.678/0001-90",
  "contato": "contato@empresa.com",
  "telefone": "(11) 98765-4321",
  "grupo": "Premium",
  "vigencia_inicio": "2025-01-01",
  "vigencia_fim": "2025-12-31",
  "responsavel": "João Silva",
  "ativo": 1
}
```

---

### 6️⃣ ordens_servico

**Descrição**: Ordens de Serviço emitidas para eventos.

```sql
CREATE TABLE ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    detentora_id INTEGER NOT NULL,
    data_emissao DATE NOT NULL,
    evento VARCHAR(255),
    responsavel VARCHAR(255),
    data_evento DATE,
    total DECIMAL(10, 2) DEFAULT 0,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'EM_PROGRESSO',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detentora_id) REFERENCES detentoras(id) ON DELETE RESTRICT
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| numero | VARCHAR(50) | NOT NULL, UNIQUE | Número sequencial (001/2025) |
| detentora_id | INTEGER | NOT NULL, FK → detentoras | Empresa |
| data_emissao | DATE | NOT NULL | Data de emissão |
| evento | VARCHAR(255) | | Tipo de evento |
| responsavel | VARCHAR(255) | | Responsável pelo evento |
| data_evento | DATE | | Data do evento |
| total | DECIMAL(10,2) | DEFAULT=0 | Valor total |
| observacoes | TEXT | | Observações |
| status | VARCHAR(50) | DEFAULT='EM_PROGRESSO' | EM_PROGRESSO, CONCLUIDA, CANCELADA |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de criação |

**Índices**:
```sql
CREATE UNIQUE INDEX idx_ordens_numero ON ordens_servico(numero);
CREATE INDEX idx_ordens_detentora ON ordens_servico(detentora_id);
CREATE INDEX idx_ordens_status ON ordens_servico(status);
```

**Dados de exemplo**:
```json
{
  "id": 1,
  "numero": "001/2025",
  "detentora_id": 5,
  "data_emissao": "2025-01-15",
  "evento": "Reunião Diretoria",
  "responsavel": "João Silva",
  "total": 175.00,
  "status": "CONCLUIDA"
}
```

---

### 7️⃣ itens_ordem_servico

**Descrição**: Items inclusos em cada Ordem de Serviço (muitos-para-muitos).

```sql
CREATE TABLE itens_ordem_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_unitario DECIMAL(10, 2),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ordem_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| ordem_id | INTEGER | NOT NULL, FK → ordens_servico | Ordem referenciada |
| item_id | INTEGER | NOT NULL, FK → itens | Item referenciado |
| quantidade | INTEGER | NOT NULL | Quantidade solicitada |
| valor_unitario | DECIMAL(10,2) | | Preço unitário |
| criado_em | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Data de adição |

**Índices**:
```sql
CREATE INDEX idx_itens_ordem_ordem ON itens_ordem_servico(ordem_id);
CREATE INDEX idx_itens_ordem_item ON itens_ordem_servico(item_id);
```

**Dados de exemplo**:
```json
[
  {
    "ordem_id": 1,
    "item_id": 1,
    "quantidade": 50,
    "valor_unitario": 3.50
  },
  {
    "ordem_id": 1,
    "item_id": 2,
    "quantidade": 100,
    "valor_unitario": 2.00
  }
]
```

---

### 8️⃣ auditoria ⭐ NOVO

**Descrição**: Registro de todas as ações realizadas no sistema.

```sql
CREATE TABLE auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    acao VARCHAR(10) NOT NULL,
    modulo VARCHAR(20) NOT NULL,
    descricao TEXT,
    entidade_tipo VARCHAR(50),
    entidade_id INTEGER,
    dados_antes JSON,
    dados_depois JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL
);
```

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | INTEGER | PRIMARY KEY | Identificador único |
| usuario_id | INTEGER | NOT NULL, FK → usuario | Usuário que fez ação |
| acao | VARCHAR(10) | NOT NULL | CREATE, UPDATE, DELETE |
| modulo | VARCHAR(20) | NOT NULL | ITEM, OS, DETENTORA |
| descricao | TEXT | | Descrição legível da ação |
| entidade_tipo | VARCHAR(50) | | Nome da tabela modificada |
| entidade_id | INTEGER | | ID do registro modificado |
| dados_antes | JSON | | Estado anterior (UPDATE/DELETE) |
| dados_depois | JSON | | Estado novo (CREATE/UPDATE) |
| ip_address | VARCHAR(45) | | IP da requisição |
| user_agent | TEXT | | User-Agent do navegador |
| data_hora | DATETIME | DEFAULT=CURRENT_TIMESTAMP | Timestamp da ação |

**Índices**:
```sql
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_acao ON auditoria(acao);
CREATE INDEX idx_auditoria_modulo ON auditoria(modulo);
CREATE INDEX idx_auditoria_data ON auditoria(data_hora);
```

**Dados de exemplo**:
```json
{
  "id": 1,
  "usuario_id": 1,
  "acao": "UPDATE",
  "modulo": "ITEM",
  "descricao": "Atualizou estoques do item: Água 1.5L",
  "entidade_tipo": "itens",
  "entidade_id": 1,
  "dados_antes": {
    "quantidade_atual": 200,
    "estoques": {"Região 1": 50}
  },
  "dados_depois": {
    "quantidade_atual": 600,
    "estoques": {"Região 1": 600}
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "data_hora": "2025-01-15T14:30:45"
}
```

---

## 🔑 Constraints e Relacionamentos

### Foreign Keys

| Tabela | Campo | Referencia | Comportamento |
|--------|-------|-----------|---------------|
| itens | categoria_id | categoria(id) | SET NULL |
| estoques_regionais | item_id | itens(id) | CASCADE |
| ordens_servico | detentora_id | detentoras(id) | RESTRICT |
| itens_ordem_servico | ordem_id | ordens_servico(id) | CASCADE |
| itens_ordem_servico | item_id | itens(id) | RESTRICT |
| auditoria | usuario_id | usuario(id) | SET NULL |

### Unique Constraints

```sql
usuario.email UNIQUE
detentoras.cnpj UNIQUE
ordens_servico.numero UNIQUE
estoques_regionais(item_id, regiao) UNIQUE
```

## 📊 Exemplos de Queries

### Contar total de itens por categoria
```sql
SELECT c.nome, COUNT(i.id) as total
FROM categoria c
LEFT JOIN itens i ON c.id = i.categoria_id
GROUP BY c.id
ORDER BY total DESC;
```

**Resultado**:
```
nome           total
─────────────  ─────
Bebidas        15
Alimentos      8
Utensílios     5
```

### Somar total de O.S. por detentora
```sql
SELECT d.nome, COUNT(o.id) as total_os, SUM(o.total) as valor_total
FROM detentoras d
LEFT JOIN ordens_servico o ON d.id = o.detentora_id
GROUP BY d.id
ORDER BY valor_total DESC;
```

### Encontrar itens com estoque baixo (< 50)
```sql
SELECT id, descricao, quantidade_atual
FROM itens
WHERE quantidade_atual < 50 AND ativo = 1
ORDER BY quantidade_atual ASC;
```

### Ver últimas ações de um usuário
```sql
SELECT usuario_id, acao, modulo, descricao, data_hora
FROM auditoria
WHERE usuario_id = 1
ORDER BY data_hora DESC
LIMIT 20;
```

### Comparar estoque antes/depois de uma ação
```sql
SELECT 
  id,
  acao,
  descricao,
  data_hora,
  dados_antes->>'$.quantidade_atual' as antes,
  dados_depois->>'$.quantidade_atual' as depois
FROM auditoria
WHERE modulo = 'ITEM' AND entidade_id = 1
ORDER BY data_hora DESC;
```

## 🔒 Backup e Restore

### Backup SQLite
```bash
# Backup completo
cp instance/controle_items.db backups/controle_items_$(date +%Y%m%d_%H%M%S).db

# Dump SQL
sqlite3 instance/controle_items.db .dump > backup.sql
```

### Restore SQLite
```bash
# De arquivo .db
cp backup_file.db instance/controle_items.db

# De dump SQL
sqlite3 instance/controle_items.db < backup.sql
```

### Backup PostgreSQL
```bash
pg_dump -U postgres -d controle_items > backup.sql
```

### Restore PostgreSQL
```bash
psql -U postgres -d controle_items < backup.sql
```

---

**Documentação versão 2.0.0 - Banco de Dados Completo**
