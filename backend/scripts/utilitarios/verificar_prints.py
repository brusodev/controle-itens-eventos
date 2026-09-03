#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Barra print()/console.log e emoji em log no codigo que roda em producao.

POR QUE ISTO EXISTE
O padrao "print() com emoji" derrubou tres coisas distintas neste projeto:
  1. backup_automatico.py crashava antes de gravar qualquer backup
  2. registrar_auditoria() derrubava a criacao de O.S. com HTTP 500
  3. um script de diagnostico, durante a propria investigacao

O console do Windows usa cp1252; qualquer caractere fora do charmap levanta
UnicodeEncodeError. Em script, mata o script. Dentro de uma rota Flask, mata
a REQUISICAO -- e o usuario ve um 500 sem explicacao.

REGRAS
  - emoji em print()/console.*: proibido em qualquer lugar
  - print() novo: proibido no runtime do servidor (routes/, app.py, models.py,
    pdf_generator.py, utils/auditoria.py, utils/controle_estoque.py)
  - console.log novo: proibido em static/js/
  - emoji em texto visivel ao usuario (alert, innerHTML, botoes): PERMITIDO --
    roda no navegador, onde nao ha cp1252

USO
    python scripts/utilitarios/verificar_prints.py            # tudo
    python scripts/utilitarios/verificar_prints.py a.py b.js  # arquivos dados
    python scripts/utilitarios/verificar_prints.py --staged   # o que esta no commit
    python scripts/utilitarios/verificar_prints.py --strict   # inclui scripts/testes

