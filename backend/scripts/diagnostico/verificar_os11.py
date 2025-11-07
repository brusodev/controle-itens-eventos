from app import create_app
from models import db, OrdemServico, MovimentacaoEstoque, EstoqueRegional, Item

app = create_app()

with app.app_context():
    # Buscar O.S. 11/2025
    os11 = OrdemServico.query.filter_by(numero_os='11/2025').first()
    
    if not os11:
        print("❌ O.S. 11/2025 não encontrada!")
    else:
        print("="*60)
        print("📋 O.S. 11/2025 - DETALHES")
        print("="*60)
        print(f"ID: {os11.id}")
        print(f"Número: {os11.numero_os}")
        print(f"Grupo: {os11.grupo}")
        print(f"Região Estoque: {os11.regiao_estoque}")
        print(f"Data Emissão: {os11.data_emissao}")
        
        print("\n" + "="*60)
        print("📦 MOVIMENTAÇÕES DE ESTOQUE")
        print("="*60)
        
        movs = MovimentacaoEstoque.query.filter_by(ordem_servico_id=os11.id).all()
        
        if not movs:
            print("❌ NENHUMA movimentação encontrada!")
            print("⚠️ PROBLEMA: O estoque NÃO foi abatido!")
        else:
            print(f"✅ {len(movs)} movimentação(ões) registrada(s)\n")
            
            for i, m in enumerate(movs, 1):
                item = Item.query.get(m.item_id)
                print(f"Movimentação {i}:")
                print(f"  Item: {item.descricao}")
                print(f"  Tipo: {m.tipo}")
                print(f"  Quantidade: {m.quantidade}")
                print(f"  Região: {m.regiao_estoque}")
                print(f"  Data: {m.data_movimentacao}")
                
                # Buscar estoque regional
                estoque = EstoqueRegional.query.filter_by(
                    item_id=m.item_id, 
                    regiao=m.regiao_estoque
                ).first()
                
                print(f"\n  📊 Estoque Região {m.regiao_estoque}:")
                print(f"    Inicial: {estoque.quantidade_inicial}")
                print(f"    Atual: {estoque.quantidade_atual}")
                print(f"    Abatido: {estoque.quantidade_inicial - estoque.quantidade_atual}")
                print()
        
        print("="*60)
        print("📊 ITENS DA O.S.")
        print("="*60)
        
        for item_os in os11.itens:
            print(f"  - {item_os.item.descricao}")
            print(f"    Diárias: {item_os.diarias}")
            print(f"    Qtd Solicitada: {item_os.quantidade_solicitada}")
            print(f"    Qtd Total: {item_os.quantidade_total}")
            print()
