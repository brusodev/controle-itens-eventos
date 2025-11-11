#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para preencher preços faltantes baseado em média
"""
import sqlite3

conn = sqlite3.connect('backend/instance/controle_itens.db')
cursor = conn.cursor()

# Listar todos os itens únicos
cursor.execute('SELECT DISTINCT er.item_id, i.descricao FROM estoque_regional er JOIN itens i ON er.item_id = i.id')
itens = cursor.fetchall()

print("Analisando preços por item...")
print("="*80)

for item_id, descricao in itens:
    # Buscar preços desse item
    cursor.execute('SELECT regiao_numero, preco FROM estoque_regional WHERE item_id = ? AND preco != "0"', (item_id,))
    precos_encontrados = cursor.fetchall()
    
    # Buscar preços zero
    cursor.execute('SELECT COUNT(*) FROM estoque_regional WHERE item_id = ? AND preco = "0"', (item_id,))
    qtd_zero = cursor.fetchone()[0]
    
    print(f"\n{descricao} (ID: {item_id})")
    print(f"  - Regiões com preço: {len(precos_encontrados)}")
    print(f"  - Regiões com preço ZERO: {qtd_zero}")
    
    if precos_encontrados:
        for regiao, preco in precos_encontrados:
            print(f"    - Região {regiao}: R$ {preco}")

print("\n" + "="*80)
print("\nPara corrigir, você precisa acessar cada item no modal de alimentação")
print("e preencher os campos de PREÇO antes de salvar!")

conn.close()
