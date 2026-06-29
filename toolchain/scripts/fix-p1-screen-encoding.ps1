# Fix encoding and markdown in P1 screen specs
param(
  [Parameter(Mandatory)] [ValidateSet('beauty', 'layali', 'both')] [string]$App
)

$emDash = [char]0x2014
$apps = if ($App -eq 'both') { @('beauty', 'layali') } else { @($App) }
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$utf8 = [System.Text.UTF8Encoding]::new($true)

foreach ($a in $apps) {
  $docs = Join-Path $root "products\$a\docs\screens"
  Get-ChildItem -Path $docs -Recurse -Filter '*.screen.md' | ForEach-Object {
    $c = [System.IO.File]::ReadAllText($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $n = $c

    # Mojibake em dash (UTF-8 read as Latin-1)
    $n = $n.Replace([string][char]0x00E2 + [char]0x0080 + [char]0x0094, $emDash)

    # Double backticks to single in P1 block
    $n = [regex]::Replace($n, '``([^`]+)``', '`$1`')

    # Frontmatter: use quoted dash for absent mobile id
    $n = $n -replace 'p1MobileId: —', 'p1MobileId: "-"'
    $n = $n -replace 'p1MobileId: -', 'p1MobileId: "-"'

    if ($n -ne $c) {
      [System.IO.File]::WriteAllText($_.FullName, $n, $utf8)
      Write-Host "Fixed $($_.Name)"
    }
  }
}
