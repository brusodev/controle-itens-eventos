"""
Verificar dados da O.S. 14/2025
"""

from app import create_app
from models import db, OrdemServico, ItemOrdemServico, EstoqueRegional, Item

def verificar_os_14():
    """Verifica os dados da O.S. 14/2025"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 VERIFICAÇÃO: O.S. 14/2025")
        print("="*80)
        
        # Buscar O.S.
        os = OrdemServico.query.filter_by(numero_os='14/2025').first()
        
        if not os:
            print("❌ O.S. 14/2025 não encontrada!")
            return
        
        print(f"\n📋 O.S.: {os.numero_os}")
        print(f"   ID: {os.id}")
        print(f"   Grupo: {os.grupo}")
        print(f"   Região Estoque: {os.regiao_estoque}")
        
        print(f"\n📦 Itens da O.S.:")
        for item_os in os.itens:
            print(f"\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"   ItemOrdemServico ID: {item_os.id}")
            print(f"   Descrição: {item_os.descricao}")
            print(f"   item_id (FK): {item_os.item_id}")
            print(f"   Quantidade: {item_os.quantidade_total}")
            print(f"   Diárias: {item_os.diarias}")
            
            # Verificar se o item existe
            item = Item.query.get(item_os.item_id)
            if item:
                print(f"   ✅ Item no banco: {item.descricao} (ID: {item.id})")
                
                # Buscar preço
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item.id,
                    regiao_numero=os.regiao_estoque
                ).first()
                
                if estoque:
                    print(f"   ✅ Estoque encontrado:")
                    print(f"      - Região: {estoque.regiao_numero}")
                    print(f"      - Preço: '{estoque.preco}'")
                    
                    if estoque.preco and estoque.preco != '0':
                        try:
                            preco_str = estoque.preco.replace('.', '').replace(',', '.')
                            valor_unit = float(preco_str)
                            total = item_os.quantidade_total * valor_unit
                            print(f"      - Valor Unit: R$ {valor_unit:.2f}")
                            print(f"      - Valor Total: R$ {total:.2f}")
                        except Exception as e:
                            print(f"      ⚠️ Erro ao converter: {e}")
                    else:
                        print(f"      ⚠️ PREÇO ZERADO OU VAZIO!")
                else:
                    print(f"   ❌ Estoque NÃO encontrado para item_id={item.id}, regiao={os.regiao_estoque}")
            else:
                print(f"   ❌ Item NÃO encontrado no banco!")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    verificar_os_14()
