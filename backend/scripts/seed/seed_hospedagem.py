#!/usr/bin/env python3
"""Script para popular itens iniciais do módulo de Hospedagem"""

import sys
import io
from pathlib import Path

# Forçar UTF-8 no stdout (Windows cp1252 não suporta emojis)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional

app = create_app()

def seed_hospedagem():
    with app.app_context():
        print("🏨 Populando itens do módulo de Hospedagem...")

        # 1. Criar Categorias
        categorias_data = [
            {
                'nome': 'hospedagem_pensao_completa',
                'tipo': 'alimentacao',
                'natureza': '9946',
                'modulo': 'hospedagem',
                'descricao': 'Hospedagem com Pensão Completa (Café da Manhã + Almoço + Jantar)'
            },
            {
                'nome': 'hospedagem_meia_pensao',
                'tipo': 'alimentacao',
                'natureza': '9946',
                'modulo': 'hospedagem',
                'descricao': 'Hospedagem com Meia Pensão (Café da Manhã + Almoço ou Jantar)'
            },
        ]

        categorias_criadas = {}
        for cat_info in categorias_data:
            cat = Categoria.query.filter_by(nome=cat_info['nome'], modulo='hospedagem').first()
            if not cat:
                cat = Categoria(**cat_info)
                db.session.add(cat)
                print(f"📦 Categoria criada: {cat_info['nome']}")
            else:
                print(f"ℹ️ Categoria já existe: {cat_info['nome']}")
            categorias_criadas[cat_info['nome']] = cat

        db.session.flush()

        # 2. Itens de Hospedagem
        # Quantidades iniciais de diárias por região (da planilha Hospedagem.xlsx)
        #
        # Pensão Completa (itens 1-3):
        #   Região:        1     2    3    4    5    6
        #   Single:       62     7    7    8    6    7
        #   Duplo:       743    84   84   96   72   86
        #   Triplo:      741    84   84   96   72   86
        #
        # Meia Pensão (itens 4-6):
        #   Região:        1     2    3    4    5    6
        #   Single:       62     7    7    8    6    8
        #   Duplo:       742    84   84   96   72   86
        #   Triplo:      741    84   84   96   72   86

        itens_data = [
            # === PENSÃO COMPLETA ===
            {
                'categoria': 'hospedagem_pensao_completa',
                'codigo': 'HP001',
                'descricao': 'Apartamento Single - Pensão Completa',
                'unidade': 'Diária',
                'preco': 443.69,
                'quantidades': {1: 62, 2: 7, 3: 7, 4: 8, 5: 6, 6: 7}
            },
            {
                'categoria': 'hospedagem_pensao_completa',
                'codigo': 'HP002',
                'descricao': 'Apartamento Duplo - Pensão Completa',
                'unidade': 'Diária',
                'preco': 510.81,
                'quantidades': {1: 743, 2: 84, 3: 84, 4: 96, 5: 72, 6: 86}
            },
            {
                'categoria': 'hospedagem_pensao_completa',
                'codigo': 'HP003',
                'descricao': 'Apartamento Triplo - Pensão Completa',
                'unidade': 'Diária',
                'preco': 465.36,
                'quantidades': {1: 741, 2: 84, 3: 84, 4: 96, 5: 72, 6: 86}
            },
            # === MEIA PENSÃO ===
            {
                'categoria': 'hospedagem_meia_pensao',
                'codigo': 'HP004',
                'descricao': 'Apartamento Single - Meia Pensão',
                'unidade': 'Diária',
                'preco': 472.90,
                'quantidades': {1: 62, 2: 7, 3: 7, 4: 8, 5: 6, 6: 8}
            },
            {
                'categoria': 'hospedagem_meia_pensao',
                'codigo': 'HP005',
                'descricao': 'Apartamento Duplo - Meia Pensão',
                'unidade': 'Diária',
                'preco': 385.47,
                'quantidades': {1: 742, 2: 84, 3: 84, 4: 96, 5: 72, 6: 86}
            },
            {
                'categoria': 'hospedagem_meia_pensao',
                'codigo': 'HP006',
                'descricao': 'Apartamento Triplo - Meia Pensão',
                'unidade': 'Diária',
                'preco': 385.47,
                'quantidades': {1: 741, 2: 84, 3: 84, 4: 96, 5: 72, 6: 86}
            },
        ]

        for item_info in itens_data:
            cat = categorias_criadas[item_info['categoria']]
            item = Item.query.filter_by(item_codigo=item_info['codigo'], categoria_id=cat.id).first()

            if not item:
                item = Item(
                    categoria_id=cat.id,
                    item_codigo=item_info['codigo'],
                    descricao=item_info['descricao'],
                    unidade=item_info['unidade']
                )
                db.session.add(item)
                db.session.flush()

                # Criar estoques para as 6 regiões
                for regiao in range(1, 7):
                    qtd_inicial = item_info['quantidades'].get(regiao, 0)
                    estoque = EstoqueRegional(
                        item_id=item.id,
                        regiao_numero=regiao,
                        quantidade_inicial=str(qtd_inicial),
                        quantidade_gasto='0',
                        preco=str(item_info['preco'])
                    )
                    db.session.add(estoque)
                print(f"✅ Item criado: {item_info['descricao']} (6 regiões)")
            else:
                print(f"ℹ️ Item já existe: {item_info['descricao']}")

        db.session.commit()
        print("\n✅ Seed Hospedagem concluído com sucesso!")
        print("📊 Resumo: 2 categorias, 6 itens, 36 estoques regionais")

if __name__ == "__main__":
    seed_hospedagem()
