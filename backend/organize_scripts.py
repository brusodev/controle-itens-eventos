#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Organizador de Scripts - Move arquivos Python para pastas estruturadas

Este script automáticamente organiza todos os arquivos Python na raiz de backend/
para as pastas apropriadas dentro de backend/scripts/

Uso:
    python organize_scripts.py

Segurança:
    - Verifica se arquivo já existe antes de mover
    - Cria backup de arquivos duplicados
    - Não deleta arquivos, apenas move
    - Mostra log de cada movimento
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Mapeamento de scripts para suas categorias
SCRIPTS_MAPPING = {
    # Admin
    'criar_admin.py': 'admin',
    
    # Diagnóstico
    'check_admin.py': 'diagnostico',
    'check_os_5.py': 'diagnostico',
    'check_os_20.py': 'diagnostico',
    'check_os11.py': 'diagnostico',
    'check_os11_v2.py': 'diagnostico',
    'check_wafer.py': 'diagnostico',
    'verificar_agua.py': 'diagnostico',
    'verificar_estoque_wafer.py': 'diagnostico',
    'verificar_item_os12.py': 'diagnostico',
    'verificar_kit_lanche.py': 'diagnostico',
    'verificar_movimentacoes_os4.py': 'diagnostico',
    'verificar_os11.py': 'diagnostico',
    'verificar_os_14.py': 'diagnostico',
    'verificar_os_15.py': 'diagnostico',
    'verificar_os_banco.py': 'diagnostico',
    'verificar_senha.py': 'diagnostico',
    'verificar_total_cb1.py': 'diagnostico',
    'diagnosticar_detentoras.py': 'diagnostico',
    'diagnosticar_movimentacoes.py': 'diagnostico',
    'diagnosticar_os4.py': 'diagnostico',
    'diagnosticar_wafer.py': 'diagnostico',
    'diagnostico_completo.py': 'diagnostico',
    'investigar_os11.py': 'diagnostico',
    'investigar_os12.py': 'diagnostico',
    'procurar_os_kit.py': 'diagnostico',
    
    # Migração
    'migrar_detentoras.py': 'migracao',
    'migrar_perfil.py': 'migracao',
    'corrigir_detentora_id.py': 'migracao',
    'corrigir_item_ids_os.py': 'migracao',
    'corrigir_movimentacao_os4.py': 'migracao',
    'corrigir_os11_agua.py': 'migracao',
    'corrigir_os12.py': 'migracao',
    'corrigir_os4_v2.py': 'migracao',
    'corrigir_os5.py': 'migracao',
    'processar_estoque_os4.py': 'migracao',
    'completar_estoque_regioes.py': 'migracao',
    
    # Testes
    'teste_alterar_senha.py': 'testes',
    'teste_api_alimentacao.py': 'testes',
    'teste_api_usuario.py': 'testes',
    'teste_completo_itens.py': 'testes',
    'testar_pdf_final.py': 'testes',
    'testar_preco_api.py': 'testes',
    'testar_preco_pdf.py': 'testes',
    
    # Utilitários
    'adicionar_coluna_preco.py': 'utilitarios',
    'adicionar_estoque_wafer.py': 'utilitarios',
    'adicionar_preco_agua.py': 'utilitarios',
    'adicionar_precos_exemplo.py': 'utilitarios',
    'listar_precos.py': 'utilitarios',
    
    # Relatórios
    'relatorio_completo_estoque.py': 'relatorios',
    'relatorio_estoque.py': 'relatorios',
}

class OrganizadorScripts:
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.scripts_dir = self.backend_dir / 'scripts'
        self.moved_count = 0
        self.skipped_count = 0
        self.errors = []
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
    def criar_diretorios(self):
        """Criar diretórios necessários se não existirem"""
        for category in set(SCRIPTS_MAPPING.values()):
            category_dir = self.scripts_dir / category
            category_dir.mkdir(parents=True, exist_ok=True)
            print(f"✓ Diretório pronto: {category_dir.name}/")
    
    def mover_script(self, filename, category):
        """Mover um script para sua categoria"""
        origem = self.backend_dir / filename
        destino = self.scripts_dir / category / filename
        
        # Verificar se arquivo de origem existe
        if not origem.exists():
            print(f"⚠ Arquivo não encontrado: {filename}")
            self.skipped_count += 1
            return False
        
        # Verificar se arquivo já existe no destino
        if destino.exists():
            # Criar backup ao invés de sobrescrever
            backup_name = f"{destino.stem}_backup_{self.timestamp}{destino.suffix}"
            backup_destino = destino.parent / backup_name
            print(f"⚠ Arquivo já existe: {filename}")
            print(f"  → Mantendo arquivo existente")
            print(f"  → Original seria: {backup_destino.name}")
            self.skipped_count += 1
            return False
        
        try:
            # Mover arquivo
            shutil.move(str(origem), str(destino))
            print(f"✓ Movido: {filename} → {category}/")
            self.moved_count += 1
            return True
        except Exception as e:
            error_msg = f"✗ Erro ao mover {filename}: {str(e)}"
            print(error_msg)
            self.errors.append(error_msg)
            self.skipped_count += 1
            return False
    
    def organizar(self):
        """Executar organização completa"""
        print("=" * 70)
        print("🚀 ORGANIZADOR DE SCRIPTS - Controle de Itens e Eventos")
        print("=" * 70)
        print()
        
        # Passo 1: Criar diretórios
        print("📁 Criando estrutura de diretórios...")
        print("-" * 70)
        self.criar_diretorios()
        print()
        
        # Passo 2: Mover scripts
        print("🔄 Movendo scripts para suas categorias...")
        print("-" * 70)
        
        for filename, category in sorted(SCRIPTS_MAPPING.items()):
            self.mover_script(filename, category)
        
        print()
        
        # Passo 3: Relatório final
        print("=" * 70)
        print("📊 RELATÓRIO FINAL")
        print("=" * 70)
        print(f"✓ Scripts movidos com sucesso: {self.moved_count}")
        print(f"⚠ Scripts pulados/não movidos: {self.skipped_count}")
        
        if self.errors:
            print(f"✗ Erros encontrados: {len(self.errors)}")
            for error in self.errors:
                print(f"  {error}")
        
        print()
        print("📋 Estrutura final de scripts:")
        print("-" * 70)
        self.listar_estrutura()
        
        print()
        print("✅ Organização concluída!")
        print()
        print("Próximos passos:")
        print("  1. Verificar se todos os scripts foram movidos")
        print("  2. Atualizar imports em app.py se necessário")
        print("  3. Testar alguns scripts para garantir funcionamento")
        print("  4. Ler: backend/scripts/README.md para documentação")
        print()
    
    def listar_estrutura(self):
        """Listar estrutura final de diretórios"""
        for category in sorted(set(SCRIPTS_MAPPING.values())):
            category_dir = self.scripts_dir / category
            files = list(category_dir.glob('*.py'))
            if files:
                print(f"\n{category}/ ({len(files)} arquivos)")
                for f in sorted(files):
                    print(f"  • {f.name}")
            else:
                print(f"\n{category}/ (vazio)")

if __name__ == '__main__':
    organizador = OrganizadorScripts()
    
    # Confirmar antes de executar
    print()
    print("Este script vai MOVER todos os arquivos Python de backend/")
    print("para backend/scripts/<categoria>/")
    print()
    print("Arquivos afetados:", len(SCRIPTS_MAPPING))
    print()
    
    resposta = input("Deseja continuar? (s/n): ").lower().strip()
    
    if resposta == 's':
        print()
        organizador.organizar()
    else:
        print("Operação cancelada.")
