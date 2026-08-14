# Venue enrichment — backfill & validation (shadow mode)

## Objectif

Enrichir les lieux Casa déjà importés (~214) sans impact métier automatique :

1. résoudre le quartier (JTS, déterministe)
2. appliquer les hard filters
3. classifier via Gemini (`venue-ma-v1`, `venueTypes[]` multi) uniquement si `CONTINUE` / `REVIEW`
4. calculer les scores d’utilité par app (`LAYALI`, `BEAUTY`, `BLANNER`)
5. persister les suggestions en **shadow mode** (`DROP_SUGGESTED` ≠ suppression)

`REVIEWED` reste la seule validation humaine / base de publication future.

## Prérequis

- `AI_GEMINI_API_KEY` configurée pour l’app Venue
- Flyway `V4__venue_enrichment.sql` appliquée
- Console ops : bouton **Backfill Casa (shadow)** ou API :

```http
POST /api/v1/catalog/jobs/venue-enrichment
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "query": { "cityCode": "CASABLANCA" },
  "options": {}
}
```

## Jeu de vérité humain (≥ 50 lieux)

Échantillon équilibré :

- quartiers : `MAARIF`, `GAUTHIER`, `RACINE`, `ANFA_AIN_DIAB`, `BOURGOGNE`
- catégories : dining / nightlife / salon-spa

Mesures cibles avant automatisation :

| Métrique | Seuil |
|---|---|
| Quartier hors frontière | ≥ 95 % accord |
| Classification / KEEP-REVIEW | ≥ 85 % accord humain |
| Suppressions automatiques | **0** |

Seuils score initiaux (calibrables) : `KEEP >= 75`, `REVIEW 45–74`, `DROP_SUGGESTED < 45`.

## Rollout

1. Shadow mode ON (`venue-catalog.enrichment.shadow-mode=true`)
2. Backfill Casa + revue console (preuves, scores app, retry étape)
3. Calibrer seuils sur le jeu humain
4. Autoriser bulk-accept humain uniquement ; jamais d’auto-archive depuis `DROP_SUGGESTED`
