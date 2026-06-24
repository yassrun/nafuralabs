---
specVersion: 1
kind: screen
appId: layali
screenId: admin-tenants
name: Tenants (admin Nafura)
status: stable
route: /admin/tenants
layout: admin-shell
zone: admin
roles: [PLATFORM_ADMIN]
auth: required
flowRefs: []
apiRefs:
  - tenants-admin#GET-/admin/tenants
  - tenants-admin#POST-/admin/tenants
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/badge"
    - "@platform/core/components/dialog"
  patterns:
    - "admin/list"
---

# Tenants (admin Nafura)

## Intent

Lister tous les tenants (venues) de la plateforme, créer un nouveau tenant via formulaire d'onboarding, accéder au détail.

## Route et accès

- Route : `/admin/tenants`
- Layout : admin-shell
- Auth : required
- Rôles autorisés : PLATFORM_ADMIN
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste tenants | [tenants-admin API](../../api/tenants-admin.api.md) `GET /admin/tenants` | onInit + filtres | session 1 min |

## Mock API consommée

- `GET /api/v1/admin/tenants?status=&city=&q=&cursor=&size=`
- `POST /api/v1/admin/tenants`

## États

### loading
- Skeleton liste.

### empty
- "Aucun tenant" (rare) ou "Aucun résultat pour ces filtres" + bouton "Effacer".

### error
- 401, 503 standards.

### success
- Header : compteurs `Total / Actifs / En attente / Suspendus` + bouton "+ Nouveau tenant".
- Filtres : status (multi), ville, recherche.
- Tableau : slug, nom, ville, owner email, status badge, métriques (events actifs, bookings 30j, revenu 30j MAD), créé.
- Tri par défaut : `updatedAt:desc`.
- Pagination cursor.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer ligne | clic | navigation `/admin/tenants/:tenantId` |
| Filtrer | dropdowns | refetch + MAJ URL |
| Recherche | input debounce | refetch |
| Nouveau tenant | bouton | dialog formulaire onboarding |
| Submit nouveau tenant | bouton dans dialog | `POST /admin/tenants` → toast + redirection `/admin/tenants/:slug` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| result-list | `@platform/core/components/result-list` | tableau |
| filters-panel | `@platform/core/components/filters-panel` | filtres |
| badge | `@platform/core/components/badge` | statut |
| dialog | `@platform/core/components/dialog` | onboarding |

## Composants internes (non réutilisables)

- `<NewTenantDialog>` : formulaire (slug, name, city, ownerEmail, ownerDisplayName) avec validation slug unique (debounce check).
- `<TenantStatusBadge>` : couleurs par status.

## Validations et règles métier

- Slug : kebab-case, 3-40 chars, unique global. Validation côté client + check serveur 409.
- Email owner : RFC 5322 simple ; le backend crée le user Keycloak.
- Recherche `q` : slug, name, ownerEmail.
- Filtres reflétés dans l'URL.

## Topics realtime

Aucun en V1.

## i18n

- `layali.admin.tenants.title`
- `layali.admin.tenants.filter.status`
- `layali.admin.tenants.filter.city`
- `layali.admin.tenants.search.placeholder`
- `layali.admin.tenants.new.cta`
- `layali.admin.tenants.new.title`
- `layali.admin.tenants.new.fields.slug`
- `layali.admin.tenants.new.fields.name`
- `layali.admin.tenants.new.fields.city`
- `layali.admin.tenants.new.fields.ownerEmail`
- `layali.admin.tenants.new.fields.ownerName`
- `layali.admin.tenants.status.<status>`
- `layali.admin.tenants.empty`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Seul `PLATFORM_ADMIN` accède.
- [ ] Le formulaire de création valide le slug unique (debounce) avant submit.
- [ ] Une 409 `slug_exists` au submit met en évidence le champ slug.
- [ ] L'URL reflète les filtres et est restaurable au refresh.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Import en masse de tenants (CSV) : V2.
- Workflow d'approbation à plusieurs étapes (review documents) : V2.
- Délégation à un `PLATFORM_ONBOARDER` : V2.
