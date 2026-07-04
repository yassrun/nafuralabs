# Align P1 frontmatter + section on product screen specs
param(
  [Parameter(Mandatory)] [ValidateSet('beauty', 'layali')] [string]$App
)

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$docs = Join-Path $root "products\$App\docs\screens"

$maps = @{
  beauty = @{
    home = @{ mobile = 'home'; impl = 'mock'; note = '' }
    'salon-search' = @{ mobile = '-'; impl = 'partial'; note = 'recherche dans home' }
    'salon-detail' = @{ mobile = 'salon-detail'; impl = 'mock'; note = '' }
    'service-list' = @{ mobile = '-'; impl = 'partial'; note = 'liste dans salon-detail' }
    'booking-create' = @{ mobile = 'booking-select-time'; impl = 'partial'; note = 'staff/paiement incomplets' }
    'booking-payment' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-01' }
    'booking-confirm' = @{ mobile = 'booking-confirm'; impl = 'partial'; note = '' }
    login = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-01' }
    register = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-01' }
    'customer-profile' = @{ mobile = 'customer-profile'; impl = 'mock'; note = '' }
    'customer-bookings' = @{ mobile = 'bookings-list'; impl = 'mock'; note = '' }
    'customer-booking-detail' = @{ mobile = 'booking-detail'; impl = 'mock'; note = '' }
    'customer-loyalty' = @{ mobile = '-'; impl = 'partial'; note = 'points home/profil; wp-p1-02' }
    entry = @{ mobile = 'entry'; impl = 'mock'; note = 'mobile only' }
    'pro-login' = @{ mobile = 'manager-login'; impl = 'mock'; note = 'id code manager-login' }
    'pro-dashboard' = @{ mobile = 'manager-dashboard'; impl = 'mock'; note = '' }
    'pro-agenda' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-03 stub' }
    'pro-bookings-list' = @{ mobile = 'manager-bookings-list'; impl = 'mock'; note = '' }
    'pro-booking-detail' = @{ mobile = 'manager-booking-detail'; impl = 'mock'; note = '' }
    'pro-services' = @{ mobile = 'manager-services'; impl = 'mock'; note = '' }
    'pro-staff' = @{ mobile = 'manager-staff'; impl = 'mock'; note = '' }
    'pro-customers' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-03 stub' }
    'pro-reviews' = @{ mobile = 'manager-reviews'; impl = 'mock'; note = '' }
    'pro-loyalty' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-03 stub' }
    'pro-settings' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-03 stub' }
    'admin-overview' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-04 stub' }
    'admin-tenants' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-04 stub' }
    'admin-tenant-detail' = @{ mobile = '-'; impl = 'none'; note = 'wp-p1-04 stub' }
  }
  layali = @{
    home = @{ mobile = 'home'; impl = 'mock'; note = '' }
    'venue-search' = @{ mobile = 'venue-search'; impl = 'mock'; note = '' }
    'venue-detail' = @{ mobile = 'venue-detail'; impl = 'mock'; note = '' }
    'event-list' = @{ mobile = 'event-list'; impl = 'mock'; note = '' }
    'event-detail' = @{ mobile = 'event-detail'; impl = 'mock'; note = '' }
    'table-booking-create' = @{ mobile = 'booking-create'; impl = 'mock'; note = 'accessMode TABLE' }
    'table-booking-payment' = @{ mobile = 'booking-payment'; impl = 'mock'; note = '' }
    'table-booking-confirm' = @{ mobile = 'booking-confirm'; impl = 'mock'; note = '' }
    'guest-list-booking-create' = @{ mobile = 'booking-create'; impl = 'mock'; note = 'accessMode GUEST_LIST' }
    'guest-list-booking-review' = @{ mobile = 'booking-review'; impl = 'mock'; note = '' }
    'guest-list-booking-confirm' = @{ mobile = 'booking-confirm'; impl = 'mock'; note = '' }
    'counter-booking-create' = @{ mobile = 'booking-create'; impl = 'mock'; note = 'accessMode COUNTER' }
    'counter-booking-review' = @{ mobile = 'booking-review'; impl = 'mock'; note = '' }
    'counter-booking-confirm' = @{ mobile = 'booking-confirm'; impl = 'mock'; note = '' }
    'ticket-buy' = @{ mobile = 'ticket-buy'; impl = 'mock'; note = '' }
    'ticket-payment' = @{ mobile = 'ticket-payment'; impl = 'mock'; note = '' }
    'ticket-confirm' = @{ mobile = 'ticket-confirm'; impl = 'mock'; note = '' }
    entry = @{ mobile = 'entry'; impl = 'mock'; note = 'mobile only' }
    login = @{ mobile = 'login'; impl = 'mock'; note = '#/login' }
    register = @{ mobile = 'register'; impl = 'mock'; note = '#/register' }
    'customer-profile' = @{ mobile = 'customer-profile'; impl = 'mock'; note = '' }
    'customer-bookings' = @{ mobile = 'bookings-list'; impl = 'mock'; note = '' }
    'customer-booking-detail' = @{ mobile = 'booking-detail'; impl = 'mock'; note = '' }
    'my-accesses' = @{ mobile = 'my-accesses'; impl = 'mock'; note = '#/me/accesses' }
    'customer-tickets' = @{ mobile = 'customer-tickets'; impl = 'mock'; note = '#/me/tickets' }
    'pro-login' = @{ mobile = 'pro-login'; impl = 'mock'; note = '' }
    'pro-dashboard' = @{ mobile = 'pro-dashboard'; impl = 'mock'; note = '#/pro' }
    'pro-no-access' = @{ mobile = 'pro-no-access'; impl = 'mock'; note = '' }
    'pro-access-request' = @{ mobile = 'pro-access-request'; impl = 'mock'; note = '' }
    'pro-access-requests' = @{ mobile = 'pro-access-requests'; impl = 'mock'; note = '' }
    'pro-tenant-suspended' = @{ mobile = 'pro-tenant-suspended'; impl = 'mock'; note = '' }
    'pro-venue-settings' = @{ mobile = 'pro-venue-settings'; impl = 'mock'; note = '' }
    'pro-events-list' = @{ mobile = 'pro-events-list'; impl = 'mock'; note = '' }
    'pro-event-edit' = @{ mobile = 'pro-event-edit'; impl = 'mock'; note = '' }
    'pro-tables' = @{ mobile = 'pro-tables'; impl = 'mock'; note = '' }
    'pro-bookings-list' = @{ mobile = 'pro-bookings-list'; impl = 'mock'; note = '#/pro/bookings' }
    'pro-booking-detail' = @{ mobile = 'pro-booking-detail'; impl = 'mock'; note = '#/pro/bookings/:ref' }
    'pro-tickets-list' = @{ mobile = 'pro-tickets-list'; impl = 'mock'; note = '' }
    'pro-door-checkin' = @{ mobile = 'pro-door-checkin'; impl = 'mock'; note = '#/pro/door' }
    'pro-reviews' = @{ mobile = 'pro-reviews'; impl = 'mock'; note = '' }
    'admin-overview' = @{ mobile = 'admin-overview'; impl = 'mock'; note = '' }
    'admin-tenants' = @{ mobile = 'admin-tenants'; impl = 'mock'; note = '' }
    'admin-tenant-detail' = @{ mobile = 'admin-tenant-detail'; impl = 'mock'; note = '' }
  }
}

