"""
Adicionar preço para Água mineral em copos
"""

from app import create_app
from models import db, EstoqueRegional, Item

def adicionar_preco_agua():
    """Adiciona preço para água mineral"""
    
    app = create_app()
    
    with app.app_context():
        print("\n🔍 Adicionando preço para Água mineral...")
        
        # Buscar item
        agua = Item.query.filter_by(descricao='Água mineral em copos de 200 ml').first()
        
        if not agua:
            print("❌ Água não encontrada!")
            return
        
        print(f"✅ Item encontrado: {agua.descricao} (ID: {agua.id})")
        
        # Atualizar preço em todas as regiões
        for regiao in range(1, 7):
            estoque = EstoqueRegional.query.filter_by(
                item_id=agua.id,
                regiao_numero=regiao
            ).first()
            
            if estoque:
                estoque.preco = '2,50'  # R$ 2,50 por copo
                print(f"   Região {regiao}: R$ 2,50")
        
        db.session.commit()
        print("\n✅ Preços atualizados com sucesso!\n")

if __name__ == '__main__':
    adicionar_preco_agua()
