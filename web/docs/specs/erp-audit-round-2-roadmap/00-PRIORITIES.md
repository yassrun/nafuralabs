# Priorités & Planning — Audit ERP **Round 2**

> Source : `docs/specs/ROUNDéAUDIT/AUDIT_round_2` (audit du **2026-05-13**).
> Hypothèse : Round 1 implémenté à ~68 %. Round 2 = finalisation produit pour mise en production B2B.

## Sévérités

- **P0 BLOQUANT** : empêche la **vente** ou la **mise en production** (modules absents, fiche chantier cassée, app mobile inexistante, RBAC absent). Doit être traité dans les 6 prochaines semaines.
- **P1 MAJEUR** : enrichissement métier indispensable pour rester crédible face à Sage/Batigest/Odoo BTP. Sprints 7–10.
- **P2 MOYEN** : qualité produit, conformité avancée, polish. Sprints 11–12.
- **P3 MINEUR** : différenciateurs IA, white-label, finition.

## Règle d'or

`13-admin` (RBAC + sociétés + référentiels) **EST UN PRÉREQUIS** de la mise en production multi-tenant. `12-approbations` (engine workflow) débloque la gouvernance entreprise. `14-transverse` (drill-down universel + Ctrl+K + i18n AR) débloque la productivité au quotidien. **Ces trois plomberies passent en premier**, en parallèle de `02-chantiers` (fiche détail réparée) qui débloque la démo commerciale.

---

## 5 points bloquants identifiés par l'audit Round 2 (§8 conclusion)

> « Si tu m'écoutes, traite ces 5 points pendant les 6 prochaines semaines et tu auras un produit vendable. Le reste est de l'enrichissement progressif. »

1. **M-ADM** (Administration absente) → bloque la **vente B2B**
2. **M-HSE** (Qualité & HSE absent) → bloque les **MOA publics + grands MOA privés** (OCP, ONEE, ADM, Holdings)
3. **M-APR** (Approbations sans engine) → bloque la **gouvernance entreprise**
4. **M-CHA-01** (Fiche chantier cassée) → bloque la **démo commerciale**
5. **M-MOB-01** (App mobile terrain) → bloque **l'usage terrain réel**

---

## Sprints suggérés (6 sprints, 12 semaines)

### S1–S2 — Plomberie produit & démo commerciale
**Goal** : produit démontrable + bases pour multi-tenant et gouvernance.

- 🚀 **M-CHA-01** + **M-CHA-02** : fiche chantier accessible (8 onglets) + wizard création
- 🚀 **M-TRA-02** : drill-down clic-ligne universel (toutes tables cliquables)
- 🚀 **M-TRA-01** : command palette `Ctrl+K` fonctionnelle (routes + entités)
- 🚀 **M-APR-01..03** : engine workflow approbations (générique, multi-types, inbox)
- 🚀 **M-TRA-08** : notifications applicatives en français (correction labels EN)
- 🚀 **M-TRA-09** : toggle langue effectif + bilingue AR (RTL)

**Livrable démo** : navigation chantier sans bug, recherche globale, lignes cliquables, premiers workflows d'approbation, UI bilingue.

### S3–S4 — Modules absents critiques
**Goal** : combler les trous fonctionnels qui bloquent vente B2B et MOA publics.

- 🚀 **M-ADM-01..05** : Module Administration (utilisateurs/rôles RBAC, SSO + 2FA, sociétés multi-entité, paramètres légaux, référentiels)
- 🚀 **M-HSE-01..04** : Module HSE (incidents/AT, NC + CAPA, PPSPS, PHS)
- 🚀 **M-HSE-05..11** : HSE enrichi (causerie, audits, EPI, FDS, évacuation, KPIs, déclarations CNSS DAT)
- 🚀 **M-PIL-01** : brancher données réelles sur 5 vues Pilotage & Analyses
- 🚀 **M-MAT-01** + **M-MAT-02** : GMAO maintenance préventive/corrective + carburant & consommables
- 🚀 **M-MA-01** : ICE/IF/RC/Patente/RIB/CNSS/AMO partout + validation formats

**Livrable démo** : ERP vendable B2B Maroc avec gouvernance, HSE conforme MOA publics, parc matériel GMAO.

