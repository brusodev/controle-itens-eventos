import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

c.execute('SELECT id, nome, email, perfil FROM usuarios WHERE perfil = "admin"')
admins = c.fetchall()

print('\n=== USUÁRIOS ADMIN ===')
for a in admins:
    print(f'ID: {a[0]}, Nome: {a[1]}, Email: {a[2]}, Perfil: {a[3]}')

conn.close()
