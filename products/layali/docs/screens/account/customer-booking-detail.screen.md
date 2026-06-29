---
specVersion: 1
kind: screen
appId: layali
screenId: customer-booking-detail
name: Détail réservation client
status: stable
phase: P1
p1MobileId: booking-detail
p1Impl: mock
implStatus: mock
route: /me/bookings/:bookingId
layout: account-shell
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - bookings#GET-/bookings/:id
---

# Détail réservation client

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-detail` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Fiche d’une réservation client : récap mode d’accès, date, groupe, statut, référence, actions (annuler si politique).

## Route et accès

- Route web : `/me/bookings/:bookingId`
- Mobile P1 : navigation `booking-detail` (pas de hash dédié)

## Implémentation mobile P1

- Fichier : `mobile/src/App.tsx` → `BookingDetailScreen`
- `Screen` id : `booking-detail`
- Données : `mockBookingHistory` + draft courant
- Entrée : `bookings-list`, `my-accesses`

## Critères d'acceptation P1

- [x] Affichage référence, venue, mode, statut
- [x] Retour vers liste
