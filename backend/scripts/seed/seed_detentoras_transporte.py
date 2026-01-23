#!/usr/bin/env python3
"""Script para popular detentoras do módulo de Transportes"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app, db
from models import Detentora

app = create_app()

def seed_detentoras():
    with app.app_context():
        print("🚀 Populando detentoras do módulo de Transportes...")
        
        # Dados das detentoras para Transportes (exemplo)
        detentoras_data = [
            {
                'nome': 'TRANS-TURISMO LTDA',
                'cnpj': '11.222.333/0001-44',
                'contrato_num': '050/DA/2024',
                'data_assinatura': '2024-01-15',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 1,
                'modulo': 'transporte'
            },
            {
                'nome': 'LOGISTICA & TRANSPORTES S.A.',
                'cnpj': '22.333.444/0001-55',
                'contrato_num': '051/DA/2024',
                'data_assinatura': '2024-02-10',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 2,
                'modulo': 'transporte'
            },
            {
                'nome': 'MOVE BRASIL TRANSPORTES',
                'cnpj': '33.444.555/0001-66',
                'contrato_num': '052/DA/2024',
                'data_assinatura': '2024-03-05',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 3,
                'modulo': 'transporte'
            },
            {
                'nome': 'VIAÇÃO REGIONAL LTDA',
                'cnpj': '44.555.666/0001-77',
                'contrato_num': '053/DA/2024',
                'data_assinatura': '2024-04-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 4,
                'modulo': 'transporte'
            },
            {
                'nome': 'EXPRESSO NORTE-SUL',
                'cnpj': '55.666.777/0001-88',
                'contrato_num': '054/DA/2024',
                'data_assinatura': '2024-05-12',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 5,
                'modulo': 'transporte'
            },
            {
                'nome': 'TRANSPORTADORA CENTRAL',
                'cnpj': '66.777.888/0001-99',
                'contrato_num': '055/DA/2024',
                'data_assinatura': '2024-06-20',
                'prazo_vigencia': '12 MESES',
                'servico': 'TRANSPORTE E FRETAMENTO',
                'grupo': 6,
                'modulo': 'transporte'
            }
        ]
        
        for det_info in detentoras_data:
            det = Detentora.query.filter_by(grupo=det_info['grupo'], modulo='transporte').first()
            if not det:
                det = Detentora(**det_info)
                db.session.add(det)
                print(f"🏢 Detentora criada para Grupo {det_info['grupo']}: {det_info['nome']}")
            else:
                print(f"ℹ️ Detentora já existe para Grupo {det_info['grupo']}")
        
        db.session.commit()
        print("✅ Seed de detentoras concluído!")

if __name__ == '__main__':
    seed_detentoras()
