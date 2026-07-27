# Nafora Labs — État actuel du système

**Document de synthèse stratégique**  
**Public :** partenaire stratégique (non-développeur), fondateur, décisionnaires produit/marché  
**Date d’analyse :** 2026-07-27  
**Sources :** monorepo `nafuralabs` (code, migrations, UI, specs, marketing, ops)  
**Méthode :** lecture factuelle du repository ; aucune modification hors ce document

### Légende de lecture

| Marqueur | Signification |
|----------|---------------|
| **Fait** | Observé dans le code, les migrations, les manifests ou la documentation du repo |
| **Déduction** | Conclusion raisonnable à partir de plusieurs faits |
| **Hypothèse** | Interprétation plausible non prouvée par le repo |
| **Question ouverte** | Décision humaine requise |

---

## 1. Résumé exécutif

**Fait.** Nafora Labs est aujourd’hui un monorepo (`nafuralabs`) qui regroupe :

1. une **plateforme technique partagée** (`platform/`) — authentification, multi-tenant, IA/LLM, documents, notifications, abonnements, shell UI ;
2. plusieurs **produits** sous `products/` — dont Sektor BTP (ERP), Build Intelligence, Usage Ops, Venue Catalog, Layali, Beauty, Blanner ;
3. une **infrastructure Kubernetes partagée** (`infra/k8s`) — Postgres, Keycloak, Vault, MinIO, Redis, OpenSearch ;
4. des **sites marketing** (`marketing/`) — corporate Nafura, MBS Studio, Zenith.

La doctrine officielle du monorepo est claire : *métier uniquement dans `products/<app-id>/` ; jamais dans `platform/`* (`docs/AGENTS.md`). En pratique, Sektor est le produit de référence qui consomme presque toute la plateforme ; d’autres produits n’en consomment qu’un sous-ensemble, ou restent hors du graphe monorepo (Blanner, mobiles Layali/Beauty).

**Fait.** Sektor (chemin `products/sektor-btp/`) est positionné comme **ERP BTP Maroc**, premier vertical commercial de la plateforme. Sa north star documentée (`products/sektor-btp/web/docs/ROADMAP-AGENTIC-BTP-ERP.md`) vise un ERP où l’IA est un **copilote métier** (pas un chatbot décoratif), différencié de Sage / Batigest / Odoo BTP par : IA native, mobile terrain, conformité Maroc (ICE, RAS, CNSS, MOA publics, e-facture DGI), fil roi chantier → situation → facture → trésorerie, extraction documentaire (« Doxura »), gouvernance (approbations, matrice de pouvoirs).

**Déduction — problème métier que Sektor cherche à résoudre.** Les entreprises de BTP marocaines gèrent aujourd’hui des processus fragmentés (chantier, achats, stock, études de prix, facturation, RH terrain, HSE, marchés publics). Sektor vise à unifier ces flux dans un seul système, avec moins de ressaisie et davantage d’assistance IA/documentaire.

**Fait — état actuel du produit.** Le README monorepo marque Sektor comme « production » (`docs/README.md`). Or :

- un environnement prod existe (OVH VPS k3s, hosts `sektor.nafuralabs.com`) — **fait ops** ;
- le tracker d’intégration backend indique ~2 tâches réellement terminées sur 78, le reste en partiel (`products/sektor-btp/web/docs/specs/backend-integration-roadmap/00-PROGRESS.md`) ;
- le walkthrough chantier documente un **trou structurel** sur le fil roi (liaison marché / valorisation BPU) (`WALKTHROUGH-CHANTIER.md`) ;
- la roadmap produit (juin 2026) classe le fil roi en L1, Doxura en L3 partiel, intégrations Maroc en L0–L1.

**Déduction.** Sektor est un **produit large, déployable, démontrable module par module**, plus proche d’un **pilote / démonstration commerciale** que d’un ERP bout-en-bout prêt pour un déploiement client sans accompagnement. « Production » dans le README désigne probablement *l’existence d’un déploiement prod*, pas *la maturité métier complète*.

**Grandes capacités déjà construites (faits) :**

| Capacité | Preuve principale |
|----------|-------------------|
| Multi-tenant + IAM Keycloak | `platform/backend/core/tenancy`, `authorization`, `infra/keycloak` |
| ERP BTP multi-modules (13 domaines) | `products/sektor-btp/backend/modules/*` |
| UI Angular large + shell plateforme | `products/sektor-btp/web/`, `platform/web/` |
| Extraction documentaire + types BTP seedés | `platform/.../doc-extractor` |
| Stack IA (LLM multi-provider, conversations, agent propose/approve) | `platform/backend/features/ai/*` |
| Mesure usage tokens/storage + console ops | `administration/usage`, `products/usage-ops/` |
| Abonnements / entitlements | `administration/subscription` |
| Build Intelligence (connaissance BTP + pont Sektor) | `products/build-intelligence/` |
| Ops deployables staging/prod | `toolchain/ops/nlops.sh`, overlays K8s |

**Direction architecturale apparente (déduction) :**

- monolithes modulaires Spring Boot par produit, partageant des jars plateforme ;
- front Angular pour Sektor, consommant des libs `platform/web` ;
- une ambition « plateforme multi-verticales » (marketing corporate) alors que le code métier réutilisable reste quasi exclusivement dans Sektor + quelques compagnons BTP ;
- séparation progressive front plateforme / front produit (epic `front-ownership` marqué done).

**Zones encore ambiguës (questions ouvertes) :**

1. Sektor est-il le cœur de la stratégie, ou un premier client de la plateforme agentique ?
2. Jusqu’où la plateforme doit-elle rester générique alors que des rôles BTP, seeds documentaires BTP et libellés « ERP » y sont déjà embarqués ?
3. Quel est le **premier cas d’usage vendable** (fil roi chantier ? études de prix ? achats/3-way matching ? extraction docs ?) ?
4. Quelle place réelle pour Layali / Beauty / Blanner face à Sektor ?
5. La facturation client (plans marketing MAD) et le metering IA (usage-ops soft quotas) sont-ils deux systèmes distincts à long terme ?

