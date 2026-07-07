# ERP Backend Integration Roadmap — Tasks for Agents

> **Goal :** remplacer **tous les mocks** du frontend ERP (`web/app/applications/erp/`) par des APIs Spring Boot réelles, **module par module**, en gardant **exactement la même séparation modulaire** que le frontend.
>
> **Source d'analyse :** `web/migration_plan.md` + audit codebase Round 2 (`docs/specs/erp-audit-round-2-roadmap/`).
>
> **Décision produit :** **pas de générateur** — chaque entité, contrôleur, service, mapper, repository et migration est **écrit à la main** sur le socle existant (`CrudController`, `JpaCrudService`, `TenantScopedRepository`, `FeatureApiService` côté Angular).
>
> **Périmètre :** 13 modules sidebar ERP — un dossier `backend/domains/<module>/` par module métier, sauf agrégats (dashboard/analytics/pilotage) qui restent des read models exposés par leurs domaines sources.

---

## Pourquoi ce dossier

Le frontend a déjà été audité (Round 1 et Round 2) et roadmappé feature par feature. **Ce qui manque, c'est la finalisation backend.**

État réel constaté :

- **40** fichiers `*-api.service.ts` côté Angular sous `web/app/applications/erp/pages/**`.
- **28** d'entre eux importent encore un `*MockService` et redirigent toutes leurs méthodes CRUD vers ce mock, malgré un `basePath: '/api/v1/...'` déclaré.
- **12** services s'appuient sur le comportement HTTP par défaut de `FeatureApiService` — mais les endpoints backend correspondants **n'existent pas** sauf pour `item`, `stock` et `currency`.
- **77 fichiers** au moins (pages, facades, composants) injectent directement un mock service (`AchatsMockService`, `VentesMockService`, `ChantiersMockService`, `RhMockService`, `HseMockService`, `MarchesMockService`, `EtudesMockService`, `InventoryMockService`, `FinanceComptabiliteMockService`, etc.).
- **Backend actuel :** un seul shell Spring Boot (`backend/applications/erp/`) + 3 domaines opérationnels (`backend/domains/{item,stock,currency}`). Tous les autres modules métier sont **inexistants côté backend**.

Conséquence : la migration n'est **pas** un simple "câblage HTTP". Elle implique de **créer 8 nouveaux domaines backend** (achats, ventes, chantiers, etudes, rh, hse, marches, approbations) et **plusieurs domaines partagés** (partner pour clients/fournisseurs), tout en gardant la même découpe que le frontend.

---

## Comment lire ce dossier

1. **Lire `00-ARCHITECTURE.md`** — patterns de code obligatoires (socle, package layout, contrats API, multi-tenant).
2. **Lire `00-PRIORITIES.md`** — vagues d'attaque (Wave 0 → Wave 5) et dépendances entre modules.
3. **Lire `00-MOCK-INVENTORY.md`** — recensement exhaustif des `*MockService` et des fichiers qui les injectent, par module.
4. **Choisir un fichier de tâche** (`01-*.md` à `12-*.md`) — un fichier par module métier, **aligné 1-pour-1 sur la sidebar frontend**.
5. Chaque fichier suit le format :
   - `## Findings traités` — refs vers `migration_plan.md` (classes A/B/C/D) + état mock courant
   - `## Goal` — l'objectif d'intégration backend
   - `## Source-of-truth frontend` — chemins exacts des `*-api.service.ts` à brancher
   - `## Cible backend` — `backend/domains/<name>/` à créer + entités
   - `## Tasks` — liste numérotée (B-XX-NN), chaque tâche a fichiers à créer + acceptance criteria
   - `## Frontend cleanup` — désinjection des `*MockService` à faire en parallèle
   - `## Testing` — JUnit côté backend + e2e Angular
   - `## Dependencies` — tâches pré-requises
6. **Marquer `[x]`** dans le tableau ci-dessous quand la tâche est mergée.
7. **Mettre à jour `00-PROGRESS.md`** (statut + evidence + date + agent).
8. **Copier-coller le prompt** correspondant depuis `AGENT_PROMPTS_PER_TASK.md` pour démarrer une session agent.

