#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
PREPARAR DEPLOYMENT
===================

Este script prepara o projeto para envio ao servidor.

O QUE FAZ:
  1. Valida se tudo está pronto
  2. Cria arquivo ZIP com atualizações
  3. Gera lista de mudanças
  4. Cria instruções de instalação

COMO USAR:
  python prepare_deployment.py

RESULTADO:
  └─ deployment_package_20251107_143022.zip
     ├── README.txt (instruções)
     ├── CHANGES.txt (lista de mudanças)
     └── arquivos/ (código novo/atualizado)
"""

import os
import sys
import json
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

# Configuração
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), '../..')
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
DOCS_DIR = os.path.join(PROJECT_ROOT, 'docs')
DEPLOY_DIR = os.path.join(PROJECT_ROOT, 'deployment_packages')

# Cores
class Colors:
    OKGREEN = '\033[92m'
    FAIL = '\033[91m'
    OKCYAN = '\033[96m'
    WARNING = '\033[93m'
    ENDC = '\033[0m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠ {msg}{Colors.ENDC}")

def validar_projeto():
    """Valida se projeto está pronto"""
    print("\n[1/4] Validando projeto...")
    
    arquivos_obrigatorios = [
        'backend/app.py',
        'backend/models.py',
        'backend/routes/auditoria_routes.py',
        'backend/utils/auditoria.py',
        'backend/templates/auditoria.html',
        'backend/scripts/migracao/migrar_adicionar_auditoria.py',
        'docs/AUDITORIA.md',
        'docs/API.md',
        'docs/DATABASE.md',
        'docs/DEPLOYMENT.md',
    ]
    
    faltam = []
    for arquivo in arquivos_obrigatorios:
        caminho = os.path.join(PROJECT_ROOT, arquivo)
        if not os.path.exists(caminho):
            faltam.append(arquivo)
    
    if faltam:
        print_error(f"Arquivos faltando:")
        for f in faltam:
            print(f"  ✗ {f}")
        return False
    
    print_success("Todos os arquivos necessários encontrados")
    return True

def listar_mudancas():
    """Lista os arquivos que serão enviados"""
    print("\n[2/4] Listando mudanças...")
    
    arquivos = {
        "Código Python": [
            "backend/app.py",
            "backend/models.py",
            "backend/init_db.py",
            "backend/routes/auditoria_routes.py",
            "backend/utils/auditoria.py",
            "backend/scripts/migracao/migrar_adicionar_auditoria.py",
        ],
        "Templates HTML": [
            "backend/templates/auditoria.html",
        ],
        "CSS": [
            "backend/static/css/auditoria.css",
        ],
        "Documentação": [
            "docs/AUDITORIA.md",
            "docs/API.md",
            "docs/DATABASE.md",
            "docs/DEPLOYMENT.md",
            "docs/SETUP.md",
            "README.md",
            "INDICE_DOCUMENTACAO.md",
        ],
        "Scripts": [
            "backend/scripts/README.md",
        ]
    }
    
    total = 0
    for categoria, arquivos_cat in arquivos.items():
        print(f"\n  {categoria}:")
        for arquivo in arquivos_cat:
            caminho_completo = os.path.join(PROJECT_ROOT, arquivo)
            if os.path.exists(caminho_completo):
                tamanho = os.path.getsize(caminho_completo)
                if tamanho < 1024:
                    tamanho_str = f"{tamanho}B"
                elif tamanho < 1024*1024:
                    tamanho_str = f"{tamanho/1024:.1f}KB"
                else:
                    tamanho_str = f"{tamanho/(1024*1024):.1f}MB"
                print(f"    ✓ {arquivo:<45} ({tamanho_str})")
                total += 1
            else:
                print(f"    ✗ {arquivo}")
    
    print_success(f"Total: {total} arquivos")
    return arquivos

def criar_pacote_deployment(arquivos):
    """Cria arquivo ZIP com todos os arquivos"""
    print("\n[3/4] Criando pacote de deployment...")
    
    # Cria diretório de deployment se não existir
    os.makedirs(DEPLOY_DIR, exist_ok=True)
    
    # Nome do arquivo ZIP
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_nome = f"deployment_package_{timestamp}.zip"
    zip_caminho = os.path.join(DEPLOY_DIR, zip_nome)
    
    try:
        with zipfile.ZipFile(zip_caminho, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Adiciona instruções
            instrucoes = f"""