---

## 2. Structure du repository

```
nafuralabs/
├── platform/          # SDK partagé (backend Gradle + web Angular)
├── products/          # Produits autonomes
├── infra/             # K8s partagé + Keycloak themes
├── marketing/         # Sites vitrine
├── shared/business/   # Métier multi-produits (vide)
├── toolchain/ops/     # nlops.sh — déploiement
├── tools/             # Outillage (lifecycle, scripts)
├── docs/              # Documentation monorepo
├── secrets/           # Bootstrap secrets locaux (partiellement gitignoré)
└── (Gradle racine + Makefile + package.json workspaces)
```

| Zone | Rôle | Contenu typique | Produits utilisateurs | Nature | Maturité apparente |
|------|------|-----------------|----------------------|--------|--------------------|
| `platform/backend/` | Capacités transverses Java | core (auth, tenancy…), features (AI, docs, collab…), google-places | Sektor, BI, usage-ops, venue-catalog | **Générique déclaré**, avec fuites BTP | Moyenne–haute sur schema/API ; tests faibles |
| `platform/web/` | Shell UI + features Angular | core shell, anatomy UI, admin, AI chat, smart-import | **Sektor principalement** | Générique / couplage historique Sektor | Fonctionnelle pour Sektor |
| `products/sektor-btp/` | ERP BTP | 13 modules + app + web + deploy + docs massives | Lui-même | **Spécifique BTP** | Large, partiel, demo-capable |
| `products/build-intelligence/` | Connaissance BTP / extraction / BPU | modules documents→génération + pont Sektor | Compagnon Sektor | **Spécifique BTP** | Backend réel ; UI stub |
| `products/usage-ops/` | Console ops consommation IA/storage | federation, quotas, alerts | Ops Nafura | **Générique ops** | V1 déployable, UI légère |
| `products/venue-catalog/` | Catalogue lieux partagé | Google Places → review → publish | Futur Layali/Beauty | **Générique lieux** | Backend + specs ; deploy/web incomplets |
| `products/layali/`, `beauty/` | Apps nightlife / salons | Specs + Ionic mobile P1 mock | Consommateurs futurs | **Spécifiques verticales** | Prototype P1 (fixtures) |
| `products/blanner/` | App sociale « blans » | Flutter + Spring standalone | Indépendant | **Expérimental / hors plateforme** | Code substantiel, non onboardé monorepo |
| `marketing/` | Vitrines | Next.js corporate, MBS, Zenith | Communication | Marketing | Déployable |
| `infra/k8s`, `infra/keycloak` | Infra partagée | Postgres, Vault, MinIO, IAM… | Tous produits déployables | Générique | Opérationnelle staging/prod |
| `shared/business/` | Métier partagé | README seulement | — | Intention | **Vide** |
| `toolchain/ops/` | Ops | `nlops.sh`, hosts, lifecycle | Tous | Générique | Mature pour Sektor |
| `docs/` | Canon monorepo | AGENTS, README, imports, Vault | Humains/agents | — | Solide ops ; vision produit dispersée |

**Fait.** `settings.gradle.kts` enregistre : platform + sektor + venue-catalog + build-intelligence + usage-ops.  
**Fait.** Layali, Beauty, Blanner ne sont pas dans ce graphe Gradle.  
**Fait.** `docs/ARCHITECTURE_MIGRATION.md` est référencé partout mais **absent du disque**.  
**Fait.** Legacy `nf/nafura` : archive, ne plus développer (`docs/AGENTS.md`).

---

## 3. Vision actuelle de la plateforme Nafora

Doctrine (`docs/AGENTS.md`, `docs/README.md`, marketing corporate) : *une plateforme agentique propriétaire → plusieurs verticales ; Sektor est le premier*.

| Capacité | Objectif | État actuel | Modules / chemins | Générique aujourd’hui ? | Hypothèses Sektor/BTP ? | Duplications / incohérences |
|----------|----------|-------------|-------------------|-------------------------|-------------------------|-----------------------------|
| **Intégration LLM** | Appeler des modèles, tracer l’usage | Implémenté (providers + events) | `platform/backend/features/ai/llm-provider` | Partiellement | Texte d’aide Gemini avec routes `/chantiers` | — |
| **Abstraction multi-fournisseurs IA** | Changer de provider | Présente (module llm-provider) | idem | Oui en intention | Contenu d’aide BTP | Peu de documentation partenaire |
| **Suivi tokens** | Mesurer tokens in/out + coût | Oui au niveau produit + agrégation ops | `administration/usage` ; `products/usage-ops` | Oui | Non | Soft quotas ≠ facturation client |
| **Facturation / consommation** | Plans, entitlements, licences on-prem | Module subscription présent | `administration/subscription` | Oui (ownerType/ownerId) | Plans marketing Sektor séparés | Deux mondes : subscription in-app vs pricing site |
| **Notifications** | In-app + email (Brevo) | Présent | `collaboration/notification` | **Ambigu** | APIs nommées `ErpAlert*`, `/api/v1/erp/alerts` | Naming ERP dans plateforme |
| **Extraction docs (Doxura)** | Doc → données structurées | Moteur + seeds + UI smart-import | `documents/doc-extractor` ; web `smart-import` | Moteur oui | Seeds `*_btp_*`, chantiers/achats/ventes/rh | Couplage fort via seeds |
| **Import / migration historique** | Reprise clients, articles, etc. | Handlers smart-import existants ; epic onboarding **spécifié non branché** | epic `onboarding-reprise-donnees` | Capacité plateforme partielle | Parcours Sektor | Onboarding actuel = questionnaire, pas reprise fichiers |
| **Auth / utilisateurs** | Keycloak + AppUser | Fonctionnel | `core/identity`, `authorization`, Keycloak | Oui | — | Stubs session/password user-settings |
| **Rôles / permissions** | RBAC + `@RequirePermission` | Fonctionnel | `authorization`, `administration/iam` | **Non pur** | Catalogue rôles `BTP_DG`, `BTP_CHEF_CHANTIER` dans **platform** | Métier dans le core |
| **Audit** | Trail d’actions | Présent | `collaboration/audit` | Oui | — | Peu de tests |
| **Stockage documents** | Attachments, templates, MinIO | Présent | `doc-manager` + MinIO infra | Oui | — | — |
| **Composants partagés UI** | Shell, listings, anatomy | Riches | `platform/web/core`, `lib/anatomy` | Oui pour Angular | Shell historiquement couplé Sektor (dette documentée) | READMEs chemins obsolètes |
| **Infra partagée** | Un cluster / env | Staging + prod | `infra/k8s` | Oui | — | — |
| **Observabilité** | Metrics/tracing | Module enregistré | `core/observability` | Oui | — | **Aucun produit ne dépend du module** |
| **Multi-tenant** | Isolation tenants | Tables + filtres + IAM | `core/tenancy`, `scope` | Oui | — | Qualité d’isolation non prouvée par tests dédiés visibles |
| **Workflows / approbations** | Moteur générique | Présent | `collaboration/workflow` + module Sektor `approbations` | Partiel | Matrice pouvoirs BTP côté produit | Deux couches (platform workflow + secteur approbations) |
| **Webhooks** | Intégrations sortantes | Code + UI admin | `collaboration/webhook` | Oui | — | **Aucun produit ne wire la dépendance Gradle** |
| **Job runner** | Locks Redis / idempotence | Présent | `core/job-runner` | Oui | — | Doublon conceptuel avec jobs framework ; Sektor n’y dépend pas |
| **Google Places** | Recherche lieux | Lib client | `integrations/google-places` | Oui | — | Venue-catalog seulement |

