import requests
import json

print("=" * 70)
print("TESTE DO ENDPOINT DE LISTAGEM DE O.S.")
print("=" * 70)

try:
    response = requests.get("http://127.0.0.1:5100/api/ordens-servico/")
    print(f"\n✅ Status: {response.status_code}")
    
    data = response.json()
    print(f"📊 Total de O.S. retornadas: {len(data)}")
    
    if len(data) > 0:
        print("\n📋 Dados da primeira O.S.:")
        print(json.dumps(data[0], indent=2, ensure_ascii=False))
    else:
        print("\n⚠️ NENHUMA O.S. RETORNADA!")
        print(f"Resposta completa: {data}")
        
except Exception as e:
    print(f"\n❌ ERRO: {e}")
