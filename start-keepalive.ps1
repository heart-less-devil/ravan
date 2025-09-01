# BioPing Auto Keepalive System - PowerShell Version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    BioPing Auto Keepalive System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will keep your website alive by:" -ForegroundColor Yellow
Write-Host "• Visiting your website every 4 minutes" -ForegroundColor White
Write-Host "• Simulating user activity" -ForegroundColor White
Write-Host "• Preventing Render from sleeping" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to start..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🚀 Starting keepalive system..." -ForegroundColor Green
Write-Host "📍 Website: https://biopingweb.netlify.app" -ForegroundColor White
Write-Host "⏰ Interval: Every 4 minutes" -ForegroundColor White
Write-Host "📝 Logs will be saved to: keepalive.log" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the system" -ForegroundColor Red
Write-Host ""

try {
    # Check if Node.js is installed
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Start the keepalive script
    node simple-keepalive.js
    
} catch {
    Write-Host "❌ Error starting keepalive system: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "Keepalive system stopped." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}
