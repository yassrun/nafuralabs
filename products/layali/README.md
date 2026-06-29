# Layali

Nightlife & dining — réservation de tables, guest list, comptoir et billetterie événements.

Guide monorepo : [docs/README.md](../../docs/README.md).

## Statut

| Surface | Statut |
|---------|--------|
| **Mobile — Client Walkthrough (P1)** | Ionic React + `prototypeData.ts` — voir [docs/phases.md](docs/phases.md) |
| Backend / web pro | P2+ (à créer) |
| Venue Catalog | consommateur futur — wp-07 P3 |

## Démarrage prototype mobile

```bash
cd products/layali/mobile
npm install
npm run dev
```

Voir [mobile/README.md](mobile/README.md) pour le détail (wireframes, scope, scripts).

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/phases.md](docs/phases.md) | Plan P1–P4 |
| [docs/00-PROGRESS.md](docs/00-PROGRESS.md) | Matrice impl vs specs |
| [docs/mobile-map.md](docs/mobile-map.md) | Spec ↔ code mobile P1 |
| [docs/screens/README.md](docs/screens/README.md) | Convention specs P1 |
| [docs/app.md](docs/app.md) | Vision produit |
| [docs/fixtures.md](docs/fixtures.md) | Données mock P1 |
| [docs/mock-api.md](docs/mock-api.md) | Conventions HTTP (P2/P3) |
| [docs/api/](docs/api/) | Contrats API cibles (P3) |
| [docs/work-packages/](docs/work-packages/) | Livraisons |
| [mobile/wireframes/](mobile/wireframes/) | Wireframes écrans |

## Structure cible

```
products/layali/
├── mobile/          # Client Walkthrough (P1)
├── docs/            # specs Markdown
├── web/             # futur back-office pro (P2)
└── backend/         # futur API Spring Boot (P3)
```
