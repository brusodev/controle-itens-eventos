"""
Teste final: Gera PDF e mostra os valores calculados
"""

from app import create_app
from models import db, OrdemServico, EstoqueRegional
from pdf_generator import gerar_pdf_os

def testar_pdf_final():
    """Testa geração do PDF com os preços"""
    
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*80)
        print("📄 TESTE FINAL: GERAÇÃO DE PDF COM PREÇOS")
        print("="*80)
        
        # Buscar O.S.
        os = OrdemServico.query.first()
        
        if not os:
            print("❌ Nenhuma O.S. encontrada!")
            return
        
        print(f"\n📋 O.S.: {os.numero_os}")
        print(f"   Região: {os.regiao_estoque}")
        
        # Preparar dados
        dados_pdf = os.to_dict(incluir_itens=True)
        
        print(f"\n📦 Itens e Cálculos:")
        valor_total_os = 0
        
        for item in dados_pdf.get('itens', []):
            print(f"\n   {item['descricao']}")
            
            item_id = item.get('itemId')
            regiao = dados_pdf.get('regiaoEstoque')
            qtd_total = float(item.get('qtdTotal', 0))
            
            # Buscar preço
            estoque = EstoqueRegional.query.filter_by(
                item_id=item_id,
                regiao_numero=regiao
            ).first()
            
            if estoque and estoque.preco:
                preco_str = estoque.preco.replace('.', '').replace(',', '.')
                valor_unit = float(preco_str)
                total_item = qtd_total * valor_unit
                valor_total_os += total_item
                
                print(f"      Quantidade: {qtd_total}")
                print(f"      Preço Unit: R$ {valor_unit:.2f}")
                print(f"      Total Item: R$ {total_item:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))
            else:
                print(f"      ⚠️ Sem preço cadastrado")
        
        print(f"\n💰 VALOR TOTAL DA O.S.: R$ {valor_total_os:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))
        
        # Gerar PDF
        print(f"\n📄 Gerando PDF...")
        try:
            pdf_buffer = gerar_pdf_os(dados_pdf)
            print(f"   ✅ PDF gerado com sucesso!")
            print(f"   📦 Tamanho: {len(pdf_buffer.getvalue())} bytes")
        except Exception as e:
            print(f"   ❌ Erro ao gerar PDF: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    testar_pdf_final()
