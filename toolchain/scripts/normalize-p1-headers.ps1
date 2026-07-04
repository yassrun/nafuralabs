# Normalize P1 section headers to ASCII (avoid encoding issues)
param(
  [Parameter(Mandatory)] [ValidateSet('beauty', 'layali', 'both')] [string]$App
)

$apps = if ($App -eq 'both') { @('beauty', 'layali') } else { @($App) }
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$utf8 = [System.Text.UTF8Encoding]::new($true)

foreach ($a in $apps) {
  $docs = Join-Path $root "products\$a\docs\screens"
  Get-ChildItem -Path $docs -Recurse -Filter '*.screen.md' | ForEach-Object {
    $lines = [System.IO.File]::ReadAllLines($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $changed = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match '^## P1 .+ Client Walkthrough\s*$') {
        $lines[$i] = '## P1 - Client Walkthrough'
        $changed = $true
      }
      if ($lines[$i] -match 'brief agent .+ mock local') {
        $lines[$i] = $lines[$i] -replace 'brief agent .+ mock local', 'brief agent - mock local'
        $changed = $true
      }
    }
    if ($changed) {
      [System.IO.File]::WriteAllLines($_.FullName, $lines, $utf8)
      Write-Host $_.Name
    }
  }
}
