---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-loyalty
name: Fidélité (pro)
status: stable
phase: P1
p1MobileId: manager-loyalty
p1Impl: mock
route: /pro/loyalty
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/loyalty.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Fidélité (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-03 stub)*

## Intent

Configurer le programme de fidélité du salon (activer, règles), voir les top clients par points, gérer les conversions manuelles (offrir une récompense).

## Route et accès

- Route : `/pro/loyalty`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Config programme | [GET /api/v1/pro/loyalty/config](../../api/loyalty.api.md) | onInit | session 5 min |
| Top clients | [GET /api/v1/pro/loyalty/top](../../api/loyalty.api.md) | onInit | session 1 min |
| Historique opérations | [GET /api/v1/pro/loyalty/history](../../api/loyalty.api.md) | lazy tab | session |

## Mock API consommée

- `GET /api/v1/pro/loyalty/config`
- `PATCH /api/v1/pro/loyalty/config` (toggle, règle)
- `GET /api/v1/pro/loyalty/top?cursor=`
- `GET /api/v1/pro/loyalty/history?cursor=`
- `POST /api/v1/pro/loyalty/redeem` (offrir manuellement N points en remise/cadeau)

## États

### loading
- Skeleton config + top.

### empty
- Programme désactivé : page "Activez le programme de fidélité" + bouton toggle.

### error
- 401, 503.

### success
- Bandeau config : toggle activé/désactivé, règle simple `1 pt par X MAD dépensés` (modifiable), seuil notification.
- Section "Top clients" : tableau avec rang, client, points, dernier RDV, bouton "Offrir récompense".
- Tabs : "Top clients" | "Historique" (opérations gagner/utiliser cross-clients).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Toggle programme | switch | `PATCH /config` |
| Modifier règle | inline | `PATCH /config` |
| Offrir récompense | bouton | dialog (points à débiter + motif) → `POST /redeem` |
| Voir historique | tab | refetch history |
| Charger plus | scroll | cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-pro | `@platform/core/layouts/pro` | sidebar |

## Composants internes (non réutilisables)

- `<LoyaltyConfigCard>` : bandeau config.
- `<TopCustomerRow>` : ligne client.
- `<RedeemDialog>` : dialog conversion manuelle.

## Validations et règles métier

- Règle V1 : `pointsPerMad` entier 1-10, défaut 1 point / 10 MAD.
- Seuil notification : entier 50-500, défaut 100.
- Conversion manuelle : montant points à débiter, motif libre. Pas de plafond V1.
- Désactivation programme : conserve l'historique mais arrête le cumul (existant utilisable encore).

## i18n

- Clés : `beauty.proLoyalty.title`, `beauty.proLoyalty.toggle`, `beauty.proLoyalty.rule.title`, `beauty.proLoyalty.rule.pointsPerMad`, `beauty.proLoyalty.rule.threshold`, `beauty.proLoyalty.top.title`, `beauty.proLoyalty.history.title`, `beauty.proLoyalty.action.redeem`, `beauty.proLoyalty.empty`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Le toggle on/off est immédiat et persisté.
- [ ] La conversion manuelle débite correctement le solde client.
- [ ] L'historique trace toutes les opérations avec acteur (`OWNER`/`ADMIN`).
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Auto-application au booking (réduction automatique au seuil) : V2.
- Récompenses prédéfinies (templates : -10%, -20MAD, service offert) : V2.
- Newsletter de fidélité automatisée : V2.
