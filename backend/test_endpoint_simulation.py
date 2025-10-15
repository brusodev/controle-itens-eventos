"""
Script para simular o que o endpoint /api/ordens-servico/ faz
"""
import sys
sys.path.insert(0, 'C:\\Users\\bruno.vargas\\Desktop\\PROJETOS\\controle-itens-eventos\\backend')

from app import create_app
from models import OrdemServico
from flask import jsonify
import json

print("=" * 70)
print("SIMULAÇÃO DO ENDPOINT GET /api/ordens-servico/")
print("=" * 70)

app = create_app()

with app.app_context():
    # Buscar todas as O.S. (como no endpoint)
    ordens = OrdemServico.query.order_by(OrdemServico.data_emissao.desc()).all()
    print(f"\n📊 Query retornou: {len(ordens)} O.S.")
    
    # Simular o que o endpoint faz
    try:
        result = [os.to_dict() for os in ordens]
        print(f"✅ List comprehension OK - {len(result)} items")
        
        # Serializar para JSON (como jsonify faz)
        json_str = json.dumps(result, ensure_ascii=False, indent=2)
        print(f"\n✅ JSON serialization OK - {len(json_str)} chars")
        print(f"\nPrimeiros 500 chars do JSON:")
        print(json_str[:500])
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
