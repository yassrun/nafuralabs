# Prompts agents — finir le Round 2 ERP

> **Source de vérité :** `web/docs/specs/erp-audit-round-2-roadmap/00-PROGRESS.md` (snapshot **2026-05-13**).
> **Audit d'origine :** `web/docs/specs/ROUNDéAUDIT/AUDIT_round_2`.
> **Règles communes (à coller en tête de chaque session si besoin) :**
> - Workspace : `web/` (Angular ERP).
> - Pré-requis : **lire Round 1** (`docs/specs/erp-audit-roadmap/00-PROGRESS.md`) AVANT de coder. Beaucoup d'écrans existent et nécessitent **enrichissement** plutôt que création.
> - Après chaque lot : `ng build` (ou `npm run build` du package web) sans erreur ; tests ciblés si tu touches la logique métier ; `npm run lint:no-dollar` doit passer.
> - Mettre à jour **`00-PROGRESS.md`** (statut + colonne évidence + date + agent) quand une tâche est réellement terminée.
> - Rester dans le périmètre de l'agent ; éviter les refactors hors sujet.
> - Ne pas casser les fonctionnalités Round 1 déjà ✅.

---

## Carte d'affectation (rappel)

| Agent | Sections / IDs | Sprints cible |
|--------|----------------|---------------|
| **R2-01** | **§02 Chantiers** (M-CHA-01..16) + **§14 Transverse cœur** (M-TRA-01..03) | S1–S2 |
| **R2-02** | **§03 Achats** + **§06 Études** + **§07 Marchés BTP** | S5–S6 |
| **R2-03** | **§04 Stock** + **§05 Matériel** | S3–S7 |
| **R2-04** | **§08 Finance** + **§09 RH** + **§17 Spécificités MA** | S3–S8 |
| **R2-05** | **§10 HSE** + **§11 Pilotage** + **§12 Approbations** + **§13 Admin** | S2–S4 |
| **R2-06** | **§15 Mobile** + **§16 Intégrations** + M-RH-01 | S5–S8 |
| **R2-07** | **§01 Dashboard** + **§14 Transverse reste** | S1–S2 + S11 |

---

## R2-01 — Chantiers & Transverse cœur (§02 + M-TRA-01..03)

**Reliquat documenté :** §02 entier (16 P0/P1) + M-TRA-01 régression + M-TRA-02 critique.

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-01 (périmètre Round 2 §02 Chantiers + §14 Transverse cœur M-TRA-01..03).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/02-chantiers.md` et `14-transverse.md`.
Pré-requis : lire `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` (Round 1) sections 02 et 03 pour comprendre l'existant.

Priorité absolue (S1–S2) :
1. **M-CHA-01** — Diagnostiquer pourquoi `/chantiers/:id` retourne « Chantier introuvable » (régression Round 2 alors que Round 1 marquait ✅). Hypothèses : mismatch ID seed (`ch-00x` vs `CH-2025-XXX`), routing param mal lu, ou `getChantierById` qui retourne undefined. Fix + test e2e qui itère sur les 6 chantiers de SEED_CHANTIERS.

2. **M-CHA-02** — Wizard création chantier 5 étapes (identité → client & marché → localisation → financier → équipe & cautions). Route `/chantiers/new`, CTA `+ Nouveau chantier` sur listing, intégration `SEED_CHANTIERS` + `erpAudit.log('CREATE', 'chantier', …)`. Test e2e.

3. **M-TRA-01** — Command palette `Ctrl+K` (régression Round 2). Diagnostiquer pourquoi inopérant. Indexer routes + entités (chantiers, fournisseurs, employés, BC, factures). Support `Ctrl+K`, `Cmd+K`, `Ctrl+P`. Fuzzy search (fuse.js). Tests multi-OS.

4. **M-TRA-02** — Drill-down clic-ligne universel. Audit toutes les utilisations `nf-data-table` / `nf-entity-listing`. Ajouter `rowClickable: true` par défaut. Cursor pointer + hover state visible. Test e2e itérant sur 5+ listings.

5. **M-TRA-03** — Coordination avec R2-05 (engine approbations §12). Ne pas implémenter ici, juste vérifier que la barre `<app-submit-approval-button>` (Round 1) est branchée sur les entités chantier (situations, avenants).

Ensuite (S7–S10) :
6. **M-CHA-03** — 12 onglets fiche chantier
7. **M-CHA-04** — Équipe chantier (rôles + tel + photos)
8. **M-CHA-05** — Carte interactive Leaflet
9. **M-CHA-06** — e-signature MOE/MOA carnets (workflow tokenisé)
10. **M-CHA-07..08** — Photos géolocalisées + plans BIM/DWG/PDF
11. **M-CHA-09** — Registre risques (5×5 criticité)
12. **M-CHA-10** — Exports MS-Project / Primavera XML
13. **M-CHA-11** — Avancements mobile (coordination R2-06)
14. **M-CHA-15** — Fix bug marges `3.250 %` + drill-down budget engagements

Contraintes : ne pas casser le drill-down Gantt (Round 1 2.4). Garder convention codes `ch-00x` (mock) / `CH-2025-XXX` (UI label). Mettre à jour `00-PROGRESS.md` après chaque tâche.
```

