---
specVersion: 1
kind: screen
appId: layali
screenId: pro-bookings-list
name: Réservations (pro)
status: review
phase: P1
p1MobileId: pro-bookings-list
p1Impl: mock
route: /pro/bookings
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN, BAR_MANAGER]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - bookings#GET-/bookings
topicRefs:
  - /topic/tenant/{tenantId}/bookings
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/badge"
  patterns:
    - "pro/list"
    - "realtime/append-on-message"
---

# Réservations (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-bookings-list` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/pro/bookings)*


## Intent

Lister les bookings d'accès reçus par le venue avec filtres par date, statut, mode d'accès, occasion, validation et recherche par nom, téléphone ou référence.

## Route et accès

- Route : `/pro/bookings`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN, BAR_MANAGER (lecture seule pour ce dernier)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Bookings | [bookings API](../../api/bookings.api.md) `GET /bookings?scope=tenant` | onInit + filtres | session 1 min |

## Mock API consommée

- `GET /api/v1/bookings?scope=tenant&status=&accessMode=&occasion=&approvalStatus=&from=&to=&q=&cursor=&size=`
- Topic : `/topic/tenant/{tenantId}/bookings` (nouveau booking → prepend liste)

## États

### loading
- Liste skeleton.

### empty
- "Aucune réservation pour cette période" + reset filtres.

### error
- 401, 503 standards.

### success
- Liste tableau : date/heure arrivée, mode d'accès, ressource (`table`, `guest list`, `comptoir`), nom client, group size, occasion, status (`pending`, `confirmed`, `arrived`, `no-show`, `cancelled`), `approvalStatus`, montant acompte payé.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer ligne | clic | navigation `/pro/bookings/:bookingId` |
| Filtrer | filtres | refetch |
| Recherche par nom/email/téléphone/QR | input | refetch debounce |
| Charger plus | bouton | requête cursor |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| result-list | `@platform/core/components/result-list` | liste tableau |
| filters-panel | `@platform/core/components/filters-panel` | filtres |
| badge | `@platform/core/components/badge` | status |

## Composants internes (non réutilisables)

- `<BookingStatusBadge>` : couleurs par status.
- `<AccessModeBadge>` : `Table`, `Guest list`, `Comptoir`, `Hybrid`.
- `<OccasionBadge>` : `Anniversaire`, `Standard`, `Autre`.

## Validations et règles métier

- Tri par défaut : `arrivalAt:asc`.
- Filtre par défaut : `status=pending,confirmed`, `from=today`.
- Filtre secondaire recommandé : `accessMode=all`, `approvalStatus=all`.
- Recherche `q` : nom, email, ref QR, téléphone.

## Topics realtime

- `/topic/tenant/{tenantId}/bookings` : `booking.created` → insérer en haut de liste avec animation. `booking.cancelled` → mettre à jour ligne.

## i18n

- `layali.pro.bookings.title`
- `layali.pro.bookings.filters.status`
- `layali.pro.bookings.filters.access-mode`
- `layali.pro.bookings.filters.occasion`
- `layali.pro.bookings.filters.approval-status`
- `layali.pro.bookings.search.placeholder`
- `layali.pro.bookings.empty`
- `layali.pro.bookings.status.<status>`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. BAR_MANAGER voit la liste mais aucun bouton d'action (lecture seule).
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une 403 `tenant_mismatch` (utilisateur essayant d'accéder à un autre venue) affiche la page d'erreur dédiée et logue l'incident.
- [ ] L'insertion realtime d'un nouveau booking dans la liste ne casse pas la pagination cursor (le booking est ajouté en haut, le cursor reste valide pour la suite).
- [ ] Les filtres `accessMode`, `occasion` et `approvalStatus` sont combinables sans reset implicite des autres filtres.
- [ ] La recherche par QR (`q=TKT-...` ou `q=BKG-...`) trouve la réservation correspondante.

## Open questions

- Action de masse (validation groupée de bookings pending) : V1 ou V2 ? Décision provisoire : V2.
- Faut-il exposer un preset rapide `Anniversaires du soir` pour l'équipe opérationnelle ?