---

## Mapping module frontend → module backend

| Sidebar frontend | Dossier `web/app/applications/erp/` | Backend cible | Fichier roadmap |
|---|---|---|---|
| Inventory / Stock | `inventory/`, `pages/inventory/` | `backend/domains/{item,stock}` (+ enrichissements) | [02-inventory.md](02-inventory.md) |
| Finance & Trésorerie | `finance/`, `pages/finance/` | `backend/domains/{currency,finance}` | [03-finance.md](03-finance.md) |
| Achats & Sous-traitance | `achats/`, `pages/achats/` | `backend/domains/achats` (+ `partner`) | [04-achats.md](04-achats.md) |
| Ventes & Facturation | `ventes/`, `pages/ventes/` | `backend/domains/ventes` (+ `partner`) | [05-ventes.md](05-ventes.md) |
| Chantiers | `chantiers/`, `pages/chantiers/` | `backend/domains/chantiers` | [06-chantiers.md](06-chantiers.md) |
| Études & Soumissions | `etudes/`, `pages/etudes/` | `backend/domains/etudes` | [07-etudes.md](07-etudes.md) |
| Ressources Humaines | `rh/`, `pages/rh/` | `backend/domains/rh` | [08-rh.md](08-rh.md) |
| Qualité & HSE | `hse/`, `pages/hse/` | `backend/domains/hse` | [09-hse.md](09-hse.md) |
| Marchés BTP | `marches/`, `pages/marches/` | `backend/domains/marches` | [10-marches.md](10-marches.md) |
| Approbations | `approbations/`, `pages/approbations/` | `backend/domains/approbations` | [11-approbations.md](11-approbations.md) |
| Dashboard / Analytics / Pilotage | `pages/dashboard/`, `pages/analytics/`, `pages/pilotage*/` | Read endpoints dédiés dans les domaines sources | [12-dashboard-analytics.md](12-dashboard-analytics.md) |

**Règle d'or :** un dossier `pages/<module>/` côté Angular ↔ un dossier `backend/domains/<module>/` côté Spring. Les agrégats (dashboard/analytics/pilotage) **ne sont pas un domaine** — ils sont des read models exposés par les domaines qui possèdent la donnée source.

---

## Tableau récapitulatif des tâches backend (B-XX-NN)

### Wave 0 — Shared Foundation (`01-shared-foundation.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [~] | B-FND-01 | Stabilisation `item` / `stock` / `currency` — contrats HTTP alignés avec le frontend | P0 |
| [~] | B-FND-02 | Domaine `partner` (clients + fournisseurs + MOA + sous-traitants) | P0 |
| [~] | B-FND-03 | Endpoints `/lookup` standardisés pour toutes les référentiels | P0 |
| [x] | B-FND-04 | Enregistrer 8 nouveaux domaines dans `erp.application.json` | P0 |
| [x] | B-FND-05 | Conventions multi-tenant + permissions ERP module-par-module | P0 |

### Wave 1 — Inventory (`02-inventory.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [~] | B-INV-01 | Articles BTP, catégories, types, UoM — désinjection `InventoryMockService` côté Angular | P0 |
| [~] | B-INV-02 | Dépôts (warehouses) — CRUD complet | P0 |
| [ ] | B-INV-03 | Stock balances (lookup + agrégat par article × dépôt) | P0 |
| [ ] | B-INV-04 | Mouvements stock (entrées/sorties/transferts/inventaire) — CRUD + transition VALIDER | P1 |
| [ ] | B-INV-05 | Réservations stock chantier (lien `chantierId`) | P1 |
| [ ] | B-INV-06 | Magasin chantier digital — read model par chantier | P1 |
| [ ] | B-INV-07 | Matériel & équipements (engins, affectations) | P1 |

