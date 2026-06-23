# ERP Real API Migration Plan

## Objective

Replace the current ERP frontend mocks with real backend APIs without changing the functional module structure.

The target architecture keeps:

- the same business module split on the backend as on the frontend where it makes sense: `achats`, `ventes`, `chantiers`, `etudes`, `rh`, `hse`, `marches`, `approbations`
- the existing shared reference domains already present in the backend: `item`, `stock`, `currency`
- `backend/applications/erp` as a thin application shell with no business logic
- the existing socle for CRUD acceleration: `CrudController`, `JpaCrudService`, `TenantScopedRepository`, generated DTO/mapper/base classes

This plan is intentionally CRUD-first. Anything that can be expressed as standard list/detail/create/update/delete must go through the socle before adding custom endpoints.

## Executive Summary

Current state:

- the ERP frontend was explicitly built in mock-first mode
- 40 Angular `*-api.service.ts` files exist under `web/app/applications/erp/pages`
- 28 of them still import or inject a mock service
- 12 appear to rely on the default HTTP behavior of `FeatureApiService`
- several pages bypass the API service layer entirely and inject mock services directly
- the current ERP application spec only exposes `item`, `stock`, and `currency` domains
- backend domain implementations currently exist only for `item`, `stock`, and `currency`

Consequence:

- replacing mocks is not only a backend task
- the migration has three different effort profiles:
  - simple CRUD rewiring
  - CRUD plus workflow/status endpoints
  - UI orchestration refactor for pages that read mock state directly

Recommended overall approach:

1. stabilize and finish the modules that are already closest to real HTTP: `item`, `stock`, `currency`
2. implement new backend domains module by module using the same socle pattern
3. remove direct mock usage from facades and pages before deleting mock services
4. treat dashboard, analytics, approvals, and other aggregates as a final wave, not as an entry point

Estimated total effort:

- 93 to 132 j.h in a disciplined CRUD-first approach
- 5 to 7 implementation waves
- roughly 3 to 5 sprints for one senior full-stack developer, or 2 to 3 sprints for a small parallel team

## Evidence and Findings

### 1. Frontend integration state

Confirmed patterns in the current frontend:

- pure HTTP services already exist for part of `inventory` and `finance`
- many services define a real `basePath` but override all CRUD methods to call a mock service instead
- some pages do not even use the API service/facade seam and read mock state directly

Representative examples:

- pure HTTP default:
  - `web/app/applications/erp/pages/finance/configuration/currencies/services/currency-api.service.ts`
  - `web/app/applications/erp/pages/inventory/catalogue/items/services/item-api.service.ts`
- service still mock-backed despite real path declaration:
  - `web/app/applications/erp/pages/ventes/offres/services/offre-api.service.ts`
  - `web/app/applications/erp/pages/chantiers/situations/services/situation-api.service.ts`
  - `web/app/applications/erp/pages/chantiers/avancements/services/avancement-api.service.ts`
- direct page-level mock dependency:
  - `web/app/applications/erp/pages/dashboard/dashboard.page.ts`
  - `web/app/applications/erp/pages/chantiers/chantiers-listing/chantiers-listing.page.ts`

### 2. Frontend socle is compatible with Spring CRUD pages

`FeatureApiService` already supports the response shape returned by Spring Data `Page` objects.

Implication:

- list endpoints returning `content` and `totalElements` will already be normalized by the Angular base service
- generated socle CRUD endpoints are compatible with the frontend base service without custom client code for standard CRUD

This is important because it reduces the integration work for modules that can remain standard CRUD.

### 3. Backend socle is already in place

The backend already provides the exact pattern needed for migration:

- `ma.nafura.platform.framework.api.controller.CrudController`
- `ma.nafura.platform.framework.service.crud.JpaCrudService`
- `ma.nafura.platform.framework.repository.TenantScopedRepository`

Representative generated module already aligned with the target pattern:

- `backend/domains/item/.../ItemController.java`
- `backend/domains/item/.../ItemService.java`
- `backend/domains/item/.../ItemRepository.java`

Implication:

- simple entities should not get hand-written CRUD controllers and services
- the right implementation model is: entity spec -> generated base classes -> thin custom wrappers only when custom logic is needed

### 4. Application spec gap is real

The current ERP application spec only includes:

- `item`
- `stock`
- `currency`

Implication:

- for `achats`, `ventes`, `chantiers`, `etudes`, `rh`, `hse`, `marches`, and `approbations`, the migration requires more than endpoint coding
- each module needs product registration in the ERP application spec and permission/navigation wiring

