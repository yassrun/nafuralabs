---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-01-platform-skeleton
title: Squelette web + auth + i18n + tenant resolver + abstractions manquantes
status: stable
wave: 1
dependsOn: []
filesAllowed:
  - web/app/applications/layali/**
  - backend/domains/layali/identity/**
  - backend/domains/layali/common/**
  - platform/core/realtime/**
  - platform/integrations/qr/**
  - platform/integrations/realtime/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - ":platform:integrations:payment"
  - ":platform:integrations:sms"
  - ":platform:integrations:email"
  - "@platform/core/components"
  - "@platform/core/i18n"
abstractionsMissing:
  - ":platform:integrations:realtime"
  - ":platform:integrations:qr"
  - "@platform/core/realtime"
---

# Squelette web + auth + i18n + tenant resolver + abstractions manquantes

## Scope

Mettre en place les fondations de l'application Layali : application web Angular bootstrappée (3 shells : `public-shell`, `account-shell`, `pro-shell`, `admin-shell`, `fullscreen`), routing lazy par zone, intercepteur HTTP avec `Authorization`/`X-Tenant-Id`/`Accept-Language`, i18n FR/AR/EN avec RTL, écrans `login` et `register` fonctionnels (mock auth) avec choix d'entrée `Client` / `Manager`, abstractions plateforme manquantes créées.

## Inputs

- Specs IA :
  - [app](../app.md)
  - [navigation](../navigation.md)
  - [mock-api](../mock-api.md)
  - [login](../screens/account/login.screen.md), [register](../screens/account/register.screen.md)
  - [auth API](../api/auth.api.md)
- Manifest runtime : `naf/src/spec/applications/layali/layali.application.json` (à finaliser hors WP).
- Abstractions Nafura : tenancy, authorization, identity, i18n.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/app.config.ts` (bootstrap Angular).
  - `web/app/applications/layali/app.routes.ts` (lazy zones).
  - `web/app/applications/layali/shells/{public,account,pro,admin,fullscreen}/` (composants shells).
  - `web/app/applications/layali/core/http/{auth,tenant,locale,error}.interceptor.ts`.
  - `web/app/applications/layali/core/auth/auth.service.ts` (mock + Keycloak prêt).
  - `web/app/applications/layali/i18n/{fr,ar,en}.json` (clés communes).
  - `web/app/applications/layali/zones/account/login/login.component.ts`.
  - `web/app/applications/layali/zones/account/register/register.component.ts`.
  - `platform/integrations/realtime/` (lib Spring STOMP).
  - `platform/integrations/qr/` (lib Spring HMAC QR).
  - `platform/core/realtime/` (lib Angular STOMP client).
  - `backend/domains/layali/identity/` (façade Keycloak via `:platform:core:identity`).
- Tests :
  - Tests unitaires shells (rendu + routing guards).
  - Tests unitaires intercepteurs (injection headers).
  - Test bascule RTL en `ar`.
- Mock fixtures à charger : `auth.api.md` (mock-customer-token, etc.).

## Étapes proposées

1. Bootstraper l'application Angular Layali (`web/app/applications/layali`) avec `@angular/core` 17 + Tailwind ou la stack standard Nafura.
2. Définir les routes lazy par zone, créer les 5 shells (public, account, pro, admin, fullscreen).
3. Implémenter les intercepteurs HTTP : Authorization (depuis `:platform:core:identity`), `X-Tenant-Id` (depuis sous-domaine en prod, query/local en dev), `Accept-Language`.
4. Mettre en place i18n FR/AR/EN via `@platform/core/i18n`, charger les bundles communs (`layali.common.*`).
5. Brancher RTL : `dir="rtl"` automatique en `ar`, switch RTL au changement de locale.
6. Implémenter les écrans `login` et `register` (mock auth, OTP placeholder, formulaire validations), avec un premier choix explicite `Je suis client` / `Je suis manager` sur `login`.
7. Créer les abstractions manquantes :
   - `:platform:integrations:realtime` : starter Spring Boot WebSocket + STOMP, ACL tenant, brokers in-memory et Redis.
   - `:platform:integrations:qr` : lib HMAC SHA256 avec key rotation, generate + verify.
   - `@platform/core/realtime` : client Angular STOMP avec reconnect + tenant-scoped observables.
8. Brancher un mock-server local (interceptor Angular ou MSW) qui sert les fixtures de toutes les `.api.md` avec latence simulée.
9. Documenter dans le README du module (`web/app/applications/layali/README.md`) la stack et les conventions.

## Critères d'acceptation

- [ ] Les 5 shells rendent correctement avec leur menu / sidebar / header attendus.
- [ ] Le routing lazy fonctionne (chunks séparés vérifiables dans le build).
- [ ] Les intercepteurs ajoutent `Authorization`, `X-Tenant-Id` et `Accept-Language` sur toute requête sortante.
- [ ] L'i18n bascule entre FR/AR/EN sans full reload, RTL appliqué en `ar`.
- [ ] Les écrans `login` et `register` rendent leurs 4 états, soumettent vers `/auth/*` mockés et stockent le JWT.
- [ ] L'écran `login` affiche deux boutons d'entrée `Client` / `Manager` si `audience` n'est pas fourni, puis adapte la copy et le `returnTo` au choix.
- [ ] Les libs `:platform:integrations:realtime`, `:platform:integrations:qr`, `@platform/core/realtime` exposent leurs interfaces publiques et passent leurs propres tests unitaires.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Les contrats Mock API sont respectés (rien d'inventé hors `apiRefs`).

## Test plan

- Vérifier le bootstrap : `npm run start:layali` rend `/` avec hero.
- Tester login mock (`sara@example.ma`/any) après choix `Client` : redirige vers `/`.
- Tester login mock (`owner@sky31.ma`/any) après choix `Manager` : redirige vers `/pro` puis applique le guard de rôle.
- Vérifier bascule locale → la home renvoie ses textes dans la bonne langue.
- Vérifier bascule RTL : flex direction inversée, alignement texte.
- Test unitaire intercepteur : un faux `HttpRequest` ressort avec les headers attendus.
- Test unitaire `:platform:integrations:qr` : `verify(generate(payload))` reconstruit le payload + valide signature.

## Out of scope

- Implémentation Keycloak réelle (mock JWT suffit en wp-01).
- Implémentation paiement (wp-03).
- Écrans pro et admin (wp-04..wp-06).

## Open questions

- Tenant resolver en local : query param `?tenant=sky31-casablanca` vs config statique ? Décision provisoire : query param dev, sous-domaine prod.
- Bibliothèque STOMP côté front : `@stomp/rx-stomp` vs maison ? Décision provisoire : `@stomp/rx-stomp`.
