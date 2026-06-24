---
specVersion: 1
kind: screen
appId: beauty
screenId: service-list
name: Catalogue de services d'un salon
status: stable
route: /salons/:slug/services
layout: public-layout
zone: discovery
roles: []
auth: public
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/salons.api.md
  - ../../api/services.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/i18n"
---

# Catalogue de services d'un salon

## Intent

Affiche le catalogue complet des services d'un salon, regroupés par catégorie, avec durée et prix. Permet au client de sélectionner un service et de démarrer la réservation.

## Route et accès

- Route : `/salons/:slug/services`
- Layout : `public-layout`
- Auth : public
- Rôles autorisés : tous
- Tenant requis : non (résolu par `slug`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Fiche salon (résumé) | [GET /api/v1/salons/:slug](../../api/salons.api.md#GET-/api/v1/salons/:slug) | onInit | session 5 min |
| Catalogue services groupés | [GET /api/v1/salons/:slug/services](../../api/services.api.md#GET-/api/v1/salons/:slug/services) | onInit | session 5 min |

## Mock API consommée

- `GET /api/v1/salons/:slug`
- `GET /api/v1/salons/:slug/services`

## États

### loading
- Skeleton header salon + accordion catégories vide.

### empty
- "Aucun service publié" + lien retour fiche salon.

### error
- 404 → page "Salon introuvable" + retour `/`. 503 → bouton "Réessayer".

### success
- Header compact : photo cover réduit, nom salon, note, CTA "Voir la fiche".
- Liste accordion par catégorie (`COIFFURE_FEMME`, `COIFFURE_HOMME`, `ESTHETIQUE`, `ONGLES`, `HAMMAM_SPA`, `BARBIER`).
- Chaque service : nom, durée minutes, prix MAD, photo miniature optionnelle, bouton "Réserver".
- Filtre rapide en haut : recherche (input), checkboxes catégories, tri (prix asc/desc, durée asc).
- Compteur services par catégorie.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Réserver un service | bouton sur ligne service | navigation `/salons/:slug/book?serviceId=<id>` |
| Filtrer catégories | checkboxes | filtrage côté client |
| Recherche texte | input debounce 300ms | filtrage local (nom service) |
| Trier | dropdown | tri local |
| Retour fiche salon | bouton header | navigation `/salons/:slug` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| photo-gallery (mode mini) | `@platform/core/components/photo-gallery` | miniatures services |
| layout-public | `@platform/core/layouts/public` | header + footer |

## Composants internes (non réutilisables)

- `<ServiceListItem>` : ligne service compacte (photo, nom, durée, prix, bouton).
- `<CategoryAccordion>` : section pliable par catégorie.
- `<ServiceFilters>` : bandeau de filtres sticky.

## Validations et règles métier

- Affiche uniquement les services `status=PUBLISHED` du salon.
- Si `status` salon != `PUBLISHED`, affiche page "Salon temporairement indisponible".
- Prix toujours affichés en MAD (entier ou avec 2 décimales selon fixture).
- Durée affichée en `<X> min` (ex `45 min`, `1h30`).
- Réservation désactivée si `salon.acceptsOnlineBooking=false` (bouton "Téléphoner").

## i18n

- Clés principales : `beauty.services.title`, `beauty.services.filter.search`, `beauty.services.filter.category`, `beauty.services.sort.priceAsc`, `beauty.services.sort.priceDesc`, `beauty.services.sort.durationAsc`, `beauty.services.cta.book`, `beauty.services.cta.callSalon`, `beauty.services.empty`, `beauty.common.category.<key>`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états.
- [ ] Le bouton "Réserver" navigue avec `serviceId` en query param.
- [ ] La recherche et les filtres ne refetch pas (filtrage client).
- [ ] Si `acceptsOnlineBooking=false`, le CTA est remplacé par "Téléphoner" qui ouvre `tel:`.
- [ ] Les services `DRAFT|ARCHIVED` ne sont jamais visibles côté public.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Photos par service obligatoires en V1 ? Décision provisoire : optionnelles ; placeholder catégorie sinon.
- Affichage "Promo" ou prix barré : V2.
