---
specVersion: 1
kind: technical
appId: beauty
status: stable
language: fr
---

# Beauty — Surfaces applicatives (client / pro / admin)

> Décision produit : **trois entrées distinctes**, alignées sur le standard marketplace (Planity, Fresha). Pas de bifurcation Client/Manager au cold start.

## 1. Surfaces

| Surface | Audience | Hôte V1 | App mobile P1 | Auth |
|---------|----------|---------|---------------|------|
| **Client** | CUSTOMER | `beauty.nafura.ma` | `npm run dev` → home directe | Lazy (au booking) |
| **Pro** | OWNER, ADMIN, STAFF | `pro.beauty.nafura.ma` ou `/pro` | `npm run dev:pro` → login pro | Requise |
| **Admin** | PLATFORM_ADMIN | `admin.beauty.nafura.ma` ou `/admin` | `npm run dev:admin` (stub P1) | Requise |

## 2. Règles UX

- L’app **client** ne demande jamais « êtes-vous client ou pro ? ».
- Lien discret **« Espace professionnel »** en footer client → ouvre la surface pro (URL / app séparée).
- L’**onboarding partenaire** (création salon) : V1 manuel par Nafura ([pro-partner-onboarding.flow.md](flows/pro-partner-onboarding.flow.md)) ; V2 self-serve.
- Facturation pro : **commission + relevé** marketplace — pas d’écran subscription ERP.

## 3. Prototype mobile P1

| App | Dossier | Commande | Port |
|-----|---------|----------|------|
| Client | `mobile/client/` | `npm run dev` | 5173 |
| Pro | `mobile/pro/` | `npm run dev:pro` | 5174 |
| Admin | `mobile/admin/` | `npm run dev:admin` | 5175 |
| Partagé | `mobile/shared/` | — | fixtures, types, brand |

Le lien **« Espace professionnel »** sur la home client ouvre l’app pro (`VITE_PRO_APP_URL`, défaut `http://localhost:5174`).

## 4. Liens

- Navigation détaillée : [navigation.md](navigation.md)
- Onboarding client : [customer-onboarding.flow.md](flows/customer-onboarding.flow.md)
- Onboarding partenaire : [pro-partner-onboarding.flow.md](flows/pro-partner-onboarding.flow.md)
