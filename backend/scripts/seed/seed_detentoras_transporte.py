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
        
        # Dados REAIS das detentoras para Transportes (extraídos do banco local)
        detentoras_data = [
            {
                'nome': 'ENTRAN',
                'cnpj': '27.263.325/0006-28',
                'contrato_num': '017/COGESPA/2025',
                'data_assinatura': '2026-12-20',
                'prazo_vigencia': '12 MESES',
                'servico': 'SERVIÇOS DE TRANSPORTE',
                'grupo': 1,
                'modulo': 'transporte'
            },
            {
                'nome': 'Transporte Rapidão',
                'cnpj': '89.787.979/7879-87',
                'contrato_num': '015/COGESPA/2025',
                'data_assinatura': '2025-12-05',
                'prazo_vigencia': '12 MESES',
                'servico': 'SERVIÇOS DE TRANSPORTE',
                'grupo': 4,
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
