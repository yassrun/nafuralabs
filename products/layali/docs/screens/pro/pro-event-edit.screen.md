---
specVersion: 1
kind: screen
appId: layali
screenId: pro-event-edit
name: Édition événement
status: review
route: /pro/events/:eventId
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - events#GET-/events/:id
  - events#PATCH-/events/:id
  - events#POST-/events/:id/publish
  - events#POST-/events/:id/close
  - events#POST-/events/:id/cancel
  - tickets#POST-/tickets/categories
  - tickets#PATCH-/tickets/categories/:id
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/photo-uploader"
    - "@platform/core/components/dynamic-list"
    - "@platform/core/components/datetime-picker"
  patterns:
    - "pro/edit-with-children"
---

# Édition événement

## Intent

Créer ou éditer une soirée : infos (titre, date, type, photo), description, modes d'accès activés, billetterie, options table, guest list, comptoir, et règles d'entrée spécifiques à la soirée. Permet publication, fermeture et annulation.

## Route et accès

- Route : `/pro/events/:eventId` (et `/pro/events/new` pour création)
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Event | [events API](../../api/events.api.md) `GET /events/:id` | onInit (si edit) | session |
| Catégories de billets | inclus dans event | onInit | session |

## Mock API consommée

- `GET /api/v1/events/:id`
- `POST /api/v1/events` (création)
- `PATCH /api/v1/events/:id`
- `POST /api/v1/events/:id/publish`
- `POST /api/v1/events/:id/close`
- `POST /api/v1/events/:id/cancel`
- `POST /api/v1/tickets/categories` (ajout catégorie)
- `PATCH /api/v1/tickets/categories/:id` (édition catégorie)

## États

### loading
- Form skeleton.

### empty
- N/A (création = form vide ; édition d'un event existant).

### error
- 404 : event inconnu, redirect liste.
- 409 : transition de status invalide (ex: closer un draft).
- 422 : validation par champ.

### success
- Form complet : section identité, section modes d'accès, section règles d'entrée, section catégories billets (dynamic-list), section table, section guest list, section comptoir, section options.
- Boutons : Enregistrer brouillon, Publier, Fermer, Annuler (selon status).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Enregistrer | submit | `POST /events` ou `PATCH /events/:id` |
| Ajouter catégorie | bouton | nouvelle ligne dynamic-list |
| Publier | bouton (si draft) | `POST /events/:id/publish` |
| Fermer (sold out manuel) | bouton (si published) | `POST /events/:id/close` |
| Annuler | bouton (avec confirmation) | `POST /events/:id/cancel` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| form-field | `@platform/core/components/form-field` | inputs |
| photo-uploader | `@platform/core/components/photo-uploader` | cover image |
| dynamic-list | `@platform/core/components/dynamic-list` | catégories billets |
| datetime-picker | `@platform/core/components/datetime-picker` | start/end |

## Composants internes (non réutilisables)

- `<AccessModesEditor>` : activation `TICKET`, `TABLE`, `GUEST_LIST`, `COUNTER`, `HYBRID`.
- `<EntryPolicyEditor>` : ticket requis, QR ou lookup, heure limite d'arrivée.
- `<GuestListPolicyEditor>` : approval mode, qrEnabled, groupSizeMax.
- `<CounterPolicyEditor>` : approval mode, minSpend, acompte éventuel.
- `<TicketCategoryRow>` : code (STD/VIP/TBL), nom, prix, capacité, maxPerOrder.
- `<EventStatusTimeline>` : affichage visuel des transitions draft→published→closed/cancelled.

## Validations et règles métier

- `startAt < endAt`, durée raisonnable < 24h.
- `cover` obligatoire avant publication.
- Avant publication, au moins un canal doit être activé : billetterie, table, guest list ou comptoir.
- Si `accessModes` contient `TICKET`, `ticketing.enabled=true` est requis.
- Si `accessModes` contient `TABLE` ou `HYBRID`, `tables.enabled=true` est requis.
- Si `accessModes` contient `GUEST_LIST`, `guestList.enabled=true` est requis.
- Si `accessModes` contient `COUNTER`, `counter.enabled=true` est requis.
- Si `entryPolicy.ticketRequired=true`, l'event doit exposer `TICKET` ou `HYBRID`.
- Somme des capacités catégories ≤ `event.capacity` total.
- Codes catégories normalisés : `STD`, `VIP`, `TBL` ou custom (max 5 catégories).
- Annulation possible seulement si pas de tickets vendus, sinon obligation de support manuel (V1).
- Closing : ne change pas la billetterie déjà vendue, juste empêche nouveaux achats.

## Topics realtime

Aucun direct. Les changements broadcast vers les pages publiques via `/topic/venue/{venueId}/events` et `/topic/event/{eventId}/availability` côté serveur.

## i18n

- `layali.pro.event-edit.section.identity`
- `layali.pro.event-edit.section.access-modes`
- `layali.pro.event-edit.section.entry-policy`
- `layali.pro.event-edit.section.categories`
- `layali.pro.event-edit.section.guest-list`
- `layali.pro.event-edit.section.counter`
- `layali.pro.event-edit.cta.publish`
- `layali.pro.event-edit.cta.close`
- `layali.pro.event-edit.cta.cancel`
- `layali.pro.event-edit.confirm.cancel`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. ADMIN peut éditer comme OWNER.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une transition invalide (ex: `POST /publish` sur un event sans catégorie) reçoit 422 avec message clair, sans changer l'état UI.
- [ ] Un event peut être publié même sans billetterie si la soirée expose uniquement `GUEST_LIST` ou `COUNTER`.
- [ ] L'annulation est soumise à une dialog de confirmation forte ; un event avec tickets vendus reçoit 409 et un message explicite "contacter support".
- [ ] Les catégories existantes vendues ne peuvent pas voir leur prix modifié à la baisse (422 attendu).

## Open questions

- Custom codes catégorie : autorisés ou liste fermée ? Décision provisoire : liste fermée + 2 custom max.
- Une soirée `HYBRID` doit-elle forcer la création d'un mini flow de synchronisation entre booking et ticketing côté pro ?
