---
specVersion: 1
kind: api
appId: layali
resource: memberships
status: review
basePath: /api/v1/memberships
auth: required
rateLimit: standard
backendOwner: backend/domains/layali/identity
---

# memberships Mock API

## Vue d'ensemble

Endpoints liés au rattachement d'un utilisateur à un venue en tant que membre pro (`OWNER`, `ADMIN`, `HOST`, `BAR_MANAGER`). En V1, le besoin minimum côté mock-driven UI est la création d'une demande d'accès pour un utilisateur déjà authentifié mais sans membership compatible avec le tenant ciblé.

## Modèle (vue logique)

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| id | uuid | oui | identifiant de la demande |
| userId | uuid | oui | utilisateur authentifié |
| tenantSlug | string | oui | venue cible |
| requestedRole | enum | oui | `HOST`, `ADMIN`, `BAR_MANAGER` |
| finalRole | enum | non | role retenu a l'approbation |
| message | string | non | contexte libre |
| status | enum | oui | `PENDING`, `APPROVED`, `REJECTED`, `DUPLICATE` |
| reviewReason | string | non | motif de rejet ou note de revue |
| reviewedBy | uuid | non | acteur ayant traite la demande |
| reviewedAt | string datetime | non | ISO-8601 |
| createdAt | string datetime | oui | ISO-8601 |

## Endpoints

### POST /api/v1/memberships/requests

- Auth : required.
- Body :
  ```json
  {
    "tenantSlug": "sky31-casablanca",
    "requestedRole": "HOST",
    "message": "Equipe porte vendredi et samedi.",
    "phone": "+212600111222"
  }
  ```
- Réponse 201 :
  ```json
  {
    "id": "req-00000000-0000-0000-0000-000000000001",
    "userId": "00000000-0000-0000-2000-000000000003",
    "tenantSlug": "sky31-casablanca",
    "requestedRole": "HOST",
    "status": "PENDING",
    "createdAt": "2026-06-15T19:20:00+01:00"
  }
  ```
- Règles :
  - une seule demande `PENDING` par `(userId, tenantSlug, requestedRole)` ;
  - si le membership existe déjà, retour 409 `membership_exists` ;
  - si une demande identique est déjà en attente, retour 409 `request_already_pending`.
- Erreurs : 401, 403 `tenant_suspended`, 404 `tenant_not_found`, 409, 422.

### GET /api/v1/memberships/requests

- Auth : required.
- Rôles : `OWNER`, `ADMIN` (lecture seule), `PLATFORM_ADMIN`.
- Query params : `tenantSlug` (obligatoire sauf `PLATFORM_ADMIN`), `status`, `requestedRole`, `q`, `cursor`, `size`.
- Réponse 200 :
  ```json
  {
    "items": [
      {
        "id": "req-00000000-0000-0000-0000-000000000001",
        "userId": "00000000-0000-0000-2000-000000000003",
        "tenantSlug": "sky31-casablanca",
        "requestedRole": "HOST",
        "finalRole": null,
        "message": "Equipe porte vendredi et samedi.",
        "status": "PENDING",
        "reviewReason": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "createdAt": "2026-06-15T19:20:00+01:00"
      }
    ],
    "page": { "size": 20, "total": null, "cursor": null }
  }
  ```
- Erreurs : 401, 403 `forbidden`, 403 `tenant_suspended`, 404 `tenant_not_found`.

### POST /api/v1/memberships/requests/:id/approve

- Auth : required.
- Rôles : `OWNER`, `PLATFORM_ADMIN`.
- Body :
  ```json
  {
    "finalRole": "HOST"
  }
  ```
- Réponse 200 :
  ```json
  {
    "id": "req-00000000-0000-0000-0000-000000000001",
    "tenantSlug": "sky31-casablanca",
    "requestedRole": "HOST",
    "finalRole": "HOST",
    "status": "APPROVED",
    "reviewedBy": "00000000-0000-0000-2000-000000000001",
    "reviewedAt": "2026-06-15T20:05:00+01:00"
  }
  ```
