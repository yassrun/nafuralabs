---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-01-platform-skeleton
title: Squelette web Beauty + auth + i18n + tenant resolver + abstractions manquantes
status: stable
wave: 1
dependsOn: []
filesAllowed:
  - web/app/applications/beauty/**
  - backend/domains/beauty/identity/**
  - backend/domains/beauty/common/**
  - platform/integrations/payment/**
  - platform/integrations/sms/**
  - platform/integrations/email/**
  - platform/integrations/storage/**
  - platform/core/components/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - "@platform/core/i18n"
abstractionsMissing:
  - ":platform:integrations:payment"
  - ":platform:integrations:sms"
  - ":platform:integrations:email"
  - ":platform:integrations:storage"
  - "@platform/core/components/calendar-week"
  - "@platform/core/components/time-slot-picker"
  - "@platform/core/components/rating-stars"
  - "@platform/core/components/photo-gallery"
  - "@platform/core/components/phone-otp-form"
  - "@platform/core/components/address-with-map"
  - "@platform/core/forms/business-hours-editor"
---

# Squelette web Beauty + auth + i18n + tenant resolver + abstractions manquantes

## Scope

Mettre en place les fondations Beauty : application web Angular bootstrappée avec 4 layouts (`public-layout`, `booking-layout`, `account-layout`, `pro-layout`, `admin-layout`), intercepteurs HTTP, i18n FR/AR/EN avec RTL, écrans `login` et `register` fonctionnels (mock auth OTP), création des abstractions plateforme manquantes (paiement, sms, email, storage, composants UI).

## Inputs

- Specs IA :
  - [app](../app.md)
  - [navigation](../navigation.md)
  - [mock-api](../mock-api.md)
  - [login](../screens/account/login.screen.md), [register](../screens/account/register.screen.md)
  - [auth API](../api/auth.api.md)
- Manifest runtime : `naf/src/spec/applications/beauty/beauty.application.json` (à finaliser hors WP).
- Abstractions Nafura existantes : tenancy, authorization, identity, i18n.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/app.config.ts`, `app.routes.ts`.
  - `web/app/applications/beauty/layouts/{public,booking,account,pro,admin}/`.
  - `web/app/applications/beauty/core/http/{auth,tenant,locale,error}.interceptor.ts`.
  - `web/app/applications/beauty/core/auth/auth.service.ts`.
  - `web/app/applications/beauty/i18n/{fr,ar,en}.json`.
  - `web/app/applications/beauty/zones/account/login/`.
  - `web/app/applications/beauty/zones/account/register/`.
  - `platform/integrations/payment/` (CMI + Stripe adapters, interface unifiée).
  - `platform/integrations/sms/`, `platform/integrations/email/`, `platform/integrations/storage/`.
  - `platform/core/components/{calendar-week, time-slot-picker, rating-stars, photo-gallery, phone-otp-form, address-with-map}/`.
  - `platform/core/forms/business-hours-editor/`.
  - `backend/domains/beauty/identity/` (façade Keycloak).
- Tests :
  - Tests unitaires layouts + routing guards.
  - Tests unitaires intercepteurs.
  - Test bascule RTL en `ar`.
  - Tests unitaires composants UI nouveaux (snapshot rendering, accessibilité).

## Étapes proposées

1. Bootstraper l'app Angular Beauty (`web/app/applications/beauty`), aligner avec la stack Nafura (Angular 17).
2. Définir les routes lazy par zone (`discovery`, `booking`, `account`, `pro`, `admin`) et créer les 5 layouts.
3. Implémenter les intercepteurs HTTP (Authorization, X-Tenant-Id en zones pro/admin uniquement, Accept-Language).
4. i18n FR/AR/EN via `@platform/core/i18n`, RTL bascule en `ar`, format MAD intégré.
5. Implémenter les écrans `login` et `register` (mock auth OTP + email).
6. Créer les abstractions plateforme manquantes : payment, sms, email, storage + composants UI : calendar-week, time-slot-picker, rating-stars, photo-gallery, phone-otp-form, address-with-map, business-hours-editor.
7. Brancher un mock-server (interceptor Angular ou MSW) qui sert les fixtures de toutes les `.api.md`.
8. Documenter dans le README du module.

## Critères d'acceptation

- [ ] Les 5 layouts rendent correctement avec leur structure (header/sidebar/footer/stepper).
- [ ] Le routing lazy fonctionne (chunks séparés).
- [ ] Les intercepteurs ajoutent les headers attendus selon la zone.
- [ ] L'i18n bascule FR/AR/EN sans full reload, RTL en `ar`.
- [ ] Les écrans `login` et `register` rendent leurs 4 états, OTP fonctionne en mock.
- [ ] Les abstractions plateforme exposent leurs interfaces et passent leurs tests unitaires.
- [ ] Les composants UI manquants passent leurs tests d'accessibilité (clavier, ARIA).
- [ ] Aucune abstraction n'est réimplémentée localement.

## Test plan

- `npm run start:beauty` : page d'accueil s'affiche.
- Login mock (`sara@example.ma` + OTP `123456`) : token stocké, redirection vers `/`.
- Bascule locale → textes traduits.
- Bascule `ar` : `dir="rtl"` appliqué, sidebar passe à droite.
- Tests CMI/Stripe adapter : `paymentService.initiate({...})` retourne `redirectUrl`.
- Test composant `time-slot-picker` : sélection clavier (Tab+Enter) fonctionne.

## Out of scope

- Implémentation Keycloak réelle (mock JWT suffit).
- Écrans pro et admin (wp-04..wp-06).
- Discovery (wp-02).

## Open questions

- Tenant resolver en local : query param `?tenant=<slug>` vs config statique ? Décision provisoire : query param dev, sous-domaine prod (V2).
- Map provider : OSM Leaflet par défaut, fallback Google si clé disponible.
