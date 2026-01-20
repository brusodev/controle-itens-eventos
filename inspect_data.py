
import sys
import os

# Adiciona o diretório backend ao path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import create_app
from models import db, Categoria, Item

app = create_app()
with app.app_context():
    cats = Categoria.query.all()
    print(f"Total de categorias: {len(cats)}")
    print(f"{'ID':<4} | {'Nome':<40} | {'Modulo':<15}")
    print("-" * 65)
    for c in cats:
        print(f"{c.id:<4} | {str(c.nome)[:40]:<40} | {str(c.modulo):<15}")
    
    items = Item.query.all()
    print(f"\nTotal de itens: {len(items)}")
