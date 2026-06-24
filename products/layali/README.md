# Layali

Nightlife & dining — réservation de tables (clubs, bars, rooftops, restaurants).

Guide monorepo : [docs/README.md](../../docs/README.md).

## Statut

| Surface | Statut |
|---------|--------|
| **Mobile prototype** | Ionic React + Vite — mock `prototypeData.ts` |
| Backend / web pro | à créer |
| Venue Catalog | consommateur futur des lieux canoniques |

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
| [docs/app.md](docs/app.md) | Vision produit |
| [docs/mock-api.md](docs/mock-api.md) | Fixtures |
| [docs/api/](docs/api/) | Contrats API cibles |
| [docs/work-packages/](docs/work-packages/) | Livraisons |
| [mobile/wireframes/](mobile/wireframes/) | Wireframes écrans |

## Structure cible

```
products/layali/
├── mobile/          # prototype actuel (priorité)
├── docs/            # specs Markdown
├── web/             # futur back-office pro
└── backend/         # futur API Spring Boot
```
