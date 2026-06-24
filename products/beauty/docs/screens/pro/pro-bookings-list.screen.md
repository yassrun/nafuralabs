---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-bookings-list
name: Réservations (pro)
status: stable
route: /pro/bookings
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN, STAFF]
auth: required
flowRefs: []
apiRefs:
  - ../../api/bookings.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Réservations (pro)

## Intent

Liste tabulaire de toutes les réservations du salon avec filtres (date, statut, staff, recherche client). STAFF voit uniquement les siennes.

## Route et accès

- Route : `/pro/bookings`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN (full), STAFF (filtré sur soi)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Bookings | [GET /api/v1/pro/bookings](../../api/bookings.api.md#GET-/api/v1/pro/bookings) | onInit + onFilters | session 1 min |

## Mock API consommée

- `GET /api/v1/pro/bookings?from=&to=&status=&staffId=&q=&cursor=&pageSize=`

## États

### loading
- Skeleton tableau.

### empty
- "Aucune réservation sur ces critères" + bouton "Réinitialiser filtres".

### error
- 401, 503.

### success
- Filtres horizontaux : période (today, semaine, mois, custom), statut multi-select, staff (OWNER/ADMIN), recherche q.
- Tableau colonnes : date+heure, référence, client (nom + tel), service, staff, statut badge, paiement badge, montant MAD, actions menu (...).
- Tri par défaut : `startAt desc`.
- Pagination cursor (infinite scroll + bouton).
- Bouton "Export CSV" (OWNER/ADMIN, V2 désactivé).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer ligne | clic | nav `/pro/bookings/:bookingId` |
| Filtrer période | dropdown | refetch + MAJ URL |
| Filtrer statut | multi-select | refetch |
| Filtrer staff | dropdown | refetch |
| Rechercher | input debounce | refetch |
| Menu (...) | actions rapides | dialog confirm + transitions |
| Charger plus | scroll/bouton | requête cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-pro | `@platform/core/layouts/pro` | sidebar |

## Composants internes (non réutilisables)

- `<BookingStatusBadge>` : couleurs par statut.
- `<BookingRowActions>` : menu kebab par ligne.

## Validations et règles métier

- STAFF : pas de filtre staff visible, automatiquement filtré sur soi (backend enforce).
- Recherche `q` : nom client, téléphone, référence.
- URL reflète tous les filtres (back/forward conservé).
- Filtre période défaut = "Semaine".

## i18n

- Clés : `beauty.proBookings.title`, `beauty.proBookings.filter.period`, `beauty.proBookings.filter.status`, `beauty.proBookings.filter.staff`, `beauty.proBookings.search`, `beauty.proBookings.empty`, `beauty.proBookings.col.<col>`, `beauty.proBookings.action.markArrived`, `beauty.proBookings.action.markCompleted`, `beauty.proBookings.action.cancel`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] STAFF voit uniquement ses RDV.
- [ ] Les filtres sont reflétés dans l'URL et restaurables au refresh.
- [ ] La pagination cursor n'introduit pas de doublons.
- [ ] Une 423 `tenant_suspended` masque les actions mutables.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Export CSV V2 confirmé.
- Saved views (presets de filtres) : V2.
- Notifications nouveau booking en haut de liste (badge "+1") : V2.
