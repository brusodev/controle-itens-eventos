"""
Teste rápido de geração de PDF com os ajustes de layout
"""
import sys
sys.path.insert(0, 'C:\\Users\\bruno.vargas\\Desktop\\PROJETOS\\controle-itens-eventos\\backend')

from app import create_app
from models import OrdemServico
from pdf_generator import gerar_pdf_os

print("=" * 70)
print("TESTE DE GERAÇÃO DE PDF COM LAYOUT AJUSTADO")
print("=" * 70)

app = create_app()

with app.app_context():
    # Buscar O.S. ID 1
    os = OrdemServico.query.get(1)
    
    if not os:
        print("❌ O.S. ID 1 não encontrada!")
    else:
        print(f"✅ O.S. encontrada: {os.numero_os} - {os.evento}")
        
        try:
            # Preparar dados
            dados_pdf = os.to_dict(incluir_itens=True)
            print(f"✅ to_dict() OK")
            print(f"📅 Data de emissão: {dados_pdf.get('dataEmissao')}")
            
            # Gerar PDF
            print("\n🚀 Gerando PDF...")
            pdf_buffer = gerar_pdf_os(dados_pdf)
            tamanho = len(pdf_buffer.getvalue())
            print(f"✅ PDF gerado! Tamanho: {tamanho:,} bytes")
            
            # Salvar para testar
            output_file = 'C:\\Users\\bruno.vargas\\Desktop\\PROJETOS\\controle-itens-eventos\\backend\\teste_pdf_layout.pdf'
            with open(output_file, 'wb') as f:
                f.write(pdf_buffer.getvalue())
            print(f"✅ PDF salvo como: {output_file}")
            print("\n📂 Abra o arquivo para verificar:")
            print("   - Logo/timbrado no canto superior esquerdo")
            print("   - Caixa com DATA/NÚMERO no canto superior direito")
            print("   - Data formatada como dd/mm/yyyy (não timestamp)")
            print("   - Data de assinatura centralizada")
            print("   - Nomes e cargos centralizados embaixo das linhas")
            
        except Exception as e:
            print(f"\n❌ ERRO: {e}")
            import traceback
            traceback.print_exc()