================================================================================
DEPLOYMENT PACKAGE - Controle de Itens e Eventos
================================================================================

Data: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
Versão: 2.0.0 (Com Sistema de Auditoria)

================================================================================
ANTES DE INSTALAR
================================================================================

IMPORTANTE: Leia o arquivo DEPLOYMENT.md completamente antes de iniciar!

Locais de arquivo importante:
  - Instruções: ../docs/DEPLOYMENT.md
  - Mudanças: Ver CHANGES.txt neste arquivo

Pré-requisitos:
  ✓ Acesso SSH ao servidor
  ✓ Banco de dados existente
  ✓ Python 3.8+ no servidor
  ✓ Backup do banco pronto
  ✓ Servidor pode ficar indisponível por 3-5 minutos

================================================================================
PASSOS RÁPIDOS
================================================================================

1. PREPARAÇÃO LOCAL
   git add .
   git commit -m "feat: add audit system"
   git push origin main

2. NO SERVIDOR - ATUALIZAR CÓDIGO
   cd /caminho/para/projeto
   git pull origin main

3. NO SERVIDOR - PARAR SERVIDOR
   sudo systemctl stop controle-itens
   # ou: Ctrl+C no terminal

4. NO SERVIDOR - CRIAR BACKUP
   cd backend
   cp instance/controle_itens.db instance/controle_itens_$(date +%Y%m%d).db

5. NO SERVIDOR - TESTAR MIGRAÇÃO
   python scripts/migracao/migrar_adicionar_auditoria.py --check

6. NO SERVIDOR - EXECUTAR MIGRAÇÃO
   python scripts/migracao/migrar_adicionar_auditoria.py

7. NO SERVIDOR - REINICIAR SERVIDOR
   sudo systemctl start controle-itens
   # ou: python app.py

================================================================================
ARQUIVO COM MUDANÇAS: CHANGES.txt
================================================================================

Leia o arquivo CHANGES.txt para ver lista completa de mudanças.

================================================================================
SUPORTE
================================================================================

Se algo der errado, faça rollback:
  python scripts/migracao/migrar_adicionar_auditoria.py --rollback BACKUP.db

Para dúvidas, consulte:
  - docs/DEPLOYMENT.md (instruções completas)
  - docs/AUDITORIA.md (como usar auditoria)
  - docs/DATABASE.md (schema do banco)

================================================================================
BOA SORTE!
================================================================================
"""
            zipf.writestr("README.txt", instrucoes)
            
            # Adiciona lista de mudanças
            mudancas = f"""
LISTA DE MUDANÇAS - {timestamp}
================================================================================

1. CÓDIGO PYTHON NOVO
{self._gerar_lista_mudancas("Código Python", arquivos)}

2. CÓDIGO PYTHON MODIFICADO
   - backend/app.py (registra blueprint auditoria_routes)
   - backend/models.py (adiciona Auditoria model)
   - backend/routes/itens_routes.py (audit logging)
   - backend/routes/os_routes.py (audit logging)
   - backend/routes/detentoras_routes.py (audit logging)
   - backend/routes/alimentacao_routes.py (audit logging)

3. TEMPLATES HTML NOVO
{self._gerar_lista_mudancas("Templates HTML", arquivos)}

4. CSS NOVO
{self._gerar_lista_mudancas("CSS", arquivos)}

5. DOCUMENTAÇÃO
{self._gerar_lista_mudancas("Documentação", arquivos)}

6. SCRIPTS DE UTILIDADE
{self._gerar_lista_mudancas("Scripts", arquivos)}