**Déduction.** La plateforme est **réelle et substantielle**, mais son « générique » est encore **calibré sur Sektor**. Un second vertical Angular lourd forcerait un vrai découplage (rôles, seeds docs, naming ERP, shell).

---

## 4. Vue produit de Sektor

### Positionnement

**Fait (marketing).** « ERP dédié au BTP… Notre premier vertical, déjà au service du secteur BTP marocain » (`marketing/corporate/.../fr.json`).  
**Fait (roadmap).** Ambition agentique L0→L5 ; horizons H0 stabiliser → H1 vendable PME BTP Maroc → H2 agentique → H3 leader région.

### Utilisateurs / rôles identifiables

| Rôle | Nature | Source |
|------|--------|--------|
| OWNER / ADMIN / MANAGER / MEMBER / VIEWER | Plateforme | `001_iam_bootstrap_erp.sql` |
| BTP_DG | Direction générale | bootstrap BTP + platform `AuthRoleResponse` |
| BTP_DAF | Finance / achats / ventes | idem |
| BTP_CONDUCTEUR_TRAVAUX | Pilotage chantier | idem |
| BTP_CHEF_CHANTIER | Terrain (avancement, pointage, incidents) | idem |
| BTP_DIRECTEUR_TRAVAUX | Référencé matrice pouvoirs | `MatricePouvoirService` |
| Rôles métier partenaire CLIENT / FOURNISSEUR / MOA / SOUS_TRAITANT | CRM | module `partner` |

### Problèmes adressés

- Unifier chantier, études de prix, achats, stock, ventes, finance, RH terrain, HSE, marchés.
- Réduire la ressaisie (documents → données ; situation → facture).
- Gouverner (approbations, permissions, audit).
- Couvrir des spécificités Maroc (attestations, CGNC, déclarations — souvent encore stub).

### Modules fonctionnels (backend)

| Module | Rôle métier | Centralité |
|--------|-------------|------------|
| `chantiers` | Agrégat projet chantier, lots, budget, avancement, situations | **Cœur** |
| `etudes` | Bibliothèque ouvrages, métrés, DPGF/DPU, devis, dossiers d’étude | **Cœur** (investissement fort) |
| `achats` | DA → AO → BC → réception → FF, 3-way matching | **Cœur** |
| `stock` + `item` | Catalogue articles, dépôts, mouvements, magasin chantier | **Cœur** |
| `ventes` | Offres, BCC, factures, encaissements, RG | **Cœur** (chaîne incomplète) |
| `partner` | Clients, fournisseurs, MOA, ST | Socle |
| `finance` | Comptabilité, trésorerie, lettrage | Important / large |
| `marches` | Contrats, avenants, cautions, DGD, OS | Spécifique BTP/public |
| `rh` | Employés, pointage, congés, paie | Secondaire pour V1 ? |
| `hse` | Incidents, NC, EPI, PPSPS, DUER | Secondaire / conformité |
| `approbations` | Workflows + matrice pouvoirs | Gouvernance |
| `currency` | Devises, taux, conditions paiement | Socle |

### Entités métier principales et relations (vue simplifiée)

```text
Partner (CLIENT|FOURNISSEUR|MOA|ST)
    ├── Chantier ── Lot / Phase / Budget / Avancement / Situation / Documents
    ├── Marché (contrat) ── lié chantier / situations / factures marché
    ├── Achats (DA→BC→Réception→FF) ── Item / Stock
    ├── Ventes (Offre→BCC→Facture→Encaissement)
    └── Études (DossierEtude / Devis / Ouvrage / DPGF) ── peut alimenter marchés/chantiers

Item ── StockBalance / InventoryTx / Réservations / MagasinChantier
Employé ── Pointage (chantier) / Congés / Paie
HSE ── Incident / Inspection / EPI (liés chantier / employés)
```

### Valeur pour une entreprise BTP

**Déduction.** Si le fil roi et les imports documentaires aboutissent : une seule source de vérité chantier–marge–trésorerie, moins d’Excel, meilleure conformité, assistance IA sur documents et questions métier.

**Fait.** Aujourd’hui, la valeur démontrable est surtout **modulaire** (écrans et APIs par domaine), pas encore une **chaîne financière bout-en-bout sans friction**.

### Fonctionnalités centrales / secondaires / incomplètes

