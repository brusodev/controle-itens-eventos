"""
Script para criar usuário admin inicial
Execute uma única vez para configurar o primeiro usuário
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db, Usuario
from getpass import getpass


def criar_admin():
    """Cria um usuário admin inicial"""
    app = create_app()
    
    with app.app_context():
        # Verificar se já existe um usuário
        if Usuario.query.first():
            print("⚠️  Já existem usuários cadastrados no banco de dados")
            continuar = input("Deseja criar um novo usuário? (s/n): ").lower()
            if continuar != 's':
                print("Operação cancelada")
                return
        
        print("\n" + "="*50)
        print("  Criando Novo Usuário Admin")
        print("="*50 + "\n")
        
        nome = input("Nome completo: ").strip()
        if not nome:
            print("❌ Nome é obrigatório")
            return
        
        email = input("Email: ").strip().lower()
        if not email or '@' not in email:
            print("❌ Email inválido")
            return
        
        # Verificar se email já existe
        if Usuario.query.filter_by(email=email).first():
            print("❌ Email já cadastrado no sistema")
            return
        
        while True:
            senha = getpass("Senha (mínimo 6 caracteres): ")
            if len(senha) < 6:
                print("❌ Senha deve ter no mínimo 6 caracteres")
                continue
            
            confirmacao = getpass("Confirme a senha: ")
            if senha != confirmacao:
                print("❌ Senhas não conferem")
                continue
            
            break
        
        cargo = input("Cargo (pressione Enter para pular): ").strip() or None
        
        # Criar usuário
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            cargo=cargo or "Administrador",
            ativo=True
        )
        novo_usuario.set_senha(senha)
        
        db.session.add(novo_usuario)
        db.session.commit()
        
        print("\n" + "="*50)
        print("  ✅ Usuário Criado com Sucesso!")
        print("="*50)
        print(f"Nome: {novo_usuario.nome}")
        print(f"Email: {novo_usuario.email}")
        print(f"Cargo: {novo_usuario.cargo}")
        print(f"ID: {novo_usuario.id}")
        print("\nVocê pode fazer login com essas credenciais")


if __name__ == '__main__':
    criar_admin()
