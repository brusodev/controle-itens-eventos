# INSTRUÇÕES DE CORREÇÃO - os_routes.py

## ⚠️ PROBLEMA
O arquivo `backend/routes/os_routes.py` ficou com código duplicado e corrompido após as edições.

## ✅ SOLUÇÃO
Usar o backup criado (`os_routes_backup.py`) e aplicar apenas as alterações necessárias.

---

## 📝 ALTERAÇÕES NECESSÁRIAS

### 1. Adicionar imports no início do arquivo

**LOCALIZAR** (linha ~1-6):
```python
from flask import Blueprint, request, jsonify, send_file
from models import db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, Categoria
from datetime import datetime
from sqlalchemy import func
from pdf_generator import gerar_pdf_os

os_bp = Blueprint('ordens_servico', __name__)
```

**SUBSTITUIR POR**:
```python
from flask import Blueprint, request, jsonify, send_file
from models import db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, Categoria, MovimentacaoEstoque
from datetime import datetime
from sqlalchemy import func
from pdf_generator import gerar_pdf_os
import sys
import os

# Adicionar o diretório utils ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'utils'))
from controle_estoque import (
    processar_baixas_os, 
    reverter_baixa_estoque, 
    ErroEstoqueInsuficiente, 
    ErroRegiaoInvalida,
    obter_relatorio_estoque_por_regiao
)

os_bp = Blueprint('ordens_servico', __name__)
```

---

### 2. Atualizar função `criar_ordem`

**LOCALIZAR a função** `def criar_ordem():` (linha ~75-160)

**ADICIONAR após validação do número da O.S.** (após linha `numero_os_gerado = gerar_proximo_numero_os()`):

```python
        # Validar e obter região do grupo
        grupo = dados.get('grupo')
        try:
            regiao_estoque = int(grupo) if grupo else None
            if not regiao_estoque or regiao_estoque < 1 or regiao_estoque > 6:
                return jsonify({
                    'erro': f'Grupo/Região inválida: {grupo}. Deve ser um número entre 1 e 6.'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'erro': f'Grupo inválido: {grupo}. Deve ser um número entre 1 e 6.'
            }), 400
        
        print(f"🗺️  Região do estoque: {regiao_estoque}")
```

**ADICIONAR no objeto OrdemServico** (adicionar esta linha):
```python
        os = OrdemServico(
            numero_os=numero_os_gerado,
            # ... outros campos ...
            grupo=dados.get('grupo'),
            regiao_estoque=regiao_estoque,  # ✅ ADICIONAR ESTA LINHA
            # ... resto dos campos ...
        )
```

**SUBSTITUIR a seção de atualização de estoque**:

REMOVER:
```python
            # Atualizar estoque
            atualizar_estoque_item(
                categoria_nome=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                quantidade=item_os_data['qtdTotal']
            )
```

ADICIONAR APÓS o loop de criação de itens (após `itens_os.append(item_os)`):
```python
        db.session.flush()  # Garantir que os itens tenham IDs
        
        # ✅ PROCESSAR BAIXAS DE ESTOQUE COM VALIDAÇÃO
        try:
            print(f"\n📦 Processando baixas de estoque para região {regiao_estoque}...")
            movimentacoes = processar_baixas_os(
                ordem_servico_id=os.id,
                itens_os=itens_os,
                regiao_numero=regiao_estoque,
                numero_os=numero_os_gerado
            )
            print(f"✅ {len(movimentacoes)} movimentações de estoque registradas com sucesso!")
            
        except (ErroEstoqueInsuficiente, ErroRegiaoInvalida) as e:
            db.session.rollback()
            print(f"❌ ERRO de estoque: {str(e)}")
            return jsonify({'erro': str(e)}), 400
```

---

### 3. Remover funções obsoletas

**REMOVER completamente** as funções:
- `atualizar_estoque_item()` (se existir)
- `reverter_estoque_item()` (se existir)

Essas funções foram substituídas pelo serviço em `utils/controle_estoque.py`.

---

### 4. (OPCIONAL) Atualizar edição de O.S.

Na função `def editar_ordem(id):` ou `def atualizar_ordem(os_id):`:

**ADICIONAR no início**:
```python
        # Reverter estoque dos itens antigos
        print(f"\n🔄 Revertendo estoque da O.S. {os_id}...")
        reverter_baixa_estoque(os_id)
```

**SUBSTITUIR a seção de atualização de estoque** pela mesma lógica do `criar_ordem`:
```python
        # Processar novas baixas de estoque
        try:
            movimentacoes = processar_baixas_os(
                ordem_servico_id=os.id,
                itens_os=itens_os,
                regiao_numero=os.regiao_estoque,
                numero_os=os.numero_os
            )
        except (ErroEstoqueInsuficiente, ErroRegiaoInvalida) as e:
            db.session.rollback()
            return jsonify({'erro': str(e)}), 400
```

---

### 5. (OPCIONAL) Atualizar exclusão de O.S.

Na função `def deletar_ordem(os_id):`:

**ADICIONAR antes de deletar**:
```python
        # Reverter estoque antes de deletar
        print(f"\n🔄 Revertendo estoque da O.S. {os_id} antes de deletar...")
        reverter_baixa_estoque(os_id)
```

---

## 🎯 RESULTADO ESPERADO

Após as correções:

1. ✅ Ao criar O.S., valida disponibilidade de estoque
2. ✅ Se faltar estoque, retorna erro detalhado e NÃO cria a O.S.
3. ✅ Se tiver estoque, registra movimentações e atualiza estoque
4. ✅ Cada O.S. sabe de qual região consumiu (campo `regiao_estoque`)
5. ✅ Ao editar O.S., reverte estoque antigo e aplica novo
6. ✅ Ao deletar O.S., reverte estoque

---

## 🧪 TESTE RÁPIDO

```bash
# 1. Executar migração
cd backend/migrations
python migrate_add_controle_estoque.py

# 2. Verificar tabela criada
sqlite3 ../instance/database.db
sqlite> .schema movimentacoes_estoque
sqlite> SELECT * FROM ordens_servico LIMIT 1;  # Verificar coluna regiao_estoque
sqlite> .quit

# 3. Reiniciar aplicação
cd ..
python app.py
```

---

## 📞 VERIFICAÇÃO

Após aplicar as correções, testar:

1. **Criar O.S. com estoque suficiente**
   - Deve criar e registrar movimentações

2. **Criar O.S. sem estoque suficiente**
   - Deve rejeitar com mensagem clara

3. **Ver movimentações no banco**
   ```sql
   SELECT * FROM movimentacoes_estoque;
   ```

---

## 🆘 SE DER ERRO

1. Verifique os logs do console (mensagens de DEBUG)
2. Verifique se a migração foi executada
3. Verifique se o arquivo `utils/controle_estoque.py` existe
4. Verifique se não há erros de sintaxe

---

**BOA SORTE! 🚀**
