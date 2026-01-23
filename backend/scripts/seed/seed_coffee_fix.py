#!/usr/bin/env python3
"""
Script para recuperar os itens de coffee/alimentação do arquivo JSON
sem apagar o banco de dados.
"""

import json
import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from models import db, Categoria, Item, EstoqueRegional

def recover_coffee():
    app = create_app()
    
    # Caminho do JSON na VPS (ajustado para a raiz do projeto)
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts', 'itens.json')
    
    if not os.path.exists(json_path):
        print(f"❌ Arquivo não encontrado: {json_path}")
        return

    with app.app_context():
        print("🔄 Iniciando recuperação de dados de alimentação...")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        if 'alimentacao' not in dados:
            print("❌ Seção 'alimentacao' não encontrada no JSON.")
            return

        for categoria_nome, categoria_data in dados['alimentacao'].items():
            # Verificar se a categoria já existe
            categoria = Categoria.query.filter_by(nome=categoria_nome, modulo='coffee').first()
            if not categoria:
                # Tenta sem o módulo caso seja legado
                categoria = Categoria.query.filter_by(nome=categoria_nome).first()
            
            if not categoria:
                print(f"✨ Criando categoria: {categoria_nome}")
                categoria = Categoria(
                    nome=categoria_nome,
                    tipo='alimentacao',
                    natureza=categoria_data.get('natureza', ''),
                    modulo='coffee'
                )
                db.session.add(categoria)
                db.session.flush()
            else:
                print(f"ℹ️ Categoria já existe: {categoria_nome}")
                # Garante que o módulo esteja correto
                categoria.modulo = 'coffee'
            
            # Criar itens
            for item_data in categoria_data.get('itens', []):
                # Verificar se o item já existe nesta categoria
                item = Item.query.filter_by(
                    categoria_id=categoria.id, 
                    item_codigo=str(item_data['item'])
                ).first()
                
                if not item:
                    print(f"  ➕ Criando item: {item_data['descricao']}")
                    item = Item(
                        categoria_id=categoria.id,
                        item_codigo=str(item_data['item']),
                        descricao=item_data['descricao'],
                        unidade=item_data['unidade']
                    )
                    db.session.add(item)
                    db.session.flush()
                else:
                    print(f"  ℹ️ Item já existe: {item_data['descricao']}")
                
                # Criar/Atualizar estoques regionais
                for regiao_num, qtds in item_data.get('regioes', {}).items():
                    reg_num = int(regiao_num)
                    estoque = EstoqueRegional.query.filter_by(
                        item_id=item.id, 
                        regiao_numero=reg_num
                    ).first()
                    
                    if not estoque:
                        estoque = EstoqueRegional(
                            item_id=item.id,
                            regiao_numero=reg_num,
                            quantidade_inicial=str(qtds.get('inicial', '0')),
                            quantidade_gasto=str(qtds.get('gasto', '0'))
                        )
                        db.session.add(estoque)
                    else:
                        # Se você quiser sobrescrever com os valores do JSON local:
                        estoque.quantidade_inicial = str(qtds.get('inicial', '0'))
                        estoque.quantidade_gasto = str(qtds.get('gasto', '0'))
            
            db.session.commit()

        print("\n✅ Recuperação de itens de alimentação concluída!")

if __name__ == '__main__':
    recover_coffee()