---

## R2-02 — Achats / Études / Marchés BTP (§03 + §06 + §07)

**Reliquat documenté :** §03 entier (12 items), §06 entier (12 items), §07 enrichissement Round 1 (10 items).

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-02 (périmètre Round 2 §03 Achats + §06 Études + §07 Marchés BTP).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/03-achats.md`, `06-etudes.md`, `07-marches.md`.
Pré-requis : lire Round 1 06-marches-facturation (Marchés à ~94 %), achats existants.

Priorité absolue (S5–S6) :
1. **M-ACH-01** — 3-way matching BC ↔ BL ↔ Facture. Modèle `MatchingReception` + onglet « Réceptions » sur fiche BC + colonne « BC d'origine » sur réceptions + onglet « Matching » sur facture fournisseur. Seuils tolérance configurables. Blocage validation facture si écart > seuil.

2. **M-ACH-02** — Scoring AO. Matrice prix × délai × note × historique × Art. 187. Page `/achats/ao/:id/comparatif`. Bouton « Attribuer » génère BC depuis offre retenue.

3. **M-ETU-01** — DPU (déboursé sec). Composantes matière × MO × matériel × FG × marge. Calcul auto prix vente. Versioning DPU.

4. **M-ETU-02** — Métré → DPGF → Devis auto. Arbre hiérarchique 3 niveaux (lot/sous-lot/article). Génération 1-clic.

5. **M-MAR-02** — DGD auto depuis cumul situations + retenues + K + pénalités + reprises RG. PDF officiel CCAG-T. Test unitaire calcul.

6. **M-MAR-04** — OS (Ordre de Service) + impact délai + propagation planning.

7. **M-MAR-05** — Situations auto depuis avancements physiques + métré + K + pénalités. Brouillon préremplie validable.

Ensuite (S7–S10) :
8. **M-ACH-03..09** — Fournisseur 360°, workflow tracé DA→AO→BC→Réception→Facture, catalogue fournisseur, portail fournisseur, attestations légales auto, sous-traitance Art. 187, BC catalogue rapide
9. **M-MAR-01** — Avenants workflow propagation impact (budget/planning/cautions)
10. **M-MAR-03** — Cautions alerte expiration + workflow renouvellement/mainlevée
11. **M-MAR-06** — Avances de démarrage 10-30% + amortissement
12. **M-ETU-03..08** — Soumission AO client, courbe S, biblio prix avancée, mémoire technique, variantes, import BPU

Aussi : décider **fusion sidebar** « Marchés BTP » + « Marchés & Facturation » (M-MAR-01 Task 7.0).

Contraintes : conformité Art. 187 CGI sur sous-traitance, calculs K (Round 1) à conserver. Mettre à jour `00-PROGRESS.md`.
```

