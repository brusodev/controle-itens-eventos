# 📁 Scripts e Utilitários do Projeto

**Versão**: 2.0.0  
**Data**: Novembro 2025  
**Localização**: `backend/scripts/`

---

## 🗂️ Estrutura de Scripts

```
backend/scripts/
├── admin/                    # Administração do sistema
├── diagnostico/             # Diagnosticar problemas
├── migracao/                # Migração e correção de dados
├── testes/                  # Testes de funcionalidades
├── utilitarios/             # Scripts utilitários
├── relatorios/              # Gerar relatórios
└── README.md                # Este arquivo
```

---

## 📋 Scripts por Categoria

### 1️⃣ Admin (`admin/`)

Scripts de **administração e configuração** do sistema.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **criar_admin.py** | Criar usuário administrador | `python scripts/admin/criar_admin.py` |

**Exemplo**:
```bash
cd backend
python scripts/admin/criar_admin.py
# Segue instruções interativas para criar admin
```

---

### 2️⃣ Diagnóstico (`diagnostico/`)

Scripts para **identificar e diagnosticar problemas** no sistema.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **check_admin.py** | Verificar dados de admin | `python scripts/diagnostico/check_admin.py` |
| **check_os_5.py** | Verificar dados O.S. 5 | `python scripts/diagnostico/check_os_5.py` |
| **check_os_20.py** | Verificar dados O.S. 20 | `python scripts/diagnostico/check_os_20.py` |
| **check_os11.py** | Verificar dados O.S. 11 | `python scripts/diagnostico/check_os11.py` |
| **check_os11_v2.py** | Verificar dados O.S. 11 (v2) | `python scripts/diagnostico/check_os11_v2.py` |
| **check_wafer.py** | Verificar dados de wafers | `python scripts/diagnostico/check_wafer.py` |
| **verificar_agua.py** | Verificar estoque de água | `python scripts/diagnostico/verificar_agua.py` |
| **verificar_estoque_wafer.py** | Verificar estoque de wafers | `python scripts/diagnostico/verificar_estoque_wafer.py` |
| **verificar_item_os12.py** | Verificar item em O.S. 12 | `python scripts/diagnostico/verificar_item_os12.py` |
| **verificar_kit_lanche.py** | Verificar kit lanche | `python scripts/diagnostico/verificar_kit_lanche.py` |
| **verificar_movimentacoes_os4.py** | Verificar movimentações O.S. 4 | `python scripts/diagnostico/verificar_movimentacoes_os4.py` |
| **verificar_os11.py** | Verificar O.S. 11 | `python scripts/diagnostico/verificar_os11.py` |
| **verificar_os_14.py** | Verificar O.S. 14 | `python scripts/diagnostico/verificar_os_14.py` |
| **verificar_os_15.py** | Verificar O.S. 15 | `python scripts/diagnostico/verificar_os_15.py` |
| **verificar_os_banco.py** | Verificar todas O.S. no banco | `python scripts/diagnostico/verificar_os_banco.py` |
| **verificar_senha.py** | Verificar dados de senha | `python scripts/diagnostico/verificar_senha.py` |
| **verificar_total_cb1.py** | Verificar total CB1 | `python scripts/diagnostico/verificar_total_cb1.py` |
| **diagnosticar_detentoras.py** | Diagnosticar problemas em detentoras | `python scripts/diagnostico/diagnosticar_detentoras.py` |
| **diagnosticar_movimentacoes.py** | Diagnosticar movimentações | `python scripts/diagnostico/diagnosticar_movimentacoes.py` |
| **diagnosticar_os4.py** | Diagnosticar O.S. 4 | `python scripts/diagnostico/diagnosticar_os4.py` |
| **diagnosticar_wafer.py** | Diagnosticar wafers | `python scripts/diagnostico/diagnosticar_wafer.py` |
| **diagnostico_completo.py** | Diagnóstico completo do sistema | `python scripts/diagnostico/diagnostico_completo.py` |
| **investigar_os11.py** | Investigar O.S. 11 em profundidade | `python scripts/diagnostico/investigar_os11.py` |
| **investigar_os12.py** | Investigar O.S. 12 em profundidade | `python scripts/diagnostico/investigar_os12.py` |
| **procurar_os_kit.py** | Procurar O.S. com kit | `python scripts/diagnostico/procurar_os_kit.py` |

**Quando usar?**
- Suspeita de dados corrompidos
- Investigar problema específico
- Audit trail de dados
- Validar integridade

**Exemplo**:
```bash
# Diagnóstico completo
python scripts/diagnostico/diagnostico_completo.py

# Verificar O.S. específica
python scripts/diagnostico/check_os_5.py

# Investigar problema
python scripts/diagnostico/investigar_os11.py
```

---

### 3️⃣ Migração (`migracao/`)

