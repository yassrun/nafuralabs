# Beauty — Client Walkthrough (mobile)

**Phase P1** — application mobile navigable avec fixtures locales.  
Pas une app de production : aucune API HTTP réelle.

Specs : [../docs/phases.md](../docs/phases.md) · Progress : [../docs/00-PROGRESS.md](../docs/00-PROGRESS.md) · Données : [../docs/fixtures.md](../docs/fixtures.md)

## Parcours actuellement jouables

**Client :** entry → home → salon-detail → booking (créneau) → confirm · bookings-list · profil  

**Pro :** manager-login → dashboard → bookings · staff · services · reviews  

**Manquant P1 :** login/register · payment · loyalty · agenda pro · clients · admin — voir WP `wp-p1-*`

## Installation

```bash
cd products/beauty/mobile
npm install
npm run dev
```

`http://localhost:5173` · `npm run build` · `npm run lint`

## Structure

```
mobile/
├── src/
│   ├── App.tsx              # navigation walkthrough
│   ├── ManagerScreens.tsx   # écrans pro
│   ├── prototypeData.ts     # fixtures P1 (→ mockFixtures.ts en P2)
│   └── brand/tokens.css
├── package.json
└── vite.config.ts
```

## Auth mock (P1 cible)

| Rôle | Accès |
|------|--------|
| Client | walkthrough ; OTP mock `123456` après wp-p1-01 |
| Manager | `fatima@silhouettebeauty.ma` / any password |

## Ajouter un écran walkthrough

1. Spec screen dans `../docs/screens/` si nouveau
2. Fixture dans `prototypeData.ts` si besoin
3. Composant + entrée dans `App.tsx` `Screen` union + `switch`
4. Mettre à jour `../docs/00-PROGRESS.md`

## Après P1

- **P2** : web Angular + mock server (wp-01)
- **P3** : backend + `api/*.md` — remplacer fixtures par HTTP
