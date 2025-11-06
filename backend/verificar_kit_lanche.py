"""
Verificar preços do Kit Lanche especificamente
"""

from app import create_app
from models import db, EstoqueRegional, Item

def verificar_kit_lanche():
    """Verifica os preços do Kit Lanche"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 VERIFICAÇÃO: KIT LANCHE")
        print("="*80)
        
        # Buscar Kit Lanche
        kit = Item.query.filter_by(descricao='Kit Lanche').first()
        
        if not kit:
            print("❌ Kit Lanche não encontrado!")
            return
        
        print(f"\n✅ Kit Lanche encontrado:")
        print(f"   ID: {kit.id}")
        print(f"   Descrição: {kit.descricao}")
        print(f"   Código: {kit.item_codigo}")
        
        print(f"\n📋 Preços por região:")
        for regiao in range(1, 7):
            estoque = EstoqueRegional.query.filter_by(
                item_id=kit.id,
                regiao_numero=regiao
            ).first()
            
            if estoque:
                print(f"   Região {regiao}: R$ {estoque.preco} (ID estoque: {estoque.id})")
            else:
                print(f"   Região {regiao}: ❌ Não encontrado")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    verificar_kit_lanche()
