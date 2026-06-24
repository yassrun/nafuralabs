---
specVersion: 1
kind: screen
appId: layali
screenId: pro-tickets-list
name: Tickets (pro)
status: stable
route: /pro/tickets
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN, BAR_MANAGER]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - tickets#GET-/tickets/orders
  - tickets#GET-/tickets
  - tickets#POST-/tickets/:id/resend
  - tickets#POST-/tickets/orders/:id/refund
topicRefs:
  - /topic/event/{eventId}/checkin
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/badge"
    - "@platform/core/components/tabs"
  patterns:
    - "pro/list"
---

# Tickets (pro)

## Intent

Lister et opérer les commandes de tickets (et tickets unitaires) d'un venue. Permet de filtrer par event, statut, recherche client/QR, et d'effectuer renvoi email/SMS ou refund.

## Route et accès

- Route : `/pro/tickets`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN (full), BAR_MANAGER (lecture seule)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Commandes (orders) | [tickets API](../../api/tickets.api.md) `GET /tickets/orders?scope=tenant` | onInit + filtres | session 1 min |
| Tickets unitaires (tab "Tickets") | `GET /tickets?scope=tenant` | lazy au switch tab | session 1 min |
| Compteur entrées (par event sélectionné) | [checkins API](../../api/checkins.api.md) `GET /checkins/counter` | si event filtré | live |

## Mock API consommée

- `GET /api/v1/tickets/orders?scope=tenant&eventId=&status=&from=&to=&q=&cursor=&size=`
- `GET /api/v1/tickets?scope=tenant&eventId=&status=`
- `POST /api/v1/tickets/:id/resend`
- `POST /api/v1/tickets/orders/:id/refund`
- Topic : `/topic/event/{eventId}/checkin` (incrément `totalIn`)

## États

### loading
- Skeleton liste + KPIs.

### empty
- "Aucune commande pour cette période/event" + reset filtres.

### error
- 401, 503 standards.

### success
- Bandeau KPI : nombre de tickets vendus, revenu net, entrées comptées (si event filtré).
- Tabs `Commandes` / `Tickets unitaires`.
- Liste tableau (Commandes) : ref, event, client (nom+téléphone), quantité totale, montant, statut paiement, créé.
- Liste tableau (Tickets) : ref ticket, event, catégorie, statut (`VALID`/`CHECKED_IN`/`REFUNDED`), check-in time si scanné.
- Filtres : event (dropdown), status, plage date, recherche q.
- Bouton "Export CSV" (OWNER) — V2 désactivé.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Filtrer par event | dropdown | refetch + compteur entrées en live |
| Cliquer ligne order | clic | drawer détail commande (tickets, paiement, refunds) |
| Renvoyer email/SMS | bouton sur ligne ticket | `POST /tickets/:id/resend` + toast |
| Rembourser commande | bouton | dialog amount/raison → `POST /orders/:id/refund` |
| Recherche | input debounce | refetch `q=` |
| Charger plus | scroll | requête `cursor` |
| Switch tab | tab click | reload data appropriée |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| result-list | `@platform/core/components/result-list` | tableau |
| filters-panel | `@platform/core/components/filters-panel` | filtres |
| badge | `@platform/core/components/badge` | statut |
| tabs | `@platform/core/components/tabs` | commandes / tickets |

## Composants internes (non réutilisables)

- `<TicketStatusBadge>` : couleurs par status.
- `<OrderDrawer>` : drawer latéral détail commande.
- `<RefundDialog>` : dialog refund (réutilisé de pro-booking-detail).

## Validations et règles métier

- Tri par défaut : `createdAt:desc`.
- Recherche `q` accepte : nom client, email, téléphone, ref order, ref ticket.
- Refund order : montant max = `totalMinor - sum(refunds)` ; déclenche `POST /payments/:paymentId/refund` côté backend.
- BAR_MANAGER : pas de bouton refund ni resend.
- Si event en `CANCELLED`, toutes les lignes sont marquées (badge) + suggère refund par lot (OWNER seul).

## Topics realtime

- `/topic/event/{eventId}/checkin` : si filtre event actif, incrémente le KPI "entrées" sans refetch.

## i18n

- `layali.pro.tickets.title`
- `layali.pro.tickets.tab.orders`
- `layali.pro.tickets.tab.tickets`
- `layali.pro.tickets.kpi.sold`
- `layali.pro.tickets.kpi.revenue`
- `layali.pro.tickets.kpi.checkedIn`
- `layali.pro.tickets.actions.resend`
- `layali.pro.tickets.actions.refund`
- `layali.pro.tickets.empty`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Le filtre par event est obligatoire pour le compteur live (sinon section masquée).
- [ ] BAR_MANAGER : lecture seule strictement, pas de bouton mutateur visible.
- [ ] Le drawer order détaillé affiche bien les N tickets avec statut check-in individuel.
- [ ] Une 403 (tenant mismatch) déclenche la page d'erreur dédiée.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Export CSV : V2 confirmé.
- Renvoi groupé (resend all tickets d'un order) : V1 oui ; resend cross-orders V2.
- Vue "billetterie temps réel" graphique : V2.
