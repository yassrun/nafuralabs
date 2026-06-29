---
specVersion: 1
kind: progress
appId: beauty
status: live
language: fr
---

# Beauty — PROGRESS

> Phase active : **P1 — Client Walkthrough** — [phases.md](phases.md) · [mobile-map.md](mobile-map.md)

Légende impl : `none` | `partial` | `mock` | `wired`  
Gate flow : ☐ à valider manuellement en démo · ✅

---

## Phase P1 — gate globale

| Critère | Statut |
|---------|--------|
| Flow `customer-booking` | ☐ démo |
| Flow `customer-onboarding` | ☐ démo |
| Flow `pro-walkthrough` | ☐ démo |
| Flow `admin-walkthrough` | ☐ démo |
| Écrans P1 (`p1Impl` mock/partial) | **28/28** navigables |
| `npm run build` mobile | ✅ |

---

## Work packages P1

| WP | Impl | Evidence |
|----|------|----------|
| wp-p1-01 | mock | login/register OTP `123456`, staff + paiement, `booking-payment`, `commitBookingToHistory` |
| wp-p1-02 | mock | `salon-search`, `service-list`, `customer-loyalty` |
| wp-p1-03 | mock | agenda, clients, fidélité pro, paramètres |
| wp-p1-04 | mock | admin overview / tenants / detail + entry Admin |

---

## Mapping pro (spec → code mobile)

| Screen spec | Mobile screen id | Impl |
|-------------|------------------|------|
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

---

## Écrans clés client

| screenId | Mobile id | Impl |
|----------|-----------|------|
| booking-create | `booking-select-time` | mock |
| booking-payment | `booking-payment` | mock |
| booking-confirm | `booking-confirm` | mock |
| login / register | `login` / `register` | mock |
| salon-search | `salon-search` | mock |
| service-list | `service-list` | mock |
| customer-loyalty | `customer-loyalty` | mock |
| admin-* | `admin-*` | mock |

Détail complet : [phases.md](phases.md) · [mobile-map.md](mobile-map.md)

---

## Work packages P2+

| WP | Phase | Impl |
|----|-------|------|
| wp-01 | P2 | none |
| wp-02 … wp-06 | P3 | none |

Une seule lane P1 sur `mobile/src/**` à la fois.
