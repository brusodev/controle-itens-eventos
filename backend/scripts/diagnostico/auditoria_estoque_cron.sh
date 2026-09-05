#!/usr/bin/env bash
#
# Auditoria periodica da integridade do estoque (Guarda D).
#
# Roda reconciliar_estoque.py em modo --check (read-only, nao grava nada) e
# registra o resultado. Sai com codigo != 0 se houver sinal critico -- assim o
# cron (com MAILTO) ou o monitoramento dispara o alerta automaticamente.
#
# Detecta cedo a volta do "saldo fantasma": drift de cache, SAIDA repetida
# (rastro do bug de reversao), O.S. cancelada com saldo preso, valor invalido.
#
# INSTALAR NO CRON (usuario ubuntu), auditoria diaria as 06:00:
#   MAILTO="voce@exemplo.com"
#   0 6 * * * /var/www/controle-itens-eventos/backend/scripts/diagnostico/auditoria_estoque_cron.sh
#
set -u

BACKEND_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="${BACKEND_DIR}/instance/reconciliacao/auditoria"
mkdir -p "${LOG_DIR}"

# Usa o python do venv do projeto se existir; senao, o do sistema.
if [ -x "${BACKEND_DIR}/venv/bin/python3" ]; then
    PY="${BACKEND_DIR}/venv/bin/python3"
else
    PY="$(command -v python3)"
fi

TS="$(date +%Y%m%d_%H%M%S)"
LOG="${LOG_DIR}/auditoria_${TS}.log"

"${PY}" "${BACKEND_DIR}/scripts/diagnostico/reconciliar_estoque.py" --check \
    > "${LOG}" 2>&1
CODE=$?

# Mantem apenas os ultimos 30 relatorios.
ls -1t "${LOG_DIR}"/auditoria_*.log 2>/dev/null | tail -n +31 | xargs -r rm -f

if [ "${CODE}" -ne 0 ]; then
    # Ecoa para stdout: o cron envia por e-mail (MAILTO) e o monitoramento pega.
    echo "[ALERTA] Auditoria de estoque encontrou problema (codigo ${CODE})."
    echo "Log: ${LOG}"
    echo "-----"
    cat "${LOG}"
fi

exit "${CODE}"
