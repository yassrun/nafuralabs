# 📊 Progression détaillée — ERP Audit Roadmap **Round 2**

> Snapshot live mis à jour à chaque tâche complétée.
> Légende : ✅ FAIT · 🟡 PARTIEL · ❌ MANQUANT · 🔄 EN COURS
> **Dernière mise à jour** : 2026-05-13 — Task 01 dashboard **P1** (e2e 12 KPIs + charts, `cdkDragStartDelay`, cartes graphes 320px ; M-DASH-01..03) + Task 02 chantiers M-CHA-01..02 (mock `ch-00x`, wizard, e2e) + Task 05 matériel GMAO + Task 04 stock P1 (M-STK-01..07 mock) + **Task 07 marchés** (fusion nav, DGD/OS listings, propagation avenant, situation auto, cautions board) + **Task 06 études** (M-ETU-01 DPU + M-ETU-02 métré→DPGF→devis mock) + **Task 14 transverse** (P0 : palette raccourcis de secours, drill-down listing, i18n notifications, sync RTL `LocaleService` + `I18nService`, e2e `transverse-task14.spec.ts`) + **Task 13.0** (`/admin` hub, sidebar « Accueil administration », e2e `admin-route.spec.ts`) + **Task 11 pilotage** (`/pilotage-analyses/*`, cash-flow dynamique, e2e `pilotage-analyses-kpis.spec.ts`) + **Task 12 approbations** (engine + inbox + multi-types P0, e2e `approvals-workflow.spec.ts`) + **Task 17 spécificités MA** (validateurs ICE/RIB clé 97/IF/CNSS/AMO/Patente/RC + atoms ICE/RIB recâblés, catalogue TVA paramétrable persisté + résolution exonération, service jours fériés MA + 5 ans seedés, référentiels `banques-ma`/`regions-ma`) + **Task 16 intégrations** (adapters DGI SIMPL-IS / DAMANCOM / CNSS DAT / e-facture / OMPIC / WhatsApp + bank registry AWB/BMCE/CIH/BP + service indices BTP01..xx — pattern MOCK ↔ PROD, audit log, 43 tests unitaires).

> ⚠️ **À LIRE AVANT** : Round 1 est à ~68 % implémenté (cf. `docs/specs/erp-audit-roadmap/00-PROGRESS.md`). Avant de marquer une tâche `❌` comme **à créer ex-nihilo**, vérifier le snapshot Round 1 — beaucoup d'écrans/services existent et nécessitent **enrichissement** plutôt que **création**.

---

## 01-dashboard — 🟡 ~45% (P1 cœur OK ; M-DASH-01 partiel sans palette widgets)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-DASH-01 | Personnalisation dashboard (drag & drop widgets par rôle) | 🟡 | `dashboard-layout.service.ts` + CDK, 3 personas, reset, `cdkDragStartDelay` sur blocs pour ne pas bloquer les clics KPI ; **sans** palette « + Ajouter widget » (spec 1.4) |
| M-DASH-02 | Graphes & tendances (courbe CA, sparklines marges, top 5 alerte) | ✅ | Widgets `ca-cumul-chart`, `marge-sparkline`, `top-chantiers-alerte`, `bird-pyramid-hse` (`nf-chart` + mocks), cartes `min-width: 320px` + scroll horizontal |
| M-DASH-03 | Drill-down depuis chaque KPI (clic → liste filtrée) | ✅ | `kpi-tile.component.ts` + routes/queryParams ; e2e `tests/e2e/dashboard-drill-down.spec.ts` (12 tuiles + rendu charts) |
| M-DASH-04 | Alertes temps réel centralisées (engagement >90 %, situations >60 j, cautions <30 j) | ❌ | À concevoir |
| M-DASH-05 | Filtres dashboard (société, chantier, période, MOA, métier) | ❌ | Pas de barre de filtres |
| M-DASH-06 | Export PDF dashboard du jour | ❌ | Pas de bouton export |
| M-DASH-07 | Widgets HSE & RH enrichis (TF/TG, pyramide âges) | ❌ | Voir M-PIL-04 (groupe) |
| M-DASH-08 | Mode TV plein écran salle pilotage | ❌ | Différenciateur P3 |

