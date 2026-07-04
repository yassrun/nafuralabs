---
specVersion: 1
kind: api
appId: beauty
resource: staff
status: draft
phase: P3
basePath: /api/v1/salons/:slug/staff
auth: optional
rateLimit: default
backendOwner: backend/domains/beauty/staff
---

# staff Mock API

## Vue d'ensemble

Liste des praticiens d'un salon avec leurs spécialités, horaires de travail et congés. Lecture publique (vue allégée) pour permettre au client de choisir un staff lors de la réservation. Écriture côté pro.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | |
| salonId | string (uuid) | oui | |
| firstName | string | oui | |
| lastName | string | non | optionnel pour anonymisation pseudo (ex "Sophie") |
| displayName | string | oui | calculé : prénom + initiale nom |
| role | string enum | oui | `OWNER` / `MANAGER` / `STAFF` (rôle interne salon, distinct du rôle applicatif) |
| photoUrl | string | non | URL signée MinIO |
| bio | string | non | présentation courte |
| specialties | string[] | non | catégories ou tags libres |
| serviceIds | string[] | non | services réalisables (V1 dérivé via `service.assignedStaffIds`) |
| rating | object | non | `{ average, count }` agrégé sur ses bookings notés |
| workingHours | object[] | oui | 7 entrées hebdomadaires |
| timeOff | object[] | non | congés ponctuels |
| userAccountId | string (uuid) | non | id Keycloak applicatif si staff a un compte connecté |
| active | boolean | oui | défaut `true` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

### workingHours

```json
{
  "weekday": "MONDAY",
  "off": false,
  "ranges": [{ "from": "09:00", "to": "13:00" }, { "from": "14:00", "to": "18:00" }]
}
```

### timeOff

```json
{
  "id": "to-001",
  "from": "2026-07-01T00:00:00+01:00",
  "to": "2026-07-15T23:59:59+01:00",
  "reason": "Congés annuels"
}
```

## Endpoints

### GET /api/v1/salons/:slug/staff

- Auth : public.
- Query :
  | Param | Description |
  |---|---|
  | `serviceId` | filtre les staff capables de réaliser ce service |
  | `availableOn` | `yyyy-MM-dd`, filtre les staff non en congé ce jour |
- Réponse 200 : `{ "items": [ /* staff (vue publique) */ ] }` (sans `userAccountId`, sans `timeOff` détaillé, juste `unavailableDates: [...]`).

### GET /api/v1/salons/:slug/staff/:staffId

- Auth : public.
- Réponse 200 : staff vue publique.
- Erreurs : 404.

### GET /api/v1/pro/staff

- Auth : required.
- Rôles : OWNER, ADMIN, STAFF (STAFF voit lecture seule).
- Headers : `X-Tenant-Id`.
- Query : `includeInactive=true` pour récupérer aussi les staffs désactivés.
- Réponse 200 : `{ "items": [ /* staff complet */ ] }`.

### POST /api/v1/pro/staff

- Auth : required.
- Rôles : OWNER, ADMIN.
- Body :
  ```json
  {
    "firstName": "Salma",
    "lastName": "Idrissi",
    "role": "STAFF",
    "specialties": ["HAIR_WOMEN"],
    "workingHours": [
      { "weekday": "MONDAY", "off": false, "ranges": [{ "from": "09:00", "to": "18:00" }] }
    ],
    "createUserAccount": true,
    "phone": "+212600999000"
  }
  ```
- Effet : crée la fiche staff ; si `createUserAccount=true`, déclenche envoi OTP au staff.
- Réponse 201 : staff créé.
- Erreurs : 422, 409 (téléphone déjà utilisé pour un staff actif).

### PATCH /api/v1/pro/staff/:staffId

