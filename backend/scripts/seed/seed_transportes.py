#!/usr/bin/env python3
"""Script para popular itens iniciais do módulo de Transportes"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional

app = create_app()

def seed_transportes():
    with app.app_context():
        print("🚀 Populando itens do módulo de Transportes...")
        
        # 1. Criar Categorias para Transportes
        categorias_data = [
            {'nome': 'transporte_veiculos_leves', 'tipo': 'alimentacao', 'natureza': '339039', 'modulo': 'transporte'},
            {'nome': 'transporte_veiculos_pesados', 'tipo': 'alimentacao', 'natureza': '339039', 'modulo': 'transporte'},
            {'nome': 'transporte_fretamento', 'tipo': 'alimentacao', 'natureza': '339039', 'modulo': 'transporte'},
            {'nome': 'Veículos Passageiros', 'tipo': 'veiculos_passageiros', 'natureza': '', 'modulo': 'transporte'},
        ]
        
        categorias_criadas = {}
        for cat_info in categorias_data:
            cat = Categoria.query.filter_by(nome=cat_info['nome'], modulo='transporte').first()
            if not cat:
                cat = Categoria(**cat_info)
                db.session.add(cat)
                print(f"📦 Categoria criada: {cat_info['nome']}")
            else:
                print(f"ℹ️ Categoria já existe: {cat_info['nome']}")
            categorias_criadas[cat_info['nome']] = cat
        
        db.session.flush()
        
        # 2. Itens para Transportes
        itens_data = [
            # Veículos Leves
            {
                'categoria': 'transporte_veiculos_leves',
                'codigo': 'TL001',
                'descricao': 'Veículo Hatch (até 5 pessoas) - Diária com motorista e combustível',
                'unidade': 'Diária',
                'precos': {'1': 250, '2': 260, '3': 240, '4': 255, '5': 250, '6': 265}
            },
            {
                'categoria': 'transporte_veiculos_leves',
                'codigo': 'TL002',
                'descricao': 'Veículo Sedan (até 5 pessoas) - Diária com motorista e combustível',
                'unidade': 'Diária',
                'precos': {'1': 300, '2': 310, '3': 290, '4': 305, '5': 300, '6': 315}
            },
            # Fretamento
            {
                'categoria': 'transporte_fretamento',
                'codigo': 'TF001',
                'descricao': 'Van (até 15 pessoas) - Fretamento por KM',
                'unidade': 'KM',
                'precos': {'1': 3.50, '2': 3.60, '3': 3.40, '4': 3.55, '5': 3.50, '6': 3.70}
            },
            {
                'categoria': 'transporte_fretamento',
                'codigo': 'TF002',
                'descricao': 'Micro-Ônibus (até 28 pessoas) - Fretamento por KM',
                'unidade': 'KM',
                'precos': {'1': 5.50, '2': 5.60, '3': 5.40, '4': 5.55, '5': 5.50, '6': 5.70}
            },
            {
                'categoria': 'transporte_fretamento',
                'codigo': 'TF003',
                'descricao': 'Ônibus Executivo (até 44 pessoas) - Fretamento por KM',
                'unidade': 'KM',
                'precos': {'1': 7.50, '2': 7.60, '3': 7.40, '4': 7.55, '5': 7.50, '6': 7.70}
            },
            # Veículos Passageiros (categoria adicional do banco)
            {
                'categoria': 'Veículos Passageiros',
                'codigo': '1',
                'descricao': 'Veículo tipo ônibus com no min. 44 lugares, equipado com WC e ar-condicionado',
                'unidade': 'KM',
                'precos': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0}
            }
        ]
        
        for item_info in itens_data:
            cat = categorias_criadas[item_info['categoria']]
            item = Item.query.filter_by(item_codigo=item_info['codigo'], categoria_id=cat.id).first()

            if not item:
                item = Item(
                    categoria_id=cat.id,
                    item_codigo=item_info['codigo'],
                    descricao=item_info['descricao'],
                    unidade=item_info['unidade'],
                )
                db.session.add(item)
                db.session.flush()

                for regiao in range(1, 7):
                    preco = item_info['precos'].get(str(regiao), 0)
                    estoque = EstoqueRegional(
                        item_id=item.id,
                        regiao_numero=regiao,
                        quantidade_inicial=999999,
                        quantidade_gasto=0,
                        preco=float(preco)
                    )
                    db.session.add(estoque)
                print(f"  ✅ Item criado: {item_info['descricao']}")
            else:
                print(f"  ℹ️ Item já existe: {item_info['descricao']}")
        
        db.session.commit()
        print("\n✅ Seed Transportes concluído com sucesso!")

if __name__ == "__main__":
    seed_transportes()