- Règles :
  - seule une demande `PENDING` peut etre approuvee ;
  - l'approbation cree/active le membership du demandeur sur le tenant ;
  - `finalRole` doit etre dans `HOST`, `ADMIN`, `BAR_MANAGER`.
- Erreurs : 401, 403 `forbidden`, 403 `tenant_suspended`, 404 `not_found`, 409 `request_already_processed`, 422.

### POST /api/v1/memberships/requests/:id/reject

- Auth : required.
- Rôles : `OWNER`, `PLATFORM_ADMIN`.
- Body :
  ```json
  {
    "reason": "Pas de besoin operationnel cette semaine."
  }
  ```
- Réponse 200 :
  ```json
  {
    "id": "req-00000000-0000-0000-0000-000000000001",
    "tenantSlug": "sky31-casablanca",
    "requestedRole": "HOST",
    "finalRole": null,
    "status": "REJECTED",
    "reviewReason": "Pas de besoin operationnel cette semaine.",
    "reviewedBy": "00000000-0000-0000-2000-000000000001",
    "reviewedAt": "2026-06-15T20:05:00+01:00"
  }
  ```
- Règles :
  - seule une demande `PENDING` peut etre rejetee ;
  - `reason` requis, max 500 caracteres.
- Erreurs : 401, 403 `forbidden`, 403 `tenant_suspended`, 404 `not_found`, 409 `request_already_processed`, 422.

## Erreurs communes

| Code | `error` | Cas |
|---|---|---|
| 401 | `unauthorized` | session absente ou expirée |
| 403 | `tenant_suspended` | venue suspendu |
| 403 | `forbidden` | lecture ou mutation non autorisee |
| 404 | `tenant_not_found` | slug inconnu |
| 409 | `membership_exists`, `request_already_pending` | demande en doublon |
| 409 | `request_already_processed` | demande deja approuvee ou rejetee |
| 422 | `validation_failed` | rôle invalide, téléphone invalide, message trop long, raison manquante |

## Fixtures

```json
{
  "requests": [
    {
      "id": "req-00000000-0000-0000-0000-000000000001",
      "userId": "00000000-0000-0000-2000-000000000003",
      "tenantSlug": "sky31-casablanca",
      "requestedRole": "HOST",
      "finalRole": null,
      "status": "PENDING",
      "reviewReason": null,
      "reviewedBy": null,
      "reviewedAt": null,
      "message": "Equipe porte vendredi et samedi.",
      "createdAt": "2026-06-15T19:20:00+01:00"
    },
    {
      "id": "req-00000000-0000-0000-0000-000000000002",
      "userId": "00000000-0000-0000-2000-000000000004",
      "tenantSlug": "sky31-casablanca",
      "requestedRole": "BAR_MANAGER",
      "finalRole": "BAR_MANAGER",
      "status": "APPROVED",
      "reviewReason": null,
      "reviewedBy": "00000000-0000-0000-2000-000000000001",
      "reviewedAt": "2026-06-14T18:10:00+01:00",
      "message": "Service bar samedi.",
      "createdAt": "2026-06-14T16:55:00+01:00"
    }
  ]
}
```

## Contraintes pour le futur backend réel

- Le membership réel est géré via `:platform:core:identity` avec projection vers les `tenantIds[]` et les rôles applicatifs.
- Toute approbation/rejet doit être auditée avec l'acteur approbateur et le tenant cible.
- Une approbation doit invalider les sessions en cache de l'utilisateur pour forcer un refresh des claims.
- Une approbation doit notifier le demandeur (email minimum en V1) et rendre le nouveau membership visible au prochain refresh de session.

## Open questions

- Faut-il permettre a OWNER de surclasser le role demande (`HOST` → `ADMIN`) en V1 ou imposer le role demande tel quel ?
