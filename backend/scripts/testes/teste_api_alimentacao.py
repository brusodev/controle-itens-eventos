from app import create_app
from models import Categoria, Item, EstoqueRegional

app = create_app()

with app.app_context():
    print('\n' + '='*60)
    print('TESTE: API de Alimentação - Dados Retornados')
    print('='*60 + '\n')
    
    # Simular o que a API retorna
    categorias = Categoria.query.filter_by(tipo='alimentacao').all()
    
    for cat in categorias:
        print(f'\n📦 CATEGORIA: {cat.nome} ({cat.natureza})')
        print('-' * 60)
        
        for item in cat.itens[:2]:  # Mostrar só os 2 primeiros
            print(f'\n   🔹 Item: {item.descricao}')
            print(f'      Unidade: {item.unidade}')
            
            # Verificar estoques
            for est in item.estoques:
                inicial = float(est.quantidade_inicial.replace('.', '').replace(',', '.'))
                gasto = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
                disponivel = inicial - gasto
                
                print(f'      Região {est.regiao_numero}:')
                print(f'         - Inicial: {inicial:,.0f}')
                print(f'         - Gasto: {gasto:,.0f}')
                print(f'         - Disponível: {disponivel:,.0f}')
            
            # Mostrar o to_dict()
            print(f'\n      📋 to_dict() retorna:')
            item_dict = item.to_dict()
            print(f'         Regiões: {item_dict["regioes"]}')
    
    print('\n' + '='*60)
    print('✅ Teste concluído!')
    print('='*60 + '\n')