================================================================================
RESUMO DE MUDANÇAS
================================================================================

✨ NOVO: Sistema de Auditoria Completo
  - Tabela de auditoria no banco
  - 4 novos endpoints API
  - Interface web de auditoria
  - Rastreamento de todas as ações
  - Admin-only access
  - Filtros e estatísticas

📚 NOVO: Documentação Completa
  - 7 documentos de referência
  - 50+ endpoints documentados
  - Guias de instalação
  - Troubleshooting

🛠️ NOVO: Scripts de Migração
  - migrar_adicionar_auditoria.py (seguro com rollback)
  - Backup automático
  - Transações ACID

📁 REORGANIZADO: 51 Scripts
  - Antes: espalhados na raiz
  - Depois: 6 categorias lógicas

================================================================================
REMOÇÕES
================================================================================

Nenhum arquivo foi removido. Todos os dados e código legado mantêm-se intactos.

================================================================================
UPGRADE COMPATÍVEL
================================================================================

✓ Totalmente compatível com banco existente
✓ Não modifica tabelas existentes
✓ Não deleta dados
✓ Fácil rollback se necessário
✓ Sem downtime longo (3-5 minutos)

================================================================================
"""
            zipf.writestr("CHANGES.txt", mudancas)
            
            # Adiciona arquivos
            print("\n  Adicionando arquivos ao ZIP:")
            for categoria, arquivos_cat in arquivos.items():
                for arquivo in arquivos_cat:
                    caminho_completo = os.path.join(PROJECT_ROOT, arquivo)
                    if os.path.exists(caminho_completo):
                        # Mantém estrutura de pastas
                        arcname = f"files/{arquivo}"
                        zipf.write(caminho_completo, arcname)
                        print(f"    ✓ {arquivo}")
        
        tamanho_zip = os.path.getsize(zip_caminho)
        if tamanho_zip < 1024:
            tamanho_str = f"{tamanho_zip}B"
        elif tamanho_zip < 1024*1024:
            tamanho_str = f"{tamanho_zip/1024:.1f}KB"
        else:
            tamanho_str = f"{tamanho_zip/(1024*1024):.1f}MB"
        
        print_success(f"Pacote criado: {zip_nome} ({tamanho_str})")
        return zip_caminho
        
    except Exception as e:
        print_error(f"Erro ao criar ZIP: {e}")
        return None

    def _gerar_lista_mudancas(self, categoria, arquivos):
        """Helper para gerar lista formatada"""
        if categoria not in arquivos:
            return "   (nenhum)"
        
        linhas = []
        for arquivo in arquivos[categoria]:
            linhas.append(f"   ✓ {arquivo}")
        return "\n".join(linhas)

def criar_resumo_deployment(zip_caminho):
    """Cria resumo visual do deployment"""
    print("\n[4/4] Criando resumo...")
    
    resumo = f"""
================================================================================
RESUMO DO DEPLOYMENT PACKAGE
================================================================================

📦 PACOTE CRIADO COM SUCESSO!

Arquivo: {os.path.basename(zip_caminho)}
Tamanho: {os.path.getsize(zip_caminho) / 1024:.1f} KB
Data: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}

Localização: {zip_caminho}

================================================================================
PRÓXIMOS PASSOS
================================================================================

1. FAZER GIT COMMIT (Seu PC)
   
   cd c:\\Users\\bruno.vargas\\Desktop\\PROJETOS\\controle-itens-eventos
   git add .
   git commit -m "feat: add complete audit system

   - Add Auditoria model with complete tracking
   - Add auditoria REST API with filtering
   - Add web interface for audit viewing
   - Add migration script with rollback
   - Reorganize 51 scripts into categories
   - Add comprehensive documentation"
   git push origin main

2. ENVIAR CÓDIGO PARA SERVIDOR (SSH/GIT)
   
   No servidor:
   cd /caminho/do/projeto
   git pull origin main

