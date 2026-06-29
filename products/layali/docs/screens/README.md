# Layali — Screen specs

## Convention P1 (Client Walkthrough)

Chaque `*.screen.md` du périmètre P1 inclut :

| Frontmatter | Signification |
|-------------|---------------|
| `phase: P1` | Écran dans le gate Client Walkthrough |
| `p1MobileId` | Id `Screen` dans `mobile/src/App.tsx` (`—` si absent ou fusionné) |
| `p1Impl` | `mock` \| `partial` \| `none` |
| `status` | Maturité **du document** (design web), pas l’impl |

Section **## P1 — Client Walkthrough** : brief agent P1 — [fixtures.md](../fixtures.md), pas `apiRefs`.

Inventaire fermé : [phases.md](../phases.md) § Inventaire écrans P1.

Booking mobile unifié : voir [booking/README.md](booking/README.md).

Zones Layali : `discovery/`, `booking/`, `ticket/`, `account/`, `pro/`, `admin/`.
