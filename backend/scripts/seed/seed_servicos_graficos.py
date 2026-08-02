#!/usr/bin/env python3
"""Script para popular itens iniciais do módulo de Serviços Gráficos (Contrato 2021/26)"""

import sys
from pathlib import Path

# Adicionar o diretório backend ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional

app = create_app()

MODULO = 'servicos_graficos'
NATUREZA_DESPESA = '33.90.39'  # Elemento de despesa do Contrato 2021/26


def preco_br(valor):
    """Formata um float como string no padrão brasileiro (ex.: 5.0 -> '5,00').

    O sistema armazena e interpreta preços em formato BR (vírgula decimal,
    ponto como separador de milhar). Ver parsing em estoque.js/emitir-os.js.
    """
    return f'{float(valor):,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

# Categorias por tipo de serviço
CATEGORIAS = [
    {'nome': 'graficos_banners', 'descricao': 'Banners e Roll Up'},
    {'nome': 'graficos_cartoes', 'descricao': 'Cartões e Credenciais'},
    {'nome': 'graficos_cartazes', 'descricao': 'Cartazes, Certificados e Marcadores'},
    {'nome': 'graficos_publicacoes', 'descricao': 'Cartilhas, Livretos e Revistas'},
    {'nome': 'graficos_folhetos', 'descricao': 'Folhetos, Folders e Flyers'},
    {'nome': 'graficos_copias', 'descricao': 'Cópias'},
    {'nome': 'graficos_encadernacao', 'descricao': 'Encadernação'},
    {'nome': 'graficos_impressoes', 'descricao': 'Impressões e Plotagem'},
    {'nome': 'graficos_acabamentos', 'descricao': 'Blocos e Acabamentos'},
]