| Catégorie | Exemples | Preuve |
|-----------|----------|--------|
| **Centrales (ambition)** | Chantiers, situations, achats/3-way, études prix, stock, partenaires | Roadmap + modules riches |
| **Secondaires (surface large)** | HSE complet, RH paie, GMAO OT/carburant, analytics | Routes nombreuses ; profondeur faible |
| **Incomplètes / esquissées** | Fil roi facture→encaissement→clôture ; onboarding reprise ; PDF/exports ; BAM/DGI/CNSS ; agents L4 métier ; portail fournisseur | Walkthrough, roadmap L-levels, stubs, epic onboarding |

---

## 5. Parcours métier

Convention : **Certain** = routes + services + (idéalement) e2e/walkthrough. **Partiel** = UI/API présentes mais trous. **Spécifié** = docs/epics sans implémentation complète. **Hypothèse** = non retenu comme supporté.

### 5.1 Création et suivi d’un chantier — **Partiel / Certain jusqu’à situation**

| Élément | Contenu |
|---------|---------|
| Acteur | Conducteur / chef de chantier / admin |
| Déclencheur | Besoin de suivre un nouveau chantier |
| Étapes | Wizard création → lots/phases → budget → avancement → (marché) → situation |
| Données | Chantier, lots, BPU, avancements, marché, situation |
| Résultat attendu | Situation valorisée puis facture |
| Composants | `modules/chantiers`, `modules/marches`, `modules/ventes`, UI `/chantiers` |
| Trous | Walkthrough : wizard ne lie pas correctement un marché ; sans BPU les situations restent à 0 MAD ; facture/encaissement/clôture non bouclés (`WALKTHROUGH-CHANTIER.md`) |

### 5.2 Demande d’achat → validation → commande — **Partiel (e2e smoke)**

| Élément | Contenu |
|---------|---------|
| Acteur | Demandeur terrain / acheteur / approbateur |
| Déclencheur | Besoin matériel |
| Étapes | DA → submit/approve → AO optionnel → BC |
| Données | DemandeAchat, AO, OffreFournisseur, BonCommandeAchat |
| Résultat | BC prêt à réceptionner |
| Composants | `modules/achats`, `approbations`, UI achats |
| Trous | DoD permissions/e2e incomplets (`00-PROGRESS.md`) |

### 5.3 Réception marchandises + 3-way matching — **Partiel / Certain smoke**

| Élément | Contenu |
|---------|---------|
| Acteur | Magasinier / DAF |
| Déclencheur | Arrivée BL / facture fournisseur |
| Étapes | Réception → stock ; matching BC↔BL↔FF ; litige/compta |
| Données | ReceptionAchat, InventoryTx, FactureFournisseur |
| Composants | `achats`, `stock`, doc-extractor (BL) |
| Trous | Doxura : 8 types seedés, **1 intégration ERP** citée (BL→réception) (`ROADMAP`, `BACKLOG-DOXURA-ERP.md`) |

### 5.4 Gestion du stock — **Partiel / Demo**

| Élément | Contenu |
|---------|---------|
| Acteur | Magasin central / magasin chantier |
| Étapes | Entrées/sorties/transferts, balances, réservations, magasin chantier |
| Trous | Reverse mouvement non supporté ; GMAO OT/carburant vides (`00-PROGRESS`) |

### 5.5 Études de prix / dossier unifié — **Partiel → Demo-capable**

| Élément | Contenu |
|---------|---------|
| Acteur | Estimateur / bureau d’études |
| Étapes | Dossier → pièces (BDP/CPS) → bordereau (manuel ou extraction) → décomposition → synthèse |
| Composants | `modules/etudes`, adapters DocExtractor dans `backend/app`, Build Intelligence (pont) |
| Trous | Lots epic 4–7 ouverts ; ports IA suggestion souvent NoOp |

### 5.6 Importation ancien document / extraction — **Partiel**

| Élément | Contenu |
|---------|---------|
| Acteur | Admin / métier |
| Certain | Smart-import platform + extraction études |
| Spécifié non fait | Reprise onboarding 5 fichiers (`docs/epics/onboarding-reprise-donnees/`) |

### 5.7 Tableau de bord / pilotage — **Prototype → Partiel**

Routes analytics présentes ; profondeur KPI/charts historiquement jugée fine (audits UX). Promesse DG « langage naturel » = ambition L2–L4, pas réalité produit complète.

### 5.8 Gestion fournisseur — **Fonctionnel CRUD / Partiel conformité**

Fiche partenaire, catalogue, attestations, contrats ST. Blocages CNSS/fiscale : workflows présents ; intégrations externes souvent stub.

### 5.9 Onboarding entreprise — **Certain (questionnaire) / Non (reprise)**

Signup → questions société/ICE → presets → dashboard. **Pas** le wizard de reprise documentaire décrit dans l’epic.

### Non inventés (absents ou trop faibles dans le repo)

- Portail fournisseur self-service (horizon H3 roadmap).
- E-facture DGI production.
- Agent qui lettre automatiquement en production (L4).

---

## 6. Architecture fonctionnelle

### A. Cœur générique Nafora

Réutilisable par plusieurs produits **sans** hypothèse BTP structurelle.

- Tenancy, identity, authorization (mécanisme — pas le catalogue de rôles BTP)
- Subscription / entitlements
- Usage metering + usage-ops
- Doc-manager, audit, comments, tagging
- LLM provider (mécanisme), conversation, agent runtime
- Job runner, framework CRUD, settings/sysconfig
- Infra K8s, Keycloak, Vault, MinIO
- Shell Angular (avec réserves de découplage)

**Raisonnement :** ces briques existent sous `platform/` et sont déjà consommées hors Sektor (BI, usage-ops, venue-catalog pour une partie).

### B. Cœur ERP potentiellement réutilisable

Utile à d’autres ERP, mais encore teinté BTP/Maroc/Sektor.

- Partner (CRM multi-rôles)
- Item / stock / currency
- Achats / ventes / finance (modèle documentaire)
- Workflow d’approbation + matrice pouvoirs
- Doc-extractor **moteur** (sans seeds BTP)
- Smart-import handlers génériques (client, article…)

