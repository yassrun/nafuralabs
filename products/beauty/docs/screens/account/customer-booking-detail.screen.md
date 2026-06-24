---
specVersion: 1
kind: screen
appId: beauty
screenId: customer-booking-detail
name: Détail d'un RDV
status: stable
route: /me/bookings/:bookingId
layout: account-layout
zone: account
roles: [CUSTOMER]
auth: required
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/bookings.api.md
  - ../../api/reviews.api.md
abstractions:
  components:
    - "@platform/core/components/rating-stars"
    - "@platform/core/i18n"
---

# Détail d'un RDV

## Intent

Vue détaillée d'un RDV du client : récap complet, statut, actions (annuler, replanifier, ajouter calendrier, contacter salon, laisser un avis si passé).

## Route et accès

- Route : `/me/bookings/:bookingId`
- Layout : `account-layout`
- Auth : required
- Rôles : CUSTOMER (propriétaire)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking | [GET /api/v1/bookings/:bookingId](../../api/bookings.api.md#GET-/api/v1/bookings/:bookingId) | onInit | mémoire |
| Avis déjà posé | [GET /api/v1/reviews/me?bookingId=...](../../api/reviews.api.md) | onInit si booking COMPLETED | session |

## Mock API consommée

- `GET /api/v1/bookings/:bookingId`
- `POST /api/v1/bookings/:bookingId/cancel`
- `POST /api/v1/bookings/:bookingId/reschedule`
- `GET /api/v1/bookings/:bookingId/ics`
- `POST /api/v1/reviews` (si écran propose laisser un avis)

## États

### loading
- Skeleton header + carte récap.

### empty
- N/A.

### error
- 404 → "Réservation introuvable" + retour `/me/bookings`. 401 → login.

### success
- Header : référence `BK-A4F8`, statut badge.
- Carte salon : photo, nom, adresse, téléphone (CTA appel), bouton itinéraire.
- Carte service : nom, durée, prix, staff (avec photo).
- Carte date+heure : date relative + horloge, fenêtre annulation rappelée.
- Carte paiement : statut, montant, méthode, lien reçu (si online).
- Notes du client (si présentes).
- Actions : "Ajouter au calendrier", "Annuler", "Replanifier", "Refaire" (passé), "Laisser un avis" (passé sans avis).
- Si avis déjà posé : affichage de l'avis avec étoiles + body, lien "Modifier".

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Annuler | bouton | dialog confirm + raison → `POST /cancel` |
| Replanifier | bouton | wizard pré-rempli |
| Ajouter calendrier | bouton | téléchargement `.ics` |
| Itinéraire | bouton | ouverture maps native |
| Appeler salon | bouton | `tel:` |
| Laisser avis | bouton (COMPLETED) | nav formulaire avis ou modal inline |
| Modifier avis | bouton (avis existant) | nav `/reviews/:id/edit` ou modal |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| rating-stars | `@platform/core/components/rating-stars` | étoiles pour avis |

## Composants internes (non réutilisables)

- `<BookingDetailHeader>` : header avec ref + status.
- `<BookingActionRow>` : ligne CTAs principaux.
- `<ReviewForm>` : formulaire avis inline (rating + textarea).
- `<ReviewDisplay>` : affichage avis posté.

## Validations et règles métier

- "Annuler" visible uniquement si `status ∈ {PENDING_PAYMENT, CONFIRMED}` et fenêtre OK.
- "Replanifier" : idem.
- "Laisser un avis" : visible si `status=COMPLETED` ET pas d'avis existant ET dans les 30 jours.
- Refund partiel automatique si annulation après paiement online (selon politique salon).

## i18n

- Clés : `beauty.bookingDetail.title`, `beauty.bookingDetail.section.salon`, `beauty.bookingDetail.section.service`, `beauty.bookingDetail.section.date`, `beauty.bookingDetail.section.payment`, `beauty.bookingDetail.cta.cancel`, `beauty.bookingDetail.cta.reschedule`, `beauty.bookingDetail.cta.ics`, `beauty.bookingDetail.cta.call`, `beauty.bookingDetail.cta.review`, `beauty.bookingDetail.cancelWindow`, `beauty.bookingDetail.refund.partial`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Les actions sont contextuelles au statut.
- [ ] L'annulation hors fenêtre est explicitement bloquée avec message clair.
- [ ] L'ICS contient les bonnes données (lieu, heure, organisateur).
- [ ] L'avis posté est immédiatement visible côté détail.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Messagerie in-app avec le salon (questions sur le RDV) : V2.
- Réservation récurrente (toutes les 4 semaines) : V2.
- Politique de refund affichée explicitement : V1 minimal, V2 améliorée.
