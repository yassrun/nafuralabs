# Progress tracker — Backend Integration

> Suivi unique pour les 78 tâches `B-XX-NN`. **Mettre à jour à chaque PR mergée** (statut + colonne evidence + date + agent).
>
> **Source de vérité :** ce fichier — pas la roadmap, ni les fichiers de tâche, ni Git.

---

## Légende statut

| Statut | Sens | Critère |
|---|---|---|
| `[ ]` | À faire | rien de commencé |
| `[~]` | Partiel | code mergé mais reste désinjection mock OU tests OU registration spec OU permissions |
| `[x]` | Fait | toutes les 15 cases de la "Définition de Done" (`00-ARCHITECTURE.md` §10) sont cochées |

---

## Wave 0 — Shared Foundation

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-FND-01 | Stabilisation `item` / `stock` / `currency` | 2026-05-27 | agent | Seeds demo SQL item/stock/currency (tenant nafura) ; paths Class A alignés ; lookup materiel `item-categories` |
| [~] | B-FND-02 | Domaine `partner` (clients + fournisseurs + MOA + ST) | 2026-05-15 | agent | `backend/domains/partner/` CRUD + roles + migrations + seeds ; `./gradlew :domains:partner:build` |
| [~] | B-FND-03 | Endpoints `/lookup` standardisés | 2026-05-15 | agent | Socle `CrudController` ; tests `IceValidationTest` ; audit facades frontend restant |
| [x] | B-FND-04 | Enregistrer 8 domaines dans `erp.application.json` | 2026-05-15 | agent | `naf/src/spec/applications/erp/erp.application.json` + `generate-backend.mjs erp` |
| [x] | B-FND-05 | Multi-tenant + permissions ERP + roleTemplates | 2026-05-15 | agent | 4 roleTemplates BTP + permissions `partner.*` … `approbations.*` dans ADMIN/MANAGER |

**Sous-total :** 2 ✅ / 3 🟡 / 0 ❌ — *recalculé 2026-05-27*

---

## Wave 1 — Inventory

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-INV-01 | Articles BTP + désinjection `InventoryMockService` | 2026-05-15 | agent | Item BTP + `/api/v1/items` ; config familles/types/UoM HTTP ; mock reste CRUD mouvements |
| [~] | B-INV-02 | Dépôts (warehouses) | 2026-05-15 | agent | `LocationsApiService` + `location-config.facade` → `/api/v1/locations` |
| [~] | B-INV-03 | Stock balances (lookup + agrégat) | 2026-05-27 | agent | `StockBalanceEnrichmentService` ; valorisation + alertes réappro HTTP (stock-balances + articles + locations) ; état-stock + inventaire/transfert editors |
| [~] | B-INV-04 | Mouvements stock + transition VALIDER | 2026-05-27 | agent | `movement_motifs` + `/api/v1/motifs?txType=` ; `MotifsApiService` ; sortie/transfert/perte/retour/motif-config HTTP ; `inventory-tx.facade` article lookup reste mock ; reverse validé non supporté |
| [~] | B-INV-05 | Réservations stock chantier | 2026-05-15 | agent | `stock_reservations` CRUD + `/release` + FIFO on SORTIE validate + expiration job ; `ReservationStockService` HTTP |
| [~] | B-INV-06 | Magasin chantier digital (read model) | 2026-05-15 | agent | `GET /api/v1/chantiers/{id}/magasin` ; `MagasinChantierReadService` ; page HTTP ; résolution id/code/budget ; `./gradlew :domains:stock:build` |
| [~] | B-INV-07 | Matériel & équipements | 2026-05-29 | agent | `materiels` + `materiel-affectations` CRUD ; **14 pages GMAO → `MaterielGmaoFacadeService`** (affectations HTTP, OT/carburant vides) ; catalogue/fiche-360 HTTP |

**Sous-total :** 0 ✅ / 7 🟡 / 0 ❌ — *recalculé 2026-05-27*

---

