# Requires admin
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$content = Get-Content $hostsPath -Raw -ErrorAction Stop
if ($content -match 'kubernetes\.docker\.internal') {
    Write-Host 'kubernetes.docker.internal already in hosts'
    exit 0
}
Add-Content -Path $hostsPath -Value "`n127.0.0.1 kubernetes.docker.internal" -Encoding ASCII
Write-Host 'Added 127.0.0.1 kubernetes.docker.internal'
