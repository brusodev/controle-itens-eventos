#!/usr/bin/env python3
"""Verificar todos os campos da O.S."""

from app import create_app, db
from models import OrdemServico

app = create_app()

with app.app_context():
    os = db.session.get(OrdemServico, 1)
    
    if os:
        print("=" * 60)
        print("TODOS OS CAMPOS DA O.S. #1")
        print("=" * 60)
        
        for col in os.__table__.columns:
            valor = getattr(os, col.name)
            print(f"{col.name:25} = {valor}")
        
        print("=" * 60)
    else:
        print("O.S. não encontrada")
