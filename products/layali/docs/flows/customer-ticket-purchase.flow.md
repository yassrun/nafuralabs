---
specVersion: 1
kind: flow
appId: layali
flowId: customer-ticket-purchase
name: Achat de billets event (client)
status: stable
actor: CUSTOMER
trigger: bouton "Acheter un billet" depuis event-detail.screen
screensRefs:
  - ../screens/discovery/event-detail.screen.md
  - ../screens/ticket/ticket-buy.screen.md
  - ../screens/ticket/ticket-payment.screen.md
  - ../screens/ticket/ticket-confirm.screen.md
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
apiRefs:
  - ../api/events.api.md
  - ../api/tickets.api.md
  - ../api/payments.api.md
  - ../api/auth.api.md
---

# Achat de billets event (client)

## Objectif

Le client achète un ou plusieurs billets pour un event publié, paie en ligne et reçoit N QR codes (un par billet) par email + SMS. Les billets sont consultables dans `Mes tickets`.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme jusqu'au paiement).
- Contexte : depuis la fiche event, mobile principalement, parfois en groupe (achat de 4-6 places).

## Préconditions

- Event `PUBLISHED`, `startAt > now`, `ticketing.enabled=true`.
- Au moins une catégorie avec `remaining > 0`.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [event-detail](../screens/discovery/event-detail.screen.md) | clic "Acheter un billet" | — | → 2 |
| 2 | [ticket-buy](../screens/ticket/ticket-buy.screen.md) | choisit catégorie et quantité par catégorie (respecte `perOrderMax`) ; saisit nom/email/téléphone | `GET /events/:slug`, `GET /tickets/availability`, topic `/topic/event/{eventId}/availability` (live remaining) | qty > remaining → désactivé ; sinon → 3 |
| 3 | [ticket-buy](../screens/ticket/ticket-buy.screen.md) | clic "Continuer" | `POST /tickets/orders/draft` (`Idempotency-Key`) | 409 `event_sold_out` → message + refresh availability ; 201 → 4 |
| 4 | non authentifié ? | si oui : login/register | — | non auth → 5 ; auth → 6 |
| 5 | [login](../screens/account/login.screen.md) ou [register](../screens/account/register.screen.md) | login | `POST /auth/login` ou OTP/register | succès → 6 ; abandon → draft expire (10 min) |
| 6 | [ticket-payment](../screens/ticket/ticket-payment.screen.md) | choisit provider, clic "Payer" | `GET /tickets/orders/draft/:draftId`, `POST /payments/initiate` | 201 → redirection 3DS |
| 7 | écran 3DS provider | s'authentifie | webhook `POST /payments/webhook/cmi\|stripe` | succès → 8 ; échec → retour 6 |
| 8 | callback → [ticket-confirm](../screens/ticket/ticket-confirm.screen.md) | affiche les N QR + lien téléchargement PDF + lien ICS | `GET /tickets/orders/:id` (polling 30s jusqu'à `CONFIRMED`) | `CONFIRMED` → 9 ; timeout → page "Paiement en attente" |
| 9 | confirmation reçue par email + SMS | — | `:platform:integrations:email`, `:platform:integrations:sms` | fin |

## États globaux du flow

- En cours : `TicketOrder` en `DRAFT`, TTL 10 min, stock décrémenté provisoirement par catégorie.
- Sauvegardé : `TicketOrder` en `CONFIRMED`, tickets émis avec QR signé.
- Abandonné : draft expiré → stock restauré sur les catégories.

## Erreurs et reprises

- Réseau perdu après draft : `draftId` en sessionStorage, reprise à l'étape 6 dans le TTL.
- Sold-out pendant le flow (autre acheteur passe avant) : 409 sur `POST /tickets/orders/draft` → message + recharge availability.
- Paiement refusé : draft conservé, retour étape 6.
- Tenant suspendu pendant le flow : 423 → message + redirection home.
- Event annulé pendant le flow : 409 + refund auto si capturé.
- Echec génération QR (rare) : `TicketOrder` reste `CONFIRMED` mais tickets manquants → support manuel ; surveiller en V1 via alerte.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] La quantité par catégorie respecte `perOrderMax`.
- [ ] L'écran de récap affiche les N tickets avec QR distincts.
- [ ] Le flow peut être repris après auth (draftId conservé).
- [ ] Email + SMS envoyés via abstractions plateforme.
- [ ] PDF téléchargeable (généré côté backend ou côté front en V1) avec tous les QR.
- [ ] Fichier ICS téléchargeable, événement avec `dtstart=event.startAt`.
- [ ] Les billets apparaissent dans `/me/tickets` avec statut `VALID`.

## Open questions

- Billets nominatifs (nom par billet pour soirées VIP) : V2.
- Apple Wallet / Google Wallet : V2.
- Promo codes / parrainage : V2.
- Pré-vente avec releases timing : V2.
