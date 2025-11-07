"""
Verificar dados reais da O.S. no banco
"""

from app import create_app
from models import db, OrdemServico, ItemOrdemServico

def verificar_os_banco():
    """Verifica os dados da O.S. no banco"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 VERIFICAÇÃO: DADOS DA O.S. NO BANCO")
        print("="*80)
        
        # Buscar primeira O.S.
        os = OrdemServico.query.first()
        
        if not os:
            print("❌ Nenhuma O.S. encontrada!")
            return
        
        print(f"\n📋 O.S.: {os.numero_os}")
        print(f"   ID: {os.id}")
        print(f"   Grupo: {os.grupo}")
        print(f"   Região Estoque: {os.regiao_estoque}")
        
        print(f"\n📦 Itens (diretamente do banco):")
        for item_os in os.itens:
            print(f"\n   ItemOrdemServico ID: {item_os.id}")
            print(f"   item_id (FK): {item_os.item_id}")
            print(f"   Descrição: {item_os.descricao}")
            print(f"   Item relacionado: {item_os.item.descricao if item_os.item else 'N/A'}")
            print(f"   Item relacionado ID: {item_os.item.id if item_os.item else 'N/A'}")
        
        print(f"\n📋 Itens (via to_dict):")
        dados = os.to_dict(incluir_itens=True)
        for item in dados['itens']:
            print(f"\n   Descrição: {item['descricao']}")
            print(f"   itemId: {item['itemId']}")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    verificar_os_banco()
