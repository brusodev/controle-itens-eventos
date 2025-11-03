from app import create_appimport sqlite3

from models import OrdemServico, ItemOrdemServico, Item, MovimentacaoEstoque, EstoqueRegional

conn = sqlite3.connect('instance/controle_itens.db')

app = create_app()cursor = conn.cursor()



with app.app_context():print("="*80)

    # Buscar O.S. #20/2025print("🔍 INVESTIGAÇÃO DA O.S. 12/2025")

    os = OrdemServico.query.filter_by(numero_os='20/2025').first()print("="*80)

    

    if not os:# Buscar dados da O.S.

        print("\n❌ O.S. 20/2025 não encontrada!")cursor.execute("""

        exit()    SELECT id, numero_os, grupo, regiao_estoque

        FROM ordens_servico

    print('\n' + '='*80)    WHERE numero_os = '12/2025'

    print('🔍 INVESTIGAÇÃO COMPLETA: O.S. 20/2025')""")

    print('='*80)os_data = cursor.fetchone()

    print(f'\n📋 Dados Gerais:')

    print(f'   Grupo: {os.grupo}')print(f"\n📋 O.S. 12/2025:")

    print(f'   Evento: {os.evento}')print(f"   ID: {os_data[0]}")

    print(f'   Data Emissão: {os.data_emissao}')print(f"   Número: {os_data[1]}")

    print(f'   Total de itens: {len(os.itens)}')print(f"   Grupo: {os_data[2]}")

    print(f"   Região Estoque (salva): {os_data[3]}")

    print('\n' + '-'*80)

    print('📦 ITENS CADASTRADOS NA ORDEM DE SERVIÇO:')# Buscar movimentação

    print('-'*80)cursor.execute("""

        SELECT m.tipo, m.quantidade, e.regiao_numero, i.descricao, e.id as estoque_id

    for idx, item_os in enumerate(os.itens, 1):    FROM movimentacoes_estoque m

        print(f'\n🔹 Item #{idx}:')    JOIN estoque_regional e ON e.id = m.estoque_regional_id

        print(f'   ID na tabela itens_ordem_servico: {item_os.id}')    JOIN itens i ON i.id = m.item_id

        print(f'   item_id (FK para tabela itens): {item_os.item_id}')    WHERE m.ordem_servico_id = ?

        print(f'   Descrição SALVA na O.S.: "{item_os.descricao}"')""", (os_data[0],))

        print(f'   Item BEC: {item_os.item_bec}')

        print(f'   Categoria: {item_os.categoria}')mov = cursor.fetchone()

        print(f'   Código Item: {item_os.item_codigo}')

        print(f'   Unidade: {item_os.unidade}')print(f"\n📦 Movimentação de Estoque:")

        print(f'   Qtd Solicitada (por diária): {item_os.quantidade_solicitada}')print(f"   Item: {mov[3]}")

        print(f'   Diárias: {item_os.diarias}')print(f"   Tipo: {mov[0]}")

        print(f'   Qtd Total (solicitada × diárias): {item_os.quantidade_total}')print(f"   Quantidade: {mov[1]}")

        print(f"   Região ABATIDA: {mov[2]}")

        # Buscar o item REAL no bancoprint(f"   Estoque ID: {mov[4]}")

        item_real = Item.query.get(item_os.item_id)

        if item_real:print("\n" + "="*80)

            print(f'\n   ✅ ITEM REAL NO BANCO (ID={item_os.item_id}):')if os_data[3] == mov[2]:

            print(f'      Descrição: "{item_real.descricao}"')    print("✅ CORRETO: Região abatida corresponde ao grupo da O.S.")

            print(f'      Unidade: {item_real.unidade}')else:

                print("❌ PROBLEMA IDENTIFICADO!")

            # Verificar se houve "troca" de descrição    print(f"   Grupo da O.S.: {os_data[2]}")

            if item_real.descricao != item_os.descricao:    print(f"   Região esperada: {os_data[3]}")

                print(f'\n   ⚠️  ALERTA: DESCRIÇÕES DIFERENTES!')    print(f"   Região abatida: {mov[2]} ❌")

                print(f'      Na O.S.: "{item_os.descricao}"')    print(f"\n   O sistema deveria abatem da região {os_data[3]}, mas abateu da região {mov[2]}!")

                print(f'      No Banco: "{item_real.descricao}"')

        else:# Verificar estoques da Água 500ml em todas as regiões

            print(f'\n   ❌ ERRO: Item ID {item_os.item_id} não existe na tabela itens!')print("\n" + "="*80)

    print("📊 ESTOQUE DE ÁGUA 500ML EM TODAS AS REGIÕES")

    # Verificar movimentações de estoqueprint("="*80)

    print('\n' + '-'*80)

    print('📊 MOVIMENTAÇÕES DE ESTOQUE REGISTRADAS:')cursor.execute("""

    print('-'*80)    SELECT id FROM itens

        WHERE descricao LIKE '%gua%500%'

    movimentacoes = MovimentacaoEstoque.query.filter_by(ordem_servico_id=os.id).order_by(MovimentacaoEstoque.data_movimentacao).all()""")

    item_id = cursor.fetchone()[0]

    if movimentacoes:

        for idx, mov in enumerate(movimentacoes, 1):cursor.execute("""

            item = Item.query.get(mov.item_id)    SELECT regiao_numero, quantidade_inicial, quantidade_gasto

            estoque = EstoqueRegional.query.get(mov.estoque_regional_id)    FROM estoque_regional

                WHERE item_id = ?

            print(f'\n🔸 Movimentação #{idx}:')    ORDER BY regiao_numero

            print(f'   Tipo: {mov.tipo}')""", (item_id,))

            print(f'   Item: {item.descricao if item else "N/A"}')

            print(f'   Quantidade: {mov.quantidade}')print(f"\n{'REGIÃO':<10} {'INICIAL':<15} {'GASTO':<15} {'DISPONÍVEL':<15}")

            print(f'   Região: {estoque.regiao_numero if estoque else "N/A"}')print("-" * 60)

            print(f'   Data: {mov.data_movimentacao}')

    else:for regiao, inicial, gasto in cursor.fetchall():

        print('\n   ⚠️  Nenhuma movimentação encontrada!')    inicial_num = float(inicial.replace('.', '').replace(',', '.'))

        gasto_num = float(gasto.replace(',', '.')) if gasto != '0' else 0

    # Verificar se há items duplicados    disponivel = inicial_num - gasto_num

    print('\n' + '-'*80)    

    print('🔍 ANÁLISE DE DUPLICAÇÃO:')    marcador = " ⚠️ ABATIDO" if gasto_num > 0 else ""

    print('-'*80)    print(f"{regiao:<10} {inicial_num:<15,.0f} {gasto_num:<15,.2f} {disponivel:<15,.0f}{marcador}")

    

    item_ids = [i.item_id for i in os.itens]conn.close()

    item_descricoes = [i.descricao for i in os.itens]

    print("\n" + "="*80)

    # Verificar IDs duplicados
    from collections import Counter
    contador_ids = Counter(item_ids)
    contador_desc = Counter(item_descricoes)
    
    duplicados_id = {k: v for k, v in contador_ids.items() if v > 1}
    duplicados_desc = {k: v for k, v in contador_desc.items() if v > 1}
    
    if duplicados_id:
        print(f'\n⚠️  ITENS DUPLICADOS POR ID:')
        for item_id, count in duplicados_id.items():
            item = Item.query.get(item_id)
            print(f'   - Item ID {item_id} ("{item.descricao if item else "N/A"}"): {count}x')
    
    if duplicados_desc:
        print(f'\n⚠️  ITENS DUPLICADOS POR DESCRIÇÃO:')
        for desc, count in duplicados_desc.items():
            print(f'   - "{desc}": {count}x')
    
    if not duplicados_id and not duplicados_desc:
        print('\n✅ Nenhuma duplicação detectada')
    
    print('\n' + '='*80)
    print('✅ Investigação concluída!')
    print('='*80 + '\n')
