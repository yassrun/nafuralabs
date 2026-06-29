---
specVersion: 1
kind: flow
appId: layali
flowId: customer-guest-list-booking
name: Réservation guest list / entrée (client)
status: review
actor: CUSTOMER
trigger: bouton "Demander une guest list" depuis venue-detail.screen ou event-detail.screen
screensRefs:
  - ../screens/discovery/venue-detail.screen.md
  - ../screens/booking/guest-list-booking-create.screen.md
  - ../screens/booking/guest-list-booking-review.screen.md
  - ../screens/booking/guest-list-booking-confirm.screen.md
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
apiRefs:
  - ../api/venues.api.md
  - ../api/events.api.md
  - ../api/bookings.api.md
  - ../api/payments.api.md
  - ../api/auth.api.md
---

# Réservation guest list / entrée (client)

> **P1 walkthrough :** suivre les étapes UI ci-dessous ; données = [fixtures.md](../fixtures.md). Colonnes « Mock API » = référence **P3** uniquement.

## Objectif

Le client demande un accès de type `GUEST_LIST` pour un venue ou une soirée, renseigne son groupe et son occasion éventuelle, puis reçoit soit une confirmation immédiate, soit un statut en attente de validation, avec paiement optionnel selon les règles du lieu.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme jusqu'à la confirmation ou au paiement).
- Contexte : depuis la fiche venue ou la fiche event, mobile principalement, souvent pour une sortie de groupe.

## Préconditions

- Le venue accepte les réservations en ligne ou la guest list digitale.
- Le mode d'accès `GUEST_LIST` est disponible pour la date ou la soirée visée.
- L'event (si lié) est `PUBLISHED` et `startAt > now`.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [venue-detail](../screens/discovery/venue-detail.screen.md) | clic "Demander une guest list" | — | → 2 |
| 2 | [guest-list-booking-create](../screens/booking/guest-list-booking-create.screen.md) | choisit date, heure d'arrivée, taille du groupe ; peut signaler une occasion (`BIRTHDAY`) ; saisit notes | `GET /venues/:slug`, `GET /events/:slug` (si event), `POST /bookings/draft` | 409 `access_unavailable` → message et retour formulaire ; 201 → 3 |
| 3 | client non authentifié ? | si oui : redirection login/register | — | non auth → 4 ; auth → 5 |
| 4 | [login](../screens/account/login.screen.md) ou [register](../screens/account/register.screen.md) | login email/password ou OTP | `POST /auth/login`, `POST /auth/otp/*`, `POST /auth/register` | succès → 5 ; abandon → draft expire (15 min) |
| 5 | [guest-list-booking-review](../screens/booking/guest-list-booking-review.screen.md) | relit le draft, accepte les conditions, puis soit envoie la demande, soit paie si requis | `GET /bookings/draft/:draftId`, `POST /bookings`, `POST /payments/initiate` | pas de paiement requis → 6 ; paiement requis → 7 ; 409 `approval_pending` ou `payment_pending` → 6 |
| 6 | [guest-list-booking-confirm](../screens/booking/guest-list-booking-confirm.screen.md) | voit le statut `CONFIRMED` ou `PENDING` | `GET /bookings/:id` | `CONFIRMED` → QR et récap ; `PENDING` → message "En attente de validation" |
| 7 | écran 3DS provider (hors Layali) | s'authentifie 3DS | webhook `POST /payments/webhook/cmi\|stripe` (côté backend) | succès → 6 ; échec → retour étape 5 |

## États globaux du flow

- En cours : draft `DRAFT` côté backend, TTL 15 min.
- En attente : booking `PENDING` avec `approvalStatus=PENDING` si le lieu valide manuellement la guest list.
- Confirmé : booking `CONFIRMED`, avec QR si le lieu utilise le check-in QR pour la guest list.
- Abandonné : draft expiré, demande rejetée, ou paiement abandonné.

## Erreurs et reprises

- Connexion perdue après `POST /bookings/draft` : conservation du `draftId` en sessionStorage et reprise à l'étape 5 dans la fenêtre TTL.
- Paiement refusé : retour étape 5 avec message, draft conservé.
- Validation manuelle lente : l'écran de confirmation doit pouvoir afficher un état `PENDING` sans casser le flow.
- Tenant suspendu pendant le flow : 423 → message "Réservation indisponible pour ce venue" + redirection home.
- Event annulé pendant le flow : 409 → message clair ; remboursement si un paiement a déjà été capturé.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Le flow supporte les trois cas : sans paiement, avec paiement, avec validation manuelle.
- [ ] Le flow peut être repris après login/register si l'utilisateur n'était pas connecté.
- [ ] Les erreurs ne perdent pas `groupSize`, `arrivalAt`, `occasion` ni `customerNotes`.
- [ ] Le statut `PENDING` est affichable comme une fin de flow valide côté client.
- [ ] Une réservation anniversaire remonte `occasion=BIRTHDAY` et reste visible côté pro.

## Open questions

- La guest list est-elle auto-confirmée par défaut pour certains lieux ?
- Une guest list confirmée sans paiement doit-elle toujours générer un QR, ou seulement pour les lieux qui scannent à la porte ?
- Une soirée spéciale peut-elle imposer à la fois guest list et ticket obligatoire dans un flow lié ?