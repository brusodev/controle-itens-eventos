#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para criar usuário admin
Execute no terminal do backend: python criar_usuario.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db, Usuario

def criar_usuario_admin():
    """Cria um usuário admin interativamente"""
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*60)
        print("  🔐 CRIAR NOVO USUÁRIO PARA LOGIN")
        print("="*60 + "\n")
        
        # Verificar se já existe usuário
        usuarios_existentes = Usuario.query.count()
        if usuarios_existentes > 0:
            print(f"ℹ️  Já existem {usuarios_existentes} usuário(s) no sistema\n")
        
        # Coletar dados
        nome = input("👤 Nome completo: ").strip()
        if not nome:
            print("❌ Nome é obrigatório!")
            return
        
        email = input("📧 Email (ex: admin@example.com): ").strip().lower()
        if not email or '@' not in email:
            print("❌ Email inválido!")
            return
        
        # Verificar se email já existe
        if Usuario.query.filter_by(email=email).first():
            print("❌ Este email já está cadastrado!")
            return
        
        # Coletar senha
        print("\n🔑 Defina uma senha (mínimo 6 caracteres)")
        while True:
            senha = input("   Senha: ").strip()
            if len(senha) < 6:
                print("   ❌ Senha muito curta! Use no mínimo 6 caracteres.")
                continue
            
            confirmacao = input("   Confirme a senha: ").strip()
            if senha != confirmacao:
                print("   ❌ Senhas não conferem!")
                continue
            
            break
        
        cargo = input("\n💼 Cargo (ou deixe em branco): ").strip() or "Administrador"
        
        # Criar usuário
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            cargo=cargo,
            perfil='admin',  # Criar como admin
            ativo=True
        )
        novo_usuario.set_senha(senha)
        
        try:
            db.session.add(novo_usuario)
            db.session.commit()
            
            print("\n" + "="*60)
            print("  ✅ USUÁRIO CRIADO COM SUCESSO!")
            print("="*60)
            print(f"\n📋 Dados do Usuário:")
            print(f"   Nome: {novo_usuario.nome}")
            print(f"   Email: {novo_usuario.email}")
            print(f"   Cargo: {novo_usuario.cargo}")
            print(f"   Perfil: Admin")
            print(f"   ID: {novo_usuario.id}")
            print("\n🔓 Use estas credenciais para fazer login:")
            print(f"   Email: {novo_usuario.email}")
            print(f"   Senha: (a que você acabou de definir)")
            print("\n" + "="*60 + "\n")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Erro ao criar usuário: {str(e)}")
            return

if __name__ == '__main__':
    try:
        criar_usuario_admin()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        sys.exit(1)
