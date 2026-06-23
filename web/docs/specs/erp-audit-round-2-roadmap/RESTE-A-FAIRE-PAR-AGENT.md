# Reste à faire — par agent (ERP web) — **Round 2**

> **Source de vérité :** [`00-PROGRESS.md`](00-PROGRESS.md) (snapshot **2026-05-13**).
> **Audit d'origine :** [`docs/specs/ROUNDéAUDIT/AUDIT_round_2`](../ROUNDéAUDIT/AUDIT_round_2).
> **Carte agents :** [`AGENT_COMPLETION_PROMPTS.md`](AGENT_COMPLETION_PROMPTS.md) (R2-01–R2-07).
> Mettre à jour ce fichier quand une tâche est bouclée ou réaffectée.

---

## R2-01 — Chantiers & Transverse cœur (§02 + M-TRA-01..03)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-CHA-01 | **Fiche détail chantier accessible** | **P0** | Diagnostic régression Round 2 : `chantier-detail.page.ts` affiche « Chantier introuvable » sur drill-down. Vérifier `getChantierById` + `paramMap` + alignement IDs `ch-00x`. |
| M-CHA-02 | **Wizard création chantier 5 étapes** | **P0** | Route `/chantiers/new`, CTA listing, 5 étapes (identité → client/marché → localisation → financier → équipe/cautions). Préremplir depuis devis gagné. |
| M-TRA-01 | **Command palette Ctrl+K** | **P0** | Régression Round 2 — non fonctionnel. Diagnostiquer, indexer routes + entités, fuzzy search, support Ctrl/Cmd+K, tests multi-OS. |
| M-TRA-02 | **Drill-down clic-ligne universel** | **P0** | Toutes les tables cliquables (`rowClickable: true` par défaut). Audit `nf-data-table` / `mat-table` / `nf-entity-listing`. |
| M-TRA-03 | Workflow approbation transversal | **P0** | Coordination R2-05 (engine §12). |
| M-CHA-03 | Onglets fiche chantier (12) | P1 | Vue d'ensemble / Marché / Planning / Budget / Avancement / Achats / Stock / Matériel / RH / Documents / Journal+Attachements / Risques |
| M-CHA-04 | Équipe chantier | P1 | Rôles + tel + photos + badges, annuaire opérationnel |
| M-CHA-05 | Carte interactive Leaflet | P1 | Pins géolocalisés par chantier, popup mini-fiche |
| M-CHA-06 | e-signature MOE/MOA attachement | P1 | Workflow tokenisé `/sign/:token`, canvas signature, hash + horodatage, PDF embarqué |
| M-CHA-07 | Photos géolocalisées | P1 | Galerie par jour/zone, EXIF, mode comparaison avant/après slider |
| M-CHA-08 | Plans BIM/DWG/PDF visionneuse | P1 | pdf.js, versioning, annotations |
| M-CHA-09 | Registre risques | P1 | Matrice 5×5 criticité, propriétaire, plan d'action |
| M-CHA-10 | Exports planning MS-Project/Primavera | P1 | XML, XLSX, import inverse |
| M-CHA-11 | Avancements mobile offline | P1 | Coord R2-06 (PWA/layer) |
| M-CHA-15 | Budget drill engagements + fix bug `3.250 %` | P2 | Fix calcul marge + drill ligne budget → engagements (BC, ST, paie) |
| M-CHA-12/13/14/16 | As-built, météo auto, réceptions, calendrier Outlook | P2/P3 | À traiter S11+ |

---

