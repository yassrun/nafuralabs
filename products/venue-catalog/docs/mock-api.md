---
specVersion: 1
kind: mock-api
appId: venue-catalog
status: draft
basePath: /api/v1/catalog
authHeader: Authorization
tenantHeader: none
---

# Venue Catalog - Conventions Mock API

## 1. Base URL et versionnage

- Base URL : `/api/v1/catalog`.
- Versionnage : prefixe d'URL (`/v1`, `/v2`).
- Les ressources principales sont `places`, `jobs`, `mappings`.

## 2. Authentification

- Back-office : `Authorization: Bearer <jwt>` obligatoire.
- Projection consumer : token machine-to-machine avec scope `catalog.consumer.read`.
- Aucun endpoint public V1.

## 3. Pagination

- Cursor-based, taille par defaut 20, max 100.
- Query params : `cursor`, `size`.

## 4. Async jobs

- Tout import provider est asynchrone.
- `POST /jobs/*` retourne `202 Accepted` avec `jobId`.
- Les details d'un job sont recuperes via `GET /jobs/:jobId`.

## 5. Idempotence

- `Idempotency-Key` obligatoire sur les creations de job et les publications de mapping.
- Meme cle + meme payload = meme resultat logique.

## 6. Format des erreurs

```json
{
  "error": "validation",
  "message": "payload invalide",
  "details": [{ "field": "query.q", "message": "required" }],
  "traceId": "00000000-0000-0000-0000-000000000999"
}
```

Sous-codes utiles :
- `provider_quota_exceeded`
- `provider_payload_rejected`
- `duplicate_candidate`
- `projection_not_ready`
- `consumer_scope_missing`

## 7. Projections consommatrices

- Les apps ne consomment jamais `sourceRecords.rawPayload`.
- La lecture se fait via `GET /apps/:appId/projections`.
- Chaque projection expose `sourceHash` et `publishedAt` pour dedupe/idempotence cote consumer.

## 8. Open questions

- Support webhook interne en plus du pull : V2 probable.