**Raisonnement :** noms souvent génériques (`Item`, `Partner`, `InventoryTx`) mais seeds, validations (ICE), attestations, CGNC et parcours UI sont calibrés construction Maroc.

### C. Spécialisation Sektor / BTP

- Chantiers, situations de travaux, attachements
- Études / DPGF / DPU / ouvrages / corpus BTP
- Marchés publics (DGD, OS, cautions, révisions)
- HSE BTP (PPSPS, PHS, DUER…)
- Rôles `BTP_*`
- Build Intelligence (BPU/DQE, pont études)
- Conformité Maroc poussée (CNSS, DGI, BAM — même stub)

### Classification ambiguë

| Élément | Pourquoi ambigu |
|---------|-----------------|
| Seeds doc-extractor dans `platform/` | Capacité générique, contenu BTP |
| Notification `ErpAlert*` | Feature plateforme, naming métier |
| Rôles BTP dans `platform/.../authorization` et IAM | Core générique pollué |
| Module `item` nommé génériquement | Comportement catalogue BTP |
| Finance | ERP générique vs plan comptable CGNC / caisses chantier |

---

## 7. Architecture technique

### Technologies principales

| Couche | Stack observée |
|--------|----------------|
| Backend | Java, Spring Boot, Gradle multi-modules, JPA, Liquibase (Sektor/BI/usage-ops) ; Flyway prévu venue-catalog |
| Frontend Sektor | Angular (workspace npm racine : `platform/web` + `sektor-btp/web`) |
| Autres fronts | Static/nginx (usage-ops, BI) ; Ionic React (Layali/Beauty) ; Flutter (Blanner) ; Next.js (marketing) |
| IAM | Keycloak (`infra/keycloak`, realm portal) |
| Data / fichiers | Postgres, MinIO/S3, Redis, OpenSearch |
| Secrets | Vault |
| Orchestration | Kubernetes (Docker Desktop staging ; OVH k3s prod) |
| Ops | `toolchain/ops/nlops.sh`, Makefile `dev-up` / `stg-up` / `prod-up` |
| IA | Providers LLM (Gemini cité), pipelines extraction multimodales |

### Applications / services

| App ID | NS typique | DB | Rôle |
|--------|------------|-----|------|
| `sektor-btp` | `sektor-${ENV}` | `nafura_erp` | ERP |
| `build-intelligence` | `build-intelligence-${ENV}` | `nafura_build_intelligence` | Connaissance BTP |
| `usage-ops` | `usage-ops-${ENV}` | `nafura_usage_ops` | Ops metering |
| `venue-catalog` | prévu | `nafura_venue_catalog` | Catalogue lieux |
| Marketing | `nafura-vitrine-${ENV}` | — | Sites |
| Infra | `nafura-infra-${ENV}` | partagée | Postgres, IAM, etc. |

### Frontières

```text
[Browser Angular Sektor] --HTTP/JWT--> [Sektor Spring Boot]
        |                                    |
        +-- libs platform/web                +-- jars platform/backend
                                             +-- Postgres nafura_erp
                                             +-- MinIO / Keycloak / LLM APIs

[usage-ops] --HTTP--> /api/v1/platform/usage sur Sektor & BI
[Build Intelligence] --HTTP--> Sektor Études (import proposals)
[Venue Catalog] --Google Places--> (futur) Layali/Beauty
```

### Flux de données notables

1. Utilisateur → Keycloak → JWT → API produit (tenant context).
2. Upload document → MinIO + doc-manager → doc-extractor / BI extraction → entités métier.
3. Actions agent : propose → approve → execute (runtime plateforme).
4. Usage LLM/storage → tables locales → fédération usage-ops → soft quotas + emails.

### Intégrations externes

| Intégration | État |
|-------------|------|
| Keycloak | Opérationnel |
| Brevo (email) | Documenté (Vault) |
| Google Places | Client platform ; venue-catalog |
| LLM providers | Opérationnels côté code |
| BAM / banques XML / DGI / CNSS | Stubs ou partiels |
| Firebase (Blanner) | Hors plateforme Nafura |

### Choix architecturaux visibles

1. **Monorepo unique** tant que Gradle/TS sont partagés — pas de split platform/Sektor.
2. **Pas de codegen JSON** (legacy `nafgen` interdit).
3. **Environnement = cluster**, pas branche Git.
4. **CI/CD GitHub Actions non implémenté** — deploy manuel (`docs/AGENTS.md`).
5. **Direction de dépendance front :** app → plateforme, jamais l’inverse (ESLint Sektor).
6. **`shared/business` vide** jusqu’à preuve d’un 2ᵉ consommateur.

---

## 8. Modèle de données

Focus sur les entités « génériques » et leur réalité.

| Entité | Rôle métier | Relations clés | Nom générique ? | Comportement réel | Ambiguïtés / chevauchements |
|--------|-------------|----------------|-----------------|-------------------|-----------------------------|
| **Tenant / Organization** | Isolation client SaaS | memberships, domains | Oui | Multi-app via `application_id` | « Société » ERP vs tenant IAM |
| **User / AppUser** | Identité | roles, memberships | Oui | Keycloak + table locale | Provisioning Keycloak partiel/stub |
| **Partner** | Tiers | roles CLIENT/FOURNISSEUR/MOA/ST | Semi | Hub CRM BTP | Pas de Customer/Supplier séparés — volontaire |
| **Item** | Article catalogue | prices, categories, stock, achats | Oui | Catalogue **matériaux/matériel BTP** | Risque de croire à un PIM retail |
| **Product** | — | — | — | **Pas d’entité Product centrale Sektor** observée | Confusion vocabulaire marketing |
| **Chantier** | Projet de construction | lots, budget, situations, stock | **Spécifique** | Agrégat cœur | Relation à « Project » générique non formalisée |
| **Project / Site** | — | — | — | Chantier ≈ Project ; Location ≈ dépôt/site stock | Nomenclature anglaise/française mixte |
| **Inventory / Stock** | Stocks et mouvements | Item, Location, Chantier | Semi | Entrepôt + magasin chantier | Deux lectures (central vs chantier) |
| **Document** | Pièces jointes / pièces marché / GED | doc-manager + docs chantier + extraction jobs | Ambigu | Plusieurs « Document » selon module | Risque de fragmentation GED |
| **Supplier / Customer** | — | via PartnerRole | — | Rôles sur Partner | OK conceptuellement ; UI peut parler fournisseurs/clients |
| **Ouvrage / DPGF / DPU** | Décomposition prix BTP | études, marchés | **Spécifique** | Cœur différenciant | — |
| **SituationTravaux** | Avancement valorisé | chantier, marché, ventes | **Spécifique** | Pont vers facture | Fragile sans BPU/marché |
| **DemandeAchat / BC / FF** | Cycle P2P | partner, item, stock, finance | Semi ERP | Standard ERP + attestations MA | — |
| **Marché / ContratMarche** | Contrats travaux | chantier, factures, cautions | Spécifique | Public/privé | Chevauchement contrat fournisseur achats |
| **Employé** | RH | pointage chantier, paie | Semi | RH terrain BTP | Paie PDF souvent 501/stub |

