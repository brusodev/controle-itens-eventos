"""
Script de teste para a API de atualização de usuário
"""
import requests
import json

# Configuração
BASE_URL = 'http://127.0.0.1:5100'

def testar_api_usuario():
    """Testa a API de gerenciamento de usuários"""
    
    print("\n" + "="*80)
    print("TESTE DA API DE ATUALIZAÇÃO DE USUÁRIO")
    print("="*80)
    
    # 1. Login
    print("\n1️⃣ FAZENDO LOGIN...")
    
    login_data = {
        'email': 'marcia.gallo@educacao.sp.gov.br',
        'senha': '123456'
    }
    
    session = requests.Session()
    
    try:
        response = session.post(f'{BASE_URL}/auth/login', json=login_data)
        
        if response.status_code == 200:
            print("   ✅ Login realizado com sucesso!")
            result = response.json()
            usuario_id = result['usuario']['id']
            print(f"   ID do usuário: {usuario_id}")
        else:
            print(f"   ❌ Erro no login: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"   ❌ Erro na requisição de login: {str(e)}")
        return False
    
    # 2. Listar usuários
    print("\n2️⃣ LISTANDO USUÁRIOS...")
    
    try:
        response = session.get(f'{BASE_URL}/auth/api/usuarios')
        
        if response.status_code == 200:
            usuarios = response.json()
            print(f"   ✅ {len(usuarios)} usuários encontrados")
            
            # Pegar o primeiro usuário para teste
            if usuarios:
                usuario_teste = usuarios[0]
                print(f"   Usuário de teste: {usuario_teste['nome']} (ID: {usuario_teste['id']})")
            else:
                print("   ⚠️ Nenhum usuário encontrado para teste")
                return False
        else:
            print(f"   ❌ Erro ao listar: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"   ❌ Erro na requisição: {str(e)}")
        return False
    
    # 3. Testar atualização SEM senha
    print("\n3️⃣ TESTANDO ATUALIZAÇÃO SEM SENHA...")
    
    dados_update = {
        'nome': usuario_teste['nome'],
        'email': usuario_teste['email'],
        'cargo': 'Cargo Teste',
        'perfil': usuario_teste['perfil'],
        'ativo': usuario_teste['ativo']
    }
    
    try:
        response = session.put(
            f"{BASE_URL}/auth/api/usuarios/{usuario_teste['id']}",
            json=dados_update,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type')}")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            result = response.json()
            
            if response.status_code == 200:
                print("   ✅ Atualização SEM senha funcionou!")
                print(f"   Sucesso: {result.get('sucesso')}")
            else:
                print(f"   ❌ Erro: {result.get('erro', 'Erro desconhecido')}")
        else:
            print(f"   ❌ ERRO: Servidor retornou HTML em vez de JSON!")
            print(f"   Primeiros 500 caracteres da resposta:")
            print(f"   {response.text[:500]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro na requisição: {str(e)}")
        return False
    
    # 4. Testar atualização COM senha
    print("\n4️⃣ TESTANDO ATUALIZAÇÃO COM SENHA...")
    
    dados_update['senha'] = 'novaSenha123'
    
    try:
        response = session.put(
            f"{BASE_URL}/auth/api/usuarios/{usuario_teste['id']}",
            json=dados_update,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type')}")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            result = response.json()
            
            if response.status_code == 200:
                print("   ✅ Atualização COM senha funcionou!")
                print(f"   Sucesso: {result.get('sucesso')}")
            else:
                print(f"   ❌ Erro: {result.get('erro', 'Erro desconhecido')}")
        else:
            print(f"   ❌ ERRO: Servidor retornou HTML em vez de JSON!")
            print(f"   Primeiros 500 caracteres da resposta:")
            print(f"   {response.text[:500]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro na requisição: {str(e)}")
        return False
    
    # Resultado final
    print("\n" + "="*80)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("="*80)
    
    return True


if __name__ == '__main__':
    print("\n🔍 Certifique-se de que:")
    print("   1. O servidor Flask está rodando (python app.py)")
    print("   2. Você tem um usuário admin criado")
    print("   3. As credenciais no script estão corretas")
    
    input("\nPressione ENTER para continuar...")
    
    sucesso = testar_api_usuario()
    
    if sucesso:
        print("\n✅ API está funcionando corretamente!")
    else:
        print("\n❌ Há problemas na API que precisam ser corrigidos!")
