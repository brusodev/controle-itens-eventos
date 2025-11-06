"""
Verificar O.S. 15/2025 específica
"""

from app import create_app
from models import db, OrdemServico, ItemOrdemServico, EstoqueRegional

def verificar_os_15():
    """Verifica a O.S. 15/2025"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("🔍 VERIFICAÇÃO DETALHADA: O.S. 15/2025")
        print("="*80)
        
        # Buscar O.S.
        os = OrdemServico.query.filter_by(numero_os='15/2025').first()
        
        if not os:
            print("❌ O.S. 15/2025 não encontrada!")
            return
        
        print(f"\n📋 O.S.: {os.numero_os}")
        print(f"   ID: {os.id}")
        print(f"   Grupo: {os.grupo}")
        print(f"   Região Estoque: {os.regiao_estoque}")
        
        # Converter para dict
        dados_pdf = os.to_dict(incluir_itens=True)
        
        print(f"\n📦 Dados que vão para o PDF:")
        print(f"   regiaoEstoque: {dados_pdf.get('regiaoEstoque')}")
        
        for item in dados_pdf.get('itens', []):
            print(f"\n   Item: {item['descricao']}")
            print(f"   itemId: {item['itemId']}")
            print(f"   diarias: {item['diarias']}")
            print(f"   qtdSolicitada: {item['qtdSolicitada']}")
            print(f"   qtdTotal: {item['qtdTotal']}")
            
            # Buscar preço
            estoque = EstoqueRegional.query.filter_by(
                item_id=item['itemId'],
                regiao_numero=dados_pdf.get('regiaoEstoque')
            ).first()
            
            if estoque:
                print(f"   ✅ Preço no banco: {estoque.preco}")
                
                # Simular conversão do PDF
                try:
                    preco_str = estoque.preco.replace('.', '').replace(',', '.')
                    valor_unit = float(preco_str)
                    qtd_total = float(item['qtdTotal'])
                    total = qtd_total * valor_unit
                    
                    print(f"   💰 Cálculo:")
                    print(f"      {qtd_total} × R$ {valor_unit:.2f} = R$ {total:.2f}")
                except Exception as e:
                    print(f"   ⚠️ Erro: {e}")
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    verificar_os_15()
