#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
MIGRAÇÃO: Adicionar Tabela de Auditoria
========================================

Este script é seguro para ambiente de PRODUÇÃO com dados existentes.

O QUE FAZ:
- ✅ Adiciona tabela 'auditoria' sem perder dados
- ✅ Validação antes de executar
- ✅ Backup automático do banco
- ✅ Opção de rollback

COMO USAR:
    python migrar_adicionar_auditoria.py          # Executar migração
    python migrar_adicionar_auditoria.py --check  # Apenas verificar
    python migrar_adicionar_auditoria.py --rollback  # Desfazer

ANTES DE EXECUTAR:
    1. Certifique que você tem backup
    2. Feche o servidor (importante!)
    3. Execute: python migrar_adicionar_auditoria.py --check
    4. Se OK, execute: python migrar_adicionar_auditoria.py

SEGURANÇA:
    - Cria backup automático
    - Valida estrutura do banco
    - Não modifica tabelas existentes
    - Transação atômica
"""

import os
import sys
import sqlite3
import shutil
from datetime import datetime
import json
from pathlib import Path

# Adiciona pasta pai ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

# Configuração
DB_INSTANCE = os.path.join(os.path.dirname(__file__), '../../instance')
DB_PATH = os.path.join(DB_INSTANCE, 'controle_itens.db')
BACKUP_DIR = os.path.join(DB_INSTANCE, 'backups')

# Cores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_step(step, text):
    print(f"{Colors.OKBLUE}[{step}]{Colors.ENDC} {text}")

def criar_backup():
    """Cria backup do banco de dados"""
    print_step(1, "Criando backup do banco de dados...")
    
    if not os.path.exists(DB_PATH):
        print_error(f"Banco não encontrado: {DB_PATH}")
        return False
    
    # Cria diretório de backups se não existir
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Nome do backup com timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"controle_itens_backup_{timestamp}.db")
    
    try:
        shutil.copy2(DB_PATH, backup_path)
        print_success(f"Backup criado: {backup_path}")
        return backup_path
    except Exception as e:
        print_error(f"Erro ao criar backup: {e}")
        return False

def verificar_banco():
    """Verifica integridade do banco"""
    print_step(2, "Verificando integridade do banco...")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verifica tabelas existentes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tabelas = cursor.fetchall()
        
        print(f"  Tabelas encontradas: {len(tabelas)}")
        for (nome,) in tabelas:
            print(f"    • {nome}")
        
        # Verifica se auditoria já existe
        if any(t[0] == 'auditoria' for t in tabelas):
            print_warning("Tabela 'auditoria' já existe!")
            conn.close()
            return False
        
        # Verifica se há dados
        for (nome,) in tabelas:
            cursor.execute(f"SELECT COUNT(*) FROM {nome}")
            count = cursor.fetchone()[0]
            if count > 0:
                print_info(f"  {nome}: {count} registros")
        
        conn.close()
        print_success("Banco OK, sem tabela de auditoria")
        return True
        
    except Exception as e:
        print_error(f"Erro ao verificar banco: {e}")
        return False

def executar_migracao():
    """Executa a migração"""
    print_step(3, "Executando migração...")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # SQL para criar tabela de auditoria
        sql_criar_auditoria = """
        CREATE TABLE IF NOT EXISTS auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            acao VARCHAR(50) NOT NULL,
            modulo VARCHAR(100),
            entidade_tipo VARCHAR(100) NOT NULL,
            entidade_id INTEGER NOT NULL,
            dados_antes TEXT,
            dados_depois TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuario(id),
            CHECK (acao IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'))
        );
        """
        
        # SQL para criar índices
        sql_indices = [
            "CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);",
            "CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade_tipo, entidade_id);",
            "CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria(data_hora);",
            "CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria(acao);",
        ]
        
        # Inicia transação
        cursor.execute("BEGIN TRANSACTION;")
        
        try:
            # Cria tabela
            cursor.execute(sql_criar_auditoria)
            print_success("Tabela 'auditoria' criada")
            
            # Cria índices
            for sql in sql_indices:
                cursor.execute(sql)
            print_success("Índices criados")
            
            # Commit da transação
            conn.commit()
            print_success("Migração concluída com sucesso!")
            
            conn.close()
            return True
            
        except Exception as e:
            cursor.execute("ROLLBACK;")
            print_error(f"Erro na transação: {e}")
            conn.close()
            return False
            
    except Exception as e:
        print_error(f"Erro ao conectar no banco: {e}")
        return False

def verificar_migracao():
    """Verifica se a migração foi bem-sucedida"""
    print_step(4, "Verificando resultado da migração...")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verifica se tabela existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='auditoria'
        """)
        
        if cursor.fetchone():
            # Verifica estrutura
            cursor.execute("PRAGMA table_info(auditoria);")
            colunas = cursor.fetchall()
            
            print_success("Tabela 'auditoria' criada com sucesso!")
            print(f"  Colunas: {len(colunas)}")
            for col in colunas:
                print(f"    • {col[1]} ({col[2]})")
            
            conn.close()
            return True
        else:
            print_error("Tabela 'auditoria' não foi criada")
            conn.close()
            return False
            
    except Exception as e:
        print_error(f"Erro ao verificar: {e}")
        return False

