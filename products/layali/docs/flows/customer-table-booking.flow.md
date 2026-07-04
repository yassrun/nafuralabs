---
specVersion: 1
kind: flow
appId: layali
flowId: customer-table-booking
name: Réservation d'une table (client)
status: review
actor: CUSTOMER
trigger: bouton "Réserver une table" depuis venue-detail.screen ou event-detail.screen
screensRefs:
  - ../screens/discovery/venue-detail.screen.md
  - ../screens/booking/table-booking-create.screen.md
  - ../screens/booking/table-booking-payment.screen.md
  - ../screens/booking/table-booking-confirm.screen.md
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
apiRefs:
  - ../api/venues.api.md
  - ../api/events.api.md
  - ../api/tables.api.md
  - ../api/bookings.api.md
  - ../api/payments.api.md
  - ../api/auth.api.md
---

# Réservation d'une table (client)

> **P1 walkthrough :** suivre les étapes UI ci-dessous ; données = [fixtures.md](../fixtures.md). Colonnes « Mock API » = référence **P3** uniquement.

## Objectif

Le client identifie une table dans un venue (avec ou sans event lié), réserve un accès de type `TABLE`, paie l'acompte si requis, reçoit son QR de confirmation par email/SMS et retrouve la réservation dans `Mes réservations`.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme jusqu'au paiement, forcé d'auth avant capture).
- Contexte : depuis la fiche venue ou la fiche event, mobile principalement, parfois pour une occasion comme un anniversaire.

## Préconditions

- Le venue `acceptsOnlineBooking=true`.
- L'event (si lié) est `PUBLISHED` et `startAt > now`.
- Le mode d'accès `TABLE` est disponible pour la date ou la soirée visée.
- Au moins une table disponible aux critères `groupSize` et `arrivalAt`.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [venue-detail](../screens/discovery/venue-detail.screen.md) | clic "Réserver une table" | — | → 2 |
| 2 | [table-booking-create](../screens/booking/table-booking-create.screen.md) | choisit date, heure d'arrivée, taille du groupe, table sur le plan ; peut signaler une occasion (`BIRTHDAY`) ; saisit notes | `GET /venues/:slug`, `GET /tables?venueSlug=&eventSlug=&availableOnly=true`, `GET /events/:slug` (si event) | aucune table dispo → message "Plus de place, voir d'autres dates" ; si soirée spéciale, afficher les règles d'accès ; sinon → 3 |
| 3 | [table-booking-create](../screens/booking/table-booking-create.screen.md) | clic "Continuer" | `POST /bookings/draft` avec `accessMode=TABLE`, `tableId`, `occasion`, `celebrantName?` et `Idempotency-Key` | 409 `table_unavailable` ou `access_unavailable` → retour étape 2 avec table marquée prise ; 201 → 4 |
| 4 | client non authentifié ? | si oui : redirection login/register | — | non auth → 5 ; auth → 6 |
| 5 | [login](../screens/account/login.screen.md) ou [register](../screens/account/register.screen.md) | login email/password ou OTP | `POST /auth/login`, `POST /auth/otp/*`, `POST /auth/register` | succès → 6 ; abandon → draft expire (15 min) |
| 6 | [table-booking-payment](../screens/booking/table-booking-payment.screen.md) | lit le récap du booking draft (table, occasion, règles du soir, acompte, minimum spend), choisit provider (CMI/Stripe), clic "Payer" | `GET /bookings/draft/:draftId`, `POST /payments/initiate` | 503 provider down → message + retry ; si la soirée impose aussi du ticket, afficher le rappel de contrainte ; 201 → redirection 3DS |
| 7 | écran 3DS provider (hors Layali) | s'authentifie 3DS | webhook `POST /payments/webhook/cmi\|stripe` (côté backend) | succès → 8 ; échec → retour `/payment` avec message |
| 8 | callback `returnUrl` → [table-booking-confirm](../screens/booking/table-booking-confirm.screen.md) | affiche QR + récap | `GET /bookings/:id` (polling jusqu'à `CONFIRMED`, max 30s) | `CONFIRMED` → 9 ; si `approvalStatus=PENDING`, afficher confirmation en attente ; timeout → page "Paiement en attente" + lien `/me/bookings` |
| 9 | confirmation reçue par email + SMS | — | `:platform:integrations:email`, `:platform:integrations:sms` (côté backend) | fin |

## États globaux du flow

- En cours : draft `DRAFT` côté backend, TTL 15 min, ressource d'accès table verrouillée temporairement.
- Sauvegardé : booking `CONFIRMED` consultable via `/me/bookings`.
- En attente : selon les règles du soir, le booking peut rester `PENDING` avec `approvalStatus=PENDING` avant validation finale.
- Abandonné : draft expiré → table relâchée auto. Payment échoué/cancelled → draft conservé jusqu'à TTL pour retry.

## Erreurs et reprises

- Connexion réseau perdue après `POST /bookings/draft` : on garde le `draftId` en sessionStorage et on reprend à l'étape 6 si l'utilisateur revient dans la fenêtre TTL.
- Paiement refusé : retour étape 6 avec message, draft conservé.
- Tentative de paiement double : `Idempotency-Key` empêche la création d'un second payment.
- Soirée spéciale avec validation complémentaire : le booking reste visible côté client comme "en attente de confirmation".
- Tenant suspendu pendant le flow : 423 → message "Réservation indisponible pour ce venue" + redirection home.
- Event annulé pendant le flow (très rare) : 409 → message + remboursement auto si capturé.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Le flow peut être repris après login/register si l'utilisateur n'était pas connecté (le draftId est conservé).
- [ ] Les états d'erreur ne perdent pas la saisie utilisateur (notes, groupSize, arrivalAt, occasion).
- [ ] Un draft expiré relâche la table et n'apparaît plus dans `/me/bookings`.
- [ ] Le QR est généré uniquement quand `paymentStatus=PAID` et `status=CONFIRMED`.
- [ ] Une réservation anniversaire remonte l'information `occasion=BIRTHDAY` et reste visible côté pro.
- [ ] Email + SMS de confirmation sont envoyés via les abstractions plateforme.

## Open questions

- Réserver sans paiement (paiement à l'arrivée) : V2 si autorisé par le venue.
- Modification de table jusqu'à H-24 : V2.
- Soirée hybride table + ticket obligatoire : flow dédié ou intégration directe dans ce flow ?
- Co-paiement (split entre amis) : V3.
