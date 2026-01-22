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
        
        # Dados das detentoras para Coffee Break (Grupos 1 a 6)
        # Usando dados genéricos/placeholder baseados no padrão do projeto
        detentoras_data = [
            {
                'nome': 'DETENTORA GRUPO 1 - COFFEE',
                'cnpj': '00.000.000/0001-01',
                'contrato_num': '014/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '1',
                'modulo': 'coffee'
            },
            {
                'nome': 'DETENTORA GRUPO 2 - COFFEE',
                'cnpj': '00.000.000/0002-02',
                'contrato_num': '015/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '2',
                'modulo': 'coffee'
            },
            {
                'nome': 'DETENTORA GRUPO 3 - COFFEE',
                'cnpj': '00.000.000/0003-03',
                'contrato_num': '016/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '3',
                'modulo': 'coffee'
            },
            {
                'nome': 'DETENTORA GRUPO 4 - COFFEE',
                'cnpj': '00.000.000/0004-04',
                'contrato_num': '017/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '4',
                'modulo': 'coffee'
            },
            {
                'nome': 'DETENTORA GRUPO 5 - COFFEE',
                'cnpj': '00.000.000/0005-05',
                'contrato_num': '018/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '5',
                'modulo': 'coffee'
            },
            {
                'nome': 'DETENTORA GRUPO 6 - COFFEE',
                'cnpj': '00.000.000/0006-06',
                'contrato_num': '019/DA/2024',
                'data_assinatura': '2024-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'COFFEE BREAK',
                'grupo': '6',
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
