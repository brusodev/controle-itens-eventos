"""
Testes de regressão: visibilidade dos modais do portal da detentora.

Problema capturado:
    O modal de aceite/assinatura não aparecia ao clicar "✅ Aceitar" porque
    o CSS .modal-overlay tinha z-index:1000, abaixo do .sidebar (z-index:2000)
    e do .topbar (z-index:2001), causando o modal ficar coberto pelo layout.

Esses testes verificam:
  1. Análise estática — hierarquia de z-index no CSS
  2. Análise estática — função abrirModal define z-index suficientemente alto
  3. Análise estática — nenhum modal-overlay depende só do CSS (usa inline z-index)
"""
import re
import os
import pytest

# Caminhos dos arquivos
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_LAYOUT   = os.path.join(BASE, 'static', 'css', 'layout.css')
CSS_PORTAL   = os.path.join(BASE, 'static', 'css', 'portal-empresa.css')
JS_PORTAL    = os.path.join(BASE, 'static', 'js', 'portal-empresa.js')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extrair_zindex(css_text, seletor):
    """
    Retorna o valor inteiro de z-index para o primeiro bloco que corresponde
    ao seletor. Lança AssertionError se não encontrar.
    """
    # Captura o bloco { ... } após o seletor
    pattern = re.escape(seletor) + r'\s*\{([^}]+)\}'
    match = re.search(pattern, css_text, re.DOTALL)
    assert match, f"Seletor '{seletor}' não encontrado no CSS"
    bloco = match.group(1)
    zi_match = re.search(r'z-index\s*:\s*(\d+)', bloco)
    assert zi_match, f"z-index não encontrado no bloco de '{seletor}'"
    return int(zi_match.group(1))