# Itens do Contrato 2021/26.
# codigo = SG### (sequencial, único); catser = código CATSER do contrato (vai em Item.natureza);
# quantidade = quantidade contratada; preco = valor unitário.
ITENS = [
    # Banners e Roll Up
    {'cat': 'graficos_banners', 'codigo': 'SG001', 'catser': '18724', 'qtd': 72, 'preco': 90.00,
     'descricao': 'Banner em lona com impressão digital de alta qualidade, medida 1,20m x 0,90m, acabamento de madeira e ponta de PVC, com tripé'},
    {'cat': 'graficos_banners', 'codigo': 'SG002', 'catser': '18724', 'qtd': 72, 'preco': 100.00,
     'descricao': 'Banner em lona com impressão digital de alta qualidade, medida 1,50m x 0,90m, acabamento de madeira e ponta de PVC, com tripé'},
    {'cat': 'graficos_banners', 'codigo': 'SG003', 'catser': '18724', 'qtd': 72, 'preco': 120.00,
     'descricao': 'Banner em lona com impressão digital de alta qualidade, medida 1,30m x 1,80m, acabamento de madeira e ponta de PVC, com tripé'},
    {'cat': 'graficos_banners', 'codigo': 'SG039', 'catser': '18724', 'qtd': 72, 'preco': 260.00,
     'descricao': 'Banner Roll Up 0,80m x 2,00m retrátil - base em alumínio anodizado, sistema retrátil e haste de sustentação, lona vinílica ou PP, acabamento fosco, uso interno, alta resolução (mínimo 1440 dpi)'},
    {'cat': 'graficos_banners', 'codigo': 'SG040', 'catser': '18724', 'qtd': 72, 'preco': 300.00,
     'descricao': 'Banner Roll Up 1,50m x 2,00m retrátil - base em alumínio anodizado, sistema retrátil e haste de sustentação, lona vinílica ou PP, acabamento fosco, uso interno, alta resolução (mínimo 1440 dpi)'},

    # Cartões e Credenciais
    {'cat': 'graficos_cartoes', 'codigo': 'SG004', 'catser': '15423', 'qtd': 1440, 'preco': 0.80,
     'descricao': 'Cartão cerimonial formato 12,5cm x 8,5cm, papel cartão supremo 330gr, impressão 1 x 1 cores'},
    {'cat': 'graficos_cartoes', 'codigo': 'SG005', 'catser': '15423', 'qtd': 1440, 'preco': 0.90,
     'descricao': 'Cartão cerimonial formato 12,5cm x 8,5cm, papel cartão supremo 330gr, impressão 4 x 0 cores'},
    {'cat': 'graficos_cartoes', 'codigo': 'SG006', 'catser': '15423', 'qtd': 1440, 'preco': 0.50,
     'descricao': 'Cartão de visita formato 9,5cm x 5,5cm, acabamento refile'},
    {'cat': 'graficos_cartoes', 'codigo': 'SG046', 'catser': '18724', 'qtd': 1440, 'preco': 3.00,
     'descricao': 'Credencial/Crachá - papel offset, gramatura mínima de 120 g/m², dimensões aproximadas 11 x 7 cm, colorido, corte reto, refile, furação simples para uso com cordão'},

    # Cartazes, Certificados e Marcadores
    {'cat': 'graficos_cartazes', 'codigo': 'SG007', 'catser': '461503', 'qtd': 7200, 'preco': 5.00,
     'descricao': 'Cartaz formato 60cm x 40cm, papel couche 150gr, impressão 4 x 0 cores, acabamento dupla face e refile'},
    {'cat': 'graficos_cartazes', 'codigo': 'SG010', 'catser': '18724', 'qtd': 2880, 'preco': 1.45,
     'descricao': 'Certificado formato 21cm x 29,7cm - A4, papel couche brilho 300gr, impressão 4 x 0 cores, acabamento refile'},
    {'cat': 'graficos_cartazes', 'codigo': 'SG041', 'catser': '485922', 'qtd': 2880, 'preco': 0.80,
     'descricao': 'Marcador de Página - papel couchê ou papel offset 250 g/m², 5 cm x 20 cm, frente ou frente e verso, corte reto ou cantos arredondados'},

    # Cartilhas, Livretos e Revistas
    {'cat': 'graficos_publicacoes', 'codigo': 'SG008', 'catser': '412335', 'qtd': 1440, 'preco': 15.00,
     'descricao': 'Cartilha formato 29,7cm x 21cm, A4 fechado, 96 páginas, papel couche 115gr, impressão 4 x 4 cores, acabamento hotmelt'},
    {'cat': 'graficos_publicacoes', 'codigo': 'SG009', 'catser': '412335', 'qtd': 1440, 'preco': 25.00,
     'descricao': 'Cartilha/book formato 29,7cm x 21cm, 96 páginas, papel couche 115gr, impressão 4 x 4 cores, capa dura'},
    {'cat': 'graficos_publicacoes', 'codigo': 'SG014', 'catser': '10049', 'qtd': 2880, 'preco': 7.00,
     'descricao': 'Livreto formato 15,5cm x 11,5cm, 48 páginas, miolo couche 115gr 4 x 4 cores, capa couche brilho 150gr 4 x 4 cores, acabamento grampeado e refile'},
    {'cat': 'graficos_publicacoes', 'codigo': 'SG015', 'catser': '10049', 'qtd': 2880, 'preco': 7.00,
     'descricao': 'Livreto formato 15cm x 21cm, 48 páginas, miolo couche 115gr 4 x 4 cores, capa couche brilho 150gr 4 x 4 cores, acabamento grampeado e refile'},
    {'cat': 'graficos_publicacoes', 'codigo': 'SG053', 'catser': '12866', 'qtd': 288, 'preco': 138.00,
     'descricao': 'Impressão gráfica de revistas institucionais - formato fechado A4 (21,0 x 29,7 cm), miolo couchê 115g 4 x 4 cores, capa couchê 250g 4 x 4 cores, laminação, encadernação cola PUR, número de páginas variável conforme O.S.'},

    # Folhetos, Folders e Flyers
    {'cat': 'graficos_folhetos', 'codigo': 'SG011', 'catser': '16756', 'qtd': 2880, 'preco': 0.55,
     'descricao': 'Folheto formato 15cm x 21cm fechado, papel couche 115gr, impressão 4 x 0 cores, acabamento 2 dobras e refile'},
    {'cat': 'graficos_folhetos', 'codigo': 'SG012', 'catser': '16756', 'qtd': 2880, 'preco': 0.90,
     'descricao': 'Folheto formato 15cm x 21cm fechado, papel couche 115gr, impressão 4 x 4 cores, acabamento 2 dobras e refile'},
    {'cat': 'graficos_folhetos', 'codigo': 'SG013', 'catser': '18724', 'qtd': 4320, 'preco': 0.80,
     'descricao': 'Folder formato 29,7cm x 21cm aberto, papel couche 115gr, impressão 4 x 4 cores, acabamento 1 ou 2 dobras e refile'},
    {'cat': 'graficos_folhetos', 'codigo': 'SG034', 'catser': '15423', 'qtd': 4320, 'preco': 1.00,
     'descricao': 'Flyer tamanho A5, papel couché brilho 150g/m², 4 x 4 cores'},
    {'cat': 'graficos_folhetos', 'codigo': 'SG035', 'catser': '15423', 'qtd': 4320, 'preco': 0.70,
     'descricao': 'Flyer tamanho A5, papel couché brilhante 90g/m², impressão 4 x 0 cores'},

    # Cópias
    {'cat': 'graficos_copias', 'codigo': 'SG016', 'catser': '26590', 'qtd': 2880, 'preco': 0.45,
     'descricao': 'Cópias em preto e branco, tamanho A3, sulfite 75g - só frente (297 x 420mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG017', 'catser': '26573', 'qtd': 144000, 'preco': 0.25,
     'descricao': 'Cópias em preto e branco, tamanho A4, sulfite 75g - só frente (210 x 297mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG018', 'catser': '26590', 'qtd': 2880, 'preco': 1.00,
     'descricao': 'Cópias coloridas, tamanho A3, sulfite 75g - só frente (297 x 420mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG019', 'catser': '26573', 'qtd': 144000, 'preco': 0.60,
     'descricao': 'Cópias coloridas, tamanho A4, sulfite 75g - só frente (210 x 297mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG020', 'catser': '26590', 'qtd': 2880, 'preco': 0.72,
     'descricao': 'Cópias em preto e branco, tamanho A3, sulfite 75g - frente e verso (297 x 420mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG021', 'catser': '26573', 'qtd': 144000, 'preco': 0.40,
     'descricao': 'Cópias em preto e branco, tamanho A4, sulfite 75g - frente e verso (210 x 297mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG022', 'catser': '26590', 'qtd': 2880, 'preco': 1.50,
     'descricao': 'Cópias coloridas, tamanho A3, sulfite 75g - frente e verso (297 x 420mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG023', 'catser': '26573', 'qtd': 144000, 'preco': 0.45,
     'descricao': 'Cópias coloridas, tamanho A4, sulfite 75g - frente e verso (210 x 297mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG024', 'catser': '605770', 'qtd': 1440, 'preco': 0.56,
     'descricao': 'Cópias em preto e branco, tamanho Ofício 2, sulfite 75g - só frente (216 x 330mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG025', 'catser': '605770', 'qtd': 1440, 'preco': 0.90,
     'descricao': 'Cópias em preto e branco, tamanho Ofício 2, sulfite 75g - frente e verso (216 x 330mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG026', 'catser': '605770', 'qtd': 1440, 'preco': 0.90,
     'descricao': 'Cópias coloridas, tamanho Ofício 2, sulfite 75g - só frente (216 x 330mm)'},
    {'cat': 'graficos_copias', 'codigo': 'SG027', 'catser': '605770', 'qtd': 1440, 'preco': 1.00,
     'descricao': 'Cópias coloridas, tamanho Ofício 2, sulfite 75g - frente e verso (216 x 330mm)'},

    # Encadernação
    {'cat': 'graficos_encadernacao', 'codigo': 'SG028', 'catser': '20567', 'qtd': 1440, 'preco': 4.00,
     'descricao': 'Encadernação (até 100 folhas), em espiral com capa de PVC transparente na frente e com cor nas costas'},
    {'cat': 'graficos_encadernacao', 'codigo': 'SG029', 'catser': '20567', 'qtd': 1440, 'preco': 4.00,
     'descricao': 'Encadernação pequena (101 a 250 folhas), em espiral com capa de PVC transparente na frente e com cor nas costas'},
    {'cat': 'graficos_encadernacao', 'codigo': 'SG030', 'catser': '20567', 'qtd': 1440, 'preco': 5.00,
     'descricao': 'Encadernação (acima de 251 folhas), em espiral com capa de PVC transparente na frente e com cor nas costas'},
    {'cat': 'graficos_encadernacao', 'codigo': 'SG031', 'catser': '12866', 'qtd': 1440, 'preco': 3.00,
     'descricao': 'Encadernação (até 100 folhas) em hot-melt'},
    {'cat': 'graficos_encadernacao', 'codigo': 'SG032', 'catser': '12866', 'qtd': 1440, 'preco': 4.00,
     'descricao': 'Encadernação (101 a 250 folhas) em hot-melt'},
    {'cat': 'graficos_encadernacao', 'codigo': 'SG033', 'catser': '12866', 'qtd': 1440, 'preco': 4.50,
     'descricao': 'Encadernação (acima de 251 folhas) em hot-melt'},

    # Impressões e Plotagem
    {'cat': 'graficos_impressoes', 'codigo': 'SG036', 'catser': '27600', 'qtd': 72, 'preco': 29.00,
     'descricao': 'Serviço de impressão/plotagem colorida de Projetos de Engenharia com dobragem conforme ABNT/NBR 13142/1999, formato ABNT A0, sulfite 75g/m², resolução mínima 1200x1200 dpi'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG037', 'catser': '27600', 'qtd': 72, 'preco': 22.00,
     'descricao': 'Serviço de impressão/plotagem colorida de Projetos de Engenharia com dobragem conforme ABNT/NBR 13142/1999, formato ABNT A1, sulfite 75g/m², resolução mínima 1200x1200 dpi'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG038', 'catser': '27600', 'qtd': 72, 'preco': 13.00,
     'descricao': 'Serviço de impressão/plotagem colorida de Projetos de Engenharia com dobragem conforme ABNT/NBR 13142/1999, formato ABNT A2, sulfite 75g/m², resolução mínima 1200x1200 dpi'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG043', 'catser': '27600', 'qtd': 144, 'preco': 50.00,
     'descricao': 'Impressão Gráfica A0 - papel couchê mínimo 170 g/m², acabamento fosco ou brilho, 4 x 0 cores, alta resolução (mínimo 1440 dpi)'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG044', 'catser': '27600', 'qtd': 144, 'preco': 35.00,
     'descricao': 'Impressão Gráfica A1 - papel couchê mínimo 170 g/m², acabamento fosco ou brilho, 4 x 0 cores, alta resolução (mínimo 1440 dpi)'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG045', 'catser': '27600', 'qtd': 144, 'preco': 25.00,
     'descricao': 'Impressão Gráfica A2 - papel couchê mínimo 170 g/m², acabamento fosco ou brilho, 4 x 0 cores, alta resolução (mínimo 1440 dpi)'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG049', 'catser': '274825', 'qtd': 288, 'preco': 4.50,
     'descricao': 'Impressão em papel fotográfico - gramatura mínima 180 g/m², acabamento brilho ou fosco, formatos 10 x 15 cm e 15 x 21 cm'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG050', 'catser': '238491', 'qtd': 144, 'preco': 4.00,
     'descricao': 'Impressão em papel vergê - gramatura mínima 180 g/m², preto e branco ou colorida, formato A4'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG051', 'catser': '238491', 'qtd': 144, 'preco': 4.50,
     'descricao': 'Impressão em papel vergê - gramatura mínima 180 g/m², preto e branco ou colorida, formato A3'},
    {'cat': 'graficos_impressoes', 'codigo': 'SG052', 'catser': '20397', 'qtd': 720, 'preco': 5.00,
     'descricao': 'Impressão de adesivos - vinil adesivo, papel adesivo ou equivalente, acabamento fosco ou brilho, formatos padronizados (A4, A3, etiquetas) ou recortes especiais'},

    # Blocos e Acabamentos
    {'cat': 'graficos_acabamentos', 'codigo': 'SG042', 'catser': '18929', 'qtd': 2880, 'preco': 5.00,
     'descricao': 'Bloco de notas A5 (14,8 x 21 cm) - papel offset 75 g/m² ou 90 g/m², 1x0 / 4x0 cores, 30 folhas, acabamento refile'},
    {'cat': 'graficos_acabamentos', 'codigo': 'SG047', 'catser': '18422', 'qtd': 144, 'preco': 3.00,
     'descricao': 'Plastificação (laminação) - espessura mínima do filme 75 micras, acabamento fosco ou brilho, térmica ou a frio, formato A4'},
    {'cat': 'graficos_acabamentos', 'codigo': 'SG048', 'catser': '18422', 'qtd': 144, 'preco': 4.50,
     'descricao': 'Plastificação (laminação) - espessura mínima do filme 75 micras, acabamento fosco ou brilho, térmica ou a frio, formato A3'},
]


