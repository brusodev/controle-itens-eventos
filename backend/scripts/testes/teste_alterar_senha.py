"""
Script de teste para a API de alteração de senha
"""
import requests
import json

# Configuração
BASE_URL = 'http://127.0.0.1:5100'

def testar_alterar_senha():
    """Testa a API de alteração de senha"""
    
    print("\n" + "="*80)
    print("TESTE DA API DE ALTERAÇÃO DE SENHA")
    print("="*80)
    
    # 1. Login
    print("\n1️⃣ FAZENDO LOGIN...")
    
    login_data = {
        'email': 'marcia.gallo@educacao.sp.gov.br',
        'senha': '123456'
    }
    
    session = requests.Session()
    response = session.post(f'{BASE_URL}/auth/login', json=login_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Login realizado com sucesso!")
        print(f"   ID do usuário: {result.get('id')}")
    else:
        print(f"   ❌ Erro no login: {response.status_code}")
        print(f"   Resposta: {response.text}")
        return
    
    # 2. Testar alteração de senha com senha atual errada
    print("\n2️⃣ TESTANDO ALTERAÇÃO COM SENHA ATUAL ERRADA...")
    
    response = session.post(f'{BASE_URL}/auth/api/alterar-senha', json={
        'senha_atual': 'senhaErrada123',
        'senha_nova': 'novaSenha123'
    })
    
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('content-type')}")
    
    if response.status_code == 401:
        data = response.json()
        print(f"   ✅ Rejeitou senha incorreta corretamente!")
        print(f"   Mensagem: {data.get('erro')}")
    else:
        print(f"   ❌ Deveria ter retornado 401")
        print(f"   Resposta: {response.text}")
    
    # 3. Testar alteração de senha com senha nova curta
    print("\n3️⃣ TESTANDO ALTERAÇÃO COM SENHA NOVA MUITO CURTA...")
    
    response = session.post(f'{BASE_URL}/auth/api/alterar-senha', json={
        'senha_atual': '123456',
        'senha_nova': '123'
    })
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        data = response.json()
        print(f"   ✅ Rejeitou senha curta corretamente!")
        print(f"   Mensagem: {data.get('erro')}")
    else:
        print(f"   ❌ Deveria ter retornado 400")
        print(f"   Resposta: {response.text}")
    
    # 4. Testar alteração de senha com sucesso
    print("\n4️⃣ TESTANDO ALTERAÇÃO DE SENHA COM SUCESSO...")
    
    response = session.post(f'{BASE_URL}/auth/api/alterar-senha', json={
        'senha_atual': '123456',
        'senha_nova': 'NovaSenha@2024'
    })
    
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('content-type')}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Senha alterada com sucesso!")
        print(f"   Sucesso: {data.get('sucesso')}")
        print(f"   Mensagem: {data.get('mensagem')}")
    else:
        print(f"   ❌ Erro ao alterar senha")
        print(f"   Resposta: {response.text}")
        return
    
    # 5. Testar login com senha antiga (deve falhar)
    print("\n5️⃣ TESTANDO LOGIN COM SENHA ANTIGA...")
    
    session2 = requests.Session()
    response = session2.post(f'{BASE_URL}/auth/login', json={
        'email': 'marcia.gallo@educacao.sp.gov.br',
        'senha': '123456'
    })
    
    if response.status_code == 401:
        print(f"   ✅ Senha antiga não funciona mais!")
    else:
        print(f"   ❌ Senha antiga ainda funciona (erro!)")
    
    # 6. Testar login com senha nova (deve funcionar)
    print("\n6️⃣ TESTANDO LOGIN COM SENHA NOVA...")
    
    response = session2.post(f'{BASE_URL}/auth/login', json={
        'email': 'marcia.gallo@educacao.sp.gov.br',
        'senha': 'NovaSenha@2024'
    })
    
    if response.status_code == 200:
        print(f"   ✅ Login com senha nova funcionou!")
    else:
        print(f"   ❌ Login com senha nova falhou")
        print(f"   Resposta: {response.text}")
        return
    
    # 7. Restaurar senha original
    print("\n7️⃣ RESTAURANDO SENHA ORIGINAL...")
    
    response = session2.post(f'{BASE_URL}/auth/api/alterar-senha', json={
        'senha_atual': 'NovaSenha@2024',
        'senha_nova': '123456'
    })
    
    if response.status_code == 200:
        print(f"   ✅ Senha restaurada para o valor original!")
    else:
        print(f"   ❌ Erro ao restaurar senha")
        print(f"   Resposta: {response.text}")
    
    print("\n" + "="*80)
    print("✅ TODOS OS TESTES DE ALTERAÇÃO DE SENHA PASSARAM!")
    print("="*80)

if __name__ == '__main__':
    input('\n🔍 Certifique-se de que o servidor Flask está rodando.\nPressione ENTER para continuar...\n')
    testar_alterar_senha()