### S5–S6 — Mobile terrain + métier BTP profond
**Goal** : passage en **usage terrain réel** + couverture métier BTP avancée.

- 🚀 **M-MOB-01** + **M-MOB-02** : App PWA terrain + mode offline IndexedDB
- 🚀 **M-RH-01** : pointage mobile chantier (photo, géoloc, signature, offline)
- 🚀 **M-MOB-03..06** : géoloc, photo géotag, scanner QR, signature canvas
- 🚀 **M-CHA-06** + **M-CHA-07** + **M-CHA-08** : e-signature MOE/MOA, photos géolocalisées, visionneuse plans
- 🚀 **M-ACH-01** + **M-ACH-02** : 3-way matching (BC↔BL↔Facture) + scoring AO
- 🚀 **M-ETU-01** + **M-ETU-02** : DPU (déboursé sec) + métré → DPGF → devis auto
- 🚀 **M-MA-02** + **M-MA-03** : retenue à la source 5 % + timbre fiscal espèces

**Livrable démo** : un chef chantier peut **réellement** utiliser l'app sur site (3G/4G ou offline). Vente faisable face à Sage/Batigest sur le terrain métier.

---

## S7–S10 — Enrichissement métier P1 (sprints 7–10)

À découper en lots de 2–3 sprints selon vélocité réelle. Objectif : passer de **MVP vendable** (S6) à **ERP compétitif** (S10).

### Lot finance / fiscal MA
- M-FIN-01 Lettrage facture ↔ règlement
- M-FIN-02 Recouvrement / relances email/SMS
- M-FIN-03 Effets de commerce (LCR/LCN)
- M-FIN-04 Multi-banques (XML virements AWB/BMCE/CIH/BP)
- M-FIN-05 Rapprochement OFX/CSV automatique
- M-FIN-06 e-facture DGI 2026-2027 (QR + signature + archive 10 ans)
- M-FIN-07 Retenue à la source 5 %
- M-FIN-08 Régime auto-entrepreneur fournisseurs
- M-FIN-09 Caisses chantier (avances chef + justificatifs photo)
- M-INT-01 SIMPL-IS API DGI (XML mensuel TVA)
- M-INT-02 DAMANCOM API CNSS (XML BAP)
- M-INT-05 e-facture DGI quand opérationnel

### Lot RH avancé
- M-RH-02 Contrats auto + signature électronique
- M-RH-03 Heures supplémentaires (HS25/HS50/HS100) barèmes MA
- M-RH-04 Frais de déplacement + indemnités km
- M-RH-05 Carrière / formations / habilitations CACES/SST/électricité
- M-RH-06 Sécurité paie + signature fiche paie
- M-RH-07 Paie intérim (commande agence + saisie heures)
- M-RH-08 Congés compteur 1,5 j/mois + workflow
- M-RH-09 Accidents du travail (CNSS DAT 48h)
- M-RH-10 Maladies & arrêts IJSS CNSS

### Lot marchés BTP
- M-MAR-01 Avenants workflow complet (rédaction → signature → impact)
- M-MAR-02 DGD (Décompte Général Définitif) auto
- M-MAR-03 Caution alerte expiration + workflow renouvellement
- M-MAR-04 OS (Ordre de Service) + impact délai
- M-MAR-05 Situations auto depuis avancements
- M-MAR-06 Avances de démarrage + amortissement

### Lot chantiers métier
- M-CHA-03 Onglets fiche chantier (Marché/Planning/Budget/Achats/Stock/Matériel/RH/Docs/Journal/Risques)
- M-CHA-04 Équipe chantier (rôles + téléphones + badges)
- M-CHA-05 Carte interactive Mapbox/Leaflet
- M-CHA-09 Registre des risques
- M-CHA-10 Exports MS-Project / Primavera
- M-CHA-11 Avancements mobile offline
- M-MAR-... (cf marchés)

### Lot achats avancé
- M-ACH-03 Fournisseur 360° (KPI + OTIF + encours + attestations)
- M-ACH-04 Workflow DA→AO→BC→Réception→Facture traçabilité
- M-ACH-05 Catalogue articles fournisseurs + tarifs négociés
- M-ACH-06 Portail fournisseur (login + soumission AO + dépôt factures)
- M-ACH-07 Attestations légales auto (CNSS/fiscale/AMO/RC/IF/ICE/Patente/RIB)
- M-ACH-08 Sous-traitance contrat type + Art. 187 CGI
- M-ACH-09 BC catalogue / contrat cadre

