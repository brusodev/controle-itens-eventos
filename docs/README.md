# Backend - Sistema de Controle de Itens e Eventos

Backend Flask com SQLite para gerenciar estoque de itens e ordens de serviço.

## 📋 Estrutura do Banco de Dados

### Tabelas

1. **categorias** - Categorias de itens (ex: coffee_break_bebidas_quentes)
   - `id`, `nome`, `tipo`, `natureza`

2. **itens** - Itens do estoque/alimentação
   - `id`, `categoria_id`, `item_codigo`, `descricao`, `unidade`

3. **estoque_regional** - Controle de estoque por região (1 a 6)
   - `id`, `item_id`, `regiao_numero`, `quantidade_inicial`, `quantidade_gasto`

4. **ordens_servico** - Ordens de Serviço emitidas
   - `id`, `numero_os`, `contrato`, `detentora`, `cnpj`, `evento`, `data`, `local`, `justificativa`, `gestor_contrato`, `fiscal_contrato`, `data_emissao`

5. **itens_ordem_servico** - Itens utilizados em cada O.S.
   - `id`, `ordem_servico_id`, `item_id`, `categoria`, `item_codigo`, `descricao`, `unidade`, `quantidade_total`

## 🚀 Instalação e Configuração

### 1. Criar ambiente virtual

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
```

### 2. Instalar dependências

```powershell
pip install -r requirements.txt
```

### 3. Migrar dados do JSON para SQLite

```powershell
python migrate_data.py
```

### 4. Executar o servidor

```powershell
python app.py
```

O servidor estará rodando em: `http://localhost:5000`

## 📡 API Endpoints

### Itens

- `GET /api/itens/` - Lista todos os itens
- `GET /api/itens/<id>` - Obtém item específico
- `POST /api/itens/` - Cria novo item
- `PUT /api/itens/<id>` - Atualiza item
- `DELETE /api/itens/<id>` - Deleta item

**Parâmetros de query:**
- `categoria_id` - Filtrar por categoria
- `tipo` - Filtrar por tipo (alimentacao, estoque)

### Alimentação

- `GET /api/alimentacao/` - Lista todos os itens de alimentação organizados
- `GET /api/alimentacao/categorias` - Lista categorias de alimentação
- `POST /api/alimentacao/categorias` - Cria nova categoria
- `GET /api/alimentacao/filtrar?categoria=&busca=` - Filtra itens
- `PUT /api/alimentacao/item/<id>/estoque` - Atualiza estoque de um item
- `GET /api/alimentacao/resumo?regiao=` - Resumo de estoque

### Ordens de Serviço

- `GET /api/ordens-servico/` - Lista todas as O.S.
- `GET /api/ordens-servico/<id>` - Obtém O.S. específica
- `POST /api/ordens-servico/` - Cria nova O.S. (atualiza estoque automaticamente)
- `DELETE /api/ordens-servico/<id>?reverter_estoque=true` - Deleta O.S.
- `GET /api/ordens-servico/estatisticas` - Estatísticas gerais

**Parâmetros de query:**
- `busca` - Busca por número, evento ou detentora

## 📦 Exemplo de Requisições

### Criar Ordem de Serviço

```json
POST /api/ordens-servico/
{
  "numeroOS": "1/2025",
  "contrato": "123/2024",
  "detentora": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90",
  "evento": "Workshop de Capacitação",
  "data": "25 à 28/08/2025",
  "local": "Auditório Central",
  "justificativa": "Evento de capacitação...",
  "gestorContrato": "João Silva",
  "fiscalContrato": "Maria Santos",
  "itens": [
    {
      "categoria": "coffee_break_bebidas_quentes",
      "itemId": "1",
      "descricao": "Coffee Break Tipo 1",
      "unidade": "Pessoa",
      "qtdTotal": 50
    }
  ]
}
```

### Atualizar Estoque de Item

```json
PUT /api/alimentacao/item/1/estoque
{
  "1": {
    "inicial": "20000",
    "gasto": "100"
  },
  "2": {
    "inicial": "800",
    "gasto": "50"
  }
}
```

## 🔧 Estrutura de Arquivos

```
backend/
├── app.py                  # Aplicação Flask principal
├── models.py               # Modelos SQLAlchemy
├── migrate_data.py         # Script de migração
├── requirements.txt        # Dependências
├── routes/
│   ├── itens_routes.py     # Rotas de itens
│   ├── alimentacao_routes.py  # Rotas de alimentação
│   └── os_routes.py        # Rotas de ordens de serviço
└── controle_itens.db       # Banco SQLite (gerado)
```

## 🔒 CORS

O backend está configurado com Flask-CORS para aceitar requisições do frontend em qualquer origem durante desenvolvimento.

## 🛠️ Próximos Passos

1. Atualizar o frontend (app.js) para fazer requisições ao backend
2. Remover localStorage e uso de itens.json
3. Implementar autenticação (se necessário)
4. Adicionar logs de auditoria
5. Implementar backup automático do banco
