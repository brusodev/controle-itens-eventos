#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para verificar se as O.S. estão sendo salvas no banco de dados
"""

import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, OrdemServico, ItemOrdemServico

def verificar_ordens_servico():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("🔍 VERIFICANDO ORDENS DE SERVIÇO NO BANCO DE DADOS")
        print("=" * 60)
        
        # Contar total de O.S.
        total_os = OrdemServico.query.count()
        print(f"\n📊 Total de O.S. no banco: {total_os}")
        
        if total_os == 0:
            print("❌ Nenhuma O.S. encontrada no banco de dados!")
            return
        
        # Listar todas as O.S.
        print("\n📋 Lista de Ordens de Serviço:")
        print("-" * 60)
        
        ordens = OrdemServico.query.order_by(OrdemServico.id.desc()).all()
        
        for os in ordens:
            print(f"\n🆔 ID: {os.id}")
            print(f"📄 Número O.S.: {os.numero_os}")
            print(f"📅 Evento: {os.evento}")
            print(f"📍 Local: {os.local}")
            print(f"📆 Data: {os.data}")
            print(f"👤 Gestor: {os.gestor_contrato}")
            print(f"📝 Contrato: {os.contrato}")
            
            # Contar itens
            total_itens = ItemOrdemServico.query.filter_by(ordem_servico_id=os.id).count()
            print(f"📦 Total de itens: {total_itens}")
            
            # Mostrar itens
            if total_itens > 0:
                itens = ItemOrdemServico.query.filter_by(ordem_servico_id=os.id).all()
                print(f"   Itens:")
                for item in itens:
                    print(f"   - {item.descricao} (Qtd: {item.quantidade_total})")
        
        print("\n" + "=" * 60)
        print("✅ Verificação concluída!")
        print("=" * 60)

if __name__ == '__main__':
    verificar_ordens_servico()
