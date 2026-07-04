---
specVersion: 1
kind: mobile-map
appId: layali
status: live
phase: P1
language: fr
sourceRoot: products/layali/mobile/src
---

# Layali — Cartographie mobile P1 (spec ↔ code)

> **Source de vérité** pour l’alignement prototype `mobile/` ↔ specs.
> Mettre à jour avec [00-PROGRESS.md](00-PROGRESS.md) à chaque WP P1 terminé.
>
> - `status` sur un `*.screen.md` = maturité **du document spec** (design cible web).
> - Colonne **Impl** ci-dessous = état **du code** mobile (`none` | `partial` | `mock`).

Code : `mobile/src/App.tsx` · Données : `mobile/src/prototypeData.ts` · Routing : hash (`#/…`).

---

## Écrans prototype-only (hors sitemap web §3)

| screenId spec | Mobile `Screen` id | Hash / entrée | Rôle |
|---------------|-------------------|---------------|------|
| [entry](screens/account/entry.screen.md) | `entry` | `#/` au cold start | Choix Client / Manager |
| [pro-login](screens/pro/pro-login.screen.md) | `pro-login` | navigation interne | Auth manager mock |
| [my-accesses](screens/account/my-accesses.screen.md) | `my-accesses` | `#/me/accesses` | Bookings + tickets fusionnés |
| [customer-tickets](screens/account/customer-tickets.screen.md) | `customer-tickets` | `#/me/tickets` | Liste tickets seule |
| [customer-booking-detail](screens/account/customer-booking-detail.screen.md) | `booking-detail` | navigation interne | Détail réservation client |

---

## Booking : specs web vs impl mobile unifiée

En **web** (cible P2/P3), chaque mode a ses routes — voir [screens/booking/README.md](screens/booking/README.md).

En **mobile P1**, un seul triptyque avec `booking.accessMode` :

| Specs web (9 fichiers) | Mobile `Screen` | `accessMode` |
|------------------------|-----------------|--------------|
| `table-booking-create` | `booking-create` | `TABLE` |
| `guest-list-booking-create` | `booking-create` | `GUEST_LIST` |
| `counter-booking-create` | `booking-create` | `COUNTER` |
| `table-booking-payment` | `booking-payment` | `TABLE` |
| `guest-list-booking-review` | `booking-review` | `GUEST_LIST` |
| `counter-booking-review` | `booking-review` | `COUNTER` |
| `*-confirm` | `booking-confirm` | tous modes |

---

## Mapping complet spec → mobile (43/43 mock)

### discovery (5/5)

| screenId | Mobile id | Impl |
|----------|-----------|------|
| home | `home` | mock |
| venue-search | `venue-search` | mock |
| venue-detail | `venue-detail` | mock |
| event-list | `event-list` | mock |
| event-detail | `event-detail` | mock |

### booking (9/9)

| screenId | Mobile id | Impl |
|----------|-----------|------|
| table-booking-create | `booking-create` | mock |
| table-booking-payment | `booking-payment` | mock |
| table-booking-confirm | `booking-confirm` | mock |
| guest-list-booking-create | `booking-create` | mock |
| guest-list-booking-review | `booking-review` | mock |
| guest-list-booking-confirm | `booking-confirm` | mock |
| counter-booking-create | `booking-create` | mock |
| counter-booking-review | `booking-review` | mock |
| counter-booking-confirm | `booking-confirm` | mock |

### ticket (3/3)

| screenId | Mobile id | Impl |
|----------|-----------|------|
| ticket-buy | `ticket-buy` | mock |
| ticket-payment | `ticket-payment` | mock |
| ticket-confirm | `ticket-confirm` | mock |

### account (8/8)

| screenId | Mobile id | Impl | Notes |
|----------|-----------|------|-------|
| entry | `entry` | mock | mobile only |
| login | `login` | mock | `#/login` |
| register | `register` | mock | `#/register` |
| customer-profile | `customer-profile` | mock | |
| customer-bookings | `bookings-list` | mock | |
| customer-booking-detail | `booking-detail` | mock | |
| my-accesses | `my-accesses` | mock | `#/me/accesses` |
| customer-tickets | `customer-tickets` | mock | `#/me/tickets` |

### pro (16/16)

| screenId | Mobile id | Impl | Notes |
|----------|-----------|------|-------|
| pro-login | `pro-login` | mock | |
| pro-dashboard | `pro-dashboard` | mock | `#/pro` |
| pro-no-access | `pro-no-access` | mock | |
| pro-access-request | `pro-access-request` | mock | |
| pro-access-requests | `pro-access-requests` | mock | |
| pro-tenant-suspended | `pro-tenant-suspended` | mock | |
| pro-venue-settings | `pro-venue-settings` | mock | |
| pro-events-list | `pro-events-list` | mock | |
| pro-event-edit | `pro-event-edit` | mock | |
| pro-tables | `pro-tables` | mock | |
| pro-bookings-list | `pro-bookings-list` | mock | `#/pro/bookings` |
| pro-booking-detail | `pro-booking-detail` | mock | `#/pro/bookings/:ref` |
| pro-tickets-list | `pro-tickets-list` | mock | |
| pro-door-checkin | `pro-door-checkin` | mock | `#/pro/door` |
| pro-reviews | `pro-reviews` | mock | |

### admin (3/3)

| screenId | Mobile id | Impl |
|----------|-----------|------|
| admin-overview | `admin-overview` | mock |
| admin-tenants | `admin-tenants` | mock |
| admin-tenant-detail | `admin-tenant-detail` | mock |

---

## Hash routing implémenté

| Hash | `Screen` |
|------|----------|
| `#/` | `home` (après entry) |
| `#/venues` | `venue-search` |
| `#/venues/:slug` | `venue-detail` |
| `#/events` | `event-list` |
| `#/events/:slug` | `event-detail` |
| `#/me/accesses` | `my-accesses` |
| `#/me/tickets` | `customer-tickets` |
| `#/login` | `login` |
| `#/register` | `register` |
| `#/pro` | `pro-dashboard` |
| `#/pro/door` | `pro-door-checkin` |
| `#/pro/bookings` | `pro-bookings-list` |
| `#/pro/bookings/:ref` | `pro-booking-detail` |

Les autres écrans sont atteints par **navigation d’état** (`navigate('booking-create')`, etc.) sans hash dédié en P1.
