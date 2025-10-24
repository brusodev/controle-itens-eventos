# ========================================
# Script para Limpar Ambiente
# Controle de Itens de Eventos
# ========================================

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      Limpando Ambiente - Controle de Itens Eventos   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$confirmacao = Read-Host "`nIsso irá remover o ambiente virtual e dados temporários. Deseja continuar? (S/N)"

if ($confirmacao -eq "S" -or $confirmacao -eq "s") {
    Write-Host "`nLimpando..." -ForegroundColor Yellow
    
    # Remover venv
    if (Test-Path ".\backend\venv") {
        Remove-Item ".\backend\venv" -Recurse -Force
        Write-Host "✅ Ambiente virtual removido" -ForegroundColor Green
    }
    
    # Remover banco de dados
    if (Test-Path ".\backend\instance\controle_itens.db") {
        Remove-Item ".\backend\instance\controle_itens.db" -Force
        Write-Host "✅ Banco de dados removido" -ForegroundColor Green
    }
    
    # Remover cache
    if (Test-Path ".\backend\__pycache__") {
        Remove-Item ".\backend\__pycache__" -Recurse -Force
        Write-Host "✅ Cache removido" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
    Write-Host "Você pode executar init.ps1 novamente para reinicializar o projeto" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Operação cancelada" -ForegroundColor Red
}

Read-Host "`nPressione Enter para sair"
