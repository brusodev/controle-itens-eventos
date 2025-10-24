# ========================================
# Script de Inicializacao do Projeto
# Controle de Itens de Eventos
# ========================================

Write-Host " " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Inicializando Projeto - Controle de Itens Eventos" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Verificar se Python esta instalado
Write-Host " " -ForegroundColor Yellow
Write-Host "[1/5] Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python nao encontrado! Instale Python 3.8+ e tente novamente." -ForegroundColor Red
    exit 1
}
Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green

# 2. Criar ambiente virtual (se nao existir)
Write-Host " " -ForegroundColor Yellow
Write-Host "[2/5] Configurando ambiente virtual..." -ForegroundColor Yellow
if (-Not (Test-Path ".\backend\venv")) {
    Write-Host "  Criando venv..." -ForegroundColor Cyan
    python -m venv ".\backend\venv"
    Write-Host "Ambiente virtual criado" -ForegroundColor Green
} else {
    Write-Host "Ambiente virtual ja existe" -ForegroundColor Green
}

# 3. Ativar ambiente virtual
Write-Host " " -ForegroundColor Yellow
Write-Host "[3/5] Ativando ambiente virtual..." -ForegroundColor Yellow
& ".\backend\venv\Scripts\Activate.ps1"
Write-Host "Ambiente virtual ativado" -ForegroundColor Green

# 4. Instalar dependencias
Write-Host " " -ForegroundColor Yellow
Write-Host "[4/5] Instalando dependencias..." -ForegroundColor Yellow
$requirementsPath = ".\backend\requirements.txt"
if (Test-Path $requirementsPath) {
    Set-Location '.\backend'
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    Write-Host "Dependencias instaladas com sucesso" -ForegroundColor Green
    Set-Location '..'
} else {
    Write-Host "Arquivo requirements.txt nao encontrado" -ForegroundColor Red
    exit 1
}

# 5. Inicializar banco de dados
Write-Host " " -ForegroundColor Yellow
Write-Host "[5/5] Inicializando banco de dados..." -ForegroundColor Yellow
Set-Location '.\backend'
python init_db.py
Set-Location '..'

# Resumo final
Write-Host " " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Inicializacao Concluida!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

Write-Host " " -ForegroundColor Cyan
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Criar usuario admin:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Yellow
Write-Host "     python criar_admin.py" -ForegroundColor Yellow
Write-Host "     cd .." -ForegroundColor Yellow
Write-Host " " -ForegroundColor White
Write-Host "  2. Para iniciar o servidor, execute:" -ForegroundColor White
Write-Host "     .\start.ps1" -ForegroundColor Yellow
Write-Host " " -ForegroundColor White
Write-Host "  3. Acesse a aplicacao em:" -ForegroundColor White
Write-Host "     http://127.0.0.1:5100" -ForegroundColor Yellow

Read-Host " Pressione Enter para sair"