## 02-chantiers — 🟡 P0 partiel (M-CHA-01 + M-CHA-02)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-CHA-01 | **Fiche détail chantier accessible** | ✅ | `ChantiersMockService` : IDs `ch-001`…`ch-006` alignés seeds, clé storage `v2`, `getChantierById` (id / code / `CH-2025-xxx`). `chantier-detail.page.ts` : `paramMap` → signal, état introuvable explicite. E2E : 6 fiches + `ch-999` + `/chantiers/CH-2025-001`. |
| M-CHA-02 | Wizard création chantier (5 étapes) | ✅ | Route `chantiers/new` (`chantiers.routes.ts`), `create/chantier-create.page.ts`, CTA listing, `createChantierFromWizard` + `ErpAuditService.log`, i18n `chantiers.create.*`. E2E wizard happy path. |
| M-CHA-03 | Onglets fiche chantier (10–12 onglets) | ❌ | Round 1 = 6 onglets seulement |
| M-CHA-04 | Équipe chantier (rôles, téléphones, photos, badges) | ❌ | Aucun annuaire opérationnel |
| M-CHA-05 | Carte interactive Mapbox/Leaflet | ❌ | Aucune carte |
| M-CHA-06 | e-signature MOE/MOA carnets d'attachement | ❌ | Mock affiche « Signé MOE » sans workflow |
| M-CHA-07 | Photos chantier géolocalisées (upload mobile + EXIF + avant/après) | ❌ | Documents montre catégorie Photo sans visionneuse |
| M-CHA-08 | Plans BIM/DWG/PDF visionneuse + révisions + annotations | ❌ | Upload simple uniquement |
| M-CHA-09 | Registre des risques chantier (criticité, propriétaire, plan d'action) | ❌ | Demandé certification ISO |
| M-CHA-10 | Exports planning MS-Project (XML) / Primavera / Excel + import | ❌ | Compatibilité BET/clients |
| M-CHA-11 | Avancements mobile (photo + offline + validation chef) | ❌ | Saisie web uniquement |
| M-CHA-12 | Métrés As-built vs prévisionnels (écarts par lot) | ❌ | À concevoir |
| M-CHA-13 | Météo automatique (open-meteo / DMN) sur journal + attachement | ❌ | Justification intempérie |
| M-CHA-14 | Réceptions provisoire/définitive (PV + réserves + retenue de garantie) | ❌ | Génère DGD auto |
| M-CHA-15 | Budget drill engagements (BC/contrats/paie) — fix bug `3.250 %` | ❌ | **Bug visible** sur écran budget |
| M-CHA-16 | Calendrier équipes (Outlook/Google sync) | ❌ | P3 |

## 03-achats — 🟡 P0 partiel (M-ACH-01 + M-ACH-02)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-ACH-01 | **Réceptions intégrées (3-way matching BC↔BL↔Facture)** | 🟡 | `matching-three-way.ts` + `MatchingService` ; onglet synthèse BC ; colonne BC réceptions ; onglet matching FF ; blocage validation si `ECART_BLOQUE` ; seeds `tx-rec-bc001` + factures démo `ff-3way-demo-*` ; tests `matching-three-way.spec.ts` |
| M-ACH-02 | **Comparatif fournisseurs / scoring AO** | 🟡 | `ScoringAOService` + route `/achats/appels-offres/:id/comparatif` ; lien depuis fiche AO ; attribution avec audit si hors reco ; tests `scoring-ao.service.spec.ts` |
| M-ACH-03 | Fournisseur 360° (KPI YTD, OTIF %, retard moyen, taux litige, attestations) | ❌ | Sourcing moderne |
| M-ACH-04 | Workflow DA→AO→BC→Réception→Facture traçabilité | ❌ | Pas de lien explicite, audit trail manquant |
| M-ACH-05 | Catalogue articles fournisseurs + tarifs négociés + grilles remises | ❌ | Évite ressaisie prix |
| M-ACH-06 | Portail fournisseur (login + soumission AO + dépôt factures) | ❌ | Réduit friction |
| M-ACH-07 | Attestations légales auto (CNSS/fiscale/AMO/RC/IF/ICE/Patente/RIB) avec alerte expiration | ❌ | Conformité Art. 60 LF 2024 |
| M-ACH-08 | Sous-traitance Art. 187 CGI + suivi RG + validation MOA | ❌ | Conformité Maroc |
| M-ACH-09 | BC catalogue / contrat cadre rapide (80 % achats courants) | ❌ | Productivité |
| M-ACH-10 | Cadre normatif marchés publics (BPU/PUF/PGF/régie/OS) | ❌ | Argument vente MOA publics |
| M-ACH-11 | Tableau de bord achats (économies vs marché, dépendance >25 %, top litige) | ❌ | KPI direction |
| M-ACH-12 | IA suggestion articles à commander | ❌ | P3 différenciateur |

## 04-stock — 🟡 ~45% (P1 mock)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-STK-01 | Scanner mobile (douchette + QR/code-barres) workflow complet | 🟡 | Route `/m/inventory/scan/:context` + `@zxing/ngx-scanner` + saisie manuelle + file offline localStorage + beep/vibration |
| M-STK-02 | Réservation stock chantier (« 2 t fer HA12 pour CH-2026-001 sem 21 ») | 🟡 | `ReservationStockService` (localStorage) + page `/inventory/reservations` + FIFO à validation sortie + section fiche article |
| M-STK-03 | Magasin chantier digital (entrée BC → sortie bon matières → inventaire hebdo) | 🟡 | Page `/inventory/magasin-chantier/:chantierId` + lien sorties (mock) |
| M-STK-04 | Liaison sortie stock ↔ consommation chantier ↔ budget (vs prévu métré) | 🟡 | Colonne « Réalisé matière (stock) » + drill sorties + `realisesMatieresParPoste` + correctif `recordConsommation` multi-budget + tests `stock-budget-sync.service.spec.ts` |
| M-STK-05 | Étiquetage (impression lot/emplacement, QR codes) | 🟡 | `StockLabelPrintService` + bouton fiche article (fenêtre impression 50×30) |
| M-STK-06 | Multi-emplacements par dépôt + emplacement par défaut article | 🟡 | Modèle `Emplacement` + seed sur `LOC_DEPOT_CASA` + champs ligne mouvement / article |
| M-STK-07 | Date péremption / lot (étanchéité, adjuvants, peintures) | 🟡 | `LotStock` seed + `getLotsNearExpiry` + article `art-sable` périssable + KPI dashboard lots <30j |
| M-STK-08 | Demande de transfert workflow (chantier A → magasin → transporteur → chantier B) | ❌ | Évite appels téléphone |
| M-STK-09 | CMP / FIFO réel (vérifier route `costing-methods` actuelle) | ❌ | Norme comptable |
| M-STK-10 | ABC analysis Pareto 80/20 | ❌ | Aide seuils réappro |
| M-STK-11 | Suggestion réappro auto (stock mini × conso prévi × délai fournisseur) | ❌ | Génère DA brouillon |
| M-STK-12 | Carte dépôts + tournée optimale livraison (Google Maps API) | ❌ | P3 différenciateur |

## 05-materiel — 🟡 ~55% (P0/P1 démo mock)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-MAT-01 | **Maintenance préventive et corrective (GMAO)** | 🟡 | `/materiel/maintenance/plans`, `/ot`, `/ot/:id`, `/historique/:engineId` + `MaterielGmaoMockService` + alerte semaine + coûts OT auto. Manque CRUD UI complet + persistance. |
| M-MAT-02 | **Carburant & consommables** | 🟡 | `/materiel/carburant/carnets|pleins|consommations`, détection anomalie plein, export CSV. Manque lien budget chantier réel. |
| M-MAT-03 | Fiche engin 360° | 🟡 | `/materiel/engins/:id` onglets identité/affectations/maintenance/carburant/contrôles + blocage VGP. Manque photos, conducteurs CACES (Task 09), documents. |
| M-MAT-04 | Locations externes | 🟡 | Hub `/materiel/locations` + contrats / états / échéances J-30 mock. Manque PDF état contradictoire + workflow signatures complet. |
| M-MAT-05 | Planning matériel Gantt | 🟡 | `/materiel/planning` dhtmlx-gantt, conflits chevauchants actifs, drag dates → `patchPlanningDates`. |
| M-MAT-06 | Pointage matériel chantier | 🟡 | `/materiel/pointage` saisie + liste mock. Manque coût analytique budget + croisement carburant. |
| M-MAT-07 | Contrôles réglementaires | 🟡 | `/materiel/controles` + `isEngineBlockedForAssignment` (VGP expirée). Manque intégration création affectation (UI bloquante). |
| M-MAT-08 | GPS / télémétrie | ❌ | P2 |
| M-MAT-09 | Habilitations CACES | ❌ | Croisement Task 09 |
| M-MAT-10 | TCO par engin | ❌ | P2 |
| M-MAT-11 | Maintenance prédictive IA | ❌ | P3 |

## 06-etudes — 🟡 P0 partiel (M-ETU-01 + M-ETU-02 mock)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-ETU-01 | **DPU — Décomposition Prix Unitaire (matière × MO × matériel × FG × marge)** | 🟡 | `DpuService` + onglet DPU (`dpu-editor`) sur fiche ouvrage : import sous-détail, sliders FG/marge, snapshots `dpuHistorique`, bouton MAJ prix biblio ; modèles `ComposantDPU` / `PrixDPU`. Tests `dpu.service.spec.ts`. |
| M-ETU-02 | **Métré → DPGF (Décomposition Prix Global Forfaitaire) → Devis auto** | 🟡 | `DpgfService` + mock `dpgf[]` ; route `/etudes/metres/:id/dpgf` (arbre + sommaire lots + impression) ; `/etudes/devis/from-dpgf/:dpgfId` ; prix PU depuis biblio ; `lotCode`/`sousLotCode` sur lignes seed `met-001`. Tests `dpgf.service.spec.ts`. |
| M-ETU-03 | Soumission AO client (cahier des charges → métré → bordereau → mémoire → planning → cautions → qualif) | ❌ | Augmente taux de gain |
| M-ETU-04 | Courbe en S prévisionnelle depuis DPGF + planning + cash plan | ❌ | Différenciateur direction |
| M-ETU-05 | Bibliothèque prix : import Excel, export, versioning, marge cible, indexation BTP01/BTP18 | ❌ | Liste statique aujourd'hui |
| M-ETU-06 | Mémoire technique auto-généré (paragraphes réutilisables, CV équipe, attestations) | ❌ | Demande MOA publics |
| M-ETU-07 | Variantes de chiffrage (avec/sans option, scénarios marge) comparatif côté à côte | ❌ | Phase négociation |
| M-ETU-08 | Import BPU client (Excel/CSV) → ajout prix → édition réponse | ❌ | Productivité études |
| M-ETU-09 | Bibliothèque qualifs & références (Qualibat, Qualiopi, classif MA) | ❌ | Dossier soumission |
| M-ETU-10 | Bordereaux officiels MA (MTE/AFRA/Provinces) chargés et mappés | ❌ | Productivité publics |
| M-ETU-11 | Comparatif AO reçus (miroir Achats côté Études) | ❌ | Veille commerciale |
| M-ETU-12 | IA mémoire technique | ❌ | P3 différenciateur |

## 07-marches — 🟡 ~55% (Task 07 P0 + P1 fondations mock)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| Task 7.0 | **Fusion sidebar** Marchés BTP + Marchés & Facturation | ✅ | `erp-nav.generated.ts` : un parent `marches` + sous-groupe `marches.sectionPublic` (contrats→OS) + groupes `ventes.*` ; i18n `nav.marches` = « Marchés & Facturation » ; URLs `/ventes/*` inchangées. |
| M-MAR-01 | Avenants — propagation impact | 🟡 | `avenant-detail.page.ts` + `MarchesMockService.propagateAvenantImpact` + `ChantiersMockService.applyMarcheImpactFromAvenant` + `ErpAuditService` ; échéancier cash-flow / planning Gantt : à brancher. |
| M-MAR-02 | DGD auto | 🟡 | `dgd.service.ts` + spec ; `/marches/dgd` + seed ; PDF CCAG-T : à brancher. |
| M-MAR-03 | Cautions expiration + workflow | 🟡 | Listing : 3 colonnes + alerte J-30 ; PDF demande renouvellement / mainlevée : à brancher. |
| M-MAR-04 | OS | 🟡 | `/marches/os` listing + seeds ; CRUD, PDF, pause Gantt : à brancher. |
| M-MAR-05 | Situations auto avancements | 🟡 | `situation-generation.service.ts` + spec ; bouton onglet Situations `chantier-detail.page.ts` ; persistance brouillon situation : à brancher. |
| M-MAR-06 | Avances démarrage | 🟡 | Modèle `AvanceDemarrage` + seed `mar-002` ; amortissement sur situations + PDF : à brancher. |
| M-MAR-07 | Sous-traitance Art. 187 | ❌ | Coord Task 03 |
| M-MAR-08 | Réception provisoire / définitive | ❌ | Trigger DGD auto |
| M-MAR-09 | Indices BTP01 auto | ❌ | Coord Task 16 |
| M-MAR-10 | Litige MOA | ❌ | P3 |

> **Sidebar** : ✅ plus de duplication au premier niveau (`ventes` retiré comme racine nav).
## 08-finance — 🟡 P1 démo (Task 08 agent 2026-05-13)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-FIN-01 | Lettrage facture ↔ règlement (ouvert / lettré / partiel + UI manuelle) | 🟡 | `/finance/lettrage` + `LettrageService` + persistance mock compta + export CSV + tests |
| M-FIN-02 | Recouvrement (âge créances, échéancier, relances J+15/30/45 email/SMS, mise en demeure) | 🟡 | `/finance/recouvrement` + `RecouvrementService` + audit mock relance / MED |
| M-FIN-03 | Effets de commerce (LCR/LCN) : portefeuille, remise encaissement, escompte, impayés | 🟡 | `/finance/effets` + `FinanceRound2MockService` + bordereau export texte |
| M-FIN-04 | Multi-banques (virements XML SEPA + format AWB/BMCE/CIH/BP) | 🟡 | `/finance/virements/remise` + `VirementRemiseXmlService` (SEPA + stub MA) + tests |
| M-FIN-05 | Rapprochement bancaire (import OFX/CSV + matching auto + écarts) | 🟡 | Import OFX `ReleveImportDialog` + bouton « Matching auto » sur rapprochement |
| M-FIN-06 | e-facture DGI (QR + signature + archive 10 ans) — obligatoire CA > 50M MAD 2026-2027 | 🟡 | `EfactureService` + champs `FactureClient` + `emitFacture` enrichi + tests |
| M-FIN-07 | Retenue à la source 5 % marchés publics (calcul auto + déclaration trimestrielle) | 🟡 | Seed `fc-013` marché public + `/finance/declarations/retenue-source` export XML mock |
| M-FIN-08 | Régime auto-entrepreneur fournisseurs (autoliquidation TVA + RAS spécifique) | 🟡 | `ComptaFournisseur` FRS-014 + `TvaAutoliquidationService` option AE + FF RAS % HT |
| M-FIN-09 | Caisses chantier (avances chef + justificatifs photo + refacturation analytique) | 🟡 | `/finance/caisses-chantier` + mock mouvements / solde |
| M-FIN-10 | Comptabilité analytique multi-axes (chantier × lot × phase × catégorie × société) | ❌ | Vérifier `/finance/analytique` |
| M-FIN-11 | Budget trésorerie glissant 12 mois par chantier et consolidé | ❌ | Cash-flow existe au pilotage |
| M-FIN-12 | Clôture périodique (mensuelle/annuelle) + report à nouveau | ❌ | Obligation comptable |
| M-FIN-13 | Liasse fiscale (IS, Bilan, CPC, ESG, Tableau financement) format DGI | ❌ | Demandé DAF |
| M-FIN-14 | Connecteur Open Banking (AWB/CIH OpenAPI) | ❌ | P3 différenciateur |

## 09-rh — 🟡 M-RH-01 partiel

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-RH-01 | **Pointage mobile chantier (photo, géoloc, signature, offline)** | 🟡 | **2026-05-13** : `/rh/pointage/saisie` — géofencing (GPS vs `latitude`/`longitude` + `pointageGeofenceM` chantier), multi-sélection + appliquer mode, signature canvas collectif ou individuel (modal), `journeeBatchId` + `signatureDataUrl` sur `Pointage`, 10 affectations `ch-001` ; `pointage-geofence.util` + spec ; e2e offline + géoloc + tracé signature. Reste : API backend réelle, Dexie/SW Task 15, iPhone/Pixel e2e dédiés. |
| M-RH-02 | Contrats auto (CDI/CDD/ANAPEC/intérim/chantier) + champs MA + signature électronique | ❌ | Productivité RH |
| M-RH-03 | Heures supplémentaires (HS25/HS50/HS100) barèmes MA + validation chef chantier | ❌ | Calcul paie BTP critique |
| M-RH-04 | Frais de déplacement chantier (km, panier, hébergement) + refacturation analytique | ❌ | Fréquent BTP |
| M-RH-05 | Carrière (entretien annuel, formations, habilitations CACES/SST/électricité, alertes échéance) | ❌ | Compliance ISO |
| M-RH-06 | Sécurité paie (restriction accès, signature électronique fiche, archivage 5 ans) | ❌ | Confidentialité |
| M-RH-07 | Paie intérim (pré-calcul + commande agence + saisie heures + facturation) | ❌ | Très utilisé BTP MA |
| M-RH-08 | Congés (compteur auto 1,5 j/mois, soldes, validation hiérarchique, planning équipe) | ❌ | Standard |
| M-RH-09 | Accidents du travail (déclaration auto CNSS DAT + lien HSE + suivi IJSS) | ❌ | Conformité légale obligatoire |
| M-RH-10 | Maladies & arrêts (IJSS CNSS + contre-visite éventuelle) | ❌ | Obligation employeur |
| M-RH-11 | Self-service employé (fiche paie en ligne, demande congés, justificatifs, attestation) | ❌ | Gain admin RH |
| M-RH-12 | Formation continue + TFP 1,6 % (OFPPT, conventions, remboursements) | ❌ | Cadre légal |
| M-RH-13 | Médecine du travail (visites embauche/périodique/reprise) | ❌ | Compliance Code Travail MA |
| M-RH-14 | Engagement / pulse surveys | ❌ | P3 différenciateur |

## 10-hse — 🟡 partiel — **route `/qualite` activée**

> **2026-05-13** : alias `/qualite` ↔ `/hse`, PHS société, PPSPS sections + PDF, incidents (type, filtres, workflow labels, CNSS DAT maquette + alerte 48h), NC CAPA champs, tests unitaires + e2e `hse-qualite-route.spec.ts`.

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-HSE-01 | **Registre incidents/accidents (AT, AT trajet, presque accident, dommage matériel)** | 🟡 | Types + filtres + workflow Ouvert/Investigation/Clos + bouton « Déclarer CNSS DAT » (PDF maquette) + rappel 48h — API M-INT-03 à brancher |
| M-HSE-02 | **Non-conformités (NC) + actions correctives/préventives (CAPA)** | 🟡 | Champs zone, préventif, vérif efficacité, inspection source — création auto depuis inspection P1 |
| M-HSE-03 | **PPSPS (Plan Particulier Sécurité Protection Santé) par chantier** | 🟡 | Modèle sections (8) + version + PDF étendu — éditeur markdown dédié P1 |
| M-HSE-04 | **PHS (Plan Hygiène & Sécurité) générique société** | 🟡 | Page `/hse/phs` + `/qualite/phs`, listing + PDF démo |
| M-HSE-05 | Causerie 1/4 h sécurité (registre quotidien + sujet + présents + signature) | ❌ | Standard chantier |
| M-HSE-06 | Audits HSE (checklists configurables, score, photo, plan d'action) | ❌ | Pilotage |
| M-HSE-07 | EPI (dotation par employé, dates remplacement, suivi) | ❌ | cf Round 1 9.2 EPI volets |
| M-HSE-08 | Risques chimiques (fiches FDS + formation) | ❌ | Conformité |
| M-HSE-09 | Plans évacuation + exercices + alarmes (registre) | ❌ | Conformité |
| M-HSE-10 | KPIs HSE (TF1, TF2, TG, ratio dépenses HSE/CA, jours sans accident) | ❌ | Dashboard direction |
| M-HSE-11 | Déclarations CNSS DAT + CNAOPS si applicable | ❌ | Légal |
| M-HSE-12 | Audits qualité ISO 9001/14001/45001 (checklists, suivi) | ❌ | P2 |
| M-HSE-13 | Risques environnementaux chantier (eau, déchets, bruit, poussière) + registres | ❌ | P2 |
| M-HSE-14 | PV levée réserves QHSE | ❌ | P2 |

## 11-pilotage — 🟡 ~55% (Task 11 — données + cash-flow + what-if)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-PIL-01 | **Brancher données réelles sur 5 vues Pilotage & Analyses** (chantiers/financier/stock/achats/RH) | ✅ | Routes `/pilotage-analyses/*` + `PilotageAnalysesDataService` (marges, balance, stock, achats, RH) ; drill liens ; e2e `tests/e2e/pilotage-analyses-kpis.spec.ts` |
| M-PIL-02 | Indicateurs marge brute/nette par chantier/BU/client/MOA | 🟡 | `buildPilotageMargePivotRows` + TCD + export CSV sur `/pilotage-analyses/rentabilite` ; Excel P1 optionnel |
| M-PIL-03 | OPEX vs CAPEX par mois et par chantier | 🟡 | Page `/pilotage-analyses/opex-capex` (agrégat balance classe 2 vs 6) ; ventilation mensuelle détaillée à brancher |
| M-PIL-04 | Reporting groupe (multi-sociétés / multi-entités consolidé) | 🟡 | Page `/pilotage-analyses/groupe` (KPIs consolidés démo) ; intercos + multi-société → Task 13 |
| M-PIL-05 | Cash-flow dynamique (vs projection linéaire actuelle « +658.148 MAD » constant 10 mois) | ✅ | `projectCashFlowMonths` refondu (situations + FF + paie + charges + traites) ; `CashFlowProjectionService` + tests `cash-flow-projection.service.spec.ts` |
| M-PIL-06 | What-if simulator (impact OS, retard 3 mois, hausse acier 10 %) | 🟡 | Page `/pilotage-analyses/what-if` (sliders + comparatif marge / cash M+12 simplifié) |
| M-PIL-07 | Exports finance CAC/DAF (FEC, balance N-1, mapping IFRS/CGNC) | ❌ | Vérifier exhaustivité |
| M-PIL-08 | Benchmark sectoriel anonymisé (intra-clients Nafura) | ❌ | P2 différenciateur futur |
| M-PIL-09 | Alertes IA proactives (« tu vas dépasser budget chantier CH-XXX dans 21 jours ») | ❌ | P3 différenciateur |

## 12-approbations — 🟡 P0 partiel (M-APR-01..03)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-APR-01 | **Engine workflow générique** (entité × montant × rôles × série/parallèle + délégation + escalade SLA) | 🟡 | `ApprovalEngineService` + `approval-workflows.seed.ts` (5 workflows nominatifs BC std / BC≥500k / Congés / Paie / Virement + types annexes). Sélection par conditions. Tests `approval-engine.service.spec.ts`. **Manque** UI configurateur matriciel + délégation/escalade runtime (P1). |
| M-APR-02 | **Approbations multi-types** (DA, AO attribution, BC, facture fournisseur, situation, congés, paie, virement, avenant, OS) | 🟡 | Types `FF` `AVN` `VIR` `SIT` `AO` `PAIE` `OS` + existants ; bouton sur AO / situation / virement / paie / OS listing. E2E `tests/e2e/approvals-workflow.spec.ts` (inbox + BC 3 étapes). |
| M-APR-03 | **Inbox approbateur** (carte synthèse, commentaires, demande complément, audit log immuable) | 🟡 | `/approbations` : filtres type/société/urgence, tri SLA, actions complément/commentaire/délégation (journal), hash SHA-256 chaîné sur nouvelles actions + `verifyJournalChain`. **Manque** hash sur tout le seed historique + export PDF (P2). |
| M-APR-04 | Délégation absence approbateur → délégué automatique | ❌ | Productivité |
| M-APR-05 | Notifications email/push/in-app + escalade après X jours | ❌ | Round 1 = notifications in-app, manque email/push + escalade |
| M-APR-06 | Configuration matricielle par société/division/chantier (ex. <50K → directeur, 50-500K → DG, >500K → comité) | ❌ | Gouvernance entreprise |
| M-APR-07 | Approbation mobile 1-clic depuis email/notification | ❌ | Productivité |
| M-APR-08 | Audit trail complet hash & timestamping pour conformité judiciaire | ❌ | P2 conformité |

## 13-admin — 🟡 ~5% — **Task 13.0 hub `/admin`**

> Route `/admin` : **hub livré** (2026-05-13). P0 M-ADM-01..05 reste à faire.

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| Task 13.0 | **Route `/admin` + hub** (liste sections, sidebar, i18n) | ✅ | `admin-hub.page.ts`, `app.routes.ts` (`admin` avant `APPLICATION_ROUTES`), sidebar `administration.hub`, e2e `admin-route.spec.ts`, a11y `/admin` |
| M-ADM-01 | **Utilisateurs & Rôles** (CRUD + permissions granulaires RBAC module × action × scope société/chantier) | ❌ | Round 1 8.1/8.2 IAM en place mais pas page d'administration globale |
| M-ADM-02 | **SSO** (Microsoft Entra ID / Google Workspace / OIDC) + 2FA TOTP/SMS + gestion sessions | ❌ | Round 1 8.7 = login démo/2FA in-app ; manque vrai SSO |
| M-ADM-03 | **Sociétés / Entités juridiques** multi-tenant (3–10 sociétés/groupe) | ❌ | Round 1 8.3 = `SocieteService` + switcher header ; reste page admin sociétés |
| M-ADM-04 | **Paramètres société** (raison sociale, ICE, IF, RC, Patente, CNSS, CNAEM, RIB, logo, adresse, exercices) | ❌ | Round 1 8.4 partial — étendre champs |
| M-ADM-05 | **Référentiels** (clients, MOA, banques) — fournisseurs/articles/employés déjà OK | ❌ | À compléter |
| M-ADM-06 | Audit log global recherchable (qui a fait quoi quand où) | ❌ | Round 1 14.1 = `erpAudit` câblé ; reste UI recherche |
| M-ADM-07 | Templates documents WYSIWYG (devis, BC, facture, BL, situation, attachement, contrat) | ❌ | Round 1 12.2 = quelques gabarits print ; manque éditeur WYSIWYG |
| M-ADM-08 | Numérotation séquentielle (préfixe, séparateur, année, séquence) par type doc × société | ❌ | NumberingService existant à étendre |
| M-ADM-09 | Paramètres fiscaux (TVA, retenues source, timbres, exonérations) | ❌ | Round 1 6.7 = `FiscalSettingsService` ; étendre |
| M-ADM-10 | Mappings comptables auto (OD par type opération : 411/707/4456 vente, 401/61 achat, 64/44/4453 paie) | ❌ | Demandé DAF |
| M-ADM-11 | Gestion abonnements / licences SaaS (nb users, modules activés, usage) | ❌ | Si SaaS |
| M-ADM-12 | Sauvegarde & restauration données | ❌ | Prod readiness |
| M-ADM-13 | API publique (tokens, scope, quotas, webhooks) | ❌ | P2 |
| M-ADM-14 | Import / migration depuis Sage Maroc, Batigest, Excel, Odoo, SAGEAR | ❌ | P2 acquisition clients |
| M-ADM-15 | Internationalisation (locales FR/AR/EN, formats, calendrier hijri optionnel) | ❌ | Round 1 partial — étendre |
| M-ADM-16 | Thème / white-label par société (logo, couleurs) | ❌ | P3 différenciateur |

## 14-transverse — 🟡 P0 partiel (M-TRA-01..02 + M-TRA-08..09)

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-TRA-01 | **Command palette `Ctrl+K` fonctionnelle** (routes + entités : BC, fournisseur, employé, chantier, facture) | 🟡 | **2026-05-13** : raccourcis de secours `Ctrl+Shift+P`, `Ctrl+Shift+K`, `Alt+K` (navigateur capte souvent `Ctrl+K`) ; section Actions + recherche fuzzy (sous-séquence + libellés traduits) ; récents limités à 5 ; `shortcuts.service.ts` + `command-palette.component.ts`. Reste : dépendance fuse.js optionnelle, e2e multi-OS. |
| M-TRA-02 | **Drill-down clic-ligne universel** (chantiers, BC, DA, factures, employés, contrats, attachements, journaux) | 🟡 | **2026-05-13** : `nf-entity-listing` — clic simple → `routes.detail` si `selectionMode === 'none'` ; `nf-data-table` ignore clic si `data-no-click` / colonne actions ; e2e 5 listings (`transverse-task14.spec.ts`). Listings HTML ad hoc (ex. Mes chantiers) inchangés. |
| M-TRA-03 | Workflow approbation transversal (cf §12-approbations) | ❌ | Cf M-APR-01..03 |
| M-TRA-04 | Exports CSV / XLSX / PDF uniformes sur toutes les listes | ❌ | Round 1 12.1 partial — généraliser `<nf-export-button>` |
| M-TRA-05 | Impression PDF templates (BC, devis, factures, situations, attachements, contrats ST, fiches paie, OS) | ❌ | Round 1 12.2 partial — compléter |
| M-TRA-06 | Filtres avancés + sauvegarde vues par utilisateur | ❌ | Productivité |
| M-TRA-07 | Recherche full-text dans PDF / scans BL / factures (OCR) | ❌ | Productivité comptable |
| M-TRA-08 | Notifications applicatives en français + centre fonctionnel | 🟡 | **2026-05-13** : `notifications.bell.*` FR/EN/AR + `notification-bell` / `notification-list` i18n (`TranslateModule`). |
| M-TRA-09 | Bilingue FR / AR (RTL) + EN | 🟡 | **2026-05-13** : `I18nService` appelle `LocaleService.syncFromLang` après `translate.use` (init + préférence + toggle) ; e2e `dir=rtl` après choix العربية. |
| M-TRA-10 | Mode sombre (dark mode) | ❌ | Pas en place |
| M-TRA-11 | États vides / loading / erreur unifiés (skeletons, illustrations, retry) | 🟡 | Round 1 4.2 ✅ sur listings — étendre pages ad hoc |
| M-TRA-12 | Feedback toasts CRUD universels (succès, erreur, undo court) | 🟡 | Round 1 4.3 ✅ `ToastService` — vérifier que toutes les mutations émettent |
| M-TRA-13 | Aide contextuelle (tooltip `?` Art. 187, RG, IGR, BTP18, K, SIMPL-IS, DAMANCOM, ANAPEC, OPPCM…) | ❌ | Onboarding nouveaux users |
| M-TRA-14 | Tour produit / Onboarding premier login (Intro.js / Driver.js) | 🟡 | Round 1 15.7 = 4e tour onboarding ; manque parcours global premier login |
| M-TRA-15 | Historique & restauration enregistrements (soft-delete) | ❌ | P2 |
| M-TRA-16 | Commentaires + @mentions sur entités (chantier, BC, NC, facture) | ❌ | P2 collaboration |
| M-TRA-17 | Pièces jointes universelles (preview) | ❌ | P2 productivité |
| M-TRA-18 | Activity feed timeline par entité | ❌ | P2 audit trail |
| M-TRA-19 | Bulk actions sur listings (sélection N, action groupée) | ❌ | P3 power user |
| M-TRA-20 | Saved searches → automation (« quand BC>200K et fournisseur sans attestation, alerter DAF ») | ❌ | P3 différenciateur |

## 15-mobile — 🔴 0%

> **Quasi inexistant** — l'audit Round 2 constate « aucun screen ne semble pensé mobile ».

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-MOB-01 | **App mobile (PWA installable / native RN/Flutter) chef chantier** : pointage, photos, journal, attachement, sortie matières, BL réception, demande matériel, urgent HSE | 🟡 | Round 1 13.6 = PWA `ngsw-config.json` + démo offline ; étendre app complète terrain |
| M-MOB-02 | **Mode offline** (IndexedDB/SQLite) avec sync différée | 🟡 | Round 1 13.1/13.6 = IndexedDB photos + sync mock ; passer en prod robuste |
| M-MOB-03 | Géolocalisation + géofencing pointage chantier | 🟡 | Round 1 = géoloc pointage démo ; étendre géofencing |
| M-MOB-04 | Capture photo native (compression + géotag EXIF) | 🟡 | Round 1 = photo ~800px ; étendre EXIF géotag |
| M-MOB-05 | Scanner QR / code-barres (BL, matériel, articles) | ❌ | Cf M-STK-01 |
| M-MOB-06 | Signature digitale canvas (PV, attachements) | 🟡 | Round 1 13.4 = signature canvas attachement démo ; généraliser PV + autres docs |
| M-MOB-07 | Notifications push (FCM/APNs) | ❌ | P2 |
| M-MOB-08 | Mode très basse bande passante (texte uniquement chantiers reculés) | ❌ | P2 |

## 16-integrations — 🟡 ~45% (Task 16 — P0 + P1 adapters mockés, prêts à brancher)

> **2026-05-13** : nouveau périmètre `app/platform/core/integrations/` (pattern adapter testable, mode MOCK ↔ PROD via `IntegrationMode`, audit log automatique sur chaque envoi) + `app/applications/erp/integrations/services/indices-btp-import.service.ts`. **43 tests unitaires** verts (`ng test` ciblé `**/integrations/**/*.spec.ts`) + `ng build` OK + `npm run lint:no-dollar` OK.

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-INT-01 | **DGI SIMPL-IS** (XML mensuel TVA) — module XML existe, manque API | 🟡 | `dgi-simpl-is.adapter.ts` : interface stable `SimplIsDeclarationInput`, XML conforme schéma DGI (annexes ventes/achats + récap), `submit()` mock (accusé `SIMPL-IS-…`) + simulateFailure + branch PROD (placeholder `https://api-dgi.gov.ma/simpl-is/declarations`). Tests `dgi-simpl-is.adapter.spec.ts` (totaux + XML + succès/échec/PROD). Round 1 écran XML inchangé. |
| M-INT-02 | **CNSS DAMANCOM** (XML mensuel BAP) — module XML existe, manque API | 🟡 | `cnss-damancom.adapter.ts` : `DamancomBapInput`, XML BAP `urn:cnss.ma:damancom:bap:1.0` (employeur + salariés + totaux + cotisations patronales), `submitBap()` mock (accusé `BAP-…`) + PROD placeholder. Tests `cnss-damancom.adapter.spec.ts`. |
| M-INT-03 | CNSS DAT (déclaration accident travail) | 🟡 | `cnss-dat.adapter.ts` : `submitDat()` mock + computeDateLimite 48 h + flag `conforme48h` + préfixes accusés `CNSS-DA` / `CNSS-MP`. Tests `cnss-dat.adapter.spec.ts` (délai, hors-délai, MP). Coord §10 M-HSE-11 — à brancher dans `incident.service.ts`. |
| M-INT-04 | API banques MA (AWB, BMCE BoA, CIH, BP, BMCI, SGM, CAM, CFG) : virements XML, relevés OFX, e-banking | 🟡 | `banques/banque.adapter.ts` interface + `banque-base.adapter.ts` (XML batch, relevé mock, soldes, audit) + 4 implémentations (`AwbAdapter` JSON Open Banking, `BmceAdapter` XML SFTP, `CihAdapter` JSON OpenAPI, `BpAdapter` SFTP) + `BanqueAdapterRegistry` (résolution par code, insensible casse). Tests `banque.registry.spec.ts` (4 banques, batch virement, relevé, soldes, PROD). BMCI/SGM/CAM/CFG à ajouter avec le même pattern. |
| M-INT-05 | e-facture DGI (2026-2027) | 🟡 | `efacture-dgi.adapter.ts` : `transmettre(payload)` mock (`EFAC-DGI-…`) + PROD placeholder. Coord `EfactureService` Round 2 §08 M-FIN-06 (calcul hash/QR côté finance, transmission côté integrations). Tests `efacture-dgi.adapter.spec.ts`. |
| M-INT-06 | Indices BTP01..xx via ANP/HCP CSV mensuel | 🟡 | `app/applications/erp/integrations/services/indices-btp-import.service.ts` : seed BTP01/BTP18/MO01 × 3 mois, parser CSV `code;periode;valeur;libelle` (séparateurs `;` `,` `\t`), `importCsv()` merge sur (code, periode) avec stats ajoutés/maj/ignorés, persistance localStorage, audit log, `indicesPourPeriode()` retourne `Map<string, number>` consommée par `FormuleRevisionKService`. Tests `indices-btp-import.service.spec.ts` (seed, parse, merge, intégration K). |
| M-INT-07 | OMPIC API (ICE/IF/RC) → autocomplétion création tiers | 🟡 | `ompic.adapter.ts` : `rechercherParIce()` + `rechercherParNom()` mock (5 entreprises seedées : Nafura BTP SARL, Min. Équipement, OCP, Holmarcom, Cimar) avec confiance `CERTIFIEE`/`PROBABLE`. Tests `ompic.adapter.spec.ts`. UI tiers à brancher (bouton « Vérifier OMPIC »). |
| M-INT-08 | Bureaux qualifications MA (qualif + classif BTP) | ❌ | Coord §06-etudes M-ETU-09 — référentiel public à intégrer. |
| M-INT-09 | WhatsApp Business API (notifications chefs chantier, Maroc WhatsApp-first) | 🟡 | `whatsapp.adapter.ts` : 8 templates pré-validés (APPROBATION_DEMANDE/RAPPEL, INCIDENT_HSE_AT, RELANCE_FACTURE_J15/J30/J45, LIVRAISON_BC, POINTAGE_RAPPEL), validation variables, `envoyerNotification()` mock (`WA-…`) + PROD placeholder Meta Cloud API. Tests `whatsapp.adapter.spec.ts` (templates, validation, envoi, PROD). |
| M-INT-10 | Google Drive / OneDrive / Dropbox synchro docs | ❌ | P2 |
| M-INT-11 | Outlook / Gmail / Calendar (événements chantier, OS, réunions) | ❌ | P2 |
| M-INT-12 | MS Project / Primavera P6 (export/import planning) | ❌ | P2 compatibilité BET |
| M-INT-13 | Bentley / AutoCAD / Revit (visionneuse + lien lots BIM L1+) | ❌ | P2 |
| M-INT-14 | Météo officielle MA (DMN) | ❌ | P2 justification intempérie |
| M-INT-15 | PowerBI / Looker / Tableau (API cube analytique) | ❌ | P3 |
| M-INT-16 | Comptabilité externe Sage 100/1000 (export FEC) | ❌ | P3 migration progressive |

## 17-maroc — 🟡 ~55% (Task 17 P0 + P1 socle MA)

> **2026-05-13** : `ma-validators.ts` (ICE/RIB clé 97/IF/CNSS/AMO/Patente/RC/phone-ma) + atoms ICE/RIB recâblés ; `FiscalSettingsService` étendu (catalogue TVA paramétrable persisté + `resolveTaux` exonération) ; `JoursFeriesMaService` + 5 ans de seeds civils & religieux ; `app/applications/erp/shared/data/` (`banques-ma`, `regions-ma`, `jours-feries-ma`) ; page `parametres-fiscal` persiste le catalogue TVA via `FiscalSettings.tvaRates` ; tests unitaires `ma-validators.spec.ts`, `fiscal-settings.service.spec.ts`, `jours-feries-ma.service.spec.ts`. Réutilise `RetenueSourceService` + `TimbreFiscalService` + CIMR `PaieEngineService` déjà en place.

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| M-MA-01 | **ICE, IF, RC, Patente, RIB, CNSS, AMO** partout (clients, fournisseurs, sous-traitants, employés, sociétés) + validation format (ICE 15, RIB 24, IF 8) | 🟡 | `shared/validators/ma-validators.ts` + spec (ICE 15, RIB 24 + clé 97 vérifiable, IF 7-8, CNSS/AMO 7-9, Patente 7-10, RC 4-8, phone MA E.164). Atoms `ice-input` + `rib-input` recâblés sur `isValidIce` / `isValidRib`. Reste : généraliser dans tous les formulaires tiers (clients, employés, ST) + atoms IF/CNSS/AMO dédiés. |
| M-MA-02 | **Retenue à la source 5 %** marchés publics (art. 158 CGI) — config par marché + calcul auto + déclaration trimestrielle | 🟡 | `RetenueSourceService` + `Marche.retenueSourceTaux` + page `/finance/declarations/retenue-source` (PDF + XML), seed `fc-013`. Reste : génération PDF officiel CGNC + bouton en série sur factures vente. |
| M-MA-03 | **Timbre fiscal** sur facture espèces > 100 MAD | 🟡 | `TimbreFiscalService` (0,25 % > 10 000 MAD, plafond 100 MAD, art. 252 CGI) + spec. Reste : intégrer sur quittance règlements + numéro de timbre. |
| M-MA-04 | TVA 20/14/10 % paramétrable + exonération marchés publics si applicable + autoliquidation | 🟡 | `FiscalSettings.tvaRates` (catalogue paramétrable 20/14/10/7/0, persisté localStorage) + `defaultTvaRate()`, `resolveTaux({ exonere })`, `findTvaRate(id)`. Page `parametres-fiscal` persiste désormais le catalogue. `TvaAutoliquidationService` inchangé (Round 1 6.7). |
| M-MA-05 | Régime TPCC (Promotion Paysage Audiovisuel) sur certains chantiers publics | ❌ | Légal niche |
| M-MA-06 | CIMR (retraite complémentaire cadres) calcul paie | 🟡 | `PaieEngineService` couvre déjà CIMR (3 % / 6 %) + `BAREME_PAIE_MA_2026.CIMR` + spec « cas cadre CIMR ». Reste : déclaration CIMR mensuelle dédiée (similaire DAMANCOM). |
| M-MA-07 | OPPCM (Outils Public de Passation des Commandes des MOA) — dépôt soumission dématérialisé | ❌ | Modernisation MA |
| M-MA-08 | CCAG-T marocain terminologie alignée (MOA, MOE, OS, PV, DGD, RG, RAS) | 🟡 | Globalement OK ; à vérifier |
| M-MA-09 | Calendrier hijri optionnel + jours fériés MA (Aïd, Trône, Marche Verte) | 🟡 | `shared/services/jours-feries-ma.service.ts` + seeds 2025-2030 (civils + Aïd Al Fitr / Adha / Mawlid / Mouharram) ; `isFerie` / `isOuvre` / `joursOuvres` / `addJoursOuvres` testés. Reste : conversion hijri (lib `moment-hijri`) + intégration date pickers. |
| M-MA-10 | Code marchés publics MA (décret 2-22-431) : seuils, modalités, transparence | ❌ | P2 compliance |
| M-MA-11 | Banques MA référentiel SWIFT + agences + validation RIB | 🟡 | `shared/data/banques-ma.ts` (10 banques : code 3 chiffres + SWIFT 8 + Open Banking flag) + `findBanqueByCode` ; clé RIB 97 vérifiable côté validators. Reste : agences. |
| M-MA-12 | Régions / Provinces / Communes marocaines (référentiel chantiers/tiers) | 🟡 | `shared/data/regions-ma.ts` — 12 régions + chefs-lieux + provinces phares ; `findRegionByCode/Name`. Reste : ~1500 communes (import HCP). |
| M-MA-13 | Multi-devises (MAD primaire + EUR/USD fournisseurs étrangers acier/équipements) | ❌ | P2 réalisme |
| M-MA-14 | Calendrier prière chantier (option) | ❌ | P3 différenciateur culturel |

---

## Récapitulatif

| Sévérité | Total | ✅ FAIT | 🟡 PARTIEL | ❌ MANQUANT |
|----------|-------|---------|------------|-------------|
| **P0** | 26 | 0 | 0 | 26 |
| **P1** | 94 | 0 | 14 | 80 |
| **P2** | 49 | 0 | 0 | 49 |
| **P3** | 18 | 0 | 0 | 18 |
| **TOTAL** | **187** | **0** | **14** | **173** |

> Les 14 items 🟡 sont des features déjà partiellement implémentées par le Round 1 et qui nécessitent **enrichissement** plutôt que création.

---

## Convention de mise à jour

À chaque PR qui touche un item `M-XX` :

1. Mettre à jour la **colonne `Statut`** (✅ / 🟡 / ❌ / 🔄)
2. Remplir la **colonne `Évidence / Reste à faire`** avec :
   - Date `YYYY-MM-DD`
   - Agent (`R2-XX`)
   - Référence fichier(s) clé(s) + ligne(s)
   - Reste éventuel
3. Mettre à jour la ligne **TOTAL** en bas
4. Mettre à jour le compteur **Récapitulatif**
5. Ajouter une entrée dans la section ci-dessous

## Journal de mises à jour

| Date | Agent | Changement |
|------|-------|------------|
| 2026-05-13 | Cursor agent | **10-hse** : route `/qualite` mirror HSE ; PHS ; PPSPS sections ; incidents CNSS DAT maquette ; NC CAPA ; `IncidentService` / `HseKpiService` + tests ; e2e qualite. |
| 2026-05-13 | Cursor agent | **17-maroc** Task 17 : socle MA — `ma-validators.ts` (ICE/RIB clé 97/IF/CNSS/AMO/Patente/RC/phone-ma) + atoms recâblés, `FiscalSettings.tvaRates` paramétrable + `resolveTaux({ exonere })`, `JoursFeriesMaService` + seeds civils & religieux 2025-2030, référentiels `banques-ma`/`regions-ma`, page `parametres-fiscal` persiste catalogue TVA, tests unitaires (validators, fiscal settings, jours fériés). |
| 2026-05-13 | Cursor agent | **16-integrations** Task 16 : périmètre `app/platform/core/integrations/` + `app/applications/erp/integrations/services/` — pattern adapter `IntegrationMode` (MOCK ↔ PROD) avec audit log automatique. Adapters DGI SIMPL-IS, CNSS DAMANCOM, CNSS DAT, e-facture DGI, OMPIC, WhatsApp Business + bank registry (AWB Open Banking JSON, BMCE XML SFTP, CIH OpenAPI JSON, BP SFTP) + service indices BTP01..xx (CSV ANP/HCP, merge `(code, periode)`, alimentation `FormuleRevisionKService`). 43 tests unitaires verts, `ng build` OK, `npm run lint:no-dollar` OK. |
