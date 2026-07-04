---
specVersion: 1
kind: api
appId: layali
resource: customers
status: draft
phase: P3
basePath: /api/v1/customers
auth: required
rateLimit: default
backendOwner: backend/domains/layali/customer
---

# customers Mock API

## Vue d'ensemble

Profil utilisateur client (CUSTOMER) : lecture et mise à jour de ses informations personnelles, préférences et consentements. Pas d'admin direct par le pro (le pro voit le client via le booking, sans accéder au profil global).

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | string (uuid) | oui | = JWT subject |
| email | string | oui | unique |
| phone | string | oui | E.164 unique |
| phoneVerified | boolean | oui | |
| displayName | string | oui | |
| firstName | string | non | |
| lastName | string | non | |
| birthDate | date | non | yyyy-MM-dd (auto-déduit `ageMin` ok) |
| city | string | non | enum villes |
| locale | string | oui | `fr`, `ar`, `en` |
| avatarUrl | string | non | |
| favoriteVenueIds | string[] | non | |
| consentMarketing | boolean | oui | |
| consentAge18Plus | boolean | oui | obligatoire à `true` |
| createdAt | datetime | oui | |
| updatedAt | datetime | oui | |

## Endpoints

### GET /api/v1/customers/me

- Auth : required.
- Rôles : CUSTOMER (et tout autre rôle, qui voit son propre profil).
- Réponse 200 : customer complet + stats agrégées `{ totalBookings, totalTickets, lastVisitAt }`.
- Erreurs : 401.

### PATCH /api/v1/customers/me

- Auth : required.
- Body partiel : `displayName`, `firstName`, `lastName`, `birthDate`, `city`, `locale`, `consentMarketing`.
- `phone` et `email` ont des flows dédiés (voir ci-dessous).
- Réponse 200.
- Erreurs : 422.

### POST /api/v1/customers/me/avatar

- Auth : required.
- Content-Type : `multipart/form-data` (champ `file`, max 2 Mo, jpeg/webp).
- Réponse 200 : `{ "avatarUrl": "..." }`.
- Erreurs : 413, 415.

### POST /api/v1/customers/me/phone/change/request

- Auth : required.
- Body : `{ "phone": "+212600999000" }`.
- Effet : envoie un OTP au nouveau numéro via [auth.api.md](auth.api.md) (`purpose=VERIFY_PHONE`).
- Réponse 202 : `{ "challengeId": "ch-001" }`.

### POST /api/v1/customers/me/phone/change/confirm

- Auth : required.
- Body : `{ "challengeId": "ch-001", "code": "123456" }`.
- Effet : valide le nouveau numéro, met à jour `phone` + `phoneVerified=true`.
- Réponse 200 : customer mis à jour.

### POST /api/v1/customers/me/email/change/request

- Auth : required.
- Body : `{ "email": "new@example.ma" }`.
- Effet : envoie un email de confirmation avec lien signé (TTL 1h).
- Réponse 202.

### POST /api/v1/customers/me/email/change/confirm

- Auth : required.
- Body : `{ "token": "email.change.jwt" }`.
- Réponse 200.

### POST /api/v1/customers/me/favorites/:venueId

- Auth : required.
- Effet : ajoute le venue aux favoris.
- Réponse 204.

### DELETE /api/v1/customers/me/favorites/:venueId

- Auth : required.
- Réponse 204.

### DELETE /api/v1/customers/me

- Auth : required.
- Body : `{ "password": "..." }` (revérification).
- Effet : soft delete avec anonymisation immédiate (`email`, `phone`, `displayName` remplacés par `deleted-<id>`), bookings et tickets conservés sans identité personnelle.
- Réponse 202 : `{ "deletedAt": "..." }`.

## Erreurs communes

| Code | Cas |
|---|---|
| 401, 403, 404, 422 | classiques |
| 409 | `email_exists`, `phone_exists` |

## Fixtures

```json
[
  {
    "id": "00000000-0000-0000-1000-000000000001",
    "email": "sara@example.ma",
    "phone": "+212600111222",
    "phoneVerified": true,
    "displayName": "Sara Bennani",
    "firstName": "Sara",
    "lastName": "Bennani",
    "birthDate": "1996-03-15",
    "city": "casablanca",
    "locale": "fr",
    "avatarUrl": null,
    "favoriteVenueIds": ["00000000-0000-0000-0000-000000000010"],
    "consentMarketing": true,
    "consentAge18Plus": true,
    "createdAt": "2025-12-10T10:00:00+01:00",
    "updatedAt": "2026-06-01T10:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-1000-000000000002",
    "email": "youssef@example.ma",
    "phone": "+212600333444",
    "phoneVerified": true,
    "displayName": "Youssef El Idrissi",
    "firstName": "Youssef",
    "lastName": "El Idrissi",
    "birthDate": "1993-08-22",
    "city": "marrakech",
    "locale": "fr",
    "avatarUrl": null,
    "favoriteVenueIds": [],
    "consentMarketing": false,
    "consentAge18Plus": true,
    "createdAt": "2026-04-01T10:00:00+01:00",
    "updatedAt": "2026-06-08T14:00:00+01:00"
  }
]
```

## Contraintes pour le futur backend réel

- Identité Keycloak : email + password gérés par Keycloak realm `nafura` ; le backend Layali ne stocke pas le mot de passe.
- Audit : changement de phone, email, suppression de compte.
- RGPD : `DELETE /customers/me` déclenche un job background qui purge les avatars MinIO et anonymise les snapshots (mais conserve les agrégats analytics).
- Cache : `GET /customers/me` cacheable 30s côté client uniquement (jamais CDN).

## Open questions

- Linking avec Keycloak Identity Brokering (Google/Apple) : V2.
- KYC léger (CIN/passport upload) pour les acheteurs VIP : V2.
- Programme de fidélité cross-venues : hors scope V1 (pas de loyalty Layali).