**Déduction.** Les noms génériques (`Item`, `Partner`, `Location`) **cachent souvent un comportement BTP Maroc**. Ce n’est pas un défaut en soi, mais un risque si l’on vend la plateforme comme multi-verticale sans refactoring de modèle.

---

## 9. État d’avancement

Échelle demandée. Estimations **indicatives**, justifiées par code/docs — pas des certitudes auditées en runtime.

| Module / produit | Statut estimé | Justification courte |
|------------------|---------------|----------------------|
| Infra K8s + Keycloak + Vault | **Fonctionnel / utilisé pour ops** | Overlays staging/prod, docs ops riches |
| Platform auth/tenancy/IAM | **Fonctionnel** | Controllers, Liquibase, consommé multi-produits ; tests limités |
| Platform AI stack | **Partiellement implémenté → demo** | Runtime + conversation + tests ; tools métier peu branchés (roadmap L2) |
| Platform doc-extractor | **Partiellement implémenté** | Moteur + seeds + 1 intégration ERP forte |
| Platform subscription | **Fonctionnel technique** | APIs/README ; adoption commerciale non visible dans le code |
| Platform usage + usage-ops | **Fonctionnel V1 ops** | Soft quotas ; pas de hard block |
| Platform observability / webhook | **Prototype / non branché** | Modules orphelins côté consommateurs |
| Sektor partner/item/currency | **Fonctionnel / prêt démo** | CRUD + migrations + UI |
| Sektor stock | **Partiellement implémenté / démo** | HTTP large ; reverse/GMAO incomplets |
| Sektor achats | **Partiellement → parcours smoke** | E2e commerce/3-way ; DoD incomplet |
| Sektor ventes | **Partiellement implémenté** | Entités + adapter situation→facture ; encaissement non prouvé bout-en-bout |
| Sektor chantiers | **Partiellement → parcours incomplet** | UI riche ; trou marché/BPU/fil roi |
| Sektor études (+ dossier) | **Partiellement → démo** | Tests nombreux, corpus, wizard ; lots epic ouverts |
| Sektor finance | **Partiellement / démo UI** | Large surface ; imports/intégrations stub |
| Sektor RH / HSE / marchés | **Partiellement implémenté** | CRUD large ; PDF/intégrations faibles |
| Sektor approbations | **Partiellement implémenté** | Engine + tests ; escalade stub |
| Sektor analytics | **Prototype → partiel** | Routes ; profondeur limitée |
| Onboarding reprise données | **Spécifié** | Epic sans wiring complet |
| Build Intelligence | **Prototype produitisé** | Backend réel ; UI stubs ; déployable |
| Venue Catalog | **Prototype backend / specs** | Pas de deploy/web complets |
| Layali / Beauty | **Prototype P1** | Screens mock, pas de backend monorepo |
| Blanner | **Prototype hors plateforme** | App réelle standalone, non intégrée |
| Marketing corporate / MBS / Zenith | **Prêt production vitrine** | Déployés |
| **Sektor global** | **Prêt pour démonstration** ; **pas encore clairement prêt pilote autonome** | Déployable prod ≠ parcours métier scellé |

**Note critique.** Le label « production » dans `docs/README.md` **ne doit pas** être lu comme « ERP complet en production chez des clients » sans validation hors-repo (voir §13).

---

## 10. Dette, risques et points d’attention

| Risque | Gravité | Observation |
|--------|---------|-------------|
| **Surfaces ERP trop larges vs fil roi incomplet** | **Critique** | Beaucoup de modules ; walkthrough bloque facturation |
| **Couplage plateforme ↔ Sektor (rôles BTP, seeds docs, ErpAlert)** | **Élevé** | Contredit la doctrine « pas de métier dans platform » |
| **Sur-spécialisation BTP / partenaire métier unique** | **Élevé** | Toute la profondeur est BTP Maroc ; autres verticales peu avancées |
| **Abstraction prématurée multi-verticale** | **Élevé** | Marketing Finance/Retail/Logistics sans code ; platform déjà BTP-teintée |
| **Secrets / credentials exposés** | **Critique** | `creds.env` **suivi par git** ; `usage-ops/README.md` documente un mot de passe seed ; traiter en diligence (ne pas reproduire ici) |
| **Isolation multi-tenant / permissions** | **Élevé** | Mécanismes présents ; peu de preuves de tests d’isolation systématiques ; DoD permissions souvent ouvertes |
| **Dépendance LLM + coûts** | **Élevé** | usage-ops soft only ; pas de hard stop V1 |
| **Documentation / trackers obsolètes** | **Moyen** | `00-PROGRESS` quasi tout `[~]` ; inventaires mock historiques ; `ARCHITECTURE_MIGRATION.md` manquant ; README « production » vs roadmap |
| **Absence / rareté de tests** | **Élevé** | Fort sur `etudes` ; faible sur platform core et nombreux modules |
| **Fonctionnalités commencées non finalisées** | **Élevé** | Webhooks, observability, onboarding reprise, GMAO, PDF 501, NoOp AI ports |
| **Duplication / naming chaos packages** | **Moyen** | `ma.nafura.core` vs `platform` vs packages plats ; foundation orpheline |
| **Complexité monorepo / sur-ingénierie** | **Moyen** | Beaucoup de modules Gradle et docs agents ; pertinent si multi-produits, coûteux si Sektor seul compte |
| **Qualité données / seeds demo** | **Moyen** | Seeds gated par flag demo — bien ; risque de confondre demo et defaults tenant |
| **CI/CD absent** | **Moyen** | Deploy manuel → risque drift staging/prod |
| **Blanner hors gouvernance** | **Faible–Moyen** | Nested git, stack parallèle — confusion portefeuille |
| **Fonctionnalités sans validation utilisateur** | **Élevé** | Non déductible du repo ; surface HSE/RH/analytics suspecte de build-ahead |

