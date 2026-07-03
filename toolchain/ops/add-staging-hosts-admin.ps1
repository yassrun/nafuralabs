# Run as Administrator (UAC prompt)
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$marker = '# Nafura Sektor staging (nlops)'
$line = '127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging'

$content = Get-Content $hostsPath -Raw -ErrorAction Stop
if ($content -match 'sektor\.nafuralabs\.staging') {
    [System.Windows.Forms.MessageBox]::Show(
        'sektor.nafuralabs.staging is already in hosts file.',
        'Nafura hosts', 'OK', 'Information') | Out-Null
    exit 0
}

$block = "`r`n$marker`r`n$line`r`n"
Add-Content -Path $hostsPath -Value $block -Encoding ASCII
[System.Windows.Forms.MessageBox]::Show(
    "Added:`n$line",
    'Nafura hosts — OK', 'OK', 'Information') | Out-Null
