---
specVersion: 1
kind: progress
appId: layali
status: live
language: fr
---

# Layali — PROGRESS

> Phase active : **P1 — Client Walkthrough** — [phases.md](phases.md) · [mobile-map.md](mobile-map.md)

Légende impl : `none` | `partial` | `mock` | `wired`  
Gate flow : ☐ à valider manuellement en démo · ✅

---

## Phase P1 — gate globale

| Critère | Statut |
|---------|--------|
| Flow `customer-table-booking` | ☐ démo |
| Flow `customer-guest-list-booking` | ☐ démo |
| Flow `customer-counter-booking` | ☐ démo |
| Flow `customer-ticket-purchase` | ☐ démo |
| Flow `pro-access` | ☐ démo |
| Flow `pro-membership-request` | ☐ démo (`host@example.ma`) |
| Flow `pro-membership-review` | ☐ démo |
| Flow `pro-walkthrough` | ☐ démo |
| Flow `admin-walkthrough` | ☐ démo |
| Écrans P1 | **43/43** `mock` navigables |
| `npm run build` mobile | ✅ |

---

## Work packages P1

| WP | Impl | Evidence |
|----|------|----------|
| wp-p1-01 | mock | `booking-review`, steppers, `commitBookingToHistory` |
| wp-p1-02 | mock | tickets → `my-accesses` + `customer-tickets`, membership |
| wp-p1-03 | mock | pro settings/tickets/reviews + `pro-booking-detail` |
| wp-p1-04 | mock | admin overview / tenants / detail |

---

## Écrans finalisés (dernière passe)

| screenId | Mobile id | Note |
|----------|-----------|------|
| pro-booking-detail | `pro-booking-detail` | écran dédié `#/pro/bookings/:ref` |
| customer-tickets | `customer-tickets` | `#/me/tickets` |
| booking (9 specs) | `booking-*` | triptyque unifié, tous `mock` |

Détail complet : [phases.md](phases.md) · [mobile-map.md](mobile-map.md)

---

## Work packages P2+

| WP | Phase | Impl |
|----|-------|------|
| wp-01 | P2 | none |
| wp-02 … wp-07 | P3 | none |

Une seule lane P1 sur `mobile/src/**` à la fois.
