# 01 — Chantiers

> **Audit 2026-06-19** · fixes déployés : sync avancement → lots/chantier, icônes planning/Lucide.
> **Browser QA 2026-06-19** · tenant nafura Siège · CH-2026-004 @ 40 % validé live · **SIT-2026-004-01** créée (cycle facturation API).
> **Retest UI 2026-06-20** · web **dev-20260619230406** · cycle situation **SIT-2026-004-03** → **FAC-2026-0004** (UI complet).
> **Browser QA 2026-06-20** · web **dev-20260620112100** · wizard création **CH-2026-007** (5 étapes + submit) · conversion devis → wizard reste ouvert (fix tour) · smoke CH-004 documents / attachements / journal.

Module cœur métier. Base : `/chantiers`. Hérite du **socle liste/détail** (voir [README](README.md)).

---

## A. Exécution chantier

### A1. Mes chantiers — `/chantiers`

Liste des chantiers + détail à onglets.

- [x] Liste : colonnes Code, Chantier, Type, Client, Ville, Budget HT, Avancement, Statut, Début, Fin prévue.
- [x] Filtre **statut** (Tous les statuts / En cours / …) + recherche `Code, nom, client`.
- [x] Bouton **Voir planning** (raccourci vers le planning global).
- [x] **+ Nouveau chantier** ouvre le **wizard 5 étapes** (création préremplie).
- [x] Wizard : navigation étape par étape 1→5 (validation client / ville / budget / équipe).
- [x] Wizard : **création** complète — **CH-2026-007** « QA Chantier Browser 20260620 » (client Al Manar, Rabat, 1 M HT, Chef QA / Conducteur QA) · deploy **dev-20260620112100**.
- [x] Wizard depuis devis (`?devisId=…`) : page **reste ouverte** (plus de hijack tour onboarding) · préremplissage partiel (ville + budget HT 6,75 M aux étapes 3–4 ; nom/client/ref marché absents étapes 1–2 UI).
- [x] Ouverture détail (clic ligne) → onglets : **Vue d'ensemble · Lots · Phases · Budget · Situations · Documents · Photos**.
- [x] Onglet **Vue d'ensemble** : Équipe (client, chef, conducteur), Calendrier (OS, début, fin), Finances (budget, TVA, caution), Description.
- [x] Onglet **Lots** : tableau BPU (Code, Désignation, Quantité, Unité, PU HT, Montant HT, Avancement) + **Ajouter un lot**.
- [x] Lot **L10** existant : 1 000 m³ × 1 500 MAD = **1 500 000 HT**, avancement **40 %**.
- [!] **Ajout** lot avec BPU (saisie quantité / unité / prix) — non testé ; calcul affiché OK sur L10.
- [x] Onglet **Phases** : timeline + bouton **Ajouter une phase** (état vide « Aucune phase » sur CH-2026-004).
- [x] Onglet **Budget** : synthèse (Budget HT/TTC, situations cumulées, facturé, encaissé) + lien détail.
- [x] Onglet **Situations** : bouton **Générer situation N (brouillon)** + lien liste situations.
- [x] Onglet **Documents** : zone upload + état vide « Aucun fichier joint ».
- [x] Onglet **Photos** : **Ajouter une photo** + état vide.
- [x] **Créer / lier le marché** depuis le chantier (préremplissage marché) — MARCHE-2026-001 sur CH-2026-004.
- [x] Bandeau KPI détail : AVANCEMENT **40 %**, BUDGET HT **5 M**, FACTURÉ HT, ENCAISSÉ TTC (sync avancement OK).
- [x] Modifier / Supprimer le chantier (boutons présents).

### A2. Planning — `/chantiers/planning`