---

## 11. Questions stratégiques ouvertes

1. **Cible exacte de Sektor** : PME générale BTP ? Entreprises de taille intermédiaire ? Majors ? Sous-traitants spécialisés ?
2. **Taille d’entreprise et ticket** : cohérents avec les plans Starter/Pro/Business du site ?
3. **Qui achète** : DG, DAF, conducteur, DSI, cabinet intégrateur ?
4. **Premier cas d’usage à vendre** : fil roi chantier, études de prix, achats/matching, ou Doxura ?
5. **Périmètre V1** : quels modules **hors** scope pour un pilote (HSE ? paie ? marchés publics complets ?) ?
6. Que doit **rester BTP-spécifique** vs devenir brique Nafora (Item/Stock/Partner/doc-extractor seeds) ?
7. Certaines briques deviennent-elles des **produits séparés** (Build Intelligence, Doxura, usage-ops) ou restent-elles features ?
8. **Facturation** : abonnement ERP seul, packs tokens IA, on-prem licences, services d’intégration ?
9. **Stratégie IA** : différenciateur marketing immédiat, ou capacité à activer seulement après fil roi stable ?
10. **Multi-tenant** : purement SaaS multi-société, ou déploiements single-tenant on-prem prioritaires ?
11. **Priorité Sektor vs Layali/Beauty/Blanner/MBS** : allocation réelle d’effort des prochaines 12 semaines ?
12. Jusqu’où les besoins d’un **partenaire métier BTP** dictent-ils le backlog vs une vision plateforme ?
13. Que valider **en entretien client** avant de continuer HSE/RH/analytics ?
14. Le label « déjà au service du secteur BTP marocain » (marketing) décrit-il des **clients payants**, une **démo**, ou une **ambition** ?
15. Faut-il **geler l’expansion modules** jusqu’à clôture du fil roi et de l’onboarding reprise ?

---

## 12. Recommandations immédiates

### Maintenant

1. **Choisir un fil roi V1 unique** (recommandation produit : *chantier → avancement → situation → facture*, ou *études dossier → devis*) et geler le reste comme « hors démo commerciale ».
2. **Corriger les trous structurels documentés** du walkthrough (liaison marché, BPU/valorisation) avant d’ajouter des écrans.
3. **Clarifier le message externe** : distinguer *plateforme déployée* / *ERP démontrable* / *ERP prêt pilote* — aligner marketing et `docs/README.md`.
4. **Traiter les surfaces de secrets** (`creds.env` versionné, mots de passe seed dans README) — rotation + retrait du suivi git.
5. **Décider du premier pilote** : profil d’entreprise, 3 workflows mesurés, critère go/no-go en 4–6 semaines.

### Ensuite

6. **Séparer explicitement plateforme vs Sektor** : extraire catalogues de rôles BTP et seeds doc BTP hors des modules « core » documentés comme génériques (même si le code reste monorepo).
7. **Brancher l’onboarding reprise** sur les handlers smart-import existants — levier adoption et migration Excel.
8. **Instrumenter l’apprentissage** : 5–10 événements produit (création chantier, situation, DA, import doc, usage token) visibles dans usage-ops ou analytics simple.

### Plus tard

9. **Arbitrer le portefeuille** : Layali/Beauty/Blanner en incubation documentée vs focus Sektor+BI ; éviter la dilution sans roadmap de ressources.
10. **CI staging minimal** après gel du périmètre V1 — réduire le risque ops avant multiplication des clients.

---

## 13. Informations manquantes

| Information manquante | Pourquoi c’est important | Qui peut la fournir | Décision facilitée |
|-----------------------|--------------------------|---------------------|--------------------|
| Clients réels / pilotes / revenus Sektor | Calibrer maturité « production » | Fondateur / commercial | Priorisation pilote vs R&D |
| Feedback utilisateurs terrain | Savoir quels modules sont du bruit | Partenaire métier / early users | Couper le scope |
| Accord et attentes du partenaire BTP | Éviter sur-spécialisation captive | Fondateur + partenaire | Gouvernance backlog |
| Coûts LLM réels observés | Viabilité modèle IA | Ops (usage-ops) + finance | Pricing tokens / soft→hard quotas |
| Stratégie commerciale 12 mois (Sektor vs plateforme vs studios) | Allocation monorepo | Direction | Freeze produits secondaires |
| Niveau d’engagement legal/conformité DGI/CNSS | Ne pas promettre des stubs | Expert fiscal/social + produit | Roadmap conformité |
| Qui maintient la dette docs/trackers | Éviter décisions sur docs périmées | Tech lead | Process doc unique |
| Intention Blanner (intégrer ou isoler) | Clarté portefeuille | Fondateur | Onboard monorepo ou repo séparé |
| SLA / RTO prod actuels | Risque promesse client | Ops | Contrats pilote |
| Validation que l’isolation tenant a été pentestée | Risque sécurité multi-tenant | Sécu / tech | Go-live multi-client |

---

## Résumé à transmettre au partenaire stratégique

