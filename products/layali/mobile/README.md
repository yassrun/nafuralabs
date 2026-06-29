# Layali Mobile App

Prototype Ionic React — **phase P1 Client Walkthrough** (parcours navigables + fixtures locales).

Layali couvre la nightlife et la restauration au Maroc : discovery de venues, réservation table / guest list / comptoir, achat de billets, compte client et console pro mobile mock.

## Ce qui est inclus

- App mobile client + pro moquée (hash routing `#/venues`, `#/events`, `#/pro`, …)
- Discovery, booking multi-modes, ticketing, auth, profil, opérations pro (door, tables, events)
- Données centralisées dans `src/prototypeData.ts`
- Stack : Vite 8 + React 19 + TypeScript + Ionic React

## Scope P1

**Inclus (walkthrough mock)** :

- Venue & event discovery
- Réservations TABLE / GUEST_LIST / COUNTER (écran unifié `booking-create`)
- Achat billet événement
- Login / register / profil / historique bookings
- Console pro mobile (dashboard, réservations, porte, plan de salle, events)

**À compléter (voir [docs/00-PROGRESS.md](../docs/00-PROGRESS.md))** :

- Écrans review guest list / comptoir dédiés
- `customer-tickets`, membership pro (no-access, access-request)
- Pro : venue settings, tickets list, reviews, admin stub

**Hors P1** :

- API HTTP réelle et web Angular pro (`products/layali/web/`) — P2+
- Intégration venue-catalog partagé — P3 (wp-07)

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Prochaine étape

Exécuter les work packages P1 : [docs/work-packages/](../docs/work-packages/) (`wp-p1-01` … `wp-p1-04`). Backend et web pro : `products/layali/backend/`, `products/layali/web/` (à créer en P2).
