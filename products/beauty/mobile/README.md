# Beauty — Client Walkthrough (mobile)

Trois applications Vite séparées + code partagé.

## Structure

```
mobile/
├── client/          # App cliente (discovery, booking, compte)
├── pro/             # Back-office salon
├── admin/           # Stub admin Nafura (P1)
└── shared/          # prototypeData, types, brand, env
```

## Commandes

| Commande | Port | URL |
|----------|------|-----|
| `npm run dev` | 5173 | App **client** |
| `npm run dev:pro` | 5174 | App **pro** |
| `npm run dev:admin` | 5175 | App **admin** |
| `npm run build` | — | Build client + pro + admin |

```bash
cd products/beauty/mobile
npm install
npm run dev
```

Le lien **« Espace professionnel »** sur la home client ouvre `http://localhost:5174` (configurable via `VITE_PRO_APP_URL`).

Specs : [../docs/app-surfaces.md](../docs/app-surfaces.md)