- [x] Affichage du planning multi-chantiers (Gantt / calendrier).
- [x] Navigation période, zoom, regroupement par chantier (filtres période, granularité, affichage Phases/Lots).
- [!] Clic sur une barre → ouvre le chantier concerné — non reproduit (peu de phases visibles sur la période courante).
- [x] Toolbar Gantt : icônes Lucide OK (Aujourd'hui, Exporter PDF, Plein écran).

### A3. Avancements — `/chantiers/avancements`

- [x] Filtres rapides : **Cette semaine · Ce mois · Mes saisies · En retard de saisie · Réinitialiser**.
- [x] **Rafraîchir** la liste.
- [x] **Saisir avancement** (action `saisir`) : bouton présent.
- [x] Données live : **L10 CH-2026-004 · 40 % · 400 m³** (17/06/2026).
- [!] Saisie : valorisation = quantité × % ; calcul du delta période — workflow complet non testé.
- [!] **Photo-uploader** : non testé.
- [x] Action ligne **Ouvrir le chantier** (`ouvrir-chantier`) — navigation `/chantiers/{id}` · QA `dev-20260620220828`.
- [!] Action ligne **Voir photos** (`voir-photos`) — colonne affiche **0** ; action inactive (attendu).
- [!] État vide « Aucun avancement sur la période » — non déclenché (2 lignes sur tous les filtres testés).

---

## B. Pilotage chantier

### B1. Situations de travaux — `/chantiers/situations`

Cœur du cycle de facturation chantier. Détail = en-tête + lignes + décompte.

- [x] Liste des situations + **+ Nouvelle situation** (3 lignes CH-004 : SIT-2026-004-01/02 facturées · SIT-2026-004-03 ; SIT-2026-005-01 / CH-2026-005).
- [x] **Sélection chantier** (mat-select, clic réel requis pour ouvrir l'overlay).
- [x] Période **préremplie** par défaut (mois courant : 31/05–29/06/2026).
- [x] **Reprendre depuis avancements** (`reprendre_avancements`) : pré-remplit les lignes depuis les lots/avancements du chantier.
  - [x] À la sélection du chantier, pré-remplissage **silencieux** des lignes.
  - [x] Bouton explicite : pré-remplissage + Qté cumul L10 = **400 m³**.
  - [x] Cas L10 à 40 % : cumul **600 000 HT** → décompte **528 000 HT / 633 600 TTC** (RG 7 % + résorption avance 5 % marché + TVA 20 %).
- [x] **Décompte** : Cumul travaux HT, − Cumul N-1, Travaux période HT, − Retenue garantie (7 %), Net à payer HT, + TVA (20 %), Net à payer TTC.
- [x] **Enregistrer** la situation (disquette) — **SIT-2026-004-01** brouillon CH-004 (L10 400 m³, 633 600 TTC).
- [x] **Soumettre** au MOA — **SIT-2026-004-03** : dialog → **SOUMISE** + toast « soumise au MOA » (UI + API OK, dev-20260619230406).
- [x] **Valider** par le MOA — **VALIDEE_MOA** + toast « validée par le MOA » (UI + API OK).
- [!] **Rejeter** (`rejeter`) : motif obligatoire — non testé.
- [x] **Émettre la facture** — **FAC-2026-0004** créée (BROUILLON, 0 MAD TTC — travaux période nul sur cumul inchangé) ; statut **Facturée** UI + API OK.
- [x] **Marquer payée** (`marquer_payee`) — bouton visible sur situations Facturée.
- [x] **Imprimer le décompte** (`imprimer_decompte`) — visible en modes **view** et **edit** (deploy `dev-20260620222605`).
- [!] **PV-uploader** — non testé.
- [!] Bouton **soumettre à approbation** (workflow interne) — visible en brouillon, non testé.

> **Fix transitions (19/06 → 20/06)** : `handleTransition` appelle `crud.executeTransition` directement ; `createItem` calcule `nextNumeroOrdre` par chantier. **Retest UI PASS** sur dev-20260619230406.

> Régression `safeRandomUUID` : **PASS** — plus d'erreur « Impossible de charger les lots ».

### B2. Budget chantier — `/chantiers/budget`

- [x] Liste des budgets chantier (6 chantiers, colonnes Révisé / Engagé / Réalisé / Consommation / Marge).
- [!] Détail postes budgétaires — non ouvert.
- [!] Édition des lignes de budget, recalcul des totaux — non testé.

### B3. Sous-traitance — `/chantiers/sous-traitance`

- [x] Liste des contrats + **Nouveau contrat** + état vide « Aucun contrat ».
- [!] Détail contrat (lien chantier/lot, montant, RG, avancement ST) — pas de données seed.

---

## C. Documentation chantier

### C1. Documents — `/chantiers/documents`

- [x] Liste + filtres type + **+ Déposer un document** + état vide.

### C2. Carnets d'attachement — `/chantiers/attachements`

- [x] Liste + **+ Saisie terrain** + filtres statut (smoke **20/06** dev-20260620112100).
- [!] Détail (quantités contradictoires) + lien lots/situations — pas de données.

### C3. Journal de chantier — `/chantiers/journal`

- [x] Saisie d'entrées (**+ Nouvel événement**) + filtres par type.
- [x] Données live : 2 événements CH-2026-001 (17/06 et 19/06/2026).

---

## Jeux de données

(Voir README — écarts seed documentés : CH-2026-005 = Les Palmiers, situation SIT-2026-005-01 existante ; **CH-2026-004** = Résidence Al Manar, **SIT-2026-004-01/02** facturées (**FAC-2026-0002**, **FAC-2026-0003**), **SIT-2026-004-03** cycle UI complet 20/06 → **FAC-2026-0004**.)
