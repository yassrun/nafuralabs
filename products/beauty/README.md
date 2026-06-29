# Beauty

Réservation salons beauté (coiffure, esthétique, ongles, hammam, barbier).

Guide monorepo : [docs/README.md](../../docs/README.md).

## Statut

| Phase | Livrable | Statut |
|-------|----------|--------|
| **P1 — Client Walkthrough** | [mobile/](mobile/) Ionic + fixtures locales | **en cours** (28 specs · voir [phases.md](docs/phases.md)) |
| P2 — Skeleton web | `web/` + mock server | à faire (wp-01) |
| P3 — Wire API | `backend/` | à faire |
| P4 — Ship | K8s / prod | — |

Pilotage : [docs/phases.md](docs/phases.md) · [docs/00-PROGRESS.md](docs/00-PROGRESS.md) · [docs/mobile-map.md](docs/mobile-map.md)

## Démarrage walkthrough mobile (P1)

```bash
cd products/beauty/mobile
npm install
npm run dev
```

Démo pro : `fatima@silhouettebeauty.ma` / mot de passe quelconque.

Voir [mobile/README.md](mobile/README.md).

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/phases.md](docs/phases.md) | **Plan de phases** (P1 walkthrough → P4 ship) |
| [docs/00-PROGRESS.md](docs/00-PROGRESS.md) | Avancement impl |
| [docs/mobile-map.md](docs/mobile-map.md) | Spec ↔ code mobile P1 |
| [docs/app.md](docs/app.md) | Vision produit |
| [docs/fixtures.md](docs/fixtures.md) | Données mock P1 |
| [docs/flows/](docs/flows/) | Parcours walkthrough |
| [docs/screens/](docs/screens/) | Écrans P1 ([README](docs/screens/README.md)) |
| [docs/api/](docs/api/) | Contrats REST — **phase P3** (brouillons) |
| [docs/work-packages/](docs/work-packages/) | WP P1 (`wp-p1-*`) puis P2+ |

## Structure

```
products/beauty/
├── mobile/              # P1 — Client Walkthrough (Ionic React)
├── docs/
├── web/                 # P2 — futur
└── backend/             # P3 — futur
```
