# Windows entry for prod-up. `bash` here is often WSL (wrong kubectl);
# this wrapper uses Git bash + Windows kubectl, and fills REGISTRY_PASS
# from the cluster secret if the env var is empty.
param(
  [ValidateSet("front", "back", "full")]
  [string]$Scope = "full",
  [string]$App = "sektor-btp"
)

$ErrorActionPreference = "Stop"
$gitBash = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path $gitBash)) {
  throw "Git bash not found at $gitBash"
}

$kubectl = (Get-Command kubectl -ErrorAction Stop).Source
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if ($root -notmatch "^([A-Za-z]):\\(.*)$") { throw "unexpected repo path: $root" }
$rootUnix = "/" + $Matches[1].ToLower() + "/" + ($Matches[2] -replace "\\", "/")

if (-not $env:REGISTRY_PASS) {
  $b64 = kubectl --context nafura-vps-prod get secret nafura-registry -n nafura-infra-prod -o jsonpath="{.data.\.dockerconfigjson}"
  if (-not $b64) { throw "REGISTRY_PASS unset and secret nafura-registry missing" }
  $jsonText = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
  $cfg = $jsonText | ConvertFrom-Json
  foreach ($p in $cfg.auths.PSObject.Properties) {
    $a = $p.Value
    if ($a.password) { $env:REGISTRY_PASS = [string]$a.password; break }
    if ($a.auth) {
      $dec = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([string]$a.auth))
      $idx = $dec.IndexOf(":")
      if ($idx -ge 0) { $env:REGISTRY_PASS = $dec.Substring($idx + 1); break }
    }
  }
  if (-not $env:REGISTRY_PASS) { throw "could not decode registry password" }
  Write-Host "REGISTRY_PASS taken from cluster secret (len=$($env:REGISTRY_PASS.Length))"
}

$env:KUBECTL_BIN = $kubectl
$env:BUILD_IMAGES = "true"
$env:PUSH_IMAGES = "true"
$env:KUBE_CONTEXT = "nafura-vps-prod"
$env:ENV = "prod"
$env:SCOPE = $Scope
$env:APP = $App

Write-Host "prod-up SCOPE=$Scope APP=$App (Git bash + Windows kubectl)"
$nlops = switch ($Scope) {
  "front" { "release-frontend" }
  "back" { "release-backend" }
  default { "release-app" }
}
& $gitBash -lc "cd '$rootUnix' && bash nafura-platform/ops/nlops.sh $nlops $App"
if ($LASTEXITCODE -ne 0) { throw "prod-up failed ($LASTEXITCODE)" }
