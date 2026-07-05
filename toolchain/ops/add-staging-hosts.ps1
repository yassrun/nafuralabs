# Requires admin to modify C:\Windows\System32\drivers\etc\hosts
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$marker = '# Nafura staging (nlops)'
$line = '127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging'

$content = Get-Content $hostsPath -Raw -ErrorAction Stop
if ([string]::IsNullOrWhiteSpace($content)) {
    Write-Error 'Hosts file is empty - run toolchain/ops/restore-staging-hosts.ps1 as Administrator.'
    exit 1
}

# Remove legacy line that pointed IAM at iam.nafura.local
$content = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*iam\.nafura\.local[^\r\n]*\r?\n?', ''

if ($content -match 'iam\.nafuralabs\.staging') {
    Write-Host 'Staging hosts already present:'
    Select-String -Path $hostsPath -Pattern 'Nafura staging|nafuralabs\.staging'
    exit 0
}

$updated = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*nafuralabs\.staging[^\r\n]*', $line
if ($updated -notmatch 'iam\.nafuralabs\.staging') {
    if ($updated -match [regex]::Escape($marker)) {
        $updated = $updated -replace ([regex]::Escape($marker)), "$marker`r`n$line"
    } else {
        $updated = $updated.TrimEnd() + "`r`n`r`n$marker`r`n$line`r`n"
    }
}

try {
    Set-Content -Path $hostsPath -Value $updated.TrimEnd() -Encoding ASCII -ErrorAction Stop
} catch {
    Write-Error "Cannot write hosts file (run PowerShell as Administrator): $_"
    exit 1
}

Write-Host 'Updated Nafura staging hosts:'
Select-String -Path $hostsPath -Pattern 'Nafura staging|iam\.nafuralabs\.staging'
