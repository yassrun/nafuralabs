# Layali Mobile App

Prototype Ionic React prioritaire pour Layali mobile.

**Layali specializes in nightlife and dining only** — table reservations at venues (clubs, bars, rooftops, restaurants). No ticketing (dedicated to TicketMa in Morocco).

## Ce qui est inclus

- Une version mobile client moquée de Layali (home feed, venue discovery, table booking)
- 13 wireframe screens across discovery, booking, auth, and account flows
- Des données centralisées dans `src/prototypeData.ts` (mockées)
- Stack: Vite 8 + React 19 + TypeScript + Ionic React

## Scope

**Inclus**: 
- Venue discovery (rooftops, clubs, bars, restaurants)
- Table booking and reservations
- Authentication & account management
- Real-time activity feed

**Hors scope**:
- Generic ticketing (TicketMa covers Morocco)
- Pro/owner console (reserved for `layali/web`)

## Commandes

```bash
npm install
npm run dev
npm run build
```

## Prochaine étape

Remplacer les fixtures de `src/prototypeData.ts` par des APIs réelles. Backend et web pro : `products/layali/backend/`, `products/layali/web/` (à créer).

