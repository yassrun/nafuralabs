---
specVersion: 1
kind: screen
appId: beauty
screenId: admin-overview
name: Vue d'ensemble (admin Nafura)
status: stable
phase: P1
p1MobileId: admin-overview
p1Impl: mock
route: /admin
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

# Vue d'ensemble (admin Nafura)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-04 stub)*

## Intent

Tableau de bord plateforme Nafura pour Beauty : nombre de tenants (salons), KPIs métier (bookings, CA, no-show), alertes opérationnelles, distribution par ville.

## Route et accès

- Route : `/admin`
- Layout : `admin-layout`
- Auth : required
- Rôles : PLATFORM_ADMIN
- Tenant requis : non (interdit sur routes admin)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Métriques globales | [GET /api/v1/admin/overview](../../api/tenants-admin.api.md) | onInit + période | session 5 min |
| Top tenants | [GET /api/v1/admin/tenants?sort=revenue30d:desc&pageSize=10](../../api/tenants-admin.api.md) | onInit | session 5 min |

## Mock API consommée

- `GET /api/v1/admin/overview?from=&to=`
- `GET /api/v1/admin/tenants?sort=revenue30d:desc&pageSize=10`

## États

### loading
- Skeleton KPIs + listes.

### empty
- N/A (rare, période trop courte).

### error
- 401, 403, 503.

### success
- Sélecteur période (7j / 30j / 90j / custom).
- 6 KPI cards : tenants total/actifs, bookings 30j, CA net 30j MAD, no-show ratio, taux paiement online, nouveau clients 30j.
- Section "Distribution par ville" : barres Casablanca, Rabat, Marrakech, Tanger, Agadir.
- Section "Top salons" : 10 tenants par CA, avec lien fiche.
- Section "Alertes" : tenants avec ratio no-show > 15% ou refunds > seuil.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer période | sélecteur | refetch overview |
| Cliquer top salon | clic ligne | nav `/admin/tenants/:tenantId` |
| Cliquer ville | clic bar | nav `/admin/tenants?city=<slug>` |
| Cliquer alerte | clic alerte | nav `/admin/tenants/:tenantId` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-admin | `@platform/core/layouts/admin` | sidebar admin |

## Composants internes (non réutilisables)

- `<KpiCard>` : carte KPI.
- `<CityDistributionChart>` : chart simple barres horizontales.
- `<TopTenantsRow>` : ligne tenant compacte.
- `<AlertRow>` : ligne alerte avec lien.

## Validations et règles métier

- Période max 365 jours.
- Devise : MAD uniquement (V1).
- `X-Tenant-Id` jamais envoyé sur ces requêtes.
- Cache 5 min côté front pour réduire la charge.

## i18n

- Clés : `beauty.adminOverview.title`, `beauty.adminOverview.period.<key>`, `beauty.adminOverview.kpi.<key>`, `beauty.adminOverview.section.cities`, `beauty.adminOverview.section.topTenants`, `beauty.adminOverview.section.alerts`, `beauty.adminOverview.alerts.noShow`, `beauty.adminOverview.alerts.refunds`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Seul `PLATFORM_ADMIN` accède.
- [ ] `X-Tenant-Id` n'est jamais envoyé.
- [ ] Le sélecteur période persiste en URL.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Comparaison période précédente : V2.
- Export PDF dashboard : V2.
- Notifications centre admin (alertes pushées) : V2.
