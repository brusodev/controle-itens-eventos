"""
Script para adicionar preços de exemplo aos itens do Coffee Break
"""

from app import create_app
from models import db, EstoqueRegional, Item

def adicionar_precos_exemplo():
    """Adiciona preços de exemplo para teste"""
    
    app = create_app()
    
    with app.app_context():
        print("\n🔍 Buscando itens do Coffee Break...")
        
        # Buscar todos os itens
        itens = Item.query.all()
        print(f"   ✅ Encontrados {len(itens)} itens no total")
        
        # Preços de exemplo (você pode ajustar conforme necessário)
        precos_exemplo = {
            'Salgadinho sabor queijo min. 500g': '25,60',
            'Água Mineral sem gás 500ml': '2,50',
            'Café torrado e moído 500g': '18,00',
            'Açúcar Cristal 1Kg': '5,50',
            'Adoçante líquido dietético 100ml': '8,00',
            'Guardanapo de papel folha dupla': '12,00',
            'Copo descartável 200ml': '15,00',
            'Mexedor descartável': '6,00',
        }
        
        print("\n💰 Atualizando preços...")
        
        total_atualizados = 0
        
        for item in itens:
            # Buscar estoque regional para cada região (1-6)
            for regiao in range(1, 7):
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item.id,
                    regiao_numero=regiao
                ).first()
                
                if estoque:
                    # Tentar encontrar preço para este item
                    preco = '0'
                    for descricao, valor in precos_exemplo.items():
                        if descricao.lower() in item.descricao.lower():
                            preco = valor
                            break
                    
                    estoque.preco = preco
                    total_atualizados += 1
        
        # Salvar alterações
        db.session.commit()
        
        print(f"   ✅ {total_atualizados} registros atualizados com preços!")
        
        # Mostrar alguns exemplos
        print("\n📋 Exemplos de preços cadastrados:")
        for item in itens[:5]:
            estoque = EstoqueRegional.query.filter_by(
                item_id=item.id,
                regiao_numero=1
            ).first()
            
            if estoque:
                print(f"   • {item.descricao[:50]}: R$ {estoque.preco}")
        
        print("\n✨ Preços adicionados com sucesso!")

if __name__ == '__main__':
    adicionar_precos_exemplo()
