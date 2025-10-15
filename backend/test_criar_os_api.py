#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para testar criação de O.S. via API
"""

import requests
import json
from datetime import datetime

# URL da API
BASE_URL = "http://localhost:5100"

def testar_criar_os():
    print("=" * 60)
    print("🧪 TESTANDO CRIAÇÃO DE O.S. VIA API")
    print("=" * 60)
    
    # Dados de teste
    dados_os = {
        "numeroOS": "TESTE-001",
        "contrato": "014/DA/2024",
        "dataAssinatura": "2025-01-15",
        "prazoVigencia": "12 MESES",
        "detentora": "EMPRESA TESTE LTDA",
        "cnpj": "12.345.678/0001-90",
        "servico": "COFFEE BREAK",
        "grupo": "5",
        "evento": "TESTE DE CRIAÇÃO - " + datetime.now().strftime("%Y%m%d%H%M%S"),
        "data": "2025-01-30",
        "horario": "14:00",
        "local": "Sala de Reuniões - TESTE",
        "justificativa": "Teste de criação via script Python",
        "gestorContrato": "GESTOR TESTE",
        "fiscalContrato": "FISCAL TESTE",
        "itens": [
            {
                "categoria": "coffee_break",
                "itemId": 1,
                "itemBec": "33903900",
                "descricao": "Kit Lanche",
                "unidade": "UN",
                "qtdTotal": 50
            },
            {
                "categoria": "coffee_break",
                "itemId": 3,
                "descricao": "Água mineral em copos de 200 ml",
                "unidade": "UN",
                "qtdTotal": 50
            }
        ]
    }
    
    print("\n📤 Enviando POST para /api/ordens-servico/")
    print(f"📝 Evento: {dados_os['evento']}")
    print(f"📦 Total de itens: {len(dados_os['itens'])}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ordens-servico/",
            json=dados_os,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"\n📡 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ O.S. criada com sucesso!")
            resultado = response.json()
            print(f"\n📋 Dados retornados:")
            print(json.dumps(resultado, indent=2, ensure_ascii=False))
        else:
            print(f"❌ Erro ao criar O.S.!")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
    
    print("\n" + "=" * 60)

def testar_listar_os():
    print("\n" + "=" * 60)
    print("📋 LISTANDO TODAS AS O.S. VIA API")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/ordens-servico/")
        
        print(f"\n📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            ordens = response.json()
            print(f"✅ Total de O.S. retornadas: {len(ordens)}")
            
            for i, os in enumerate(ordens, 1):
                print(f"\n{i}. O.S. #{os.get('id')}")
                print(f"   Evento: {os.get('evento')}")
                print(f"   Número: {os.get('numeroOS')}")
                print(f"   Itens: {len(os.get('itens', []))}")
        else:
            print(f"❌ Erro ao listar O.S.!")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    # Primeiro listar O.S. existentes
    testar_listar_os()
    
    # Perguntar se quer criar nova O.S. de teste
    print("\n⚠️  Deseja criar uma O.S. de teste? (s/n): ", end='')
    resposta = input().lower()
    
    if resposta == 's':
        testar_criar_os()
        
        # Listar novamente para confirmar
        print("\n🔄 Listando novamente após criação...")
        testar_listar_os()
    else:
        print("❌ Criação cancelada pelo usuário")