---

## R2-03 — Stock & Matériel (§04 + §05)

**Reliquat documenté :** §04 (12 items dont M-STK-04 🟡 Round 1 V2 démarré), §05 entier (11 items, modules absents M-MAT-01..02 P0).

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-03 (périmètre Round 2 §04 Stock + §05 Matériel).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/04-stock.md`, `05-materiel.md`.
Pré-requis : Round 1 §05 stock à 100 % (16 sous-routes existantes). NE PAS casser. Étendre.

Priorité absolue (S3–S4) :
1. **M-MAT-01** — Maintenance GMAO. Pages : plans préventifs (déclencheurs h/km/calendaire), OT (ordres travail), historique par engin. Coûts auto (pièces + MO). Alerte 3 entretiens à programmer cette semaine.

2. **M-MAT-02** — Carburant & Consommables. Carnet par engin, pleins avec jauge début/fin (détection vol), consommation L/h, refacturation chantier analytique.

Ensuite (S7) :
3. **M-MAT-03** — Fiche engin 360° (onglets identité, technique, affectations, maintenance, carburant, contrôles, conducteurs habilités, docs)
4. **M-MAT-04** — Locations externes vraies (contrats, états contradictoires entrée/sortie, échéances retour)
5. **M-MAT-05** — Planning matériel Gantt par engin × chantiers, détection conflits
6. **M-MAT-06** — Pointage matériel chantier (heures fonctionnement quotidien → coûts analytiques)
7. **M-MAT-07** — Contrôles réglementaires (VGP/CT/étalonnage) + blocage affectation si périmé

8. **M-STK-01** — Scanner mobile QR/code-barres (coordination R2-06 pour layer mobile). Workflows : réception BL, sortie stock, inventaire
9. **M-STK-02** — Réservation stock chantier
10. **M-STK-03** — Magasin chantier digital (entrée BC → sortie bon matières signé → inventaire hebdo)
11. **M-STK-04** — Étendre liaison conso↔budget Round 1 5.7 V2 : UI budget chantier affiche réalisé matière, drill-down ligne budget → sorties stock du poste
12. **M-STK-05..07** — Étiquetage QR, multi-emplacements par dépôt, lots avec date péremption (FEFO)

Contraintes : utiliser `Article.posteBudgetId` Round 1, ne pas casser `valorisation.facade.ts` ni `costing-methods`. Mettre à jour `00-PROGRESS.md`.
```

---

## R2-04 — Finance / RH / Spécificités MA (§08 + §09 + §17)

