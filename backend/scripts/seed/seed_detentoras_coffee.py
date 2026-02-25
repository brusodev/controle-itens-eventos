#!/usr/bin/env python3
"""Script para popular detentoras do módulo de Coffee Break (Grupos 1 a 6)"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app, db
from models import Detentora

app = create_app()

def seed_detentoras_coffee():
    with app.app_context():
        print("🚀 Populando detentoras do módulo de Coffee Break...")
        
        # Dados REAIS das detentoras para Coffee Break (extraídos do banco local)
        detentoras_data = [
            {
                'nome': 'AMBP PROMOÇÕES E EVENTOS EMPRESARIAIS LTDA-EPP',
                'cnpj': '08.472.572/0001-8',
                'contrato_num': '014/DA/2024',
                'data_assinatura': '2024-11-04',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': 1,
                'modulo': 'coffee'
            },
            {
                'nome': 'XPTO LTDA',
                'cnpj': '12.456.987/0001-57',
                'contrato_num': '015/COGESPA/2025',
                'data_assinatura': '2025-11-03',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': 2,
                'modulo': 'coffee'
            },
            {
                'nome': 'ALPHA LTDA',
                'cnpj': '32.456.987/0001-36',
                'contrato_num': '016/COGESPA/2025',
                'data_assinatura': '2025-11-03',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': 3,
                'modulo': 'coffee'
            },
            {
                'nome': 'FALCON LDTA',
                'cnpj': '12.456.987/0001-57',
                'contrato_num': '017/COGESPA/2025',
                'data_assinatura': '2025-11-07',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': 4,
                'modulo': 'coffee'
            }
        ]
        
        for det_info in detentoras_data:
            # Verificar se já existe (por grupo e modulo)
            det = Detentora.query.filter_by(grupo=det_info['grupo'], modulo='coffee', ativo=True).first()
            if not det:
                print(f"➕ Adicionando detentora: {det_info['nome']} (Grupo {det_info['grupo']})")
                det = Detentora(**det_info)
                db.session.add(det)
            else:
                print(f"ℹ️ Detentora já existe para Grupo {det_info['grupo']}")
        
        db.session.commit()
        print("\n✅ Seed de detentoras de Coffee concluído!")

if __name__ == '__main__':
    seed_detentoras_coffee()
