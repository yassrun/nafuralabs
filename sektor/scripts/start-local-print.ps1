param([int]$Port = 3000, [string]$Namespace = 'nafura-infra-staging')
$ErrorActionPreference = 'Stop'
# Forward only to loopback. This does not expose the renderer outside the developer machine.
$env:NAFURA_GOTENBERG_URL = "http://127.0.0.1:$Port"
Write-Host "Gotenberg local : $env:NAFURA_GOTENBERG_URL"
Write-Host 'Configurez NAFURA_GOTENBERG_URL avec cette adresse avant de lancer le backend.'
& kubectl port-forward --address=127.0.0.1 -n $Namespace service/gotenberg "${Port}:3000"
