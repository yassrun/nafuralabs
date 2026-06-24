---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-05-pro-config
title: Pro config — services, staff, customers, reviews, loyalty, settings
status: stable
wave: 5
dependsOn: [wp-01-platform-skeleton, wp-04-pro-core]
filesAllowed:
  - web/app/applications/beauty/zones/pro/{services,staff,customers,reviews,loyalty,settings}/**
  - web/app/applications/beauty/components/pro/**
  - backend/domains/beauty/catalog/**
  - backend/domains/beauty/staff/**
  - backend/domains/beauty/customer/**
  - backend/domains/beauty/review/**
  - backend/domains/beauty/loyalty/**
  - backend/domains/beauty/salon/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:integrations:storage"
  - ":platform:integrations:email"
  - "@platform/core/components"
  - "@platform/core/forms/business-hours-editor"
abstractionsMissing: []
---

# Pro config — services, staff, customers, reviews, loyalty, settings

## Scope

Implémenter toutes les pages de configuration du salon : catalogue services, staff (avec horaires + congés), clients (vue consolidée), avis (réponse + flag), programme fidélité, paramètres généraux (identité, photos, adresse, horaires, billing).

## Inputs

- Specs IA :
  - [pro-services](../screens/pro/pro-services.screen.md), [pro-staff](../screens/pro/pro-staff.screen.md), [pro-customers](../screens/pro/pro-customers.screen.md), [pro-reviews](../screens/pro/pro-reviews.screen.md), [pro-loyalty](../screens/pro/pro-loyalty.screen.md), [pro-settings](../screens/pro/pro-settings.screen.md)
  - APIs : [services](../api/services.api.md), [staff](../api/staff.api.md), [customers](../api/customers.api.md), [reviews](../api/reviews.api.md), [loyalty](../api/loyalty.api.md), [salons](../api/salons.api.md), [tenants-admin](../api/tenants-admin.api.md) (billing read)
- Abstractions : storage (upload photos), email (invite staff), business-hours-editor.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/zones/pro/{services,staff,customers,reviews,loyalty,settings}/`
  - `web/app/applications/beauty/components/pro/{service-form-drawer,staff-form-drawer,customer-detail-drawer,reply-editor,loyalty-config-card,settings-tabs-layout,delete-salon-dialog}/`
  - Backend : `catalog`, `staff`, `customer`, `review`, `loyalty`, `salon` (CRUD + transitions).
- Tests :
  - E2E : OWNER configure salon → publie → revient visible côté discovery.
  - Tests guards ADMIN (pas de billing/delete).
  - Tests anti-suppression staff/service avec bookings futurs (409).

## Étapes proposées

1. Implémenter endpoints CRUD `pro/services`, `pro/staff`, photo uploads, working-hours, time-off.
2. Implémenter endpoints `pro/customers` (vue consolidée + notes internes).
3. Implémenter endpoints `pro/reviews` (reply, flag).
4. Implémenter `pro/loyalty` (config, top clients, redeem).
5. Implémenter `pro/salon` settings + publish/unpublish + delete avec règles.
6. Coder tous les écrans pro de configuration.
7. Brancher invitations email à la création staff.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] ADMIN ne peut pas accéder aux tabs Facturation et Compte (UI + 403 backend).
- [ ] La suppression d'un staff/service avec RDV futurs retourne 409 et UI propose désactivation.
- [ ] L'upload photo passe par `:platform:integrations:storage` (URL signée, MinIO).
- [ ] La publication salon vérifie les pré-conditions et 422 sinon.
- [ ] Les permissions sont vérifiées sur chaque mutation.
- [ ] Le programme fidélité actif est cohérent avec `pro-dashboard` et `customer-loyalty`.

## Test plan

- E2E OWNER : créer service → ajouter staff → modifier horaires → publier salon → vérifier visible `/salons/:slug`.
- Suppression staff avec RDV futur : 409 + UI suggère désactivation.
- Réponse à un avis : visible immédiatement côté fiche salon publique.
- Configuration loyalty : toggle activé → premier RDV `COMPLETED` après → points crédités.
- Settings ADMIN : tabs Facturation/Compte cachées + 403 si requête directe.

## Out of scope

- Multi-salons sous un tenant (V2).
- Templates SMS/email personnalisables (V2).
- Tarification par staff (V2).

## Open questions

- Invite staff sans email (carte papier salon) : V1 = compte fonctionnel sans login (utilisable par OWNER/ADMIN pour le marquer dans agenda) ; login pour le staff = V2.
- Photos staff obligatoires : V1 = optionnelles avec placeholder.