**Reliquat documenté :** §08 (14 items), §09 (14 items, M-RH-01 🟡), §17 (14 items, M-MA-01 🟡).

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-04 (périmètre Round 2 §08 Finance + §09 RH + §17 Spécificités MA).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/08-finance.md`, `09-rh.md`, `17-maroc.md`.
Pré-requis : Round 1 §08 Finance & SIMPL-IS/9421/1208 et §10 Paie/IGR/DAMANCOM solides. NE PAS casser. Étendre.

Priorité absolue (S3–S4) :
1. **M-MA-01** — ICE/IF/RC/Patente/RIB/CNSS/AMO **partout** : référentiels société, clients, fournisseurs, sous-traitants, employés. Étendre atomes Round 1 4.6 (`ice`/`rib`/`phone-ma`/`money-ma`). Validation algos contrôle (ICE 15 + clé, RIB 24 + clé).

2. **M-MA-02** — Retenue à la source 5 % marchés publics (art. 158 CGI). Config niveau marché, calcul auto sur situation, comptabilisation 4453, déclaration trimestrielle DGI.

3. **M-MA-03** — Timbre fiscal espèces > 100 MAD.

4. **M-RH-01** — Durcir pointage mobile chef chantier (coordination R2-06 pour PWA) : multi-pointage équipe (10 ouvriers en 1 min), géofencing, offline 7 jours robuste, conflits sync serveur.

Ensuite (S7–S8) :
5. **M-FIN-01** — Lettrage facture ↔ règlement (UI pivot, lettrage auto si paire évidente, partiel + délettrage)
6. **M-FIN-02** — Recouvrement : âge créances, relances J+15/30/45 email/SMS, mise en demeure PDF
7. **M-FIN-03** — Effets de commerce LCR/LCN portefeuille + escompte + impayés
8. **M-FIN-04** — Multi-banques XML virements (SEPA + AWB + BMCE + CIH + BP)
9. **M-FIN-05** — Rapprochement bancaire OFX/CSV avec matching auto
10. **M-FIN-06** — e-facture DGI (QR + signature + archive 10 ans) — préparer (législation 2026-2027)
11. **M-FIN-07** — Retenue à la source 5 % comptabilisation finance (cf M-MA-02 supra)
12. **M-FIN-09** — Caisses chantier (avances chef + justificatifs photo + refact analytique)

13. **M-RH-02** — Contrats auto (CDI/CDD/ANAPEC/intérim/chantier) + signature électronique
14. **M-RH-03** — Heures supplémentaires HS25/HS50/HS100 barèmes MA + intégration paie
15. **M-RH-04** — Frais de déplacement chantier (km, panier, hébergement)
16. **M-RH-05** — Carrière + formations + habilitations CACES/SST/électricité + alertes
17. **M-RH-08** — Congés compteur 1,5j/mois + validation hiérarchique + planning équipe
18. **M-RH-09** — Accidents du travail CNSS DAT 48h (coordination R2-05 HSE pour incident, R2-06 pour API)
19. **M-RH-10** — Maladies & arrêts IJSS CNSS

20. **M-MA-04** — TVA 20/14/10 % paramétrable + exonération marchés publics
21. **M-MA-06** — CIMR cadres (taux + plafond)
22. **M-MA-08** — CCAG-T terminologie audit i18n
23. **M-MA-09** — Calendrier hijri + jours fériés MA

Tests obligatoires :
- `paie-engine.service.spec.ts` étendu (HS, CIMR)
- `lettrage.service.spec.ts`
- `retenue-source.service.spec.ts`
- `ice.validator.spec.ts` (algo clé)

Contraintes : ne pas casser `FiscalSettingsService`, `TvaAutoliquidationService`, `PaieEngineService` (Round 1). Mettre à jour `00-PROGRESS.md`.
```

---

## R2-05 — HSE / Pilotage / Approbations / Admin (§10 + §11 + §12 + §13)

