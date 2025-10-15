from flask import Blueprint, render_template

views_bp = Blueprint('views', __name__)

@views_bp.route('/')
def index():
    """Página principal do sistema"""
    return render_template('index.html')

@views_bp.route('/importar-os')
def importar_os():
    """Página de importação de O.S. antigas"""
    return render_template('importar-os-antigas.html')
