---
specVersion: 1
kind: api
appId: beauty
resource: salons
status: draft
phase: P3
basePath: /api/v1/salons
auth: optional
rateLimit: default
backendOwner: backend/domains/beauty/salon
---

# salons Mock API

## Vue d'ensemble

Expose la fiche publique de chaque salon (slug, photos, adresse, horaires, score moyen) pour la zone discovery, ainsi que l'édition côté pro (`/pro/salons/me`). Les filtres principaux (ville, service, note) vivent sur cet endpoint.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | id stable, = tenantId V1 |
| slug | string | oui | kebab-case unique global |
| name | string | oui | nom commercial |
| tagline | string | non | accroche courte |
| description | string | non | markdown light (jamais HTML brut) |
| categories | string[] | oui | enum `HAIR_WOMEN` / `HAIR_MEN` / `BARBER` / `NAILS` / `MAKEUP` / `SPA` / `HAMMAM` / `EYEBROWS` |
| city | string | oui | enum normalisé : `CASABLANCA`, `RABAT`, `MARRAKECH`, `TANGIER`, `FES`, `AGADIR`, `OTHER` |
| address | object | oui | `street`, `district`, `postalCode`, `cityLabel` |
| location | object | oui | `lat`, `lng` (WGS84) |
| phone | string E.164 | oui | numéro de réservation salon |
| photos | object[] | non | `{ id, url, alt, order }`, URL signée MinIO |
| coverPhotoId | string (uuid) | non | id de photo dans `photos` |
| openingHours | object[] | oui | 7 entrées (lundi-dimanche), voir §Modèle openingHours |
| exceptionalClosures | object[] | non | `{ date, reason }` |
| rating | object | oui | `{ average: number 0-5, count: integer }` |
| priceLevel | integer 1-3 | non | symbole MAD (€/€€/€€€) calculé depuis les services |
| status | string enum | oui | `DRAFT` / `PUBLISHED` / `SUSPENDED` |
| acceptsOnlinePayment | boolean | oui | défaut `false` (cash) |
| cancellationWindowHours | integer | oui | défaut 4 |
| loyaltyEnabled | boolean | oui | défaut `false` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Modèle openingHours

```json
{
  "weekday": "MONDAY",
  "closed": false,
  "ranges": [
    { "from": "09:00", "to": "13:00" },
    { "from": "14:30", "to": "20:00" }
  ]
}
```

## Endpoints

### GET /api/v1/salons

- Auth : public.
- Rôles : —.
- Query params :
  | Param | Type | Description |
  |---|---|---|
  | `q` | string | recherche texte (nom + tagline) |
  | `city` | string enum | filtre ville |
  | `category` | string enum | filtre catégorie de service |
  | `minRating` | number 0-5 | note minimale |
  | `priceLevel` | integer | 1 / 2 / 3 |
  | `near` | string `lat,lng` | tri par distance |
  | `radiusKm` | number | rayon si `near` fourni, défaut 10 |
  | `sort` | enum | `relevance` (défaut) / `rating` / `distance` / `priceAsc` |
  | `pageSize` | int 1-50 | défaut 20 |
  | `cursor` | string | pagination |
- Réponse 200 :
  ```json
  {
    "items": [ /* salons (vue listing) */ ],
    "page": { "size": 20, "total": 137, "cursor": "eyJvIjoiMjAifQ==", "hasMore": true }
  }
  ```
- Erreurs : 422 (params invalides).

### GET /api/v1/salons/:slug

- Auth : public.
- Path param : `slug`.
- Query : `includeServices=true` (option, retourne aussi un échantillon des 8 services les mieux notés).
- Réponse 200 : objet salon complet.
- Erreurs : 404.

### GET /api/v1/salons/:slug/reviews-summary

- Auth : public.
- Réponse 200 :
  ```json
  {
    "average": 4.6,
    "count": 142,
    "distribution": { "1": 2, "2": 4, "3": 10, "4": 38, "5": 88 }
  }
  ```
- Erreurs : 404.