## Wave 1 — Finance

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-FIN-01 | Devises + taux change | 2026-05-29 | agent | `/api/v1/currencies` + `exchange-rates` HTTP ; `taux-change.facade` sans `FinanceConfigMockService` ; BAM import stub API |
| [~] | B-FIN-02 | Conditions paiement + modes règlement | 2026-05-15 | agent | `payment-terms` BTP + installments ; domaine `finance` + `payment-modes` CRUD/lookup ; `condition-paiement-api` HTTP ; `./gradlew :domains:currency:build :domains:finance:build` |
| [~] | B-FIN-03 | Plan comptable + journaux | 2026-05-15 | agent | `chart-of-accounts`, `journals`, `journal-entries` (+ `/post`), `balance` ; seed CGNC 116 comptes + 8 journaux ; `JournalEntryEquilibreTest` + `BalanceComptableTest` ; journaux (4 pages) + `plan-comptable.facade` + `balance.page` HTTP ; axes analytiques balance reste mock |
| [~] | B-FIN-04 | Règlements clients + fournisseurs | 2026-05-27 | agent | CRUD + comptes bank ; contre-parties partners ; factures ouvertes HTTP (`FacturesOuvertesService`) |
| [~] | B-FIN-05 | Lettrage écritures | 2026-05-15 | agent | `lettrages` + `lettrage_lines` ; CRUD lettrage + codes AAA/AAB ; `non-lettrees` depuis écritures POSTE ; `auto-match` + `DELETE /{code}` + `export.csv` ; `LettrageServiceTest` ; `lettrage.page` HTTP |
| [~] | B-FIN-06 | Rapprochement bancaire | 2026-05-27 | agent | import/match HTTP ; `createMvtFromReleve` → `TreasuryJournalEntryService` (écriture BQ POST) |
| [~] | B-FIN-07 | Effets de commerce + virements | 2026-05-15 | agent | `trade_effects` + `virements`/`virement_lines` ; effets CRUD + workflows remise/escompte/impayé ; virements INTERNE + REMISE ; `generate-xml` AWB/BMCE/CIH/BP/SEPA ; `VirementXmlGeneratorTest` ; effets + virements (3 pages) HTTP ; factures fournisseurs remise restent mock compta |
| [~] | B-FIN-08 | Caisses chantier | 2026-05-27 | agent | caisses HTTP ; `POST …/valider` branché UI ; banques movement-candidates |

**Sous-total :** 0 ✅ / 8 🟡 / 0 ❌

---

## Wave 2 — Achats

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-ACH-01 | Demandes d'achat + transitions | 2026-05-27 | agent | CRUD + `POST …/submit|approve|reject|convert-to-ao` ; facade transitions HTTP ; DoD e2e/permissions restent |
| [~] | B-ACH-02 | Appels d'offres achat + offres fournisseurs | 2026-05-27 | agent | CRUD + workflow + `attribuer`→BC ; `GET …/comparatif` + `POST …/scoring/recompute` ; `ao-comparatif` HTTP ; DoD e2e reste |
| [~] | B-ACH-03 | Bons de commande achat + réceptions | 2026-05-29 | agent | CRUD + réceptions → stock RECEPTION ; UI saisie réception BC ; `POST …/close` ; 3-way matching HTTP (`GET …/matching/by-bc/{bcId}` + fallback client via bc-api réceptions) |
| [~] | B-ACH-04 | Contrats fournisseurs + Art. 187 | 2026-05-27 | agent | `/api/v1/contrats-fournisseur` CRUD + sign/terminate ; `contrat-api` HTTP ; situations ST restent |
| [~] | B-ACH-05 | Catalogue articles fournisseur | 2026-05-27 | agent | `/api/v1/catalogue-fournisseur` CRUD ; onglet Catalogue fiche fournisseur (CRUD inline) |
| [~] | B-ACH-06 | Attestations légales (workflow validité) | 2026-05-27 | agent | `/api/v1/attestations-fournisseur` + job statuts + blocage CNSS/FISCALE ; onglet Attestations (8 chips + CRUD) |
| [~] | B-ACH-07 | 3-way matching BC ↔ BL ↔ FF | 2026-05-27 | agent | FF + matching + litige/annuler + **`comptabiliser`→écriture AC** HTTP |

**Sous-total :** 0 ✅ / 7 🟡 / 0 ❌

---