### Wave 1 — Finance (`03-finance.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-FIN-01 | Devises + taux change — purge des doublons écrans | P0 |
| [ ] | B-FIN-02 | Conditions de paiement, modes règlement | P0 |
| [ ] | B-FIN-03 | Plan comptable + journaux comptables | P1 |
| [ ] | B-FIN-04 | Règlements clients + fournisseurs (CRUD) | P1 |
| [ ] | B-FIN-05 | Lettrage écritures 411/401 (custom endpoint) | P1 |
| [ ] | B-FIN-06 | Rapprochement bancaire (import OFX/CSV) | P1 |
| [ ] | B-FIN-07 | Effets de commerce, virements multi-banques | P1 |
| [ ] | B-FIN-08 | Caisses chantier (mouvements + valorisation) | P1 |

### Wave 2 — Achats (`04-achats.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-ACH-01 | Demandes d'achat (DA) — CRUD + transitions SUBMIT/APPROVE/REJECT/CONVERT | P0 |
| [ ] | B-ACH-02 | Appels d'offres achat (AO) + lignes + offres fournisseurs | P0 |
| [ ] | B-ACH-03 | Bons de commande achat (BC) + lignes + réceptions | P0 |
| [ ] | B-ACH-04 | Contrats fournisseurs + sous-traitance Art. 187 CGI | P1 |
| [ ] | B-ACH-05 | Catalogue articles fournisseur (prix négociés) | P1 |
| [ ] | B-ACH-06 | Attestations légales (CNSS, fiscale, AMO…) — workflow validité | P1 |
| [ ] | B-ACH-07 | 3-way matching BC ↔ BL ↔ Facture fournisseur | P1 |

### Wave 2 — Ventes (`05-ventes.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-VEN-01 | Clients (segment + agrément MOA) | P0 |
| [ ] | B-VEN-02 | Offres commerciales — CRUD + transitions SUBMIT/ACCEPT/REJECT/CONVERT | P0 |
| [ ] | B-VEN-03 | Bons de commande clients (BCC) | P0 |
| [ ] | B-VEN-04 | Factures clients (vente + situation) — calculs HT/TVA/TTC/RG/RAS server-side | P0 |
| [ ] | B-VEN-05 | Avoirs (notes de crédit) | P1 |
| [ ] | B-VEN-06 | Retenues de garantie (suivi cumul + restitution) | P1 |

### Wave 3 — Chantiers (`06-chantiers.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-CHA-01 | Aggregate `Chantier` — CRUD + status workflow | P0 |
| [ ] | B-CHA-02 | Lots / phases / postes budgétaires | P0 |
| [ ] | B-CHA-03 | Budget chantier (prévisionnel + révisé + réalisé) | P0 |
| [ ] | B-CHA-04 | Avancements physiques (saisie mobile) | P1 |
| [ ] | B-CHA-05 | Situations de travaux (CRUD + génération depuis avancements) | P1 |
| [ ] | B-CHA-06 | Sous-traitance chantier (lien `partner` + contrats) | P1 |
| [ ] | B-CHA-07 | Documents chantier + journal + attachements (e-signature) | P1 |
| [ ] | B-CHA-08 | Photos géolocalisées (lat/lng/EXIF) | P1 |
| [ ] | B-CHA-09 | Read model `ChantierSummary` (KPIs budget/avancement) | P1 |
| [ ] | B-CHA-10 | Désinjection `ChantiersMockService` des pages listing/detail | P0 |

### Wave 3 — Études (`07-etudes.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-ETU-01 | Bibliothèque prix + ouvrages (catalogue) | P0 |
| [ ] | B-ETU-02 | Métrés (CRUD + lignes) | P0 |
| [ ] | B-ETU-03 | DPGF (hiérarchie LOT > SOUS_LOT > ARTICLE) | P0 |
| [ ] | B-ETU-04 | DPU (Décomposition Prix Unitaire) + composants | P1 |
| [ ] | B-ETU-05 | Appels d'offres clients (AOC) | P1 |
| [ ] | B-ETU-06 | Devis (génération depuis DPGF, versioning, calculs server-side) | P0 |

