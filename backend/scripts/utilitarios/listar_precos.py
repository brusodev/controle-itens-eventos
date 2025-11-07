"""
Script interativo para adicionar/editar preços dos itens por região
"""

from app import create_app
from models import db, EstoqueRegional, Item

def listar_e_editar_precos():
    """Lista todos os itens e permite editar preços por região"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("📋 GERENCIADOR DE PREÇOS - ESTOQUE REGIONAL")
        print("="*80)
        
        # Buscar todos os itens
        itens = Item.query.order_by(Item.descricao).all()
        
        print(f"\n✅ Encontrados {len(itens)} itens no total\n")
        
        # Listar itens
        for idx, item in enumerate(itens, 1):
            print(f"\n[{idx}] {item.descricao}")
            natureza = item.categoria.natureza if item.categoria else 'N/A'
            print(f"    Código BEC: {natureza}")
            
            # Mostrar preços atuais por região
            print("    Preços por região:")
            for regiao in range(1, 7):
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item.id,
                    regiao_numero=regiao
                ).first()
                
                preco = estoque.preco if estoque and estoque.preco else '0'
                print(f"      Região {regiao}: R$ {preco}")
        
        print("\n" + "="*80)
        print("\n💡 Para editar preços:")
        print("   1. Abra o sistema web (http://localhost:5100)")
        print("   2. Vá para 'Alimentação de Dados'")
        print("   3. Clique no botão de editar do item desejado")
        print("   4. Preencha o campo 'PREÇO' para cada região")
        print("   5. Clique em 'Salvar Alterações'")
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    listar_e_editar_precos()