## R2-02 — Achats / Études / Marchés BTP (§03 + §06 + §07)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-ACH-01 | **3-way matching BC↔BL↔Facture** | **P0** | Modèle `MatchingReception`, onglet réceptions sur BC, onglet matching sur facture, seuils tolérance, blocage si écart > seuil |
| M-ACH-02 | **Scoring AO + recommandation** | **P0** | Matrice prix/délai/note/historique/Art.187, page comparatif, attribution → BC |
| M-ETU-01 | **DPU déboursé sec** | **P0** | Composantes matière × MO × matériel × FG × marge, calcul auto, versioning |
| M-ETU-02 | **Métré → DPGF → Devis auto** | **P0** | Arbre 3 niveaux (lot/sous-lot/article), génération 1-clic |
| M-MAR-02 | **DGD auto** | P1 | Cumul situations + retenues + K + pénalités + reprises RG, PDF officiel |
| M-MAR-04 | **OS** | P1 | Émission + AR + impact délai propagé planning |
| M-MAR-05 | **Situations auto** | P1 | Depuis avancements physiques + métré + K + pénalités, brouillon validable |
| M-ACH-03..09 | Fournisseur 360°, workflow tracé, catalogue, portail, attestations, Art.187, BC catalogue | P1 | Backlog S7–S10 |
| M-MAR-01 | Avenants workflow propagation | P1 | Impact budget/planning/cautions à la signature |
| M-MAR-03 | Cautions alerte + renouvellement/mainlevée | P1 | Workflow banque |
| M-MAR-06 | Avances démarrage 10-30 % + amortissement | P1 | Caution restitution liée |
| M-ETU-03..08 | Soumission AO client, courbe S, biblio, mémoire, variantes, import BPU | P1 | Backlog |
| **Tâche 7.0** | **Fusion sidebar Marchés** | **P0** | « Marchés BTP » + « Marchés & Facturation » → 1 seule entrée |
| M-ACH-10..12 | Cadre marchés publics, dashboard achats, IA | P2/P3 | S11+ |
| M-MAR-07..10 | ST déclarative, réception, indices auto, litige | P2/P3 | S11+ |
| M-ETU-09..12 | Qualifs, bordereaux MA, comparatif AO, IA mémoire | P2/P3 | S11+ |

---

## R2-03 — Stock & Matériel (§04 + §05)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-MAT-01 | **Maintenance GMAO** | **P0** | Plans préventifs (h/km/cal), OT (corrective + préventive), coûts auto, alertes |
| M-MAT-02 | **Carburant & Consommables** | **P0** | Carnet par engin, jauges, détection vol, refact analytique chantier |
| M-MAT-03 | Fiche engin 360° | P1 | Identité + technique + affectations + maintenance + carburant + contrôles + conducteurs |
| M-MAT-04 | Locations externes vraies | P1 | Contrats, états contradictoires entrée/sortie, échéances retour |
| M-MAT-05 | Planning matériel Gantt | P1 | Détection conflits |
| M-MAT-06 | Pointage matériel chantier | P1 | Heures fonctionnement → coût analytique |
| M-MAT-07 | Contrôles réglementaires (VGP/CT/étalonnage) | P1 | Blocage affectation si périmé |
| M-STK-01 | Scanner mobile (coord R2-06) | P1 | Réception BL + sortie + inventaire |
| M-STK-02 | Réservation stock chantier | P1 | Disponible = Stock - Réservations |
| M-STK-03 | Magasin chantier digital | P1 | Entrée BC → sortie bon matières signé → inventaire hebdo |
| M-STK-04 | Liaison conso↔budget (étendre Round 1 V2) | 🟡 P1 | UI budget chantier affiche réalisé matière + drill |
| M-STK-05..07 | Étiquetage QR, multi-emplacements, lots péremption (FEFO) | P1 | Backlog S7 |
| M-MAT-08..11 | GPS/télémétrie, CACES, TCO, prédictif IA | P2/P3 | S11+ |
| M-STK-08..12 | Transfert workflow, CMP/FIFO, ABC, réappro auto, carte tournée | P2/P3 | S11+ |

---

