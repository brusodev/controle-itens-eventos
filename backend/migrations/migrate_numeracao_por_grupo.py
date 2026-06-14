"""
Migration: Renumerar OS por (modulo, grupo) e atualizar UniqueConstraint

Contexto: o sistema gerava números sequenciais por módulo (OS-001, OS-002...
global para todo o módulo). Agora cada grupo/lote passa a ter sua própria
sequência independente (Grupo 1: OS-001, OS-002; Grupo 2: OS-001, OS-002...).

A constraint antiga era (numero_os, modulo, detentora_id).
A nova constraint é    (numero_os, modulo, grupo).

O script:
  1. Fase 1 — Renomeia todas as OS para nomes temporários OS-T-{id}
             (evita conflitos durante a renumeração)
  2. Fase 2 — Para cada (modulo, grupo), ordena as OS por data_emissao
             e renumera sequencialmente OS-001, OS-002...
  3. Recria a tabela ordens_servico com a nova UniqueConstraint usando
     SQLite (DROP CONSTRAINT não existe no SQLite; é necessário recriar).

Execute com:  python migrations/migrate_numeracao_por_grupo.py
Use --dry-run para visualizar sem salvar.
"""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DRY_RUN = '--dry-run' in sys.argv


def main():
    from app import create_app, db
    from models import OrdemServico
    from sqlalchemy import text

    app = create_app()
    with app.app_context():
        todas_os = OrdemServico.query.order_by(
            OrdemServico.modulo, OrdemServico.grupo, OrdemServico.data_emissao
        ).all()

        if not todas_os:
            print("Nenhuma OS encontrada. Nada a fazer.")
            _recriar_constraint(db)
            return

        # Agrupar por (modulo, grupo)
        grupos = {}
        for os_obj in todas_os:
            chave = (os_obj.modulo or '', os_obj.grupo or '')
            grupos.setdefault(chave, []).append(os_obj)

        print(f"{'[DRY-RUN] ' if DRY_RUN else ''}Renumerando OS por grupo...\n")
        print(f"{'Módulo':<15} {'Grupo':<8} {'Qtd OS':<8}")
        print("-" * 35)
        for (modulo, grupo), lista in sorted(grupos.items()):
            print(f"{modulo:<15} {grupo:<8} {len(lista):<8}")

        print(f"\nTotal de grupos: {len(grupos)}  |  Total de OS: {len(todas_os)}\n")

        if DRY_RUN:
            print("Prévia da renumeração:\n")
            print(f"{'ID':>5}  {'Módulo':<14} {'Grupo':<6} {'Atual':>10}  {'Novo':>10}")
            print("-" * 55)
            for (modulo, grupo), lista in sorted(grupos.items()):
                for seq, os_obj in enumerate(lista, start=1):
                    novo = f"OS-{seq:03d}"
                    marcador = "  " if os_obj.numero_os == novo else "→"
                    print(f"{os_obj.id:>5}  {modulo:<14} {grupo:<6} {os_obj.numero_os:>10}  {novo:>10} {marcador}")
            print("\n[DRY-RUN] Nenhuma alteração salva.")
            return

        resposta = input(f"Renumerar {len(todas_os)} OS e recriar constraint? (s/N): ").strip().lower()
        if resposta != 's':
            print("Operação cancelada.")
            return

        # FASE 1: renomear todas para temporários (garante zero conflito na fase 2)
        print("\nFase 1: nomes temporários...")
        for os_obj in todas_os:
            os_obj.numero_os = f"OS-T-{os_obj.id}"
        db.session.flush()

        # FASE 2: renumerar por grupo
        print("Fase 2: renumeração por grupo...")
        alteracoes = []
        for (modulo, grupo), lista in sorted(grupos.items()):
            for seq, os_obj in enumerate(lista, start=1):
                novo = f"OS-{seq:03d}"
                os_obj.numero_os = novo
                alteracoes.append((os_obj.id, modulo, grupo, novo))

        db.session.commit()
        print(f"✅ {len(alteracoes)} OS renumeradas.\n")

        # FASE 3: recriar constraint no SQLite
        print("Fase 3: atualizando UniqueConstraint no banco...")
        _recriar_constraint(db)
        print("✅ Constraint atualizada para (numero_os, modulo, grupo).\n")

        print("Resumo final:")
        print(f"{'ID':>5}  {'Módulo':<14} {'Grupo':<6} {'Número'}")
        print("-" * 45)
        for os_id, modulo, grupo, numero in sorted(alteracoes):
            print(f"{os_id:>5}  {modulo:<14} {grupo:<6} {numero}")

        print(f"\n✅ Migração concluída com sucesso!")


