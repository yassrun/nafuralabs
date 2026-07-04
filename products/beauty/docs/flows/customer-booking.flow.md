---
specVersion: 1
kind: flow
appId: beauty
flowId: customer-booking
name: Réservation d'un RDV (client)
status: stable
actor: CUSTOMER
trigger: bouton "Réserver" depuis home, salon-detail, salon-search, service-list ou customer-bookings
screensRefs:
  - ../screens/discovery/home.screen.md
  - ../screens/discovery/salon-detail.screen.md
  - ../screens/discovery/service-list.screen.md
  - ../screens/booking/booking-create.screen.md
  - ../screens/booking/booking-payment.screen.md
  - ../screens/booking/booking-confirm.screen.md
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
apiRefs:
  - ../api/salons.api.md
  - ../api/services.api.md
  - ../api/staff.api.md
  - ../api/bookings.api.md
  - ../api/payments.api.md
  - ../api/auth.api.md
---

# Réservation d'un RDV (client)

> **P1 walkthrough :** suivre les étapes UI ci-dessous ; données = [fixtures.md](../fixtures.md). Colonnes « Mock API » = référence **P3** uniquement.

## Objectif

Le client choisit un salon, un service, un staff, un créneau, paie (online ou cash) et reçoit la confirmation par SMS + email. Le RDV apparaît dans `/me/bookings`.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme jusqu'au paiement online ou jusqu'au submit final cash).
- Contexte : mobile-first, souvent en mobilité, parfois urgent (même jour).

## Préconditions

- Salon `status=PUBLISHED` et `acceptsOnlineBooking=true`.
- Au moins 1 service `PUBLISHED` et 1 staff actif autorisé.
- Au moins 1 créneau disponible dans les 14 prochains jours pour le combo service+staff demandé.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [home](../screens/discovery/home.screen.md) ou [salon-search](../screens/discovery/salon-search.screen.md) | recherche ou clic salon populaire | `GET /salons?city=&category=...` | salon trouvé → 2 ; aucun → message empty |
| 2 | [salon-detail](../screens/discovery/salon-detail.screen.md) | consulte fiche, clic "Réserver" | `GET /salons/:slug` | → 3 |
| 3 | [booking-create](../screens/booking/booking-create.screen.md) — step 1 | choisit service | `GET /salons/:slug/services` | → step 2 |
| 4 | [booking-create](../screens/booking/booking-create.screen.md) — step 2 | choisit staff (ou "Indifférent") | `GET /salons/:slug/staff` | → step 3 |
| 5 | [booking-create](../screens/booking/booking-create.screen.md) — step 3 | choisit date + créneau + mode paiement | `GET /salons/:slug/availability?serviceId=&staffId=&date=` | → 6 |
| 6 | check auth | non connecté → forcé login/register | — | non auth → 7 ; auth → 8 |
| 7 | [login](../screens/account/login.screen.md) ou [register](../screens/account/register.screen.md) | s'authentifie | `POST /auth/*` | succès → 8 ; abandon → flow perdu (état conservé en sessionStorage 30 min) |
| 8 | submit final | `POST /bookings` avec mode paiement choisi | `POST /bookings` (Idempotency-Key) | si cash → booking `CONFIRMED` → 11 ; si online → booking `PENDING_PAYMENT` + payment créé → 9 |
| 9 | [booking-payment](../screens/booking/booking-payment.screen.md) | clic "Payer" → redirection 3DS | `redirectUrl` provider | → 10 |
| 10 | écran 3DS provider | s'authentifie | webhook `POST /payments/webhook/cmi\|stripe` | succès → 11 ; échec → retour 9 ; timeout → cancel auto (booking `CANCELLED`) |
| 11 | [booking-confirm](../screens/booking/booking-confirm.screen.md) | affiche récap + référence | `GET /bookings/:id` (polling si arrivé du paiement) | `CONFIRMED` → 12 ; timeout polling → page "Paiement en cours" + lien `/me/bookings` |
| 12 | SMS + email de confirmation | — | `:platform:integrations:sms`, `:platform:integrations:email` | fin |

## États globaux du flow

- En cours : booking `PENDING_PAYMENT` (online) ; conservé jusqu'au timeout configurable (10 min).
- Sauvegardé : booking `CONFIRMED`, accessible via `/me/bookings`.
- Abandonné : 
  - paiement online timeout 10 min → `CANCELLED` automatique.
  - paiement online refusé : booking reste `PENDING_PAYMENT`, ré-essai possible jusqu'au timeout.
  - cash : pas de notion d'abandon (CONFIRMED immédiat au submit).

## Erreurs et reprises

- Réseau perdu après step 1-5 : sélection conservée en sessionStorage, reprise possible 30 min.
- 409 au `POST /bookings` (créneau pris pendant la saisie) → retour step 5 avec refresh availability.
- 409 sur transition status pendant le payment polling (rare) : message + lien `/me/bookings`.
- Webhook paiement reçu en doublon : déduplication via `Idempotency-Key` (jamais double `CONFIRMED`).
- Tenant `SUSPENDED` pendant le flow : 423 → page neutre + redirection home.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Le flow peut être repris après login/register si l'utilisateur n'était pas connecté (sessionStorage).
- [ ] Les états d'erreur ne perdent pas la saisie utilisateur.
- [ ] Le booking cash arrive direct à `CONFIRMED` sans page paiement.
- [ ] Le booking online passe par `PENDING_PAYMENT` puis `CONFIRMED` au webhook.
- [ ] Le SMS de rappel est planifié J-1 à la création (côté backend, queue).
- [ ] L'ICS contient les bonnes données VEVENT (lieu, organisateur, dates).

## Open questions

- Multi-services par RDV (couleur + brushing) : V2.
- Multi-staff par RDV : V2.
- Pré-paiement obligatoire personnalisable par salon (`requireOnlinePayment`) : V1 supporté, par défaut false.
- Politique de refund partiel pour annulation après paiement : V1 = remboursement total dans la fenêtre, V2 personnalisable par salon.
