---
specVersion: 1
kind: screen
appId: layali
screenId: ticket-confirm
name: Confirmation billet
status: stable
phase: P1
p1MobileId: ticket-confirm
p1Impl: mock
route: /events/:eventSlug/buy/confirm/:ticketOrderId
layout: public-shell
zone: ticket
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-ticket-purchase
apiRefs:
  - tickets#GET-/tickets/orders/:id
abstractions:
  components:
    - "@platform/core/components/qr-display"
    - "@platform/core/components/ics-download"
    - "@platform/core/components/summary-card"
  patterns:
    - "ticket/confirmation"
---

# Confirmation billet

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `ticket-confirm` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 3 finale : afficher les billets (un QR par billet), permettre téléchargement ICS et accès `Mes tickets`. Indiquer que l'email a été envoyé.

## Route et accès

- Route : `/events/:eventSlug/buy/confirm/:ticketOrderId`
- Layout : public-shell
- Auth : required
- Rôles autorisés : CUSTOMER (propriétaire de la commande)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Commande confirmée + billets | [tickets API](../../api/tickets.api.md) `GET /tickets/orders/:id` | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/tickets/orders/:id`

## États

### loading
- Skeleton commande + skeleton QR per ticket.

### empty
- Commande sans billets (incohérent) : message + lien support.

### error
- 403 : autre utilisateur.
- 404 : commande inconnue.

### success
- Bannière succès + email envoyé à `<email>`.
- Liste des billets (un QR par billet) avec libellé porteur + catégorie.
- CTA : "Ajouter au calendrier", "Voir mes tickets".

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Télécharger ICS | bouton | génère `.ics` |
| Voir mes tickets | bouton | navigation `/me/tickets` |
| Cliquer un QR | clic | ouvre modale plein écran (QR plus grand) |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| qr-display | `@platform/core/components/qr-display` | rendu QR |
| ics-download | `@platform/core/components/ics-download` | génération ICS |
| summary-card | `@platform/core/components/summary-card` | récap |

## Composants internes (non réutilisables)

- `<TicketCard>` : carte avec QR + porteur + catégorie + référence (`TKT-XXXX`).

## Validations et règles métier

- L'utilisateur courant doit être propriétaire de la commande.
- Statut commande attendu `confirmed` ; si `pending` après timeout, afficher écran d'attente avec lien support.
- Le QR contient un payload signé par `:platform:integrations:qr` — jamais regénéré côté client.

## Topics realtime

Aucun.

## i18n

- `layali.ticket.confirm.title`
- `layali.ticket.confirm.email-sent`
- `layali.ticket.confirm.cta.calendar`
- `layali.ticket.confirm.cta.mytickets`
- `layali.ticket.confirm.holder`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une commande appartenant à un autre utilisateur renvoie 403 et redirige vers `/me/tickets`.
- [ ] Chaque QR est cliquable et s'agrandit dans une modale plein écran (utile au scan rapide à l'entrée).
- [ ] L'ICS contient le bon fuseau `Africa/Casablanca`.

## Open questions

- Wallet (Apple/Google) en V1 ou V2 ? Décision provisoire : V2.
