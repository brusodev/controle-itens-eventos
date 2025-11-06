"""
Script para testar se os preços estão sendo carregados corretamente no PDF
"""

from app import create_app
from models import db, OrdemServico, EstoqueRegional, Item

def testar_preco_pdf():
    """Testa os dados que serão usados no PDF"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 TESTE DE PREÇOS NO PDF")
        print("="*80)
        
        # Buscar uma O.S. de teste
        os = OrdemServico.query.first()
        
        if not os:
            print("❌ Nenhuma O.S. encontrada!")
            return
        
        print(f"\n📋 O.S.: {os.numero_os}")
        print(f"   Grupo: {os.grupo}")
        print(f"   Região Estoque: {os.regiao_estoque}")
        
        # Converter para dict (como é feito no PDF)
        dados_pdf = os.to_dict(incluir_itens=True)
        
        print(f"\n📦 Itens da O.S.:")
        for item_os in dados_pdf.get('itens', []):
            print(f"\n   Item: {item_os['descricao']}")
            print(f"   Item ID: {item_os.get('itemId')}")
            print(f"   Quantidade Total: {item_os.get('qtdTotal')}")
            
            # Buscar preço como o PDF faz
            item_id = item_os.get('itemId')
            regiao_estoque = dados_pdf.get('regiaoEstoque')
            
            if item_id and regiao_estoque:
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item_id,
                    regiao_numero=regiao_estoque
                ).first()
                
                if estoque:
                    print(f"   ✅ Estoque encontrado:")
                    print(f"      - Região: {estoque.regiao_numero}")
                    print(f"      - Preço: {estoque.preco}")
                    
                    # Tentar converter como o PDF faz
                    try:
                        preco_str = estoque.preco.replace('.', '').replace(',', '.')
                        valor_unit = float(preco_str)
                        print(f"      - Preço convertido: R$ {valor_unit:.2f}")
                    except Exception as e:
                        print(f"      ⚠️ Erro ao converter: {e}")
                else:
                    print(f"   ❌ Estoque NÃO encontrado para item_id={item_id}, regiao={regiao_estoque}")
            else:
                print(f"   ⚠️ Dados incompletos: item_id={item_id}, regiao={regiao_estoque}")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    testar_preco_pdf()
