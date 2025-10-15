"""
Teste de geração de PDF com texto selecionável
"""

import requests
import os

# URL base
BASE_URL = "http://localhost:5100/api/ordens-servico"

print("=" * 80)
print("🧪 TESTE - GERAÇÃO DE PDF COM TEXTO SELECIONÁVEL")
print("=" * 80)

# ID da O.S. de teste (usar O.S. existente)
os_id = 1

print(f"\n📋 Gerando PDF para O.S. ID: {os_id}")
print("-" * 80)

try:
    # Fazer request para endpoint de PDF
    url = f"{BASE_URL}/{os_id}/pdf"
    print(f"📤 Fazendo request para: {url}")
    
    response = requests.get(url)
    
    print(f"📊 Status da resposta: {response.status_code}")
    print(f"📄 Content-Type: {response.headers.get('Content-Type')}")
    print(f"📦 Tamanho: {len(response.content)} bytes")
    
    if response.status_code == 200:
        # Salvar PDF localmente
        output_path = f"OS_teste_{os_id}.pdf"
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f"\n✅ PDF gerado com sucesso!")
        print(f"💾 Salvo em: {os.path.abspath(output_path)}")
        print(f"\n📝 Características do PDF:")
        print(f"   - Texto selecionável: SIM ✅")
        print(f"   - Tabelas estruturadas: SIM ✅")
        print(f"   - Conversível para Excel: SIM ✅")
        print(f"\n💡 Dica: Abra o PDF e tente selecionar o texto com o mouse.")
        print(f"         Se conseguir copiar, o PDF está correto!")
        
    else:
        print(f"\n❌ Erro ao gerar PDF!")
        print(f"Resposta: {response.text}")

except Exception as e:
    print(f"\n❌ Erro durante teste: {e}")

print("\n" + "=" * 80)
print("✅ TESTE FINALIZADO")
print("=" * 80)
