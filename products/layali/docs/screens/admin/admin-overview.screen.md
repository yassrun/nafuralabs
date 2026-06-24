---
specVersion: 1
kind: screen
appId: layali
screenId: admin-overview
name: Vue d'ensemble (admin Nafura)
status: stable
route: /admin
layout: admin-shell
zone: admin
roles: [PLATFORM_ADMIN]
auth: required
flowRefs: []
apiRefs:
  - tenants-admin#GET-/admin/overview
  - tenants-admin#GET-/admin/payments
abstractions:
  components:
    - "@platform/core/components/kpi-card"
    - "@platform/core/components/chart-bar"
    - "@platform/core/components/result-list"
    - "@platform/core/components/banner"
  patterns:
    - "admin/dashboard"
---

# Vue d'ensemble (admin Nafura)

## Intent

Tableau de bord plateforme Nafura : volumétrie tenants, events, bookings, tickets, revenu sur la fenêtre courante, alertes opérationnelles.

## Route et accès

- Route : `/admin`
- Layout : admin-shell
- Auth : required
- Rôles autorisés : PLATFORM_ADMIN
- Tenant requis : **non** (X-Tenant-Id interdit sur les routes admin)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Métriques globales | [tenants-admin API](../../api/tenants-admin.api.md) `GET /admin/overview?from=&to=` | onInit + changement période | session 5 min |
| Top payments récents | [tenants-admin API](../../api/tenants-admin.api.md) `GET /admin/payments?from=&to=&size=10` | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/admin/overview?from=&to=`
- `GET /api/v1/admin/payments?from=&to=&size=10&sort=createdAt:desc`

## États

### loading
- Skeleton KPI cards + chart + listes.

### empty
- Aucune donnée sur la période (rare) : message + sélecteur période plus large.

### error
- 401 → login. 403 (rôle insuffisant) → page d'erreur dédiée. 503 → bannière retry.

### success
- Header : sélecteur période (7j / 30j / 90j / custom).
- 6 KPI cards : tenants total/actifs, events publiés, bookings confirmés, tickets vendus, revenu net, no-show ratio.
- Chart bar : revenu par jour sur la période.
- Top cities : top 5 villes par revenu.
- Liste "Alertes ouvertes" : tenants avec warnings (refunds élevés, plaintes, etc.).
- Liste "Derniers paiements" : 10 dernières opérations cross-tenants.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer période | sélecteur | refetch overview |
| Cliquer un tenant alerté | clic alerte | navigation `/admin/tenants/:tenantId` |
| Cliquer ligne payment | clic | drawer détail payment (cross-tenant) |
| Cliquer ville | clic chip | navigation `/admin/tenants?city=<slug>` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| kpi-card | `@platform/core/components/kpi-card` | KPIs |
| chart-bar | `@platform/core/components/chart-bar` | revenu par jour |
| result-list | `@platform/core/components/result-list` | listes |
| banner | `@platform/core/components/banner` | alertes |

## Composants internes (non réutilisables)

- `<PeriodPicker>` : sélecteur fenêtre temporelle.
- `<AlertRow>` : ligne alerte avec lien tenant.

## Validations et règles métier

- Période max : 365 jours.
- Devise unique : `MAD` (la plateforme ne mixe pas les devises en V1).
- KPIs masqués si valeur `null` (provider down) → bandeau d'erreur partiel.
- Cache : période + window stockés en query params pour partage URL.

## Topics realtime

Aucun en V1 (admin = dashboard rafraîchi à la demande).

## i18n

- `layali.admin.overview.title`
- `layali.admin.overview.kpi.tenantsTotal`
- `layali.admin.overview.kpi.tenantsActive`
- `layali.admin.overview.kpi.eventsPublished`
- `layali.admin.overview.kpi.bookings`
- `layali.admin.overview.kpi.tickets`
- `layali.admin.overview.kpi.revenue`
- `layali.admin.overview.kpi.noShowRatio`
- `layali.admin.overview.chart.revenue`
- `layali.admin.overview.section.topCities`
- `layali.admin.overview.section.alerts`
- `layali.admin.overview.section.recentPayments`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Seul `PLATFORM_ADMIN` accède (autres rôles → 403 redirige page Forbidden).
- [ ] `X-Tenant-Id` n'est jamais envoyé depuis cette page.
- [ ] Le sélecteur de période persiste en query string et est restaurable au refresh.
- [ ] Le chart se relâche au resize sans déformer.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Comparaison vs période précédente : V1 simple delta % ; V2 multi-fenêtres.
- Export PDF du dashboard : V2.
- Alertes pushées (notification centre) : V2.
