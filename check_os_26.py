#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sqlite3

conn = sqlite3.connect('backend/instance/controle_itens.db')
cursor = conn.cursor()

cursor.execute('''
    SELECT ios.id, ios.descricao, ios.quantidade_total, ios.valor_unitario, os.numero_os
    FROM itens_ordem_servico ios
    JOIN ordens_servico os ON ios.ordem_servico_id = os.id
    WHERE os.numero_os = "26/2025"
''')

print("Verificando O.S. 26/2025:")
print("="*60)
for row in cursor.fetchall():
    print(f"\nItem: {row[1]}")
    print(f"  Qtd Total: {row[2]}")
    print(f"  Valor Unit: '{row[3]}' (tipo: {type(row[3]).__name__})")
    print(f"  O.S.: {row[4]}")
    print("-"*60)

conn.close()
