---
specVersion: 1
kind: screen
appId: beauty
screenId: admin-tenant-detail
name: Détail salon (admin Nafura)
status: stable
route: /admin/tenants/:tenantId
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

# Détail salon (admin Nafura)

## Intent

Fiche complète d'un tenant Beauty : identité, owner, statut cycle de vie, métriques, journal audit, actions sensibles (approve, suspend, reactivate, archive, impersonate).

## Route et accès

- Route : `/admin/tenants/:tenantId`
- Layout : `admin-layout`
- Auth : required
- Rôles : PLATFORM_ADMIN
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Détail tenant | [GET /api/v1/admin/tenants/:tenantId](../../api/tenants-admin.api.md) | onInit | session 1 min |
| Audit log | [GET /api/v1/admin/tenants/:tenantId/audit](../../api/tenants-admin.api.md) | lazy tab "Audit" | session |

## Mock API consommée

- `GET /api/v1/admin/tenants/:tenantId`
- `POST /api/v1/admin/tenants/:tenantId/approve`
- `POST /api/v1/admin/tenants/:tenantId/suspend`
- `POST /api/v1/admin/tenants/:tenantId/reactivate`
- `POST /api/v1/admin/tenants/:tenantId/archive`
- `POST /api/v1/admin/tenants/:tenantId/impersonate`
- `GET /api/v1/admin/tenants/:tenantId/audit?from=&to=&actor=&action=&cursor=`

## États

### loading
- Skeleton.

### empty
- N/A.

### error
- 404 → retour `/admin/tenants`. 403 → Forbidden. 503 → retry.

### success
- Header : nom, slug, ville, status badge, créé, MAJ. Barre actions selon status.
- Carte Owner : nom, email, lien Keycloak (V2). Bouton "Renvoyer invitation" (V2 désactivé).
- Carte Métriques 30j : bookings, CA, no-show ratio, refunds, nouveaux clients.
- Tabs : `Vue d'ensemble` | `Bookings récents` | `Refunds récents` | `Audit` | `Documents` (V2).
- Bouton "Impersonate" avec raison obligatoire.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Approuver | bouton (PENDING_REVIEW) | dialog → `POST /approve` |
| Suspendre | bouton (ACTIVE) | dialog raison + until → `POST /suspend` |
| Réactiver | bouton (SUSPENDED) | dialog → `POST /reactivate` |
| Archiver | bouton (ACTIVE/SUSPENDED) | dialog raison → `POST /archive` |
| Impersonate | bouton | dialog raison ≥10 chars → `POST /impersonate` → ouvre nouvel onglet `/pro` |
| Voir audit | tab | lazy `GET /audit` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-admin | `@platform/core/layouts/admin` | sidebar |

## Composants internes (non réutilisables)

- `<TenantActionsBar>` : actions contextuelles.
- `<SuspendDialog>` : raison + until.
- `<ImpersonateDialog>` : raison obligatoire ≥10 chars.
- `<AuditTimelineItem>` : entrée timeline avec acteur, action, diff.

## Validations et règles métier

- Actions destructives = double confirmation.
- Archive terminal, désactive les autres actions.
- Impersonate : raison ≥10 chars, token expire 1h, nouvel onglet.
- Bannière persistante si `ARCHIVED` : "Tenant archivé — lecture seule".

## i18n

- Clés : `beauty.adminTenantDetail.title`, `beauty.adminTenantDetail.actions.<action>`, `beauty.adminTenantDetail.kpi.<key>`, `beauty.adminTenantDetail.tab.<tab>`, `beauty.adminTenantDetail.dialog.suspend.reason`, `beauty.adminTenantDetail.dialog.impersonate.purpose`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Seul `PLATFORM_ADMIN` accède.
- [ ] Actions contextuelles au status courant.
- [ ] Impersonate ouvre nouvel onglet sans casser la session admin.
- [ ] Suspension/archive tracent une entrée audit visible.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Tab "Documents" (KYC, contrat) : V2.
- Notes internes plateforme partagées entre admins : V2.
- 2FA obligatoire admin : V2.