Nafora Labs n’est pas « un simple ERP BTP ». C’est un **monorepo de plateforme logicielle** qui vise à faire naître plusieurs produits d’entreprise à partir d’un socle commun (identité, multi-tenant, documents, IA, abonnements, notifications, infrastructure Kubernetes). Sur ce socle, **Sektor** est aujourd’hui le produit le plus avancé et le premier vertical commercial : un ERP destiné aux entreprises de construction au Maroc, avec une ambition différenciante — l’IA comme **copilote métier** (extraction de documents, assistance, plus tard propositions d’actions), plutôt que comme gadget conversationnel.

Le problème métier que Sektor adresse est classique mais réel : fragmentation des outils (chantier, achats, stock, études de prix, facturation, RH de terrain, HSE, marchés), ressaisie, faible traçabilité, et adaptation partielle des ERP généralistes au contexte marocain (ICE, attestations, pratiques de situation de travaux, etc.). La promesse documentée est qu’un conducteur puisse aller du chantier à la facture sans rupture ; qu’un DAF rapproche commandes, bons de livraison et factures ; qu’un dirigeant interroge la marge en langage naturel. Cette promesse est **crédible comme direction**, pas encore comme réalité bout-en-bout.

**Ce qui est déjà solide.** Une vraie plateforme technique existe : Keycloak, tenancy, permissions, gestion documentaire, moteur d’extraction, stack LLM avec mesure de tokens, moteur d’agents (proposer / approuver / exécuter), abonnements/entitlements, et une console interne `usage-ops` pour surveiller la consommation IA et stockage. Sektor expose une **surface fonctionnelle très large** — treize domaines backend (chantiers, études, achats, stock, ventes, finance, marchés, RH, HSE, partenaires, etc.) et une UI Angular connectée en HTTP, déployable en staging et en production sur un VPS. L’investissement sur les **études de prix** (bibliothèque d’ouvrages, dossiers, extraction de bordereaux) et sur un compagnon **Build Intelligence** montre une thèse claire : la connaissance BTP et les documents sont un levier de différenciation. Marketing et doctrine interne parlent d’une plateforme multi-verticales (« un moteur, une infinité de produits »).

**Ce qui ne l’est pas encore.** La largeur ne doit pas être confondue avec la profondeur. Les trackers internes montrent l’essentiel des tâches d’intégration encore « partielles ». Un walkthrough chantier a mis en évidence des **trous structurels** sur le fil roi (liaison marché, valorisation des lots) qui empêchent de démontrer proprement chantier → situation → facture → encaissement. Beaucoup d’intégrations « Maroc » (banque, DGI, CNSS) et d’exports PDF restent stubs. L’IA agentique est au niveau assistance / perception partielle, pas au niveau automatisation métier sous garde-fous. L’onboarding de reprise des données historiques est **spécifié mais non branché** : aujourd’hui l’entrée se fait surtout par questionnaire, pas par import guidé des fichiers clients. En résumé : **excellent pour une démonstration modulable et un dialogue partenaire** ; **pas encore un pilote autonome sans cadrage de périmètre et sans fermeture du parcours choisi**.

**Plateforme vs Sektor — le point stratégique.** La doctrine dit « pas de métier dans la plateforme ». Or le repository montre déjà des **fuites BTP** dans le socle : catalogues de rôles `BTP_*` dans les modules d’autorisation/IAM partagés, graines documentaires BTP dans l’extracteur, libellés « ERP » dans les notifications. Sektor consomme presque toute la plateforme ; les autres produits (Build Intelligence, Usage Ops, Venue Catalog) n’en prennent qu’une partie ; Layali/Beauty sont des prototypes mobiles ; Blanner est une app substantielle mais **hors** du modèle plateforme. `shared/business` — prévu pour le métier vraiment partagé — est **vide**. Autrement dit : Nafora a l’architecture d’une plateforme multi-produits, mais **l’économie réelle du code est encore celle d’un ERP BTP + socle technique**. C’est gérable, à condition de ne pas se raconter que Finance/Retail/Logistics sont déjà des options industrielles.

**Risques à traiter ensemble.** (1) Sur-construire la plateforme générique avant d’avoir un V1 Sektor vendable. (2) Sur-spécialiser le socle au BTP au point de rendre le multi-vertical coûteux. (3) Diluer l’attention sur trop de produits (nightlife, beauty, social, studios) pendant que le fil roi ERP n’est pas scellé. (4) Promesse marketing (« production », « déjà au service du secteur ») potentiellement en avance sur la maturité des parcours. (5) Coûts LLM sans hard limits. (6) Surfaces de secrets à assainir. (7) Dette documentaire qui peut fausser les arbitrages.

**Questions à trancher (humainement).** Qui est exactement l’acheteur et quelle taille d’entreprise ? Quel est le **premier workflow vendu** — et donc le périmètre V1 à défendre sans pitié ? Qu’est-ce qui doit rester ADN BTP, et qu’est-ce qui doit devenir brique Nafora réutilisable ? L’IA est-elle le différenciateur de la première vente ou le lot 2 après la clôture du fil roi ? Comment facturer (ERP, tokens, on-prem, services) ? Quelle priorité réelle Sektor vs le reste du portefeuille ? Jusqu’où le partenaire métier oriente-t-il le backlog ?

**Recommandation de posture pour les prochaines semaines.** Traiter Sektor comme un **produit de preuve** de la plateforme, pas comme la preuve que la plateforme est déjà multi-marchés. Choisir un parcours V1, le rendre impeccable en démo et en pilote, brancher la reprise de données sur l’existant smart-import, aligner le discours externe sur l’état réel, et documenter explicitement la frontière plateforme/produit. Le reste du monorepo peut rester en incubation — à condition que cette incubation soit **nommée et bornée**, pas financée par défaut via la complexité du repo.

En une phrase : **Nafora possède un socle technique sérieux et un ERP BTP large et démontrable ; la bataille immédiate n’est plus d’ajouter des modules, c’est de choisir le récit de valeur, fermer un parcours métier bout-en-bout, et décider ce qui est plateforme versus ce qui est Sektor — avant que la promesse multi-verticale et la réalité mono-métier ne divergent trop aux yeux du marché.**
)
