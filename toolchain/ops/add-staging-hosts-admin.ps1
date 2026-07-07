# Run as Administrator (UAC prompt)
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$marker = '# Nafura staging (nlops)'
$line = '127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging zenith.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging'

$content = Get-Content $hostsPath -Raw -ErrorAction Stop

$content = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*iam\.nafura\.local[^\r\n]*\r?\n?', ''

if ($content -match 'iam\.nafuralabs\.staging') {
    [System.Windows.Forms.MessageBox]::Show(
        'Staging hosts (iam.nafuralabs.staging) are already in the hosts file.',
        'Nafura hosts', 'OK', 'Information') | Out-Null
    exit 0
}

if ($content -match [regex]::Escape($marker)) {
    $updated = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*nafuralabs\.staging[^\r\n]*', $line
    if ($updated -eq $content) {
        $updated = $content -replace ([regex]::Escape($marker)), "$marker`r`n$line"
    }
    Set-Content -Path $hostsPath -Value $updated.TrimEnd("`r", "`n") -Encoding ASCII
    [System.Windows.Forms.MessageBox]::Show(
        "Updated:`n$line",
        'Nafura hosts — OK', 'OK', 'Information') | Out-Null
    exit 0
}

$block = "`r`n$marker`r`n$line`r`n"
Add-Content -Path $hostsPath -Value $block -Encoding ASCII
[System.Windows.Forms.MessageBox]::Show(
    "Added:`n$line",
    'Nafura hosts — OK', 'OK', 'Information') | Out-Null
