#!/usr/bin/env python3
"""Migração: Adicionar campo quantidade_solicitada em ItemOrdemServico"""

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar quantidade_solicitada em itens_ordem_servico")
    print("=" * 60)
    
    try:
        # Verificar se coluna já existe
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM pragma_table_info('itens_ordem_servico') WHERE name='quantidade_solicitada'"
        ))
        existe = result.scalar() > 0
        
        if existe:
            print("✅ Coluna 'quantidade_solicitada' já existe")
        else:
            # Adicionar coluna
            db.session.execute(text(
                "ALTER TABLE itens_ordem_servico ADD COLUMN quantidade_solicitada REAL"
            ))
            db.session.commit()
            print("✅ Coluna 'quantidade_solicitada' adicionada com sucesso!")
            print("   - Tipo: REAL (float)")
            
            # Atualizar registros existentes: qtd_solicitada = qtd_total / diarias
            db.session.execute(text(
                """UPDATE itens_ordem_servico 
                   SET quantidade_solicitada = quantidade_total / COALESCE(diarias, 1)
                   WHERE quantidade_solicitada IS NULL"""
            ))
            db.session.commit()
            print("✅ Registros existentes atualizados (qtd_solicitada = qtd_total / diarias)")
            
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {e}")
        db.session.rollback()
    
    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
