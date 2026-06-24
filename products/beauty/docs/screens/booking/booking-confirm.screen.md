---
specVersion: 1
kind: screen
appId: beauty
screenId: booking-confirm
name: Confirmation du RDV
status: stable
route: /booking/:bookingId/confirm
layout: booking-layout
zone: booking
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

# Confirmation du RDV

## Intent

Écran final du wizard (step 3/3) : confirme la création du RDV (cash ou payé), affiche la référence, récap et CTA (ajouter au calendrier, retour à mes RDV, partager).

## Route et accès

- Route : `/booking/:bookingId/confirm`
- Layout : `booking-layout` (stepper 3/3 ✓)
- Auth : required
- Rôles autorisés : CUSTOMER (propriétaire)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking | [GET /api/v1/bookings/:bookingId](../../api/bookings.api.md#GET-/api/v1/bookings/:bookingId) | onInit + polling 2s × max 15 pour CONFIRMED si arrivée depuis paiement | mémoire |
| ICS | [GET /api/v1/bookings/:bookingId/ics](../../api/bookings.api.md#GET-/api/v1/bookings/:bookingId/ics) | à la demande (bouton calendrier) | — |

## Mock API consommée

- `GET /api/v1/bookings/:bookingId`
- `GET /api/v1/bookings/:bookingId/ics`

## États

### loading
- Skeleton confetti + récap.

### empty
- N/A.

### error
- 404 booking → "Réservation introuvable" + retour `/`.
- Polling timeout (paiement encore PENDING après 30s) → message "Paiement en cours" + bouton "Voir mes RDV".
- Booking `CANCELLED` (échec paiement) → message "Le paiement a échoué" + bouton "Réessayer".

### success
- Header : illustration succès, "Réservation confirmée".
- Référence visible (ex `BK-A4F8`) avec bouton copier.
- Récap : salon (avec photo et adresse), service, durée, staff, date+heure, montant (et statut `PAID_ONLINE` / `PAID_CASH` / cash à régler sur place).
- Mention SMS : "Un SMS de confirmation vous a été envoyé".
- Rappel : "Un rappel SMS sera envoyé la veille".
- CTAs : "Ajouter au calendrier" (ICS), "Voir l'itinéraire" (deep link maps), "Voir mes RDV" (nav `/me/bookings`), "Partager" (Web Share API).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Copier référence | clic | clipboard + toast |
| Ajouter au calendrier | bouton | téléchargement fichier `.ics` |
| Itinéraire | bouton | ouverture native maps (geo:) |
| Voir mes RDV | bouton | navigation `/me/bookings` |
| Partager | bouton | Web Share API (titre + lien public salon) |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-booking | `@platform/core/layouts/booking` | stepper terminé |

## Composants internes (non réutilisables)

- `<SuccessHero>` : illustration + titre.
- `<BookingRecapCard>` : réutilisable depuis `booking-payment`.
- `<ConfirmActionsRow>` : bouton row d'actions secondaires.

## Validations et règles métier

- Polling status `CONFIRMED` lorsqu'on arrive depuis le retour paiement (`?from=payment`) : intervalle 2s, max 15 tentatives.
- Si paiement cash, pas de polling — le booking est déjà `CONFIRMED`.
- Mention rappel SMS uniquement si `salon.reminderEnabled` et `customer.locale` supporté.
- Bloc "Annulation possible jusqu'à" affiche la deadline d'annulation gratuite (fenêtre salon).

## i18n

- Clés : `beauty.confirm.title`, `beauty.confirm.ref`, `beauty.confirm.recap`, `beauty.confirm.paid.online`, `beauty.confirm.paid.cash`, `beauty.confirm.sms.sent`, `beauty.confirm.reminder.j1`, `beauty.confirm.cta.ics`, `beauty.confirm.cta.maps`, `beauty.confirm.cta.bookings`, `beauty.confirm.cta.share`, `beauty.confirm.error.paymentTimeout`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états.
- [ ] Le polling cesse dès que `CONFIRMED` ou après 30s timeout.
- [ ] L'ICS téléchargé contient un VEVENT avec date, lieu, organisateur.
- [ ] Le bouton itinéraire ouvre l'app maps native avec lat/lng.
- [ ] Web Share API tombe en fallback "copier le lien" si non supportée.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Notification push (PWA) au moment de la confirmation : V2.
- Ajout au Wallet (carte de visite RDV) : V2.
- Suggestion "Réserver ce service à nouveau dans 4 semaines" : V2.
