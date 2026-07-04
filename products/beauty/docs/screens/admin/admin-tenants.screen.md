---
specVersion: 1
kind: screen
appId: beauty
screenId: admin-tenants
name: Salons (admin Nafura)
status: stable
phase: P1
p1MobileId: admin-tenants
p1Impl: mock
route: /admin/tenants
layout: admin-layout
zone: admin
roles: [PLATFORM_ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/tenants-admin.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Salons (admin Nafura)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-04 stub)*

## Intent

Lister tous les salons (tenants) Beauty, créer un nouveau tenant via formulaire d'onboarding (slug, owner email), accéder au détail.

## Route et accès

- Route : `/admin/tenants`
- Layout : `admin-layout`
- Auth : required
- Rôles : PLATFORM_ADMIN
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste tenants | [GET /api/v1/admin/tenants](../../api/tenants-admin.api.md) | onInit + filtres | session 1 min |

## Mock API consommée

- `GET /api/v1/admin/tenants?status=&city=&q=&cursor=&pageSize=`
- `POST /api/v1/admin/tenants`

## États

### loading
- Skeleton tableau.

### empty
- "Aucun tenant pour ces filtres" + reset.

### error
- 401, 403, 503.

### success
- Header : compteurs (Total / Actifs / En attente / Suspendus) + bouton "+ Nouveau salon".
- Filtres : status, ville, recherche.
- Tableau : slug, nom, ville, owner email, status badge, métriques (bookings 30j, CA 30j MAD), créé.
- Tri par défaut : `updatedAt desc`.
- Pagination cursor.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer ligne | clic | nav `/admin/tenants/:tenantId` |
| Filtrer | dropdowns | refetch + URL |
| Rechercher | input debounce | refetch |
| Nouveau salon | bouton | dialog onboarding |
| Submit onboarding | bouton dans dialog | `POST /admin/tenants` → toast + redirection `/admin/tenants/:slug` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-admin | `@platform/core/layouts/admin` | sidebar |

## Composants internes (non réutilisables)

- `<NewTenantDialog>` : formulaire (slug, name, city, ownerEmail, ownerDisplayName) avec check slug unique (debounce).
- `<TenantStatusBadge>` : couleurs.

## Validations et règles métier

- Slug : kebab-case 3-40 chars, unique global.
- Email : RFC 5322 simple.
- Filtres reflétés dans l'URL.
- `X-Tenant-Id` jamais envoyé sur ces endpoints.

## i18n

- Clés : `beauty.adminTenants.title`, `beauty.adminTenants.filter.status`, `beauty.adminTenants.filter.city`, `beauty.adminTenants.search`, `beauty.adminTenants.new.cta`, `beauty.adminTenants.new.title`, `beauty.adminTenants.new.fields.*`, `beauty.adminTenants.col.*`, `beauty.adminTenants.status.<status>`, `beauty.adminTenants.empty`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Seul `PLATFORM_ADMIN` accède.
- [ ] Le formulaire vérifie le slug unique avant submit.
- [ ] Une 409 `slug_exists` met en évidence le champ.
- [ ] URL reflète les filtres et est restaurable.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Import CSV : V2.
- Workflow approbation multi-étape (review documents) : V2.
- Sous-rôle `PLATFORM_ONBOARDER` : V2.
