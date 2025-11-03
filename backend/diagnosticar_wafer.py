"""
Diagnóstico do erro: Item 14 não encontrado
"""
import sqlite3

print("\n" + "="*80)
print("DIAGNÓSTICO: ERRO 'ITEM 14 NÃO ENCONTRADO'")
print("="*80)

# 1. Verificar se o item existe
conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print("\n1️⃣ VERIFICANDO SE ITEM 14 EXISTE:")
c.execute('SELECT id, descricao FROM itens WHERE id = 14')
item = c.fetchone()

if item:
    print(f"   ✅ Item 14 EXISTE: {item[1]}")
else:
    print("   ❌ Item 14 NÃO EXISTE!")
    conn.close()
    exit()

# 2. Verificar código do backend
print("\n2️⃣ VERIFICANDO CÓDIGO DO BACKEND:")

try:
    with open('routes/os_routes.py', 'r', encoding='utf-8') as f:
        conteudo = f.read()
    
    if 'filter_by(id=item_os_data[\'itemId\'])' in conteudo:
        print("   ✅ Backend usa: filter_by(id=...) - CORRETO")
        backend_correto = True
    elif 'filter_by(item_codigo=item_os_data[\'itemId\'])' in conteudo:
        print("   ❌ Backend usa: filter_by(item_codigo=...) - ERRADO")
        backend_correto = False
    else:
        print("   ⚠️ Não foi possível verificar")
        backend_correto = None
        
except:
    print("   ⚠️ Erro ao ler arquivo")
    backend_correto = None

# 3. Simular o que o backend faz
print("\n3️⃣ SIMULANDO BUSCA DO BACKEND:")

item_id_frontend = 14
print(f"   Frontend envia: itemId = {item_id_frontend}")

# Busca CORRETA (por ID)
c.execute('SELECT id, descricao FROM itens WHERE id = ?', (item_id_frontend,))
result_correto = c.fetchone()

if result_correto:
    print(f"   ✅ Busca por ID: ENCONTRADO - {result_correto[1]}")
else:
    print(f"   ❌ Busca por ID: NÃO ENCONTRADO")

# Busca ERRADA (por item_codigo)
c.execute('SELECT id, descricao FROM itens WHERE item_codigo = ?', (str(item_id_frontend),))
result_errado = c.fetchone()

if result_errado:
    print(f"   ⚠️ Busca por item_codigo: ENCONTRADO - {result_errado[1]}")
else:
    print(f"   ❌ Busca por item_codigo: NÃO ENCONTRADO (esperado)")

# 4. Conclusão
print("\n" + "="*80)
print("CONCLUSÃO:")
print("="*80)

if backend_correto:
    print("\n✅ O código do backend está CORRETO")
    print("\n⚠️ MAS VOCÊ PRECISA REINICIAR O SERVIDOR!")
    print("\n   O Flask NÃO recarrega automaticamente mudanças em arquivos de rotas.")
    print("   Você DEVE:")
    print("   1. Parar o servidor (Ctrl+C no terminal onde está rodando)")
    print("   2. Rodar novamente: python app.py")
    print("   3. Tentar emitir a O.S. novamente")
elif backend_correto == False:
    print("\n❌ O código do backend está ERRADO")
    print("   A correção NÃO foi aplicada!")
else:
    print("\n⚠️ Não foi possível verificar o código do backend")

print("\n" + "="*80)

conn.close()
