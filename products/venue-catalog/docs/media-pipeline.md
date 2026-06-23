---
specVersion: 1
kind: technical-spec
appId: venue-catalog
docId: media-pipeline
name: Pipeline media — Google Places vers MinIO
status: draft
language: fr
---

# Pipeline media — Google Places vers MinIO

Politique et implementation du cache photos Google Places dans MinIO pour Venue Catalog.

Contexte produit : les photos servent la **revue admin** et l'**annuaire LISTING_ONLY** Beauty/Layali en pilote. Ce ne sont pas des assets proprietaires Nafura ; ils restent soumis aux conditions Google.

## 1. Decision produit (V1)

| Question | Decision V1 |
|---|---|
| Stocker les photos Google ? | **Oui**, cache temporaire MinIO |
| Republication indefinite ? | **Non** — TTL 30 jours, renouvellement au refresh |
| Exposer `googlePlaceId` ? | **Non** |
| Attribution | **Obligatoire** — `attributionText` + affichage UI si photo visible |
| Max photos par lieu | **5** a l'import |
| Resolution max | **1600 px** largeur (Place Photos API) |
| Format stockage | **JPEG** (conversion si necessaire) |
| Bucket MinIO | `venue-catalog-media` |
| Acces public | **URL signee** TTL 60 min, regeneree a la lecture |

## 2. Flux

```
Place Details (FieldMask inclut photos[])
        │
        ▼
Pour chaque photo (max 5, tri par pertinence Google) :
        │
        ├─ 1. Place Photos API → bytes image
        ├─ 2. MediaComplianceService.check()  → attribution, taille, MIME
        ├─ 3. MinIO putObject()
        │      key: google/{placeUuid}/{photoHash}.jpg
        ├─ 4. INSERT catalog_place_media
        │      storage_key, attribution, expires_at = now + 30d
        └─ 5. Expose dans catalog_places.media[] via URL signee
```

Declencheurs :
- Job import `google-places-search` : `refreshMedia=true` par defaut sur creation
- Job `google-places-refresh` : option `refreshMedia` dans le body ([catalog-jobs.api.md](api/catalog-jobs.api.md))

## 3. Modele `catalog_place_media`

### Champs persistes

| Champ | Type | Description |
|---|---|---|
| id | UUID | identifiant media catalogue |
| catalogPlaceId | UUID | FK lieu |
| source | enum | `GOOGLE_PLACES` (V1 seul provider) |
| storageKey | string | `google/{catalogPlaceId}/{sha256-prefix}.jpg` |
| width | int | pixels |
| height | int | pixels |
| attributionText | string | ex. `Photo: Google` + auteur si fourni |
| authorName | string? | depuis `authorAttributions` Google |
| reusable | boolean | toujours `false` pour Google V1 |
| providerPhotoRef | string | ref opaque Google (`places/.../photos/...`) — interne |
| contentChecksum | string | sha256 du fichier |
| expiresAt | datetime | TTL cache |
| sortOrder | int | 0 = couverture |
| status | enum | `ACTIVE`, `EXPIRED`, `PURGED` |
| createdAt | datetime | |

### DTO API public (`media[]` sur CatalogPlace)

```json
{
  "id": "med-101",
  "source": "GOOGLE_PLACES",
  "url": "https://minio.nafura.local/venue-catalog-media/google/...?X-Amz-Signature=...",
  "width": 1600,
  "height": 900,
  "attributionText": "Photo: Google",
  "reusable": false,
  "expiresAt": "2026-07-16T09:55:00+01:00"
}
```

- `url` : **regeneree** a chaque `GET /places/:id` si expiree ou TTL signature < 5 min
- Jamais de URL Google brute dans l'API

## 4. MinIO — conventions

### Bucket

| Propriete | Valeur |
|---|---|
| Nom | `venue-catalog-media` |
| Versioning | desactive V1 |
| Chiffrement | SSE-S3 ou equivalent |
| Policy | pas de lecture publique anonyme |

### Structure des cles

```
google/{catalogPlaceId}/{contentSha256}.jpg
```

Exemple :
```
google/00000000-0000-0000-0000-000000000101/a3f2c8d1e9b0.jpg
```

Metadata objet MinIO (headers) :
- `x-amz-meta-source`: `GOOGLE_PLACES`
- `x-amz-meta-provider-photo-ref`: (ref Google)
- `x-amz-meta-attribution`: (texte encode)
- `x-amz-meta-catalog-place-id`: UUID
- `x-amz-meta-expires-at`: ISO datetime

### Integration Nafura

Utiliser `:platform:integrations:storage` :

```java
public interface ObjectStoragePort {
  PutResult put(PutObjectCommand command);
  String signedGetUrl(String bucket, String key, Duration ttl);
  void delete(String bucket, String key);
}
```

Ne pas appeler le SDK MinIO directement depuis les domaines metier.

## 5. Service `MediaSyncService` (catalog-job)

