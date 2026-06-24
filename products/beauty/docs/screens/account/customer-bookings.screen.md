---
specVersion: 1
kind: screen
appId: beauty
screenId: customer-bookings
name: Mes RDV
status: stable
route: /me/bookings
layout: account-layout
zone: account
roles: [CUSTOMER]
auth: required
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/bookings.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Mes RDV

## Intent

Lister les RDV du client (à venir, passés, annulés) avec accès au détail. Permet d'annuler ou de replanifier facilement.

## Route et accès

- Route : `/me/bookings`
- Layout : `account-layout`
- Auth : required
- Rôles : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Bookings du client | [GET /api/v1/me/bookings](../../api/bookings.api.md#GET-/api/v1/me/bookings) | onInit + onTabChange | session 30s |

## Mock API consommée

- `GET /api/v1/me/bookings?status=UPCOMING&cursor=&pageSize=20`
- `GET /api/v1/me/bookings?status=PAST&...`

## États

### loading
- Skeleton 3 cartes booking.

### empty
- Tab "À venir" vide : illustration + CTA "Trouver un salon" → `/`.
- Tab "Passés" vide : message neutre.

### error
- 401 → login. 503 → bouton retry.

### success
- Tabs : "À venir" | "Passés".
- Liste cartes booking : photo salon, nom salon, service, staff, date+heure (avec relative `dans 2 jours`), statut badge, prix.
- Actions par carte : "Voir" (détail), "Annuler" (si autorisé), "Replanifier" (si autorisé), "Itinéraire", "Refaire" (sur passés).
- Pagination cursor (infinite scroll ou bouton "Charger plus").

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Voir détail | tap carte | nav `/me/bookings/:bookingId` |
| Annuler | bouton carte | dialog confirmation → `POST /bookings/:id/cancel` |
| Replanifier | bouton carte | nav `/salons/:slug/book?serviceId=&staffId=&rescheduleId=...` |
| Itinéraire | bouton | ouverture maps native |
| Refaire | bouton (passé) | nav `/salons/:slug/book` avec preselect |
| Switch tab | clic | reload data |
| Charger plus | scroll/bouton | requête cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-account | `@platform/core/layouts/account` | sidebar account |

## Composants internes (non réutilisables)

- `<BookingCard>` : carte booking responsive.
- `<BookingTabs>` : tabs upcoming/past.
- `<BookingStatusBadge>` : badge couleur par status.

## Validations et règles métier

- "Annuler" visible uniquement si `status ∈ {CONFIRMED, PENDING_PAYMENT}` et `startAt > now + cancellationWindow`.
- "Replanifier" : pareil que "Annuler", mais ouvre wizard avec presets.
- Tri tab "À venir" : `startAt asc`.
- Tri tab "Passés" : `startAt desc`.
- Polling 60s sur tab "À venir" pour MAJ status (paiement validé en arrière-plan).

## i18n

- Clés : `beauty.bookings.title`, `beauty.bookings.tab.upcoming`, `beauty.bookings.tab.past`, `beauty.bookings.empty.upcoming`, `beauty.bookings.empty.past`, `beauty.bookings.cta.cancel`, `beauty.bookings.cta.reschedule`, `beauty.bookings.cta.rebook`, `beauty.bookings.status.<status>`, `beauty.bookings.relative.in`, `beauty.bookings.relative.ago`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] L'annulation respecte la fenêtre du salon (bouton masqué sinon).
- [ ] La replanification ouvre le wizard avec service et staff pré-sélectionnés.
- [ ] Le polling MAJ le statut (PENDING_PAYMENT → CONFIRMED) sans casser le scroll.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Filtre par salon (si client multi-salons) : V2.
- Note rapide / avis après "Passé" : ouvrir directement le formulaire d'avis depuis cette liste (V2).
- Export iCal de tous les RDV à venir : V2.
