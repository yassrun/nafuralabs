---
specVersion: 1
kind: screen
appId: layali
screenId: pro-events-list
name: Événements (pro)
status: stable
route: /pro/events
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - events#GET-/events
  - events#POST-/events
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/badge"
  patterns:
    - "pro/list"
---

# Événements (pro)

## Intent

Lister les événements du venue avec filtres statut (draft/published/closed/cancelled). Bouton "Nouvel événement".

## Route et accès

- Route : `/pro/events`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste events | [events API](../../api/events.api.md) `GET /events?scope=tenant` | onInit + onChange filtres | session 1 min |

## Mock API consommée

- `GET /api/v1/events?scope=tenant&status=&from=&cursor=&size=`
- `POST /api/v1/events` (création express, redirige vers `/pro/events/:id`)

## États

### loading
- Liste skeleton.

### empty
- "Aucun événement, créez votre premier" + CTA `/pro/events/new`.

### error
- 401 : redirect.
- 503 : retry.

### success
- Liste avec badges status, date, billetterie (vendu/total).
- CTA "Nouvel événement".

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Nouvel événement | bouton | navigation `/pro/events/new` |
| Cliquer event | clic ligne | navigation `/pro/events/:id` |
| Filtrer | filtres | refetch + URL sync |
| Charger plus | bouton | requête cursor |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| result-list | `@platform/core/components/result-list` | liste tableau |
| filters-panel | `@platform/core/components/filters-panel` | filtres |
| badge | `@platform/core/components/badge` | status |

## Composants internes (non réutilisables)

- `<EventStatusBadge>` : couleur par status (draft gris, published vert, closed orange, cancelled rouge).

## Validations et règles métier

- Tri par défaut : `date:desc`.
- Filtre par défaut : `status=published,draft`.
- Affichage prix from MAD.

## Topics realtime

Aucun (filtres + pagination explicite).

## i18n

- `layali.pro.events.title`
- `layali.pro.events.filters.status`
- `layali.pro.events.cta.new`
- `layali.pro.events.empty`
- `layali.pro.events.status.<status>`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. ADMIN peut créer comme OWNER (rôle confirmé via permission `event.*`).
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une tentative d'accès depuis un tenant suspendu reçoit 403 et affiche la page d'erreur dédiée.
- [ ] Filtres et page persistés dans l'URL pour deep linking.

## Open questions

- Suppression d'un event draft : autorisée ? Décision provisoire : oui, avec confirmation.
