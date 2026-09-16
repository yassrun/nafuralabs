# Sandbox - back (H2 :8082) + front (sandbox web :4300).
#
# Usage (PowerShell) :
#   .\sandbox-up.ps1           # start back + front (front foreground)
#   .\sandbox-up.ps1 stop      # stop ports 8082 and 4300
#   .\sandbox-up.ps1 back      # back only
#   .\sandbox-up.ps1 status    # port health
#
# Bash twin: .\sandbox-up.sh (Git Bash / WSL / Linux).
# On this machine: do NOT use Gradle (plugin proxy 407).
# Back = offline java (build/offline-classes + offline-classpath.txt).

param(
  [ValidateSet('up', 'start', 'back', 'stop', 'status')]
  [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$App = Join-Path $Root 'sources\backend'
$Web = Join-Path $Root 'sources\web'
$BackPort = 8082
$FrontPort = 4300
$HealthUrl = "http://127.0.0.1:$BackPort/actuator/health"
$FrontUrl = "http://127.0.0.1:$FrontPort"
$PidFile = Join-Path $App 'build\sandbox-backend.pid'
$LogFile = Join-Path $App 'build\sandbox-backend.log'
$MainClass = 'ma.nafura.sandbox.bootstrap.SandboxApplication'

function Die([string]$Message) {
  Write-Error $Message
  exit 1
}

function Get-PortPids([int]$Port) {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
}

function Stop-Port([int]$Port) {
  $pids = @(Get-PortPids $Port)
  if ($pids.Count -eq 0) { return }
  Write-Host ("-> stop :{0} (pids: {1})" -f $Port, ($pids -join ' '))
  foreach ($procId in $pids) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
  foreach ($procId in @(Get-PortPids $Port)) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}

function Test-BackHealth {
  try {
    $r = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-BackHealth {
  for ($i = 0; $i -lt 40; $i++) {
    if (Test-BackHealth) {
      Write-Host ("OK back UP  {0}" -f $HealthUrl)
      return
    }
    Start-Sleep -Milliseconds 500
  }
  Die ("back not UP after ~20s - see {0}" -f $LogFile)
}

function Require-Offline {
  $classes = Join-Path $App 'build\offline-classes'
  $cpFile = Join-Path $App 'build\offline-classpath.txt'
  if (-not (Test-Path $classes)) { Die ("missing {0} (run offline build once)" -f $classes) }
  if (-not (Test-Path $cpFile)) { Die ("missing {0}" -f $cpFile) }
  if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Die 'java not found in PATH' }
}

function Start-Back {
  Require-Offline
  New-Item -ItemType Directory -Force -Path (Join-Path $App 'build') | Out-Null
  Stop-Port $BackPort

  $classes = Join-Path $App 'build\offline-classes'
  $cpFile = Join-Path $App 'build\offline-classpath.txt'
  $cp = (Get-Content $cpFile -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($cp)) { Die 'offline-classpath.txt empty' }
  $cp = "$classes;$cp"

  Write-Host ("-> start back (java offline) cwd={0}" -f $App)
  # Avoid RedirectStandard* to same file (Windows). Log via cmd redirection.
  $arg = "/c java -cp `"$cp`" $MainClass > `"$LogFile`" 2>&1"
  $proc = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList $arg `
    -WorkingDirectory $App `
    -WindowStyle Hidden `
    -PassThru
  Set-Content -Path $PidFile -Value $proc.Id -Encoding ascii
  Wait-BackHealth
}

function Start-Front {
  if (-not (Test-Path $Web)) { Die ("missing {0}" -f $Web) }
  if (-not (Test-Path (Join-Path $Web 'node_modules'))) {
    Die ("missing node_modules - cd {0} ; npm install --legacy-peer-deps" -f $Web)
  }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Die 'npm not found in PATH' }

  Stop-Port $FrontPort
  Write-Host ("-> start front  {0}" -f $FrontUrl)
  Write-Host '   Ctrl+C stops the front; back stays up (.\sandbox-up.ps1 stop to kill both)'
  Set-Location $Web
  npm start
}

function Show-Status {
  if (Test-BackHealth) {
    Write-Host ("back  : UP   {0}" -f $HealthUrl)
  } else {
    Write-Host ("back  : DOWN {0}" -f $HealthUrl)
  }
  $fp = @(Get-PortPids $FrontPort)
  if ($fp.Count -gt 0) {
    Write-Host ("front : UP   {0}  (pids: {1})" -f $FrontUrl, ($fp -join ' '))
  } else {
    Write-Host ("front : DOWN {0}" -f $FrontUrl)
  }
}

function Stop-Sandbox {
  Stop-Port $FrontPort
  Stop-Port $BackPort
  Remove-Item -Force -ErrorAction SilentlyContinue $PidFile
  Write-Host 'OK sandbox stopped'
}

switch ($Command) {
  { $_ -in @('up', 'start') } {
    Start-Back
    Start-Front
  }
  'back' {
    Start-Back
    Write-Host ("logs: {0}" -f $LogFile)
  }
  'stop' { Stop-Sandbox }
  'status' { Show-Status }
}
