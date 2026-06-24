---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-customers
name: Clients (pro)
status: stable
route: /pro/customers
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN, STAFF]
auth: required
flowRefs: []
apiRefs:
  - ../../api/customers.api.md
  - ../../api/bookings.api.md
  - ../../api/loyalty.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Clients (pro)

## Intent

Liste et fiche détaillée des clients du salon (vue consolidée des RDV, dépenses, fidélité, notes pro). Permet d'ajouter une note privée et de retrouver l'historique.

## Route et accès

- Route : `/pro/customers`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN (full), STAFF (filtré sur ses clients = ceux qu'il a déjà servis)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste clients | [GET /api/v1/pro/customers](../../api/customers.api.md) | onInit + filtres | session 1 min |
| Fiche client (drawer) | [GET /api/v1/pro/customers/:id](../../api/customers.api.md) | au tap | session |
| Historique RDV | [GET /api/v1/pro/bookings?customerId=](../../api/bookings.api.md) | lazy tab "RDV" | session |
| Soldes fidélité | [GET /api/v1/pro/customers/:id/loyalty](../../api/loyalty.api.md) | lazy tab "Fidélité" | session |

## Mock API consommée

- `GET /api/v1/pro/customers?q=&cursor=&pageSize=`
- `GET /api/v1/pro/customers/:customerId`
- `PATCH /api/v1/pro/customers/:customerId` (notes internes salon)
- `GET /api/v1/pro/bookings?customerId=&pageSize=`
- `GET /api/v1/pro/customers/:customerId/loyalty`

## États

### loading
- Skeleton liste.

### empty
- "Aucun client encore. Vos clients apparaîtront ici après leur premier RDV."

### error
- 401, 503.

### success
- Header : recherche q (nom, téléphone, email), filtre période, tri (lastVisit desc).
- Liste : avatar/initiales, nom, téléphone, dernier RDV, total RDV, total dépensé MAD.
- Clic ouvre drawer fiche : tabs `Profil` / `RDV` / `Fidélité` / `Notes internes`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Rechercher | input debounce | refetch |
| Cliquer ligne | clic | drawer fiche client |
| Modifier notes internes | textarea drawer | `PATCH /pro/customers/:id` |
| Appeler client | bouton tel | `tel:` |
| Voir RDV | tab dans drawer | refetch bookings |
| Charger plus | scroll | cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-pro | `@platform/core/layouts/pro` | sidebar |

## Composants internes (non réutilisables)

- `<CustomerListItem>` : ligne avec avatar/initiales.
- `<CustomerDetailDrawer>` : drawer avec tabs.

## Validations et règles métier

- STAFF voit uniquement les customerIds présents dans ses bookings (backend enforce).
- Notes internes salon : 0-2000 chars, visibles uniquement côté pro.
- PII : email/téléphone visibles selon rôle (STAFF voit téléphone et notes ; ADMIN/OWNER tout).
- Pas de suppression de client côté pro (client lui-même peut supprimer son profil).

## i18n

- Clés : `beauty.proCustomers.title`, `beauty.proCustomers.search`, `beauty.proCustomers.filter.period`, `beauty.proCustomers.col.<col>`, `beauty.proCustomers.tab.profile`, `beauty.proCustomers.tab.bookings`, `beauty.proCustomers.tab.loyalty`, `beauty.proCustomers.tab.notes`, `beauty.proCustomers.empty`, `beauty.proCustomers.notes.placeholder`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] STAFF voit uniquement ses clients (test backend + UI).
- [ ] Les notes internes salon ne sont jamais retournées dans les endpoints client.
- [ ] La recherche fonctionne en moins de 300 ms (debounce + index backend).
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Segmentation client (VIP, occasionnel, perdu) : V2.
- Campagne SMS ciblée depuis cet écran : V2.
- Fusion de doublons (même téléphone) : V2.
