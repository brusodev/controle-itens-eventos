"""
Adicionar estoque do Wafer na região 5
"""
from app import create_app
from models import db, EstoqueRegional

app = create_app()

with app.app_context():
    # ID do Wafer: 14
    # Região: 5
    
    # Buscar estoque existente
    estoque = EstoqueRegional.query.filter_by(item_id=14, regiao_numero=5).first()
    
    if estoque:
        print(f"\n✅ Estoque encontrado para Wafer - Região 5")
        print(f"Quantidade Inicial ATUAL: {estoque.quantidade_inicial}")
        print(f"Quantidade Gasto: {estoque.quantidade_gasto}")
        
        # Atualizar quantidade inicial
        nova_quantidade = input("\nDigite a nova quantidade inicial (ex: 1000): ")
        
        estoque.quantidade_inicial = nova_quantidade
        db.session.commit()
        
        print(f"\n✅ Estoque atualizado com sucesso!")
        print(f"Nova quantidade inicial: {nova_quantidade}")
    else:
        print(f"\n❌ Estoque não encontrado. Criando novo registro...")
        
        nova_quantidade = input("Digite a quantidade inicial (ex: 1000): ")
        
        novo_estoque = EstoqueRegional(
            item_id=14,
            regiao_numero=5,
            quantidade_inicial=nova_quantidade,
            quantidade_gasto='0'
        )
        
        db.session.add(novo_estoque)
        db.session.commit()
        
        print(f"\n✅ Estoque criado com sucesso!")
        print(f"Item ID: 14 (Wafer)")
        print(f"Região: 5")
        print(f"Quantidade Inicial: {nova_quantidade}")
        print(f"Quantidade Gasto: 0")
    
    print(f"\n🎉 Agora você pode emitir a O.S. para a região 5!")
