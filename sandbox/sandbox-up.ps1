# Sandbox - back (H2 :8082) + front (sandbox web :4300).
#
# Usage (PowerShell) :
#   .\sandbox-up.ps1           # start back + front (front foreground)
#   .\sandbox-up.ps1 stop      # stop ports 8082 and 4300
#   .\sandbox-up.ps1 back      # back only
#   .\sandbox-up.ps1 status    # port health
#
# Bash twin: .\sandbox-up.sh (Git Bash / WSL / Linux).
# Back = Gradle bootRun with the configured JDK and Gradle proxy.

param(
  [ValidateSet('up', 'start', 'back', 'stop', 'status')]
  [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$App = Join-Path $Root 'sources\backend'
$Web = Join-Path $Root 'sources\web'
$Jdk25 = 'C:\Users\karkafiy\Desktop\tools\jdk-25.0.4.1+1'
$Node22 = 'C:\Users\karkafiy\bin\node22\node-v22.17.1-win-x64'
$BackPort = 8082
$FrontPort = 4300
$HealthUrl = "http://127.0.0.1:$BackPort/actuator/health"
$FrontUrl = "http://127.0.0.1:$FrontPort"
$PidFile = Join-Path $App 'build\sandbox-backend.pid'
$LogFile = Join-Path $App 'build\sandbox-backend.log'
$ErrorLogFile = Join-Path $App 'build\sandbox-backend-error.log'

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
  for ($i = 0; $i -lt 240; $i++) {
    if (Test-BackHealth) {
      Write-Host ("OK back UP  {0}" -f $HealthUrl)
      return
    }
    Start-Sleep -Milliseconds 500
  }
  Die ("back not UP after ~120s - see {0}" -f $LogFile)
}

function Resolve-Gradle {
  if (Test-Path (Join-Path $Jdk25 'bin\java.exe')) {
    $env:JAVA_HOME = $Jdk25
    $env:Path = (Join-Path $Jdk25 'bin') + ';' + $env:Path
  }
  if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Die 'java not found in PATH' }

  # Agent shells may redirect GRADLE_USER_HOME to a temp cache without proxy props.
  $userGradleHome = Join-Path $env:USERPROFILE '.gradle'
  if (Test-Path $userGradleHome) {
    $env:GRADLE_USER_HOME = $userGradleHome
  }

  $command = Get-Command gradle -ErrorAction SilentlyContinue
  if ($null -ne $command) { return $command.Source }

  $documentedPath = 'C:\Users\karkafiy\Desktop\tools\gradle-9.7.1\bin\gradle.bat'
  if (Test-Path $documentedPath) { return $documentedPath }

  Die 'gradle not found in PATH (or at the documented local tools path)'
}

function Resolve-Node {
  $nodePath = Join-Path $Node22 'node.exe'
  if (-not (Test-Path $nodePath)) { Die ("Node 22 not found: {0}" -f $nodePath) }
  $env:Path = $Node22 + ';' + $env:Path

  $version = (& $nodePath --version).Trim()
  if ($version -notmatch '^v22\.') { Die ("Node 22 required for the sandbox frontend (detected: {0})" -f $version) }
}

function Start-Back {
  New-Item -ItemType Directory -Force -Path (Join-Path $App 'build') | Out-Null
  Stop-Port $BackPort

  $gradle = Resolve-Gradle
  Write-Host ("-> start back (gradle bootRun) cwd={0}" -f $App)
  $proc = Start-Process -FilePath $gradle `
    -ArgumentList '--no-daemon', 'bootRun' `
    -WorkingDirectory $App `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrorLogFile `
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
  Resolve-Node
  $npm = Join-Path $Node22 'npm.cmd'
  if (-not (Test-Path $npm)) { Die ("npm not found in Node 22 installation: {0}" -f $npm) }

  Stop-Port $FrontPort
  Write-Host ("-> start front  {0}" -f $FrontUrl)
  Write-Host '   Ctrl+C stops the front; back stays up (.\sandbox-up.ps1 stop to kill both)'
  Set-Location $Web
  $env:NODE_OPTIONS = '--max-old-space-size=4096'
  & $npm start
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
