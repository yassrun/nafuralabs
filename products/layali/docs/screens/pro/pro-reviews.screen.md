---
specVersion: 1
kind: screen
appId: layali
screenId: pro-reviews
name: Avis (pro)
status: stable
route: /pro/reviews
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN, BAR_MANAGER]
auth: required
flowRefs: []
apiRefs:
  - reviews#GET-/reviews
  - reviews#POST-/reviews/:id/reply
  - reviews#PATCH-/reviews/:id/reply
  - reviews#POST-/reviews/:id/flag
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/badge"
    - "@platform/core/components/rating-stars"
    - "@platform/core/components/dialog"
  patterns:
    - "pro/list"
---

# Avis (pro)

## Intent

Lister, lire et répondre aux avis laissés par les clients sur le venue (et ses events). Permet aussi de signaler un avis abusif à la modération plateforme.

## Route et accès

- Route : `/pro/reviews`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN (full), BAR_MANAGER (lecture seule, pas de reply)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Avis du venue | [reviews API](../../api/reviews.api.md) `GET /reviews?venueId=&...` | onInit + filtres | session 1 min |
| Résumé (avg, count, distribution) | inclus dans la réponse `summary` | onInit | session |

## Mock API consommée

- `GET /api/v1/reviews?venueId=<resolved>&minRating=&withReply=&sort=&cursor=&size=`
- `POST /api/v1/reviews/:id/reply`
- `PATCH /api/v1/reviews/:id/reply`
- `POST /api/v1/reviews/:id/flag`

## États

### loading
- Skeleton header + liste d'avis.

### empty
- "Aucun avis pour le moment. Encouragez vos clients à laisser un retour après leur visite." + lien partage QR fiche venue (V2).

### error
- 401, 503 standards.

### success
- Bandeau résumé : note moyenne, nombre, distribution barre (5⭐...1⭐), %réponses publiées.
- Filtres : note min, événement (dropdown), avec/sans réponse, période.
- Liste avis : note étoiles, titre, body, client nom abrégé, date, badge "Visite vérifiée" si `sourceBookingId|sourceTicketOrderId`.
- Bloc réponse pro : si répondu → affichée ; sinon textarea + bouton "Répondre".
- Bouton "Signaler" (icône drapeau) ouvre dialog flag.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Répondre | bouton sur avis | textarea inline → `POST /reviews/:id/reply` |
| Modifier réponse | bouton edit (réponse existante) | inline edit → `PATCH /reviews/:id/reply` |
| Signaler | bouton flag | dialog raison → `POST /reviews/:id/flag` |
| Filtrer | dropdowns | refetch |
| Charger plus | scroll | cursor |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| result-list | `@platform/core/components/result-list` | liste avis |
| filters-panel | `@platform/core/components/filters-panel` | filtres |
| rating-stars | `@platform/core/components/rating-stars` | note étoiles |
| badge | `@platform/core/components/badge` | "Visite vérifiée", "En attente modération" |
| dialog | `@platform/core/components/dialog` | flag |

## Composants internes (non réutilisables)

- `<ReviewSummaryCard>` : carte résumé avec barre de distribution.
- `<ReplyEditor>` : textarea + compteur 500 chars + bouton submit.
- `<FlagReviewDialog>` : sélecteur raison + zone texte.

## Validations et règles métier

- Réponse : max 1000 chars, markdown light désactivé (texte brut).
- Éditer une réponse : illimité côté UI (le backend horodate la dernière modif).
- BAR_MANAGER : pas de bouton réponse/flag visible.
- Filtres par event : alimentés depuis les avis (côté front, set des `eventId` distincts).
- Tri par défaut : `recent`.

## Topics realtime

Aucun en V1. Polling implicite au refresh manuel uniquement.

## i18n

- `layali.pro.reviews.title`
- `layali.pro.reviews.summary.avg`
- `layali.pro.reviews.summary.count`
- `layali.pro.reviews.filter.minRating`
- `layali.pro.reviews.filter.withReply`
- `layali.pro.reviews.reply.placeholder`
- `layali.pro.reviews.reply.submit`
- `layali.pro.reviews.flag.title`
- `layali.pro.reviews.flag.reason.<reason>`
- `layali.pro.reviews.empty`
- `layali.common.errors.*`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] La réponse publique est immédiatement visible côté client après publication.
- [ ] BAR_MANAGER : aucune action mutable visible.
- [ ] Le badge "Visite vérifiée" apparaît si la review a un `sourceBookingId` ou `sourceTicketOrderId`.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Signaler un avis ne supprime pas l'affichage côté pro (uniquement masquage côté public si seuil atteint).

## Open questions

- Suggestions de réponses pré-rédigées (templates par rating) : V2.
- Notifications push pro à chaque nouvel avis : V2 (V1 = email).
- Modération auto IA (toxicity score) : V3.
