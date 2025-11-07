#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Backup Automático do Banco de Dados
====================================

Cria backup diário do banco de dados com rotação de 30 dias.

USO:
    python backup_automatico.py
    
CRON (diário às 2h da manhã):
    0 2 * * * cd /seu/projeto/backend && /seu/projeto/venv/bin/python scripts/utilitarios/backup_automatico.py >> /var/log/backup_db.log 2>&1

WINDOWS TASK SCHEDULER (diário às 2h):
    Ação: python
    Argumentos: backend\scripts\utilitarios\backup_automatico.py
    Iniciar em: c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos
"""

import os
import sys
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# Configuração
BACKEND_DIR = Path(__file__).parent.parent.parent
DB_PATH = BACKEND_DIR / 'instance' / 'controle_itens.db'
BACKUP_DIR = BACKEND_DIR / 'instance' / 'backups'
RETENTION_DAYS = 30  # Manter últimos 30 dias

# Cores para terminal
class Colors:
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    OKCYAN = '\033[96m'
    ENDC = '\033[0m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ️  {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠️  {msg}{Colors.ENDC}")

def criar_backup():
    """Cria backup do banco"""
    if not DB_PATH.exists():
        print_error(f"Banco não encontrado: {DB_PATH}")
        return False
    
    # Criar diretório de backups
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Nome do backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"controle_itens_{timestamp}.db"
    
    try:
        # Copiar banco
        shutil.copy2(DB_PATH, backup_file)
        
        # Tamanho
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        
        print_success(f"Backup criado: {backup_file.name}")
        print_info(f"Tamanho: {size_mb:.2f} MB")
        print_info(f"Local: {backup_file}")
        
        return True
        
    except Exception as e:
        print_error(f"Erro ao criar backup: {e}")
        return False

def limpar_backups_antigos():
    """Remove backups mais antigos que RETENTION_DAYS"""
    if not BACKUP_DIR.exists():
        return
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    removidos = 0
    
    for backup_file in BACKUP_DIR.glob("controle_itens_*.db"):
        # Extrair data do nome do arquivo
        try:
            # Nome: controle_itens_YYYYMMDD_HHMMSS.db
            parts = backup_file.stem.split('_')
            if len(parts) >= 3:
                date_str = parts[2]  # YYYYMMDD
                file_date = datetime.strptime(date_str, "%Y%m%d")
                
                if file_date < cutoff_date:
                    size_mb = backup_file.stat().st_size / (1024 * 1024)
                    backup_file.unlink()
                    removidos += 1
                    print_warning(f"Removido backup antigo: {backup_file.name} ({size_mb:.2f} MB)")
                
        except (ValueError, IndexError):
            # Nome de arquivo não segue padrão, ignorar
            pass
    
    if removidos > 0:
        print_success(f"{removidos} backup(s) antigo(s) removido(s)")
    else:
        print_info("Nenhum backup antigo para remover")

def listar_backups():
    """Lista backups disponíveis"""
    if not BACKUP_DIR.exists():
        print_info("Nenhum backup encontrado")
        return
    
    backups = sorted(BACKUP_DIR.glob("controle_itens_*.db"), reverse=True)
    
    if not backups:
        print_info("Nenhum backup encontrado")
        return
    
    print(f"\n📊 Backups Disponíveis ({len(backups)}):")
    print("-" * 70)
    
    total_size = 0
    for i, backup_file in enumerate(backups[:10], 1):  # Mostrar últimos 10
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        total_size += size_mb
        
        # Extrair data/hora do nome
        try:
            parts = backup_file.stem.split('_')
            if len(parts) >= 4:
                date_str = parts[2]  # YYYYMMDD
                time_str = parts[3]  # HHMMSS
                
                date_obj = datetime.strptime(f"{date_str}_{time_str}", "%Y%m%d_%H%M%S")
                date_formatted = date_obj.strftime("%d/%m/%Y %H:%M:%S")
                
                # Tempo relativo
                delta = datetime.now() - date_obj
                if delta.days == 0:
                    relative = "hoje"
                elif delta.days == 1:
                    relative = "ontem"
                else:
                    relative = f"{delta.days} dias atrás"
                
                print(f"{i:2d}. {date_formatted} ({relative:15s}) - {size_mb:6.2f} MB")
            else:
                print(f"{i:2d}. {backup_file.name} - {size_mb:6.2f} MB")
        except (ValueError, IndexError):
            print(f"{i:2d}. {backup_file.name} - {size_mb:6.2f} MB")
    
    if len(backups) > 10:
        print(f"    ... e mais {len(backups) - 10} backup(s)")
    
    print("-" * 70)
    print(f"Total: {len(backups)} backups, {total_size:.2f} MB")

def main():
    print("=" * 70)
    print("BACKUP AUTOMÁTICO DO BANCO DE DADOS")
    print("=" * 70)
    print()
    
    # Informações
    print_info(f"Banco: {DB_PATH}")
    print_info(f"Backups: {BACKUP_DIR}")
    print_info(f"Retenção: {RETENTION_DAYS} dias")
    print()
    
    # Criar backup
    if criar_backup():
        print()
        
        # Limpar backups antigos
        limpar_backups_antigos()
        print()
        
        # Listar backups
        listar_backups()
        print()
        
        print_success("Backup concluído com sucesso!")
        return 0
    else:
        print()
        print_error("Falha no backup!")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n")
        print_warning("Backup interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print("\n")
        print_error(f"Erro inesperado: {e}")
        sys.exit(1)
