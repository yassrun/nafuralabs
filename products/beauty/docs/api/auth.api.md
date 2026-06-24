---
specVersion: 1
kind: api
appId: beauty
resource: auth
status: stable
basePath: /api/v1/auth
auth: public
rateLimit: strict
backendOwner: backend/domains/beauty/customer
---

# auth Mock API

## Vue d'ensemble

Endpoints d'authentification client (et pro via Keycloak). Combine login email/password classique (pro) et flux OTP téléphone (client mobile-first). En mode mock, simule la délivrance de JWT Keycloak.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| accessToken | string (JWT) | oui | token Keycloak signé, exp 15 min |
| refreshToken | string (opaque) | oui | exp 30 jours |
| tokenType | string | oui | toujours `Bearer` |
| expiresIn | integer | oui | secondes (900) |
| user | object | oui | profil utilisateur connecté |
| user.id | string (uuid) | oui | id applicatif |
| user.role | string enum | oui | `CUSTOMER` / `OWNER` / `ADMIN` / `STAFF` / `PLATFORM_ADMIN` |
| user.tenantId | string (uuid) | non | présent uniquement si rôle pro |
| user.phone | string E.164 | non | présent si auth OTP |
| user.email | string | non | présent si auth email |
| user.locale | string | oui | `fr` / `ar` / `en` |

## Endpoints

### POST /api/v1/auth/otp/request

- Auth : public.
- Rôles : —.
- Body :
  ```json
  {
    "phone": "+212600111222",
    "locale": "fr"
  }
  ```
- Effet : génère un OTP 6 chiffres, l'envoie par SMS (mock : log en console). En mock, code accepté toujours = `123456`.
- Réponse 200 :
  ```json
  {
    "otpId": "00000000-0000-0000-2000-000000000001",
    "expiresInSeconds": 300,
    "resendInSeconds": 60
  }
  ```
- Erreurs : 422 (format téléphone), 429 (rate limit 3 demandes / 10 min / numéro).

### POST /api/v1/auth/otp/verify

- Auth : public.
- Body :
  ```json
  {
    "otpId": "00000000-0000-0000-2000-000000000001",
    "code": "123456",
    "firstName": "Sara",
    "lastName": "Bennani"
  }
  ```
- Effet : valide le code, crée le compte si premier login (champs `firstName`/`lastName` requis dans ce cas), retourne un token Keycloak.
- Réponse 200 :
  ```json
  {
    "accessToken": "mock-customer-token",
    "refreshToken": "mock-refresh-customer",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "00000000-0000-0000-1000-000000000001",
      "role": "CUSTOMER",
      "phone": "+212600111222",
      "locale": "fr"
    }
  }
  ```
- Erreurs : 401 (code invalide), 422 (champs profil manquants au premier login), 409 (otpId déjà consommé), 429.

### POST /api/v1/auth/login

- Auth : public.
- Body :
  ```json
  {
    "email": "owner@studiohair.ma",
    "password": "********"
  }
  ```
- Effet : login email/password (pro et admin). Pas utilisé côté CUSTOMER.
- Réponse 200 : même format que `otp/verify`, avec `user.email` et `user.tenantId` si applicable.
- Erreurs : 401 (`invalid_credentials`), 403 (`account_disabled`), 423 (`tenant_suspended`), 429.

### POST /api/v1/auth/refresh

- Auth : public (porte le refresh token en body).
- Body :
  ```json
  { "refreshToken": "mock-refresh-customer" }
  ```
- Réponse 200 : nouveau couple `accessToken` / `refreshToken`.
- Erreurs : 401 (`invalid_refresh`), 403 (`session_revoked`).

### POST /api/v1/auth/logout

- Auth : required.
- Body : vide.
- Effet : révoque le refresh token courant.
- Réponse 204.

### GET /api/v1/auth/me

- Auth : required.
- Réponse 200 :
  ```json
  {
    "id": "00000000-0000-0000-1000-000000000001",
    "role": "CUSTOMER",
    "phone": "+212600111222",
    "email": null,
    "firstName": "Sara",
    "lastName": "Bennani",
    "locale": "fr",
    "tenantId": null,
    "createdAt": "2026-01-15T10:00:00+01:00"
  }
  ```
- Erreurs : 401.

### PATCH /api/v1/auth/me

- Auth : required.
- Body partiel :
  ```json
  {
    "firstName": "Sara",
    "lastName": "Bennani-El Idrissi",
    "locale": "ar",
    "email": "sara.b@example.com",
    "notificationPreferences": {
      "sms": true,
      "email": false,
      "reminderHoursBefore": 24
    }
  }
  ```
- Réponse 200 : profil mis à jour.
- Erreurs : 422, 409 (email déjà utilisé).

## Erreurs communes

| Code | Cas | Payload |
|---|---|---|
| 401 | non authentifié / token invalide | `{ "error": "unauthorized" }` |
| 403 | compte suspendu | `{ "error": "forbidden", "message": "account_disabled" }` |
| 422 | validation | `{ "error": "validation", "details": [...] }` |
| 429 | trop de tentatives | `{ "error": "rate_limited", "retryAfter": 60 }` |

## Fixtures

### Profils utilisateurs mock

```json
[
  {
    "id": "00000000-0000-0000-1000-000000000001",
    "role": "CUSTOMER",
    "phone": "+212600111222",
    "firstName": "Sara",
    "lastName": "Bennani",
    "locale": "fr",
    "createdAt": "2026-01-15T10:00:00+01:00"
  },
  {
    "id": "00000000-0000-0000-1000-000000000002",
    "role": "CUSTOMER",
    "phone": "+212600333444",
    "firstName": "Youssef",
    "lastName": "El Idrissi",
    "locale": "ar",
    "createdAt": "2026-02-20T18:30:00+01:00"
  },
  {
    "id": "00000000-0000-0000-3000-000000000001",
    "role": "OWNER",
    "email": "owner@studiohair.ma",
    "firstName": "Karim",
    "lastName": "Tazi",
    "locale": "fr",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  },
  {
    "id": "00000000-0000-0000-9000-000000000001",
    "role": "PLATFORM_ADMIN",
    "email": "ops@nafura.ma",
    "firstName": "Nafura",
    "lastName": "Ops",
    "locale": "fr"
  }
]
```

### Réponse OTP verify (premier login)

```json
{
  "accessToken": "mock-customer-token",
  "refreshToken": "mock-refresh-customer",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "00000000-0000-0000-1000-000000000001",
    "role": "CUSTOMER",
    "phone": "+212600111222",
    "firstName": "Sara",
    "lastName": "Bennani",
    "locale": "fr"
  }
}
```

## Contraintes pour le futur backend réel

- Pagination : N/A.
- Tenant scope : aucun (auth = global).
- Idempotence : `otp/request` est idempotent côté UX (même téléphone → même `otpId` actif sous 60s, rate limit derrière).
- Audit : login, logout, refresh, échec OTP sont audités. Stockage du `traceId` retourné.
- Sécurité : OTP en hash en base, jamais en clair. Verrouillage progressif après 5 échecs OTP / 15 min.

## Open questions

- Réutilisation directe de Keycloak Direct Access Grants vs flux custom ? Décision V1 : flux applicatif qui wrap Keycloak (plus simple pour l'OTP téléphone).
- Single sign-on pro / client : un même utilisateur peut-il avoir 2 rôles ? Hypothèse V1 : non, 1 utilisateur = 1 rôle ; un propriétaire qui veut réserver pour soi utilise un autre compte.
