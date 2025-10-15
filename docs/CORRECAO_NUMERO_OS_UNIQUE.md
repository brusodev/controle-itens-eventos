# 🐛 Correção: UNIQUE Constraint Failed - numero_os

## ❌ Problema: Tentativa de criar O.S. com número duplicado

**Erro**: `UNIQUE constraint failed: ordens_servico.numero_os`

**Causa**: Frontend sempre enviava "1/2025", mas já existia O.S. com esse número.

## ✅ Solução: Auto-incremento de Número no Backend

### Código Adicionado (backend/routes/os_routes.py):

```python
def gerar_proximo_numero_os():
    """Gera automaticamente o próximo número de O.S. no formato N/ANO"""
    ano_atual = datetime.now().year
    ultima_os = OrdemServico.query.filter(
        OrdemServico.numero_os.like(f'%/{ano_atual}')
    ).order_by(OrdemServico.id.desc()).first()
    
    if ultima_os:
        numero_atual = int(ultima_os.numero_os.split('/')[0])
        proximo_numero = numero_atual + 1
    else:
        proximo_numero = 1
    
    return f"{proximo_numero}/{ano_atual}"
```

### Modificação na Criação:
```python
# Backend IGNORA o número enviado pelo frontend
numero_os_gerado = gerar_proximo_numero_os()  # ✅ Gera automaticamente
os = OrdemServico(numero_os=numero_os_gerado, ...)
```

## 🔄 Como Funciona:

- **1ª O.S. de 2025**: Gera "1/2025"
- **2ª O.S. de 2025**: Gera "2/2025"  
- **3ª O.S. de 2025**: Gera "3/2025"
- **1ª O.S. de 2026**: Gera "1/2026" (reinicia contador)

## 🧪 Próximos Passos:

1. **Reinicie o servidor Flask**:
   ```bash
   cd backend
   .\venv\Scripts\python.exe app.py
   ```

2. **Tente criar nova O.S. novamente**

3. **Verifique se foi salva**:
   ```bash
   .\venv\Scripts\python.exe verificar_os_banco.py
   ```

**Agora deve funcionar!** ✅

---
**Data**: 14/10/2025  
**Arquivo Modificado**: `backend/routes/os_routes.py`
