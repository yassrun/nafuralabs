---
specVersion: 1
kind: screen
appId: beauty
screenId: home
name: Accueil découverte
status: stable
phase: P1
p1MobileId: home
p1Impl: mock
route: /
layout: public-layout
zone: discovery
roles: []
auth: public
flowRefs:
  - ../../flows/customer-booking.flow.md
  - ../../flows/customer-onboarding.flow.md
apiRefs:
  - ../../api/salons.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/rating-stars"
    - "@platform/core/i18n"
  patterns:
    - tenancy-public-bypass
---

# Accueil découverte

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `home` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.

## Intent

Page d'accueil publique : invite le visiteur à chercher un salon par ville et catégorie, met en avant des salons populaires de sa ville, et explique en 3 points la promesse Beauty. Mobile-first.

## Route et accès

- Route : `/`
- Layout : `public-layout`
- Auth : public
- Rôles autorisés : tous (même non-authentifié)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Top salons (8) | [GET /api/v1/salons](../../api/salons.api.md#GET-/api/v1/salons) avec `sort=rating&pageSize=8&city=<inféré>` | onInit | session 5 min |
| Villes populaires | constante front (enum villes) | bundle | — |
| Catégories populaires | constante front (enum + libellés i18n) | bundle | — |
| Géolocalisation utilisateur | navigator.geolocation, opt-in | onInit (avec consentement) | session |

## Mock API consommée

- `GET /api/v1/salons` (voir [salons.api.md](../../api/salons.api.md)) — top 8 salons filtrés ville/popularité.

## États

### loading
- Skeleton avec barre de recherche désactivée, 8 cartes salon en placeholder shimmer.

### empty
- Cas : aucun salon dans la ville détectée. Affiche illustration + CTA "Voir tous les salons", relance `GET /salons` sans filtre ville. Non bloquant.

### error
- Erreur réseau au chargement des top salons : message i18n + bouton "Réessayer" + section recherche manuelle toujours accessible.

### success
- Hero avec barre de recherche (ville + catégorie + CTA "Trouver un salon").
- Section "Populaires près de vous" avec cartes salon (cover, nom, note, ville, fourchette prix).
- Section "3 raisons" (réservation 60s, paiement sécurisé, rappel SMS) en cartes.
- Footer avec liens CGU / mentions / langue.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Lancer une recherche | submit du formulaire hero | navigation `/search?city=...&category=...` |
| Cliquer une carte salon | click | navigation `/salons/:slug` |
| Changer la langue | dropdown header | recharge i18n, persiste en localStorage |
| Refuser la géoloc | dialogue navigateur | fallback ville par défaut Casablanca |
| Aller à "Mes RDV" | bouton header (si auth) | navigation `/me/bookings` ou `/login` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| photo-gallery (mode single) | `@platform/core/components/photo-gallery` | photo cover dans les cartes salon |
| rating-stars (lecture) | `@platform/core/components/rating-stars` | note moyenne sur cartes |
| layout-public | `@platform/core/layouts/public` | header + footer |

## Composants internes (non réutilisables)

- `home-hero` : composant hero avec gradient et barre de recherche compacte.
- `popular-salon-card` : carte salon avec cover, nom, note, fourchette prix MAD.
- `value-prop-card` : carte argument (icône + titre + descr).

## Validations et règles métier

- Si géoloc utilisateur disponible et `near=<lat,lng>`, prioriser le tri par distance, sinon par note dans la ville détectée.
- Aucun appel API sur changement de langue (recharge i18n uniquement).
- Les libellés de catégories viennent du dictionnaire i18n `beauty.common.category.*`.

## i18n

- Clés principales : `beauty.home.hero.title`, `beauty.home.hero.searchCity`, `beauty.home.hero.searchCategory`, `beauty.home.hero.cta`, `beauty.home.popular.title`, `beauty.home.empty.title`, `beauty.home.empty.cta`, `beauty.home.error.retry`.
- Support RTL pour locale `ar` (réordonnement icônes, alignement texte).

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états (`loading`, `empty`, `error`, `success`).
- [ ] La barre de recherche fonctionne en clavier (Enter submit) et au tap mobile.
- [ ] Le bundle de l'écran ne réimplemente pas une abstraction listée dans `abstractions`.
- [ ] Aucun appel direct à un endpoint hors `apiRefs` du frontmatter.
- [ ] La géolocalisation est opt-in et un refus ne bloque pas l'usage.
- [ ] Bascule RTL fonctionnelle en locale `ar`.

## Open questions

- Section "Promotions du moment" : repoussée V2 ?
- Affichage du nombre de salons actifs dans la ville (signal social) : à confirmer.