- Auth : required.
- Rôles : OWNER, ADMIN (ADMIN ne peut pas modifier le `role` d'un OWNER).
- Body partiel.
- Réponse 200.

### DELETE /api/v1/pro/staff/:staffId

- Auth : required.
- Rôles : OWNER.
- Effet : soft delete. Refusé si RDV futurs.
- Réponse 204.
- Erreurs : 409.

### POST /api/v1/pro/staff/:staffId/photo

- Auth : required.
- Body : multipart `file`.
- Réponse 200 : `{ "photoUrl": "..." }`.

### POST /api/v1/pro/staff/:staffId/time-off

- Auth : required.
- Body : `{ "from": "...", "to": "...", "reason": "..." }`.
- Réponse 201 : `timeOff` créé.
- Erreurs : 409 (RDV existants pendant la période → message dédié avec liste).

### DELETE /api/v1/pro/staff/:staffId/time-off/:timeOffId

- Auth : required.
- Réponse 204.

### GET /api/v1/pro/staff/me

- Auth : required.
- Rôles : STAFF.
- Effet : retourne le profil du staff lié au JWT courant.
- Réponse 200.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 409, 422, 423 | comme conventions globales |

## Fixtures

```json
{
  "items": [
    {
      "id": "staff-001",
      "salonId": "00000000-0000-0000-0000-000000000001",
      "firstName": "Salma",
      "lastName": "Idrissi",
      "displayName": "Salma I.",
      "role": "STAFF",
      "photoUrl": "https://mock.minio/beauty/01/staff-001.jpg",
      "bio": "10 ans d'expérience, spécialiste coloration.",
      "specialties": ["HAIR_WOMEN", "MAKEUP"],
      "rating": { "average": 4.7, "count": 58 },
      "workingHours": [
        { "weekday": "MONDAY", "off": false, "ranges": [{ "from": "09:00", "to": "18:00" }] },
        { "weekday": "TUESDAY", "off": false, "ranges": [{ "from": "09:00", "to": "18:00" }] },
        { "weekday": "WEDNESDAY", "off": true, "ranges": [] },
        { "weekday": "THURSDAY", "off": false, "ranges": [{ "from": "09:00", "to": "18:00" }] },
        { "weekday": "FRIDAY", "off": false, "ranges": [{ "from": "09:00", "to": "18:00" }] },
        { "weekday": "SATURDAY", "off": false, "ranges": [{ "from": "09:00", "to": "20:00" }] },
        { "weekday": "SUNDAY", "off": true, "ranges": [] }
      ],
      "timeOff": [
        { "id": "to-001", "from": "2026-07-01T00:00:00+01:00", "to": "2026-07-15T23:59:59+01:00", "reason": "Congés annuels" }
      ],
      "active": true
    },
    {
      "id": "staff-002",
      "salonId": "00000000-0000-0000-0000-000000000001",
      "firstName": "Karim",
      "lastName": "Tazi",
      "displayName": "Karim T.",
      "role": "OWNER",
      "specialties": ["HAIR_MEN", "BARBER"],
      "rating": { "average": 4.8, "count": 124 },
      "workingHours": [
        { "weekday": "MONDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "TUESDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "WEDNESDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "THURSDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "FRIDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "SATURDAY", "off": false, "ranges": [{ "from": "10:00", "to": "20:00" }] },
        { "weekday": "SUNDAY", "off": true, "ranges": [] }
      ],
      "active": true
    }
  ]
}
```

## Contraintes pour le futur backend réel

- Tenant scope : tout endpoint `/pro/staff*` scopé par `X-Tenant-Id`. Lecture publique passe par `slug`.
- Idempotence : POST staff et POST time-off acceptent `Idempotency-Key`.
- Audit : création, suppression, modification d'horaires audités (impact RDV).
- Cohérence : un staff a au moins un `workingHours` non vide pour apparaître dans le picker booking.
- Création utilisateur : si `createUserAccount=true`, un user Keycloak est provisionné en mode pré-activé (active sur premier OTP login).

## Open questions

- Staff peut-il appartenir à plusieurs salons (multi-tenant) ? V1 = non, 1 staff = 1 tenant.
- Affichage du nom complet vs prénom + initiale : V1 = prénom + initiale par défaut, le pro peut choisir au staff près.
- Horaires différents par semaine paire/impaire : repoussé V2.