$map = $maps[$App]
$depth = '../../'
$p1BlockTemplate = @'
## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `{MOBILE}` |
| Impl | {IMPL} |
| Fixtures | [fixtures.md]({DEPTH}fixtures.md) |
| Cartographie | [mobile-map.md]({DEPTH}mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.{NOTE_LINE}

'@

function Update-ScreenFile {
  param([string]$Path)
  $content = Get-Content $Path -Raw -Encoding UTF8
  if ($content -notmatch '(?m)^screenId:\s*(\S+)') { Write-Warning "No screenId: $Path"; return }
  $screenId = $Matches[1]
  if (-not $map.ContainsKey($screenId)) { Write-Warning "No map for $screenId in $Path"; return }
  $m = $map[$screenId]
  $mobile = $m.mobile
  $impl = $m.impl
  $note = $m.note
  $noteLine = if ($note) { " *($note)*" } else { '' }

  # Frontmatter: add/update phase, p1MobileId, p1Impl
  if ($content -match '(?ms)^---\r?\n(.*?)\r?\n---') {
    $fm = $Matches[1]
    $fm = $fm -replace '(?m)^phase:\s*.*\r?\n', ''
    $fm = $fm -replace '(?m)^p1MobileId:\s*.*\r?\n', ''
    $fm = $fm -replace '(?m)^p1Impl:\s*.*\r?\n', ''
    if ($fm -match '(?m)^status:\s*(\S+)') {
      $fm = $fm -replace '(?m)^status:\s*(\S+)', "status: `$1`nphase: P1`np1MobileId: $mobile`np1Impl: $impl"
    } else {
      $fm = "phase: P1`np1MobileId: $mobile`np1Impl: $impl`n" + $fm
    }
    $content = $content -replace '(?ms)^---\r?\n.*?\r?\n---', "---`n$fm`n---"
  }

  $block = $p1BlockTemplate -replace '\{MOBILE\}', $mobile -replace '\{IMPL\}', $impl -replace '\{DEPTH\}', $depth -replace '\{NOTE_LINE\}', $noteLine

  if ($content -match '(?m)^## P1 - Client Walkthrough') {
    $replacement = $block.TrimEnd() + "`n`n"
    $content = $content -replace '(?ms)^## P1 - Client Walkthrough\r?\n.*?(?=\r?\n## |\r?\n# |\z)', $replacement
  } elseif ($content -match '(?m)^## P1 — Client Walkthrough') {
    $replacement = $block.TrimEnd() + "`n`n"
    $content = $content -replace '(?ms)^## P1 — Client Walkthrough\r?\n.*?(?=\r?\n## |\r?\n# |\z)', $replacement
  } elseif ($content -match '(?m)^# [^\r\n]+\r?\n') {
    $content = $content -replace '(?m)(^# [^\r\n]+\r?\n)', "`$1`n$block"
  }

  # Remove duplicate old P1 walkthrough one-liners if P1 section exists
  $content = $content -replace '(?m)^> \*\*P1 walkthrough.*\r?\n\r?\n', ''
  $content = $content -replace '(?m)^> \*\*P1 mobile.*\r?\n\r?\n', ''

    [System.IO.File]::WriteAllText($Path, $content, [System.Text.UTF8Encoding]::new($true))
  Write-Host "OK $screenId"
}

Get-ChildItem -Path $docs -Recurse -Filter '*.screen.md' | ForEach-Object { Update-ScreenFile $_.FullName }
