---
specVersion: 1
kind: flow
appId: layali
flowId: pro-access
name: Acces back-office pro / hote
status: review
actor: OWNER
trigger: ouverture d'une route /pro ou d'un sous-domaine <venue-slug>.pro.layali.ma
screensRefs:
  - ../screens/account/login.screen.md
  - ../screens/pro/pro-no-access.screen.md
  - ../screens/pro/pro-access-request.screen.md
  - ../screens/pro/pro-tenant-suspended.screen.md
  - ../screens/pro/pro-dashboard.screen.md
  - ../screens/pro/pro-door-checkin.screen.md
  - ../screens/pro/pro-bookings-list.screen.md
apiRefs:
  - ../api/auth.api.md
  - ../api/memberships.api.md
---

# Acces back-office pro / hote

## Objectif

Permettre a un utilisateur pro (OWNER, ADMIN, HOST, BAR_MANAGER) d'acceder a la bonne surface metier du tenant courant, ou de recevoir un ecran de blocage comprehensible si l'acces n'est pas autorise.

## Acteur déclencheur

- Persona : OWNER, ADMIN, HOST, BAR_MANAGER ; parfois utilisateur non connecte tentant d'ouvrir une URL pro.
- Contexte : navigation web pro par sous-domaine venue ou URL mock `/pro/:tenant` en dev.

## Préconditions

- Le tenant est resolu par sous-domaine ou `X-Tenant-Id`.
- L'identite applicative expose `roles[]` et `tenantIds[]`.
- La route cible appartient a la zone `pro`.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | tentative d'ouverture `/pro` ou `/pro/*` | l'utilisateur ouvre l'URL | — | si non connecte → 2 ; sinon → 4 |
| 2 | [login](../screens/account/login.screen.md) | arrive sur un login prépositionné `Manager`, puis login email/password ou OTP | `POST /auth/login`, `POST /auth/otp/request`, `POST /auth/otp/verify` | succes → 3 ; echec → reste 2 |
| 3 | resolution retour pro | la session est hydratee avec `roles[]` et `tenantIds[]` | — | si aucun acces tenant → 8 ; sinon → 4 |
| 4 | guard tenant/role | le guard compare le tenant courant avec `tenantIds[]` et la route cible avec `roles[]` | — | tenant suspendu → 9 ; role/tenant valide → 5 ; sinon → 8 |
| 5 | choix surface metier | navigation vers l'ecran metier cible | — | `/pro/door` + role HOST/ADMIN/OWNER → 6 ; `/pro/bookings` + BAR_MANAGER/ADMIN/OWNER → 7 ; `/pro` + OWNER/ADMIN → 10 |
| 6 | [pro-door-checkin](../screens/pro/pro-door-checkin.screen.md) | scanner ou lookup manuel | `POST /checkins/verify`, `POST /checkins/lookup`, `POST /checkins/accept-manual`, `GET /checkins/counter`, `GET /events` | fin metier door |
| 7 | [pro-bookings-list](../screens/pro/pro-bookings-list.screen.md) | consulter les reservations du tenant | `GET /bookings?scope=tenant` | fin metier bookings |
| 8 | [pro-no-access](../screens/pro/pro-no-access.screen.md) | lire le motif, se reconnecter, demander un acces ou revenir accueil | — | login si anonyme ; demande d'acces → 8b ; home sinon |
| 8b | [pro-access-request](../screens/pro/pro-access-request.screen.md) | soumettre une demande d'acces | `POST /memberships/requests` | succes → 8c ; erreur → reste 8b |
| 8c | confirmation demande | l'utilisateur attend validation du venue | — | fin |
| 9 | [pro-tenant-suspended](../screens/pro/pro-tenant-suspended.screen.md) | consulter l'etat de blocage | — | retour home ou logout |
| 10 | [pro-dashboard](../screens/pro/pro-dashboard.screen.md) | operer le venue | `GET /events?scope=tenant&for=tonight`, `GET /bookings?scope=tenant&when=tonight`, `GET /tickets/orders?scope=tenant&when=today`, `GET /payments/summary?period=today` | fin metier dashboard |

## États globaux du flow

- En cours : session authentifiee, tenant resolu, surface pro active.
- Bloqué : `no_access`, `tenant_mismatch`, `role_not_allowed`, `tenant_suspended`.
- Abandonné : logout ou fermeture navigateur avant authentification.

## Erreurs et reprises

- Session expirée sur une route pro : redirection `/login?audience=manager&returnTo=<encoded pro route>` puis reprise automatique si l'utilisateur retrouve le bon tenant/role.
- Tenant introuvable : si `PLATFORM_ADMIN`, routage futur vers `/admin/tenants`; sinon `pro-no-access` avec reason `tenant_mismatch`.
- Utilisateur client simple authentifie tentant `/pro` : pas de 403 brute, mais rendu `pro-no-access`.
- Utilisateur authentifie sans membership : depuis `pro-no-access`, il peut ouvrir `pro-access-request` et envoyer une demande rattachee au tenant.
- Rôle `HOST` tentant `/pro` sans cible explicite : redirection recommandee vers `/pro/door`.
- Rôle `BAR_MANAGER` tentant `/pro` sans cible explicite : redirection recommandee vers `/pro/bookings`.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Un utilisateur anonyme reprend bien sa route cible pro après login.
- [ ] Un utilisateur authentifié sans `tenantIds[]` n'entre jamais dans une boucle de guards.
- [ ] Un utilisateur authentifie sans `tenantIds[]` peut initier une demande d'acces rattachee au bon tenant.
- [ ] `HOST` arrive sur une vue operatoire utile (`/pro/door`) sans voir un dashboard non autorise.
- [ ] `BAR_MANAGER` arrive sur une vue lecture seule utile (`/pro/bookings`) sans voir les écrans OWNER-only.
- [ ] Un tenant suspendu bloque toute la zone pro pour ce tenant.

## Open questions

- Faut-il un ecran de selection de tenant multi-venue en V1 pour OWNER, ou rester strictement sur sous-domaine comme prevu ?
