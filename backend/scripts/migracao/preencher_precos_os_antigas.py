#!/usr/bin/env python3
"""
Script para preencher preços das O.S. antigas que não possuem valor_unitario
"""
import sqlite3
import sys
import os

# Adicionar o diretório backend ao path
backend_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, backend_dir)

from app import create_app
from models import db, ItemOrdemServico, Item, OrdemServico

def preencher_precos_antigas():
    """Preenche preços das O.S. antigas buscando da tabela de itens"""
    
    print("\n" + "="*70)
    print("MIGRAÇÃO: Preencher preços de O.S. antigas")
    print("="*70)
    
    app = create_app()
    with app.app_context():
        try:
            # Buscar todos os itens de O.S. que não têm preço
            itens_sem_preco = ItemOrdemServico.query.filter(
                (ItemOrdemServico.valor_unitario == None) | 
                (ItemOrdemServico.valor_unitario == '0') |
                (ItemOrdemServico.valor_unitario == '')
            ).all()
            
            print(f"\n📊 Itens de O.S. SEM preço encontrados: {len(itens_sem_preco)}")
            
            if not itens_sem_preco:
                print("✅ Nenhum item sem preço encontrado!")
                return True
            
            atualizados = 0
            sem_preco_no_item = 0
            
            for item_os in itens_sem_preco:
                try:
                    # Buscar o item na tabela de itens
                    item = Item.query.filter_by(id=item_os.item_id).first()
                    
                    if not item:
                        print(f"   ⚠️ Item ID {item_os.item_id} não encontrado no banco")
                        continue
                    
                    # Buscar um preço de referência dos estoques regionais desse item
                    from models import EstoqueRegional
                    estoque = EstoqueRegional.query.filter_by(item_id=item_os.item_id).first()
                    
                    if estoque and estoque.preco and estoque.preco != '0':
                        item_os.valor_unitario = estoque.preco
                        atualizados += 1
                        print(f"   ✅ Item '{item.descricao}' atualizado: R$ {estoque.preco}")
                    else:
                        sem_preco_no_item += 1
                        # Se não tem preço, deixa '0'
                        item_os.valor_unitario = '0'
                        print(f"   ⚠️ Item '{item.descricao}' não tem preço definido (deixado como 0)")
                
                except Exception as e:
                    print(f"   ❌ Erro ao processar item {item_os.id}: {str(e)}")
            
            # Salvar mudanças
            db.session.commit()
            
            print(f"\n📊 RESUMO DA MIGRAÇÃO:")
            print(f"   ✅ Itens atualizados: {atualizados}")
            print(f"   ⚠️ Itens sem preço no banco: {sem_preco_no_item}")
            print(f"   📝 Total processado: {len(itens_sem_preco)}")
            
            print("\n" + "="*70)
            print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("="*70 + "\n")
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERRO ao executar migração: {str(e)}")
            print("="*70 + "\n")
            return False

if __name__ == '__main__':
    if preencher_precos_antigas():
        sys.exit(0)
    else:
        sys.exit(1)
