"""
Script de teste completo para criação de O.S.
Testa o fluxo completo: buscar próximo número + criar O.S.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5100/api/ordens-servico"

print("=" * 80)
print("🧪 TESTE COMPLETO - CRIAÇÃO DE NOVA O.S.")
print("=" * 80)

# Passo 1: Buscar próximo número
print("\n📋 PASSO 1: Buscar próximo número disponível")
print("-" * 80)
response = requests.get(f"{BASE_URL}/proximo-numero")
print(f"Status: {response.status_code}")
proximo_numero_data = response.json()
proximo_numero = proximo_numero_data.get('proximoNumero')
print(f"✅ Próximo número disponível: {proximo_numero}")

# Passo 2: Criar nova O.S. com dados de teste
print("\n📋 PASSO 2: Criar nova O.S. com o número obtido")
print("-" * 80)

dados_os = {
    "numeroOS": proximo_numero,  # Backend vai ignorar e gerar automaticamente
    "contrato": "014/DA/2024",
    "dataAssinatura": "2024-01-15",
    "prazoVigencia": "2025-12-31",
    "detentora": "Empresa Teste LTDA",
    "cnpj": "12.345.678/0001-99",
    "servico": "Fornecimento de Alimentação",
    "grupo": "Alimentação Escolar",
    "evento": f"TESTE AUTOMATIZADO - {datetime.now().strftime('%Y%m%d%H%M%S')}",
    "data": datetime.now().strftime('%Y-%m-%d'),
    "horario": "08:00",
    "local": "Unidade de Teste",
    "justificativa": "Teste automatizado do sistema",
    "gestorContrato": "João Silva",
    "fiscalContrato": "Maria Santos",
    "itens": [
        {
            "categoria": "lanche",
            "itemId": "kit-lanche",
            "itemBec": "123456",
            "descricao": "Kit Lanche",
            "unidade": "UN",
            "qtdTotal": 50
        },
        {
            "categoria": "bebidas",
            "itemId": "agua-200ml",
            "itemBec": "789012",
            "descricao": "Água mineral em copos de 200 ml",
            "unidade": "UN",
            "qtdTotal": 50
        }
    ]
}

print(f"📤 Enviando POST para {BASE_URL}/")
print(f"📦 Dados: {json.dumps(dados_os, indent=2, ensure_ascii=False)}")

response = requests.post(f"{BASE_URL}/", json=dados_os)
print(f"\n📊 Status da resposta: {response.status_code}")

if response.status_code == 201:
    os_criada = response.json()
    print(f"✅ O.S. criada com sucesso!")
    print(f"🆔 ID: {os_criada.get('id')}")
    print(f"📄 Número: {os_criada.get('numero_os')}")
    print(f"📅 Evento: {os_criada.get('evento')}")
    print(f"📦 Total de itens: {len(os_criada.get('itens', []))}")
else:
    print(f"❌ Erro ao criar O.S.!")
    print(f"Resposta: {response.text}")

# Passo 3: Verificar próximo número novamente (deve ter incrementado)
print("\n📋 PASSO 3: Verificar próximo número após criação")
print("-" * 80)
response = requests.get(f"{BASE_URL}/proximo-numero")
novo_proximo = response.json().get('proximoNumero')
print(f"✅ Próximo número agora é: {novo_proximo}")

# Passo 4: Listar todas as O.S. do banco
print("\n📋 PASSO 4: Listar todas as O.S. no banco")
print("-" * 80)
response = requests.get(BASE_URL)
ordens = response.json()
print(f"📊 Total de O.S. no banco: {len(ordens)}")
for os in ordens:
    print(f"   - ID {os['id']}: {os['numero_os']} - {os['evento']}")

print("\n" + "=" * 80)
print("✅ TESTE COMPLETO FINALIZADO")
print("=" * 80)
