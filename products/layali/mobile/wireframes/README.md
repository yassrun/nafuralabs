# Layali Mobile Wireframes

Prototype Ionic React — phase **P1 Client Walkthrough**.

Couverture : discovery, booking multi-modes (table / guest list / comptoir), ticketing, auth, compte, **console pro mobile** (dashboard, réservations, porte, tables, events).

Cartographie spec ↔ code : [../docs/mobile-map.md](../docs/mobile-map.md).

## Périmètre inclus

### Discovery
- home, venue-search, venue-detail, event-list, event-detail

### Booking / access
- Modes TABLE / GUEST_LIST / COUNTER via écrans unifiés `booking-create` → `booking-payment` → `booking-confirm`
- Specs web détaillées : [../docs/screens/booking/README.md](../docs/screens/booking/README.md)
- ticket-buy, ticket-payment, ticket-confirm

### Auth + Account
- entry (choix Client / Manager), login, register, pro-login
- customer-bookings, booking-detail, customer-profile
- my-accesses (bookings + tickets fusionnés en P1)

### Pro mobile (mock)
- pro-dashboard, pro-access-requests, pro-bookings-list, pro-door-checkin, pro-tables, pro-events-list, pro-event-edit

### Hors scope wireframes (specs existent, code à faire)
- admin stub (3 écrans)
- pro-no-access, pro-access-request, pro-venue-settings, pro-tickets-list, pro-reviews
- écrans review guest list / comptoir dédiés

## Fichiers
- discovery : `./discovery.wireframe.md`
- booking et ticket : `./booking-ticket.wireframe.md`
- auth + account : `./account-auth.wireframe.md`

## Notes
- Niveau : low-fidelity (structure, CTA, états)
- Cible : mobile first
- Données : `src/prototypeData.ts`
