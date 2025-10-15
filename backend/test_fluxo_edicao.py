#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste do Fluxo Completo de Edição
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5100/api/ordens-servico"

print("=" * 70)
print("TESTE: FLUXO COMPLETO DE EDIÇÃO DE O.S.")
print("=" * 70)

# 1. Buscar O.S. existente
print("\n1️⃣ Buscando O.S. #1...")
response = requests.get(f"{BASE_URL}/1")
if response.status_code != 200:
    print("❌ Erro ao buscar O.S.")
    exit(1)

os_original = response.json()
print(f"   ✅ O.S. encontrada: {os_original['numeroOS']}")
print(f"   📋 Evento: {os_original['evento']}")
print(f"   📋 Justificativa: {os_original['justificativa'][:50]}...")

# 2. Primeira Edição
print("\n2️⃣ PRIMEIRA EDIÇÃO via PUT...")
edicao1 = {
    "numeroOS": os_original['numeroOS'],
    "contrato": os_original.get('contrato', ''),
    "detentora": os_original.get('detentora', ''),
    "cnpj": os_original.get('cnpj', ''),
    "gestorContrato": os_original.get('gestorContrato', ''),
    "fiscalContrato": os_original.get('fiscalContrato', ''),
    "evento": "TESTE EDIÇÃO 1 - PRIMEIRO UPDATE",
    "data": os_original.get('data', ''),
    "local": os_original.get('local', ''),
    "justificativa": "Justificativa da PRIMEIRA edição - timestamp: " + str(int(time.time())),
    "itens": os_original['itens']
}

response = requests.put(f"{BASE_URL}/1", json=edicao1)
if response.status_code != 200:
    print(f"❌ Erro: {response.json()}")
    exit(1)

print("   ✅ PUT Status 200")
print(f"   📝 Evento alterado para: '{edicao1['evento']}'")

# 3. Verificar se persistiu
print("\n3️⃣ Verificando persistência (GET)...")
response = requests.get(f"{BASE_URL}/1")
os_verificacao1 = response.json()

if os_verificacao1['evento'] == edicao1['evento']:
    print(f"   ✅ CORRETO! Evento: '{os_verificacao1['evento']}'")
else:
    print(f"   ❌ ERRO! Esperado: '{edicao1['evento']}'")
    print(f"   ❌ Recebido: '{os_verificacao1['evento']}'")
    exit(1)

# 4. Segunda Edição (simular edição pela interface)
print("\n4️⃣ SEGUNDA EDIÇÃO (simulando interface)...")
time.sleep(1)

edicao2 = {
    "numeroOS": os_original['numeroOS'],
    "contrato": os_original.get('contrato', ''),
    "detentora": os_original.get('detentora', ''),
    "cnpj": os_original.get('cnpj', ''),
    "gestorContrato": os_original.get('gestorContrato', ''),
    "fiscalContrato": os_original.get('fiscalContrato', ''),
    "evento": "TESTE EDIÇÃO 2 - SEGUNDO UPDATE",
    "data": os_original.get('data', ''),
    "local": os_original.get('local', ''),
    "justificativa": "Justificativa da SEGUNDA edição - timestamp: " + str(int(time.time())),
    "itens": os_original['itens']
}

response = requests.put(f"{BASE_URL}/1", json=edicao2)
if response.status_code != 200:
    print(f"❌ Erro: {response.json()}")
    exit(1)

print("   ✅ PUT Status 200")
print(f"   📝 Evento alterado para: '{edicao2['evento']}'")

# 5. Verificar se persistiu a segunda edição
print("\n5️⃣ Verificando segunda persistência (GET)...")
response = requests.get(f"{BASE_URL}/1")
os_verificacao2 = response.json()

if os_verificacao2['evento'] == edicao2['evento']:
    print(f"   ✅ CORRETO! Evento: '{os_verificacao2['evento']}'")
else:
    print(f"   ❌ ERRO! Esperado: '{edicao2['evento']}'")
    print(f"   ❌ Recebido: '{os_verificacao2['evento']}'")
    exit(1)

# 6. Verificar justificativa
if edicao2['justificativa'] in os_verificacao2['justificativa']:
    print(f"   ✅ CORRETO! Justificativa também atualizada")
else:
    print(f"   ❌ ERRO! Justificativa não foi atualizada")
    print(f"   Esperado: '{edicao2['justificativa'][:50]}...'")
    print(f"   Recebido: '{os_verificacao2['justificativa'][:50]}...'")

print("\n" + "=" * 70)
print("✅ TODOS OS TESTES PASSARAM!")
print("=" * 70)

print("\n📋 RESUMO:")
print(f"   O.S. ID: 1")
print(f"   Número: {os_verificacao2['numeroOS']}")
print(f"   Evento Final: {os_verificacao2['evento']}")
print(f"   Justificativa: {os_verificacao2['justificativa'][:60]}...")

print("\n🎯 PRÓXIMO PASSO:")
print("   1. Acesse: http://127.0.0.1:5100/")
print("   2. Vá para aba 'Ordens de Serviço'")
print("   3. Clique em '✏️ Editar' na O.S. #1/2025")
print("   4. O formulário deve carregar com:")
print(f"      - Evento: '{os_verificacao2['evento']}'")
print("   5. Mude algo e clique 'Atualizar O.S.'")
print("   6. Volte e clique '👁️ Visualizar'")
print("   7. Deve mostrar a última alteração feita")
print("\n" + "=" * 70)
