# Requires admin to modify C:\Windows\System32\drivers\etc\hosts
# Windows effectively ignores past ~9 aliases on a single hosts line — keep extras on separate lines.
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$marker = '# Nafura staging (nlops)'
$line = '127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging zenith.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging'
$extra = @(
  '127.0.0.1 build-intelligence.nafuralabs.staging',
  '127.0.0.1 usage-ops.nafuralabs.staging',
  '127.0.0.1 api.blanner.nafuralabs.staging',
  '127.0.0.1 api.venue-catalog.nafuralabs.staging',
  '127.0.0.1 catalog.nafuralabs.staging'
)

$content = Get-Content $hostsPath -Raw -ErrorAction Stop
if ([string]::IsNullOrWhiteSpace($content)) {
    Write-Error 'Hosts file is empty - run toolchain/ops/restore-staging-hosts.ps1 as Administrator.'
    exit 1
}

# Remove legacy / malformed entries
$content = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*iam\.nafura\.local[^\r\n]*\r?\n?', ''
$content = $content -replace 'http://usage-ops\.nafuralabs\.staging', 'usage-ops.nafuralabs.staging'
$content = $content -replace '\s+build-intelligence\.nafuralabs\.staging', ''
$content = $content -replace '\s+usage-ops\.nafuralabs\.staging', ''

$updated = $content -replace '(?m)^127\.0\.0\.1[^\r\n]*nafuralabs\.staging[^\r\n]*', $line
if ($updated -notmatch 'iam\.nafuralabs\.staging') {
    if ($updated -match [regex]::Escape($marker)) {
        $updated = $updated -replace ([regex]::Escape($marker)), "$marker`r`n$line"
    } else {
        $updated = $updated.TrimEnd() + "`r`n`r`n$marker`r`n$line`r`n"
    }
}

foreach ($e in $extra) {
    $hostOnly = ($e -split '\s+', 2)[1]
    if ($updated -notmatch [regex]::Escape($hostOnly)) {
        if (-not $updated.EndsWith("`n")) { $updated += "`r`n" }
        $updated += "$e`r`n"
    }
}

try {
    Set-Content -Path $hostsPath -Value $updated.TrimEnd() -Encoding ASCII -ErrorAction Stop
} catch {
    Write-Error "Cannot write hosts file (run PowerShell as Administrator): $_"
    exit 1
}

ipconfig /flushdns | Out-Null
Write-Host 'Updated Nafura staging hosts:'
Select-String -Path $hostsPath -Pattern 'Nafura staging|nafuralabs\.staging|usage-ops'
Write-Host 'Resolve usage-ops:'
try {
    Write-Host ([System.Net.Dns]::GetHostAddresses('usage-ops.nafuralabs.staging')[0].IPAddressToString)
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