**Reliquat documenté :** 2 modules absents au runtime (`/qualite` + `/admin` → 404), engine workflow, brancher analytics 5 vues.

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-05 (périmètre Round 2 §10 HSE + §11 Pilotage + §12 Approbations + §13 Admin).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/10-hse.md`, `11-pilotage.md`, `12-approbations.md`, `13-admin.md`.
Pré-requis : Round 1 ces sections marquées partiellement ✅ mais audit Round 2 constate **modules HSE et Admin retournent 404 au runtime**. Diagnostiquer.

Priorité absolue (S2–S4) :
1. **Tâche 13.0** — Activer route `/admin` (actuellement 404). Créer hub + vérifier routing top-level + alias.
2. **Tâche 10.0** — Activer route `/qualite` (actuellement 404). Vérifier `HSE_ROUTES` importé dans app.routes, alias `/qualite` ↔ `/hse`.

3. **M-APR-01** — Engine workflow générique (entité × montant × rôles série/parallèle + délégation + SLA + escalade). Modèles `ApprovalWorkflow`, `EtapeWorkflow`, `ApprovalRequest`, `ApprovalEvent`. Service `ApprovalEngineService` testé unitairement.

4. **M-APR-02..03** — Brancher submit-approval-button sur 10 types entités (DA, AO, BC, FF, SIT, CONGE, PAIE, VIR, AVN, OS). Inbox approbateur avec « Demander complément », audit log immuable chaîné SHA-256.

5. **M-ADM-01** — Utilisateurs & Rôles RBAC granulaire (module × action × scope société/division/chantier). Guard `RbacGuard` + directive `*hasPermission`. 8 rôles BTP types seedés.

6. **M-ADM-02** — SSO OIDC (Entra ID, Google Workspace) + 2FA TOTP/SMS. Conserver Round 1 8.7 démo.

7. **M-ADM-03** — Sociétés / Entités multi-tenant. Étendre Round 1 SocieteService. Page `/admin/societes` CRUD. **Filtrer tous les mocks par `currentSocieteId`** (Round 1 backlog).

8. **M-ADM-04** — Paramètres société complets (ICE/IF/RC/Patente/CNSS/CNAEM/capitalSocial/RIBs multi/logo/adresses/exercices).

9. **M-ADM-05** — Référentiels manquants : clients, MOA, banques MA.

10. **M-PIL-01** — Brancher données réelles sur 5 vues Pilotage & Analyses (rentabilité, financier, stock, achats, RH). Aucune KPI à 0 si données existent. Drill-down depuis chaque KPI.

11. **M-PIL-05** — Cash-flow dynamique (vs projection linéaire bugée +658.148 MAD constante). Calcul réel depuis échéances situations + factures + salaires.

12. **M-HSE-01..04** — Activer modules :
    - Incidents/AT (registre, déclaration CNSS DAT 48h)
    - Non-conformités + CAPA
    - PPSPS par chantier (éditeur sections + PDF)
    - PHS générique société

Ensuite (S7–S10) :
13. **M-HSE-05..11** — Causerie 1/4h, audits HSE, EPI dotation, FDS, évacuation, KPIs HSE (TF1/TF2/TG), déclarations CNSS DAT (coord R2-06 API)
14. **M-APR-04..07** — Délégation absence, notifications multi-canal + escalade, matrice pouvoirs, approbation mobile 1-clic
15. **M-PIL-02..06** — Marges multi-axes, OPEX/CAPEX, reporting groupe, what-if simulator
16. **M-ADM-06..12** — Audit log UI, templates docs WYSIWYG, numérotation, paramètres fiscaux, mappings comptables, abonnements, backup

Contraintes : ne pas dupliquer `approval-rules.service.ts` (Round 1). Ne pas casser IAM existant. Mettre à jour `00-PROGRESS.md`.
```

---

## R2-06 — Mobile terrain & Intégrations (§15 + §16 + M-RH-01)

