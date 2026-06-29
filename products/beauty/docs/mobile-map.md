---
specVersion: 1
kind: mobile-map
appId: beauty
status: live
phase: P1
language: fr
sourceRoot: products/beauty/mobile/src
---

# Beauty — Cartographie mobile P1 (spec ↔ code)

> **Source de vérité** pour l’alignement prototype `mobile/` ↔ specs.
> Mettre à jour avec [00-PROGRESS.md](00-PROGRESS.md) à chaque WP P1 terminé.

Code : `mobile/src/App.tsx` · Données : `mobile/src/prototypeData.ts` · Routing : état interne (pas de hash en P1).

---

## Naming : zone `pro` (spec) ↔ `manager-*` (code)

| screenId spec (zone pro) | Mobile `Screen` id | Impl |
|--------------------------|-------------------|------|
| pro-dashboard | `manager-dashboard` | mock |
| pro-agenda | `manager-agenda` | mock |
| pro-bookings-list | `manager-bookings-list` | mock |
| pro-booking-detail | `manager-booking-detail` | mock |
| pro-services | `manager-services` | mock |
| pro-staff | `manager-staff` | mock |
| pro-customers | `manager-customers` | mock |
| pro-reviews | `manager-reviews` | mock |
| pro-loyalty | `manager-loyalty` | mock |
| pro-settings | `manager-settings` | mock |
| pro-login | `manager-login` | mock |
| entry | `entry` | mock |

---

## Mapping complet (28 specs)

### discovery + booking + account

| screenId | Mobile id | Impl |
|----------|-----------|------|
| entry | `entry` | mock |
| home | `home` | mock |
| salon-search | `salon-search` | mock |
| salon-detail | `salon-detail` | mock |
| service-list | `service-list` | mock |
| booking-create | `booking-select-time` | mock |
| booking-payment | `booking-payment` | mock |
| booking-confirm | `booking-confirm` | mock |
| login | `login` | mock |
| register | `register` | mock |
| customer-profile | `customer-profile` | mock |
| customer-bookings | `bookings-list` | mock |
| customer-booking-detail | `booking-detail` | mock |
| customer-loyalty | `customer-loyalty` | mock |

### pro

| screenId | Mobile id | Impl |
|----------|-----------|------|
| pro-login | `manager-login` | mock |
| pro-dashboard | `manager-dashboard` | mock |
| pro-agenda | `manager-agenda` | mock |
| pro-bookings-list | `manager-bookings-list` | mock |
| pro-booking-detail | `manager-booking-detail` | mock |
| pro-services | `manager-services` | mock |
| pro-staff | `manager-staff` | mock |
| pro-customers | `manager-customers` | mock |
| pro-reviews | `manager-reviews` | mock |
| pro-loyalty | `manager-loyalty` | mock |
| pro-settings | `manager-settings` | mock |

### admin (3/3 mock)

| screenId | Mobile id | Impl |
|----------|-----------|------|
| admin-overview | `admin-overview` | mock |
| admin-tenants | `admin-tenants` | mock |
| admin-tenant-detail | `admin-tenant-detail` | mock |
