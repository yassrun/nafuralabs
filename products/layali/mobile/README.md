# Layali Mobile

Trois applications Vite séparées + code partagé.

## Structure

```
mobile/
├── client/          # App cliente (discovery, booking, tickets)
├── pro/             # Back-office venue (#/pro/*)
├── admin/           # Stub admin Nafura (P1)
└── shared/          # prototypeData, types, brand, env
```

## Commandes

| Commande | Port | URL |
|----------|------|-----|
| `npm run dev` | 5183 | App **client** (`#/`) |
| `npm run dev:pro` | 5184 | App **pro** (`#/pro/login`) |
| `npm run dev:admin` | 5185 | App **admin** (`#/admin`) |
| `npm run build` | — | Build des 3 apps |

```bash
cd products/layali/mobile
npm install
npm run dev
```

Specs : [../docs/app-surfaces.md](../docs/app-surfaces.md)