### Wave 4 — RH (`08-rh.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-RH-01 | Employés (matricule, CNSS, AMO, IF, contrat) | P0 |
| [ ] | B-RH-02 | Pointage chantier (batch day-entry + multi-pointage équipe) | P0 |
| [ ] | B-RH-03 | Congés (solde + demandes + workflow) | P1 |
| [ ] | B-RH-04 | Planning équipes (read model) | P1 |
| [ ] | B-RH-05 | Fiches de paie (génération + storage) | P1 |
| [ ] | B-RH-06 | Heures supplémentaires (HS25/50/100) | P1 |
| [ ] | B-RH-07 | Frais déplacement | P1 |
| [ ] | B-RH-08 | Contrats employés + habilitations (CACES, SST…) | P1 |

### Wave 4 — HSE (`09-hse.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-HSE-01 | Incidents / accidents — CRUD + transition CLOTURE + déclaration CNSS DAT | P0 |
| [ ] | B-HSE-02 | Non-conformités + CAPA | P0 |
| [ ] | B-HSE-03 | Inspections + audits HSE | P0 |
| [ ] | B-HSE-04 | Formations HSE | P1 |
| [ ] | B-HSE-05 | EPI dotation + renouvellement | P1 |
| [ ] | B-HSE-06 | PPSPS + PHS (documents par chantier / société) | P1 |
| [ ] | B-HSE-07 | Visites médicales | P1 |
| [ ] | B-HSE-08 | Registres légaux | P1 |
| [ ] | B-HSE-09 | DUER (Document Unique) | P1 |
| [ ] | B-HSE-10 | Read model `HseKpi` (TF1/TF2/TG/Bird) | P1 |

### Wave 5 — Marchés (`10-marches.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-MAR-01 | Contrats marché (master + lignes BPU/PUF/PGF) | P0 |
| [ ] | B-MAR-02 | Avenants (workflow signature + propagation impact) | P1 |
| [ ] | B-MAR-03 | Cautions bancaires (provisoire/définitive/RG + workflow) | P1 |
| [ ] | B-MAR-04 | Factures marché (situations rattachées + DGD) | P1 |
| [ ] | B-MAR-05 | Révisions de prix (formule K + indices BTP) | P1 |
| [ ] | B-MAR-06 | Pénalités (calcul + suivi) | P1 |
| [ ] | B-MAR-07 | Ordres de service (OS) | P1 |
| [ ] | B-MAR-08 | Réceptions provisoire / définitive | P1 |

### Wave 5 — Approbations + Dashboard (`11-approbations.md`, `12-dashboard-analytics.md`)
| ✓ | ID | Tâche | Priorité |
|---|---|---|---|
| [ ] | B-APR-01 | Approval workflow engine (entity-agnostic) | P0 |
| [ ] | B-APR-02 | Approval request + events + audit chain hash | P0 |
| [ ] | B-APR-03 | Délégation + escalade SLA | P1 |
| [ ] | B-APR-04 | Matrice pouvoirs configurable | P1 |
| [ ] | B-DSH-01 | Read model `DashboardKpi` (CA, marges, alertes…) | P1 |
| [ ] | B-DSH-02 | Read model `AnalyticsBucket` (multi-axes) | P1 |
| [ ] | B-DSH-03 | Read model `CashFlowProjection` (dynamique vs linéaire) | P1 |

> **Légende** : `[x]` = mergé · `[~]` = partiel · `[ ]` = à faire
> **Total tâches initiales** : 0 ✅ / 0 🟡 / **78 ❌**

---

## Graphe d'attaque (résumé)