## Wave 2 — Ventes

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-VEN-01 | Clients (segment + agrément MOA) | 2026-05-27 | agent | `client-api` + `fournisseur-api` → `/api/v1/partners?role=` ; `partner-commerce.mapper` ; segment MOA/agrément restent à faire |
| [~] | B-VEN-02 | Offres commerciales + transitions | 2026-05-27 | agent | CRUD + workflow + `POST …/convert-to-bcc` ; chantiers via `LocationsApiService` ; UI convert reste |
| [~] | B-VEN-03 | Bons de commande clients | 2026-05-27 | agent | CRUD + `confirm`/`convert-to-facture` ; clients + chantiers HTTP ; DoD e2e reste |
| [~] | B-VEN-04 | Factures clients (calculs HT/TVA/TTC/RG/RAS server-side) | 2026-05-27 | agent | CRUD HTTP ; RG/RAS/netAPayer server-side ; **encaissements HTTP** (`encaissements_client` + recalc statut payé) |
| [~] | B-VEN-05 | Avoirs | 2026-05-27 | agent | CRUD `/api/v1/avoirs-client` ; `avoir.facade` HTTP ; workflow emit/imputer reste update status |
| [~] | B-VEN-06 | Retenues de garantie | 2026-05-27 | agent | `/api/v1/retenues-garantie` + restituer/synthese ; `retenues-garantie.facade` HTTP |

**Sous-total :** 0 ✅ / 6 🟡 / 0 ❌

---

