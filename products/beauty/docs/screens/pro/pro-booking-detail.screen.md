---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-booking-detail
name: Détail RDV (pro)
status: stable
route: /pro/bookings/:bookingId
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN, STAFF]
auth: required
flowRefs: []
apiRefs:
  - ../../api/bookings.api.md
  - ../../api/payments.api.md
  - ../../api/customers.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Détail RDV (pro)

## Intent

Vue détaillée d'un RDV côté pro : actions du cycle de vie (arrivé, terminé, no-show, annuler, replanifier), notes internes, infos paiement, refund, profil client consolidé.

## Route et accès

- Route : `/pro/bookings/:bookingId`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN (full), STAFF (uniquement ses RDV)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking | [GET /api/v1/bookings/:bookingId](../../api/bookings.api.md#GET-/api/v1/bookings/:bookingId) | onInit | mémoire |
| Payment lié | [GET /api/v1/payments/:paymentId](../../api/payments.api.md) | onInit si paymentId | mémoire |
| Profil client consolidé (vue pro) | [GET /api/v1/pro/customers/:customerId](../../api/customers.api.md) | onInit | session |

## Mock API consommée

- `GET /api/v1/bookings/:bookingId`
- `GET /api/v1/payments/:paymentId`
- `GET /api/v1/pro/customers/:customerId`
- `PATCH /api/v1/pro/bookings/:bookingId` (notes internes, staff, startAt)
- `PATCH /api/v1/pro/bookings/:bookingId/status`
- `POST /api/v1/bookings/:bookingId/cancel`
- `POST /api/v1/bookings/:bookingId/reschedule`
- `POST /api/v1/payments/:paymentId/refund`

## États

### loading
- Skeleton header + cards.

### empty
- N/A.

### error
- 404 → retour `/pro/bookings`. 403 → page Forbidden. 503 → retry.

### success
- Header : référence, badge statut, badge paiement, ligne d'actions contextuelle.
- Carte Client : nom, téléphone (CTA appel), email, historique RDV au salon (nb total + dernier), notes internes salon (vue pro consolidée).
- Carte RDV : service snapshot, durée, staff (changeable), date+heure, prix.
- Carte Paiement : provider, statut, amount, lien reçu, bouton refund (selon règles).
- Notes internes pro : éditeur inline.
- Notes client : visible (lecture seule).
- Timeline : créé, payé, confirmé, arrivé, terminé / no-show / annulé.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Marquer arrivé | bouton (CONFIRMED) | `PATCH /status` `ARRIVED` |
| Marquer terminé | bouton (ARRIVED) | `PATCH /status` `COMPLETED` (+ pts fidélité auto) |
| Marquer no-show | bouton (CONFIRMED + après startAt) | dialog confirm → `PATCH /status` `NO_SHOW` |
| Annuler | bouton | dialog raison → `POST /cancel` |
| Replanifier | bouton | dialog choisir nouveau créneau → `POST /reschedule` |
| Changer de staff | inline | `PATCH /pro/bookings/:id` |
| Modifier notes internes | inline | `PATCH /pro/bookings/:id` |
| Refund | bouton | dialog montant + raison → `POST /payments/:id/refund` |
| Appeler client | bouton tel | `tel:` |
| Voir client | lien | nav `/pro/customers/:customerId` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-pro | `@platform/core/layouts/pro` | sidebar |

## Composants internes (non réutilisables)

- `<ProBookingActions>` : actions contextuelles selon statut.
- `<ProBookingTimeline>` : timeline historique.
- `<RefundDialog>` : amount slider + raison.
- `<RescheduleDialog>` : sélecteur nouveau créneau.

## Validations et règles métier

- Transitions de statut respectent l'automate (`PENDING_PAYMENT → CONFIRMED → ARRIVED → COMPLETED` etc.).
- STAFF : actions limitées (arrivé, terminé, no-show pour le sien) ; pas d'annulation pro.
- ADMIN : pas de refund (selon politique).
- Refund max = `amountMinor - sumRefunds`.
- Changement de staff vérifie dispo.
- Replanification : crée un nouveau créneau, annule le précédent (ou mutation selon API).

## i18n

- Clés : `beauty.proBookingDetail.title`, `beauty.proBookingDetail.section.client`, `beauty.proBookingDetail.section.rdv`, `beauty.proBookingDetail.section.payment`, `beauty.proBookingDetail.section.notes`, `beauty.proBookingDetail.cta.markArrived`, `beauty.proBookingDetail.cta.markCompleted`, `beauty.proBookingDetail.cta.markNoShow`, `beauty.proBookingDetail.cta.cancel`, `beauty.proBookingDetail.cta.reschedule`, `beauty.proBookingDetail.cta.refund`, `beauty.proBookingDetail.timeline.<step>`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Les actions sont contextuelles au statut courant.
- [ ] STAFF n'a pas accès aux RDV d'autres staffs (403).
- [ ] Le refund partiel met à jour `payment.refunds[]` et `paymentStatus`.
- [ ] La timeline affiche tous les événements historiques (dont replanification).
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Mode "Mark all completed" à fin de journée : V2.
- Audit log lecture/écriture pour OWNER : V2.
- SMS manuel depuis cette fiche : V2.
