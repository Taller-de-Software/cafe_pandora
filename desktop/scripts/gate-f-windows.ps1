<#
GATE F — Café Pandora POS en Windows
=====================================
Ejecuta y verifica el flujo real de build en una máquina Windows limpia:
  pnpm install -> prisma generate (engines PE) -> load-test addons -> pnpm dist

Uso (PowerShell 5.1+ o 7, desde cualquier carpeta):
  powershell -ExecutionPolicy Bypass -File desktop/scripts/gate-f-windows.ps1

Cada etapa escribe en desktop\gate-f.log y muestra su estado por consola.
Al final deja un resumen de lo automático y de los pasos manuales que
solo una máquina Windows real puede validar (instalador, UI, hardware,
firewall, SmartScreen).
#>

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop    = Split-Path -Parent $scriptDir
$root       = Split-Path -Parent $desktop
$frontend   = Join-Path $root 'frontend'
$backend    = Join-Path $root 'backend'
$logFile    = Join-Path $desktop 'gate-f.log'

Start-Transcript -Path $logFile -Force

function Write-Step {
  param([string]$Msg)
  Write-Host ''
  Write-Host "===== $Msg =====" -ForegroundColor Cyan
}

function Write-Result {
  param([string]$Name, [bool]$Ok, [string]$Extra = '')
  if ($Ok) {
    Write-Host "[OK]   $Name" -ForegroundColor Green
  } else {
    Write-Host "[FAIL] $Name $Extra" -ForegroundColor Red
  }
}

function Assert-True {
  param([bool]$Cond, [string]$Msg)
  if (-not $Cond) {
    Write-Host "ABORTADO: $Msg" -ForegroundColor Red
    Stop-Transcript
    exit 1
  }
}

# ---------------------------------------------------------------------------
# F0 — Pre-checks de herramientas
# ---------------------------------------------------------------------------
Write-Step 'F0 - Pre-checks (Node / pnpm / git)'

$nodeRaw  = & node -v 2>$null
Assert-True ($LASTEXITCODE -eq 0) 'No se encontró Node.js. Instala Node.js 20 LTS o superior desde https://nodejs.org'
Write-Host "node: $nodeRaw"
$nodeMajor = [int](($nodeRaw -replace 'v','') -split '\.')[0]
Assert-True ($nodeMajor -ge 20) "Node $nodeMajor detectado; se requiere 20 o superior."

$pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCmd) {
  Write-Host 'No se encontró pnpm. Actívalo con "corepack enable" o instálalo con "npm install -g pnpm@11".' -ForegroundColor Yellow
  Write-Host 'Ejecuta el paso y vuelve a correr este script.' -ForegroundColor Yellow
  Stop-Transcript
  exit 1
}
$pnpmRaw = & pnpm -v
Write-Host "pnpm: $pnpmRaw"

