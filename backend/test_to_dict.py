"""
Script para testar a serialização to_dict() direto no banco
"""
import sys
sys.path.insert(0, 'C:\\Users\\bruno.vargas\\Desktop\\PROJETOS\\controle-itens-eventos\\backend')

from app import create_app
from models import OrdemServico

print("=" * 70)
print("TESTE DE SERIALIZAÇÃO - to_dict()")
print("=" * 70)

app = create_app()

with app.app_context():
    # Buscar todas as O.S.
    ordens = OrdemServico.query.all()
    print(f"\n📊 Total de O.S. no banco: {len(ordens)}")
    
    # Testar serialização de cada uma
    for os in ordens:
        print(f"\n{'=' * 70}")
        print(f"🆔 Testando O.S. ID {os.id} - {os.numero_os}")
        print(f"   Responsável: {repr(os.responsavel)}")
        
        try:
            dados = os.to_dict(incluir_itens=False)
            print(f"   ✅ Serialização OK!")
            print(f"   📋 Keys: {list(dados.keys())}")
            print(f"   👤 responsavel no dict: {repr(dados.get('responsavel'))}")
        except Exception as e:
            print(f"   ❌ ERRO na serialização: {e}")
            import traceback
            traceback.print_exc()
    
    # Testar list comprehension como no endpoint
    print(f"\n{'=' * 70}")
    print("TESTE DE LIST COMPREHENSION (como no endpoint)")
    print("=" * 70)
    
    try:
        result = [os.to_dict(incluir_itens=False) for os in ordens]
        print(f"✅ List comprehension OK!")
        print(f"📊 Retornou {len(result)} O.S.")
    except Exception as e:
        print(f"❌ ERRO no list comprehension: {e}")
        import traceback
        traceback.print_exc()