3. EXECUTAR MIGRAÇÃO (Servidor)
   
   cd backend
   python scripts/migracao/migrar_adicionar_auditoria.py --check
   python scripts/migracao/migrar_adicionar_auditoria.py

4. REINICIAR SERVIDOR
   
   sudo systemctl restart controle-itens

================================================================================
DOCUMENTAÇÃO
================================================================================

Leia estes arquivos ANTES de fazer deployment:

  1. docs/DEPLOYMENT.md - Instruções passo a passo
  2. docs/AUDITORIA.md - Como usar sistema de auditoria
  3. docs/DATABASE.md - Schema do banco de dados

================================================================================
SEGURANÇA
================================================================================

✓ Backup automático criado pela migração
✓ Transações ACID protegem integridade
✓ Rollback automático em caso de erro
✓ Você pode desfazer com --rollback
✓ Admin-only access para auditoria

================================================================================
SUPORTE
================================================================================

Se tiver dúvidas:

P: Quanto tempo leva?
R: 30 segundos a 2 minutos

P: Os dados serão perdidos?
R: NÃO! Todos os dados permanecem intactos

P: Posso fazer durante o dia?
R: NÃO recomendado. Faça em horário de baixo uso

P: E se der erro?
R: Rollback automático restaura tudo

P: Quem pode ver auditoria?
R: Apenas admins

================================================================================
CHECKLIST FINAL
================================================================================

Antes de fazer deployment:

  ☐ Leu docs/DEPLOYMENT.md completamente
  ☐ Fez backup local
  ☐ Tem acesso SSH ao servidor
  ☐ Servidor pode ficar indisponível por 3-5 min
  ☐ Testou em staging primeiro (recomendado)

No servidor:

  ☐ Parou o servidor
  ☐ Criou backup do banco
  ☐ Testou migração com --check
  ☐ Executou migração
  ☐ Reiniciou servidor
  ☐ Testou criando novo item
  ☐ Testou visualizar auditoria

================================================================================
BOA SORTE COM O DEPLOYMENT!
================================================================================

Para mais informações, consulte a documentação completa em docs/

"""
    
    print(resumo)
    print_success("Resumo criado!")

def main():
    print("\n" + "="*80)
    print("  PREPARAR DEPLOYMENT - Controle de Itens e Eventos")
    print("="*80)
    
    # Valida projeto
    if not validar_projeto():
        print_error("Projeto não está pronto para deployment")
        return 1
    
    # Lista mudanças
    arquivos = listar_mudancas()
    
    # Cria pacote
    zip_caminho = self.criar_pacote_deployment(self, arquivos)
    if not zip_caminho:
        print_error("Erro ao criar pacote")
        return 1
    
    # Cria resumo
    self.criar_resumo_deployment(self, zip_caminho)
    
    print("\n" + "="*80)
    print_success("Deployment package pronto!")
    print("="*80 + "\n")
    
    print("Próximo passo:")
    print("  1. Leia docs/DEPLOYMENT.md")
    print("  2. Execute: git push origin main")
    print("  3. No servidor: git pull origin main")
    print("  4. No servidor: python scripts/migracao/migrar_adicionar_auditoria.py")
    
    return 0

if __name__ == '__main__':
    # Workaround para usar self sem classe
    class PrepareDeployment:
        def criar_pacote_deployment(self, arquivos):
            # Cria diretório de deployment se não existir
            os.makedirs(DEPLOY_DIR, exist_ok=True)
            
            # Nome do arquivo ZIP
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_nome = f"deployment_package_{timestamp}.zip"
            zip_caminho = os.path.join(DEPLOY_DIR, zip_nome)
            
            try:
                with zipfile.ZipFile(zip_caminho, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    # Adiciona instruções
                    instrucoes = f"""
================================================================================
DEPLOYMENT PACKAGE - Controle de Itens e Eventos
================================================================================

Data: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
Versão: 2.0.0 (Com Sistema de Auditoria)

================================================================================
ANTES DE INSTALAR
================================================================================

