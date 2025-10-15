#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Depuração - Verificar se dados estão sendo retornados corretamente
"""

import requests
import json

print("=" * 70)
print("TESTE DE DEPURAÇÃO - VERIFICANDO DADOS DA API")
print("=" * 70)

# 1. Buscar O.S. atual
print("\n1️⃣ GET /api/ordens-servico/1")
response = requests.get("http://127.0.0.1:5100/api/ordens-servico/1")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    os = response.json()
    print("\n📋 Dados Atuais da O.S.:")
    print(f"   ID: {os['id']}")
    print(f"   Número: {os['numeroOS']}")
    print(f"   Evento: {os['evento']}")
    print(f"   Justificativa: {os['justificativa'][:80]}...")
    
    print("\n📦 Itens:")
    for item in os.get('itens', []):
        print(f"   - {item['descricao']}: {item['qtdTotal']} unidades")
    
    # 2. Fazer uma edição de teste
    print("\n" + "=" * 70)
    print("2️⃣ Editando para teste de sincronização...")
    
    import time
    timestamp = int(time.time())
    
    edicao = {
        "numeroOS": os['numeroOS'],
        "contrato": os.get('contrato', ''),
        "detentora": os.get('detentora', ''),
        "cnpj": os.get('cnpj', ''),
        "gestorContrato": os.get('gestorContrato', ''),
        "fiscalContrato": os.get('fiscalContrato', ''),
        "evento": f"TESTE SINC - {timestamp}",
        "data": os.get('data', ''),
        "local": os.get('local', ''),
        "justificativa": f"Justificativa de teste - timestamp: {timestamp}",
        "itens": os['itens']
    }
    
    response = requests.put("http://127.0.0.1:5100/api/ordens-servico/1", json=edicao)
    print(f"PUT Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Edição realizada com sucesso")
        
        # 3. Buscar novamente para confirmar
        print("\n3️⃣ GET /api/ordens-servico/1 (após edição)")
        response = requests.get("http://127.0.0.1:5100/api/ordens-servico/1")
        
        if response.status_code == 200:
            os_atualizada = response.json()
            print(f"\n📋 Dados Após Edição:")
            print(f"   Evento: {os_atualizada['evento']}")
            print(f"   Justificativa: {os_atualizada['justificativa'][:80]}...")
            
            # Verificar se mudou
            if os_atualizada['evento'] == edicao['evento']:
                print("\n✅ SUCESSO! Dados foram atualizados na API")
                print(f"   Esperado: {edicao['evento']}")
                print(f"   Recebido: {os_atualizada['evento']}")
            else:
                print("\n❌ ERRO! Dados não foram atualizados")
                print(f"   Esperado: {edicao['evento']}")
                print(f"   Recebido: {os_atualizada['evento']}")
        
        print("\n" + "=" * 70)
        print("INSTRUÇÕES PARA TESTE MANUAL:")
        print("=" * 70)
        print("\n1. Acesse: http://127.0.0.1:5100/")
        print("2. Vá para 'Ordens de Serviço'")
        print("3. Clique '👁️ Visualizar' na O.S. #1/2025")
        print("\n4. VERIFIQUE NO MODAL:")
        print(f"   ✅ Deve mostrar: '{os_atualizada['evento']}'")
        print(f"   ✅ Justificativa: '{os_atualizada['justificativa'][:50]}...'")
        
        print("\n5. CLIQUE '📥 Baixar PDF'")
        print("   ✅ PDF deve conter os mesmos dados do modal")
        
        print("\n6. ABRA O PDF E VERIFIQUE:")
        print(f"   ✅ Evento no PDF: '{os_atualizada['evento']}'")
        
        print("\n" + "=" * 70)
        print("TESTE DE CONSOLE DO NAVEGADOR:")
        print("=" * 70)
        print("\nAbra o console (F12) e execute:")
        print("""
async function testarAPI() {
    const os = await APIClient.obterOrdemServico(1);
    console.log('Dados da API:', os);
    console.log('Evento:', os.evento);
    console.log('Justificativa:', os.justificativa);
}
testarAPI();
        """)
        
        print("\nSe o console mostrar dados DIFERENTES do modal,")
        print("significa que há um problema no JavaScript do frontend.")
    else:
        print(f"❌ Erro ao editar: {response.json()}")
else:
    print(f"❌ Erro ao buscar O.S.: {response.json()}")

print("\n" + "=" * 70)
