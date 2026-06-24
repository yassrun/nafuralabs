---
specVersion: 1
kind: screen
appId: beauty
screenId: customer-loyalty
name: Mes points fidélité
status: stable
route: /me/loyalty
layout: account-layout
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - ../../api/loyalty.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Mes points fidélité

## Intent

Affiche les points fidélité du client par salon (programmes par salon). Montre l'historique des points gagnés (RDV honorés) et utilisés, et explique comment en gagner.

## Route et accès

- Route : `/me/loyalty`
- Layout : `account-layout`
- Auth : required
- Rôles : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Soldes par salon | [GET /api/v1/me/loyalty](../../api/loyalty.api.md#GET-/api/v1/me/loyalty) | onInit | session 1 min |
| Historique mouvements | [GET /api/v1/me/loyalty/history](../../api/loyalty.api.md#GET-/api/v1/me/loyalty/history) | lazy au tab "Historique" | session |

## Mock API consommée

- `GET /api/v1/me/loyalty`
- `GET /api/v1/me/loyalty/history?salonId=&cursor=&pageSize=`

## États

### loading
- Skeleton cartes salons.

### empty
- "Vous n'avez pas encore de points. Réservez votre premier RDV pour en gagner." + CTA `/`.

### error
- 401 → login. 503 → retry.

### success
- Tabs : "Soldes" | "Historique".
- Tab "Soldes" : cartes par salon (photo + nom + nombre de points + barre progression vers prochain seuil + règle "1 pt = 10 MAD dépensés").
- Tab "Historique" : timeline avec date, salon, action (gagné +X / utilisé −X), motif (RDV, conversion).
- Pagination cursor.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Voir salon | tap carte | nav `/salons/:slug` |
| Filtrer historique par salon | dropdown | refetch history |
| Charger plus historique | scroll | requête cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-account | `@platform/core/layouts/account` | sidebar |

## Composants internes (non réutilisables)

- `<LoyaltyBalanceCard>` : carte solde avec barre progression.
- `<LoyaltyHistoryItem>` : item timeline.

## Validations et règles métier

- Soldes affichés par salon (programmes indépendants).
- Conversion points : actuellement gérée par le salon manuellement (V1) ; UI informatique uniquement.
- Si salon a `loyaltyEnabled=false`, n'apparaît pas dans la liste.
- Seuil V1 commun : 100 points → notification "Demandez votre récompense au salon".

## i18n

- Clés : `beauty.loyalty.title`, `beauty.loyalty.tab.balances`, `beauty.loyalty.tab.history`, `beauty.loyalty.rule`, `beauty.loyalty.empty`, `beauty.loyalty.history.earned`, `beauty.loyalty.history.spent`, `beauty.loyalty.threshold.reached`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Les soldes par salon sont précis (somme historique).
- [ ] L'historique trie `createdAt:desc` et pagine correctement.
- [ ] Le seuil franchi affiche un message d'info.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Conversion automatique (réduction au booking) : V2.
- Programme fidélité plateforme cross-salons : non en V1.
- Notification push à un seuil : V2.
