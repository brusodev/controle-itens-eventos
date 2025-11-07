import sqlite3
from werkzeug.security import check_password_hash

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

email = 'marcia.gallo@educacao.sp.gov.br'
senha = '123456'

c.execute('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?', (email,))
user = c.fetchone()

if user:
    print(f'\n=== USUÁRIO ENCONTRADO ===')
    print(f'ID: {user[0]}')
    print(f'Nome: {user[1]}')
    print(f'Email: {user[2]}')
    print(f'Hash da senha no DB: {user[3][:50]}...')
    
    # Testa se a senha está com hash ou texto plano
    if check_password_hash(user[3], senha):
        print(f'✅ Senha "{senha}" está CORRETA (com hash)')
    elif user[3] == senha:
        print(f'✅ Senha "{senha}" está CORRETA (texto plano)')
    else:
        print(f'❌ Senha "{senha}" está INCORRETA')
        print(f'\nTentando outras senhas comuns...')
        for test_pwd in ['admin', 'admin123', '123', '12345', '1234567']:
            if check_password_hash(user[3], test_pwd):
                print(f'✅ Senha correta é: "{test_pwd}" (com hash)')
            elif user[3] == test_pwd:
                print(f'✅ Senha correta é: "{test_pwd}" (texto plano)')
else:
    print(f'❌ Usuário {email} não encontrado!')

conn.close()