Saida: 0 = limpo, 1 = violacoes encontradas.
"""
import ast
import io
import os
import re
import subprocess
import sys
import unicodedata

ESTRITO = False

BACKEND = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

IGNORA_DIR = {'.venv', '__pycache__', '.pytest_cache', 'instance', 'node_modules', '.git'}

# Modulos carregados pelo servidor Flask: um print aqui polui o log e, com
# emoji, derruba a requisicao.
RUNTIME = (
    'backend/routes/',
    'backend/app.py',
    'backend/models.py',
    'backend/models_usuario.py',
    'backend/pdf_generator.py',
    'backend/extensions.py',
    'backend/utils/auditoria.py',
    'backend/utils/controle_estoque.py',
)

# Arquivos historicos: nao valem uma falha de commit.
ISENTOS = ('_backup', '_old')

# Divida historica: scripts CLI, migracoes e testes tem centenas de print()
# com emoji. Eles rodam a mao e so quebram a si mesmos, entao por padrao o
# verificador nao os barra -- um hook que falha sempre e um hook ignorado.
# Rode com --strict para ve-los e limpa-los aos poucos.
LEGADO = (
    'backend/scripts/',
    'backend/migrations/',
    'backend/tests/',
    'backend/utils/atualizar_os_dados.py',
    'backend/utils/check_database.py',
    'backend/utils/verificar_os_banco.py',
    'backend/init_db.py',
    'backend/migrate_producao.py',
)

RE_CONSOLE_LOG = re.compile(r'\bconsole\.log\s*\(')
RE_CONSOLE_QUALQUER = re.compile(r'\bconsole\.(log|error|warn|info|debug)\s*\(')


def eh_emoji(ch):
    o = ord(ch)
    if o < 0x2000:
        return False
    return unicodedata.category(ch) in ('So', 'Sk') or o >= 0x1F000


def normalizar(caminho):
    """Caminho relativo a raiz do repo, com barras normais."""
    rel = os.path.relpath(os.path.abspath(caminho), os.path.dirname(BACKEND))
    return rel.replace(os.sep, '/')


def eh_runtime(rel):
    return any(rel.startswith(p) for p in RUNTIME)


def isento(rel):
    return any(marca in rel for marca in ISENTOS)


def checar_python(caminho, rel):
    """
    Usa AST: 'blueprint' contem a substring 'print', e um grep ingenuo
    acusa falso positivo em toda linha de registro de blueprint.
    """
    problemas = []
    try:
        fonte = io.open(caminho, encoding='utf-8').read()
        arvore = ast.parse(fonte)
    except (SyntaxError, UnicodeDecodeError, OSError):
        return problemas

    runtime = eh_runtime(rel)

    for node in ast.walk(arvore):
        if not (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == 'print'):
            continue

        literais = ''.join(
            sub.value for sub in ast.walk(node)
            if isinstance(sub, ast.Constant) and isinstance(sub.value, str)
        )
        if any(eh_emoji(c) for c in literais):
            problemas.append((node.lineno, 'print() com emoji: crasha sob cp1252'))
        elif runtime:
            problemas.append((node.lineno,
                              'print() em codigo do servidor: use logger.debug/info/warning'))

    # traceback.print_exc() escreve direto em stderr, mesmo risco
    if runtime:
        for node in ast.walk(arvore):
            if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                    and node.func.attr == 'print_exc'):
                problemas.append((node.lineno,
                                  'traceback.print_exc(): use logger.exception'))
    return problemas


def checar_js(caminho, rel):
    problemas = []
    try:
        linhas = io.open(caminho, encoding='utf-8', errors='replace').read().split('\n')
    except OSError:
        return problemas

    for n, linha in enumerate(linhas, 1):
        sem_espaco = linha.lstrip()
        if sem_espaco.startswith('//') or sem_espaco.startswith('*'):
            continue
        if RE_CONSOLE_QUALQUER.search(linha) and any(eh_emoji(c) for c in linha):
            problemas.append((n, 'console.* com emoji no log'))
        elif RE_CONSOLE_LOG.search(linha):
            # a definicao de debugLog() precisa chamar console.log
            if 'DEBUG_ATIVO' in linha:
                continue
            problemas.append((n, 'console.log esquecido: remova ou use debugLog()'))
    return problemas


def coletar_tudo():
    alvos = []
    for base, dirs, arquivos in os.walk(BACKEND):
        dirs[:] = [d for d in dirs if d not in IGNORA_DIR]
        for nome in arquivos:
            if nome.endswith('.py') or nome.endswith('.js'):
                alvos.append(os.path.join(base, nome))
    return alvos


def coletar_staged():
    try:
        saida = subprocess.check_output(
            ['git', 'diff', '--cached', '--name-only', '--diff-filter=ACM'],
            cwd=os.path.dirname(BACKEND), text=True, stderr=subprocess.DEVNULL)
    except (subprocess.CalledProcessError, OSError):
        return []
    raiz = os.path.dirname(BACKEND)
    return [os.path.join(raiz, l.strip()) for l in saida.split('\n')
            if l.strip().endswith(('.py', '.js'))]


def main():
    global ESTRITO
    ESTRITO = '--strict' in sys.argv[1:]
    args = [a for a in sys.argv[1:] if a not in ('--staged', '--strict')]
    if '--staged' in sys.argv[1:]:
        alvos = coletar_staged()
    elif args:
        alvos = args
    else:
        alvos = coletar_tudo()

    total = 0
    for caminho in alvos:
        if not os.path.isfile(caminho):
            continue
        rel = normalizar(caminho)
        if isento(rel) or any('/%s/' % d in rel for d in IGNORA_DIR):
            continue
        if not ESTRITO and any(rel.startswith(p) for p in LEGADO):
            continue

        if caminho.endswith('.py'):
            # tests/ e scripts/ so sao barrados por emoji, nao por print()
            problemas = checar_python(caminho, rel)
        elif caminho.endswith('.js'):
            problemas = checar_js(caminho, rel)
        else:
            continue

        for linha, motivo in problemas:
            print('%s:%d: %s' % (rel, linha, motivo))
            total += 1

    if total:
        print('')
        print('%d violacao(oes). Corrija ou use "git commit --no-verify" se for intencional.' % total)
        print('Detalhes: backend/scripts/utilitarios/verificar_prints.py')
        return 1

    escopo = 'todo o projeto' if ESTRITO else 'codigo de execucao'
    print('[OK] Nenhum print/console problematico em %s.' % escopo)
    if not ESTRITO:
        print('     (--strict inclui scripts CLI, migracoes e testes)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
