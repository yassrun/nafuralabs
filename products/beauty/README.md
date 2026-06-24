# Beauty

Réservation salons beauté (coiffure, esthétique, ongles, hammam, barbier).

Guide monorepo : [docs/README.md](../../docs/README.md).

## Statut

| Surface | Statut |
|---------|--------|
| **Mobile prototype** | Ionic React + Vite — mock `prototypeData.ts` |
| Backend / web pro | à créer |
| Venue Catalog | consommateur futur (`cityCode`, salons) |

## Démarrage prototype mobile

```bash
cd products/beauty/mobile
npm install
npm run dev
```

Démo manager : `fatima@silhouettebeauty.ma` / mot de passe quelconque.

Voir [mobile/README.md](mobile/README.md).

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/app.md](docs/app.md) | Vision produit |
| [docs/mock-api.md](docs/mock-api.md) | Fixtures |
| [docs/api/](docs/api/) | Contrats API |
| [docs/work-packages/](docs/work-packages/) | Livraisons |

## Structure cible

```
products/beauty/
├── mobile/          # prototype actuel
├── docs/
├── web/             # futur
└── backend/         # futur
```
