# Script Build APK SakuPintar
# Otomatis load API Key, Build Web, Sync Capacitor, dan Build Android APK

$ErrorActionPreference = "Stop"

Write-Host "Memulai proses Build APK..." -ForegroundColor Cyan

# 1. Setup Environment Variables
$env:ANDROID_HOME = "C:\AndroidSDK"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# 2. Cari dan Load API Key dari .env atau .env.local
$apiKey = $null
$envFiles = @(".env.local", ".env")

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "Membaca $file..." -ForegroundColor Gray
        $lines = Get-Content $file
        foreach ($line in $lines) {
            if ($line -match "^GEMINI_API_KEY=(.+)$") {
                $apiKey = $matches[1].Trim()
                break
            }
        }
    }
    if ($apiKey) { break }
}

if (-not $apiKey) {
    Write-Error "Gagal menemukan GEMINI_API_KEY di file .env atau .env.local"
    exit 1
}

# Set variable untuk sesi ini (agar terbaca oleh Vite)
$env:GEMINI_API_KEY = $apiKey
$env:VITE_API_KEY = $apiKey
Write-Host "API Key ditemukan dan di-load ke environment." -ForegroundColor Green

# 3. Build Web App
Write-Host "Building Web App (Vite)..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# 4. Sync Capacitor
Write-Host "Syncing ke Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

# 5. Build APK via Gradle
Write-Host "Building APK (Gradle)..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

# 6. Selesai
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "`nBUILD SUKSES!" -ForegroundColor Green
Write-Host "Lokasi APK: $PWD\$apkPath" -ForegroundColor White
Write-Host "Silakan copy file APK tersebut ke HP Anda."
