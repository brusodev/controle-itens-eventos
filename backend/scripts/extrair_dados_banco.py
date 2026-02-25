#!/usr/bin/env python3
"""Script para extrair dados do banco local e gerar seeds"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional, Detentora

app = create_app()

def extrair_detentoras():
    """Extrai detentoras do banco para gerar seeds"""
    with app.app_context():
        print("=" * 80)
        print("EXTRAÇÃO DE DETENTORAS DO BANCO LOCAL")
        print("=" * 80)
        
        detentoras = Detentora.query.order_by(Detentora.modulo, Detentora.grupo).all()
        
        por_modulo = {}
        for det in detentoras:
            modulo = det.modulo or 'sem_modulo'
            if modulo not in por_modulo:
                por_modulo[modulo] = []
            por_modulo[modulo].append(det)
        
        for modulo, dets in sorted(por_modulo.items()):
            print(f"\n{'='*80}")
            print(f"MÓDULO: {modulo.upper()}")
            print(f"{'='*80}\n")
            
            print(f"detentoras_data = [")
            for det in dets:
                print(f"    {{")
                print(f"        'nome': '{det.nome}',")
                print(f"        'cnpj': '{det.cnpj}',")
                print(f"        'contrato_num': '{det.contrato_num}',")
                print(f"        'data_assinatura': '{det.data_assinatura}',")
                print(f"        'prazo_vigencia': '{det.prazo_vigencia}',")
                print(f"        'servico': '{det.servico}',")
                print(f"        'grupo': {det.grupo},")
                print(f"        'modulo': '{det.modulo}',")
                print(f"        'ativo': {det.ativo}")
                print(f"    }},")
            print(f"]")

def extrair_itens_transporte():
    """Extrai itens de transporte do banco"""
    with app.app_context():
        print("\n" + "=" * 80)
        print("EXTRAÇÃO DE ITENS DE TRANSPORTE")
        print("=" * 80)
        
        categorias = Categoria.query.filter_by(modulo='transporte').all()
        
        for cat in categorias:
            print(f"\nCategoria: {cat.nome}")
            print(f"  Tipo: {cat.tipo}")
            print(f"  Natureza: {cat.natureza}")
            print()
            
            itens = Item.query.filter_by(categoria_id=cat.id).all()
            for item in itens:
                print(f"  Item {item.item_codigo}: {item.descricao}")
                print(f"    Unidade: {item.unidade}")
                
                estoques = EstoqueRegional.query.filter_by(item_id=item.id).order_by(EstoqueRegional.regiao_numero).all()
                print(f"    Estoques:")
                for est in estoques:
                    print(f"      Região {est.regiao_numero}: inicial={est.quantidade_inicial}, preco={est.preco}")

def comparar_seeds_com_banco():
    """Compara seeds com banco"""
    with app.app_context():
        print("\n" + "=" * 80)
        print("COMPARAÇÃO SEEDS vs BANCO")
        print("=" * 80)
        
        print("\n📊 RESUMO:")
        
        modulos = ['coffee', 'hospedagem', 'organizacao', 'transporte']
        
        for modulo in modulos:
            cats = Categoria.query.filter_by(modulo=modulo).all()
            total_itens = sum([Item.query.filter_by(categoria_id=c.id).count() for c in cats])
            dets = Detentora.query.filter_by(modulo=modulo).all()
            
            print(f"\n{modulo.upper()}:")
            print(f"  Categorias: {len(cats)}")
            print(f"  Itens: {total_itens}")
            print(f"  Detentoras: {len(dets)}")
            
            if modulo == 'coffee':
                print(f"  ✅ seed_coffee_fix.py - OK (usa itens.json)")
                if len(dets) == 6:
                    print(f"  ✅ seed_detentoras_coffee.py - OK")
                else:
                    print(f"  ⚠️ seed_detentoras_coffee.py - FALTAM {6-len(dets)} detentoras")
            
            elif modulo == 'hospedagem':
                print(f"  ✅ seed_hospedagem.py - OK")
                if len(dets) == 6:
                    print(f"  ✅ Detentoras - OK")
                else:
                    print(f"  ⚠️ FALTAM {6-len(dets)} detentoras de hospedagem")
            
            elif modulo == 'organizacao':
                print(f"  ✅ seed_organizacao.py - OK")
                if len(dets) == 3:
                    print(f"  ✅ Detentoras - OK")
                else:
                    print(f"  ⚠️ FALTAM {3-len(dets)} detentoras de organização")
            
            elif modulo == 'transporte':
                print(f"  ⚠️ seed_transportes.py - VERIFICAR (banco tem {len(cats)} categorias)")
                if len(dets) == 6:
                    print(f"  ✅ Detentoras - OK")
                else:
                    print(f"  ⚠️ FALTAM {6-len(dets)} detentoras de transporte")

if __name__ == '__main__':
    extrair_detentoras()
    extrair_itens_transporte()
    comparar_seeds_com_banco()
