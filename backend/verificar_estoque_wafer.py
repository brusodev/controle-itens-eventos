"""
Verificar estoque do Wafer na região 5
"""
from app import create_app
from models import db, Item, EstoqueRegional, Categoria

app = create_app()

with app.app_context():
    # Buscar o item Wafer
    wafer = Item.query.filter(Item.descricao.like('%Wafer%')).first()
    
    if wafer:
        print(f"\n{'='*60}")
        print(f"ITEM ENCONTRADO:")
        print(f"{'='*60}")
        print(f"ID: {wafer.id}")
        print(f"Descrição: {wafer.descricao}")
        print(f"Código: {wafer.item_codigo}")
        print(f"Unidade: {wafer.unidade}")
        print(f"Categoria ID: {wafer.categoria_id}")
        
        # Buscar categoria
        categoria = Categoria.query.get(wafer.categoria_id)
        if categoria:
            print(f"Categoria: {categoria.nome}")
            print(f"Natureza (BEC): {categoria.natureza}")
        
        print(f"\n{'='*60}")
        print(f"ESTOQUE POR REGIÃO:")
        print(f"{'='*60}")
        
        # Buscar estoques
        estoques = EstoqueRegional.query.filter_by(item_id=wafer.id).order_by(EstoqueRegional.regiao_numero).all()
        
        if estoques:
            for est in estoques:
                inicial = float(est.quantidade_inicial.replace('.', '').replace(',', '.'))
                gasto = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
                disponivel = inicial - gasto
                
                print(f"\nRegião {est.regiao_numero}:")
                print(f"  Inicial: {inicial:,.2f}")
                print(f"  Gasto: {gasto:,.2f}")
                print(f"  Disponível: {disponivel:,.2f}")
                
                if est.regiao_numero == 5:
                    print(f"  ⚠️ REGIÃO 5 - Necessário: 400,00")
                    if disponivel < 400:
                        print(f"  ❌ INSUFICIENTE! Faltam: {400 - disponivel:,.2f}")
                    else:
                        print(f"  ✅ SUFICIENTE!")
        else:
            print("❌ Nenhum estoque cadastrado para este item!")
            print("\n💡 SOLUÇÃO: Cadastre o estoque inicial nas 6 regiões")
    else:
        print("❌ Item 'Wafer' não encontrado!")
        print("\n📋 Listando todos os itens disponíveis:")
        
        itens = Item.query.all()
        for item in itens:
            print(f"  - ID {item.id}: {item.descricao}")