**Reliquat documenté :** PWA Round 1 13.6 démo → produit terrain robuste, et brancher API DGI/CNSS/banques/OMPIC/WhatsApp.

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-06 (périmètre Round 2 §15 Mobile/Terrain + §16 Intégrations).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/15-mobile.md`, `16-integrations.md`.
Pré-requis : Round 1 13.6 PWA démo (ngsw + photo IndexedDB) + Round 1 SIMPL-IS/DAMANCOM XML écrans.

Priorité absolue (S5–S6) :
1. **M-MOB-01** — App PWA terrain installable. Extend manifest + bouton « Installer » + layout dédié `/m/*` + détection mobile redirect. Lighthouse PWA ≥ 90.

2. **M-MOB-02** — Mode offline robuste avec Dexie.js. Tables typées (pointages, avancements, journaux, photos, attachements, incidents, caisses, pendingSync). Sync différée Service Worker. Gestion conflits dialog résolution. 7 jours offline supportés.

3. **M-MOB-03** — Géolocalisation + géofencing chantier (rayon configurable, refus pointage hors zone avec message clair).

4. **M-MOB-04** — Capture photo native avec compression `browser-image-compression` + préservation EXIF géotag + watermark optionnel.

5. **M-MOB-05** — Scanner QR/code-barres `@zxing/ngx-scanner` (réception BL, sortie stock, inventaire, matériel).

6. **M-MOB-06** — Signature canvas réutilisable (carnet attachement, PV réception, bon matières, contrat employé, état contradictoire location).

7. **M-INT-01** — Adapter DGI SIMPL-IS API + mode mock pour démo. Génération XML conforme schéma + audit log envoi.

8. **M-INT-02** — Adapter CNSS DAMANCOM API BAP + mode mock.

Ensuite (S7–S8) :
9. **M-INT-03** — CNSS DAT déclaration AT (coordination R2-04 + R2-05)
10. **M-INT-04** — API banques MA virements + relevés (AWB Open Banking, BMCE BoA, CIH OpenAPI, BP, BMCI, SGM, CAM, CFG). Adapter unique avec implémentations par banque.
11. **M-INT-05** — e-facture DGI (préparation API quand publié 2026-2027)
12. **M-INT-06** — Indices BTP01..xx ANP/HCP CSV import mensuel → table Indices (Round 1 K-formula)
13. **M-INT-07** — OMPIC API : autocompletion création tiers depuis ICE
14. **M-INT-08** — Bureaux qualifications MA (qualif + classif BTP)
15. **M-INT-09** — WhatsApp Business API (approbations, alertes HSE, relances factures, livraisons BC) + templates messages validés Meta

16. **M-MOB-07** — Notifications push FCM/APNs (Android + iOS + Web)

Coordination R2-04 : M-RH-01 pointage mobile dépend de M-MOB-01 + M-MOB-02 + M-MOB-03 + M-MOB-06.

Contraintes : ne pas casser `ngsw-config.json` ni pattern photo pointage Round 1. Pattern adapter testable (mock/prod). Mettre à jour `00-PROGRESS.md`.
```

---

## R2-07 — Dashboard & Transverse polish (§01 + §14 reste)

**Reliquat documenté :** §01 dashboard 8 items, §14 reste après M-TRA-01..03 traités par R2-01.

### Prompt (copier-coller)

```text
Tu es l'AGENT R2-07 (périmètre Round 2 §01 Dashboard + §14 Transverse reste).

Référence : `web/docs/specs/erp-audit-round-2-roadmap/01-dashboard.md`, `14-transverse.md` (M-TRA-04..20).
Pré-requis : R2-01 a livré M-TRA-01..03 (Ctrl+K + drill-down universel + workflow). R2-05 a livré M-APR-01..03.

Priorité (S2 — coordination R2-01) :
1. **M-TRA-08** — Notifications applicatives en français (régression labels EN). Audit i18n `notification-bell` + complétion clés FR/AR/EN.

2. **M-TRA-09** — Toggle langue + AR/RTL effectif (régression Round 2). Diagnostiquer pourquoi inopérant. Vérifier `LocaleService.applyLang`, `TranslateService.use(lang)`, `document.documentElement.lang/dir`. Test e2e RTL.

Ensuite (S7–S10) :
3. **M-DASH-03** — Drill-down KPI dashboard (tuiles cliquables → liste filtrée)
4. **M-DASH-01** — Personnalisation dashboard drag & drop par rôle (3 layouts par défaut seedés DG / Conducteur / Comptable)
5. **M-DASH-02** — Graphes & tendances (courbe CA cumul N vs N-1, sparklines marges, top 5 alerte, pyramide Bird)
6. **M-DASH-04** — Alertes temps réel centralisées (engagement >90%, situations >60j, cautions <30j, retard pointage >48h)
7. **M-DASH-05** — Filtres dashboard (société/chantier/période/MOA/métier)
8. **M-DASH-06** — Export PDF dashboard du jour

9. **M-TRA-04** — Généraliser exports CSV/XLSX/PDF (Round 1 12.1 partial → 100 % couverture)
10. **M-TRA-05** — Compléter templates impression PDF (devis, BC, facture, BL, situation, attachement, contrat ST, fiche paie, DGD, OS, reçu, mise en demeure, caution)
11. **M-TRA-06** — Filtres avancés + vues sauvegardées par utilisateur (modèle `VueSauvegardee`)
12. **M-TRA-07** — Recherche full-text + OCR (étendre Ctrl+K avec contenu PDF + Tesseract.js sur upload BL/factures)
13. **M-TRA-10** — Mode sombre (tokens CSS variables `[data-theme="dark"]` + toggle + persistance + auto via `prefers-color-scheme`)
14. **M-TRA-11** — États vides/loading/erreur unifiés sur pages liste ad hoc + détail
15. **M-TRA-12** — Audit toasts CRUD universels (toutes mutations émettent)
16. **M-TRA-13** — Aide contextuelle métier (composant `<help-tooltip>`, glossaire 50+ entrées BTP MA, 3+ termes avec tooltip par écran métier)
17. **M-TRA-14** — Tour produit / Onboarding premier login (Driver.js, 8 étapes shell + modules clés)

Polish S11–S12 :
18. **M-DASH-07..08** — Widgets HSE & RH, mode TV
19. **M-TRA-15..20** — Historique/restauration, commentaires + @mentions, pièces jointes universelles, activity feed, bulk actions, automation

Contraintes : ne pas casser DS Round 1, garder `--nf-text-*` (Round 1 (typo)). Coordination R2-01 : ne pas modifier Ctrl+K (M-TRA-01) traité par R2-01.

Mettre à jour `00-PROGRESS.md`.
```

---

## Note coordination cross-agents

### R2-01 ↔ R2-05 ↔ R2-07
- M-TRA-01 (Ctrl+K) → R2-01
- M-TRA-02 (drill universel) → R2-01
- M-TRA-03 (workflow approbation transversal) = R2-05 (engine §12)
- M-TRA-04..20 → R2-07
- → R2-01 livre S1–S2, R2-05 livre S2–S4, R2-07 enrichit S7–S12

### R2-04 ↔ R2-05 ↔ R2-06
- AT/CNSS DAT : R2-04 (RH) coordonne avec R2-05 (HSE) et R2-06 (API CNSS DAT)
- Sociétés multi-tenant : R2-05 livre `/admin/societes`, R2-04 utilise `currentSocieteId` pour filtrer mocks finance/RH

### R2-02 ↔ R2-04
- e-facture (M-INT-05 + M-FIN-06) : R2-04 prépare modèle finance, R2-06 livre adapter API
- Retenue source : R2-04 finance + R2-02 marché (config niveau marché)

### R2-03 ↔ R2-06
- M-STK-01 scanner mobile = R2-03 (workflow stock) + R2-06 (layer mobile + scanner librairie)

### R2-01 ↔ R2-06
- M-CHA-11 avancements mobile = R2-01 (workflow chantier) + R2-06 (layer mobile)
- M-CHA-07 photos géolocalisées = R2-01 (galerie comparaison) + R2-06 (capture native + EXIF)

---

## Anti-patterns à éviter (rappel)

- ❌ **Refaire le Round 1** : avant de coder, lire `docs/specs/erp-audit-roadmap/00-PROGRESS.md` pour identifier ce qui existe.
- ❌ **Toucher 2 plomberies en même temps** : ne pas modifier `13-admin` et `12-approbations` dans la même PR.
- ❌ **Mock multiplié** : continuer d'utiliser `SEED_CHANTIERS` (Round 1). Nouveaux datasets référencent `ch-00x`/`CH-2025-00x`.
- ❌ **i18n hardcoded** : aucun string FR inline, ni label EN.
- ❌ **`| currency` Angular pipe** : continuer `| mad` (lint:no-dollar).
- ❌ **Mobile en after-thought** : penser PWA/offline dès la conception des nouveaux écrans.
- ❌ **Skip tests** : chaque tâche P0/P1 inclut son test e2e Playwright + unit Jasmine si calcul fiscal/social/K.
