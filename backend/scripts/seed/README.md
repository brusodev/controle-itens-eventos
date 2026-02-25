# 🌱 GUIA DE SEEDS - Controle de Itens e Eventos

Este diretório contém scripts para popular o banco de dados com dados iniciais.

## 📋 Arquivos Disponíveis

### Seeds de Itens/Categorias

1. **seed_coffee_fix.py** - Coffee Break
   - Cria 5 categorias de alimentação
   - Cria 17 itens
   - Usa arquivo: `scripts/itens.json`
   - Estoques para 6 regiões

2. **seed_hospedagem.py** - Hospedagem
   - Cria 2 categorias (pensão completa, meia pensão)
   - Cria 6 itens (apartamentos single/duplo/triplo)
   - Estoques para 6 regiões

3. **seed_organizacao.py** - Organização de Eventos
   - Cria 4 categorias
   - Cria 119 itens
   - Estoques para 3 regiões/grupos

4. **seed_transportes.py** - Transportes
   - Cria 4 categorias
   - Cria 6 itens
   - Estoques para 6 regiões

### Seeds de Detentoras

5. **seed_detentoras_coffee.py** - Detentoras Coffee (4 grupos)
6. **seed_detentoras_hospedagem.py** - Detentoras Hospedagem (2 grupos)
7. **seed_detentoras_organizacao.py** - Detentoras Organização (1 grupo)
8. **seed_detentoras_transporte.py** - Detentoras Transporte (2 grupos)

### Scripts Auxiliares

9. **seed_all.py** - ⭐ Executa todos os seeds na ordem correta
10. **check_database.py** - Verifica o conteúdo atual do banco
11. **extrair_dados_banco.py** - Extrai dados do banco para análise

## 🚀 Como Usar

### Opção 1: Executar Todos os Seeds (RECOMENDADO)

```bash
# No diretório raiz do projeto
cd backend
python scripts/seed/seed_all.py
```

Este script:
- Executa todos os seeds na ordem correta
- Mostra progresso de cada etapa
- Exibe resumo final
- Trata erros automaticamente

### Opção 2: Executar Seeds Individuais

```bash
# No diretório backend
cd backend

# Coffee Break
python scripts/seed/seed_coffee_fix.py
python scripts/seed/seed_detentoras_coffee.py

# Hospedagem
python scripts/seed/seed_hospedagem.py
python scripts/seed/seed_detentoras_hospedagem.py

# Organização
python scripts/seed/seed_organizacao.py
python scripts/seed/seed_detentoras_organizacao.py

# Transporte
python scripts/seed/seed_transportes.py
python scripts/seed/seed_detentoras_transporte.py
```

### Opção 3: Verificar Banco Antes/Depois

```bash
# Verificar estado atual do banco
python scripts/check_database.py

# Executar seeds
python scripts/seed/seed_all.py

# Verificar novamente
python scripts/check_database.py
```

## 📊 Dados que Serão Criados

Ao executar todos os seeds (`seed_all.py`), serão criados:

| Módulo | Categorias | Itens | Detentoras | Estoques |
|--------|-----------|-------|------------|----------|
| Coffee | 5 | 17 | 4 | 102 |
| Hospedagem | 2 | 6 | 2 | 36 |
| Organização | 4 | 119 | 1 | 357 |
| Transporte | 4 | 6 | 2 | 36 |
| **TOTAL** | **15** | **148** | **9** | **531** |

## ⚠️ Importante

### Pré-requisitos

1. **Arquivo itens.json**: O seed de coffee precisa do arquivo `scripts/itens.json`
   - ✅ Este arquivo JÁ EXISTE no repositório

2. **Banco de dados**: Certifique-se de que:
   - O banco está criado e acessível
   - As migrações foram executadas (`flask db upgrade`)
   - Você tem as credenciais corretas no `.env`

### Comportamento dos Seeds

- **Não duplicam dados**: Seeds verificam se itens/categorias/detentoras já existem
- **Idempotentes**: Podem ser executados múltiplas vezes sem problemas
- **Não sobrescrevem**: Se um item já existe, ele é mantido (não atualizado)

### Uso na VPS

Para usar estes seeds na VPS:

```bash
# 1. Conectar na VPS via SSH
ssh usuario@seu-servidor

# 2. Ativar ambiente virtual
cd /caminho/do/projeto
source venv/bin/activate

# 3. Executar seeds
cd backend
python scripts/seed/seed_all.py
```

## 🔧 Troubleshooting

### Erro: "Arquivo itens.json não encontrado"

```bash
# Verifique se o arquivo existe
ls scripts/itens.json

# Se não existir, copie do repositório ou crie
```

### Erro: "Módulo app não encontrado"

```bash
# Certifique-se de estar no diretório backend
cd backend

# Execute diretamente do Python
python scripts/seed/seed_all.py
```

### Erro: "Banco de dados não encontrado"

```bash
# Execute as migrações primeiro
flask db upgrade

# Depois execute os seeds
python scripts/seed/seed_all.py
```

## 📝 Logs e Debug

Para ver mais detalhes durante execução:

```python
# Em seed_all.py, ajuste para mostrar traceback completo
import traceback
traceback.print_exc()
```

## 🔄 Atualização dos Seeds

Se o banco local foi modificado e você quer atualizar os seeds:

```bash
# Extrair dados atuais do banco
python scripts/extrair_dados_banco.py

# Copiar os dados exibidos e atualizar os seeds conforme necessário
```

## 📚 Documentação Adicional

- [RELATORIO_FINAL_SEEDS.md](RELATORIO_FINAL_SEEDS.md) - Análise completa dos seeds
- [ANALISE_SEEDS.md](ANALISE_SEEDS.md) - Comparação seeds vs banco local

## ✅ Status dos Seeds

| Arquivo | Status | Observações |
|---------|--------|-------------|
| seed_coffee_fix.py | ✅ OK | Requer itens.json |
| seed_detentoras_coffee.py | ✅ OK | Dados reais |
| seed_hospedagem.py | ✅ OK | Completo |
| seed_detentoras_hospedagem.py | ✅ OK | Dados reais |
| seed_organizacao.py | ✅ OK | Completo |
| seed_detentoras_organizacao.py | ✅ OK | Dados reais |
| seed_transportes.py | ✅ OK | Inclui todas categorias |
| seed_detentoras_transporte.py | ✅ OK | Dados reais |
| seed_all.py | ✅ OK | Script master |

---

**Última atualização:** 25/02/2026
**Versão:** 2.0
**Alinhado com banco local:** ✅ Sim