## Wave 3 — Chantiers

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-CHA-01 | Aggregate `Chantier` + status | 2026-05-27 | agent | CRUD + workflow ; listing/detail/create HTTP |
| [~] | B-CHA-02 | Lots / phases / postes budgétaires | 2026-05-29 | agent | `GET/POST …/lots`, `GET/POST …/phases`, `GET/POST/PUT …/postes-budgetaires` + seeds ; onglets Lots + Phases HTTP |
| [~] | B-CHA-03 | Budget chantier (prévi / révisé / réalisé) | 2026-05-27 | agent | `GET/POST …/budget` skeleton ; listing/detail HTTP ; réalisation/marges restent |
| [~] | B-CHA-04 | Avancements physiques | 2026-05-27 | agent | `007_create_avancements_physiques` ; CRUD + `PUT/valider/dernier` ; `avancement-api` HTTP |
| [~] | B-CHA-05 | Situations + génération depuis avancements | 2026-05-27 | agent | generate/submit/accept-moa/**convert-to-facture réel** (port ventes) ; reject/payée HTTP ; `SituationGenerationServiceTest` |
| [~] | B-CHA-06 | Sous-traitance chantier | 2026-05-27 | agent | `GET/POST …/sous-traitances` + synthese via `ContratFournisseur` ST ; listing HTTP ; seeds demo |
| [~] | B-CHA-07 | Documents + journal + attachements | 2026-05-27 | agent | `009/010` migrations ; CRUD documents/journal/attachements ; e-sign stub `/sign/{token}` ; listing + saisie HTTP |
| [~] | B-CHA-08 | Photos géolocalisées | 2026-05-29 | agent | `011/012` migrations ; `GET/POST …/photos`, `DELETE/GET …/photos/{id}/url` ; seeds ch-001 ; `photo-chantier-api` |
| [~] | B-CHA-09 | Read model `ChantierSummary` | 2026-05-27 | agent | `GET …/summary` ; openSituationsCount réel ; fiche détail + drilldown HTTP |
| [~] | B-CHA-10 | Désinjection `ChantiersMockService` | 2026-05-29 | agent | drilldown/dashboard/create/situations/pilotage HTTP ; **`PlanningMockFacade` → chantier/lot/phase APIs** ; mock reste avancement/sous-traitance/attachements |

**Sous-total :** 0 ✅ / 11 🟡 / 0 ❌

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-ETU-01 | Bibliothèque prix + ouvrages | 2026-05-29 | agent | DoD 14/15 — `OuvrageServiceTest` (8) ; `etudes-ouvrages-flow.spec.ts` ; zero mock pages ; bootRun bloqué si Postgres down (fix JPA `ErpApprovalRequest` OK) |
| [~] | B-ETU-02 | Métrés | 2026-05-27 | agent | `002_create_metres` ; CRUD + lignes ; 3 métrés seed ; `metre-api` HTTP |
| [~] | B-ETU-03 | DPGF (LOT > SOUS_LOT > ARTICLE) | 2026-05-27 | agent | `003_create_dpgf` ; generate fromMetreId ; arbre/totaux/noeuds ; `DpgfAgregationServiceTest` ; `dpgf-api` + metre-dpgf HTTP |
| [~] | B-ETU-04 | DPU + composants | 2026-05-29 | agent | `004_create_dpu` ; CRUD + composants/recompute/versions ; `DPUCalculatorTest` ; `dpu-api` + ouvrage detail HTTP |
| [~] | B-ETU-05 | Appels d'offres clients | 2026-05-27 | agent | `005_create_aoc` ; CRUD + workflow + convert-to-chantier stub ; dual path `/aoc` + `/appels-offres-clients` ; `aoc-api` HTTP |
| [~] | B-ETU-06 | Devis (génération DPGF, versioning) | 2026-05-27 | agent | `006_create_devis` ; from-dpgf ; `DevisGenerationServiceTest` ; submit/marquer-gagne stubs ; `devis-api` HTTP |

**Sous-total :** 0 ✅ / 6 🟡 / 0 ❌

---

## Wave 4 — RH

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-RH-01 | Employés | 2026-05-29 | agent | DoD 14/15 — `001_create_employes` ; CRUD `/api/v1/rh/employes` ; `EmployeServiceTest` (7) ; `rh-employes-flow.spec.ts` ; `employe-api` pure HTTP ; bootRun si Postgres up |
| [~] | B-RH-02 | Pointage chantier (batch + multi-pointage) | 2026-05-29 | agent | batches idempotents ; listing/validation HTTP ; **`PointageSaisieService`** (planning+affectations API, sync `POST …/pointage-batches`, offline queue) |
| [~] | B-RH-03 | Congés (solde + workflow) | 2026-05-27 | agent | `003_create_conges` ; submit/approve/reject ; `conge-api` HTTP ; job solde mensuel reste |
| [~] | B-RH-04 | Planning équipes (read model) | 2026-05-27 | agent | `GET /api/v1/rh/planning` ; agrégat pointages+congés ; `planning-api` + page HTTP |
| [~] | B-RH-05 | Fiches de paie | 2026-05-29 | agent | `paie-api` HTTP ; **journal + DAMANCOM + état 9421 sans `RhMockService`** ; PDF stub 501 |
| [~] | B-RH-06 | Heures supplémentaires | 2026-05-27 | agent | `005_create_heures_sup` ; list/create/valider/synthese ; barèmes HS25/50/100 ; `heures-sup-api` |
| [~] | B-RH-07 | Frais déplacement | 2026-05-27 | agent | `006_create_frais_deplacement` ; workflow submit/approve/reject ; integrer-paie stub ; `frais-deplacement-api` |
| [~] | B-RH-08 | Contrats + habilitations | 2026-05-27 | agent | `007_contrats_habilitations` ; contrats/habilitations/formations CRUD ; sign-canvas stub ; employe changeStatut HTTP |

**Sous-total :** 0 ✅ / 8 🟡 / 0 ❌

---

## Wave 4 — HSE

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-HSE-01 | Incidents + CNSS DAT | 2026-05-27 | agent | `001_create_incidents` ; CRUD + investiguer/clore ; declarer-cnss-dat stub ; `incident-api` HTTP ; 2 seeds |
| [~] | B-HSE-02 | Non-conformités + CAPA | 2026-05-27 | agent | `002_create_non_conformites` ; workflow NC + CAPA ; `NcWorkflowTest` ; `nc-api` HTTP |
| [~] | B-HSE-03 | Inspections + audits | 2026-05-29 | agent | `003_create_inspections_audits` ; CRUD inspections + audits/lignes/cloturer stub + audit-templates ; seed ; `inspection-api` HTTP ; `AuditClotureGenerateNcTest` |
| [~] | B-HSE-04 | Formations HSE | 2026-05-27 | agent | `004_create_formations_hse` ; CRUD + cloturer + expirant ; seed ; `formation-api` HTTP |
| [~] | B-HSE-05 | EPI dotation | 2026-05-27 | agent | `005_create_epi_dotations` ; CRUD + expirant ; stock SORTIE stub ; seed ; **`epi-api` HTTP** |
| [~] | B-HSE-06 | PPSPS + PHS | 2026-05-27 | agent | `006_create_ppsps_phs` ; CRUD + sections/versions ; PDF stub 501 ; `ppsps-api`/`phs-api` HTTP |
| [~] | B-HSE-07 | Visites médicales | 2026-05-27 | agent | `007_create_visites_medicales` ; CRUD + echeances ; INAPTE→pointage stub ; seed 8 ; `visite-medicale-api` HTTP |
| [~] | B-HSE-08 | Registres légaux | 2026-05-27 | agent | `008_create_registres_legaux` ; CRUD + extension_json ; seed 12 ; `registre-legal-api` HTTP |
| [~] | B-HSE-09 | DUER | 2026-05-27 | agent | `009_create_duer` ; CRUD + risques ; seed 3 ; `duer-api` HTTP |
| [~] | B-HSE-10 | Read model `HseKpi` | 2026-05-27 | agent | `GET /api/v1/hse/kpis` ; TF1/TF2/TG ; `HseKpiServiceTest` ; `hse-kpi-api` + tableau-bord partial HTTP |

**Sous-total :** 0 ✅ / 10 🟡 / 0 ❌

---

## Wave 5 — Marchés

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-MAR-01 | Contrats marché + BPU | 2026-05-27 | agent | `001_create_contrats_marche` ; CRUD + notifier/cloturer + BPU lignes ; seed ; `contrat-marche-api` HTTP |
| [~] | B-MAR-02 | Avenants (workflow + propagation) | 2026-05-27 | agent | `002_create_avenants` ; workflow soumettre/signer/propager ; `AvenantPropagationServiceTest` ; `avenant-api` HTTP |
| [~] | B-MAR-03 | Cautions bancaires | 2026-05-27 | agent | `003_create_cautions` ; renouveler/mainlever/expirant ; seed 6 ; `caution-api` HTTP |
| [~] | B-MAR-04 | Factures marché + DGD | 2026-05-27 | agent | `004_create_factures_marche_dgd` ; CRUD + valider stub ; DgdCalculator + workflow ; `DgdCalculatorTest` ; `facture-marche-api`/`dgd-api` HTTP |
| [~] | B-MAR-05 | Révisions prix (K) | 2026-05-27 | agent | `005_create_revisions_prix` ; indices BTP + calculer/appliquer ; `RevisionPrixServiceTest` ; `revision-prix-api` HTTP |
| [~] | B-MAR-06 | Pénalités | 2026-05-27 | agent | `006_create_penalites` ; CRUD + valider ; seed 3 ; `penalite-api` HTTP |
| [~] | B-MAR-07 | Ordres de service | 2026-05-27 | agent | `007_create_ordres_service` ; CRUD + notifier ; PDF 501 ; seed 3 ; `os-api` HTTP |
| [~] | B-MAR-08 | Réceptions provisoire / définitive | 2026-05-27 | agent | `008_create_receptions` ; provisoire/définitive + reserves/lever ; trigger DGD stub ; seed mar-003 |

**Sous-total :** 0 ✅ / 8 🟡 / 0 ❌

---

## Wave 5 — Approbations

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-APR-01 | Approval workflow engine | 2026-05-27 | agent | `001_create_approbations` ; ApprovalEngineService ; workflows+requests ; `ApprovalEngineServiceTest` ; `approbations-api` HTTP |
| [~] | B-APR-02 | Approval request + events + hash chain | 2026-05-27 | agent | approval_events SHA-256 ; verify-integrity ; `ApprovalEventChainTest` ; inbox HTTP |
| [~] | B-APR-03 | Délégation + escalade SLA | 2026-05-27 | agent | `002_create_delegations` ; resolveApprobateur ; EscaladeApprobationService @Scheduled stub ; `DelegationServiceTest` |
| [~] | B-APR-04 | Matrice pouvoirs | 2026-05-27 | agent | `003_create_matrice_pouvoirs` ; BC seuils 50K/500K ; intégré selectWorkflow ; `MatricePouvoirServiceTest` |

**Sous-total :** 0 ✅ / 4 🟡 / 0 ❌

---

## Wave 5 — Dashboard / Analytics / Pilotage

| ✓ | ID | Tâche | Date | Agent | Evidence |
|---|---|---|---|---|---|
| [~] | B-DSH-01 | Read model `DashboardKpi` | 2026-05-29 | agent | `/kpis` sur 8 domaines ; `DashboardFacade` ; **`dashboard.page.ts` zero mock** (DA/congés/NC via APIs) |
| [~] | B-DSH-02 | Read model `AnalyticsBucket` multi-axes | 2026-05-27 | agent | `/analytics` achats/chantiers/ventes/finance/rh/hse ; `analytics-api` ; 5 tableaux HTTP-first |
| [~] | B-DSH-03 | Read model `CashFlowProjection` dynamique | 2026-05-29 | agent | `/pilotage/cash-flow-projection` ; **`cash-flow-projection.service` zero mock** (factures marché/FF + RH KPI fallback) ; `pilotage-analyses-data` HTTP |

**Sous-total :** 0 ✅ / 3 🟡 / 0 ❌

---

## Totaux globaux (snapshot 2026-05-27)

| Wave | ✅ FAIT | 🟡 PARTIEL | ❌ MANQUANT | Avancement |
|---|---|---|---|---|
| 0 — Foundation | 2 | 3 | 0 | 🟡 100% démarré (2 ✅, 3 🟡) |
| 1 — Inventory | 0 | 7 | 0 | 🟡 100% démarré (0 ✅, 7 🟡) |
| 1 — Finance | 0 | 8 | 0 | 🟡 100% démarré (0 ✅, 8 🟡) |
| 2 — Commerce | 0 | 13 | 0 | 🟡 100% démarré |
| 3 — Projets | 0 | 17 | 0 | 🟢 100% démarré |
| 4 — Personnes + Conformité | 0 | 18 | 0 | 🟢 100% démarré |
| 5 — Contrats + Agrégats | 0 | 15 | 0 | 🟢 100% démarré |
| **TOTAL** | **2** | **76** | **0** | **🟢 100% démarré** (2 ✅, 76 🟡, 0 ❌ — DoD métier 0%) |

🟢 ≥80% · 🟡 40–79% · 🔴 <40%

---

## Mise à jour du fichier

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | — | Création — 78 tâches recensées en 6 vagues. |
| 2026-05-15 | agent | Wave 0 démarrée — `partner` domain, `erp.application.json`, scan ERP, Gradle build OK. |
| 2026-05-15 | agent | Wave 1 démarrée — B-INV-01/02 partiels (items BTP, articles API, dépôts locations). |
| 2026-05-27 | agent | Recalcul totaux globaux — 2 ✅ / 18 🟡 / 58 ❌ ; Wave 1 Inventory 7/7 🟡, Finance 8/8 🟡. |
| 2026-05-27 | agent | B-INV-04 — API motifs (`/api/v1/motifs`), seed JSON, désinjection facades mouvements ; fix lookup `item-categories`. |
| 2026-05-27 | agent | B-INV-03 valorisation/alertes HTTP ; B-FIN-04 comptes bank-accounts ; B-FIN-06 createMvtFromReleve journal ; inventory-tx sans mock. |
| 2026-05-27 | agent | Wave 2 démarrée — B-ACH-01 domain achats ; B-FIN-08 caisses/banque ; B-FIN-04 partners contre-parties ; B-VEN-01 clients/fournisseurs → partners. |
| 2026-05-27 | agent | B-ACH-01 workflow endpoints ; B-ACH-02 AO CRUD ; B-VEN-02 offres CRUD (`domains/ventes`). |
| 2026-05-27 | agent | B-ACH-03 BC achat ; B-VEN-03 BCC ; B-ACH-02 AO workflow HTTP. |
| 2026-05-27 | agent | B-VEN-02 offre workflow ; B-ACH-03 `bc.facade` HTTP. |
| 2026-05-27 | agent | B-ACH-02 attribution → BC ; B-ACH-03 réceptions achat skeleton. |
| 2026-05-27 | agent | Parallèle : B-ACH-06 attestations ; B-ACH-07 matching FF ; B-VEN-06 RG ; B-ACH-05 catalogue. |
| 2026-05-27 | agent | 4 agents : FF comptabiliser ; factures RG/RAS ; phases/postes ; budget chantier. |
| 2026-05-27 | agent | 4 agents : B-CHA-04 avancements ; B-CHA-09 summary ; B-ACH-05/06 fiche fournisseur ; B-CHA-10 mock cleanup (drilldown/dashboard/create/situations). |
| 2026-05-27 | agent | 4 agents : B-CHA-05 situations ; B-CHA-04 complete ; B-VEN-04 encaissements ; fix migrations 005→008 chantiers. |
| 2026-05-27 | agent | 4 agents : convert-to-facture port ; B-CHA-06 sous-traitance ; B-CHA-10 pilotage/analytics ; e2e achats/ventes smoke specs. |
| 2026-05-27 | agent | 4 agents : B-CHA-07 documents/attachements ; fix 54 erreurs TS (ng build OK) ; B-ACH-03 matching HTTP BC detail. |
| 2026-05-27 | agent | 4 agents : B-CHA-08 photos ; B-RH-01 employés ; B-CHA-10 RH mock cleanup ; e2e commerce 1/11 (backend requis). |
| 2026-05-29 | agent | B-ACH-03 3-way matching BC detail HTTP — `matching.service` via `GET …/matching/by-bc/{bcId}` + réceptions bc-api ; mock Achats/Inventory retirés. |
| 2026-05-27 | agent | 4 agents : B-RH-02 pointage ; B-ETU-01 ouvrages ; B-RH-03 congés ; proxy e2e `/api`→8082 + skip si backend down. |
| 2026-05-27 | agent | 4 agents : B-ETU-02 métrés ; B-RH-04 planning ; B-RH-05 fiches paie ; e2e ventes skip + script `e2e:commerce`. |
| 2026-05-27 | agent | 4 agents : B-ETU-03 DPGF ; B-RH-06/07/08 heures sup/frais/contrats — **Wave 4 RH 8/8 démarrée**. |
| 2026-05-27 | agent | 4 agents : B-ETU-04/05/06 DPU+AOC+Devis ; B-HSE-01 incidents — **Wave 3 Projets 17/17 + HSE démarrée**. |
| 2026-05-27 | agent | 4 agents : B-HSE-02/03/04/05 NC+inspections+formations+EPI ; B-MAR-01 contrats marché — **Wave 5 démarrée**. |
| 2026-05-27 | agent | 4 agents : B-HSE-06→10 PPSPS/PHS/visites/registres/DUER/KPI ; B-MAR-02/03 avenants+cautions — **Wave 4 HSE 10/10 + Marchés 3/8**. |
| 2026-05-27 | agent | 4 agents : B-MAR-04→08 factures/DGD/K/pénalités/OS/réceptions ; B-HSE-05 epi-api ; Études facades sans mock — **Wave 5 Marchés 8/8 démarrée**. |
| 2026-05-27 | agent | 4 agents : B-APR-01→04 engine approbations ; B-DSH-01→03 KPI/analytics/cash-flow — **78/78 tâches démarrées, roadmap backend skeleton complète**. |
| 2026-05-29 | agent | Phase DoD : `OuvrageServiceTest`+e2e ETU-01 ; **12 pages marchés sans mock** ; IAM MANAGER +62 perms ; notifications/RH/analytics/approbations pure HTTP ; fix clash JPA `ErpApprovalRequest`/`ErpApprovalRequestRepository`. |
| 2026-05-29 | agent | B-ETU-01 DoD gap-fill — `OuvrageServiceTest` (8 tests CRUD+lookup) ; `etudes-ouvrages-flow.spec.ts` ; `:domains:etudes:build` OK ; reste `[~]` — bootRun ERP échoue (conflit `approvalRequestRepository` pré-existant). |
| 2026-05-29 | agent | DoD batch 2 — **`dashboard.page.ts` + `pilotage-analyses-data.service.ts` zero mock** ; `EmployeServiceTest` (7) + `rh-employes-flow.spec.ts` ; `generate-backend.mjs erp` ; bootRun bloqué Postgres down. |
| 2026-05-29 | agent | DoD batch 3 — **14 GMAO pages → `MaterielGmaoFacadeService`** ; `cash-flow-projection` + `balance` + `analytique` + `simpl-is` zero mock. |
| 2026-05-29 | agent | DoD batch 4 — **`ListQuery` page/pageSize optional** → `ng build` green ; `pilotage-chantier-marges` + `chantier-detail` → `ContratMarcheApiService` ; fix `metre-dpgf` imports + `duer-api` override. |
| 2026-05-29 | agent | DoD batch 5 — **HSE PPSPS/PHS/DUER/tableau-bord zero mock** ; finance **virement-remise/recouvrement/retenue-source** → FF/factures HTTP. |
| 2026-05-29 | agent | DoD batch 6 — **`PointageSaisieService`** (batch API + offline sync) ; **`PlanningMockFacade` → chantier/lot/phase APIs** ; paie **journal/DAMANCOM/9421 → `PaieApiService`** ; taux-change sans mock BAM. |
