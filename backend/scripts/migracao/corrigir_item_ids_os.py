"""
Corrigir item_id dos itens nas O.S. existentes
"""

from app import create_app
from models import db, ItemOrdemServico, Item

def corrigir_item_ids():
    """Corrige os item_id baseado na descrição"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔧 CORREÇÃO: ITEM_ID DAS O.S.")
        print("="*80)
        
        # Buscar todos os itens da O.S.
        itens_os = ItemOrdemServico.query.all()
        
        print(f"\n✅ Encontrados {len(itens_os)} itens em O.S.")
        
        corrigidos = 0
        erros = 0
        
        for item_os in itens_os:
            # Buscar o item correto pela descrição
            item_correto = Item.query.filter_by(descricao=item_os.descricao).first()
            
            if item_correto:
                if item_os.item_id != item_correto.id:
                    print(f"\n🔧 Corrigindo:")
                    print(f"   Descrição: {item_os.descricao}")
                    print(f"   item_id antigo: {item_os.item_id}")
                    print(f"   item_id novo: {item_correto.id}")
                    
                    item_os.item_id = item_correto.id
                    corrigidos += 1
            else:
                print(f"\n⚠️ ERRO: Item não encontrado para '{item_os.descricao}'")
                erros += 1
        
        if corrigidos > 0:
            db.session.commit()
            print(f"\n✅ {corrigidos} itens corrigidos!")
        else:
            print(f"\n✅ Nenhuma correção necessária!")
        
        if erros > 0:
            print(f"⚠️ {erros} itens com erro!")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    corrigir_item_ids()
