# Requires admin to modify C:\Windows\System32\drivers\etc\hosts
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$marker = '# Nafura Sektor staging (nlops)'
$line = '127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging'

$content = Get-Content $hostsPath -Raw
if ($content -match 'sektor\.nafuralabs\.staging') {
    Write-Host 'Already present:'
    Select-String -Path $hostsPath -Pattern 'sektor\.nafuralabs\.staging'
    exit 0
}

$block = "`n$marker`n$line`n"
Add-Content -Path $hostsPath -Value $block -Encoding ASCII
Write-Host 'Added:'
Select-String -Path $hostsPath -Pattern 'sektor\.nafuralabs\.staging|Nafura Sektor staging'
