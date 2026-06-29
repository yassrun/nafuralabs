---
specVersion: 1
kind: flow
appId: layali
flowId: customer-counter-booking
name: Réservation comptoir / bar spot (client)
status: review
actor: CUSTOMER
trigger: bouton "Réserver au comptoir" depuis venue-detail.screen ou event-detail.screen
screensRefs:
  - ../screens/discovery/venue-detail.screen.md
  - ../screens/booking/counter-booking-create.screen.md
  - ../screens/booking/counter-booking-review.screen.md
  - ../screens/booking/counter-booking-confirm.screen.md
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
apiRefs:
  - ../api/venues.api.md
  - ../api/events.api.md
  - ../api/bookings.api.md
  - ../api/payments.api.md
  - ../api/auth.api.md
---

# Réservation comptoir / bar spot (client)

> **P1 walkthrough :** suivre les étapes UI ci-dessous ; données = [fixtures.md](../fixtures.md). Colonnes « Mock API » = référence **P3** uniquement.

## Objectif

Le client réserve un accès de type `COUNTER` pour un comptoir, un bar spot ou une zone debout premium, avec un parcours plus léger qu'une réservation de table et des règles de paiement ou de validation dépendantes du lieu.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme jusqu'à la confirmation ou au paiement).
- Contexte : depuis la fiche venue ou la fiche event, mobile principalement, souvent pour un petit groupe ou une sortie plus spontanée.

## Préconditions

- Le venue accepte les réservations en ligne.
- Le mode d'accès `COUNTER` est disponible pour la date ou la soirée visée.
- L'event (si lié) est `PUBLISHED` et `startAt > now`.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [venue-detail](../screens/discovery/venue-detail.screen.md) | clic "Réserver au comptoir" | — | → 2 |
| 2 | [counter-booking-create](../screens/booking/counter-booking-create.screen.md) | choisit date, heure d'arrivée, taille du groupe, éventuelle zone comptoir ; peut signaler une occasion (`BIRTHDAY`) ; saisit notes | `GET /venues/:slug`, `GET /events/:slug` (si event), `POST /bookings/draft` | 409 `access_unavailable` → message et retour formulaire ; 201 → 3 |
| 3 | client non authentifié ? | si oui : redirection login/register | — | non auth → 4 ; auth → 5 |
| 4 | [login](../screens/account/login.screen.md) ou [register](../screens/account/register.screen.md) | login email/password ou OTP | `POST /auth/login`, `POST /auth/otp/*`, `POST /auth/register` | succès → 5 ; abandon → draft expire (15 min) |
| 5 | [counter-booking-review](../screens/booking/counter-booking-review.screen.md) | relit le draft, accepte les conditions, puis soit confirme la réservation, soit paie si requis | `GET /bookings/draft/:draftId`, `POST /bookings`, `POST /payments/initiate` | pas de paiement requis → 6 ; paiement requis → 7 ; 409 `approval_pending` ou `payment_pending` → 6 |
| 6 | [counter-booking-confirm](../screens/booking/counter-booking-confirm.screen.md) | voit le statut `CONFIRMED` ou `PENDING` | `GET /bookings/:id` | `CONFIRMED` → QR et récap ; `PENDING` → message "En attente de validation" |
| 7 | écran 3DS provider (hors Layali) | s'authentifie 3DS | webhook `POST /payments/webhook/cmi\|stripe` (côté backend) | succès → 6 ; échec → retour étape 5 |

## États globaux du flow

- En cours : draft `DRAFT` côté backend, TTL 15 min.
- En attente : booking `PENDING` avec `approvalStatus=PENDING` si le lieu valide manuellement le comptoir ou la zone.
- Confirmé : booking `CONFIRMED`, avec QR si le lieu l'utilise à l'entrée.
- Abandonné : draft expiré, demande rejetée, ou paiement abandonné.

## Erreurs et reprises

- Connexion perdue après `POST /bookings/draft` : conservation du `draftId` en sessionStorage et reprise à l'étape 5 dans la fenêtre TTL.
- Paiement refusé : retour étape 5 avec message, draft conservé.
- Aucune zone comptoir précise disponible : le lieu peut traiter la réservation comme quota global `COUNTER` sans ressource nommée.
- Tenant suspendu pendant le flow : 423 → message "Réservation indisponible pour ce venue" + redirection home.
- Event annulé pendant le flow : 409 → message clair ; remboursement si un paiement a déjà été capturé.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Le flow supporte les trois cas : sans paiement, avec paiement, avec validation manuelle.
- [ ] Le flow fonctionne avec ou sans `accessResourceId` si le lieu n'a pas de zone comptoir nommée.
- [ ] Les erreurs ne perdent pas `groupSize`, `arrivalAt`, `occasion` ni `customerNotes`.
- [ ] Une réservation anniversaire peut aussi être portée sur le mode `COUNTER`.

## Open questions

- Le comptoir est-il modélisé comme quota global ou comme zones nommées par lieu ?
- Le minimum spend comptoir doit-il être stocké comme `minSpendMinor` ou via un tarif dédié distinct ?
- Un comptoir confirmé sans paiement doit-il toujours générer un QR ?