## R2-04 — Finance / RH / Spécificités MA (§08 + §09 + §17)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-MA-01 | **ICE/IF/RC/Patente/RIB/CNSS/AMO partout** | 🟡 **P0** | Round 1 4.6 atomes ; étendre à TOUS les référentiels + validation algos clés |
| M-MA-02 | **Retenue à la source 5 % marchés publics** | **P0** | Config marché, calcul situation, comptabilisation 4453, déclaration trimestrielle |
| M-MA-03 | **Timbre fiscal espèces > 100 MAD** | **P0** | Détection auto + PDF avec timbre |
| M-RH-01 | **Pointage mobile chantier robuste** | 🟡 **P0** | **Partiel 2026-05-13** : géofencing, multi-sélection équipe, signatures collectif/individuel, batch id, seeds geo `ch-001`/`ch-002`. Reste : API prod, Dexie 7j Task 15, e2e devices dédiés. |
| M-FIN-01 | Lettrage facture ↔ règlement | P1 | UI pivot + lettrage auto + partiel + délettrage |
| M-FIN-02 | Recouvrement / relances | P1 | Âge créances + J+15/30/45 email/SMS + mise en demeure PDF |
| M-FIN-03 | Effets de commerce LCR/LCN | P1 | Portefeuille + escompte + impayés |
| M-FIN-04 | Multi-banques XML virements | P1 | SEPA + AWB + BMCE + CIH + BP + autres |
| M-FIN-05 | Rapprochement OFX/CSV | P1 | Matching auto ≥ 80 % |
| M-FIN-06 | e-facture DGI (préparation) | P1 | QR + signature + archive 10 ans |
| M-FIN-07 | RAS 5 % comptabilisation | P1 | Cf M-MA-02 |
| M-FIN-09 | Caisses chantier | P1 | Avance chef + justificatif photo + refact analytique |
| M-RH-02 | Contrats auto + signature | P1 | 5 templates (CDI/CDD/ANAPEC/intérim/chantier) |
| M-RH-03 | Heures supp HS25/HS50/HS100 | P1 | Barèmes MA + intégration paie |
| M-RH-04 | Frais de déplacement | P1 | Km + panier + hébergement + refact |
| M-RH-05 | Carrière + formations + habilitations | P1 | Entretiens + CACES/SST + alertes |
| M-RH-08 | Congés 1,5j/mois + validation | P1 | Compteur auto + workflow + planning équipe |
| M-RH-09 | AT CNSS DAT 48h | P1 | Coord R2-05 HSE + R2-06 API CNSS |
| M-RH-10 | Maladies IJSS CNSS | P1 | Suivi IJSS + contre-visite |
| M-MA-04 | TVA paramétrable + exonération | 🟡 P1 | Étendre `FiscalSettingsService` |
| M-MA-06 | CIMR cadres | P1 | Calcul paie + déclaration CIMR mensuelle |
| M-MA-08 | CCAG-T terminologie | 🟡 P1 | Audit i18n vocabulaire |
| M-MA-09 | Calendrier hijri + jours fériés MA | P1 | Toggle date picker + impact planning |
| M-FIN-08/10..14 | Auto-entrepreneur, analytique, budget tréso, clôture, liasse, open banking | P1/P2/P3 | Backlog |
| M-RH-06/07/11..14 | Sécurité paie, intérim, self-service, TFP, médecine, surveys | P1/P2/P3 | Backlog |
| M-MA-05/07/10..14 | TPCC, OPPCM, code marchés, banques SWIFT, régions, multi-devises, prière | P1/P2/P3 | Backlog |

---

