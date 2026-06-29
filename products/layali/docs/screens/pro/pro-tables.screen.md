---
specVersion: 1
kind: screen
appId: layali
screenId: pro-tables
name: Plan de salle
status: stable
phase: P1
p1MobileId: pro-tables
p1Impl: mock
route: /pro/tables
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - tables#GET-/tables
  - tables#POST-/tables
  - tables#PATCH-/tables/:id
  - tables#DELETE-/tables/:id
  - tables#POST-/tables/layout
topicRefs:
  - /topic/event/{eventId}/tables
abstractions:
  components:
    - "@platform/core/components/floor-map-editor"
    - "@platform/core/components/form-field"
    - "@platform/core/components/toolbar"
  patterns:
    - "pro/visual-editor"
---

# Plan de salle

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-tables` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Éditer le plan de salle du venue : ajouter/déplacer/supprimer des tables, configurer leur capacité, leur minimum spend, leur catégorie (standard / VIP), et leur visibilité publique. Pour la soirée du soir, voir leur état (libre/réservée).

## Route et accès

- Route : `/pro/tables`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Tables du venue | [tables API](../../api/tables.api.md) `GET /tables?scope=tenant` | onInit | session, invalidé par realtime |
| État pour event courant (option) | [tables API](../../api/tables.api.md) `GET /tables?eventId=` | sur sélection event | invalidé par realtime |

## Mock API consommée

- `GET /api/v1/tables?scope=tenant`
- `GET /api/v1/tables?eventId=`
- `POST /api/v1/tables` (création unitaire)
- `PATCH /api/v1/tables/:id`
- `DELETE /api/v1/tables/:id`
- `POST /api/v1/tables/layout` (upload background image plan)
- Topic : `/topic/event/{eventId}/tables`

## États

### loading
- Plan + sidebar skeleton.

### empty
- "Aucune table configurée, importez ou créez votre premier plan" + CTA "+ Table".

### error
- 409 : suppression d'une table avec bookings actifs.
- 422 : validation form.

### success
- Plan de salle 2D éditable (drag/drop).
- Sidebar : propriétés table sélectionnée (label, capacity, minSpend, VIP, visible).
- Sélecteur event (pour voir état pour une soirée donnée).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Ajouter table | bouton + clic plan | `POST /tables` |
| Déplacer table | drag/drop | `PATCH /tables/:id` (position) |
| Éditer propriétés | sidebar | `PATCH /tables/:id` |
| Supprimer | bouton | confirmation puis `DELETE /tables/:id` |
| Upload background | bouton | `POST /tables/layout` (multipart) |
| Sélectionner event | dropdown | recharge état tables |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| floor-map-editor | `@platform/core/components/floor-map-editor` | éditeur 2D drag/drop |
| form-field | `@platform/core/components/form-field` | inputs sidebar |
| toolbar | `@platform/core/components/toolbar` | actions globales |

## Composants internes (non réutilisables)

- `<TableTileEditor>` : tuile avec poignées resize, label inline.
- `<TablePropertiesSidebar>` : panneau propriétés.

## Validations et règles métier

- `capacity` 2-12 par défaut, jusqu'à 30 si custom.
- `minSpend` >= 0, libellé MAD.
- `label` unique au sein du venue (ex : T1, T2, VIP-1).
- Suppression refusée (409) si la table a des bookings futurs non annulés.
- Position dans le plan en coordonnées relatives (0-100).

## Topics realtime

- `/topic/event/{eventId}/tables` : reçoit `table.reserved` / `table.released` pour la soirée sélectionnée, met à jour l'état visuel sans refetch.

## i18n

- `layali.pro.tables.title`
- `layali.pro.tables.cta.add`
- `layali.pro.tables.props.<field>`
- `layali.pro.tables.errors.label-duplicate`
- `layali.pro.tables.errors.has-bookings`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. Permission `table.*`.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une tentative de DELETE sur une table avec bookings actifs reçoit 409 et affiche un message clair sans supprimer côté UI.
- [ ] Le drag/drop met à jour `position` via PATCH ; en cas d'échec, position revert visuellement.
- [ ] L'abonnement realtime ne crée pas de fuite mémoire en cas de changement d'event sélectionné (unsubscribe + resubscribe propre).

## Open questions

- Multi-niveaux (étage 1, mezzanine) : V1 ou V2 ? Décision provisoire : V2.
- Import depuis fichier (CSV, SVG) : V1 ou V2 ? Décision provisoire : V2.
