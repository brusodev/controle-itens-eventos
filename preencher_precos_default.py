#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para preencher preços padrão em itens que faltam
(apenas para teste - você precisa atualizar os preços corretos depois!)
"""
import sqlite3

conn = sqlite3.connect('backend/instance/controle_itens.db')
cursor = conn.cursor()

# Atualizar todos os preços "0" com um preço padrão de 10,00
cursor.execute('UPDATE estoque_regional SET preco = "10,00" WHERE preco = "0"')
atualizado = cursor.rowcount

conn.commit()

cursor.execute('SELECT COUNT(*) FROM estoque_regional WHERE preco = "0"')
zero_count = cursor.fetchone()[0]

print(f"Preços atualizados (com padrão 10,00): {atualizado}")
print(f"Ainda restam com ZERO: {zero_count}")

if atualizado > 0:
    print("\n✅ IMPORTANTE: Esses preços foram preenchidos com R$ 10,00 APENAS PARA TESTE!")
    print("Você PRECISA editar cada item no modal de alimentação e preencher os preços CORRETOS!")
    print("Depois de preencher todos, clique em EMITIR O.S. e o VALOR TOTAL vai aparecer corretamente!")

conn.close()
