---
specVersion: 1
kind: screen
appId: layali
screenId: my-accesses
name: Mes accès (bookings + tickets)
status: stable
phase: P1
p1MobileId: my-accesses
p1Impl: mock
implStatus: mock
platform: mobile
route: "#/me/accesses"
layout: account-shell
zone: account
roles: [CUSTOMER]
auth: required
flowRefs:
  - ../../flows/customer-ticket-purchase.flow.md
  - ../../flows/customer-table-booking.flow.md
  - ../../flows/customer-guest-list-booking.flow.md
---

# Mes accès (bookings + tickets)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `my-accesses` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/me/accesses)*


## Intent

Vue compte **mobile P1** regroupant réservations (table, guest list, comptoir) et billets achetés. Remplace temporairement la séparation web `/me/bookings` + `/me/tickets` pour le walkthrough.

Cible web P2/P3 : conserver [customer-bookings.screen.md](customer-bookings.screen.md) et [customer-tickets.screen.md](customer-tickets.screen.md) comme écrans distincts.

## Route et accès

- Route mobile : `#/me/accesses`
- Auth : requise (mock : session client locale)
- Filtres : `upcoming`, `pending`, `used`, `cancelled`, `all`

## Données P1

| Donnée | Source P1 |
|--------|-----------|
| Bookings | `prototypeData.mockBookingHistory` |
| Tickets | inline mock dans `MyAccessesScreen` |

## Relation aux autres specs

| Spec web | Couverture P1 mobile |
|----------|---------------------|
| customer-bookings | partiel — liste bookings dans onglets |
| customer-tickets | partiel — entrées `type: ticket` |
| customer-booking-detail | via `booking-detail` depuis la liste |

## Implémentation mobile P1

- Fichier : `mobile/src/App.tsx` → `MyAccessesScreen`
- `Screen` id : `my-accesses`
- Voir [mobile-map.md](../../mobile-map.md)

## Critères d'acceptation P1

- [x] Liste mixte bookings + tickets
- [x] Filtres par statut
- [ ] Lien explicite post-achat ticket (wp-p1-02)
