#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para testar a funcionalidade de edição de O.S.
"""

from app import create_app, db
from models import OrdemServico, ItemOrdemServico
import json

app = create_app()

with app.app_context():
    print("=" * 60)
    print("TESTE DE EDIÇÃO DE ORDEM DE SERVIÇO")
    print("=" * 60)
    
    # 1. Listar todas as O.S.
    total = OrdemServico.query.count()
    print(f"\n✅ Total de O.S. no banco: {total}")
    
    if total == 0:
        print("\n⚠️ Não há O.S. cadastradas para testar.")
        print("   Acesse http://127.0.0.1:5100/ e crie uma O.S. primeiro.")
    else:
        # Pegar a primeira O.S.
        os = OrdemServico.query.first()
        os_dict = os.to_dict()
        print(f"\n📋 O.S. para teste:")
        print(f"   ID: {os.id}")
        print(f"   Número: {os_dict['numeroOS']}")
        print(f"   Evento: {os_dict['evento']}")
        print(f"   Data de Emissão: {os_dict.get('dataEmissao', 'N/A')}")
        
        # Listar itens
        itens = ItemOrdemServico.query.filter_by(ordem_servico_id=os.id).all()
        print(f"\n📦 Itens da O.S.:")
        for item in itens:
            item_dict = item.to_dict()
            print(f"   - {item_dict['descricao']}: {item_dict['qtdTotal']} unidades")
        
        print("\n" + "=" * 60)
        print("SIMULAÇÃO DE EDIÇÃO VIA API")
        print("=" * 60)
        
        # Mostrar como fazer a edição via API
        print(f"\n🔧 Para editar esta O.S., faça:")
        print(f"   PUT http://127.0.0.1:5100/api/ordens-servico/{os.id}")
        print(f"\n   Body (JSON):")
        exemplo = {
            "numeroOS": os_dict['numeroOS'],
            "dataEmissao": os_dict.get('dataEmissao', '2025-01-20'),
            "contrato": os_dict.get('contrato', '123/2025'),
            "gestorContrato": os_dict.get('gestorContrato', 'Nome Gestor'),
            "evento": "EVENTO EDITADO - TESTE",  # ← MUDANÇA AQUI
            "dataEvento": os_dict.get('dataEvento', '2025-01-25'),
            "localEvento": os_dict.get('localEvento', 'Local teste'),
            "horaInicio": os_dict.get('horaInicio', '09:00'),
            "horaFim": os_dict.get('horaFim', '12:00'),
            "publicoEstimado": os_dict.get('publicoEstimado', 50),
            "unidadeSolicitante": os_dict.get('unidadeSolicitante', 'SEDUC'),
            "responsavelUnidade": os_dict.get('responsavelUnidade', 'Responsável'),
            "contatoResponsavel": os_dict.get('contatoResponsavel', '(11) 99999-9999'),
            "justificativa": "JUSTIFICATIVA EDITADA - TESTE DE ALTERAÇÃO",  # ← MUDANÇA AQUI
            "itens": []
        }
        
        for item in itens:
            item_dict = item.to_dict()
            exemplo["itens"].append({
                "item_id": item.item_id,
                "quantidade": item.quantidade_total + 10  # ← MUDANÇA: +10 unidades
            })
        
        print(json.dumps(exemplo, indent=2, ensure_ascii=False))
        
        print("\n" + "=" * 60)
        print("TESTE COM CURL")
        print("=" * 60)
        
        # Gerar comando curl para teste
        json_data = json.dumps(exemplo, ensure_ascii=False).replace('"', '\\"')
        print(f'\ncurl -X PUT http://127.0.0.1:5100/api/ordens-servico/{os.id} ^')
        print(f'  -H "Content-Type: application/json" ^')
        print(f'  -d "{json_data}"')
        
        print("\n" + "=" * 60)
        print("VERIFICAÇÃO APÓS EDIÇÃO")
        print("=" * 60)
        print(f"\n1. Faça a requisição PUT acima")
        print(f"2. Acesse: http://127.0.0.1:5100/")
        print(f"3. Clique em '👁️ Visualizar' na O.S. #{os_dict['numeroOS']}")
        print(f"4. Verifique se mostra:")
        print(f"   ✅ Evento: 'EVENTO EDITADO - TESTE'")
        print(f"   ✅ Justificativa: 'JUSTIFICATIVA EDITADA...'")
        print(f"   ✅ Itens com +10 unidades")
        print(f"\n5. Teste também '🖨️ Imprimir' e '📄 PDF'")
        print(f"   (Devem mostrar os mesmos dados atualizados)")
        
    print("\n" + "=" * 60)