```
Wave 0 — Shared foundation
    └─ B-FND-01 (item/stock/currency stabilisation)
    └─ B-FND-02 (partner clients/fournisseurs)
    └─ B-FND-04 (app spec ERP enrichi)
    └─ B-FND-05 (RBAC + multi-tenant)

Wave 1 — Modules réf + opérationnels prêts
    ├─ Inventory (02)  →  remplace InventoryMockService
    └─ Finance   (03)  →  remplace FinanceConfigMockService + FinanceComptabiliteMockService
                              │
                              ▼
Wave 2 — Commerce
    ├─ Achats (04) →  remplace AchatsMockService           (dépend de partner + item)
    └─ Ventes (05) →  remplace VentesMockService           (dépend de partner + item + currency)
                              │
                              ▼
Wave 3 — Projets
    ├─ Chantiers (06) →  remplace ChantiersMockService     (consomme partner + ventes + achats)
    └─ Études    (07) →  remplace EtudesMockService        (consomme item + chantiers)
                              │
                              ▼
Wave 4 — Personnes + conformité
    ├─ RH  (08) →  remplace RhMockService + PointageMockService  (consomme chantiers)
    └─ HSE (09) →  remplace HseMockService + HseExtendedMockService (consomme chantiers + rh)
                              │
                              ▼
Wave 5 — Contrats + agrégats
    ├─ Marchés      (10) →  remplace MarchesMockService    (consomme chantiers + ventes)
    ├─ Approbations (11) →  remplace ApprobationsMockService (consomme TOUS les modules)
    └─ Dashboard    (12) →  remplace dependency directe aux mocks dans pages/dashboard et pages/analytics
```

**Règle :** un module ne peut pas démarrer si tous ses pré-requis (Wave précédente) ne sont pas en `[x]` ou au moins `[~]` (contrats API stables).

---

## Conventions transverses (rappel — détail dans `00-ARCHITECTURE.md`)

- **Pas de générateur.** Chaque entité, contrôleur, service, mapper, repository, migration Liquibase et DTO est **écrit manuellement** en suivant le pattern des domaines `item` / `stock` / `currency`.
- **Socle obligatoire :** `extends CrudController`, `extends JpaCrudService`, `extends TenantScopedRepository`. Endpoints custom seulement pour transitions de statut, agrégats, lookups spéciaux.
- **Package layout :** `backend/domains/<module>/src/main/java/ma/nafura/<module>/{api/controller,api/request,domain/model,mapper,repository,service}/`.
- **Routes API :** `/api/v1/<module>/<entity>` côté backend, alignées avec `basePath` des `*-api.service.ts` côté Angular.
- **Multi-tenant :** champ `tenant_id` obligatoire, filtrage automatique via `TenantScopedRepository`.
- **Pagination :** Spring `Page<T>` natif (le frontend `FeatureApiService` sait déjà normaliser `content` / `totalElements`).
- **Pas de logique métier dans le contrôleur.** Tout va dans le service custom (`XxxService` extends `XxxServiceBase`).
- **Calculs critiques server-side :** totaux HT/TVA/TTC, marges, statuts dérivés, K (révision prix), DGD, scoring AO, lettrage. Le frontend **lit**, il ne calcule plus.
- **Désinjection mock progressive :** une tâche n'est `[x]` que si **aucune page / facade / composant** du module n'injecte plus son `*MockService`.

---

## Anti-patterns à éviter

- ❌ Recréer un générateur "léger" pour aller plus vite — **non**, on écrit chaque classe à la main. C'est l'occasion de faire du code propre, pas de re-générer du code médiocre.
- ❌ Mettre la logique métier dans le contrôleur (`@PostMapping` qui valide / calcule / persiste).
- ❌ Ouvrir un endpoint custom là où une lookup générique suffit (`/api/v1/<entity>/lookup`).
- ❌ Considérer le dashboard / analytics comme un domaine backend. Ce sont des **read endpoints exposés par les domaines sources**.
- ❌ Migrer un seul `*-api.service.ts` du module sans désinjecter le mock des autres pages du même module → on garde un état hybride mock/réel qui casse les facades.
- ❌ Démarrer un module en Wave N avant que les pré-requis de Wave N-1 soient stables (cf. graphe).
- ❌ Toucher au frontend UX/UI pendant la migration. **Cette roadmap ne change rien à l'UX** — elle ne remplace que la couche persistance.

---

## Mise à jour du fichier

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | — | Création initiale — 78 tâches backend dérivées de `migration_plan.md` + audit codebase. |
