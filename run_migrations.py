#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para executar todas as migrations
Execute: python run_migrations.py
"""
import os
import sys
import subprocess
from pathlib import Path

# Cores para terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_info(msg):
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def log_error(msg):
    print(f"{Colors.RED}✗{Colors.END} {msg}")

def log_warn(msg):
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

def log_title(msg):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{msg}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def run_migrations():
    """Executa todas as migrations em ordem"""
    
    log_title("🚀 EXECUTANDO MIGRATIONS")
    
    # Diretório de migrations
    migrations_dir = Path(__file__).parent / 'backend' / 'migrations'
    
    if not migrations_dir.exists():
        log_error(f"Diretório de migrations não encontrado: {migrations_dir}")
        return False
    
    # Lista de migrations em ordem
    migrations = [
        # "migrate_data.py", # Removido para evitar drop_all() acidental
        "migrate_add_observacoes.py",
        "migrate_add_responsavel.py",
        "migrate_add_campos_os.py",
        "migrate_add_fiscal_tipo.py",
        "migrate_add_controle_estoque.py",
        "migrate_add_diarias.py",
        "migrate_add_qtd_solicitada.py",
        "migrate_add_item_bec.py",
        "migrate_categorias.py",
        "migrate_add_modulo.py",  # Suporte a módulos (Coffee/Transporte)
    ]
    
    print(f"📋 Migrations encontradas: {len(migrations)}\n")
    
    sucesso = 0
    erro = 0
    
    # Mudar para diretório backend
    os.chdir(str(migrations_dir.parent))
    
    # Adicionar o diretório backend ao PYTHONPATH para que os scripts encontrem o app
    env = os.environ.copy()
    env["PYTHONPATH"] = str(migrations_dir.parent) + os.pathsep + env.get("PYTHONPATH", "")
    
    for migration in migrations:
        migration_path = migrations_dir / migration
        
        if not migration_path.exists():
            log_warn(f"{migration} não encontrado")
            continue
        
        print(f"Executando: {migration}...", end=" ")
        
        try:
            result = subprocess.run(
                [sys.executable, str(migration_path)],
                capture_output=True,
                text=True,
                timeout=30,
                env=env
            )
            
            if result.returncode == 0:
                log_info("OK")
                sucesso += 1
            else:
                log_error("FALHA")
                print(f"  Erro: {result.stderr}")
                erro += 1
        except subprocess.TimeoutExpired:
            log_error("TIMEOUT")
            erro += 1
        except Exception as e:
            log_error(f"ERRO: {str(e)}")
            erro += 1
    
    # Resumo
    log_title("📊 RESUMO DAS MIGRATIONS")
    print(f"✓ Sucesso: {sucesso}")
    print(f"✗ Erro: {erro}")
    print(f"⏭️  Total: {sucesso + erro}\n")
    
    if erro == 0:
        log_info("Todas as migrations executadas com sucesso!")
        return True
    else:
        log_warn(f"{erro} migration(s) com problemas. Verifique os logs acima.")
        return False

if __name__ == '__main__':
    try:
        sucesso = run_migrations()
        sys.exit(0 if sucesso else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠ Operação cancelada pelo usuário{Colors.END}")
        sys.exit(1)
    except Exception as e:
        log_error(f"Erro fatal: {str(e)}")
        sys.exit(1)