### Lot stock & matériel
- M-STK-01..07 Scanner mobile, réservation, magasin chantier, conso↔budget, étiquettes, multi-emplacements, péremption
- M-MAT-03..07 Fiche engin 360°, locations, planning matériel, pointage matériel, contrôles réglementaires (VGP)

### Lot études
- M-ETU-03 Soumission AO client (cahier des charges → métré → bordereau → mémoire)
- M-ETU-04 Courbe en S prévisionnelle
- M-ETU-05 Bibliothèque prix avancée (versioning, indices BTP01/BTP18)
- M-ETU-06 Mémoire technique auto-généré
- M-ETU-07 Variantes de chiffrage comparées
- M-ETU-08 Import BPU client Excel/CSV

### Lot pilotage avancé
- M-PIL-02..06 Marges multi-axes, OPEX/CAPEX, groupe, cash-flow dynamique, what-if simulator
- M-DASH-01..03 Personnalisation, graphes, drill-down KPI

### Lot transverse polish
- M-TRA-04..14 Exports universels, impression PDF, filtres avancés, OCR, dark mode, aide contextuelle, onboarding

### Lot intégrations
- M-INT-03 CNSS DAT API
- M-INT-04 API banques marocaines
- M-INT-06 Indices BTP01/BTPxx ANP/HCP CSV
- M-INT-07 OMPIC API ICE/IF/RC autocomplétion
- M-INT-08 Bureaux qualifications MA
- M-INT-09 WhatsApp Business API

### Lot administration P1
- M-ADM-06..12 Audit log global, templates docs WYSIWYG, numérotation, fiscal, mappings, licences, backup

### Lot spécificités Maroc avancées
- M-MA-04..09 TVA paramétrable, TPCC, CIMR, OPPCM, CCAG-T, calendrier hijri

---

## S11–S12 — Polish & onboarding

**Goal** : pixel-perfect + onboarding client.

- M-DASH-04..06 Alertes temps réel, filtres multi-axes, export PDF dashboard
- M-CHA-12..16 Métrés As-built, météo auto, réceptions PV, budget drill, calendrier Outlook
- M-ACH-10..12 Cadre normatif marchés publics, tableau de bord achats, IA suggestion
- M-STK-08..12 Demande transfert, CMP/FIFO, ABC, réappro auto, carte
- M-MAT-08..11 GPS télémétrie, habilitations CACES, TCO, maintenance prédictive IA
- M-ETU-09..12 Qualifs MA, bordereaux MTE, comparatif AO, IA mémoire
- M-MAR-07..10 Sous-traitance déclarative, réception, indices auto, litige MOA
- M-FIN-10..14 Analytique multi-axes, budget tréso 12 mois, clôture, liasse, open banking
- M-RH-11..14 Self-service, formation TFP, médecine, surveys
- M-HSE-12..14 ISO 9001/45001, environnement, levée réserves QHSE
- M-PIL-07..09 Exports CAC, benchmark, alertes IA
- M-APR-04..08 Délégation, notifications, matrice, mobile, audit trail hash
- M-ADM-13..16 API publique, import migration Sage/Batigest, locales hijri, white-label
- M-TRA-15..20 Historique, commentaires, pièces jointes, activity feed, bulk, automation
- M-MOB-07..08 Push, basse bande passante
- M-INT-10..16 Drive, Outlook, MS-Project, BIM, météo DMN, PowerBI, migration Sage
- M-MA-10..14 Code marchés publics, banques, régions, multi-devises, prière

---

## Affectation aux agents (R2-01 à R2-07)

Voir `AGENT_COMPLETION_PROMPTS.md` pour le détail.