$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) { Write-Host "git: $(& git --version)" } else { Write-Host 'git no encontrado (opcional si clonaste el repo de otra forma).' -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# F1 — Limpieza previa (reproducibilidad por plataforma)
# ---------------------------------------------------------------------------
Write-Step 'F1 - Limpieza previa (node_modules y lockfile de desktop)'

foreach ($dir in @( (Join-Path $desktop 'node_modules'), (Join-Path $frontend 'node_modules') )) {
  if (Test-Path $dir) {
    Write-Host "borrando $dir"
    Remove-Item -Recurse -Force $dir
  }
}
$desktopLock = Join-Path $desktop 'pnpm-lock.yaml'
if (Test-Path $desktopLock) {
  Write-Host "borrando $desktopLock (lockfile es por plataforma)"
  Remove-Item -Force $desktopLock
}

# ---------------------------------------------------------------------------
# F2 — Instalación
# ---------------------------------------------------------------------------
Write-Step 'F2 - pnpm install'

Push-Location $desktop
try {
  & pnpm install
  Assert-True ($LASTEXITCODE -eq 0) 'pnpm install falló en desktop.'
} finally {
  Pop-Location
}

Push-Location $frontend
try {
  & pnpm install
  Assert-True ($LASTEXITCODE -eq 0) 'pnpm install falló en frontend.'
} finally {
  Pop-Location
}

# ---------------------------------------------------------------------------
# F3 — Guardrail: engines de Prisma nativos de Windows
# ---------------------------------------------------------------------------
Write-Step 'F3 - Guardrail de engines Prisma (PE nativo)'

Push-Location $desktop
try {
  & pnpm prisma:generate
  Assert-True ($LASTEXITCODE -eq 0) 'prisma generate falló.'
} finally {
  Pop-Location
}

$queryEngine   = Join-Path $backend 'generated\prisma\query_engine-windows.dll.node'
$schemaEngine  = Join-Path $desktop 'node_modules\@prisma\engines\schema-engine-windows.exe'

$qeOk  = Test-Path $queryEngine
$seOk  = Test-Path $schemaEngine
Write-Result "query_engine-windows.dll.node en backend\generated\prisma" $qeOk
Write-Result "schema-engine-windows.exe en node_modules\@prisma\engines" $seOk
Assert-True ($qeOk -and $seOk) 'Faltan engines de Windows. Si aparecen engines de otra plataforma, hay un bug real en la config de Prisma: repórtalo en vez de parchearlo.'

# ---------------------------------------------------------------------------
# F4 — Load-test de los 3 addons N-API (informativo, no bloquea)
# ---------------------------------------------------------------------------
Write-Step 'F4 - Load-test addons nativos (usb / node-printer / inkpresser)'

$env:ELECTRON_RUN_AS_NODE = '1'
$electron = Join-Path $desktop 'node_modules\.bin\electron.cmd'
$js = @'
const mods = ['usb', '@ssxv/node-printer', '@plantae-tech/inkpresser'];
for (const m of mods) {
  try { require(m); console.log('OK   ' + m); }
  catch (e) { console.log('FAIL ' + m + ': ' + e.message); }
}
'@
& $electron -e $js
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# ---------------------------------------------------------------------------
# F5 — Build del instalador
# ---------------------------------------------------------------------------
Write-Step 'F5 - pnpm dist (electron-builder --win nsis)'

Push-Location $desktop
try {
  & pnpm dist
  Assert-True ($LASTEXITCODE -eq 0) 'pnpm dist falló.'
} finally {
  Pop-Location
}

$exe = Get-ChildItem (Join-Path $desktop 'release') -Filter '*.exe' -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'Setup' }
Write-Result 'Instalador NSIS generado (release\Cafe Pandora Setup 1.0.0.exe)' ($exe -ne $null)

# ---------------------------------------------------------------------------
# F6 — Resumen y pasos manuales (solo máquina Windows real)
# ---------------------------------------------------------------------------
Write-Step 'F6 - Resultado y pasos manuales pendientes'

Write-Host ''
Write-Host 'PENDIENTE - validar manualmente en la máquina Windows real:' -ForegroundColor Yellow
Write-Host '  1) Instalar:  release\Cafe Pandora Setup 1.0.0.exe  (asistente NSIS, eligiendo carpeta).' -ForegroundColor Yellow
Write-Host '  2) SmartScreen: "Más información > Ejecutar de todas formas" (el instalador no está firmado).' -ForegroundColor Yellow
Write-Host '  3) Abrir "Cafe Pandora". En %APPDATA%\cafe-pandora-desktop\logs\main.log debe aparecer:' -ForegroundColor Yellow
Write-Host '       [backend] listo en http://127.0.0.1:3001' -ForegroundColor Yellow
Write-Host '  4) Verificar API:  curl http://127.0.0.1:3001/api/health   ->  {"status":"ok"}' -ForegroundColor Yellow
Write-Host '  5) Login/UI: crear el usuario admin si no existe y entrar al POS.' -ForegroundColor Yellow
Write-Host '  6) LAN: desde otro equipo, abrir http://IP-de-la-PC:3001 (regla de firewall "Cafe Pandora").' -ForegroundColor Yellow
Write-Host '  7) Hardware: probar impresora y lector USB (los addons los valida el paso F4).' -ForegroundColor Yellow
Write-Host '  8) Verificar hook de instancia:  tasklist /FO CSV /NH | findstr /B /I /C:"\"Cafe Pandora.exe\""' -ForegroundColor Yellow
Write-Host ''
Write-Host "Log completo en $logFile" -ForegroundColor DarkGray

Stop-Transcript
