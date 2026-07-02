# deploy.ps1 — نشر التغييرات بنقرة واحدة
$projectPath = if ($PSScriptRoot -and $PSScriptRoot -ne "") { $PSScriptRoot } else { "C:\aqeeli\webapp" }
Set-Location $projectPath

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$defaultMsg = "update: $timestamp"

$msg = Read-Host "رسالة الـ commit (اضغط Enter للتخطي)"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = $defaultMsg }

git add -A
git commit -m $msg
git push origin main

Write-Host ""
Write-Host "✅ تم النشر بنجاح!" -ForegroundColor Green
Write-Host "🌐 https://aqeeli-feasibility.pages.dev" -ForegroundColor Cyan
pause
