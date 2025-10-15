#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste: Editar pelo formulário e verificar se persiste
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5100/api/ordens-servico"

print("=" * 70)
print("TESTE: SIMULAR EDIÇÃO PELA INTERFACE")
print("=" * 70)

# 1. Estado inicial
print("\n1️⃣ Verificando estado atual...")
response = requests.get(f"{BASE_URL}/1")
os_antes = response.json()
print(f"   Evento ANTES: {os_antes['evento']}")
print(f"   Justificativa ANTES: {os_antes['justificativa'][:60]}...")

# 2. Simular uma NOVA edição (como se fosse pela interface)
print("\n2️⃣ Simulando edição pela interface...")
timestamp = int(time.time())

# Usar EXATAMENTE o formato que o frontend envia
edicao_interface = {
    "numeroOS": os_antes['numeroOS'],
    "contrato": os_antes.get('contrato', ''),
    "detentora": os_antes.get('detentora', ''),
    "cnpj": os_antes.get('cnpj', ''),
    "evento": f"EDIÇÃO INTERFACE - {timestamp}",
    "data": os_antes.get('data', ''),
    "local": os_antes.get('local', ''),
    "justificativa": f"Nova justificativa via interface - {timestamp}",
    "gestorContrato": os_antes.get('gestorContrato', ''),
    "fiscalContrato": os_antes.get('fiscalContrato', ''),
    "itens": os_antes['itens']
}

print(f"\n   📝 Novo Evento: {edicao_interface['evento']}")
print(f"   📝 Nova Justificativa: {edicao_interface['justificativa']}")

# 3. Enviar PUT
print(f"\n3️⃣ PUT /api/ordens-servico/1")
response = requests.put(f"{BASE_URL}/1", json=edicao_interface)

if response.status_code != 200:
    print(f"❌ ERRO: {response.status_code}")
    print(response.json())
    exit(1)

print(f"   ✅ Status: {response.status_code}")
os_atualizada = response.json()

# 4. Verificar imediatamente
print("\n4️⃣ GET /api/ordens-servico/1 (verificação imediata)")
response = requests.get(f"{BASE_URL}/1")
os_verificacao = response.json()

print(f"\n   Evento na resposta do PUT: {os_atualizada.get('evento', 'N/A')}")
print(f"   Evento no GET posterior: {os_verificacao['evento']}")
print(f"   Justificativa no GET: {os_verificacao['justificativa'][:60]}...")

# 5. Comparar
if os_verificacao['evento'] == edicao_interface['evento']:
    print("\n✅ SUCESSO! Dados foram persistidos corretamente")
else:
    print("\n❌ ERRO! Dados não foram persistidos")
    print(f"   Esperado: {edicao_interface['evento']}")
    print(f"   Recebido: {os_verificacao['evento']}")
    exit(1)

# 6. Aguardar e verificar novamente (testar se persiste)
print("\n5️⃣ Aguardando 2 segundos e verificando novamente...")
time.sleep(2)

response = requests.get(f"{BASE_URL}/1")
os_final = response.json()

if os_final['evento'] == edicao_interface['evento']:
    print("   ✅ Dados ainda estão corretos após espera")
else:
    print("   ❌ Dados foram revertidos!")
    print(f"   Esperado: {edicao_interface['evento']}")
    print(f"   Agora é: {os_final['evento']}")

print("\n" + "=" * 70)
print("INSTRUÇÕES PARA TESTE MANUAL:")
print("=" * 70)

print("\n🔄 RECARREGUE A PÁGINA: Ctrl+Shift+R")
print("\n1. Abra o console do navegador (F12)")
print("\n2. Vá para 'Ordens de Serviço'")
print("\n3. Clique '✏️ Editar' na O.S. #1/2025")
print("   - Formulário deve carregar com:")
print(f"     Evento: '{os_final['evento']}'")

print("\n4. MUDE o campo 'Evento' para algo NOVO:")
print("   Digite: 'TESTE MANUAL - [SEU NOME]'")

print("\n5. Clique '💾 Atualizar O.S.'")

print("\n6. OBSERVE O CONSOLE - deve mostrar:")
print("   🔍 confirmarEmissaoOS - Modo: EDIÇÃO")
print("   📋 osEditandoId: 1")
print("   📝 Dados coletados do formulário: {...}")
print("   🚀 Dados para enviar à API: {...}")
print("   📡 Enviando PUT para /api/ordens-servico/1")
print("   ✅ Resposta da API: {...}")

print("\n7. Voltar para 'Ordens de Serviço'")

print("\n8. Clique '👁️ Visualizar'")
print("   - Modal deve mostrar: 'TESTE MANUAL - [SEU NOME]'")

print("\n9. Se mostrar dados ANTIGOS:")
print("   - Copie TODOS os logs do console")
print("   - Verifique qual foi o Evento enviado no PUT")
print("   - Verifique qual foi o Evento retornado no GET")

print("\n" + "=" * 70)
print(f"📋 DADOS ATUAIS NO BANCO:")
print("=" * 70)
print(f"   Evento: {os_final['evento']}")
print(f"   Justificativa: {os_final['justificativa']}")
print("=" * 70)
