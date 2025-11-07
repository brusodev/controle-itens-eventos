"""
Procurar O.S. com Kit Lanche, diária 1, qtd 25
"""

from app import create_app
from models import db, OrdemServico, ItemOrdemServico

def procurar_os_kit_lanche():
    """Procura O.S. com os dados do print"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 PROCURANDO O.S. COM KIT LANCHE")
        print("="*80)
        
        # Buscar itens de Kit Lanche com diária 1
        itens = ItemOrdemServico.query.filter_by(
            descricao='Kit Lanche',
            diarias=1
        ).all()
        
        print(f"\n✅ Encontrados {len(itens)} registros de Kit Lanche com diária=1")
        
        for item in itens:
            os = item.ordem_servico
            print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"📋 O.S.: {os.numero_os} (ID: {os.id})")
            print(f"   Grupo: {os.grupo}")
            print(f"   Região: {os.regiao_estoque}")
            print(f"   Item ID no banco: {item.item_id}")
            print(f"   Diárias: {item.diarias}")
            print(f"   Qtd Solicitada: {item.quantidade_solicitada}")
            print(f"   Qtd Total: {item.quantidade_total}")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    procurar_os_kit_lanche()
