#!/usr/bin/env python3
"""
Script MASTER para executar todos os seeds na ordem correta
Popula o banco de dados com todas as categorias, itens e detentoras
"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def run_seed(seed_file):
    """Executa um arquivo de seed"""
    print("\n" + "=" * 80)
    print(f"🚀 Executando: {seed_file}")
    print("=" * 80)
    
    try:
        # Importar e executar o seed
        if seed_file == 'seed_coffee_fix.py':
            from seed_coffee_fix import recover_coffee
            recover_coffee()
        elif seed_file == 'seed_detentoras_coffee.py':
            from seed_detentoras_coffee import seed_detentoras_coffee
            seed_detentoras_coffee()
        elif seed_file == 'seed_hospedagem.py':
            from seed_hospedagem import seed_hospedagem
            seed_hospedagem()
        elif seed_file == 'seed_detentoras_hospedagem.py':
            from seed_detentoras_hospedagem import seed_detentoras_hospedagem
            seed_detentoras_hospedagem()
        elif seed_file == 'seed_organizacao.py':
            from seed_organizacao import seed_organizacao
            seed_organizacao()
        elif seed_file == 'seed_detentoras_organizacao.py':
            from seed_detentoras_organizacao import seed_detentoras_organizacao
            seed_detentoras_organizacao()
        elif seed_file == 'seed_transportes.py':
            from seed_transportes import seed_transportes
            seed_transportes()
        elif seed_file == 'seed_detentoras_transporte.py':
            from seed_detentoras_transporte import seed_detentoras
            seed_detentoras()
        
        print(f"✅ {seed_file} concluído com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao executar {seed_file}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def seed_all():
    """Executa todos os seeds na ordem correta"""
    print("=" * 80)
    print("🌱 INICIANDO SEED COMPLETO DO BANCO DE DADOS")
    print("=" * 80)
    print()
    print("Este script irá popular o banco com:")
    print("  • Coffee Break: 5 categorias, 17 itens, 4 detentoras")
    print("  • Hospedagem: 2 categorias, 6 itens, 2 detentoras")
    print("  • Organização: 4 categorias, 119 itens, 1 detentora")
    print("  • Transporte: 4 categorias, 6 itens, 2 detentoras")
    print()
    print("Total: 15 categorias, 148 itens, 9 detentoras, 531 estoques")
    print()
    
    input("Pressione ENTER para continuar ou Ctrl+C para cancelar...")
    
    # Lista de seeds na ordem de execução
    seeds = [
        # 1. Coffee Break
        'seed_coffee_fix.py',
        'seed_detentoras_coffee.py',
        
        # 2. Hospedagem
        'seed_hospedagem.py',
        'seed_detentoras_hospedagem.py',
        
        # 3. Organização
        'seed_organizacao.py',
        'seed_detentoras_organizacao.py',
        
        # 4. Transporte
        'seed_transportes.py',
        'seed_detentoras_transporte.py',
    ]
    
    resultados = []
    for seed in seeds:
        sucesso = run_seed(seed)
        resultados.append((seed, sucesso))
    
    # Resumo final
    print("\n" + "=" * 80)
    print("📊 RESUMO FINAL")
    print("=" * 80)
    
    sucessos = sum(1 for _, s in resultados if s)
    falhas = len(resultados) - sucessos
    
    for seed, sucesso in resultados:
        status = "✅" if sucesso else "❌"
        print(f"{status} {seed}")
    
    print()
    print(f"Total: {sucessos} sucesso(s), {falhas} falha(s)")
    
    if falhas == 0:
        print("\n🎉 SEED COMPLETO EXECUTADO COM SUCESSO!")
        print("O banco de dados está pronto para uso.")
    else:
        print("\n⚠️ Alguns seeds falharam. Verifique os erros acima.")

if __name__ == '__main__':
    # Mudar para o diretório dos seeds
    os.chdir(Path(__file__).parent)
    seed_all()
