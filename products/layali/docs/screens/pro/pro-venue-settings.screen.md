---
specVersion: 1
kind: screen
appId: layali
screenId: pro-venue-settings
name: Paramètres venue
status: review
route: /pro/venue
layout: pro-shell
zone: pro
roles: [OWNER]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - venues#GET-/venues/:slug
  - venues#PATCH-/venues/:id
  - venues#POST-/venues/:id/photos
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/photo-uploader"
    - "@platform/core/components/tags-input"
    - "@platform/core/components/opening-hours-editor"
  patterns:
    - "pro/settings-form"
---

# Paramètres venue

## Intent

Permettre au propriétaire de configurer son lieu : identité, photos, ambiance, horaires d'ouverture, et surtout modes d'accès par défaut du venue (`TABLE`, `GUEST_LIST`, `COUNTER`, `WALK_IN`), règles d'entrée, politique guest list, politique comptoir, et fallback check-in.

## Route et accès

- Route : `/pro/venue`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER (ADMIN en lecture seule)
- Tenant requis : oui (`X-Tenant-Id`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Venue détaillé | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session |
| Photos | inclus dans le venue | onInit | invalidé après upload |

## Mock API consommée

- `GET /api/v1/venues/:slug` (résolu côté backend depuis `X-Tenant-Id`)
- `PATCH /api/v1/venues/:id`
- `POST /api/v1/venues/:id/photos` (multipart)
- `DELETE /api/v1/venues/:id/photos/:photoId`

## États

### loading
- Form skeleton.

### empty
- N/A (venue toujours existant).

### error
- 403 si ADMIN tente PATCH : afficher en lecture seule.
- 422 : erreurs par champ.

### success
- Form édition divisé en sections : Identité, Photos, Ambiance, Horaires, Modes d'accès, Guest list, Comptoir, Check-in & lookup, Paiement, Annulation, Statut public.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Enregistrer section | submit section | `PATCH /venues/:id` partiel |
| Uploader photo | drag/drop | `POST /venues/:id/photos` |
| Supprimer photo | bouton | `DELETE /venues/:id/photos/:photoId` |
| Publier / dépublier venue | toggle | `PATCH /venues/:id` `{ public: bool }` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| form-field | `@platform/core/components/form-field` | inputs |
| photo-uploader | `@platform/core/components/photo-uploader` | upload multi-fichiers |
| tags-input | `@platform/core/components/tags-input` | ambiance |
| opening-hours-editor | `@platform/core/components/opening-hours-editor` | horaires |

## Composants internes (non réutilisables)

- `<AccessModesEditor>` : activation des modes `TABLE`, `GUEST_LIST`, `COUNTER`, `WALK_IN`.
- `<GuestListPolicyEditor>` : approval mode, taille max de groupe, QR activé ou non.
- `<CounterPolicyEditor>` : zones nommées ou quota global, minimum spend, acompte éventuel.
- `<CheckinPolicyEditor>` : QR requis, lookup fallback, heure limite d'arrivée.
- `<DepositPolicyEditor>` : toggle accepte acompte + % acompte (10-100).
- `<CancellationPolicyEditor>` : cutoff en heures (0-72).

## Validations et règles métier

- Nom unique au sein de la ville (vérif backend, 409 retourné côté UI).
- Capacité totale > 0.
- Horaires : pas de chevauchement, fermé un jour autorisé.
- Au moins un mode d'accès doit être explicite : mode digital (`TABLE`, `GUEST_LIST`, `COUNTER`) ou `WALK_IN`.
- Si `GUEST_LIST` est activé, une politique `approvalMode` doit être définie.
- Si `COUNTER` est activé, le lieu doit préciser `counterNamedZones=true|false`.
- `fallbackLookup=true` est recommandé dès qu'un check-in QR est activé.
- % acompte entre 10 et 100.
- Cancellation cutoff entre 0 et 72h.
- Photos : max 20, formats JPEG/WebP, < 5 Mo chacune.

## Topics realtime

Aucun. Les modifications sont propagées via REST + revalidate côté client.

## i18n

- `layali.pro.venue.section.identity`
- `layali.pro.venue.section.photos`
- `layali.pro.venue.section.ambiance`
- `layali.pro.venue.section.hours`
- `layali.pro.venue.section.access-modes`
- `layali.pro.venue.section.guest-list`
- `layali.pro.venue.section.counter`
- `layali.pro.venue.section.checkin`
- `layali.pro.venue.section.payment`
- `layali.pro.venue.section.cancellation`
- `layali.pro.venue.cta.publish`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise + rôle OWNER en édition. ADMIN voit le même écran en lecture seule (tous les inputs `disabled`).
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une 422 retourne des erreurs ciblées par champ (`details[].field`) sans réinitialiser les autres champs.
- [ ] L'upload d'une phote > 5 Mo est rejeté côté UI avant l'envoi (taille calculée).
- [ ] Les modes d'accès par défaut, la politique guest list et la politique comptoir sont persistés via `PATCH /venues/:id`.
- [ ] Le tenant courant ne peut pas modifier un autre venue (vérifié backend ; 403 attendu sinon).

## Open questions

- Choix de plusieurs ambiances simultanées (max 5) ou ambiance principale + secondaires ? Décision provisoire : 5 tags max, pas de hiérarchie.
- Le fallback lookup doit-il être obligatoire pour tous les lieux en V1, même si le lieu déclare un check-in QR strict ?
