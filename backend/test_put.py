#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script para testar edição de O.S. via API"""

import requests
import json

url = "http://127.0.0.1:5100/api/ordens-servico/1"

dados = {
    "numeroOS": "1/2025",
    "contrato": "014/DA/2024",
    "detentora": "BROTA ATACADO E DISTRIBUIDORA EIRELI",
    "cnpj": "53.097.664/0001-71",
    "gestorContrato": "Marcia Cristina Gallo",
    "fiscalContrato": "Fiscal Teste",
    "evento": "EVENTO EDITADO - TESTE",
    "data": "25/01/2025",
    "local": "Local teste editado",
    "justificativa": "JUSTIFICATIVA EDITADA - TESTE DE ALTERAÇÃO VIA API",
    "itens": [
        {
            "categoria": "LANCHES E REFEIÇÕES",
            "itemId": "1",
            "descricao": "Kit Lanche",
            "unidade": "Unidade",
            "qtdTotal": 30.0
        }
    ]
}

print("=" * 60)
print("TESTE: Editando O.S. via API PUT")
print("=" * 60)
print(f"\nURL: {url}")
print(f"\nDados enviados:")
print(json.dumps(dados, indent=2, ensure_ascii=False))

try:
    response = requests.put(url, json=dados)
    print(f"\n✅ Status: {response.status_code}")
    print(f"\nResposta:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    if response.status_code == 200:
        print("\n✅ EDIÇÃO REALIZADA COM SUCESSO!")
        print("\nAgora vamos buscar os dados para confirmar:")
        
        get_response = requests.get(url)
        if get_response.status_code == 200:
            os_data = get_response.json()
            print(f"\n📋 Dados atualizados da O.S.:")
            print(f"   Número: {os_data['numeroOS']}")
            print(f"   Evento: {os_data['evento']}")
            print(f"   Justificativa: {os_data['justificativa'][:50]}...")
            print(f"   Itens: {len(os_data['itens'])} item(s)")
            for item in os_data['itens']:
                print(f"      - {item['descricao']}: {item['qtdTotal']} unidades")
            
            print("\n" + "=" * 60)
            print("PRÓXIMO PASSO:")
            print("=" * 60)
            print("\n1. Acesse: http://127.0.0.1:5100/")
            print("2. Clique em '👁️ Visualizar' na O.S. #1/2025")
            print("3. Verifique se mostra:")
            print("   ✅ Evento: 'EVENTO EDITADO - TESTE'")
            print("   ✅ Justificativa: 'JUSTIFICATIVA EDITADA...'")
            print("   ✅ Kit Lanche: 30 unidades (era 20)")
            print("\n4. Teste '🖨️ Imprimir' e '📄 PDF'")
            print("   (Devem mostrar dados atualizados)")
    else:
        print("\n❌ ERRO AO EDITAR!")
        
except Exception as e:
    print(f"\n❌ ERRO: {e}")
