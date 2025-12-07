# Run ngrok on port 3000
$ngrokPath = "$env:USERPROFILE\AppData\Roaming\npm\node_modules\ngrok\bin\ngrok.exe"

if (Test-Path $ngrokPath) {
    Write-Host "Starting ngrok on port 3000..." -ForegroundColor Green
    & $ngrokPath http 3000
} else {
    Write-Host "ngrok not found. Trying npx..." -ForegroundColor Yellow
    npx --yes ngrok@latest http 3000
}

