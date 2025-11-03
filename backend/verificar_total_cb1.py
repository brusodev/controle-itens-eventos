from app import create_app, db
from models import EstoqueRegional, Item

app = create_app()

with app.app_context():
    cb1 = Item.query.filter_by(descricao='Coffee Break Tipo 1').first()
    
    if cb1:
        estoques = EstoqueRegional.query.filter_by(item_id=cb1.id).all()
        
        print('\n=== COFFEE BREAK TIPO 1 - ESTOQUE POR REGIÃO ===\n')
        
        total = 0
        for e in estoques:
            disponivel = float(e.disponivel.replace('.', '').replace(',', '.'))
            print(f'Região {e.regiao_numero}: {disponivel:,.2f} unidades')
            total += disponivel
        
        print(f'\n{"="*50}')
        print(f'TOTAL GERAL (soma de todas as regiões): {total:,.2f} unidades')
        print(f'{"="*50}\n')
        
        # Verificar Água mineral também
        agua = Item.query.filter_by(descricao='Água mineral em copos de 200 ml').first()
        if agua:
            estoques_agua = EstoqueRegional.query.filter_by(item_id=agua.id).all()
            total_agua = 0
            
            print('\n=== ÁGUA MINERAL 200ML - ESTOQUE POR REGIÃO ===\n')
            for e in estoques_agua:
                disponivel = float(e.disponivel.replace('.', '').replace(',', '.'))
                print(f'Região {e.regiao_numero}: {disponivel:,.2f} unidades')
                total_agua += disponivel
            print(f'\n{"="*50}')
            print(f'TOTAL GERAL (soma de todas as regiões): {total_agua:,.2f} unidades')
            print(f'{"="*50}\n')
