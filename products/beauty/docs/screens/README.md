# Beauty — Screen specs

## Convention P1 (Client Walkthrough)

Chaque `*.screen.md` du périmètre P1 inclut :

| Frontmatter | Signification |
|-------------|---------------|
| `phase: P1` | Écran dans le gate Client Walkthrough |
| `p1MobileId` | Id `Screen` dans `mobile/src/App.tsx` (`—` si absent ou fusionné) |
| `p1Impl` | `mock` \| `partial` \| `none` — état code (voir [mobile-map.md](../mobile-map.md)) |
| `status` | Maturité **du document** (design cible web), pas l’impl |

Section **## P1 — Client Walkthrough** : brief agent P1 (fixtures, pas `apiRefs`).

Inventaire fermé : [phases.md](../phases.md) § Inventaire écrans P1.

Zones : `discovery/`, `booking/`, `account/`, `pro/`, `admin/`.