Scripts para **migrar, corrigir e transformar dados**.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **migrar_detentoras.py** | Migrar dados de detentoras | `python scripts/migracao/migrar_detentoras.py` |
| **migrar_perfil.py** | Migrar dados de perfil | `python scripts/migracao/migrar_perfil.py` |
| **corrigir_detentora_id.py** | Corrigir ID de detentora | `python scripts/migracao/corrigir_detentora_id.py` |
| **corrigir_item_ids_os.py** | Corrigir IDs de items em O.S. | `python scripts/migracao/corrigir_item_ids_os.py` |
| **corrigir_movimentacao_os4.py** | Corrigir movimentação O.S. 4 | `python scripts/migracao/corrigir_movimentacao_os4.py` |
| **corrigir_os4_v2.py** | Corrigir O.S. 4 (v2) | `python scripts/migracao/corrigir_os4_v2.py` |
| **corrigir_os5.py** | Corrigir O.S. 5 | `python scripts/migracao/corrigir_os5.py` |
| **corrigir_os11_agua.py** | Corrigir O.S. 11 agua | `python scripts/migracao/corrigir_os11_agua.py` |
| **corrigir_os12.py** | Corrigir O.S. 12 | `python scripts/migracao/corrigir_os12.py` |
| **processar_estoque_os4.py** | Processar estoque O.S. 4 | `python scripts/migracao/processar_estoque_os4.py` |
| **completar_estoque_regioes.py** | Completar estoque em regiões | `python scripts/migracao/completar_estoque_regioes.py` |

⚠️ **CUIDADO**: Estes scripts **modificam dados**! Fazer backup antes.

**Quando usar?**
- Após detecção de problema via diagnóstico
- Importar dados de sistema anterior
- Fazer data cleanup
- Corrigir inconsistências

**Exemplo**:
```bash
# PRIMEIRO: fazer diagnóstico
python scripts/diagnostico/diagnostico_completo.py

# DEPOIS: se problema confirmado
python scripts/migracao/corrigir_os5.py

# OU: migrar dados de novo sistema
python scripts/migracao/migrar_detentoras.py
```

---

### 4️⃣ Testes (`testes/`)

Scripts para **testar funcionalidades** do sistema.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **teste_alterar_senha.py** | Testar alteração de senha | `python scripts/testes/teste_alterar_senha.py` |
| **teste_api_alimentacao.py** | Testar API de alimentação | `python scripts/testes/teste_api_alimentacao.py` |
| **teste_api_usuario.py** | Testar API de usuário | `python scripts/testes/teste_api_usuario.py` |
| **teste_completo_itens.py** | Teste completo de items | `python scripts/testes/teste_completo_itens.py` |
| **testar_pdf_final.py** | Testar geração de PDF | `python scripts/testes/testar_pdf_final.py` |
| **testar_preco_api.py** | Testar preço via API | `python scripts/testes/testar_preco_api.py` |
| **testar_preco_pdf.py** | Testar preço em PDF | `python scripts/testes/testar_preco_pdf.py` |

**Quando usar?**
- Verificar se funcionalidade está ok
- Testar após alteração de código
- Validar integração
- QA/teste antes de deploy

**Exemplo**:
```bash
# Testar API
python scripts/testes/teste_api_usuario.py

# Testar PDF
python scripts/testes/testar_pdf_final.py

# Teste completo
python scripts/testes/teste_completo_itens.py
```

---

### 5️⃣ Utilitários (`utilitarios/`)

Scripts **utilitários gerais** para manipulação de dados.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **adicionar_coluna_preco.py** | Adicionar coluna de preço | `python scripts/utilitarios/adicionar_coluna_preco.py` |
| **adicionar_estoque_wafer.py** | Adicionar estoque de wafer | `python scripts/utilitarios/adicionar_estoque_wafer.py` |
| **adicionar_preco_agua.py** | Adicionar preço de água | `python scripts/utilitarios/adicionar_preco_agua.py` |
| **adicionar_precos_exemplo.py** | Adicionar preços de exemplo | `python scripts/utilitarios/adicionar_precos_exemplo.py` |
| **listar_precos.py** | Listar todos os preços | `python scripts/utilitarios/listar_precos.py` |

**Quando usar?**
- Adicionar dados iniciais
- Exemplo de dados
- Setup de novo ambiente
- Manutenção de dados

**Exemplo**:
```bash
# Adicionar preços de exemplo
python scripts/utilitarios/adicionar_precos_exemplo.py

# Listar preços
python scripts/utilitarios/listar_precos.py
```

---

### 6️⃣ Relatórios (`relatorios/`)

Scripts para **gerar relatórios** do sistema.