Pseudo-algorithme :

```
syncMedia(catalogPlaceId, providerPlaceId, photoRefs[], options):
  existing = mediaRepo.findActiveByPlace(catalogPlaceId)
  for ref in photoRefs.take(5):
    if existing.hasSameProviderRef(ref): continue
    bytes = placeProvider.fetchPhoto(ref, maxWidth=1600)
    checksum = sha256(bytes)
    if existing.hasSameChecksum(checksum): continue
    compliance.assertAllowed(bytes, ref)
    key = "google/{catalogPlaceId}/{checksum}.jpg"
    storage.put(bucket, key, bytes, metadata)
    mediaRepo.save(CatalogPlaceMedia(..., expiresAt=now+30d))
  deactivatePhotosNotInRefs(existing, photoRefs)  // soft status EXPIRED
```

Idempotence : meme `providerPhotoRef` + meme `contentChecksum` = pas de re-upload.

## 6. Compliance (`compliance` module)

### `MediaComplianceService`

| Regle | Action si violation |
|---|---|
| MIME != image/jpeg/webp | convertir en JPEG ou rejeter |
| Taille > 5 Mo apres resize | resize puis re-check |
| Pas d'attribution Google | utiliser fallback `Photo: Google` |
| Lieu ARCHIVED | ne pas sync nouvelles photos |
| Projection PUBLISHED vers app + reusable=false | apps consommatrices : voir §8 |

### `MediaRetentionScheduler` (cron quotidien)

```
1. SELECT media WHERE expires_at < now() AND status = ACTIVE
2. storage.delete(storage_key)
3. UPDATE status = PURGED
4. Si lieu sans media ACTIVE : quality.completenessScore recalcule
```

### Audit

Logger : `catalogPlaceId`, `mediaId`, action (`IMPORT`, `REFRESH`, `PURGE`, `SIGN_URL`).

## 7. Refresh et expiration

| Evenement | Comportement |
|---|---|
| Import initial | 5 photos, expiresAt = +30j |
| `google-places-refresh` + `refreshMedia=true` | Re-fetch si ref changee ou expire dans < 7j |
| Expiration atteinte | Purge MinIO + status PURGED |
| Lieu ARCHIVED | Purge media a J+7 |
| Re-import meme lieu | Update photos, conserve checksum identiques |

`freshnessUntil` sur `sourceRecords` aligne sur expiration media (30j).

## 8. Consommation par Beauty / Layali (wp-02)

### LISTING_ONLY (annuaire pilote)

| Champ | Inclus ? | Condition |
|---|---|---|
| `coverPhotoUrl` | Oui | 1ere photo ACTIVE, URL signee |
| `attributionText` | Oui | affichage obligatoire sous la photo |
| `reusable` | `false` | badge « Photo indicative » |

### PARTNER (pro onboardé)

- Les apps **remplacent** progressivement par photos pro (bucket `layali-media` / `beauty-media`)
- Venue Catalog ne pousse plus de nouvelles photos Google si `listingTier=PARTNER` et salon a `coverPhotoId` pro

Regle mapping wp-02 :
```
if beautySalon.listingTier == PARTNER && beautySalon.photos.notEmpty():
  projection.photos = beauty photos only
else:
  projection.coverPhotoUrl = catalog signed url + attribution
```

## 9. Couts Google Places Photos

- 1 appel Place Photos par image telechargee
- Budget : 5 photos x 20 lieux x 1 job = 100 appels photos par job dense
- Config campagne : reduire a **3 photos** si quota serre (`venue-catalog.media.max-photos-per-place`)

## 10. Erreurs

| Code job | Cas |
|---|---|
| `MEDIA_QUOTA_EXCEEDED` | quota Place Photos — job continue sans photos, `PARTIAL` |
| `MEDIA_FETCH_FAILED` | photo individuelle ignoree, log warning |
| `STORAGE_UNAVAILABLE` | job `FAILED` retryable si 0 media critique |

## 11. Docker Compose local (dev)

```yaml
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
  minio-init:
    image: minio/mc
    depends_on: [minio]
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minio minio123 &&
      mc mb -p local/venue-catalog-media || true"
```

## 12. Criteres d'acceptation

- [ ] Import `rooftop casablanca` persiste 1–5 photos MinIO par lieu cree
- [ ] `GET /places/:id` retourne `media[].url` signee + `attributionText`
- [ ] Photo expiree purgee automatiquement (test avec TTL raccourci)
- [ ] Re-import idempotent : pas de doublon objet MinIO (meme checksum)
- [ ] Aucune URL `places.googleapis.com` exposee au client final

## 13. Open questions

- CDN devant MinIO en prod (Cloudflare / Nginx) : a trancher infra.
- Watermark attribution cote image vs texte UI seulement : V1 texte UI suffit.
- WebP au lieu de JPEG : acceptable si conversion pipeline supporte les deux.
