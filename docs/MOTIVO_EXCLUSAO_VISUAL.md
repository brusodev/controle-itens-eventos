# 🎬 Guia Visual - Motivo de Exclusão de O.S.

## Fluxo da Interface

### ANTES (Antigo)

```
┌─────────────────────────────────────────────────────────────┐
│ LISTA DE ORDENS DE SERVIÇO                                  │
├─────────────────────────────────────────────────────────────┤
│ O.S. #123 - Evento Corporativo                    [Deletar] │
│ O.S. #124 - Coffee Break                          [Deletar] │
│ O.S. #125 - Reunião                               [Deletar] │
└─────────────────────────────────────────────────────────────┘

Admin clica [Deletar]
    ↓
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ATENÇÃO!                                                 │
│                                                              │
│ Deseja realmente EXCLUIR a O.S. #123?                       │
│ - NÃO pode ser desfeita                                     │
│ - Reverterá estoque                                         │
│ - Removerá todos os dados                                   │
│                                                              │
│ [OK] [CANCELAR]                                             │
└─────────────────────────────────────────────────────────────┘

Admin clica OK
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🚨 CONFIRMAÇÃO FINAL                                         │
│                                                              │
│ Tem ABSOLUTA CERTEZA?                                       │
│                                                              │
│ [OK] [CANCELAR]                                             │
└─────────────────────────────────────────────────────────────┘

Admin clica OK
    ↓
✅ O.S. deletada!
```

---

### DEPOIS (Novo)

```
┌─────────────────────────────────────────────────────────────┐
│ LISTA DE ORDENS DE SERVIÇO                                  │
├─────────────────────────────────────────────────────────────┤
│ O.S. #123 - Evento Corporativo                    [Deletar] │
│ O.S. #124 - Coffee Break                          [Deletar] │
│ O.S. #125 - Reunião                               [Deletar] │
└─────────────────────────────────────────────────────────────┘

Admin clica [Deletar]
    ↓
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ATENÇÃO!                                                 │
│                                                              │
│ Deseja realmente EXCLUIR a O.S. #123?                       │
│ - NÃO pode ser desfeita                                     │
│ - Reverterá estoque                                         │
│ - Removerá todos os dados                                   │
│                                                              │
│ [OK] [CANCELAR]                                             │
└─────────────────────────────────────────────────────────────┘

Admin clica OK
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🚨 CONFIRMAÇÃO FINAL                                         │
│                                                              │
│ Tem ABSOLUTA CERTEZA?                                       │
│                                                              │
│ [OK] [CANCELAR]                                             │
└─────────────────────────────────────────────────────────────┘

Admin clica OK
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 📝 MOTIVO DA EXCLUSÃO                         ✨ NOVO        │
│                                                              │
│ Digite o motivo pelo qual está excluindo                    │
│ a O.S. #123:                                                │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Cancelamento por solicitação do cliente          ] │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                              │
│ (Este motivo será registrado na auditoria)                  │
│                                                              │
│ [OK] [CANCELAR]                                             │
└─────────────────────────────────────────────────────────────┘

Admin digita motivo e clica OK
    ↓
✅ O.S. #123 deletada com sucesso!
   Motivo: Cancelamento por solicitação do cliente
   Estoque foi revertido automaticamente.
```

---

## Registros na Auditoria

### Antes (sem motivo detalhado)

```
┌─────────────────────────────────────────────────────────────────┐
│ DETALHES DA AUDITORIA                                           │
├─────────────────────────────────────────────────────────────────┤
│ Informações Gerais                                              │
│ Data/Hora: 11/11/2025, 15:30:20                                │
│ Usuário: Administrator (bruno.vargas@email.com)                │
│ Ação: DELETE                                                    │
│ Módulo: OS                                                      │
│ Descrição: Deletou Ordem de Serviço #123 - Evento Corp.        │
│                                                                 │
│ Dados Antes: {...dados completos...}                           │
│ Dados Depois: (null - deletado)                                │
└─────────────────────────────────────────────────────────────────┘
```

### Depois (com motivo)

