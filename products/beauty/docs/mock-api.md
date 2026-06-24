---
specVersion: 1
kind: mock-api
appId: beauty
status: stable
basePath: /api/v1
---

# Beauty — Mock API conventions

## 1. Objectif

Définir les conventions transverses des Mock API consommées par les frontends Beauty (client, pro, admin). Chaque ressource a son propre `.api.md` sous `api/` et hérite des règles définies ici.

## 2. Base URL et versionnement

- Base URL : `/api/v1`.
- Versionnement par préfixe d'URL ; toute évolution non rétro-compatible passe par `v2` au lieu de muter `v1`.
- En environnement mock local (Angular), même base URL, servie par un mock HTTP interceptor branché sur les fixtures listées dans chaque `.api.md`.

## 3. Headers obligatoires

| Header | Présence | Description |
|---|---|---|
| `Authorization` | requis pour endpoints protégés | `Bearer <jwt>` Keycloak. Endpoints publics (découverte) tolèrent l'absence. |
| `X-Tenant-Id` | requis pour zones `pro` et toute mutation `booking/payment/review` | UUID v4 du tenant cible. Pour les écrans publics qui chargent une fiche salon, le tenant est inféré côté backend depuis le slug, pas obligatoire dans le header. |
| `Accept-Language` | recommandé | `fr` / `ar` / `en`. Les libellés serveur (catégories de services par défaut) sont retournés dans la langue demandée si disponible. |
| `Idempotency-Key` | recommandé pour `POST` mutations | UUID v4 généré par le front, dédupliqué côté serveur 24h. Voir §7. |
| `X-Request-Id` | optionnel | UUID v4 de corrélation pour les logs. Si absent, généré côté serveur. |

## 4. Authentification simulée (mode mock)

- Le mock HTTP interceptor accepte tout `Bearer <jwt>` non vide et décode un payload statique défini en fixture (`mock-users.json`).
- Quatre profils mock sont fournis : `mock-customer-token`, `mock-owner-token`, `mock-admin-token`, `mock-staff-token`, `mock-platform-admin-token`.
- L'endpoint `POST /api/v1/auth/login` mock renvoie un de ces tokens selon l'email passé (cf. [auth.api.md](api/auth.api.md)).
- En mode mock, `X-Tenant-Id` n'est pas vérifié cryptographiquement ; sa présence est juste contrôlée.

## 5. Tenant scoping

