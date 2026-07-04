---
specVersion: 1
kind: screen
appId: beauty
screenId: salon-search
name: Recherche de salons
status: stable
phase: P1
p1MobileId: salon-search
p1Impl: mock
route: /search
layout: public-layout
zone: discovery
roles: []
auth: public
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/salons.api.md
abstractions:
  components:
    - "@platform/core/components/rating-stars"
    - "@platform/core/components/address-with-map"
    - "@platform/core/i18n"
  patterns:
    - infinite-scroll-cursor
---

# Recherche de salons

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | partial |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(recherche dans home)*

## Intent

Liste filtrable et triable de salons selon ville, catégorie, note, fourchette de prix, et optionnellement proximité géographique. Permet à un visiteur non identifié d'arriver sur une fiche salon en un tap.

## Route et accès

- Route : `/search`
- Layout : `public-layout`
- Auth : public
- Rôles autorisés : tous
- Tenant requis : non
- Query params reflétés dans l'URL : `city`, `category`, `q`, `minRating`, `priceLevel`, `sort`, `near`, `radiusKm`

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Résultats salons (paginés) | [GET /api/v1/salons](../../api/salons.api.md#GET-/api/v1/salons) | onInit + onFiltersChange | session (clé = sérialisation filtres) |
| Total filtré | dans `page.total` de la réponse | idem | idem |

## Mock API consommée

- `GET /api/v1/salons` (voir [salons.api.md](../../api/salons.api.md)) — avec params de filtre/tri.

## États

### loading
- Skeleton de 6 cartes salon, panneau de filtres désactivé.

### empty
- Cas : 0 résultat sur le filtre courant. Illustration + message "Aucun salon trouvé" + bouton "Effacer les filtres" qui reset les query params.

### error
- Message i18n + bouton "Réessayer", filtres conservés.

### success
- Layout 2 colonnes desktop (filtres à gauche, résultats à droite) ; mobile : drawer filtres + liste verticale.
- Chaque carte : photo couverture, nom, ville, note + nombre d'avis, catégories badges, fourchette de prix MAD, bouton "Voir le salon".
- Tri en haut à droite (par défaut "Pertinence", options "Note", "Distance", "Prix croissant").
- Infinite scroll cursor-based (charge la page suivante quand on approche du bas).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Modifier un filtre | toggle / select | re-fetch avec nouveaux params, MAJ URL |
| Effacer tous les filtres | bouton | reset URL à `/search` |
| Cliquer une carte | click | navigation `/salons/:slug` |
| Charger plus | scroll proche du bas | requête suivante avec `cursor` |
| Activer la géoloc | toggle "Près de moi" | demande permission, ajoute `near=lat,lng` |
| Changer le tri | dropdown | re-fetch avec `sort` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| rating-stars (lecture) | `@platform/core/components/rating-stars` | note salon |
| address-with-map (mini) | `@platform/core/components/address-with-map` | vue carte optionnelle (toggle "Carte" desktop) |
| layout-public | `@platform/core/layouts/public` | header + footer |

## Composants internes (non réutilisables)

- `salon-filter-panel` : panneau filtres (ville, catégorie, note min, priceLevel, distance, géoloc).
- `salon-result-card` : carte résultat compacte.
- `search-empty` : illustration + CTA pour cas vide.

## Validations et règles métier

- Filtres mutuellement compatibles ; seul `near` désactive le filtre ville (sinon redondant).
- Désactivation infinite scroll si `hasMore=false`.
- URL canonique : query params en kebab-case, valeurs en enum normalisé.
- Restitution du contexte de recherche : un retour navigateur depuis `/salons/:slug` doit conserver les filtres et la position de scroll.

## i18n

- Clés principales : `beauty.search.filter.city`, `beauty.search.filter.category`, `beauty.search.filter.minRating`, `beauty.search.filter.priceLevel`, `beauty.search.filter.nearMe`, `beauty.search.sort.relevance`, `beauty.search.sort.rating`, `beauty.search.sort.distance`, `beauty.search.sort.priceAsc`, `beauty.search.result.count`, `beauty.search.empty.title`, `beauty.search.empty.cta`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états (`loading`, `empty`, `error`, `success`).
- [ ] Les filtres modifient l'URL et sont restaurables au refresh.
- [ ] Aucun appel direct à un endpoint hors `apiRefs` du frontmatter.
- [ ] L'infinite scroll s'arrête proprement (`hasMore=false`) sans double-fetch.
- [ ] Le retour navigateur depuis une fiche salon conserve filtres + scroll.

## Open questions

- Vue carte interactive (toggle Liste / Carte) : V1 minimaliste statique ; V2 carte cluster Leaflet.
- Sauvegarde d'une recherche favorite (auth user) : V2.