```
┌─────────────────────────────────────────────────────────────────┐
│ DETALHES DA AUDITORIA                                           │
├─────────────────────────────────────────────────────────────────┤
│ Informações Gerais                                              │
│ Data/Hora: 11/11/2025, 16:05:28                                │
│ Usuário: Administrator (bruno.vargas@email.com)                │
│ Ação: DELETE                                                    │
│ Módulo: OS                                                      │
│ Descrição: Deletou Ordem de Serviço #123 - Evento Corp.        │
│            ✅ Motivo: Cancelamento por solicitação do cliente   │
│                                                                 │
│ Dados Antes: {...dados completos...}                           │
│ Dados Depois: (null - deletado)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Banco de Dados

### Estrutura da Tabela (novo)

```sql
CREATE TABLE ordens_servico (
    id INTEGER PRIMARY KEY,
    numero_os VARCHAR(50),
    evento VARCHAR(200),
    -- ... outros campos ...
    motivo_exclusao TEXT,           ✨ NOVO
    data_exclusao DATETIME,         ✨ NOVO
    -- ... outros campos ...
);
```

### Exemplo de Dados

```
┌────────────────────────────────────────────────────────┐
│ ID │ Número │ Evento         │ Motivo           │Data │
├────────────────────────────────────────────────────────┤
│123 │ OS-001 │ Evento Corp.   │ NULL             │NULL │ ← Não deletada
│124 │ OS-002 │ Coffee Break   │ "Evento cancelad │ ... │ ← Deletada
│    │        │                │ o pela detentora"│     │
│125 │ OS-003 │ Reunião        │ "Erro ao criar - │ ... │ ← Deletada
│    │        │                │ duplicação"      │     │
└────────────────────────────────────────────────────────┘
```

---

## Casos de Uso

### Caso 1: Cancelamento por Solicitação

```
ADMIN: "Preciso deletar a O.S. #150 porque o cliente cancelou o evento"

[Clica em Deletar]
[Confirma 2x]
[Digite o motivo:]
"Cancelamento por solicitação do cliente"
[OK]

✅ RESULTADO:
- O.S. deletada
- Estoque revertido
- Auditoria registra:
  "Cancelamento por solicitação do cliente"
- Data/hora registrada em São Paulo
```

### Caso 2: Erro ao Criar

```
ADMIN: "Criei a O.S. duplicada por engano"

[Clica em Deletar]
[Confirma 2x]
[Digite o motivo:]
"Duplicação acidental - erro ao criar"
[OK]

✅ RESULTADO:
- O.S. deletada
- Auditoria deixa rastro do motivo
- Fica claro que foi erro, não cancelamento
```

### Caso 3: Dados Inconsistentes

```
ADMIN: "Preciso deletar porque os dados estão inconsistentes"

[Clica em Deletar]
[Confirma 2x]
[Digite o motivo:]
"Dados inconsistentes - cliente informou data errada"
[OK]

✅ RESULTADO:
- Motivo detalhado fica registrado
- Facilita auditorias futuras
- Admin consegue se justificar
```

---

## Relatórios Possíveis

Com essa implementação, você agora pode gerar relatórios como:

### 📊 "Relatório de Exclusões"

```
RELATÓRIO DE EXCLUSÕES DE O.S.
Período: 01/11/2025 a 30/11/2025

Cancelamentos por cliente:        8 O.S.
Erros ao criar:                   2 O.S.
Dados inconsistentes:             3 O.S.
Eventos adiados:                  5 O.S.
Outros motivos:                   2 O.S.
                                ─────
TOTAL:                           20 O.S.

Motivos Mais Comuns:
1. Cancelamento por solicitação   45%
2. Evento adiado                  25%
3. Erro ao criar                  10%
4. Dados inconsistentes           15%
5. Outros                          5%
```

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| 🔍 **Rastreabilidade** | Saber por quê cada O.S. foi deletada |
| 📋 **Auditoria** | Registro completo de quem, quando e por quê |
| 🛡️ **Segurança** | Responsabilidade clara de cada deleção |
| 📊 **Análise** | Gerar relatórios de padrões de cancelamento |
| ⏰ **Documentação** | Deixar histórico para futuros reviews |
| 🤝 **Accountability** | Admin não pode simplesmente deletar sem justificar |

---

## 🎯 Próximos Passos

1. ✅ Testar localmente com a migração
2. ✅ Deletar uma O.S. de teste
3. ✅ Verificar se motivo é obrigatório
4. ✅ Verificar se auditoria mostra o motivo
5. ✅ Após testes, fazer commit se tudo ok
6. ✅ Deploy em produção
7. ✅ Começar a usar normalmente
