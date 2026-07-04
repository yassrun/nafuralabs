---
specVersion: 1
kind: screen
appId: layali
screenId: ticket-payment
name: Paiement billet
status: stable
phase: P1
p1MobileId: ticket-payment
p1Impl: mock
route: /events/:eventSlug/buy/payment
layout: public-shell
zone: ticket
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-ticket-purchase
apiRefs:
  - tickets#GET-/tickets/orders/draft/:draftId
  - payments#POST-/payments/initiate
  - payments#GET-/payments/:paymentId
abstractions:
  components:
    - "@platform/core/components/stepper"
    - "@platform/core/components/payment-form"
    - "@platform/core/components/summary-card"
  patterns:
    - "ticket/multi-step-wizard"
    - "payment/redirect-flow"
---

# Paiement billet

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `ticket-payment` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 2 du flow billetterie : payer intégralement la commande de billets. Pas d'acompte sur les billets.

## Route et accès

- Route : `/events/:eventSlug/buy/payment?draftId=<id>`
- Layout : public-shell
- Auth : required
- Rôles autorisés : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Draft commande | [tickets API](../../api/tickets.api.md) `GET /tickets/orders/draft/:draftId` | onInit | non |
| Statut paiement | [payments API](../../api/payments.api.md) `GET /payments/:paymentId` | post-init | non |

## Mock API consommée

- `GET /api/v1/tickets/orders/draft/:draftId`
- `POST /api/v1/payments/initiate` (body : `{ orderDraftId, mode: "full" }`)
- `GET /api/v1/payments/:paymentId` (polling)

## États

### loading
- Skeleton récap.

### empty
- Draft expiré (TTL 10 min) : message + retour `/events/:slug/buy`.

### error
- `payment_failed`, `payment_refused` : reproposer.
- 401 : redirect `/login`.

### success
- Récap : event, catégories, quantités, total.
- Bouton "Payer".
- Redirection vers gateway, retour `/events/:slug/buy/confirm/:orderId`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Payer | bouton primaire | `POST /payments/initiate` → redirect gateway |
| Annuler | lien | retour `/events/:slug/buy` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | 2/3 |
| payment-form | `@platform/core/components/payment-form` | wrapper CMI/Stripe |
| summary-card | `@platform/core/components/summary-card` | récap commande |

## Composants internes (non réutilisables)

- `<TermsCheckbox>` : acceptation CGV billetterie.

## Validations et règles métier

- Draft doit être actif (`expiresAt > now`).
- Total > 0 MAD.
- CGV obligatoirement cochées.
- Le draft doit appartenir à l'utilisateur courant (ou à une session anonyme qui s'est ré-authentifiée — backend rattache).

## Topics realtime

Aucun.

## i18n

- `layali.ticket.payment.title`
- `layali.ticket.payment.cta.pay`
- `layali.ticket.payment.terms.label`
- `layali.ticket.payment.errors.failed`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise : redirection `/login?returnTo=` si non connecté.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Sur 410 `draft_expired`, retour à `/events/:slug/buy` avec message + saisies réinitialisées.
- [ ] Si le draft a un total à 0 MAD (cas test), le bouton est désactivé et un message d'erreur s'affiche.
- [ ] Le polling s'arrête à 90s en passant en mode "en attente confirmation" (lien support).

## Open questions

- Frais bancaires CMI à afficher au récap ? Décision provisoire : non, montant TTC inclus.