### GET /api/v1/pro/salons/me

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id` requis.
- Réponse 200 : objet salon complet (vue admin avec `status`, `acceptsOnlinePayment`, etc.).
- Erreurs : 401, 403, 404.

### PATCH /api/v1/pro/salons/me

- Auth : required.
- Rôles : OWNER (champs facturation), ADMIN (autres champs).
- Body partiel : tout champ modifiable (`name`, `tagline`, `description`, `address`, `location`, `openingHours`, `phone`, `acceptsOnlinePayment`, `cancellationWindowHours`, `loyaltyEnabled`, `categories`).
- Réponse 200 : objet salon mis à jour.
- Erreurs : 422, 423 (tenant suspendu).

### POST /api/v1/pro/salons/me/photos

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : multipart `file` + champ optionnel `alt`.
- Réponse 201 : `{ "id": "...", "url": "...", "alt": "..." }`.
- Erreurs : 413 (taille > 5 Mo), 415 (type non supporté).

### PATCH /api/v1/pro/salons/me/photos/order

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body : `{ "order": ["photoId1", "photoId2", ...] }`.
- Réponse 204.

### DELETE /api/v1/pro/salons/me/photos/:photoId

- Auth : required.
- Réponse 204.
- Erreurs : 404, 409 (photo = couverture, retirer la couverture avant).

### POST /api/v1/pro/salons/me/publish

- Auth : required.
- Rôles : OWNER.
- Effet : passe `status` de `DRAFT` à `PUBLISHED` après validation (au moins 1 photo, ≥3 services, ≥1 staff, horaires complets).
- Réponse 200 : objet salon mis à jour.
- Erreurs : 422 (préconditions non remplies, `details` liste les manquants).

## Erreurs communes

| Code | Cas | Payload |
|---|---|---|
| 401 | non authentifié | `{ "error": "unauthorized" }` |
| 403 | rôle insuffisant | `{ "error": "forbidden", "missing": "salon.update" }` |
| 404 | salon inexistant ou supprimé | `{ "error": "not_found" }` |
| 409 | slug en conflit, photo couverture | `{ "error": "conflict" }` |
| 422 | validation, publication impossible | `{ "error": "validation", "details": [...] }` |
| 423 | tenant suspendu | `{ "error": "locked" }` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "slug": "studio-hair-casablanca",
    "name": "Studio Hair Casablanca",
    "tagline": "Coupe, couleur et brushing au cœur du Maârif",
    "description": "Salon mixte fondé en 2018, équipe trilingue, produits L'Oréal Professionnel.",
    "categories": ["HAIR_WOMEN", "HAIR_MEN", "MAKEUP"],
    "city": "CASABLANCA",
    "address": {
      "street": "12 rue d'Agadir",
      "district": "Maârif",
      "postalCode": "20100",
      "cityLabel": "Casablanca"
    },
    "location": { "lat": 33.5731, "lng": -7.5898 },
    "phone": "+212522445566",
    "photos": [
      { "id": "p1", "url": "https://mock.minio/beauty/01/p1.jpg", "alt": "Salon vu de l'entrée", "order": 0 },
      { "id": "p2", "url": "https://mock.minio/beauty/01/p2.jpg", "alt": "Poste de coiffure", "order": 1 }
    ],
    "coverPhotoId": "p1",
    "openingHours": [
      { "weekday": "MONDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "20:00" }] },
      { "weekday": "TUESDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "20:00" }] },
      { "weekday": "WEDNESDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "20:00" }] },
      { "weekday": "THURSDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "20:00" }] },
      { "weekday": "FRIDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "13:00" }, { "from": "15:00", "to": "21:00" }] },
      { "weekday": "SATURDAY", "closed": false, "ranges": [{ "from": "09:00", "to": "21:00" }] },
      { "weekday": "SUNDAY", "closed": true, "ranges": [] }
    ],
    "exceptionalClosures": [
      { "date": "2026-06-15", "reason": "Aïd al-Adha" }
    ],
    "rating": { "average": 4.6, "count": 142 },
    "priceLevel": 2,
    "status": "PUBLISHED",
    "acceptsOnlinePayment": true,
    "cancellationWindowHours": 4,
    "loyaltyEnabled": true,
    "createdAt": "2025-09-01T10:00:00+01:00",
    "updatedAt": "2026-06-01T14:20:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "slug": "beauty-lounge-rabat",
    "name": "Beauty Lounge Rabat",
    "tagline": "Esthétique et soins du visage à Agdal",
    "categories": ["MAKEUP", "NAILS", "EYEBROWS"],
    "city": "RABAT",
    "address": { "street": "8 avenue Fal Ould Oumeir", "district": "Agdal", "postalCode": "10090", "cityLabel": "Rabat" },
    "location": { "lat": 34.0014, "lng": -6.8543 },
    "phone": "+212537667788",
    "photos": [{ "id": "p1", "url": "https://mock.minio/beauty/02/p1.jpg", "alt": "Vitrine", "order": 0 }],
    "coverPhotoId": "p1",
    "openingHours": [
      { "weekday": "MONDAY", "closed": true, "ranges": [] },
      { "weekday": "TUESDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "19:00" }] },
      { "weekday": "WEDNESDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "19:00" }] },
      { "weekday": "THURSDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "19:00" }] },
      { "weekday": "FRIDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "19:00" }] },
      { "weekday": "SATURDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
      { "weekday": "SUNDAY", "closed": false, "ranges": [{ "from": "11:00", "to": "17:00" }] }
    ],
    "rating": { "average": 4.4, "count": 67 },
    "priceLevel": 3,
    "status": "PUBLISHED",
    "acceptsOnlinePayment": false,
    "cancellationWindowHours": 6,
    "loyaltyEnabled": false,
    "createdAt": "2025-11-10T09:00:00+01:00",
    "updatedAt": "2026-05-20T12:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-0000-000000000003",
    "slug": "barber-house-marrakech",
    "name": "Barber House Marrakech",
    "categories": ["BARBER", "HAIR_MEN"],
    "city": "MARRAKECH",
    "address": { "street": "Rue de la Liberté", "district": "Gueliz", "postalCode": "40000", "cityLabel": "Marrakech" },
    "location": { "lat": 31.6346, "lng": -7.9994 },
    "phone": "+212524998877",
    "photos": [],
    "openingHours": [
      { "weekday": "MONDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "TUESDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "WEDNESDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "THURSDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "FRIDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "SATURDAY", "closed": false, "ranges": [{ "from": "10:00", "to": "22:00" }] },
      { "weekday": "SUNDAY", "closed": false, "ranges": [{ "from": "11:00", "to": "20:00" }] }
    ],
    "rating": { "average": 4.8, "count": 213 },
    "priceLevel": 1,
    "status": "PUBLISHED",
    "acceptsOnlinePayment": true,
    "cancellationWindowHours": 2,
    "loyaltyEnabled": true,
    "createdAt": "2025-06-15T16:00:00+01:00",
    "updatedAt": "2026-06-05T10:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Pagination : cursor-based, défaut 20, max 50.
- Tenant scope : endpoints publics (`GET /salons*`) ne scopent pas ; `/pro/salons/me` est scopé par `X-Tenant-Id` matchant `tenantId` du JWT.
- Idempotence : `POST publish` accepte `Idempotency-Key`.
- Audit : toute mutation produit un événement audit avec `tenantId` et `userId`.
- Géosearch : index PostGIS sur `location` quand on passe au backend réel.
- Slug : généré à la création, ré-écrit interdit V1 (sinon casse SEO et liens).

## Open questions

- `categories` : enum fermé ou ouvert (le salon ajoute ses propres tags) ? V1 fermé pour la cohérence des filtres ; tags libres en V2.
- `priceLevel` : calculé serveur depuis le panier moyen des services ou saisi manuellement par le salon ? V1 calculé.
- Multi-photo couverture sur mobile vs desktop : 1 cover unique V1.
