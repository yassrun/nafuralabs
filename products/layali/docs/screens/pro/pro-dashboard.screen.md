---
specVersion: 1
kind: screen
appId: layali
screenId: pro-dashboard
name: Tableau de bord pro
status: stable
route: /pro
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - events#GET-/events
  - bookings#GET-/bookings
  - tickets#GET-/tickets/orders
  - payments#GET-/payments/summary
topicRefs:
  - /topic/tenant/{tenantId}/alerts
  - /topic/tenant/{tenantId}/bookings
  - /topic/event/{eventId}/availability
  - /topic/event/{eventId}/checkin
abstractions:
  components:
    - "@platform/core/components/kpi-card"
    - "@platform/core/components/activity-feed"
    - "@platform/core/components/chart-line"
  patterns:
    - "pro/dashboard"
    - "realtime/multi-topic"
---

# Tableau de bord pro

## Intent

Vue d'ensemble côté venue : la soirée du soir (couverture billetterie, tables, check-ins en cours), les ventes en cours, alertes capacité.

## Route et accès

- Route : `/pro`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN
- Tenant requis : oui (`X-Tenant-Id`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Event "ce soir" | [events API](../../api/events.api.md) `GET /events?scope=tenant&for=tonight` | onInit | session 1 min |
| Bookings du jour | [bookings API](../../api/bookings.api.md) `GET /bookings?scope=tenant&when=tonight` | onInit | session 1 min |
| Ventes tickets jour | [tickets API](../../api/tickets.api.md) `GET /tickets/orders?scope=tenant&when=today` | onInit | session 1 min |
| Résumé CA | [payments API](../../api/payments.api.md) `GET /payments/summary?period=today` | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/events?scope=tenant&for=tonight`
- `GET /api/v1/bookings?scope=tenant&when=tonight`
- `GET /api/v1/tickets/orders?scope=tenant&when=today`
- `GET /api/v1/payments/summary?period=today`
- Topics : alerts, bookings, availability, checkin (voir [mock-api.md](../../mock-api.md))

## États

### loading
- 4 KPI cards skeleton + chart skeleton + feed skeleton.

### empty
- Pas d'event ce soir : afficher "Pas d'événement programmé ce soir" + CTA `/pro/events`.

### error
- 401 : redirect login pro.
- 403 `tenant_suspended` : page dédiée "Tenant suspendu, contacter Nafura".

### success
- KPI cards : tables occupées / total, tickets vendus, CA jour, taux check-in.
- Chart line : ventes tickets cumulées dernières 24h.
- Activity feed live : nouveau booking, ticket vendu, alerte capacité.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer KPI tables | clic | navigation `/pro/tables` |
| Cliquer KPI tickets | clic | navigation `/pro/tickets` |
| Cliquer alerte feed | clic | navigation contextuelle |
| Switch venue (multi-venue) | sélecteur header | recharge dashboard avec nouveau tenant |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| kpi-card | `@platform/core/components/kpi-card` | KPI |
| activity-feed | `@platform/core/components/activity-feed` | flux d'événements live |
| chart-line | `@platform/core/components/chart-line` | ventes |

## Composants internes (non réutilisables)

- `<TonightCard>` : focus event du soir avec couverture.
- `<CapacityRing>` : anneau de jauge capacité totale soirée.

## Validations et règles métier

- Tenant suspendu : on bloque toute interaction sauf déconnexion.
- Les KPI sont scoped au tenant courant (`X-Tenant-Id`).
- L'activity feed est limité à 50 derniers événements en mémoire.

## Topics realtime

- `/topic/tenant/{tenantId}/alerts` : insère dans feed.
- `/topic/tenant/{tenantId}/bookings` : nouveau booking → KPI tables maj.
- `/topic/event/{eventId}/availability` : KPI tickets maj.
- `/topic/event/{eventId}/checkin` : KPI taux check-in maj.

## i18n

- `layali.pro.dashboard.kpi.tables`
- `layali.pro.dashboard.kpi.tickets`
- `layali.pro.dashboard.kpi.revenue`
- `layali.pro.dashboard.kpi.checkin`
- `layali.pro.dashboard.empty.no-event`
- `layali.pro.dashboard.alerts.capacity-90`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. Rôles `HOST` et `BAR_MANAGER` voient un message "Accès limité, choisissez votre vue" + redirect vers `/pro/door` ou `/pro/bookings`.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Un tenant `suspended` retourne 403 et la page affiche un message non bloquant avec contact support.
- [ ] Les abonnements aux 4 topics sont rétablis automatiquement après une coupure réseau (test backoff via `@platform/core/realtime`).
- [ ] La maj live d'un KPI ne provoque pas de scroll jump ni de refetch full.

## Open questions

- Période par défaut KPI : journée locale (00:00) ou night-window (18:00 → 04:00 lendemain) ? Décision provisoire : night-window.
