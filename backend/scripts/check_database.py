#!/usr/bin/env python3
"""Script para verificar o conteúdo do banco de dados local"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional, Detentora

app = create_app()

def check_database():
    with app.app_context():
        print("=" * 80)
        print("VERIFICAÇÃO DO BANCO DE DADOS LOCAL")
        print("=" * 80)
        
        # Verificar Categorias
        print("\n📦 CATEGORIAS:")
        categorias = Categoria.query.all()
        categorias_por_modulo = {}
        for cat in categorias:
            modulo = cat.modulo or 'sem_modulo'
            if modulo not in categorias_por_modulo:
                categorias_por_modulo[modulo] = []
            categorias_por_modulo[modulo].append(cat)
        
        for modulo, cats in sorted(categorias_por_modulo.items()):
            print(f"\n  Módulo: {modulo} ({len(cats)} categorias)")
            for cat in cats:
                itens_count = Item.query.filter_by(categoria_id=cat.id).count()
                print(f"    - {cat.nome} ({itens_count} itens)")
        
        print(f"\n  TOTAL DE CATEGORIAS: {len(categorias)}")
        
        # Verificar Itens
        print("\n📝 ITENS POR MÓDULO:")
        itens_por_modulo = {}
        for cat in categorias:
            modulo = cat.modulo or 'sem_modulo'
            itens_count = Item.query.filter_by(categoria_id=cat.id).count()
            if modulo not in itens_por_modulo:
                itens_por_modulo[modulo] = 0
            itens_por_modulo[modulo] += itens_count
        
        for modulo, count in sorted(itens_por_modulo.items()):
            print(f"  {modulo}: {count} itens")
        
        total_itens = sum(itens_por_modulo.values())
        print(f"\n  TOTAL DE ITENS: {total_itens}")
        
        # Verificar Estoques
        print("\n📊 ESTOQUES REGIONAIS:")
        total_estoques = EstoqueRegional.query.count()
        print(f"  TOTAL DE ESTOQUES: {total_estoques}")
        
        # Estoques por região
        print("\n  Estoques por região:")
        for regiao in range(1, 7):
            count = EstoqueRegional.query.filter_by(regiao_numero=regiao).count()
            print(f"    Região {regiao}: {count} estoques")
        
        # Verificar Detentoras
        print("\n🏢 DETENTORAS:")
        detentoras = Detentora.query.all()
        detentoras_por_modulo = {}
        for det in detentoras:
            modulo = det.modulo or 'sem_modulo'
            if modulo not in detentoras_por_modulo:
                detentoras_por_modulo[modulo] = []
            detentoras_por_modulo[modulo].append(det)
        
        for modulo, dets in sorted(detentoras_por_modulo.items()):
            print(f"\n  Módulo: {modulo} ({len(dets)} detentoras)")
            for det in dets:
                ativo = "✓" if det.ativo else "✗"
                print(f"    [{ativo}] Grupo {det.grupo}: {det.nome}")
        
        print(f"\n  TOTAL DE DETENTORAS: {len(detentoras)}")
        
        # Resumo por módulo
        print("\n" + "=" * 80)
        print("RESUMO POR MÓDULO:")
        print("=" * 80)
        
        todos_modulos = set(list(categorias_por_modulo.keys()) + list(detentoras_por_modulo.keys()))
        
        for modulo in sorted(todos_modulos):
            cats = len(categorias_por_modulo.get(modulo, []))
            itens = itens_por_modulo.get(modulo, 0)
            dets = len(detentoras_por_modulo.get(modulo, []))
            print(f"\n{modulo.upper()}:")
            print(f"  Categorias: {cats}")
            print(f"  Itens: {itens}")
            print(f"  Detentoras: {dets}")
        
        print("\n" + "=" * 80)

if __name__ == '__main__':
    check_database()
