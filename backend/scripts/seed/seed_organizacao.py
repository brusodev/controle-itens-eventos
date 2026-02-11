#!/usr/bin/env python3
"""Script para popular categorias, itens e estoques do módulo de Organização de Eventos"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app import create_app, db
from models import Categoria, Item, EstoqueRegional

app = create_app()

MODULO = 'organizacao'

# 4 Categorias do módulo Organização
CATEGORIAS = [
    {'nome': 'montagem_decoracao', 'tipo': 'alimentacao', 'natureza': '', 'modulo': MODULO, 'descricao': 'Montagem e Decoração'},
    {'nome': 'recursos_humanos', 'tipo': 'alimentacao', 'natureza': '', 'modulo': MODULO, 'descricao': 'Recursos Humanos'},
    {'nome': 'equipamento_informatica', 'tipo': 'alimentacao', 'natureza': '', 'modulo': MODULO, 'descricao': 'Equipamento de Informática'},
    {'nome': 'material_grafico_expediente', 'tipo': 'alimentacao', 'natureza': '', 'modulo': MODULO, 'descricao': 'Material Gráfico de Expediente'},
]

# 119 Itens - dados da planilha Organização.xlsx
# Formato: (codigo, descricao, bec, unidade, qtd_grupo1, qtd_grupo2, qtd_grupo3, categoria)
ITENS = [
    # ===== MONTAGEM E DECORAÇÃO (1-47) =====
    ('1', 'Alambrado /Grade Proteção/Guarda Corpo', '16675', 'metro linear/dia', 300, 250, 250, 'montagem_decoracao'),
    ('2', 'Ambulância Básica (Serviço de assistência de saúde)', '14052', 'Diária', 100, 50, 50, 'montagem_decoracao'),
    ('3', 'Arranjo de Flores II', '17019', 'M²', 100, 25, 25, 'montagem_decoracao'),
    ('4', 'ART De Montagens, Lonas', '10222', 'Unidade', 10, 10, 10, 'montagem_decoracao'),
    ('5', 'Balcão para recepção', '4375', 'Metro linear/dia', 500, 250, 250, 'montagem_decoracao'),
    ('6', 'Banheiro Químico PNE', '17612', 'Diária', 10, 5, 5, 'montagem_decoracao'),
    ('7', 'Banheiro Químico simples (feminino e masculino)', '17612', 'Diária', 40, 40, 20, 'montagem_decoracao'),
    ('8', 'Bebedouro elétrico de chão', '4405', 'Diária', 600, 300, 300, 'montagem_decoracao'),
    ('9', 'Box Truss Q15', '13099', 'metro linear/dia', 2000, 1200, 1200, 'montagem_decoracao'),
    ('10', 'Box Truss Q30', '13099', 'metro linear/dia', 500, 500, 500, 'montagem_decoracao'),
    ('11', 'Cadeira de obeso', '4076', 'Diária', 80, 100, 100, 'montagem_decoracao'),
    ('12', 'Cadeira fixa com ou sem braço de plástico', '20460', 'Diária', 2000, 2500, 2500, 'montagem_decoracao'),
    ('13', 'Cadeira fixa sem braço estofada', '20460', 'Diária', 20000, 30000, 20000, 'montagem_decoracao'),
    ('14', 'Cadeira de rodas', '20877', 'Diária', 30, 15, 15, 'montagem_decoracao'),
    ('15', 'Climatizador de Ar profissional', '20818', 'Diária', 100, 50, 50, 'montagem_decoracao'),
    ('16', 'Coletor de Resíduos Sólidos - Container (1000 litros), preto, 4 rodas', '25640', 'Diária', 40, 20, 20, 'montagem_decoracao'),
    ('17', 'Cordão de isolamento, tipo unifila', '17019', 'Diária', 1000, 1000, 1000, 'montagem_decoracao'),
    ('18', 'Estande Misto - construído em octanorm', '20460', 'm2/dia', 1000, 500, 500, 'montagem_decoracao'),
    ('19', 'Estande Construído em marcenaria com Teto e Tratamento Acústico', '20460', 'm2/dia', 20000, 35000, 30000, 'montagem_decoracao'),
    ('20', 'Extintor de Incêndio (CO2)', '16128', 'Diária', 40, 15, 15, 'montagem_decoracao'),
    ('21', 'Extintor de Incêndio água', '16128', 'Diária', 30, 15, 15, 'montagem_decoracao'),
    ('22', 'Extintor de Incêndio pó químico seco', '16128', 'Diária', 80, 75, 75, 'montagem_decoracao'),
    ('23', 'Frigobar', '14591', 'Diária', 100, 50, 50, 'montagem_decoracao'),
    ('24', 'Gerador de Energia 500 KVA', '4405', 'Diária', 30, 15, 15, 'montagem_decoracao'),
    ('25', 'Gerador de Energia 180 KVA', '4405', 'Diária', 100, 50, 50, 'montagem_decoracao'),
    ('26', 'Lixeira para área externa', '14222', 'Diária', 500, 250, 250, 'montagem_decoracao'),
    ('27', 'Lixeira para área interna', '14222', 'Diária', 500, 250, 250, 'montagem_decoracao'),
    ('28', 'Maca para emergência com apoio nas laterais', '4375', 'Diária', 30, 10, 10, 'montagem_decoracao'),
    ('29', 'Mesa redonda de vidro ou madeira, 1,6m diâmetro', '20460', 'Diária', 100, 25, 25, 'montagem_decoracao'),
    ('30', 'Mesa alta tipo bistrô com tampo de vidro', '22888', 'Diária', 100, 35, 35, 'montagem_decoracao'),
    ('31', 'Mesa tipo pranchão', '20460', 'Diária', 5000, 25000, 25000, 'montagem_decoracao'),
    ('32', 'Mesa Plástica Quadrada', '20460', 'Diária', 2000, 250, 250, 'montagem_decoracao'),
    ('33', 'Placa de Homenagem', '18597', 'Unidade', 230, 115, 115, 'montagem_decoracao'),
    ('34', 'Praticável', '24376', 'm2/dia', 2000, 500, 500, 'montagem_decoracao'),
    ('35', 'Poltrona', '20460', 'Diária', 50, 25, 25, 'montagem_decoracao'),
    ('36', 'Púlpito em acrílico ou madeira', '20460', 'Diária', 100, 50, 50, 'montagem_decoracao'),
    ('37', 'Saia de Palco', '17019', 'M²', 500, 500, 500, 'montagem_decoracao'),
    ('38', 'Seguro por pessoa - Serviço de Seguro de Responsabilidade Civil', '906', 'Pessoa', 30000, 30000, 30000, 'montagem_decoracao'),
    ('39', 'Serviço de Cenografia', '15288', 'M²', 2000, 1000, 1000, 'montagem_decoracao'),
    ('40', 'Serviço de Audiodescrição', '3778', 'Diária', 6, 5, 5, 'montagem_decoracao'),
    ('41', 'Serviços de limpeza, desinfecção e desodorização', '5380', 'posto/dia', 2500, 1250, 1250, 'montagem_decoracao'),
    ('42', 'Tecido para cenografia', '17124', 'M²', 500, 250, 250, 'montagem_decoracao'),
    ('43', 'Tenda piramidal 10x10', '17809', 'Diária', 100, 250, 250, 'montagem_decoracao'),
    ('44', 'Toalha de mesa redonda', '17124', 'Diária', 100, 25, 25, 'montagem_decoracao'),
    ('45', 'Toalha de mesa retangular', '17124', 'Diária', 500, 350, 350, 'montagem_decoracao'),
    ('46', 'Vaso com plantas decorativas naturais grandes', '20460', 'Diária', 100, 100, 100, 'montagem_decoracao'),
    ('47', 'Ventilador', '1538', 'Diária', 50, 125, 125, 'montagem_decoracao'),

    # ===== RECURSOS HUMANOS (48-58) =====
    ('48', 'Apoio operacional de eventos', '13927', 'Diária', 200, 100, 100, 'recursos_humanos'),
    ('49', 'Atendente de credenciamento', '4375', 'Diária', 1000, 500, 500, 'recursos_humanos'),
    ('50', 'Auxiliar de serviços gerais', '5380', 'Diária', 500, 300, 300, 'recursos_humanos'),
    ('51', 'Assessoria Técnica em Eventos', '24503', 'Diária', 200, 75, 75, 'recursos_humanos'),
    ('52', 'Brigadista de Incêndio', '24376', 'Diária', 300, 250, 250, 'recursos_humanos'),
    ('53', 'Coordenação Geral Eventos', '14591', 'Diária', 100, 50, 50, 'recursos_humanos'),
    ('54', 'Enfermeira', '13927', 'Diária', 50, 50, 50, 'recursos_humanos'),
    ('55', 'Mestre de Cerimônias', '12955', 'Diária', 10, 5, 5, 'recursos_humanos'),
    ('56', 'Serviço de Eletricista', '14354', 'Diária', 50, 35, 35, 'recursos_humanos'),
    ('57', 'Segurança Diurno', '23647', 'Diária', 250, 150, 150, 'recursos_humanos'),
    ('58', 'Segurança Noturno', '23957', 'Diária', 200, 75, 75, 'recursos_humanos'),

    # ===== EQUIPAMENTO DE INFORMÁTICA (59-110) =====
    ('59', 'Antena para microfone externa amplificada', '415486', 'Diária', 300, 330, 330, 'equipamento_informatica'),
    ('60', 'Base Receptora De Sinal De Microfone', '13757', 'Diária', 300, 150, 150, 'equipamento_informatica'),
    ('61', 'Canhão Seguidor', '12556', 'Diária', 400, 200, 200, 'equipamento_informatica'),
    ('62', 'Caixa de Som Multimídia a prova d\'água', '12556', 'Diária', 30, 15, 15, 'equipamento_informatica'),
    ('63', 'Caixa Line Array - 2x8" + Drive', '12556', 'Diária', 200, 750, 100, 'equipamento_informatica'),
    ('64', 'Caixas De Som Ativa 10", 12" Ou 15" - 1000 Watts', '12556', 'Diária', 1000, 100, 750, 'equipamento_informatica'),
    ('65', 'Equipamento de iluminação de pequeno porte (até 200 pessoas)', '30003', 'Diária', 30, 25, 25, 'equipamento_informatica'),
    ('66', 'Equipamento de iluminação de médio porte (de 200 a 600 pessoas)', '13757', 'Diária', 30, 25, 25, 'equipamento_informatica'),
    ('67', 'Equipamento de iluminação de grande porte (mais de 600 pessoas)', '13757', 'Diária', 100, 100, 100, 'equipamento_informatica'),
    ('68', 'Gerenciador de Espectro', '14591', 'Diária', 100, 50, 50, 'equipamento_informatica'),
    ('69', 'Impressora laser colorida com toner e papel', '27618', 'Diária', 100, 25, 25, 'equipamento_informatica'),
    ('70', 'Interface de áudio', '3778', 'Diária', 100, 25, 25, 'equipamento_informatica'),
    ('71', 'Infraestrutura de redes', '218367', 'Diária', 700, 700, 700, 'equipamento_informatica'),
    ('72', 'Link Dedicado De Internet Com Capacidade Mínima De 100 Mb/S Full Duplex', '26174', 'Diária', 200, 200, 200, 'equipamento_informatica'),
    ('73', 'Link dedicado de internet de 300 mb/s full duplex', '14591', 'Diária', 150, 150, 150, 'equipamento_informatica'),
    ('74', 'Main Power', '21490', 'Diária', 150, 750, 750, 'equipamento_informatica'),
    ('75', 'Microfone Com Fio', '12556', 'Diária', 600, 500, 500, 'equipamento_informatica'),
    ('76', 'Microfone Condensador', '13757', 'Diária', 200, 100, 100, 'equipamento_informatica'),
    ('77', 'Microfone Sem Fio', '13757', 'Diária', 400, 350, 350, 'equipamento_informatica'),
    ('78', 'Mesa De Som De 12 Canais', '14591', 'Diária', 650, 500, 500, 'equipamento_informatica'),
    ('79', 'Mesa De Som De 32 Canais', '13757', 'Diária', 100, 50, 50, 'equipamento_informatica'),
    ('80', 'Moving Beam 200', '22888', 'Diária', 500, 100, 100, 'equipamento_informatica'),
    ('81', 'Monitor LED', '19151', 'Diária', 150, 150, 150, 'equipamento_informatica'),
    ('82', 'MULTILINK', '14591', 'Diária', 100, 50, 50, 'equipamento_informatica'),
    ('83', 'Nobreak', '2658', 'Diária', 50, 150, 50, 'equipamento_informatica'),
    ('84', 'Notebook', '27405', 'Diária', 300, 50, 150, 'equipamento_informatica'),
    ('85', 'Passa cabos', '22888', 'Metro linear/dia', 3000, 1500, 1500, 'equipamento_informatica'),
    ('86', 'Painel de Led I (Indoor) - P2', '14591', 'm2/dia', 1000, 750, 750, 'equipamento_informatica'),
    ('87', 'Passador de Slides sem Fio', '12556', 'Diária', 650, 250, 250, 'equipamento_informatica'),
    ('88', 'Pedestal de Mesa', '14591', 'Diária', 30, 15, 15, 'equipamento_informatica'),
    ('89', 'Pedestal tipo girafa para microfone', '4375', 'Diária', 300, 150, 150, 'equipamento_informatica'),
    ('90', 'Ponto de internet com acesso e tempo ilimitado', '4375', 'Diária', 1000, 2500, 2500, 'equipamento_informatica'),
    ('91', 'Ponto elétrico para tomadas e extensão (D.A)', '5606', 'Diária', 1000, 2500, 2500, 'equipamento_informatica'),
    ('92', 'Projetor de Multimídia - 10.000 Ansi lumens', '12556', 'Diária', 500, 750, 750, 'equipamento_informatica'),
    ('93', 'Projetor de Multimídia - 20.000 Ansi lumens', '12556', 'Diária', 200, 200, 200, 'equipamento_informatica'),
    ('94', 'Rádio Comunicador HT', '21750', 'Diária', 50, 25, 25, 'equipamento_informatica'),
    ('95', 'Serviço Técnico de Iluminação', '14591', 'Diária', 150, 50, 50, 'equipamento_informatica'),
    ('96', 'Serviço Técnico de Sonorização', '12556', 'Diária', 150, 125, 125, 'equipamento_informatica'),
    ('97', 'Set Cabos e Acessórios', '14591', 'Diária', 150, 50, 50, 'equipamento_informatica'),
    ('98', 'Sistema completo de Credenciamento', '21032', 'Diária', 70, 35, 35, 'equipamento_informatica'),
    ('99', 'Sonorização completa para apresentação cultural', '21490', 'Diária', 50, 20, 20, 'equipamento_informatica'),
    ('100', 'Show Link', '26484', 'Diária', 120, 60, 60, 'equipamento_informatica'),
    ('101', 'Sub Woofer 2x12', '12556', 'Diária', 200, 100, 100, 'equipamento_informatica'),
    ('102', 'Sub Woofer Acoplado Com 1000w - Caixa Coluna Com Tipo Line Array', '12556', 'Diária', 200, 250, 250, 'equipamento_informatica'),
    ('103', 'Switch 10/100 Ethernet 8 portas', '37702', 'Diária', 100, 115, 115, 'equipamento_informatica'),
    ('104', 'Switcher de Vídeo', '13757', 'Diária', 100, 50, 50, 'equipamento_informatica'),
    ('105', 'Tela para Projeção 2,40x1,80m', '13730', 'Diária', 500, 500, 500, 'equipamento_informatica'),
    ('106', 'Tela para Projeção 4,00x3,00m (120\')', '13730', 'Diária', 200, 75, 75, 'equipamento_informatica'),
    ('107', 'Tripé/Suporte de Caixa', '12556', 'Diária', 1000, 750, 750, 'equipamento_informatica'),
    ('108', 'TV LED DE 50"', '19151', 'Diária', 200, 159, 159, 'equipamento_informatica'),
    ('109', 'Totem Torre Carregador De Celular', '4571', 'Diária', 200, 50, 50, 'equipamento_informatica'),
    ('110', 'Wireless - Implantação de Infraestrutura de Transmissão de Dados Sem Fios', '3840', 'Diária', 600, 100, 100, 'equipamento_informatica'),

    # ===== MATERIAL GRÁFICO DE EXPEDIENTE (111-119) =====
    ('111', 'Crachá com cordão', '18422', 'Unidade', 10000, 10000, 10000, 'material_grafico_expediente'),
    ('112', 'Camiseta Tradicional Serigrafia Policromática Frente e/ou Costas', '10030', 'Unidade', 2500, 750, 750, 'material_grafico_expediente'),
    ('113', 'Copo - Kit promocional', '479006', 'Unidade', 20000, 10000, 10000, 'material_grafico_expediente'),
    ('114', 'Comunicação Visual em lona', '15601', 'M2', 2500, 1500, 1500, 'material_grafico_expediente'),
    ('115', 'Credencial com cordão', '18422', 'Unidade', 20000, 5000, 5000, 'material_grafico_expediente'),
    ('116', 'Flip Chart', '20460', 'Diária', 500, 150, 150, 'material_grafico_expediente'),
    ('117', 'Pins/Boton - Serviço de Produção de artefatos em metal', '18422', 'Unidade', 7000, 2500, 2500, 'material_grafico_expediente'),
    ('118', 'Sacola - ecobags - Kit promocional', '22330', 'Unidade', 20000, 10000, 10000, 'material_grafico_expediente'),
    ('119', 'Serviço de impressão de etiquetas', '18902', 'Unidade', 10000, 25000, 25000, 'material_grafico_expediente'),
]


def seed_organizacao():
    with app.app_context():
        print("=" * 60)
        print("SEED: Módulo Organização de Eventos")
        print("=" * 60)

        # 1. Criar Categorias
        print("\n--- Criando Categorias ---")
        categorias_map = {}
        for cat_info in CATEGORIAS:
            cat = Categoria.query.filter_by(nome=cat_info['nome'], modulo=MODULO).first()
            if not cat:
                cat = Categoria(**cat_info)
                db.session.add(cat)
                print(f"  Categoria criada: {cat_info['nome']}")
            else:
                print(f"  Categoria já existe: {cat_info['nome']}")
            categorias_map[cat_info['nome']] = cat

        db.session.flush()

        # 2. Criar Itens e EstoqueRegional
        print("\n--- Criando Itens e Estoques ---")
        criados = 0
        existentes = 0

        for (codigo, descricao, bec, unidade, qtd_g1, qtd_g2, qtd_g3, cat_nome) in ITENS:
            cat = categorias_map[cat_nome]
            item = Item.query.filter_by(item_codigo=codigo, categoria_id=cat.id).first()

            if not item:
                item = Item(
                    categoria_id=cat.id,
                    item_codigo=codigo,
                    descricao=descricao,
                    unidade=unidade,
                    natureza=bec  # BEC individual por item
                )
                db.session.add(item)
                db.session.flush()

                # Criar estoques para 3 regiões (grupos 1, 2, 3)
                quantidades = {1: qtd_g1, 2: qtd_g2, 3: qtd_g3}
                for regiao, qtd in quantidades.items():
                    estoque = EstoqueRegional(
                        item_id=item.id,
                        regiao_numero=regiao,
                        quantidade_inicial=str(qtd),
                        quantidade_gasto='0',
                        preco='0'
                    )
                    db.session.add(estoque)

                criados += 1
                if criados % 20 == 0:
                    print(f"  ... {criados} itens criados")
            else:
                existentes += 1

        db.session.commit()

        print(f"\n--- Resultado ---")
        print(f"  Itens criados: {criados}")
        print(f"  Itens já existentes: {existentes}")
        print(f"  Total de itens: {criados + existentes}")
        print("=" * 60)
        print("Seed Organização concluído!")
        print("=" * 60)


if __name__ == "__main__":
    seed_organizacao()
