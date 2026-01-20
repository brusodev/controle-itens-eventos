
import sys
import os

# Adiciona o diretório backend ao path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import create_app
from models import db, Detentora

app = create_app()
with app.app_context():
    detentoras = Detentora.query.all()
    print(f"Total de detentoras: {len(detentoras)}")
    print(f"{'ID':<4} | {'Nome':<40} | {'Modulo':<12} | {'Grupo':<10}")
    print("-" * 75)
    for d in detentoras:
        print(f"{d.id:<4} | {str(d.nome)[:40]:<40} | {str(d.modulo):<12} | {str(d.grupo):<10}")