| Agent | Périmètre (sections) | Tâches typiques |
|--------|----------------------|-----------------|
| **R2-01** | §02 Chantiers + §14 Transverse (M-TRA-01..03) | Fiche chantier, wizard, drill-down universel, Ctrl+K |
| **R2-02** | §03 Achats + §06 Études + §07 Marchés BTP | 3-way matching, DPU/DPGF, DGD, OS, situations auto |
| **R2-03** | §04 Stock + §05 Matériel | Magasin chantier, GMAO, carburant, locations, contrôles |
| **R2-04** | §08 Finance + §09 RH + §17 Spécificités Maroc | Lettrage, e-facture, paie HS, RAS 5 %, ICE/IF/RC partout |
| **R2-05** | §10 HSE + §11 Pilotage + §12 Approbations + §13 Admin | Modules absents + engine workflow + brancher analytics + RBAC/SSO/sociétés |
| **R2-06** | §15 Mobile + §16 Intégrations + M-RH-01 | App PWA, offline, SIMPL-IS/DAMANCOM/banques/OMPIC/WhatsApp |
| **R2-07** | §01 Dashboard + §14 Transverse (reste) | Personnalisation, graphes, AR/RTL, dark mode, exports, onboarding |

---

## Anti-patterns à éviter

- ❌ **Refaire le Round 1** : avant de recoder, vérifier dans `docs/specs/erp-audit-roadmap/00-PROGRESS.md` ce qui existe déjà et compléter au lieu de réécrire.
- ❌ **Toucher 2 plomberies en même temps** : ne pas modifier `13-admin` et `12-approbations` dans la même PR (RBAC ↔ inbox approbateur partagent du modèle).
- ❌ **Mock multiplié** : continuer à utiliser **`SEED_CHANTIERS`** (Round 1). Tous les nouveaux datasets doivent référencer `ch-00x`/`CH-2025-00x`.
- ❌ **i18n hardcoded** : aucun string FR inline, ni libellé `« No notifications »` en anglais.
- ❌ **`| currency` Angular pipe** : continuer d'utiliser `| mad` (cf. `lint:no-dollar`).
- ❌ **Mobile en after-thought** : penser PWA/offline **dès** la conception des nouveaux écrans (M-MOB-01..06).
- ❌ **Skip tests** : chaque tâche P0/P1 inclut son test e2e Playwright + unit Jasmine si calcul fiscal/social/K.

---

## KPIs de progression (Round 2)

À tracker sprint par sprint :

| KPI | Source | Cible S2 | Cible S6 | Cible S12 |
|---|---|---|---|---|
| Modules sidebar sans 404 | route audit | 13/13 | 13/13 | 13/13 |
| Tâches P0 résolues | `[x]` dans `00-INDEX.md` | 8/26 | 20/26 | 26/26 |
| Tâches P0 + P1 résolues | idem | 8/120 | 50/120 | 100/120 |
| Tables avec drill-down | comptage `M-TRA-02` | 100 % | 100 % | 100 % |
| Routes avec `Ctrl+K` indexées | command-palette | 80 % | 100 % | 100 % |
| Test e2e Playwright | CI | 30 spécs | 60 spécs | 100 spécs |
| Couverture services calcul fiscal/social | `npm run test:coverage` | 75 % | 85 % | ≥ 90 % |
| App PWA installable + offline | Lighthouse PWA | partial | ≥ 90 | 100 |
| A11Y axe-core violations critiques | CI | 0 | 0 | 0 |
| Devise `$` détectée | `lint:no-dollar` | 0 | 0 | 0 |
| Clés i18n manquantes (FR/AR/EN) | `MissingTranslationHandler` | 0 | 0 | 0 |
| Bilingue AR opérationnel | toggle + RTL | demo OK | full | full |
| Lighthouse perf desktop / mobile | CI | 80 / 70 | 90 / 80 | 95 / 90 |

---

## Livrables jalons

| Sprint | Démo client possible | Vente B2B possible | Production possible |
|--------|---------------------|--------------------|---------------------|
| **S2** | ✅ (fiche chantier, drill, Ctrl+K, AR) | ❌ (pas de RBAC) | ❌ |
| **S4** | ✅✅ (avec HSE + GMAO + multi-tenant) | ✅ (B2B PME BTP MA) | ⚠️ (pilote restreint) |
| **S6** | ✅✅✅ (avec mobile terrain) | ✅✅ (PME + ETI BTP MA) | ✅ (pilote production) |
| **S10** | ✅✅✅ | ✅✅✅ (face à Sage/Batigest) | ✅✅ (production large) |
| **S12** | ✅✅✅ | ✅✅✅ | ✅✅✅ (toutes tailles) |
