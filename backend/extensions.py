"""
extensions.py — instâncias de extensões Flask compartilhadas entre blueprints.
Importar aqui evita circular imports: o blueprint importa a extensão,
não o app, quebrando dependências circulares.
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    get_remote_address,
    default_limits=[],
    storage_uri='memory://',
)
