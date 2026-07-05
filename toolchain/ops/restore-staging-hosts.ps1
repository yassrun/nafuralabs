# Restore Windows hosts + Nafura staging entries (run as Administrator)
$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'

$hosts = @'
# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# localhost name resolution is handled within DNS itself.
#	127.0.0.1       localhost
#	::1             localhost

# Nafura staging (nlops)
127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging
'@

Set-Content -Path $hostsPath -Value $hosts.TrimEnd() -Encoding ASCII
Write-Host 'Hosts file restored with Nafura staging entries:'
Get-Content $hostsPath | Select-String -Pattern 'localhost|nafura|staging|mbs|iam'