## R2-05 — HSE / Pilotage / Approbations / Admin (§10 + §11 + §12 + §13)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| **Tâche 13.0** | **Activer route `/admin`** | **P0** | Hub + routing + alias. Bloque vente B2B. |
| **Tâche 10.0** | **Activer route `/qualite`** | **P0** | HSE_ROUTES dans app.routes + alias `/qualite` ↔ `/hse`. Bloque MOA publics. |
| M-APR-01 | **Engine workflow générique** | **P0** | Modèles + service testé. 5 workflows seedés. |
| M-APR-02 | **Approbations multi-types** | **P0** | 10 types entités branchés. |
| M-APR-03 | **Inbox approbateur + audit log immuable** | **P0** | Demande complément + hash SHA-256 chaîné. |
| M-ADM-01 | **Users & Rôles RBAC granulaire** | **P0** | Module × action × scope + Guard + directive + 8 rôles BTP seedés |
| M-ADM-02 | **SSO + 2FA** | **P0** | OIDC (Entra/Google) + TOTP/SMS |
| M-ADM-03 | **Sociétés multi-tenant** | **P0** | CRUD + filtre mocks `currentSocieteId` |
| M-ADM-04 | **Paramètres société complets** | **P0** | ICE/IF/RC/Patente/CNSS/CNAEM/capital/RIBs/logo/adresses/exercices |
| M-ADM-05 | **Référentiels clients/MOA/banques** | **P0** | Avec champs MA |
| M-PIL-01 | **Brancher données 5 vues** | **P0** | Rentabilité/financier/stock/achats/RH — aucune KPI à 0 |
| M-PIL-05 | **Cash-flow dynamique** | P1 | Fix projection linéaire bugée `+658.148 MAD × 10` |
| M-HSE-01..04 | **Incidents/AT, NC+CAPA, PPSPS, PHS** | **P0** | Modules à activer (Round 1 stubs existants) |
| M-HSE-05..11 | Causerie, audits, EPI, FDS, évac, KPIs, déclarations CNSS DAT | P1 | Backlog S7–S10 |
| M-APR-04..07 | Délégation, notifications + escalade, matrice pouvoirs, mobile 1-clic | P1 | Backlog |
| M-PIL-02..06 | Marges multi-axes, OPEX/CAPEX, groupe, what-if | P1 | Backlog |
| M-ADM-06..12 | Audit log UI, templates docs WYSIWYG, numérotation, fiscal, mappings, abos, backup | P1 | Backlog |
| M-HSE-12..14 | ISO 9001/14001/45001, environnement, levée réserves QHSE | P2 | S11+ |
| M-PIL-07..09 | Exports CAC, benchmark, alertes IA | P2/P3 | S11+ |
| M-APR-08 | Audit trail hash chaîné (preuve intégrité) | P2 | S11+ |
| M-ADM-13..16 | API publique, import migration, locales hijri, white-label | P2/P3 | S11+ |

---

## R2-06 — Mobile terrain & Intégrations (§15 + §16)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-MOB-01 | **App PWA terrain installable** | **P0** | Manifest + bouton install + layout `/m/*` + détection mobile redirect |
| M-MOB-02 | **Mode offline robuste** | **P0** | Dexie.js + tables typées + Service Worker sync + résolution conflits + 7j offline |
| M-MOB-03 | Géolocalisation + géofencing | P1 | Rayon configurable, refus pointage hors zone |
| M-MOB-04 | Capture photo + EXIF géotag | P1 | Compression `browser-image-compression`, watermark |
| M-MOB-05 | Scanner QR/code-barres | P1 | `@zxing/ngx-scanner` |
| M-MOB-06 | Signature canvas réutilisable | P1 | Composant générique |
| M-INT-01 | **DGI SIMPL-IS API** | 🟡 **P0** | Adapter prêt prod + mode mock (Round 1 XML OK) |
| M-INT-02 | **CNSS DAMANCOM API** | 🟡 **P0** | Adapter prêt prod + mode mock (Round 1 XML OK) |
| M-INT-03 | CNSS DAT AT | P1 | Coord R2-04 + R2-05 |
| M-INT-04 | API banques MA virements + relevés | P1 | Adapter par banque (AWB/BMCE/CIH/BP/BMCI/SGM/CAM/CFG) |
| M-INT-05 | e-facture DGI 2026-2027 | P1 | Préparation API |
| M-INT-06 | Indices BTP01..xx ANP/HCP CSV | P1 | Import mensuel → table Indices |
| M-INT-07 | OMPIC autocompletion ICE | P1 | Création tiers |
| M-INT-08 | Bureaux qualifications MA | P1 | Référentiel qualif + classif |
| M-INT-09 | WhatsApp Business API | P1 | Approbations, alertes HSE, relances factures |
| M-MOB-07 | Notifications push FCM/APNs | P2 | Backlog |
| M-MOB-08 | Mode très basse bande passante | P2 | Backlog |
| M-INT-10..14 | Drive, Outlook, MS-Project, BIM, météo DMN | P2 | S11+ |
| M-INT-15..16 | PowerBI, Sage migration FEC | P3 | S11+ |