### 5. Source-of-truth must be unified

Observed reality in the repo:

- there are no entity specs under `backend/domains/*/src/main/resources/entities/*.entity.json`
- the active entity catalog exists under `naf/src/spec/domains/**/entities/*.entity.json`

Planning implication:

- the migration must use one source of truth for generated CRUD artifacts
- based on current repository evidence, the practical source of truth is `naf/src/spec`
- older documentation referencing `backend/domains/<domain>/src/main/resources/entities` should be treated as legacy unless the team explicitly decides otherwise

## Target Architecture

### Backend structure rule

Keep the backend structure aligned with business modules while reusing shared domains.

Recommended domain layout:

- shared/core business domains:
  - `backend/domains/item`
  - `backend/domains/stock`
  - `backend/domains/currency`
  - `backend/domains/partner` when customer/supplier master data is needed
- ERP module domains:
  - `backend/domains/achats`
  - `backend/domains/ventes`
  - `backend/domains/chantiers`
  - `backend/domains/etudes`
  - `backend/domains/rh`
  - `backend/domains/hse`
  - `backend/domains/marches`
  - `backend/domains/approbations`

### Implementation rule

For each CRUD-capable entity:

1. define or validate the entity spec in `naf/src/spec`
2. generate DTOs, mapper, repository, service base, controller base, validation, i18n, migration, and Angular API service/config where applicable
3. keep manual logic only in wrapper service/controller classes or explicit custom endpoints
4. use custom endpoints only for:
   - status transitions
   - aggregates and KPIs
   - document posting/validation/cancellation
   - heavy domain operations spanning multiple aggregates

### Frontend integration rule

Each module should converge to the same layering:

- `<entity>-api.service.ts`: pure HTTP only
- `<entity>.facade.ts`: UI state, caching, lookups, orchestration
- page/component: no direct mock dependency

Pages must stop reading private mock state directly. Aggregates should come from dedicated read endpoints or dedicated read facades backed by real HTTP.

## Migration Taxonomy

Use this classification before estimating each screen or entity.

### Class A: Ready-now CRUD

Characteristics:

- API service already uses pure `FeatureApiService`
- backend domain and endpoints already exist or are trivial to generate
- no workflow status transition is required

Typical effort:

- 1 to 2 j.h per entity/page slice

Examples:

- currencies
- exchange rates
- items
- stock balances
- inventory transactions where the contract already matches

### Class B: Mock-backed CRUD wrapper

Characteristics:

- API service exists with a valid `basePath`
- service overrides methods to call a mock implementation
- the page generally still follows the API/facade pattern

Typical effort:

- 2 to 4 j.h per entity if backend contract is standard CRUD
- 4 to 6 j.h if filtering, lookups, or list-item enrichment must move server-side

Examples:

- ventes clients
- ventes offres
- achats fournisseurs
- chantiers situations

### Class C: Workflow/document module

Characteristics:

- documents have lines, derived totals, states, and business actions
- mock services currently encapsulate real domain behavior
- CRUD is necessary but insufficient

Typical effort:

- 5 to 8 j.h per aggregate

Examples:

- devis
- bons de commande
- factures
- situations
- avancements

### Class D: UI bypass / aggregate orchestration

Characteristics:

- pages inject mock services directly
- data comes from multiple modules or from derived calculations
- no single CRUD endpoint can replace current behavior

Typical effort:

- 4 to 8 j.h per page or aggregate slice after source domains are available

Examples:

- dashboard
- analytics
- approvals inbox
- some chantier summary pages

## Module-by-Module Specifications

### 0. Shared Foundation

Scope:

- finalize the shared domains already present: `item`, `stock`, `currency`
- add `partner` if suppliers/customers remain separate entities at backend level
- normalize application spec registration for ERP domains

Backend spec:

- keep generated CRUD on the socle
- expose standard lookup endpoints for all referentials used in forms
- standardize pagination, sorting, and `searchFields`
- align list response contracts with current frontend expectations

Frontend spec:

- do not touch UX structure
- remove any residual mock usage in pure CRUD inventory/finance slices
- validate `basePath` to backend route mapping

Estimate:

- 8 to 12 j.h

Dependencies:

- none, this is Wave 0

### 1. Inventory

Current state:

- closest module to production-ready integration
- several API services already use pure HTTP
- some editor components still inject `InventoryMockService` directly

Backend spec:

- keep `item` and `stock` as the owning domains
- complete missing CRUD referentials first
- complete transaction endpoints using standard CRUD plus explicit transitions when needed
- keep stock engine/domain rules in service layer, not in controller