def ler_arquivo(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


# ---------------------------------------------------------------------------
# 1. Hierarquia de z-index no CSS do layout
# ---------------------------------------------------------------------------

class TestZIndexLayoutHierarquia:
    """
    Garante que a hierarquia de z-index do layout.css não regride.
    Qualquer overlay/modal DEVE superar sidebar + topbar.
    """

    def test_sidebar_zindex_conhecida(self):
        css = ler_arquivo(CSS_LAYOUT)
        zi = extrair_zindex(css, '.sidebar')
        # Documentar o valor atual — se mudar, o teste alerta
        assert zi == 2000, (
            f"z-index do .sidebar mudou para {zi}. "
            "Revise todos os modais para garantir que sobrepõem o sidebar."
        )

    def test_topbar_zindex_conhecida(self):
        css = ler_arquivo(CSS_LAYOUT)
        zi = extrair_zindex(css, '.topbar')
        assert zi == 1000, (
            f"z-index do .topbar mudou para {zi}. "
            "Revise todos os modais para garantir que sobrepõem o topbar."
        )

    def test_sidebar_toggle_zindex_conhecida(self):
        """O botão toggle da sidebar tem z-index próprio (2001)."""
        css = ler_arquivo(CSS_LAYOUT)
        zi = extrair_zindex(css, '.sidebar-toggle')
        assert zi == 2001, (
            f"z-index do .sidebar-toggle mudou para {zi}."
        )


# ---------------------------------------------------------------------------
# 2. CSS do portal — modal-overlay deve superar sidebar
# ---------------------------------------------------------------------------

class TestModalOverlayZIndex:
    """
    Verifica que o seletor .modal-overlay no portal-empresa.css
    tem z-index maior que o maior valor do layout (2001).
    """

    MINIMO_ACEITAVEL = 2001  # Deve superar sidebar-toggle

    def test_modal_overlay_css_supera_layout(self):
        css = ler_arquivo(CSS_PORTAL)
        zi = extrair_zindex(css, '.modal-overlay')
        assert zi > self.MINIMO_ACEITAVEL, (
            f"REGRESSÃO DETECTADA: .modal-overlay tem z-index={zi}, "
            f"mas o layout usa z-index até {self.MINIMO_ACEITAVEL}. "
            "O modal ficará coberto pelo sidebar/topbar. "
            f"Aumente para pelo menos {self.MINIMO_ACEITAVEL + 1}."
        )

    def test_modal_overlay_css_nao_inferior_a_3000(self):
        """
        Margem de segurança: z-index >= 3000 para suportar futuros
        componentes do layout sem precisar rever modais.
        """
        css = ler_arquivo(CSS_PORTAL)
        zi = extrair_zindex(css, '.modal-overlay')
        assert zi >= 3000, (
            f"z-index do .modal-overlay é {zi}. "
            "Recomendado >= 3000 como margem de segurança."
        )


# ---------------------------------------------------------------------------
# 3. Função abrirModal no JS — deve forçar z-index via inline style
# ---------------------------------------------------------------------------

class TestAbrirModalJS:
    """
    A função abrirModal() deve aplicar z-index alto via inline style,
    não dependendo apenas da classe CSS (que pode ser sobrescrita pelo layout).
    """

    def test_abrirmodal_define_zindex_inline(self):
        js = ler_arquivo(JS_PORTAL)
        # Procurar a função abrirModal
        match = re.search(r'function abrirModal\s*\([^)]*\)\s*\{(.+?)^\}', js,
                          re.DOTALL | re.MULTILINE)
        assert match, "Função abrirModal não encontrada em portal-empresa.js"
        corpo = match.group(1)
        assert 'z-index' in corpo, (
            "REGRESSÃO: abrirModal() não define z-index inline. "
            "O modal pode ficar coberto pelo layout se o CSS for sobrescrito."
        )

    def test_abrirmodal_zindex_valor_alto(self):
        js = ler_arquivo(JS_PORTAL)
        match = re.search(r'function abrirModal\s*\([^)]*\)\s*\{(.+?)^\}', js,
                          re.DOTALL | re.MULTILINE)
        assert match, "Função abrirModal não encontrada em portal-empresa.js"
        corpo = match.group(1)
        # Extrair o valor numérico de z-index mencionado na função
        zi_match = re.search(r'z-index\s*[:\s]+(\d+)', corpo)
        assert zi_match, "z-index sem valor numérico encontrado em abrirModal()"
        zi = int(zi_match.group(1))
        assert zi >= 9000, (
            f"REGRESSÃO: abrirModal() usa z-index={zi}. "
            "Deve ser >= 9000 para garantir que supera qualquer elemento do layout."
        )

    def test_abrirmodal_usa_position_fixed(self):
        js = ler_arquivo(JS_PORTAL)
        match = re.search(r'function abrirModal\s*\([^)]*\)\s*\{(.+?)^\}', js,
                          re.DOTALL | re.MULTILINE)
        assert match, "Função abrirModal não encontrada em portal-empresa.js"
        corpo = match.group(1)
        assert 'position' in corpo and 'fixed' in corpo, (
            "REGRESSÃO: abrirModal() não força position:fixed via inline style. "
            "O modal pode não aparecer se a classe CSS for sobrescrita."
        )

    def test_fecharmodal_existe(self):
        js = ler_arquivo(JS_PORTAL)
        assert 'function fecharModal' in js, \
            "Função fecharModal não encontrada em portal-empresa.js"

    def test_abrir_modal_aceitar_limpa_campos(self):
        """
        _abrirModalAceitar() deve existir e limpar os campos do modal antes de abrir
        (nome, cargo, checkbox) para não reutilizar dados do aceite anterior.
        """
        js = ler_arquivo(JS_PORTAL)
        assert '_abrirModalAceitar' in js, \
            "Função _abrirModalAceitar não encontrada."
        match = re.search(r'function _abrirModalAceitar\s*\(\s*\)\s*\{(.+?)^\}', js,
                          re.DOTALL | re.MULTILINE)
        assert match, "Corpo de _abrirModalAceitar não encontrado"
        corpo = match.group(1)
        assert 'aceitar-nome' in corpo, \
            "REGRESSÃO: _abrirModalAceitar() não limpa o campo de nome."

# ---------------------------------------------------------------------------
# 4. Conflito entre arquivos CSS — nenhum outro seletor de modal com z-index baixo
# ---------------------------------------------------------------------------

class TestConflitoCSSArquivos:
    """
    Verifica que não existe definição duplicada/conflitante de .modal-overlay
    com z-index baixo em outro arquivo CSS que poderia sobrescrever o portal.
    """

    def test_styles_css_nao_define_modal_overlay_com_zindex_baixo(self):
        css_styles = os.path.join(BASE, 'static', 'css', 'styles.css')
        if not os.path.exists(css_styles):
            pytest.skip("styles.css não encontrado")
        css = ler_arquivo(css_styles)
        if '.modal-overlay' not in css:
            return  # Sem conflito
        # Se definir, deve ter z-index alto também
        zi = extrair_zindex(css, '.modal-overlay')
        assert zi >= 3000, (
            f"styles.css define .modal-overlay com z-index={zi} "
            "que pode sobrescrever o portal-empresa.css dependendo da ordem de import."
        )