- Lecture publique (`GET /salons`, `GET /salons/:slug`, `GET /salons/:slug/services`, `GET /salons/:slug/reviews`) : pas de tenant scope, le slug porte l'identification du salon.
- Lecture privée client (`GET /me/bookings`, `GET /me/loyalty`) : scopée à l'utilisateur (identifié via JWT), pas de header tenant requis (le bookage peut être dans plusieurs tenants).
- Tout endpoint sous `/pro/*` ou écriture dans le contexte d'un tenant exige `X-Tenant-Id` ; absence = 400.
- Endpoint admin (`/admin/*`) : `X-Tenant-Id` interdit (l'admin Nafura voit tout). Présence = 400.

## 6. Pagination

Pagination **cursor-based** uniforme :

- Query params pris en charge sur tout `GET` collection :
  - `pageSize` : entier, 1-100, défaut 20.
  - `cursor` : opaque, fourni par la réponse précédente (`page.cursor`).
- Format réponse :
  ```json
  {
    "items": [...],
    "page": {
      "size": 20,
      "total": 137,
      "cursor": "eyJvIjoiMTIzIn0=",
      "hasMore": true
    }
  }
  ```
- `cursor` `null` ou `hasMore: false` indique la fin de la liste.
- Pas de pagination offset/`page` ; les rares cas où c'est nécessaire (admin overview avec saut direct) sont marqués explicitement dans le `.api.md` concerné.

## 7. Idempotence

- Tout `POST` qui crée une ressource ou déclenche un effet de bord (booking, payment, review) doit accepter `Idempotency-Key`.
- Sur clé déjà vue dans les 24h : retour identique à la première réponse (200 ou 4xx déterministe), pas de nouvelle création.
- `PATCH` est idempotent par définition mais l'header reste accepté.
- `DELETE` est idempotent ; deuxième appel renvoie 204.

## 8. Format d'erreur unifié

Toutes les erreurs renvoient :

```json
{
  "error": "<code>",
  "message": "<message lisible>",
  "details": [
    { "field": "<champ>", "message": "<raison>" }
  ],
  "traceId": "<uuid>"
}
```

Codes standard :

| HTTP | `error` | Cas |
|---|---|---|
| 400 | `bad_request` | requête malformée, headers manquants |
| 401 | `unauthorized` | JWT absent ou invalide |
| 403 | `forbidden` | rôle insuffisant |
| 404 | `not_found` | ressource absente |
| 409 | `conflict` | conflit métier (créneau déjà pris, slug déjà utilisé) |
| 422 | `validation` | erreurs de validation, `details` rempli |
| 423 | `locked` | tenant suspendu |
| 429 | `rate_limited` | quota dépassé |
| 500 | `internal` | erreur serveur générique |

## 9. Conventions de payload

- IDs : UUID v4, en `string`.
- Dates : ISO 8601 avec timezone, ex : `2026-06-09T14:30:00+01:00`. Les dates "pures" (jour seul, ex horaires d'ouverture) en `yyyy-MM-dd`.
- Heures : `HH:mm` (24h) pour les créneaux récurrents.
- Montants : entier en **centimes MAD** (`amountMinor`), avec champ `currency: "MAD"`. Ex : 15050 = 150,50 MAD.
- Durées : entier en minutes (`durationMinutes`). Pas de durées sub-minute.
- Téléphones : format E.164 (`+212600000000`).
- Énumérations : `SCREAMING_SNAKE_CASE`.
- Soft delete : champ `deletedAt` nullable ; les `GET` collection l'excluent par défaut, ajouter `?includeDeleted=true` pour le voir (admin uniquement).

## 10. Simulation de latence et de pannes (mode mock)

- Latence simulée : 150-400 ms uniforme, configurable via `localStorage.beautyMockLatencyMs`.
- Taux d'erreur simulé : 0 par défaut ; activable via `localStorage.beautyMockErrorRate` (0.0-1.0) pour tester les états d'erreur des écrans.
- Force d'un code d'erreur précis sur un endpoint : query param `?_mockError=503` (interceptor mock uniquement, jamais en prod).

## 11. Conventions de fixtures

- Chaque `.api.md` embarque au minimum 2-3 fixtures JSON inline.
- Une fixture est un objet ou un tableau d'objets représentatif (pas de données réelles, mais réalistes : noms FR/AR, téléphones MA, services usuels).
- Les fixtures référencent des IDs stables au format `00000000-0000-0000-0000-0000000000XX` pour faciliter les cross-refs entre fixtures (un booking pointe vers un salon dont l'ID existe dans `salons.api.md`).
- Tenants mock par défaut :
  - `00000000-0000-0000-0000-000000000001` — "Studio Hair Casablanca"
  - `00000000-0000-0000-0000-000000000002` — "Beauty Lounge Rabat"
  - `00000000-0000-0000-0000-000000000003` — "Barber House Marrakech"
- Customers mock par défaut :
  - `00000000-0000-0000-1000-000000000001` — Sara Bennani (`+212600111222`)
  - `00000000-0000-0000-1000-000000000002` — Youssef El Idrissi (`+212600333444`)

## 12. Endpoints et fichiers

| Ressource | Fichier | Notes |
|---|---|---|
| Auth | [auth.api.md](api/auth.api.md) | login email/password, OTP téléphone, refresh |
| Salons | [salons.api.md](api/salons.api.md) | listing public + détail + admin |
| Services | [services.api.md](api/services.api.md) | catalogue par salon |
| Staff | [staff.api.md](api/staff.api.md) | praticiens, horaires |
| Bookings | [bookings.api.md](api/bookings.api.md) | RDV, créneaux disponibles, cycle de vie |
| Customers | [customers.api.md](api/customers.api.md) | clients du salon (vue pro) + profil self |
| Payments | [payments.api.md](api/payments.api.md) | init paiement, callbacks CMI/Stripe |
| Reviews | [reviews.api.md](api/reviews.api.md) | avis post-RDV |
| Loyalty | [loyalty.api.md](api/loyalty.api.md) | points, soldes |
| Tenants (admin) | [tenants-admin.api.md](api/tenants-admin.api.md) | gestion Nafura |

## 13. Open questions

- `Idempotency-Key` 24h : suffisant ? Pour le paiement, 48h voire 72h peut être utile. À arbitrer avec finance.
- Pagination cursor stable au-delà d'un re-tri : on assume que le tri par défaut (`createdAt desc`) reste stable. À documenter par ressource.
- WebSocket ou SSE pour l'agenda pro (mise à jour live des nouveaux RDV) : repoussé V2. V1 = polling 60s.
