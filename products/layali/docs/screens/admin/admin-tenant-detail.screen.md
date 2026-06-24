---
specVersion: 1
kind: screen
appId: layali
screenId: admin-tenant-detail
name: Détail tenant (admin Nafura)
status: stable
route: /admin/tenants/:tenantId
layout: admin-shell
zone: admin
roles: [PLATFORM_ADMIN]
auth: required
flowRefs: []
apiRefs:
  - tenants-admin#GET-/admin/tenants/:tenantId
  - tenants-admin#POST-/admin/tenants/:tenantId/approve
  - tenants-admin#POST-/admin/tenants/:tenantId/suspend
  - tenants-admin#POST-/admin/tenants/:tenantId/reactivate
  - tenants-admin#POST-/admin/tenants/:tenantId/archive
  - tenants-admin#POST-/admin/tenants/:tenantId/impersonate
  - tenants-admin#GET-/admin/tenants/:tenantId/audit
abstractions:
  components:
    - "@platform/core/components/summary-card"
    - "@platform/core/components/tabs"
    - "@platform/core/components/timeline"
    - "@platform/core/components/dialog"
    - "@platform/core/components/badge"
  patterns:
    - "admin/detail"
---

# Détail tenant (admin Nafura)

## Intent

Fiche complète d'un tenant : identité, owner, statut cycle de vie, métriques 30j, journal audit, opérations sensibles (approve, suspend, reactivate, archive, impersonate).

## Route et accès

- Route : `/admin/tenants/:tenantId`
- Layout : admin-shell
- Auth : required
- Rôles autorisés : PLATFORM_ADMIN
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Détail tenant | [tenants-admin API](../../api/tenants-admin.api.md) `GET /admin/tenants/:tenantId` | onInit | session 1 min |
| Audit log | [tenants-admin API](../../api/tenants-admin.api.md) `GET /admin/tenants/:tenantId/audit` | lazy tab "Audit" | session |

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
- Skeleton header + cards + tabs.

### empty
- N/A.

### error
- 404 → "Tenant introuvable" + retour `/admin/tenants`. 403 → page Forbidden. 503 → bannière retry.

### success
- Header : nom, slug, ville, status badge, créé, dernière mise à jour. Barre d'actions selon status.
- Carte Owner : nom, email, lien Keycloak (V2). Bouton "Renvoyer invitation" (V2 désactivé).
- Carte Métriques 30j : events actifs, bookings, tickets vendus, revenu net, refunds.
- Tabs : `Vue d'ensemble` | `Events récents` (5) | `Refunds récents` (5) | `Audit` | `Documents` (V2).
- Bouton "Impersonate" (icône lunettes) avec confirmation et raison obligatoire.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Approuver | bouton (status PENDING_REVIEW) | dialog confirmation → `POST /approve` → toast + refresh |
| Suspendre | bouton (status ACTIVE) | dialog raison + `until` optionnel → `POST /suspend` |
| Réactiver | bouton (status SUSPENDED) | dialog confirmation → `POST /reactivate` |
| Archiver | bouton (status ACTIVE/SUSPENDED) | dialog raison → `POST /archive` (terminal) |
| Impersonate | bouton | dialog raison ("support-ticket-XXXX") → `POST /impersonate` → ouverture nouvel onglet `/pro` avec token spécial |
| Voir audit | tab Audit | lazy load `GET /audit` |
| Filtrer audit | filtres | refetch audit |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| summary-card | `@platform/core/components/summary-card` | cartes |
| tabs | `@platform/core/components/tabs` | tabs |
| timeline | `@platform/core/components/timeline` | audit |
| dialog | `@platform/core/components/dialog` | actions critiques |
| badge | `@platform/core/components/badge` | statuts |

## Composants internes (non réutilisables)

- `<TenantActionsBar>` : barre d'actions contextuelle.
- `<SuspendDialog>` : dialog suspension avec raison + date "jusqu'à" optionnelle.
- `<ImpersonateDialog>` : dialog impersonate avec champ raison obligatoire (min 10 chars).
- `<AuditTimelineItem>` : item timeline avec acteur, action, diff.

## Validations et règles métier

- Toutes les actions destructives demandent confirmation explicite.
- `Archiver` est terminal et désactive les autres actions.
- `Impersonate` : raison obligatoire ≥ 10 chars, ouvre un nouvel onglet, le token expire en 1h.
- Affiche bannière persistante si `status=ARCHIVED` : "Tenant archivé — lecture seule".
- Le bouton "Suspendre" en `SUSPENDED` est masqué ; "Réactiver" prend sa place.

## Topics realtime

Aucun.

## i18n

- `layali.admin.tenantDetail.title`
- `layali.admin.tenantDetail.actions.approve`
- `layali.admin.tenantDetail.actions.suspend`
- `layali.admin.tenantDetail.actions.reactivate`
- `layali.admin.tenantDetail.actions.archive`
- `layali.admin.tenantDetail.actions.impersonate`
- `layali.admin.tenantDetail.kpi.eventsActive`
- `layali.admin.tenantDetail.kpi.bookings30d`
- `layali.admin.tenantDetail.kpi.tickets30d`
- `layali.admin.tenantDetail.kpi.revenue30d`
- `layali.admin.tenantDetail.tab.overview`
- `layali.admin.tenantDetail.tab.events`
- `layali.admin.tenantDetail.tab.refunds`
- `layali.admin.tenantDetail.tab.audit`
- `layali.admin.tenantDetail.dialog.suspend.reason`
- `layali.admin.tenantDetail.dialog.impersonate.purpose`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Seul `PLATFORM_ADMIN` accède (autres → Forbidden).
- [ ] Les actions sont contextuelles au status courant.
- [ ] L'impersonation ouvre un nouvel onglet sans casser la session admin courante (token séparé).
- [ ] Une suspension trace une entrée audit visible dans le tab "Audit".
- [ ] Archive est irréversible côté UI (alerte explicite).
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Tab "Documents" (KYC, contrat) : V2 confirmé.
- Notes internes plateforme partagées entre admins : V2.
- Délégation d'admin (ajouter un co-PLATFORM_ADMIN) : V2 hors scope.