IMPORTANTE: Leia o arquivo DEPLOYMENT.md completamente antes de iniciar!

Leia: ../docs/DEPLOYMENT.md

Pré-requisitos:
  ✓ Acesso SSH ao servidor
  ✓ Banco de dados existente
  ✓ Python 3.8+ no servidor
  ✓ Backup do banco pronto
  ✓ Servidor pode ficar indisponível

================================================================================
PASSOS RÁPIDOS
================================================================================

1. git add . && git commit -m "feat: add audit" && git push
2. No servidor: git pull origin main
3. Parar servidor: sudo systemctl stop controle-itens
4. Criar backup: cp instance/controle_itens.db backup_$(date +%s).db
5. Testar: python scripts/migracao/migrar_adicionar_auditoria.py --check
6. Migrar: python scripts/migracao/migrar_adicionar_auditoria.py
7. Iniciar: sudo systemctl start controle-itens

================================================================================
"""
                    zipf.writestr("README.txt", instrucoes)
                    
                    # Adiciona arquivos
                    print("\n  Adicionando arquivos ao ZIP:")
                    for categoria, arquivos_cat in arquivos.items():
                        for arquivo in arquivos_cat:
                            caminho_completo = os.path.join(PROJECT_ROOT, arquivo)
                            if os.path.exists(caminho_completo):
                                arcname = f"files/{arquivo}"
                                zipf.write(caminho_completo, arcname)
                                print(f"    ✓ {arquivo}")
                
                tamanho_zip = os.path.getsize(zip_caminho)
                if tamanho_zip < 1024:
                    tamanho_str = f"{tamanho_zip}B"
                elif tamanho_zip < 1024*1024:
                    tamanho_str = f"{tamanho_zip/1024:.1f}KB"
                else:
                    tamanho_str = f"{tamanho_zip/(1024*1024):.1f}MB"
                
                print_success(f"Pacote criado: {zip_nome} ({tamanho_str})")
                return zip_caminho
                
            except Exception as e:
                print_error(f"Erro ao criar ZIP: {e}")
                return None
        
        def criar_resumo_deployment(self, zip_caminho):
            """Cria resumo visual do deployment"""
            print("\n[4/4] Criando resumo...")
            
            resumo = f"""
================================================================================
RESUMO DO DEPLOYMENT PACKAGE
================================================================================

📦 PACOTE CRIADO COM SUCESSO!

Arquivo: {os.path.basename(zip_caminho)}
Tamanho: {os.path.getsize(zip_caminho) / 1024:.1f} KB
Data: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}

Localização: {zip_caminho}

================================================================================
PRÓXIMOS PASSOS
================================================================================

1. GIT COMMIT (Seu PC)
   git add .
   git commit -m "feat: add audit system"
   git push origin main

2. ATUALIZAR NO SERVIDOR
   git pull origin main

3. EXECUTAR MIGRAÇÃO
   python scripts/migracao/migrar_adicionar_auditoria.py --check
   python scripts/migracao/migrar_adicionar_auditoria.py

4. REINICIAR
   sudo systemctl restart controle-itens

================================================================================
"""
            
            print(resumo)
            print_success("Resumo criado!")
    
    pd = PrepareDeployment()
    
    print("\n" + "="*80)
    print("  PREPARAR DEPLOYMENT - Controle de Itens e Eventos")
    print("="*80)
    
    # Valida projeto
    if not validar_projeto():
        print_error("Projeto não está pronto para deployment")
        sys.exit(1)
    
    # Lista mudanças
    arquivos = listar_mudancas()
    
    # Cria pacote
    zip_caminho = pd.criar_pacote_deployment(arquivos)
    if not zip_caminho:
        print_error("Erro ao criar pacote")
        sys.exit(1)
    
    # Cria resumo
    pd.criar_resumo_deployment(zip_caminho)
    
    print("\n" + "="*80)
    print_success("Deployment package pronto!")
    print("="*80 + "\n")
    
    sys.exit(0)
