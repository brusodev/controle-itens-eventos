#!/usr/bin/env python
"""
Script para inicializar o banco de dados
Deve ser executado apenas uma vez após a primeira instalação
"""
import sys
import os

# Adicionar o diretório ao path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from app import create_app
    
    # Criar app e inicializar banco
    app = create_app()
    
    print('\n✓ Banco de dados inicializado com sucesso!')
    print('✓ Tabelas criadas!')
    print('\nPróximos passos:')
    print('1. Execute: python criar_admin.py (para criar usuário admin)')
    print('2. Volte para pasta raiz e execute: .\\start.ps1')
    
except Exception as e:
    print(f'\n✗ Erro ao inicializar banco de dados:')
    print(f'  {str(e)}')
    sys.exit(1)
