"""
Script de migração de dados do itens.json para o banco SQLite
Execute: python migrate_data.py
"""

import json
import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from models import db, Categoria, Item, EstoqueRegional

def migrar_dados():
    app = create_app()
    
    with app.app_context():
        print("🔄 Iniciando migração de dados...")
        
        # Limpar banco (cuidado em produção!)
        print("🗑️  Limpando tabelas existentes...")
        db.drop_all()
        db.create_all()
        
        # Carregar JSON
        print("📂 Carregando itens.json...")
        with open('../itens.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        # Migrar alimentação
        print("🍽️  Migrando dados de alimentação...")
        if 'alimentacao' in dados:
            for categoria_nome, categoria_data in dados['alimentacao'].items():
                # Criar categoria
                categoria = Categoria(
                    nome=categoria_nome,
                    tipo='alimentacao',
                    natureza=categoria_data.get('natureza', '')
                )
                db.session.add(categoria)
                db.session.flush()
                
                print(f"  ✅ Categoria: {categoria_nome} (Natureza: {categoria.natureza})")
                
                # Criar itens
                for item_data in categoria_data.get('itens', []):
                    item = Item(
                        categoria_id=categoria.id,
                        item_codigo=item_data['item'],
                        descricao=item_data['descricao'],
                        unidade=item_data['unidade']
                    )
                    db.session.add(item)
                    db.session.flush()
                    
                    # Criar estoques regionais
                    for regiao_num, qtds in item_data.get('regioes', {}).items():
                        estoque = EstoqueRegional(
                            item_id=item.id,
                            regiao_numero=int(regiao_num),
                            quantidade_inicial=qtds.get('inicial', '0'),
                            quantidade_gasto=qtds.get('gasto', '0')
                        )
                        db.session.add(estoque)
                    
                    print(f"    ➕ Item {item.item_codigo}: {item.descricao}")
        
        # Commit final
        db.session.commit()
        print("\n✨ Migração concluída com sucesso!")
        
        # Estatísticas
        total_categorias = Categoria.query.count()
        total_itens = Item.query.count()
        total_estoques = EstoqueRegional.query.count()
        
        print(f"\n📊 Estatísticas:")
        print(f"   Categorias: {total_categorias}")
        print(f"   Itens: {total_itens}")
        print(f"   Estoques regionais: {total_estoques}")

if __name__ == '__main__':
    migrar_dados()
