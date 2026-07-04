---
specVersion: 1
kind: screen
appId: beauty
screenId: salon-detail
name: Fiche salon
status: stable
phase: P1
p1MobileId: salon-detail
p1Impl: mock
route: /salons/:slug
layout: public-layout
zone: discovery
roles: []
auth: public
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/salons.api.md
  - ../../api/services.api.md
  - ../../api/staff.api.md
  - ../../api/reviews.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/rating-stars"
    - "@platform/core/components/address-with-map"
    - "@platform/core/i18n"
---

# Fiche salon

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `salon-detail` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.

## Intent

Page vitrine d'un salon : photos, présentation, services phares, équipe, avis, adresse + carte, horaires, et CTA principal "Réserver". Optimisée mobile.

## Route et accès

- Route : `/salons/:slug`
- Layout : `public-layout`
- Auth : public
- Rôles autorisés : tous
- Tenant requis : non (résolu par `slug` côté backend)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Fiche salon | [GET /api/v1/salons/:slug](../../api/salons.api.md#GET-/api/v1/salons/:slug) avec `includeServices=true` | onInit | session 5 min |
| Catalogue complet | [GET /api/v1/salons/:slug/services](../../api/services.api.md#GET-/api/v1/salons/:slug/services) | lazy (tab "Services") | session |
| Équipe | [GET /api/v1/salons/:slug/staff](../../api/staff.api.md#GET-/api/v1/salons/:slug/staff) | lazy (tab "Équipe") | session |
| Résumé avis | [GET /api/v1/salons/:slug/reviews-summary](../../api/salons.api.md#GET-/api/v1/salons/:slug/reviews-summary) | onInit | session |
| Avis paginés | [GET /api/v1/salons/:slug/reviews](../../api/reviews.api.md#GET-/api/v1/salons/:slug/reviews) | lazy (tab "Avis") | session |

## Mock API consommée

- `GET /api/v1/salons/:slug`
- `GET /api/v1/salons/:slug/services`
- `GET /api/v1/salons/:slug/staff`
- `GET /api/v1/salons/:slug/reviews-summary`
- `GET /api/v1/salons/:slug/reviews`

## États

### loading
- Skeleton hero (cover), titre, badges, mini-grid services placeholder.

### empty
- N/A pour la fiche elle-même (404 si slug inexistant). Pour les sous-listes : "Aucun avis pour le moment", "Aucun service publié", etc.

### error
- Erreur réseau fiche : pleine page "Salon temporairement indisponible" + bouton "Réessayer".
- Erreur sur tab spécifique : message local au tab sans casser le reste de la page.

### success
- Hero : photo couverture (galerie cliquable), nom, tagline, badges catégories, note + nombre d'avis, ville + distance si géoloc.
- CTA fixe sticky en bas mobile : "Réserver maintenant".
- Tabs : "Services" | "Équipe" | "Avis" | "Infos" (horaires + adresse + téléphone).
- Carte interactive + bouton "Itinéraire" (deep link Maps).
- Mention "Paiement en ligne accepté" si `acceptsOnlinePayment`.
- Mention "Programme fidélité actif" si `loyaltyEnabled`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Réserver | CTA principal | navigation `/salons/:slug/book` |
| Ouvrir galerie | click photo cover | modal photo-gallery plein écran |
| Changer de tab | tab click | lazy-load des données du tab |
| Itinéraire | bouton sur carte | ouverture native maps (`geo:`/Google Maps) |
| Appeler le salon | bouton téléphone | `tel:` (mobile) ou copie clipboard (desktop) |
| Partager | bouton partage | Web Share API ou copie du lien |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| photo-gallery | `@platform/core/components/photo-gallery` | galerie photos + lightbox |
| rating-stars | `@platform/core/components/rating-stars` | note moyenne et distribution |
| address-with-map | `@platform/core/components/address-with-map` | adresse + carte interactive |

## Composants internes (non réutilisables)

- `salon-hero` : hero responsive avec photo couverture, titre, badges.
- `service-mini-card` : carte service compacte (nom, durée, prix MAD) sur le tab Services.
- `staff-avatar-strip` : strip horizontale scrollable des praticiens.
- `review-card` : avis avec étoiles, extrait texte, réponse salon éventuelle.
- `opening-hours-grid` : grille 7 jours avec ranges et indicateur "Ouvert maintenant".

## Validations et règles métier

- Si `status != PUBLISHED` (ex `SUSPENDED`), afficher page neutre "Salon temporairement indisponible" sans révéler la raison.
- Bouton "Réserver" désactivé si `services.length == 0` (cas DRAFT mal publié).
- Indicateur "Ouvert maintenant" basé sur `openingHours` + `Africa/Casablanca`.
- Note moyenne avec 1 décimale (ex 4.6), nombre d'avis tronqué si > 999 (`1k+`).

## i18n

- Clés principales : `beauty.salon.cta.book`, `beauty.salon.tab.services`, `beauty.salon.tab.team`, `beauty.salon.tab.reviews`, `beauty.salon.tab.info`, `beauty.salon.hours.openNow`, `beauty.salon.hours.closedNow`, `beauty.salon.payment.online`, `beauty.salon.loyalty.active`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états.
- [ ] La fiche est accessible sans auth ; le bouton "Réserver" demande auth uniquement au submit.
- [ ] Le tab "Avis" liste des avis `PUBLISHED` uniquement (jamais `HIDDEN_PENDING_MODERATION`).
- [ ] Le CTA sticky reste visible en scroll mobile sans couvrir le contenu critique.
- [ ] La carte est cliquable et propose un itinéraire externe.

## Open questions

- "Salons similaires" en bas de page : nice-to-have V1, sinon V2.
- Réservation directe sans choix de staff (auto-attribution au premier dispo) : V1 propose le choix explicite ; option "Indifférent" possible.
