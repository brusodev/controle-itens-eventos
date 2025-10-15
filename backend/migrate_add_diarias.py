#!/usr/bin/env python3
"""Migração: Adicionar campo diarias em ItemOrdemServico"""

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar diarias em itens_ordem_servico")
    print("=" * 60)
    
    try:
        # Verificar se coluna já existe
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM pragma_table_info('itens_ordem_servico') WHERE name='diarias'"
        ))
        existe = result.scalar() > 0
        
        if existe:
            print("✅ Coluna 'diarias' já existe")
        else:
            # Adicionar coluna com valor padrão 1
            db.session.execute(text(
                "ALTER TABLE itens_ordem_servico ADD COLUMN diarias INTEGER DEFAULT 1"
            ))
            db.session.commit()
            print("✅ Coluna 'diarias' adicionada com sucesso!")
            print("   - Tipo: INTEGER")
            print("   - Valor padrão: 1")
            
            # Atualizar registros existentes que possam ter NULL
            db.session.execute(text(
                "UPDATE itens_ordem_servico SET diarias = 1 WHERE diarias IS NULL"
            ))
            db.session.commit()
            print("✅ Registros existentes atualizados com diarias = 1")
            
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {e}")
        db.session.rollback()
    
    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
