"""
Script de diagnóstico: Verificar movimentações de estoque
"""
import os
import sys

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from models import db, OrdemServico, MovimentacaoEstoque, EstoqueRegional, Item

# Criar app Flask para contexto
app = Flask(__name__)
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'controle_itens.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def diagnosticar_movimentacoes():
    with app.app_context():
        print('=' * 80)
        print('🔍 DIAGNÓSTICO: Movimentações de Estoque x Ordens de Serviço')
        print('=' * 80)
        
        # Total de O.S.
        total_os = OrdemServico.query.count()
        print(f'\n📋 Total de Ordens de Serviço: {total_os}')
        
        # Total de movimentações
        total_mov = MovimentacaoEstoque.query.count()
        print(f'📦 Total de Movimentações de Estoque: {total_mov}')
        
        # Últimas 5 O.S.
        print('\n' + '-' * 80)
        print('📋 ÚLTIMAS 5 ORDENS DE SERVIÇO:')
        print('-' * 80)
        
        ultimas_os = OrdemServico.query.order_by(OrdemServico.data_emissao.desc()).limit(5).all()
        
        for os in ultimas_os:
            print(f'\n🔢 O.S. #{os.numero_os} (ID: {os.id})')
            print(f'   Grupo: {os.grupo} | Região Estoque: {os.regiao_estoque}')
            print(f'   Emitida em: {os.data_emissao}')
            print(f'   Evento: {os.evento}')
            
            # Buscar movimentações desta O.S.
            movimentacoes = MovimentacaoEstoque.query.filter_by(ordem_servico_id=os.id).all()
            
            if movimentacoes:
                print(f'   ✅ Movimentações de Estoque: {len(movimentacoes)}')
                for mov in movimentacoes:
                    item = Item.query.get(mov.item_id)
                    estoque = EstoqueRegional.query.get(mov.estoque_regional_id)
                    print(f'      • {mov.tipo}: {item.descricao if item else "Item desconhecido"}')
                    print(f'        Quantidade: {mov.quantidade}')
                    print(f'        Região: {estoque.regiao_numero if estoque else "?"}')
                    print(f'        Data: {mov.data_movimentacao}')
            else:
                print(f'   ❌ NENHUMA movimentação de estoque encontrada!')
        
        # Verificar estoque atual
        print('\n' + '-' * 80)
        print('📦 RESUMO DE ESTOQUE POR REGIÃO (Primeiros 5 itens):')
        print('-' * 80)
        
        estoques = EstoqueRegional.query.limit(20).all()
        
        for estoque in estoques:
            item = Item.query.get(estoque.item_id)
            inicial = float(str(estoque.quantidade_inicial).replace('.', '').replace(',', '.'))
            gasto = float(str(estoque.quantidade_gasto).replace('.', '').replace(',', '.'))
            disponivel = inicial - gasto
            
            print(f'\n📍 Região {estoque.regiao_numero}: {item.descricao if item else "Item desconhecido"}')
            print(f'   Inicial: {estoque.quantidade_inicial}')
            print(f'   Gasto: {estoque.quantidade_gasto}')
            print(f'   Disponível: {disponivel:.2f}')
        
        print('\n' + '=' * 80)
        print('✅ Diagnóstico concluído!')
        print('=' * 80)

if __name__ == '__main__':
    diagnosticar_movimentacoes()
