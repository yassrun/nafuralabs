---
specVersion: 1
kind: technical
appId: layali
status: stable
language: fr
---

# Layali — Surfaces applicatives (client / pro / admin)

> Décision produit : **trois entrées distinctes**, alignées sur le standard marketplace nightlife (Shotgun, Xceed). Pas de bifurcation Client/Manager au cold start.

## 1. Surfaces

| Surface | Audience | Hôte V1 | App mobile P1 | Auth |
|---------|----------|---------|---------------|------|
| **Client** | CUSTOMER | `layali.ma` | `npm run dev` → `#/` home | Lazy (paiement / compte) |
| **Pro** | OWNER, ADMIN, HOST, BAR_MANAGER | `<venue>.pro.layali.ma` | `npm run dev:pro` → `#/pro/login` | Requise |
| **Admin** | PLATFORM_ADMIN | `admin.layali.ma` | `npm run dev:admin` (stub P1) | Requise |

## 2. Règles UX

- L’app **client** ouvre sur la **discovery** (home soirées / lieux).
- Lien discret **« Espace professionnel »** en footer → surface pro séparée.
- `memberships/requests` = **staff d’un venue existant**, pas inscription d’un nouveau partenaire.
- Onboarding venue : V1 manuel Nafura ([pro-partner-onboarding.flow.md](flows/pro-partner-onboarding.flow.md)) ; V2 self-serve « Référencer mon établissement ».

## 3. Prototype mobile P1

| App | Dossier | Commande | Port |
|-----|---------|----------|------|
| Client | `mobile/client/` | `npm run dev` | 5183 |
| Pro | `mobile/pro/` | `npm run dev:pro` | 5184 |
| Admin | `mobile/admin/` | `npm run dev:admin` | 5185 |
| Partagé | `mobile/shared/` | — | fixtures, types, brand |

## 4. Liens

- [navigation.md](navigation.md)
- [pro-access.flow.md](flows/pro-access.flow.md)
- [pro-partner-onboarding.flow.md](flows/pro-partner-onboarding.flow.md)
