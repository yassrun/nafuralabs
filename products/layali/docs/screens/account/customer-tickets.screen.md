---
specVersion: 1
kind: screen
appId: layali
screenId: customer-tickets
name: Mes tickets
status: stable
phase: P1
p1MobileId: customer-tickets
p1Impl: mock
route: /me/tickets
layout: account-shell
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - tickets#GET-/tickets
  - tickets#GET-/tickets/orders/:id
abstractions:
  components:
    - "@platform/core/components/tabs"
    - "@platform/core/components/result-list"
    - "@platform/core/components/qr-display"
    - "@platform/core/components/empty-state"
  patterns:
    - "account/two-tab-list"
---

# Mes tickets

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `customer-tickets` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/me/tickets)*


## Intent

Liste des billets achetés. Onglet `À venir` (valid + used non encore consommés à l'entrée) et `Passés`. Chaque ticket affiche son statut (`valid`, `used`, `cancelled`, `refunded`).

## Route et accès

- Route : `/me/tickets`
- Layout : account-shell
- Auth : required
- Rôles autorisés : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Tickets à venir | [tickets API](../../api/tickets.api.md) `GET /tickets?scope=mine&when=upcoming` | onInit | session 1 min |
| Tickets passés | [tickets API](../../api/tickets.api.md) `GET /tickets?scope=mine&when=past&cursor=` | on tab open | session 5 min |

## Mock API consommée

- `GET /api/v1/tickets?scope=mine&when=upcoming&cursor=&size=`
- `GET /api/v1/tickets?scope=mine&when=past&cursor=&size=`
- `GET /api/v1/tickets/orders/:id` (pour voir le détail commande groupée)

## États

### loading
- Skeletons cards.

### empty
- Aucun ticket : message + CTA `/events`.

### error
- 401 : redirect login.

### success
- Onglets `À venir` / `Passés`.
- Cards : event, date, venue, catégorie, statut, QR thumbnail.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Afficher QR | clic | modale plein écran QR |
| Voir commande | clic "détail commande" | modale ou navigation `/events/:slug/buy/confirm/:orderId` |
| Télécharger ICS | bouton | génère `.ics` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| tabs | `@platform/core/components/tabs` | onglets |
| result-list | `@platform/core/components/result-list` | liste cards |
| qr-display | `@platform/core/components/qr-display` | QR ticket |
| empty-state | `@platform/core/components/empty-state` | message + CTA |

## Composants internes (non réutilisables)

- `<TicketAccountCard>` : event, date, venue, catégorie, status badge, QR.

## Validations et règles métier

- Les tickets `cancelled` ou `refunded` sont visibles en passés.
- Les tickets `used` mais event passé : statut "Utilisé" + label "Vous êtes venu·e".
- Les tickets `used` sur event futur : impossible normalement, sauf cas test ; afficher status warning.
- Pagination cursor.

## Topics realtime

Aucun.

## i18n

- `layali.account.tickets.tab.upcoming`
- `layali.account.tickets.tab.past`
- `layali.account.tickets.empty`
- `layali.account.tickets.status.<status>`
- `layali.account.tickets.cta.calendar`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Aucun ticket d'un autre utilisateur ne peut apparaître : le scope `mine` est strict côté backend, et le payload ne contient pas de champ `customerId` d'un autre user.
- [ ] Si l'API retourne 0 ticket, l'onglet "À venir" affiche un empty state avec CTA `/events`.
- [ ] Le QR ouvert en modale est zoomable et lisible en luminosité réduite (contraste élevé).

## Open questions

- Bouton transférer un ticket à un ami (par email) : V1 ou V2 ? Décision provisoire : V2.
