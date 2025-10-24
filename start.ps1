# Script para Iniciar o Servidor
# Controle de Itens de Eventos

Write-Host " " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Servidor Flask" -ForegroundColor Cyan
Write-Host "Controle de Itens de Eventos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " " -ForegroundColor Cyan

# Verificar se venv existe
if (-Not (Test-Path ".\backend\venv")) {
    Write-Host "Ambiente virtual nao encontrado!" -ForegroundColor Red
    Write-Host "Execute .\init.ps1 primeiro" -ForegroundColor Yellow
    exit 1
}

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
& ".\backend\venv\Scripts\Activate.ps1"

# Iniciar servidor
Write-Host " " -ForegroundColor Green
Write-Host "Iniciando servidor Flask..." -ForegroundColor Green
Write-Host "Acesse: http://127.0.0.1:5100" -ForegroundColor Cyan
Write-Host "Login: use suas credenciais" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host " " -ForegroundColor Cyan

Set-Location '.\backend'
python app.py
