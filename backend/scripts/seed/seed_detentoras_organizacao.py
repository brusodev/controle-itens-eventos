#!/usr/bin/env python3
"""Script para popular detentoras do módulo de Organização de Eventos"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Detentora

app = create_app()

def seed_detentoras_organizacao():
    with app.app_context():
        print("🎪 Populando detentoras do módulo de Organização...")
        
        # Dados REAIS das detentoras para Organização (extraídos do banco local)
        detentoras_data = [
            {
                'nome': 'Teste LTDA',
                'cnpj': '67.000.019/0001-89',
                'contrato_num': '014/DA/2026',
                'data_assinatura': '2026-12-20',
                'prazo_vigencia': '12 MESES',
                'servico': 'Organização',
                'grupo': 1,
                'modulo': 'organizacao'
            }
        ]
        
        for det_info in detentoras_data:
            # Verificar se já existe (por grupo e modulo)
            det = Detentora.query.filter_by(grupo=det_info['grupo'], modulo='organizacao', ativo=True).first()
            if not det:
                print(f"➕ Adicionando detentora: {det_info['nome']} (Grupo {det_info['grupo']})")
                det = Detentora(**det_info)
                db.session.add(det)
            else:
                print(f"ℹ️ Detentora já existe para Grupo {det_info['grupo']}")
        
        db.session.commit()
        print("\n✅ Seed de detentoras de Organização concluído!")

if __name__ == '__main__':
    seed_detentoras_organizacao()