| Script | Descrição | Uso |
|--------|-----------|-----|
| **relatorio_estoque.py** | Relatório de estoque | `python scripts/relatorios/relatorio_estoque.py` |
| **relatorio_completo_estoque.py** | Relatório completo de estoque | `python scripts/relatorios/relatorio_completo_estoque.py` |

**Quando usar?**
- Gerar relatório de estoque
- Exportar dados
- Auditoria
- Análise

**Exemplo**:
```bash
# Gerar relatório completo
python scripts/relatorios/relatorio_completo_estoque.py

# Gerar relatório simples
python scripts/relatorios/relatorio_estoque.py
```

---

## 🚀 Como Usar

### Executar um script

**Opção 1: Direto (a partir de backend)**
```bash
cd backend
python scripts/diagnostico/diagnostico_completo.py
```

**Opção 2: Com caminho relativo**
```bash
cd backend
python -m scripts.diagnostico.diagnostico_completo
```

**Opção 3: Criar alias (Windows)**
```powershell
# No seu perfil PowerShell
function diagnostico { python .\scripts\diagnostico\diagnostico_completo.py }
diagnostico  # executar depois
```

### Fluxo recomendado

```
1. Suspeita de problema?
   ↓
   python scripts/diagnostico/diagnostico_completo.py

2. Problema confirmado?
   ↓
   python scripts/diagnostico/verificar_xxx.py  (mais específico)

3. Sabe o que corrigir?
   ↓
   python scripts/migracao/corrigir_xxx.py

4. Quer testar?
   ↓
   python scripts/testes/teste_xxx.py

5. Gerar relatório?
   ↓
   python scripts/relatorios/relatorio_xxx.py
```

---

## 📝 Convenções

### Nomes de arquivo
- `diagnosticar_` ou `verificar_` - Scripts de diagnóstico
- `corrigir_` - Scripts que modificam dados
- `testar_` ou `teste_` - Scripts de teste
- `adicionar_` - Scripts que adicionam dados
- `migrar_` - Scripts que migram dados
- `relatorio_` - Scripts que geram relatórios

### Estrutura de imports

Todos os scripts devem importar do `app.py` assim:

```python
import sys
from pathlib import Path

# Adicionar backend ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app, db, Usuario, Item, OrdenServico, Detentora
```

---

## ⚠️ Segurança

### ✅ Fazer SEMPRE:
- Backup do banco ANTES de rodar scripts de correção
- Teste em ambiente de desenvolvimento PRIMEIRO
- Verificar logs/output para erros
- Documentar o que fez

### ❌ NÃO fazer:
- Rodar `corrigir_*.py` em produção sem backup
- Executar múltiplos scripts simultaneamente
- Modificar scripts sem entender o que fazem
- Deixar scripts em venv ativo (conflicts)

---

## 🔍 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'app'"

**Causa**: Estar na pasta errada

**Solução**:
```bash
# Certifique-se de estar em backend/
cd backend
# Depois execute
python scripts/diagnostico/diagnostico_completo.py
```

### Erro: "database is locked"

**Causa**: App.py rodando simultaneamente

**Solução**:
1. Fechar Flask/servidor
2. Fechar navegador
3. Aguardar 10 segundos
4. Tentar novamente

### Erro: "Permission denied"

**Causa**: Arquivo em uso

**Solução**:
```bash
# Fechar qualquer editor/IDE
# Fechar VSCode/PyCharm
# Tentar novamente
```

---

## 📚 Scripts Documentados

Cada script tem **docstring** explicando:
- O que faz
- Como usar
- Parâmetros
- Resultado esperado

**Ver docstring**:
```bash
python -c "import scripts.diagnostico.diagnostico_completo; help(scripts.diagnostico.diagnostico_completo)"
```

---

## 🎯 Quick Reference

| Necessidade | Script |
|-------------|--------|
| Começar do zero | `scripts/admin/criar_admin.py` |
| Diagnosticar tudo | `scripts/diagnostico/diagnostico_completo.py` |
| Verificar O.S. específica | `scripts/diagnostico/check_os_XX.py` |
| Corrigir problema | `scripts/migracao/corrigir_XX.py` |
| Testar funcionalidade | `scripts/testes/teste_XX.py` |
| Ver estoque | `scripts/relatorios/relatorio_completo_estoque.py` |
| Listar preços | `scripts/utilitarios/listar_precos.py` |

---

## 📞 Suporte

### Script faz algo estranho?
1. Verificar output completo (pode ter scroll para cima)
2. Rodar `diagnostico_completo.py` para contexto
3. Verificar comentários no script
4. Consultar logs do Flask

### Quer criar novo script?
1. Escolher categoria apropriada
2. Seguir convenção de nome
3. Adicionar docstring completa
4. Testar antes de adicionar
5. Atualizar este README

---

**Scripts organizados em: Novembro 2025**  
**Status**: ✅ Estrutura criada e documentada
