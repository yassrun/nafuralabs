---
specVersion: 1
kind: api
appId: layali
resource: auth
status: draft
phase: P3
basePath: /api/v1/auth
auth: public
rateLimit: strict
backendOwner: backend/domains/layali/identity
---

# auth Mock API

## Vue d'ensemble

Endpoints d'authentification pour les clients Layali (login email/password, OTP téléphone, register, refresh, logout). Ces endpoints sont des proxies devant Keycloak realm `nafura` ; en mode mock ils renvoient des JWT signés statiques.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| accessToken | string (jwt) | oui | TTL 15 min |
| refreshToken | string (jwt) | oui | TTL 7 jours |
| tokenType | string | oui | toujours `Bearer` |
| expiresIn | int | oui | secondes |
| user | object | oui | `{ id, email, phone, displayName, locale, roles[], tenantIds[] }` |

## Endpoints

### POST /api/v1/auth/login

- Auth : public.
- Body :
  ```json
  {
    "email": "sara@example.ma",
    "password": "********"
  }
  ```
- Réponse 200 :
  ```json
  {
    "accessToken": "mock.jwt.customer",
    "refreshToken": "mock.refresh.customer",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "00000000-0000-0000-1000-000000000001",
      "email": "sara@example.ma",
      "phone": "+212600111222",
      "displayName": "Sara Bennani",
      "locale": "fr",
      "roles": ["CUSTOMER"],
      "tenantIds": []
    }
  }
  ```
- Erreurs : 401 `invalid_credentials`, 423 `account_locked` (après 5 tentatives échouées en 15 min), 429.

### POST /api/v1/auth/register

- Auth : public.
- Headers : `Idempotency-Key` recommandé.
- Body :
  ```json
  {
    "email": "youssef@example.ma",
    "password": "********",
    "phone": "+212600333444",
    "displayName": "Youssef El Idrissi",
    "locale": "fr",
    "consentMarketing": false,
    "consentAge18Plus": true
  }
  ```
- Réponse 201 : payload identique au login (utilisateur auto-loggé) + `verificationRequired: true` si OTP téléphone obligatoire.
- Erreurs : 409 `email_exists`, 422 (mot de passe trop faible, téléphone invalide, `consentAge18Plus=false`).

### POST /api/v1/auth/otp/request

- Auth : public ou required selon contexte.
- Usages : login OTP-only, vérification téléphone post-register, reset mot de passe.
- Body : `{ "phone": "+212600111222", "purpose": "LOGIN" | "VERIFY_PHONE" | "RESET_PASSWORD" }`.
- Réponse 202 : `{ "challengeId": "ch-001", "expiresIn": 300, "resendAvailableInSec": 60 }`.
- Erreurs : 422 (téléphone invalide), 429 (1 demande / 60s, 5 / heure).

### POST /api/v1/auth/otp/verify

- Auth : public.
- Body : `{ "challengeId": "ch-001", "code": "123456" }`.
- Réponse 200 : payload login (utilisateur auto-loggé si `purpose=LOGIN`) ou `{ "verified": true }` si autre `purpose`.
- Erreurs : 401 `otp_invalid`, 410 `otp_expired`, 429.

### POST /api/v1/auth/refresh

- Auth : refresh token.
- Body : `{ "refreshToken": "..." }`.
- Réponse 200 : nouveau couple `accessToken` + `refreshToken` (rotation).
- Erreurs : 401 `refresh_invalid`, 401 `refresh_revoked`.

### POST /api/v1/auth/logout

- Auth : required.
- Body : `{ "refreshToken": "..." }` (révoqué côté serveur, ajouté à la blacklist 7 jours).
- Réponse 204.
- Erreurs : 401.

### POST /api/v1/auth/password/reset/request

- Auth : public.
- Body : `{ "email": "sara@example.ma" }`.
- Réponse 202 : `{ "queued": true }` (réponse identique que l'email existe ou pas, pour éviter l'énumération).

### POST /api/v1/auth/password/reset/confirm

- Auth : public.
- Body : `{ "token": "reset.jwt", "newPassword": "********" }`.
- Réponse 204.
- Erreurs : 401 `reset_token_invalid`, 410 `reset_token_expired`, 422.

## Erreurs communes

| Code | `error` | Cas |
|---|---|---|
| 401 | `unauthorized`, `invalid_credentials`, `otp_invalid`, `refresh_invalid` | |
| 410 | `otp_expired`, `reset_token_expired` | |
| 423 | `account_locked` | |
| 429 | `rate_limited` | |

## Fixtures

```json
{
  "tokens": {
    "mock-customer-token": {
      "id": "00000000-0000-0000-1000-000000000001",
      "email": "sara@example.ma",
      "phone": "+212600111222",
      "displayName": "Sara Bennani",
      "roles": ["CUSTOMER"],
      "tenantIds": []
    },
    "mock-owner-token": {
      "id": "00000000-0000-0000-2000-000000000001",
      "email": "owner@sky31.ma",
      "displayName": "Karim Owner",
      "roles": ["OWNER"],
      "tenantIds": ["sky31-casablanca"]
    },
    "mock-admin-token": {
      "id": "00000000-0000-0000-2000-000000000002",
      "email": "admin@sky31.ma",
      "displayName": "Layla Admin",
      "roles": ["ADMIN"],
      "tenantIds": ["sky31-casablanca"]
    },
    "mock-host-token": {
      "id": "00000000-0000-0000-2000-000000000003",
      "email": "host@sky31.ma",
      "displayName": "Mehdi Host",
      "roles": ["HOST"],
      "tenantIds": ["sky31-casablanca"]
    },
    "mock-bar-manager-token": {
      "id": "00000000-0000-0000-2000-000000000004",
      "email": "bar@sky31.ma",
      "displayName": "Nadia Bar",
      "roles": ["BAR_MANAGER"],
      "tenantIds": ["sky31-casablanca"]
    },
    "mock-platform-admin-token": {
      "id": "00000000-0000-0000-9000-000000000001",
      "email": "platform@nafura.ma",
      "displayName": "Nafura Ops",
      "roles": ["PLATFORM_ADMIN"],
      "tenantIds": []
    }
  },
  "otp": {
    "validCode": "123456",
    "challengeIdSample": "ch-00000000-0000-0000-0000-000000000001"
  }
}
```

## Contraintes pour le futur backend réel

- Le backend Layali ne stocke pas les mots de passe : Keycloak est source de vérité.
- L'endpoint `/auth/login` est un proxy Keycloak qui enrichit la réponse avec le user applicatif (`:platform:core:identity`).
- OTP : utiliser `:platform:integrations:sms` ; codes 6 chiffres, TTL 5 min, max 3 tentatives par challenge.
- Rate-limit OTP : 1 demande / 60s, 5 / heure / téléphone, 20 / heure / IP.
- Brute-force login : 5 tentatives → lock 15 min ; CAPTCHA après 3 échecs (V2).
- Audit : tout login, logout, échec, OTP émis, password reset.

## Open questions

- OTP-only login (sans mot de passe) en V1 ou V2 ? Décision provisoire : oui V1 pour l'inscription rapide.
- 2FA forcé pour les rôles pro (`OWNER`, `ADMIN`) : V2.
