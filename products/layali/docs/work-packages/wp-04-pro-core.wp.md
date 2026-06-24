---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-04-pro-core
title: Pro core — dashboard, venue settings, events, tables
status: stable
wave: 4
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - web/app/applications/layali/zones/pro/access/**
  - web/app/applications/layali/zones/pro/{dashboard,venue,events,tables}/**
  - web/app/applications/layali/components/pro/**
  - backend/domains/layali/identity/**
  - backend/domains/layali/venue/**
  - backend/domains/layali/event/**
  - backend/domains/layali/table/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:integrations:storage"
  - "@platform/core/components"
  - "@platform/core/i18n"
abstractionsMissing: []
---

# Pro core — dashboard, venue settings, events, tables

## Scope

Implémenter le socle d'accès du back-office pro puis les surfaces coeur OWNER/ADMIN : guards tenant/rôle, écrans de fallback (`no-access`, `request-access`, `tenant-suspended`), tableau de bord, paramètres venue (édition fiche, photos), gestion des events (CRUD + publier/fermer/annuler), gestion du plan de salle (tables CRUD + layout).

## Inputs

- Specs IA :
  - [pro-no-access](../screens/pro/pro-no-access.screen.md)
  - [pro-access-request](../screens/pro/pro-access-request.screen.md)
  - [pro-access-requests](../screens/pro/pro-access-requests.screen.md)
  - [pro-tenant-suspended](../screens/pro/pro-tenant-suspended.screen.md)
  - [pro-dashboard](../screens/pro/pro-dashboard.screen.md)
  - [pro-venue-settings](../screens/pro/pro-venue-settings.screen.md)
  - [pro-events-list](../screens/pro/pro-events-list.screen.md)
  - [pro-event-edit](../screens/pro/pro-event-edit.screen.md)
  - [pro-tables](../screens/pro/pro-tables.screen.md)
  - Flows : [pro-access](../flows/pro-access.flow.md), [pro-membership-request](../flows/pro-membership-request.flow.md), [pro-membership-review](../flows/pro-membership-review.flow.md)
  - APIs : [auth](../api/auth.api.md), [memberships](../api/memberships.api.md), [venues](../api/venues.api.md), [events](../api/events.api.md), [tables](../api/tables.api.md), [payments](../api/payments.api.md) (read summary)
- Abstractions Nafura : tenancy (X-Tenant-Id obligatoire), storage (MinIO upload photos).

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/zones/pro/access/` (no-access, request-access, access-requests, tenant-suspended)
  - `web/app/applications/layali/zones/pro/dashboard/`
  - `web/app/applications/layali/zones/pro/venue/` (settings, photos)
  - `web/app/applications/layali/zones/pro/events/` (list, edit)
  - `web/app/applications/layali/zones/pro/tables/` (CRUD + drag-drop layout)
  - `web/app/applications/layali/components/pro/{kpi-card,event-status-badge,table-grid}/`
  - `backend/domains/layali/identity/` (projection memberships request + review + guards tenant/rôle)
  - `backend/domains/layali/venue/` (endpoints mutateurs).
  - `backend/domains/layali/event/` (création, publish, cancel, close).
  - `backend/domains/layali/table/` (CRUD, layout, block/release).
- Tests :
  - E2E accès pro : login OWNER → `/pro`; login HOST → redirect `/pro/door`; utilisateur sans membership → `/pro/no-access` → demande d'accès → OWNER approuve → accès actif.
  - E2E pro : login OWNER → modifier venue → créer event → publier → créer tables.
  - Tests unitaires transitions event (DRAFT/PUBLISHED/CLOSED/CANCELLED).
  - Tests unitaires upload photo (size, type).

## Étapes proposées

1. Implémenter le shell pro (sidebar + topbar avec sélecteur venue) et les guards tenant/rôle — confirmer celui de wp-01.
2. Coder les écrans de fallback pro : `no-access`, `request-access`, `tenant-suspended`.
3. Coder les endpoints `POST /memberships/requests`, `GET /memberships/requests`, `POST /memberships/requests/:id/approve`, `POST /memberships/requests/:id/reject` et le branchement identity/tenant minimal.
4. Coder l'ecran OWNER de revue `access-requests` avec lecture seule pour ADMIN.
5. Coder les endpoints mutateurs venue (PATCH, POST photos, POST publish).
6. Coder les endpoints events (create, patch, publish, close, cancel) avec vérifications pré-conditions.
7. Coder les endpoints tables (CRUD, layout bulk, block/release).
8. Coder le dashboard pro avec ses 4 KPI + agenda jour + liste réservations imminentes.
9. Coder l'éditeur d'event (form complexe avec catégories billets, dates, capacités).
10. Coder l'éditeur de tables (grid drag-drop V1 minimal, list-editable + JSON layout V2).
11. Brancher les guards de rôle : ADMIN n'a pas accès à `cancel`, à la suppression de venue, à `publish` (à valider).

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Un utilisateur authentifié sans membership compatible est redirigé vers `/pro/no-access`, sans boucle, puis peut soumettre `/pro/request-access`.
- [ ] OWNER peut consulter puis approuver/rejeter une demande d'acces depuis `/pro/access-requests`.
- [ ] `HOST` est redirigé vers `/pro/door` et `BAR_MANAGER` vers `/pro/bookings` lors d'une entrée `/pro`.
- [ ] Les permissions sont vérifiées : ADMIN ne peut pas annuler un event (test 403).
- [ ] L'upload photo passe par `:platform:integrations:storage` (URL signée).
- [ ] `POST /events/:id/publish` vérifie les pré-conditions et retourne 422 si non remplies (test).
- [ ] Le `X-Tenant-Id` est injecté automatiquement par l'intercepteur sur toutes les requêtes pro.
- [ ] Une 423 `tenant_suspended` affiche une bannière persistante et désactive les mutations.

## Test plan

- E2E accès manquant : utilisateur authentifié sans tenantIds tente `/pro/venue` → voit `pro-no-access` → clique `Demander un accès` → `POST /memberships/requests` → confirmation.
- E2E approbation accès : OWNER ouvre `/pro/access-requests` → approuve une demande `HOST` → l'utilisateur demandeur se reconnecte → arrive sur `/pro/door`.
- E2E création event : OWNER se logue → onglet Événements → "Nouveau" → remplit formulaire → "Publier" → vérifie statut PUBLISHED côté fiche client.
- Vérifier que ADMIN ne voit pas le bouton "Annuler" (rôle filtré).
- Upload photo : vérifier qu'un PNG est refusé (415), un JPEG 5Mo+1 refusé (413).
- Tester block/release table : `POST /tables/:id/block` puis tentative de booking → 409 `table_unavailable`.

## Out of scope

- Door check-in métier détaillé (wp-05), hormis la redirection d'accès initiale HOST.
- Reviews modération (wp-05).
- Bookings pro list/detail (wp-05).

## Open questions

- Drag-drop plan de salle : V1 minimal (positions saisies) vs Konva.js (drag visuel) ? Décision provisoire : minimal + JSON layout, drag V2.
- Multi-venues par owner (sélecteur sidebar) : V1 = 1 venue par session, V2 = sélecteur.
- La demande d'accès pro doit-elle exposer un choix libre `ADMIN` en V1 ou être plafonnée à `HOST`/`BAR_MANAGER` hors validation Nafura ?
