#!/usr/bin/env python3
"""Teste da API de listagem de O.S."""

import requests
import json

def test_api_list():
    """Testa GET /api/ordens-servico"""
    
    url = "http://127.0.0.1:5100/api/ordens-servico"
    
    print("=" * 60)
    print("TESTANDO API DE LISTAGEM")
    print("=" * 60)
    print(f"URL: {url}")
    print()
    
    try:
        response = requests.get(url, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Total de O.S. retornadas: {len(data)}")
            print()
            
            if data:
                print("=" * 60)
                print("PRIMEIRA O.S. DA LISTA:")
                print("=" * 60)
                primeira = data[0]
                print(f"ID: {primeira.get('id')}")
                print(f"Número: {primeira.get('numeroOS')}")
                print(f"Evento: {primeira.get('evento')}")
                print(f"Data: {primeira.get('dataEvento')}")
                print(f"Local: {primeira.get('local')}")
                print()
                
                # Mostrar todas
                print("=" * 60)
                print("TODAS AS O.S.:")
                print("=" * 60)
                for i, os in enumerate(data, 1):
                    print(f"{i}. O.S. {os.get('numeroOS')} - {os.get('evento')[:50]}...")
            else:
                print("❌ API retornou lista vazia!")
                
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor!")
        print("   O backend está rodando em http://127.0.0.1:5100 ?")
    except Exception as e:
        print(f"❌ ERRO: {e}")

if __name__ == "__main__":
    test_api_list()
