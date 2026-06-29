---
specVersion: 1
kind: screen
appId: layali
screenId: ticket-buy
name: Acheter un billet
status: stable
phase: P1
p1MobileId: ticket-buy
p1Impl: mock
route: /events/:eventSlug/buy
layout: public-shell
zone: ticket
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-ticket-purchase
apiRefs:
  - events#GET-/events/:slug
  - tickets#GET-/tickets/availability
  - tickets#POST-/tickets/orders/draft
topicRefs:
  - /topic/event/{eventId}/availability
abstractions:
  components:
    - "@platform/core/components/stepper"
    - "@platform/core/components/quantity-stepper"
    - "@platform/core/components/form-field"
  patterns:
    - "ticket/multi-step-wizard"
    - "realtime/subscribe-on-mount"
---

# Acheter un billet

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `ticket-buy` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 1 du flow billetterie : choisir une ou plusieurs catégories de billets, indiquer les identités des porteurs si requis, et valider l'intention d'achat. La place est tenue via un draft order.

## Route et accès

- Route : `/events/:eventSlug/buy`
- Layout : public-shell
- Auth : optional (login déclenché à `payment`)
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Event | [events API](../../api/events.api.md) `GET /events/:slug` | onInit | session 2 min |
| Availability | [tickets API](../../api/tickets.api.md) `GET /tickets/availability?eventId=` | onInit | invalidé par realtime |

## Mock API consommée

- `GET /api/v1/events/:slug`
- `GET /api/v1/tickets/availability?eventId=`
- `POST /api/v1/tickets/orders/draft` (body : `{ eventId, items: [{ categoryCode, quantity, holders: [{firstName, lastName}] }], buyer: {firstName, lastName, email, phone} }`)
- Topic : `/topic/event/{eventId}/availability`

## États

### loading
- Skeleton categories + form skeleton.

### empty
- Toutes les catégories sont sold-out : message "Plus de billets disponibles" + lien "Me prévenir" (V2).

### error
- 422 si quantity > remaining d'une catégorie.
- 409 `event_sold_out` au draft.

### success
- Liste catégories avec stepper quantité (0-N selon `maxPerOrder`).
- Bloc "Acheteur" (nom, email, téléphone). Pré-rempli si connecté.
- Bloc "Porteurs" (un par billet pour VIP / Table partagée, optionnel pour STD).
- Total calculé live.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Ajuster quantité | stepper +/- | met à jour total + valide cap |
| Soumettre | bouton "Continuer" | `POST /tickets/orders/draft` puis navigation `/events/:slug/buy/payment` |
| Annuler | lien | retour `/events/:slug` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | 1/3 |
| quantity-stepper | `@platform/core/components/quantity-stepper` | quantité catégorie |
| form-field | `@platform/core/components/form-field` | inputs |

## Composants internes (non réutilisables)

- `<CategoryRow>` : nom, prix, remaining, quantité.
- `<HoldersForm>` : liste de champs nom/prénom dynamiques.

## Validations et règles métier

- `quantity` ≤ `remaining` par catégorie.
- Total `quantity` toutes catégories ≤ `event.maxPerOrder` (défaut 10).
- Email valide, téléphone E.164 (`+212...`).
- Pour `VIP` ou `TBL` : un porteur par billet obligatoire (nom + prénom).
- Pour `STD` : porteurs optionnels (un seul billet acheteur suffit).

## Topics realtime

- `/topic/event/{eventId}/availability` : met à jour les `remaining` live. Si une catégorie sélectionnée tombe à 0, la quantité est clampée et un toast informe l'utilisateur.

## i18n

- `layali.ticket.buy.title`
- `layali.ticket.buy.category.remaining`
- `layali.ticket.buy.category.soldout`
- `layali.ticket.buy.holders.title`
- `layali.ticket.buy.buyer.title`
- `layali.ticket.buy.cta.continue`
- `layali.ticket.buy.errors.max-per-order`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth optionnelle ; les saisies de l'acheteur sont préservées si une redirection login intervient à l'étape suivante (sessionStorage).
- [ ] Aucun appel hors `apiRefs`.
- [ ] Sur 409 `event_sold_out` au moment de `POST /draft`, l'écran affiche un message dédié et désactive le CTA.
- [ ] Un update realtime qui rend une catégorie sold-out alors qu'elle est sélectionnée provoque clamp + toast sans recharger la page.
- [ ] Les champs `holders` obligatoires pour VIP/TBL sont validés avant soumission.

## Open questions

- Doit-on permettre le rachat de billet sur un compte invité (sans création de compte) ? Décision provisoire : oui V1, le compte est créé automatiquement à la confirmation s'il n'existe pas.
- Affichage de frais de service plateforme dans le récap ? Décision provisoire : frais inclus dans le prix affiché V1 (pas de breakdown).
