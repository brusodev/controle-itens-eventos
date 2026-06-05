"""
Migration: Padronizar número das OS do formato antigo (1/2026) para o novo (OS-001)
Data: 2026-06-05

Converte:
  1/2026  → OS-001
  2/2026  → OS-002
  ...
  10/2026 → OS-010

O número extraído antes da barra vira o sufixo 3 dígitos.
Execute com: python migrations/migrate_padronizar_numero_os.py

Use --dry-run para visualizar sem salvar.
"""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DRY_RUN = '--dry-run' in sys.argv


def extrair_numero(numero_os):
    """Extrai o número inteiro de '1/2026', '01/2026', '1/25', etc."""
    if not numero_os:
        return None
    s = str(numero_os).strip()
    if s.upper().startswith('OS-'):
        return None  # já está no formato novo
    if '/' in s:
        partes = s.split('/')
        try:
            return int(partes[0])
        except ValueError:
            pass
    m = re.match(r'^(\d+)$', s)
    if m:
        return int(m.group(1))
    return None


def main():
    from app import create_app, db
    from models import OrdemServico

    app = create_app()
    with app.app_context():
        oss = OrdemServico.query.order_by(OrdemServico.id).all()

        antigos = [(o, extrair_numero(o.numero_os)) for o in oss
                   if extrair_numero(o.numero_os) is not None]

        if not antigos:
            print("Nenhuma OS com formato antigo encontrada.")
            return

        print(f"{'[DRY-RUN] ' if DRY_RUN else ''}Convertendo {len(antigos)} OS...\n")
        print(f"{'ID':>5}  {'Atual':>12}  {'Novo':>10}  {'Módulo':<15}  {'Det.ID'}")
        print("-" * 60)

        alteracoes = []
        for os_obj, num in antigos:
            novo_numero = f"OS-{num:03d}"

            # Verificar conflito (já existe OS com esse número no mesmo módulo+detentora?)
            conflito = OrdemServico.query.filter_by(
                numero_os=novo_numero,
                modulo=os_obj.modulo,
                detentora_id=os_obj.detentora_id
            ).filter(OrdemServico.id != os_obj.id).first()

            status = "⚠️ CONFLITO" if conflito else "✅"
            print(f"{os_obj.id:>5}  {os_obj.numero_os!r:>12}  {novo_numero:>10}  {os_obj.modulo:<15}  {str(os_obj.detentora_id):<8}  {status}")

            if not conflito:
                alteracoes.append((os_obj, novo_numero))

        print()
        if DRY_RUN:
            print(f"[DRY-RUN] Nenhuma alteração salva. {len(alteracoes)} OS seriam atualizadas.")
            return

        if not alteracoes:
            print("Nenhuma OS pode ser atualizada (todos com conflito).")
            return

        resposta = input(f"\nAtualizar {len(alteracoes)} OS? (s/N): ").strip().lower()
        if resposta != 's':
            print("Operação cancelada.")
            return

        for os_obj, novo_numero in alteracoes:
            os_obj.numero_os = novo_numero

        db.session.commit()
        print(f"\n✅ {len(alteracoes)} OS atualizadas com sucesso!")


if __name__ == '__main__':
    main()
