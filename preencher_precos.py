#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para preencher preços faltantes
Estratégia: Se um item tem preço em uma região, replica para as outras
"""
import sqlite3

conn = sqlite3.connect('backend/instance/controle_itens.db')
cursor = conn.cursor()

print("Preenchendo preços faltantes...")
print("="*80)

# Listar todos os itens únicos
cursor.execute('SELECT DISTINCT item_id FROM estoque_regional')
item_ids = [row[0] for row in cursor.fetchall()]

atualizado_count = 0

for item_id in item_ids:
    # Buscar o primeiro preço não-zero para esse item
    cursor.execute('SELECT preco FROM estoque_regional WHERE item_id = ? AND preco != "0" LIMIT 1', (item_id,))
    resultado = cursor.fetchone()
    
    if resultado:
        preco_referencia = resultado[0]
        
        # Atualizar todos os registros com preço "0" para esse item
        cursor.execute(
            'UPDATE estoque_regional SET preco = ? WHERE item_id = ? AND preco = "0"',
            (preco_referencia, item_id)
        )
        
        if cursor.rowcount > 0:
            atualizado_count += cursor.rowcount
            cursor.execute('SELECT descricao FROM itens WHERE id = ?', (item_id,))
            nome_item = cursor.fetchone()[0]
            print(f"✓ {nome_item}: preço {preco_referencia} aplicado a {cursor.rowcount} região(ões)")

conn.commit()
print("="*80)
print(f"Total de registros atualizados: {atualizado_count}")

# Verificar resultado final
cursor.execute('SELECT COUNT(*) FROM estoque_regional WHERE preco = "0"')
zero_count = cursor.fetchone()[0]
print(f"Ainda restam {zero_count} estoques com preço ZERO")

conn.close()
