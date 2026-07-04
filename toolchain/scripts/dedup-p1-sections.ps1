# Remove duplicate P1 - Client Walkthrough blocks
param(
  [Parameter(Mandatory)] [ValidateSet('beauty', 'layali', 'both')] [string]$App
)

$apps = if ($App -eq 'both') { @('beauty', 'layali') } else { @($App) }
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$utf8 = [System.Text.UTF8Encoding]::new($true)
$marker = '## P1 - Client Walkthrough'

foreach ($a in $apps) {
  $docs = Join-Path $root "products\$a\docs\screens"
  Get-ChildItem -Path $docs -Recurse -Filter '*.screen.md' | ForEach-Object {
    $text = [System.IO.File]::ReadAllText($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $idx1 = $text.IndexOf($marker)
    if ($idx1 -lt 0) { return }
    $idx2 = $text.IndexOf($marker, $idx1 + $marker.Length)
    if ($idx2 -lt 0) { return }
    $afterFirst = $text.IndexOf("`n## ", $idx1 + $marker.Length)
    if ($afterFirst -lt 0 -or $afterFirst -ne $idx2) { return }
    $afterSecond = $text.IndexOf("`n## ", $idx2 + $marker.Length)
    if ($afterSecond -lt 0) { return }
    $new = $text.Remove($idx2, $afterSecond - $idx2)
    [System.IO.File]::WriteAllText($_.FullName, $new, $utf8)
    Write-Host "dedup $($_.Name)"
  }
}