Frontend integration tasks:

- replace direct mock usage in inventory line editors with lookup/query endpoints
- validate transaction line persistence and server-calculated totals where relevant
- keep `FeatureApiService` defaults whenever possible

Definition of done:

- no page or component in inventory injects `InventoryMockService`
- CRUD pages run through real HTTP only
- list filtering and lookup searches work on backend data

Estimate:

- 10 to 14 j.h

Dependencies:

- shared foundation only

### 2. Finance

Current state:

- partially ready thanks to `currency` and related configuration entities
- some finance pages still use mock-backed services outside the generated configuration surfaces

Backend spec:

- keep `currency` as the owner for reference finance configuration already in place
- if operational finance documents are added later, place them in dedicated finance/invoicing domains instead of overloading `currency`
- keep conditions de paiement, devises, and exchange rate read/write contracts aligned with generated CRUD first

Frontend integration tasks:

- consolidate duplicate surfaces that represent the same reference data with different page structures
- replace mock-backed finance config services with pure HTTP

Definition of done:

- finance reference/config pages all hit real endpoints
- no parallel mock-based finance config state remains

Estimate:

- 6 to 10 j.h

Dependencies:

- shared foundation only

### 3. Achats

Current state:

- five API services under achats
- services are mock-backed
- domain implementation does not yet exist in backend runtime modules

Recommended backend domain:

- `backend/domains/achats`

Suggested first entity set:

- `fournisseur` or reuse `partner` with supplier classification
- `demande-achat`
- `appel-offre-achat`
- `bon-commande-achat`
- `contrat-achat`

Backend spec:

- all master/reference entities should be generated as CRUD using the socle
- documents should use CRUD base plus custom transition endpoints for submit, approve, cancel, close, convert
- line items should be persisted as separate aggregates only if the current UI requires independent CRUD; otherwise keep them nested under document service orchestration

Frontend integration tasks:

- replace mock filtering with backend query params
- move document status transitions from mock service methods to explicit backend endpoints
- keep facades as the orchestration layer for lookups and UI enrichment

Definition of done:

- achats pages no longer import `AchatsMockService`
- all DA/AO/BC/contrat flows work through real APIs

Estimate:

- 10 to 15 j.h for CRUD-first V1
- 15 to 20 j.h if approval/status logic is included in the same wave

Dependencies:

- partner/shared master data
- app spec registration for the achats domain

### 4. Ventes

Current state:

- five API services under ventes are still mock-backed
- offers, invoices, clients, credit note-like flows, and customer orders already have frontend seams but not real backend support

Recommended backend domain:

- `backend/domains/ventes`
- optionally split operational invoicing later if needed, but do not split in V1 if it slows delivery

Suggested first entity set:

- `client` or reuse `partner` with customer classification
- `offre`
- `bon-commande-client`
- `facture-client`
- `avoir`
- `retenue-garantie`

Backend spec:

- CRUD on referentials and document headers via socle
- custom endpoints for submit, validate, cancel, convert, settle, or any posting action
- derived totals, delay indicators, and status badges should come from backend-calculated fields or explicit read models, not from frontend mock helpers

Frontend integration tasks:

- stop computing business-critical status logic only in Angular helper functions
- replace mock list-item enrichments with server-side projections where needed

Definition of done:

- no ventes page or facade injects `VentesMockService`
- invoice and offer workflows call explicit backend actions

Estimate:

- 12 to 16 j.h

Dependencies:

- partner/shared master data
- currency/invoicing references

### 5. Chantiers

Current state:

- only part of the chantier surface goes through API services
- listing and detail pages still read `ChantiersMockService` directly
- chantier is a pivot module used by many other modules

Recommended backend domain:

- `backend/domains/chantiers`

Suggested first entity set:

- `chantier`
- `situation`
- `budget-chantier`
- `avancement`
- `lot`
- `document-chantier`
- `sous-traitance` if kept in the same bounded context

Backend spec:

- chantier master aggregate and situational documents should not be implemented as a pile of flat CRUD endpoints only
- still use socle-generated CRUD for the base entities
- add explicit endpoints for summary panels, budget snapshots, progress rollups, and workflow actions

Frontend integration tasks:

- refactor listing/detail pages to consume real facade/api data instead of mock state
- move project rollups from client-side aggregation to backend read models
- keep routes and page structures unchanged where possible

Definition of done:

- `chantiers-listing`, `chantier-detail`, situations, avancements, budget, and sous-traitance no longer read `ChantiersMockService`
- chantier summaries are served by real backend read APIs

Estimate:

- 15 to 20 j.h

Dependencies:

- this module should start only after shared foundation is stable
- ventes, achats, RH, and HSE can depend on chantier references later

### 6. Etudes

Current state:

- API service seams exist for metrs, ouvrages, AO clients, devis
- services are mock-backed and include business transformations

Recommended backend domain:

- `backend/domains/etudes`

Suggested first entity set:

- `ouvrage`
- `metre`
- `appel-offre-client`
- `devis`
- optionally `devis-ligne` and `bibliotheque-prix`

Backend spec:

- keep catalogue-like referentials on standard CRUD
- expose custom endpoints for quote calculation/versioning only if V1 needs them
- if calculations are currently deterministic in the frontend, move the authoritative computation server-side

Frontend integration tasks:

- replace mock-based editors with HTTP-backed persistence
- extract any domain calculations from page helpers into backend application services

Definition of done:

- no `EtudesMockService` in pages, facades, or API services
- quote and metre persistence works end-to-end on real data

Estimate:

- 12 to 16 j.h

Dependencies:

- item shared references
- chantier references if study documents target projects

### 7. RH

Current state:

- RH has a mix of CRUD-like pages and operational pages such as pointage that still depend heavily on mock state

Recommended backend domain:

- `backend/domains/rh`

Suggested first entity set:

- `employe`
- `conge`
- `fiche-paie`
- `pointage`
- `planning-equipe` as read model if needed

Backend spec:

- CRUD first for employees and leaves
- pointage should use explicit batch or day-entry endpoints instead of forcing everything into generic CRUD
- payroll generation/posting should remain a later phase if not required for immediate mock replacement

Frontend integration tasks:

- replace `RhMockService` and `PointageMockService` dependencies
- preserve offline-specific UX only if it is still a business requirement for V1

Definition of done:

- RH listing/detail pages use real APIs
- pointage is no longer backed by local-only mock persistence

Estimate:

- 8 to 12 j.h for core RH CRUD
- 12 to 16 j.h if pointage workflow and offline sync are included now

Dependencies:

- chantier references for pointage/planning

### 8. HSE

Current state:

- incidents, inspections, formations, non-conformites use mock-backed services
- some extended HSE pages use a dedicated extended mock service directly

Recommended backend domain:

- `backend/domains/hse`

Suggested first entity set:

- `incident`
- `inspection`
- `formation-hse`
- `non-conformite`
- later: `duer`, `ppsps`, `registre-legal`

Backend spec:

- standard CRUD for core entities
- explicit transitions for closing, validating, escalating, or assigning actions
- read-only compliance summaries can be added in a later slice

Frontend integration tasks:

- replace direct `HseMockService` and `HseExtendedMockService` usage
- keep detailed regulatory UX but move persistence and state changes to backend endpoints

Definition of done:

- HSE core modules no longer use mocks
- follow-up actions and statuses come from backend state

Estimate:

- 8 to 12 j.h for core modules
- 12 to 16 j.h if DUER/PPSPS are included in the same wave

Dependencies:

- chantier references

### 9. Marches

Current state:

- pages appear to depend directly on `MarchesMockService`
- routing and backend ownership are less mature than the other operational modules

Recommended backend domain:

- `backend/domains/marches`

Suggested first entity set:

- `contrat-marche`
- `avenant`
- `caution`
- `facture-marche`
- `revision-prix`
- `penalite`

Backend spec:

- use socle CRUD for base contract entities
- keep business calculations and revision logic in custom services
- do not start this module before the chantier and finance references it needs are stable

Frontend integration tasks:

- replace direct mock usage at page level
- add dedicated read endpoints for contract synthesis and billing summary rather than reproducing mock state shape

Definition of done:

- marches listing/detail pages use real APIs only

Estimate:

- 10 to 14 j.h

Dependencies:

- chantiers
- finance or ventes references depending on billing flow

### 10. Approbations, Dashboard, Analytics

Current state:

- these modules are aggregate readers over many mocked feature states
- they are the least suitable starting point for migration

Recommended backend domains:

- `backend/domains/approbations` for task/workflow objects if not already covered by platform features
- dedicated query/read services for dashboard and analytics

Backend spec:

- do not model dashboards as CRUD entities
- expose explicit read endpoints for KPI cards, alerts, approval inbox, and drilldowns
- reuse workflow/platform features when possible instead of rebuilding approval mechanics inside ERP modules

