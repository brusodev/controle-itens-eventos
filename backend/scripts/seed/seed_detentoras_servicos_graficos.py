#!/usr/bin/env python3
"""Script para popular a detentora do módulo de Serviços Gráficos (Contrato 2021/26)"""

import sys
from pathlib import Path

# Adicionar o diretório backend ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Detentora

app = create_app()


def seed_detentoras_servicos_graficos():
    with app.app_context():
        print("🚀 Populando detentoras do módulo de Serviços Gráficos...")

        detentoras_data = [
            {
                'nome': 'SP MIDIA DIGITAL & COMUNICAÇÃO VISUAL LTDA',
                'cnpj': '36.280.886/0001-11',
                'contrato_num': '2021/26',
                'data_assinatura': '2026-07-24',
                'prazo_vigencia': '12 MESES',
                'servico': 'SERVIÇOS GRÁFICOS',
                'grupo': 1,
                'modulo': 'servicos_graficos',
            }
        ]

        for det_info in detentoras_data:
            det = Detentora.query.filter_by(grupo=det_info['grupo'], modulo='servicos_graficos').first()
            if not det:
                det = Detentora(**det_info)
                db.session.add(det)
                print(f"🏢 Detentora criada para Grupo {det_info['grupo']}: {det_info['nome']}")
            else:
                print(f"ℹ️ Detentora já existe para Grupo {det_info['grupo']}")

        db.session.commit()
        print("✅ Seed de detentoras concluído!")


if __name__ == '__main__':
    seed_detentoras_servicos_graficos()
