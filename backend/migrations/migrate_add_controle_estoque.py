"""
Migração: Adicionar sistema de controle de estoque integrado com O.S.
- Adiciona tabela de movimentações de estoque
- Adiciona campos de rastreamento na OrdemServico
- Garante integridade dos dados de estoque
"""

import sys
import os

# Adicionar o diretório pai ao path para importar os modelos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db
from sqlalchemy import text

def executar_migracao():
    """Executa a migração para adicionar controle de estoque"""
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*60)
        print("🔄 MIGRAÇÃO: Sistema de Controle de Estoque")
        print("="*60)
        
        try:
            # 1. Criar tabela de movimentações de estoque
            print("\n📦 Criando tabela 'movimentacoes_estoque'...")
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    estoque_regional_id INTEGER NOT NULL,
                    quantidade REAL NOT NULL,
                    tipo VARCHAR(20) NOT NULL,
                    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                    observacao TEXT,
                    FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON DELETE CASCADE,
                    FOREIGN KEY (item_id) REFERENCES itens (id),
                    FOREIGN KEY (estoque_regional_id) REFERENCES estoque_regional (id)
                )
            """))
            print("   ✅ Tabela 'movimentacoes_estoque' criada com sucesso!")
            
            # 2. Adicionar campo regiao_estoque na OrdemServico
            print("\n📝 Adicionando campo 'regiao_estoque' na tabela 'ordens_servico'...")
            try:
                db.session.execute(text("""
                    ALTER TABLE ordens_servico 
                    ADD COLUMN regiao_estoque INTEGER
                """))
                print("   ✅ Campo 'regiao_estoque' adicionado!")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("   ⚠️  Campo 'regiao_estoque' já existe")
                else:
                    raise
            
            # 3. Adicionar índices para melhor performance
            print("\n🔍 Criando índices...")
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_movimentacoes_os 
                ON movimentacoes_estoque(ordem_servico_id)
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_movimentacoes_item 
                ON movimentacoes_estoque(item_id)
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_regional 
                ON movimentacoes_estoque(estoque_regional_id)
            """))
            print("   ✅ Índices criados com sucesso!")
            
            # 4. Atualizar campo regiao_estoque baseado no grupo existente
            print("\n🔄 Atualizando regiões das O.S. existentes baseado no grupo...")
            db.session.execute(text("""
                UPDATE ordens_servico 
                SET regiao_estoque = CAST(grupo AS INTEGER)
                WHERE grupo IS NOT NULL 
                AND grupo != ''
                AND CAST(grupo AS INTEGER) BETWEEN 1 AND 6
            """))
            print("   ✅ Regiões atualizadas!")
            
            db.session.commit()
            
            print("\n" + "="*60)
            print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("="*60)
            print("\n📋 Resumo das alterações:")
            print("   • Tabela 'movimentacoes_estoque' criada")
            print("   • Campo 'regiao_estoque' adicionado em 'ordens_servico'")
            print("   • Índices criados para melhor performance")
            print("   • Regiões existentes sincronizadas com grupos")
            print("\n" + "="*60 + "\n")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ ERRO na migração: {e}")
            raise

if __name__ == '__main__':
    executar_migracao()