---

## R2-07 — Dashboard & Transverse polish (§01 + §14 reste)

| ID | Tâche | Sévérité | Reste / actions |
|----|--------|----------|-----------------|
| M-TRA-08 | Notifications applicatives en français | 🟡 P1 | Régression labels EN — audit i18n + complétion FR/AR/EN |
| M-TRA-09 | Toggle langue + AR/RTL effectif | 🟡 P1 | Régression Round 2 — diagnostiquer et fix |
| M-DASH-03 | Drill-down KPI tuiles | P1 | 8 tuiles → 8 routes drillables |
| M-DASH-01 | Personnalisation drag & drop | P1 | 3 layouts par défaut seedés (DG/Conducteur/Comptable) |
| M-DASH-02 | Graphes & tendances | P1 | CA cumul N/N-1, sparklines, top 5 alerte, pyramide Bird |
| M-DASH-04 | Alertes temps réel | P2 | Engagement >90 %, situation >60j, caution <30j, retard pointage >48h |
| M-DASH-05 | Filtres dashboard multi-axes | P2 | Société + chantier + période + MOA + métier |
| M-DASH-06 | Export PDF dashboard du jour | P2 | A4 avec en-tête société + KPIs + top 5 chantiers |
| M-DASH-07 | Widgets HSE & RH | P3 | TF/TG, pyramide âges, taux absentéisme |
| M-DASH-08 | Mode TV | P3 | Plein écran salle pilotage |
| M-TRA-04 | Exports universels listings | P1 | Round 1 12.1 partial → 100 % couverture |
| M-TRA-05 | Templates impression PDF | P1 | Devis, BC, facture, situation, attachement, contrat ST, fiche paie, DGD, OS, reçu, mise en demeure, caution |
| M-TRA-06 | Filtres avancés + vues sauvegardées | P1 | Modèle `VueSauvegardee` + partage |
| M-TRA-07 | Recherche full-text + OCR | P1 | Étendre Ctrl+K avec contenu PDF + Tesseract.js |
| M-TRA-10 | Mode sombre | P1 | CSS variables + toggle + persistance + auto |
| M-TRA-11 | États vides/loading/erreur unifiés | 🟡 P1 | Pages ad hoc hors `nf-entity-listing` + détail |
| M-TRA-12 | Toasts CRUD universels | 🟡 P1 | Audit mutations sans toast |
| M-TRA-13 | Aide contextuelle métier (50+ termes) | P1 | Composant `<help-tooltip>` + glossaire BTP MA |
| M-TRA-14 | Onboarding premier login | 🟡 P1 | Driver.js, 8 étapes shell + modules clés |
| M-TRA-15..20 | Historique, commentaires, pièces jointes, activity feed, bulk, automation | P2/P3 | S11+ |

---

## Backlog transversal (tout agent)

- **NumberingService** : étendre aux nouveaux types doc (OS, DGD, OT, états contradictoires, etc.) selon Round 2.
- **erpAudit** : couvrir les nouveaux flux (approbations, sociétés, paramètres fiscaux, etc.).
- **E2E/Perf** : conserver verts les jobs documentés (`e2e`, `e2e:a11y`, Lighthouse, charge, mobile emulation).
- **i18n** : packs AR à compléter au fil de l'implémentation (cible 95 % couverture S12).
- **Multi-tenant** : tracer `currentSocieteId` dans `erpAudit.log()` partout (M-ADM-03 backlog Round 1 toujours ouvert).

---

## Mise à jour

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | Agent | Création depuis `00-PROGRESS.md` + audit Round 2 du 2026-05-13. |
