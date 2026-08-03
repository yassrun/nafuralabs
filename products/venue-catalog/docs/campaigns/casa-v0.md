# Campagne Casablanca v0

Objectif : remplir une première base revue pour Blanner, Layali et Beauty sans
diluer les quotas Google sur tout le Maroc.

Seed nominative (rooftops / must-have, check + import TEXT) :
voir [casa-seed-rooftops.md](./casa-seed-rooftops.md).

## Grilles

| ID | Quartier | latitude | longitude | rayon |
|---|---|---:|---:|---:|
| CASA-MAARIF | Maarif / centre | 33.5869 | -7.6298 | 1500 m |
| CASA-GAUTHIER | Gauthier | 33.5950 | -7.6180 | 1200 m |
| CASA-RACINE | Racine / Triangle d'Or | 33.5895 | -7.6460 | 1300 m |

Chaque grille est lancée séparément pour `NIGHTLIFE_VENUE`,
`SOCIAL_DINING`, `SALON`, `BARBERSHOP` et `SPA`. Respecter 2 à 5 secondes
entre les appels.

## Lancer un job NEARBY

Définir l'API et un JWT ayant le rôle `CATALOG_OPERATOR` :

```bash
export CATALOG_API=http://localhost:8085
export CATALOG_TOKEN=<jwt>
```

Exemple Maarif / social dining :

```bash
curl -X POST "$CATALOG_API/api/v1/catalog/jobs/google-places-search" \
  -H "Authorization: Bearer $CATALOG_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: casa-v0-maarif-social-dining" \
  -d '{
    "mode": "NEARBY",
    "query": {
      "lat": 33.5869,
      "lng": -7.6298,
      "radiusMeters": 1500,
      "countryCode": "MA",
      "cityCode": "CASABLANCA",
      "primaryCategoryHint": "SOCIAL_DINING"
    },
    "options": {
      "maxResults": 20,
      "refreshExisting": true,
      "refreshMedia": true
    }
  }'
```

Changer l'`Idempotency-Key`, les coordonnées et `primaryCategoryHint` pour
chaque job. Suivre le résultat avec :

```bash
curl -H "Authorization: Bearer $CATALOG_TOKEN" \
  "$CATALOG_API/api/v1/catalog/jobs/<jobId>"
```

## Revue et publication v0

Une fiche peut être approuvée si elle est `ENRICHED`, opérationnelle, possède
nom + adresse + coordonnées, n'a pas de candidat doublon et a au moins une
photo avec attribution.

```bash
curl -X POST "$CATALOG_API/api/v1/catalog/places/bulk-approve" \
  -H "Authorization: Bearer $CATALOG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"placeIds":["<uuid-1>","<uuid-2>"]}'
```

Les fiches ambiguës restent `ENRICHED`; les faux positifs passent par
`POST /api/v1/catalog/places/{id}/reject`.

## Refresh

Rafraîchir les fiches dont `freshnessUntil` approche, avec photos lorsque leur
TTL arrive à échéance :

```bash
curl -X POST "$CATALOG_API/api/v1/catalog/jobs/google-places-refresh" \
  -H "Authorization: Bearer $CATALOG_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: casa-v0-refresh-<date>" \
  -d '{"catalogPlaceIds":["<uuid>"],"refreshMedia":true,"refreshHours":true}'
```
