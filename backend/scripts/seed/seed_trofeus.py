#!/usr/bin/env python3
"""Seed do módulo de Troféus: 1 categoria, 2 itens, 2 grupos/detentoras"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional, Detentora

app = create_app()


def seed_trofeus():
    with app.app_context():
        print("🏆 Populando módulo de Troféus...")

        # Categoria
        cat = Categoria.query.filter_by(nome='Troféus', modulo='trofeus').first()
        if not cat:
            cat = Categoria(
                nome='Troféus',
                tipo='estoque',
                natureza='339039',
                modulo='trofeus',
                icone='🏆',
                descricao='Troféus e premiações'
            )
            db.session.add(cat)
            print("📦 Categoria 'Troféus' criada")
        else:
            print("ℹ️ Categoria 'Troféus' já existe")

        db.session.flush()

        # Itens
        itens_data = [
            {
                'codigo': 'TR001',
                'descricao': 'Troféu Tipo 1',
                'unidade': 'UN',
                'qtd': 100,
                'preco': 0.0,
            },
            {
                'codigo': 'TR002',
                'descricao': 'Troféu Tipo 2',
                'unidade': 'UN',
                'qtd': 100,
                'preco': 0.0,
            },
        ]

        for it in itens_data:
            item = Item.query.filter_by(item_codigo=it['codigo'], categoria_id=cat.id).first()
            if not item:
                item = Item(
                    categoria_id=cat.id,
                    item_codigo=it['codigo'],
                    descricao=it['descricao'],
                    unidade=it['unidade'],
                )
                db.session.add(item)
                print(f"  ✅ Item criado: {it['descricao']}")
            else:
                print(f"  ℹ️ Item já existe: {it['descricao']}")

            db.session.flush()

            for grupo in [1, 2]:
                estoque = EstoqueRegional.query.filter_by(item_id=item.id, regiao_numero=grupo).first()
                if not estoque:
                    estoque = EstoqueRegional(
                        item_id=item.id,
                        regiao_numero=grupo,
                        quantidade_inicial=it['qtd'],
                        quantidade_gasto=0,
                        preco=it['preco'],
                    )
                    db.session.add(estoque)

        # Detentoras (duas empresas, grupos 1 e 2)
        detentoras_data = [
            {
                'nome': 'Empresa Troféus Grupo 1',
                'cnpj': '00.000.001/0001-01',
                'contrato_num': '001/COGESPA/TROFEUS',
                'data_assinatura': '2025-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'FORNECIMENTO DE TROFÉUS',
                'grupo': '1',
                'modulo': 'trofeus',
            },
            {
                'nome': 'Empresa Troféus Grupo 2',
                'cnpj': '00.000.002/0001-02',
                'contrato_num': '002/COGESPA/TROFEUS',
                'data_assinatura': '2025-01-01',
                'prazo_vigencia': '12 MESES',
                'servico': 'FORNECIMENTO DE TROFÉUS',
                'grupo': '2',
                'modulo': 'trofeus',
            },
        ]

        for det_info in detentoras_data:
            det = Detentora.query.filter_by(grupo=det_info['grupo'], modulo='trofeus').first()
            if not det:
                det = Detentora(**det_info)
                db.session.add(det)
                print(f"🏢 Detentora criada: {det_info['nome']} (Grupo {det_info['grupo']})")
            else:
                print(f"ℹ️ Detentora já existe: Grupo {det_info['grupo']}")

        db.session.commit()
        print("✅ Seed de Troféus concluído!")


if __name__ == '__main__':
    seed_trofeus()
