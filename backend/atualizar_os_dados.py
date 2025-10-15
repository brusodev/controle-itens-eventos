#!/usr/bin/env python3
"""Atualizar O.S. #1 com dados faltantes"""

from app import create_app, db
from models import OrdemServico

app = create_app()

with app.app_context():
    os = db.session.get(OrdemServico, 1)
    
    if os:
        print("=" * 60)
        print("ATUALIZANDO O.S. #1 COM DADOS FALTANTES")
        print("=" * 60)
        
        # Dados do screenshot
        os.data_assinatura = "04/11/2025"
        os.prazo_vigencia = "12 MESES"
        os.servico = "COFFEE BREAK"
        os.grupo = "5"
        os.horario = "14:00"
        
        # Manter data de emissão formatada
        if not os.data_emissao_completa:
            os.data_emissao_completa = "13/10/2025"
        
        db.session.commit()
        
        print("✅ O.S. atualizada com sucesso!")
        print()
        print("Dados atualizados:")
        print(f"  Data Assinatura: {os.data_assinatura}")
        print(f"  Prazo Vigência: {os.prazo_vigencia}")
        print(f"  Serviço: {os.servico}")
        print(f"  Grupo: {os.grupo}")
        print(f"  Horário: {os.horario}")
        print("=" * 60)
    else:
        print("O.S. não encontrada")
