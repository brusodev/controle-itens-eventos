#!/usr/bin/env python3
"""Migração: Adicionar campos faltantes em OrdemServico"""

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar campos em ordens_servico")
    print("=" * 60)
    
    # Lista de colunas a adicionar
    colunas = [
        ("data_assinatura", "TEXT"),
        ("prazo_vigencia", "TEXT"),
        ("servico", "TEXT"),
        ("grupo", "TEXT"),
        ("horario", "TEXT"),
    ]
    
    for nome_coluna, tipo in colunas:
        try:
            # Verificar se coluna já existe
            result = db.session.execute(text(
                f"SELECT COUNT(*) as cnt FROM pragma_table_info('ordens_servico') WHERE name='{nome_coluna}'"
            ))
            existe = result.scalar() > 0
            
            if existe:
                print(f"✅ Coluna '{nome_coluna}' já existe")
            else:
                # Adicionar coluna
                db.session.execute(text(
                    f"ALTER TABLE ordens_servico ADD COLUMN {nome_coluna} {tipo}"
                ))
                db.session.commit()
                print(f"✅ Coluna '{nome_coluna}' adicionada com sucesso!")
                
        except Exception as e:
            print(f"❌ Erro ao adicionar coluna '{nome_coluna}': {e}")
            db.session.rollback()
    
    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
