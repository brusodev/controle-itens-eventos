from app import create_app, db
from models import OrdemServico

app = create_app()

with app.app_context():
    # Buscar a O.S. 1
    os = OrdemServico.query.get(1)
    
    if os:
        print("=" * 60)
        print("BANCO DE DADOS - O.S. #1")
        print("=" * 60)
        print(f"ID: {os.id}")
        print(f"Número: {os.numero_os}")
        print(f"Evento: {os.evento}")
        print(f"Data Evento: {os.data_evento}")
        print(f"Local: {os.local}")
        print(f"Número Pessoas: {os.numero_pessoas}")
        print("-" * 60)
        if os.justificativa:
            print(f"Justificativa: {os.justificativa[:100]}...")
        else:
            print("Justificativa: N/A")
        print("=" * 60)
        
        # Buscar itens
        print(f"\nTotal de itens: {len(os.itens)}")
        for item in os.itens[:3]:  # Mostrar só os primeiros 3
            print(f"  - {item.nome_item} (Quantidade: {item.quantidade})")
    else:
        print("❌ O.S. #1 não encontrada no banco!")
