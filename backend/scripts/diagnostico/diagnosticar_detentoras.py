"""
Script de diagnóstico para verificar Detentoras no banco de dados
"""
import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from models import db, Detentora

# Criar app Flask para contexto
app = Flask(__name__)
# Caminho absoluto para o banco de dados
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'controle_itens.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def diagnosticar_detentoras():
    with app.app_context():
        print('=' * 60)
        print('🔍 DIAGNÓSTICO: Detentoras')
        print('=' * 60)
        
        # Verificar se a tabela existe
        try:
            total = Detentora.query.count()
            print(f'\n✅ Tabela "detentoras" existe')
            print(f'📊 Total de registros: {total}')
            
            if total == 0:
                print('\n⚠️  NENHUMA DETENTORA CADASTRADA!')
                print('\nPara cadastrar, acesse:')
                print('   🏢 Menu Lateral → Detentoras → ➕ Nova Detentora')
                print('\nOu execute:')
                print('   python criar_detentora_teste.py')
            else:
                print('\n📋 Detentoras cadastradas:')
                print('-' * 60)
                
                detentoras = Detentora.query.all()
                for d in detentoras:
                    status = '✅ ATIVA' if d.ativo else '❌ INATIVA'
                    print(f'\nID: {d.id} | Grupo: {d.grupo} | {status}')
                    print(f'   Nome: {d.nome}')
                    print(f'   Contrato: {d.contrato_num}')
                    print(f'   CNPJ: {d.cnpj}')
                    print(f'   Serviço: {d.servico}')
                
                print('\n' + '-' * 60)
                print(f'✅ Total de ativas: {Detentora.query.filter_by(ativo=True).count()}')
                print(f'❌ Total de inativas: {Detentora.query.filter_by(ativo=False).count()}')
                
                # Verificar grupos sem detentora
                grupos_cadastrados = {d.grupo for d in Detentora.query.filter_by(ativo=True).all()}
                grupos_faltantes = set(str(i) for i in range(1, 11)) - grupos_cadastrados
                
                if grupos_faltantes:
                    print(f'\n⚠️  Grupos SEM detentora ativa: {", ".join(sorted(grupos_faltantes))}')
                else:
                    print('\n✅ Todos os grupos (1-10) têm detentora cadastrada!')
        
        except Exception as e:
            print(f'\n❌ ERRO ao acessar tabela "detentoras": {e}')
            print('\nExecute a migração:')
            print('   python migrar_detentoras.py')
        
        print('\n' + '=' * 60)

if __name__ == '__main__':
    diagnosticar_detentoras()
