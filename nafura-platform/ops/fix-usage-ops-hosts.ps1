# Requires admin: puts usage-ops on its own line (Windows ignores 10th alias on same line)
$path = 'C:\Windows\System32\drivers\etc\hosts'
$c = Get-Content $path -Raw
$c = $c -replace '\s+usage-ops\.nafuralabs\.staging', ''
if ($c -notmatch '(?m)^127\.0\.0\.1\s+usage-ops\.nafuralabs\.staging\s*$') {
  if (-not $c.EndsWith("`n")) { $c += "`r`n" }
  $c += "127.0.0.1 usage-ops.nafuralabs.staging`r`n"
}
[System.IO.File]::WriteAllText($path, $c)
ipconfig /flushdns | Out-Null
Write-Host 'FIXED'
[System.Net.Dns]::GetHostAddresses('usage-ops.nafuralabs.staging')[0].IPAddressToString
