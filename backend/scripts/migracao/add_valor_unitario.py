#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de Migração: Adicionar campo valor_unitario à tabela itens_ordem_servico

Este script adiciona o campo 'valor_unitario' às Ordens de Serviço existentes.
Sem este campo, os valores dos itens mostram como R$ 0,00 nas visualizações.

Uso:
    python add_valor_unitario.py
"""

import sys
import os
import sqlite3
from datetime import datetime

# Adicionar o diretório do backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

from app import create_app, db
from models import ItemOrdemServico

def criar_backup():
    """Cria backup do banco antes da migração"""
    db_path = 'instance/controle_itens.db'
    backup_path = f'instance/controle_itens_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
    
    if os.path.exists(db_path):
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup criado: {backup_path}")
        return backup_path
    return None


def add_coluna_valor_unitario():
    """Adiciona a coluna valor_unitario à tabela"""
    db_path = 'instance/controle_itens.db'
    
    if not os.path.exists(db_path):
        print("❌ Banco de dados não encontrado em:", db_path)
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se coluna já existe
        cursor.execute("PRAGMA table_info(itens_ordem_servico)")
        colunas = [col[1] for col in cursor.fetchall()]
        
        if 'valor_unitario' in colunas:
            print("⚠️  Coluna 'valor_unitario' já existe na tabela!")
            conn.close()
            return True
        
        # Adicionar coluna
        print("\n🔧 Adicionando coluna 'valor_unitario' à tabela 'itens_ordem_servico'...")
        cursor.execute("""
            ALTER TABLE itens_ordem_servico 
            ADD COLUMN valor_unitario VARCHAR(20) DEFAULT '0'
        """)
        
        print("✅ Coluna adicionada com sucesso!")
        
        # Verificar integridade
        cursor.execute("PRAGMA table_info(itens_ordem_servico)")
        colunas = [col[1] for col in cursor.fetchall()]
        print(f"\n📋 Colunas da tabela agora:\n{', '.join(colunas)}\n")
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {str(e)}")
        return False


def verificar_dados():
    """Verifica e mostra resumo dos dados"""
    try:
        app = create_app()
        with app.app_context():
            total_itens = ItemOrdemServico.query.count()
            itens_sem_valor = ItemOrdemServico.query.filter(
                (ItemOrdemServico.valor_unitario == '0') | 
                (ItemOrdemServico.valor_unitario == None)
            ).count()
            
            print(f"\n📊 Resumo do Banco de Dados:")
            print(f"   - Total de itens em O.S.: {total_itens}")
            print(f"   - Itens sem valor definido: {itens_sem_valor}")
            
            return total_itens, itens_sem_valor
            
    except Exception as e:
        print(f"⚠️  Erro ao verificar dados: {str(e)}")
        return 0, 0


def main():
    """Executa a migração"""
    print("="*70)
    print("MIGRAÇÃO: Adicionar campo valor_unitario")
    print("="*70)
    
    # Criar backup
    print("\n📦 Criando backup do banco de dados...")
    backup = criar_backup()
    
    if not backup:
        print("⚠️  Nenhum backup foi criado (banco pode não existir ainda)")
    
    # Adicionar coluna
    print("\n🔧 Adicionando coluna ao banco de dados...")
    if not add_coluna_valor_unitario():
        print("\n❌ Falha na migração!")
        return False
    
    # Verificar dados
    print("\n✅ Verificando dados...")
    total, sem_valor = verificar_dados()
    
    print("\n" + "="*70)
    print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print("="*70)
    print(f"""
Próximas etapas:

1. ✅ Coluna 'valor_unitario' foi adicionada à tabela
2. ⏳ Novos itens de O.S. terão seus valores salvos automaticamente
3. 📝 Para O.S. anteriores, os valores mostrarão como R$ 0,00
   (isso é normal - eles foram emitidos antes desta migração)

Se precisar recalcular valores antigos:
- Use a rota de edição para atualizar uma O.S. existente
- Isso salvará o novo valor

Backup criado em: {backup or 'N/A'}
    """)
    
    return True


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Migração cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