def seed_servicos_graficos():
    with app.app_context():
        print("🚀 Populando itens do módulo de Serviços Gráficos...")

        # 1. Criar categorias
        categorias_criadas = {}
        for cat_info in CATEGORIAS:
            cat = Categoria.query.filter_by(nome=cat_info['nome'], modulo=MODULO).first()
            if not cat:
                cat = Categoria(
                    nome=cat_info['nome'],
                    tipo='estoque',
                    natureza=NATUREZA_DESPESA,
                    modulo=MODULO,
                    descricao=cat_info['descricao'],
                )
                db.session.add(cat)
                print(f"📦 Categoria criada: {cat_info['descricao']}")
            else:
                print(f"ℹ️ Categoria já existe: {cat_info['descricao']}")
            categorias_criadas[cat_info['nome']] = cat

        db.session.flush()

        # 2. Criar itens + estoque (região 1, grupo único)
        criados = 0
        for item_info in ITENS:
            cat = categorias_criadas[item_info['cat']]
            item = Item.query.filter_by(item_codigo=item_info['codigo'], categoria_id=cat.id).first()

            if not item:
                item = Item(
                    categoria_id=cat.id,
                    item_codigo=item_info['codigo'],
                    descricao=item_info['descricao'],
                    unidade='UNIDADE',
                    natureza=item_info['catser'],  # CATSER real (código do contrato)
                )
                db.session.add(item)
                db.session.flush()

                estoque = EstoqueRegional(
                    item_id=item.id,
                    regiao_numero=1,
                    quantidade_inicial=item_info['qtd'],
                    quantidade_gasto=0,
                    preco=preco_br(item_info['preco']),
                )
                db.session.add(estoque)
                criados += 1
                print(f"  ✅ Item {item_info['codigo']} (CATSER {item_info['catser']}): {item_info['descricao'][:60]}...")
            else:
                print(f"  ℹ️ Item já existe: {item_info['codigo']}")

        db.session.commit()
        print(f"\n✅ Seed Serviços Gráficos concluído! {criados} item(ns) novo(s) de {len(ITENS)} no contrato.")


if __name__ == '__main__':
    seed_servicos_graficos()