def fazer_rollback(backup_path):
    """Desfaz a migração restaurando backup"""
    print_step(1, "Iniciando rollback...")
    
    if not os.path.exists(backup_path):
        print_error(f"Backup não encontrado: {backup_path}")
        return False
    
    try:
        # Faz backup do banco atual (por segurança)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_falho = os.path.join(
            BACKUP_DIR, 
            f"controle_itens_backup_falho_{timestamp}.db"
        )
        shutil.copy2(DB_PATH, backup_falho)
        print_info(f"Banco com erro salvo em: {backup_falho}")
        
        # Restaura backup
        shutil.copy2(backup_path, DB_PATH)
        print_success("Banco restaurado do backup")
        
        # Verifica
        if verificar_banco():
            print_success("Rollback concluído com sucesso!")
            return True
        else:
            print_error("Banco após rollback está inconsistente")
            return False
            
    except Exception as e:
        print_error(f"Erro no rollback: {e}")
        return False

def salvar_log(resultado, backup_path):
    """Salva log da migração"""
    log_file = os.path.join(BACKUP_DIR, "migracao_log.json")
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "resultado": "sucesso" if resultado else "erro",
        "backup": backup_path,
        "banco": DB_PATH,
    }
    
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r') as f:
                logs = json.load(f)
        except:
            pass
    
    logs.append(log_entry)
    
    try:
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
        print_info(f"Log salvo em: {log_file}")
    except Exception as e:
        print_warning(f"Erro ao salvar log: {e}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Migração: Adicionar tabela de auditoria',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EXEMPLOS:
  python migrar_adicionar_auditoria.py          # Executar migração
  python migrar_adicionar_auditoria.py --check  # Apenas verificar
  python migrar_adicionar_auditoria.py --rollback /path/to/backup.db  # Desfazer
        """
    )
    
    parser.add_argument(
        '--check',
        action='store_true',
        help='Apenas verificar sem executar'
    )
    parser.add_argument(
        '--rollback',
        type=str,
        help='Caminho do backup para restaurar'
    )
    
    args = parser.parse_args()
    
    print_header("MIGRAÇÃO: ADICIONAR TABELA DE AUDITORIA")
    
    # Modo rollback
    if args.rollback:
        print_warning("MODO ROLLBACK - RESTAURANDO BACKUP")
        if fazer_rollback(args.rollback):
            print_success("Rollback concluído!")
            return 0
        else:
            print_error("Rollback falhou!")
            return 1
    
    # Verifica banco
    if not verificar_banco():
        print_error("Banco inválido ou já possui auditoria")
        return 1
    
    # Modo check
    if args.check:
        print_success("Verificação concluída. Banco está pronto para migração!")
        print("\nPróximo passo:")
        print("  python migrar_adicionar_auditoria.py")
        return 0
    
    # Cria backup
    backup_path = criar_backup()
    if not backup_path:
        return 1
    
    print_info(f"Se algo der errado, você pode restaurar com:")
    print_info(f"  python migrar_adicionar_auditoria.py --rollback {backup_path}")
    
    # Executa migração
    if not executar_migracao():
        print_error("Migração falhou!")
        print("\nTentando rollback automático...")
        if fazer_rollback(backup_path):
            print_success("Rollback automático concluído")
        return 1
    
    # Verifica resultado
    if not verificar_migracao():
        print_error("Verificação pós-migração falhou!")
        print("\nTentando rollback automático...")
        if fazer_rollback(backup_path):
            print_success("Rollback automático concluído")
        return 1
    
    # Salva log
    salvar_log(True, backup_path)
    
    print_header("✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"Banco: {DB_PATH}")
    print(f"Backup: {backup_path}")
    print(f"\nTabela de auditoria está pronta para uso!")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
