---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-reviews
name: Avis (pro)
status: stable
phase: P1
p1MobileId: manager-reviews
p1Impl: mock
route: /pro/reviews
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/reviews.api.md
abstractions:
  components:
    - "@platform/core/components/rating-stars"
    - "@platform/core/i18n"
---

# Avis (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `manager-reviews` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.

## Intent

Lister et répondre aux avis clients, signaler ceux qui violent les règles. Vue résumé (moyenne, distribution) et liste paginée.

## Route et accès

- Route : `/pro/reviews`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Avis | [GET /api/v1/pro/reviews](../../api/reviews.api.md) | onInit + filtres | session 1 min |
| Résumé | inclus dans `summary` réponse | onInit | session |

## Mock API consommée

- `GET /api/v1/pro/reviews?minRating=&withReply=&sort=&cursor=`
- `POST /api/v1/reviews/:id/reply`
- `PATCH /api/v1/reviews/:id/reply`
- `POST /api/v1/reviews/:id/flag`

## États

### loading
- Skeleton header + liste.

### empty
- "Aucun avis encore. Encouragez vos clients via le SMS post-RDV."

### error
- 401, 503.

### success
- Bandeau résumé : note moyenne, nombre, distribution barres.
- Filtres : note min, avec/sans réponse, période.
- Liste : étoiles, body, client (nom abrégé), date, badge "Visite vérifiée".
- Bloc réponse pro : inline edit.
- Bouton "Signaler".

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Répondre | bouton | inline textarea → `POST /reply` |
| Modifier réponse | bouton edit | inline → `PATCH /reply` |
| Signaler | bouton flag | dialog raison → `POST /flag` |
| Filtrer | dropdowns | refetch |
| Charger plus | scroll | cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| rating-stars | `@platform/core/components/rating-stars` | étoiles |

## Composants internes (non réutilisables)

- `<ReviewSummaryCard>` : carte résumé.
- `<ReplyEditor>` : éditeur réponse.
- `<FlagReviewDialog>` : dialog flag.

## Validations et règles métier

- Réponse max 1000 chars, texte brut.
- Pas de double réponse, mais modifications illimitées.
- Tri par défaut : `recent`.
- Filtres reflétés dans l'URL.

## i18n

- Clés : `beauty.proReviews.title`, `beauty.proReviews.summary.avg`, `beauty.proReviews.summary.count`, `beauty.proReviews.filter.minRating`, `beauty.proReviews.filter.withReply`, `beauty.proReviews.reply.placeholder`, `beauty.proReviews.reply.cta`, `beauty.proReviews.flag.title`, `beauty.proReviews.empty`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] La réponse publiée est visible côté fiche salon (cohérence cache).
- [ ] Signaler n'affecte pas l'affichage côté pro.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Templates de réponse pré-rédigés : V2.
- Auto-modération IA (toxicity) : V3.
- Notifications push à chaque nouvel avis : V2.
