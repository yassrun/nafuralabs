---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-services
name: Services (pro)
status: stable
route: /pro/services
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/services.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/i18n"
---

# Services (pro)

## Intent

CRUD catalogue de services du salon : créer, éditer, archiver, ré-ordonner, gérer photos. Groupés par catégorie.

## Route et accès

- Route : `/pro/services`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Services du salon | [GET /api/v1/pro/services](../../api/services.api.md) | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/pro/services`
- `POST /api/v1/pro/services`
- `PATCH /api/v1/pro/services/:id`
- `POST /api/v1/pro/services/:id/photo`
- `POST /api/v1/pro/services/:id/archive`
- `POST /api/v1/pro/services/reorder`

## États

### loading
- Skeleton accordion catégories.

### empty
- "Aucun service. Créez votre premier service pour permettre la réservation en ligne." + CTA "+ Nouveau service".

### error
- 401, 503.

### success
- Header : bouton "+ Nouveau service", filtre catégorie, switch "Voir archivés".
- Accordion par catégorie : services listés avec drag-handle (re-order), nom, durée, prix, statut badge (PUBLISHED/DRAFT/ARCHIVED).
- Edit inline ou drawer : nom, catégorie, durée (min), bufferAfterMinutes, prix MAD, description courte, photo upload, staffs autorisés (multi-select).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Nouveau service | bouton | drawer création |
| Éditer | clic ligne | drawer édition |
| Publier/Dépublier | toggle dans drawer | `PATCH /pro/services/:id` |
| Archiver | bouton | dialog → `POST /archive` |
| Drag-reorder | drag end | `POST /reorder` |
| Upload photo | bouton drawer | `POST /photo` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| photo-gallery (mini) | `@platform/core/components/photo-gallery` | photo service |

## Composants internes (non réutilisables)

- `<ServiceCategoryAccordion>` : section pliable.
- `<ServiceFormDrawer>` : formulaire complet création/édition.
- `<ServiceListItem>` : ligne avec drag-handle.

## Validations et règles métier

- Durée 5-480 min, prix > 0, nom 2-80 chars.
- Catégorie ∈ enum services.
- bufferAfterMinutes 0-60.
- Photo : 5 Mo max, jpeg/webp.
- Archivage : interdit si services avec RDV à venir (409).
- Re-order : nouvelle `sortOrder` par catégorie.

## i18n

- Clés : `beauty.proServices.title`, `beauty.proServices.cta.new`, `beauty.proServices.filter.category`, `beauty.proServices.toggle.archived`, `beauty.proServices.form.*`, `beauty.proServices.action.archive`, `beauty.proServices.empty`, `beauty.common.category.<key>`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Le drag-reorder persiste.
- [ ] L'archivage est bloqué si RDV futurs (UI + erreur 409).
- [ ] Le toggle staffs autorisés est respecté à la réservation.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Tarification par staff (varie selon expérience) : V2.
- Bundle services (combo) : V2.
- Import en masse Excel : V2.