def _recriar_constraint(db):
    """
    No SQLite não existe ALTER TABLE DROP CONSTRAINT.
    Estratégia: recriar a tabela com a nova constraint.
    """
    from sqlalchemy import text

    with db.engine.connect() as conn:
        # Verificar se a constraint nova já existe inspecionando os índices
        resultado = conn.execute(text(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='ordens_servico'"
        )).fetchone()

        if resultado and '_numero_os_modulo_grupo_uc' in (resultado[0] or ''):
            print("  Constraint nova já existe, nada a fazer.")
            return

        conn.execute(text("PRAGMA foreign_keys = OFF"))

        # Criar tabela nova com a constraint correta
        conn.execute(text("""
            CREATE TABLE ordens_servico_new (
                id INTEGER NOT NULL PRIMARY KEY,
                numero_os VARCHAR(50) NOT NULL,
                detentora_id INTEGER REFERENCES detentoras(id),
                contrato VARCHAR(100),
                data_assinatura VARCHAR(100),
                prazo_vigencia VARCHAR(100),
                detentora VARCHAR(200),
                cnpj VARCHAR(20),
                servico VARCHAR(200),
                modulo VARCHAR(50) DEFAULT 'coffee',
                grupo VARCHAR(50),
                regiao_estoque INTEGER,
                evento VARCHAR(200),
                data VARCHAR(100),
                horario VARCHAR(50),
                local TEXT,
                justificativa TEXT,
                observacoes TEXT,
                trajeto_origem VARCHAR(200),
                trajeto_destino VARCHAR(200),
                trajeto_km VARCHAR(50),
                trajeto_tipo VARCHAR(20),
                qtd_pessoas_atendidas INTEGER,
                gestor_contrato VARCHAR(200),
                fiscal_contrato VARCHAR(200),
                fiscal_tipo VARCHAR(50) DEFAULT 'Fiscal do Contrato',
                responsavel VARCHAR(200),
                signatarios_json TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'emitida',
                data_emissao DATETIME,
                data_emissao_completa VARCHAR(50),
                motivo_exclusao TEXT,
                data_exclusao DATETIME,
                pagamento_vencimento VARCHAR(20),
                pagamento_pago BOOLEAN DEFAULT 0,
                CONSTRAINT _numero_os_modulo_grupo_uc UNIQUE (numero_os, modulo, grupo)
            )
        """))

        conn.execute(text("""
            INSERT INTO ordens_servico_new SELECT
                id, numero_os, detentora_id, contrato, data_assinatura, prazo_vigencia,
                detentora, cnpj, servico, modulo, grupo, regiao_estoque,
                evento, data, horario, local, justificativa, observacoes,
                trajeto_origem, trajeto_destino, trajeto_km, trajeto_tipo,
                qtd_pessoas_atendidas, gestor_contrato, fiscal_contrato, fiscal_tipo,
                responsavel, signatarios_json, status, data_emissao, data_emissao_completa,
                motivo_exclusao, data_exclusao, pagamento_vencimento, pagamento_pago
            FROM ordens_servico
        """))

        conn.execute(text("DROP TABLE ordens_servico"))
        conn.execute(text("ALTER TABLE ordens_servico_new RENAME TO ordens_servico"))

        # Recriar índice de status
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_ordens_servico_status ON ordens_servico (status)"
        ))

        conn.execute(text("PRAGMA foreign_keys = ON"))
        conn.commit()


if __name__ == '__main__':
    main()
