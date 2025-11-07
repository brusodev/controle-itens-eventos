"""
Script para testar se os preços estão sendo retornados pela API
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:5100'

# Login
login_data = {
    'email': 'marcia.gallo@educacao.sp.gov.br',
    'senha': '123456'
}

session = requests.Session()
response = session.post(f'{BASE_URL}/auth/login', json=login_data)

if response.status_code == 200:
    print('✅ Login OK')
    
    # Buscar dados de alimentação
    response = session.get(f'{BASE_URL}/api/alimentacao')
    
    if response.status_code == 200:
        dados = response.json()
        print('\n📊 Testando retorno dos preços:\n')
        
        # Pegar primeiro item de cada categoria
        for categoria, info in dados.items():
            if 'itens' in info and len(info['itens']) > 0:
                primeiro_item = info['itens'][0]
                print(f'Categoria: {categoria}')
                print(f'  Item: {primeiro_item["descricao"]}')
                print(f'  Regiões:')
                
                for regiao, valores in primeiro_item.get('regioes', {}).items():
                    preco = valores.get('preco', 'NÃO ENCONTRADO')
                    inicial = valores.get('inicial', '0')
                    print(f'    Região {regiao}: Inicial={inicial}, Preço={preco}')
                
                print()
                break  # Mostrar apenas o primeiro
    else:
        print(f'❌ Erro ao buscar alimentação: {response.status_code}')
else:
    print(f'❌ Erro no login: {response.status_code}')
