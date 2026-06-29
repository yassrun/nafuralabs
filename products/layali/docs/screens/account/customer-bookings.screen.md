---
specVersion: 1
kind: screen
appId: layali
screenId: customer-bookings
name: Mes réservations
status: stable
phase: P1
p1MobileId: bookings-list
p1Impl: mock
route: /me/bookings
layout: account-shell
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - bookings#GET-/bookings
  - bookings#PATCH-/bookings/:id/cancel
abstractions:
  components:
    - "@platform/core/components/tabs"
    - "@platform/core/components/result-list"
    - "@platform/core/components/qr-display"
    - "@platform/core/components/empty-state"
  patterns:
    - "account/two-tab-list"
---

# Mes réservations

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `bookings-list` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Vue compte du client : ses réservations de tables, séparées en `À venir` et `Passées`. Action d'annulation possible selon politique.

## Route et accès

- Route : `/me/bookings`
- Layout : account-shell
- Auth : required
- Rôles autorisés : CUSTOMER (et tout utilisateur authentifié peut voir ses propres bookings)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Bookings à venir | [bookings API](../../api/bookings.api.md) `GET /bookings?scope=mine&when=upcoming` | onInit | session 1 min |
| Bookings passés | [bookings API](../../api/bookings.api.md) `GET /bookings?scope=mine&when=past&cursor=` | on tab open | session 5 min |

## Mock API consommée

- `GET /api/v1/bookings?scope=mine&when=upcoming&cursor=&size=`
- `GET /api/v1/bookings?scope=mine&when=past&cursor=&size=`
- `PATCH /api/v1/bookings/:id/cancel`

## États

### loading
- 4 skeleton cards par onglet.

### empty
- Onglet à venir : "Aucune réservation à venir" + CTA `/venues`.
- Onglet passées : "Aucune sortie pour le moment".

### error
- 401 : redirect login.
- 503 : bannière + retry.

### success
- Onglets `À venir` (default) et `Passées`.
- Cards : venue, date, créneau, table, statut (`confirmed`, `partial-paid`, `cancelled`, `arrived`, `no-show`).
- QR cliquable pour les bookings à venir.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Afficher QR | clic | modale QR plein écran |
| Annuler | bouton (si autorisé) | dialog confirmation puis `PATCH /bookings/:id/cancel` |
| Voir détail | clic card | modale détaillée |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| tabs | `@platform/core/components/tabs` | à venir / passées |
| result-list | `@platform/core/components/result-list` | liste cards |
| qr-display | `@platform/core/components/qr-display` | QR du booking |
| empty-state | `@platform/core/components/empty-state` | message + CTA |

## Composants internes (non réutilisables)

- `<BookingCard>` : venue, date, créneau, table, status badge, QR thumbnail.

## Validations et règles métier

- L'annulation n'est proposée que si `now < arrivalAt - venue.cancellationCutoffHours` (défaut 24h).
- Les bookings `arrived` ou `no-show` ne sont jamais annulables.
- Les bookings `cancelled` restent visibles en `Passées` avec libellé clair.

## Topics realtime

Aucun.

## i18n

- `layali.account.bookings.tab.upcoming`
- `layali.account.bookings.tab.past`
- `layali.account.bookings.empty.upcoming`
- `layali.account.bookings.empty.past`
- `layali.account.bookings.cta.cancel`
- `layali.account.bookings.confirm-cancel`
- `layali.account.bookings.status.<status>`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise : redirect login si non connecté.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Un `PATCH /bookings/:id/cancel` qui retourne 409 (hors fenêtre d'annulation) affiche un toast d'erreur explicite, sans changer le statut côté UI.
- [ ] Le scope `mine` retourne uniquement les bookings de l'utilisateur courant — vérifié côté backend, supposé côté UI.
- [ ] Pagination cursor sur l'onglet passées : pas de doublon, désactivation du bouton "Charger plus" quand `cursor=null`.

## Open questions

- Modifier un booking (changer créneau, taille du groupe) : V1 ou V2 ? Décision provisoire : V2 ; V1 = annuler + recréer.
