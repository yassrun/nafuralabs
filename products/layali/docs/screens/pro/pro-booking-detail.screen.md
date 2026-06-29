---
specVersion: 1
kind: screen
appId: layali
screenId: pro-booking-detail
name: Détail réservation (pro)
status: review
phase: P1
p1MobileId: pro-booking-detail
p1Impl: mock
route: /pro/bookings/:bookingId
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN, BAR_MANAGER]
auth: required
flowRefs: []
apiRefs:
  - bookings#GET-/bookings/:id
  - bookings#PATCH-/bookings/:id
  - bookings#PATCH-/bookings/:id/cancel
  - bookings#POST-/bookings/:id/approve
  - bookings#POST-/bookings/:id/reject
  - bookings#POST-/bookings/:id/mark-arrived
  - bookings#POST-/bookings/:id/mark-no-show
  - payments#GET-/payments/:paymentId
  - payments#POST-/payments/:paymentId/refund
topicRefs:
  - /topic/tenant/{tenantId}/bookings
abstractions:
  components:
    - "@platform/core/components/summary-card"
    - "@platform/core/components/timeline"
    - "@platform/core/components/badge"
    - "@platform/core/components/dialog"
  patterns:
    - "pro/detail"
---

# Détail réservation (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-booking-detail` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/pro/bookings/:ref)*


## Intent

Visualiser et opérer une réservation d'accès reçue par le venue : table, guest list, comptoir ou hybride. L'écran couvre statuts, validation, paiement, occasion client, notes, et actions (approve/reject, arrivé, no-show, annuler, replanifier ressource, refund partiel).

## Route et accès

- Route : `/pro/bookings/:bookingId`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN (full), BAR_MANAGER (lecture seule)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking | [bookings API](../../api/bookings.api.md) `GET /bookings/:id` | onInit | session 30s |
| Payment lié | [payments API](../../api/payments.api.md) `GET /payments/:paymentId` | onInit (si paymentId) | session |

## Mock API consommée

- `GET /api/v1/bookings/:bookingId`
- `PATCH /api/v1/bookings/:id` (replanification table / notes internes)
- `PATCH /api/v1/bookings/:id/cancel`
- `POST /api/v1/bookings/:id/mark-arrived`
- `POST /api/v1/bookings/:id/mark-no-show`
- `POST /api/v1/payments/:paymentId/refund`
- Topic : `/topic/tenant/{tenantId}/bookings` (mise à jour live de ce booking si modifié ailleurs)

## États

### loading
- Skeleton header + 3 cartes (booking, client, paiement) + timeline.

### empty
- N/A (404 si booking introuvable).

### error
- 401 → login. 403 `tenant_mismatch` → page d'erreur dédiée. 404 → "Réservation introuvable" + retour `/pro/bookings`.

### success
- Header : ref `BKG-A4F8`, badge statut, badge paiement, ligne d'actions selon statut courant.
- Carte Booking : `accessMode`, ressource snapshot (table, guest list, comptoir), groupSize, arrivalAt, event lié (lien), depositMinor, minSpendMinor, `specialNight`, `approvalStatus`.
- Carte Client : nom, téléphone, email (avec actions appeler/copier), `occasion`, `celebrantName` si anniversaire, `customerNotes` en visible.
- Carte Paiement : provider, statut, amount, reçu téléchargeable, bouton refund (full/partial) si éligible.
- Bloc Notes internes pro : édition inline.
- Timeline : créé, payé, confirmé, arrivé/no-show, annulé. Historique des replanifications.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Approuver | bouton (si `approvalStatus=PENDING`) | `POST /approve` |
| Rejeter | bouton (si `approvalStatus=PENDING`) | dialog raison → `POST /reject` |
| Marquer arrivé | bouton (statut `CONFIRMED`) | `POST /mark-arrived` → statut `ARRIVED` |
| Marquer no-show | bouton (statut `CONFIRMED` + après arrivalAt) | dialog confirmation → `POST /mark-no-show` |
| Annuler | bouton (statut `CONFIRMED`/`PENDING`) | dialog avec champ raison → `PATCH /cancel` |
| Changer de ressource d'accès | bouton | dialog sélecteur de table ou zone comptoir selon `accessMode` → `PATCH /bookings/:id` |
| Modifier notes internes | éditeur inline | `PATCH /bookings/:id` (`internalNotes`) |
| Refund partiel/total | bouton | dialog amount + raison → `POST /payments/:id/refund` |
| Imprimer fiche | bouton | `window.print()` avec template print |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| summary-card | `@platform/core/components/summary-card` | cartes booking/client/paiement |
| timeline | `@platform/core/components/timeline` | historique |
| badge | `@platform/core/components/badge` | statuts |
| dialog | `@platform/core/components/dialog` | confirmations actions destructives |

## Composants internes (non réutilisables)

- `<BookingActionsBar>` : barre d'actions contextuelle (visible selon statut).
- `<AccessModeSummary>` : bloc synthétique mode d'accès + règles d'entrée.
- `<ApprovalDecisionDialog>` : approve/reject avec raison.
- `<RefundDialog>` : dialog refund avec slider amount.
- `<ResourceChangeDialog>` : sélecteur de table ou zone disponible filtré par capacité ≥ groupSize.

## Validations et règles métier

- Annulation : si `status=ARRIVED`, bouton désactivé.
- No-show : disponible uniquement si `now > arrivalAt + 30min` et `status=CONFIRMED`.
- Approve/reject : visible uniquement si `approvalStatus=PENDING`.
- Refund : montant max = `payment.amountMinor - sum(refunds.amountMinor)`.
- BAR_MANAGER : tous les boutons d'action sont cachés ; lecture seule.
- Si `occasion=BIRTHDAY`, le bloc client doit rendre le cas explicitement visible sans ouvrir les notes.
- Changement de ressource : impossible si `status=ARRIVED|NO_SHOW|CANCELLED`.

## Topics realtime

- `/topic/tenant/{tenantId}/bookings` : si `booking.id == ce booking` → refresh complet ; si `booking.cancelled` arrive d'ailleurs, MAJ statut et toast.

## i18n

- `layali.pro.booking.title`
- `layali.pro.booking.actions.approve`
- `layali.pro.booking.actions.reject`
- `layali.pro.booking.actions.markArrived`
- `layali.pro.booking.actions.markNoShow`
- `layali.pro.booking.actions.cancel`
- `layali.pro.booking.actions.refund`
- `layali.pro.booking.actions.changeTable`
- `layali.pro.booking.timeline.created`
- `layali.pro.booking.timeline.paid`
- `layali.pro.booking.timeline.arrived`
- `layali.pro.booking.timeline.noShow`
- `layali.pro.booking.timeline.cancelled`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Les actions sont contextuelles au statut courant (boutons inappropriés masqués ou désactivés).
- [ ] BAR_MANAGER n'a aucune action mutable (vérifié par le composant et le guard).
- [ ] Le refund respecte le solde restant (slider borné).
- [ ] Le mode d'accès, l'occasion et l'état de validation sont visibles sans dépendre des notes libres.
- [ ] Aucun appel hors `apiRefs`.
- [ ] La mise à jour realtime du booking ne casse pas le formulaire de notes internes en cours d'édition (merge prudent).

## Open questions

- Envoi manuel d'un SMS de rappel depuis cette fiche : V1 ou V2 ? Décision provisoire : V2.
- Les hôtes (`HOST`) doivent-ils accéder à une version simplifiée de cette fiche depuis `pro-door-checkin`, ou rester limités au plein écran door ?
- Historique conversation client (messagerie in-app) : V3.