Frontend integration tasks:

- stop reading private mock arrays/state directly
- consume dedicated aggregate endpoints
- keep formatting and charts in frontend, move business aggregation to backend

Definition of done:

- dashboard and analytics pages do not import any feature mock service
- approvals inbox reads real tasks/work items

Estimate:

- 10 to 14 j.h

Dependencies:

- should be last, after source modules are live

## Recommended Delivery Waves

### Wave 0: Governance and Fast Wins

Scope:

- validate one generation source of truth: `naf/src/spec`
- register missing ERP domains in app spec planning
- finish `item`, `stock`, `currency` contract alignment

Outcome:

- a stable baseline proving that real CRUD integration works on the existing socle

Estimate:

- 8 to 12 j.h

### Wave 1: Shared Masters and Lookups

Scope:

- partner/customer/supplier strategy
- all common lookup/reference APIs
- remove lookup dependencies on mock stores

Outcome:

- all later modules can depend on real lookup endpoints

Estimate:

- 8 to 10 j.h

### Wave 2: CRUD-First Commercial and Procurement

Scope:

- achats V1
- ventes V1

Outcome:

- two big modules leave mock mode quickly on their CRUD backbone

Estimate:

- 22 to 31 j.h

### Wave 3: Project Execution Modules

Scope:

- chantiers
- etudes
- first chantier aggregates

Outcome:

- project-centric ERP flows become real and can feed other modules

Estimate:

- 27 to 36 j.h

### Wave 4: People and Compliance

Scope:

- RH core
- HSE core

Outcome:

- pointage, leave, incidents, inspections stop persisting only in mocks

Estimate:

- 16 to 24 j.h

### Wave 5: Contracts and Aggregates

Scope:

- marches
- approbations
- dashboard
- analytics

Outcome:

- aggregate and cross-domain modules become production-feasible

Estimate:

- 20 to 29 j.h

## Delivery Rules Per Module

Every module migration should follow the same checklist.

### Step 1: Contract freeze

- identify the current Angular model types and facade expectations
- classify each endpoint need as CRUD, lookup, transition, or aggregate read
- decide which derived fields stay frontend-only and which move server-side

### Step 2: Backend generation and structure

- create or update the domain/app specs in `naf/src/spec`
- generate the CRUD artifacts
- keep wrapper services/controllers thin
- put business logic in service layer, not in controllers

### Step 3: Frontend seam cleanup

- make `<entity>-api.service.ts` pure HTTP
- remove mock injection from the API service
- move UI-only logic into the facade if still useful
- remove page-level direct mock dependencies

### Step 4: Validation

- backend compile on touched domains
- frontend build/typecheck on touched module
- at least one integration check per module flow

### Step 5: Mock retirement

- delete or quarantine the feature mock only when all pages of that module are green on real APIs
- do not keep a mixed real/mock state inside the same page or facade

## Risks and Controls

### Risk 1: mixed architecture persists

Symptom:

- API services become real but pages still read mock stores

Control:

- no module can be marked complete while any page/component/facade still injects its mock service

### Risk 2: socle is bypassed for easy CRUD

Symptom:

- manual controllers/services duplicate standard CRUD behavior

Control:

- default rule: generated CRUD first, custom endpoint second

### Risk 3: source-of-truth confusion

Symptom:

- some teams add specs in `naf/src/spec`, others in legacy paths

Control:

- validate one generation path before Wave 1 and enforce it

### Risk 4: aggregate modules start too early

Symptom:

- dashboard or analytics becomes a blocker because underlying domains are still mocked

Control:

- these modules remain final-wave consumers of domain APIs

### Risk 5: workflow logic stays hidden in frontend helpers

Symptom:

- statuses, totals, delays, and transitions are still derived differently on each page

Control:

- move authoritative business rules to backend services and expose explicit actions/read models

## Validation Proposal

This document is detailed enough to validate direction before implementation starts.

The main decisions that should be validated with the team are:

1. confirm the backend module split to use for new domains: same names as frontend modules plus shared domains
2. confirm `naf/src/spec` as the only generation source of truth for new CRUD work
3. confirm whether supplier/customer master data lives in dedicated `achats`/`ventes` domains or shared `partner`
4. confirm whether pointage and HSE extended flows are in V1 or postponed after core CRUD migration
5. confirm whether Marches is part of the first release train or follows chantier stabilization

Once these five points are validated, the next practical step is to write a wave-by-wave implementation backlog with target entities and explicit API contracts for Wave 0 and Wave 1.