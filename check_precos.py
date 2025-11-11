#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sqlite3

conn = sqlite3.connect('backend/instance/controle_itens.db')
cursor = conn.cursor()

# Verificar quantos itens têm preço zero
cursor.execute('SELECT COUNT(*) as total FROM estoque_regional WHERE preco = "0"')
total_zero = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) as total FROM estoque_regional WHERE preco != "0"')
total_com_preco = cursor.fetchone()[0]

print(f"Total de estoques com preço ZERO: {total_zero}")
print(f"Total de estoques com preço: {total_com_preco}")

# Ver quais itens têm preço
cursor.execute('''
    SELECT er.id, i.descricao, er.regiao_numero, er.preco
    FROM estoque_regional er
    JOIN itens i ON er.item_id = i.id
    WHERE er.preco != "0"
    LIMIT 10
''')

print("\nItens COM preço:")
for row in cursor.fetchall():
    print(f"  - {row[1]} (Região {row[2]}): R$ {row[3]}")

conn.close()
