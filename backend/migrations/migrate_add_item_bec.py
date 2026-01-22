#!/usr/bin/env python3
"""Migração: Adicionar campo item_bec em ItemOrdemServico"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar item_bec em itens_ordem_servico")
    print("=" * 60)
    
    try:
        # Verificar se coluna já existe
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM pragma_table_info('itens_ordem_servico') WHERE name='item_bec'"
        ))
        existe = result.scalar() > 0
        
        if existe:
            print("✅ Coluna 'item_bec' já existe")
        else:
            # Adicionar coluna
            db.session.execute(text(
                "ALTER TABLE itens_ordem_servico ADD COLUMN item_bec TEXT"
            ))
            db.session.commit()
            print("✅ Coluna 'item_bec' adicionada com sucesso!")
            
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {e}")
        db.session.rollback()
    
    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
