---
specVersion: 1
kind: api
appId: beauty
resource: services
status: draft
phase: P3
basePath: /api/v1/salons/:slug/services
auth: optional
rateLimit: default
backendOwner: backend/domains/beauty/catalog
---

# services Mock API

## Vue d'ensemble

Expose le catalogue de services (= prestations) d'un salon : nom, catégorie, durée, prix, photos, staff affectés. Lecture publique pour la fiche salon ; écriture côté pro.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| salonId | string (uuid) | oui | |
| categoryId | string (uuid) | oui | référence à une catégorie du salon |
| name | string | oui | ex : "Coupe femme cheveux longs" |
| description | string | non | détail prestations incluses |
| durationMinutes | integer | oui | 5-480 |
| priceMinor | integer | oui | en centimes MAD, > 0 |
| currency | string | oui | toujours `MAD` V1 |
| photoUrl | string | non | URL signée MinIO |
| assignedStaffIds | string[] | non | si vide → tous les staffs du salon peuvent réaliser le service |
| genderTarget | string enum | non | `WOMEN` / `MEN` / `MIXED`, défaut `MIXED` |
| bufferBeforeMinutes | integer | non | défaut 0, préparation |
| bufferAfterMinutes | integer | non | défaut 0, nettoyage |
| active | boolean | oui | défaut `true` |
| order | integer | oui | tri dans la catégorie |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### Catégorie

| Champ | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| salonId | string (uuid) | |
| name | string | ex "Coiffure", "Soin du visage" |
| order | integer | |

## Endpoints

### GET /api/v1/salons/:slug/services

- Auth : public.
- Query :
  | Param | Description |
  |---|---|
  | `groupBy` | `category` (défaut) — renvoie une structure groupée |
  | `staffId` | filtre les services réalisables par ce staff |
  | `active` | `true` (défaut, public) ou `false` (admin pro uniquement) |
- Réponse 200 (groupBy=category) :
  ```json
  {
    "categories": [
      {
        "id": "cat-1",
        "name": "Coiffure",
        "services": [ /* services */ ]
      }
    ]
  }
  ```
- Erreurs : 404 (salon).

### GET /api/v1/salons/:slug/services/:serviceId

- Auth : public.
- Réponse 200 : service complet.
- Erreurs : 404.

### POST /api/v1/pro/services

- Auth : required.
- Rôles : OWNER, ADMIN.
- Headers : `X-Tenant-Id`.
- Body :
  ```json
  {
    "categoryId": "cat-1",
    "name": "Coupe femme + brushing",
    "description": "Coupe + soin + brushing",
    "durationMinutes": 60,
    "priceMinor": 25000,
    "currency": "MAD",
    "genderTarget": "WOMEN",
    "bufferAfterMinutes": 10,
    "assignedStaffIds": ["staff-1", "staff-2"]
  }
  ```
- Réponse 201 : service créé.
- Erreurs : 422.

### PATCH /api/v1/pro/services/:serviceId

- Auth : required.
- Body partiel : tout champ modifiable.
- Réponse 200 : service mis à jour.
- Erreurs : 404, 422, 409 (`booking_in_future` si on tente de désactiver un service avec des RDV futurs ; il faut purger ou attendre).

### DELETE /api/v1/pro/services/:serviceId

- Auth : required.
- Effet : soft delete (`active=false` + `deletedAt`). Refusé si RDV futurs > 0.
- Réponse 204.
- Erreurs : 409 (bookings futurs).

### POST /api/v1/pro/services/:serviceId/photo

- Auth : required.
- Body : multipart `file`.
- Réponse 200 : `{ "photoUrl": "..." }`.
- Erreurs : 413, 415.

### GET /api/v1/pro/services/categories

- Auth : required.
- Réponse 200 : `{ "items": [ /* catégories */ ] }`.

### POST /api/v1/pro/services/categories

- Auth : required.
- Body : `{ "name": "Soin du visage", "order": 2 }`.
- Réponse 201 : catégorie.
- Erreurs : 422 (nom dupliqué).

### PATCH /api/v1/pro/services/categories/:categoryId

- Auth : required.
- Body partiel : `name`, `order`.
- Réponse 200.

### DELETE /api/v1/pro/services/categories/:categoryId

- Auth : required.
- Erreurs : 409 (catégorie non vide).
- Réponse 204.

## Erreurs communes

| Code | Cas |
|---|---|
| 401 | non authentifié |
| 403 | rôle insuffisant |
| 404 | salon ou service non trouvé |
| 409 | conflit (catégorie non vide, bookings futurs) |
| 422 | validation (prix négatif, durée hors borne) |
| 423 | tenant suspendu |

## Fixtures

```json
{
  "categories": [
    {
      "id": "cat-001",
      "salonId": "00000000-0000-0000-0000-000000000001",
      "name": "Coiffure femme",
      "order": 1,
      "services": [
        {
          "id": "svc-001",
          "salonId": "00000000-0000-0000-0000-000000000001",
          "categoryId": "cat-001",
          "name": "Coupe femme + brushing",
          "description": "Coupe, soin nourrissant, brushing.",
          "durationMinutes": 60,
          "priceMinor": 25000,
          "currency": "MAD",
          "photoUrl": "https://mock.minio/beauty/01/svc-001.jpg",
          "assignedStaffIds": ["staff-001", "staff-002"],
          "genderTarget": "WOMEN",
          "bufferAfterMinutes": 10,
          "active": true,
          "order": 1
        },
        {
          "id": "svc-002",
          "salonId": "00000000-0000-0000-0000-000000000001",
          "categoryId": "cat-001",
          "name": "Coloration racines",
          "durationMinutes": 90,
          "priceMinor": 45000,
          "currency": "MAD",
          "assignedStaffIds": ["staff-001"],
          "genderTarget": "WOMEN",
          "bufferAfterMinutes": 15,
          "active": true,
          "order": 2
        }
      ]
    },
    {
      "id": "cat-002",
      "salonId": "00000000-0000-0000-0000-000000000001",
      "name": "Coiffure homme",
      "order": 2,
      "services": [
        {
          "id": "svc-003",
          "salonId": "00000000-0000-0000-0000-000000000001",
          "categoryId": "cat-002",
          "name": "Coupe homme classique",
          "durationMinutes": 30,
          "priceMinor": 8000,
          "currency": "MAD",
          "assignedStaffIds": [],
          "genderTarget": "MEN",
          "active": true,
          "order": 1
        }
      ]
    }
  ]
}
```

## Contraintes pour le futur backend réel

- Pagination : non (catalogue salon généralement < 100 services). Si dépasse, basculer en cursor sur l'endpoint plat (non exposé V1).
- Tenant scope : `/pro/services*` toujours scopé par `X-Tenant-Id`. Lecture publique passe par `slug` → tenant inféré.
- Idempotence : POST accepte `Idempotency-Key` (utile en cas de double-clic UI).
- Audit : toute mutation tracée.
- Conflit booking : suppression refusée si RDV futur référence le service ; recommandation : désactiver (`active=false`) au lieu de supprimer.

## Open questions

- Variantes (ex : coupe cheveux courts / mi-longs / longs avec prix différents) : V1 = services séparés, V2 = variantes intra-service.
- Photo par service obligatoire ? V1 optionnel, photo placeholder par catégorie.
- Multi-langue du nom de service : V1 stocké en `fr` uniquement, libellé non traduit ; V2 stocker `name.fr` / `name.ar` / `name.en`.
