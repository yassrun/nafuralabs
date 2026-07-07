# 03 — Stock & Logistique

> **Audit 2026-06-19** · réceptions/sorties peuplées, articles QA présents · **post-deploy 20/06** `dev-20260620005515` (Chantier budget sorties + smoke retours/pertes/valorisation).

Base : `/inventory`. Hérite du **socle liste/détail** (voir [README](README.md)).

---

## A. Mouvements

### A1. Réceptions — `/inventory/mouvements/receptions`

- [x] Liste (2 réceptions : REC-1781876078388 72 400 MAD + **STK-REC-2026-00001** 7 400 MAD Sika) + boutons Nouvelle réception / Scanner BL.
- [x] Détail **STK-REC-2026-00001** (`ef725100-9087-442a-ac96-4274338ff984`) : charge, statut Validé, fournisseur **Sika Maroc SARL**, BL BL-SIKA-QA-001, ligne **ART-CIM-325** 50 × 148 MAD.
- [x] Lien BC : colonne « BC d'origine » affiche **BC-2026-00001** cliquable (enrichissement `bcId`/`bcNumero` depuis notes + lookup BC · deploy `dev-20260620222605`).
- [!] Seed achats `REC-2026-00001` (`09b53e01-…`) = réception **achats** ; entrée stock = **STK-REC-2026-00001**. L'UUID achats redirige vers la liste.
- [!] REC-1781876078388 : fournisseur « Non renseigné », dépôt Les Palmiers.

### A2. Sorties — `/inventory/mouvements/sorties`

- [x] Liste (1 sortie validée **SOR-1781876126682** 16 890 MAD) + KPIs.
- [x] Détail existant : SOR-1781876126682 — ART-ACIER-HA 150 u, chantier CH-005, BS-CH005-001.
- [x] Formulaire création brouillon (`/new`) charge (statut Brouillon, Enregistrer).
- [x] Dropdown **Magasin source** peuplé (6 dépôts — fix `isActive !== false` dans `SortieFacade`, deploy `dev-20260619230406`).
- [x] Dropdown **Chantier (pilotage budget)** peuplé (7 chantiers : CH-2026-001 … CH-2026-006 — fix `budgetFacade.loadListingFromApi()` dans `SortieFacade.ensureLookups()`, deploy `dev-20260620005515`).
- [x] Enregistrer brouillon minimal (`/new`) : date + magasin + chantier budget + motif + 1 ligne → redirect détail (`1ac3de91-e993-4964-a83d-7067b5e7a467`, post-deploy 20/06).

### A3. Transferts — `/inventory/mouvements/transferts`

- [x] Page + état vide + Nouveau transfert.

### A4. Retours — `/inventory/mouvements/retours`

- [x] Page + état vide « Aucun retour » + boutons Nouveau / Nouveau retour (smoke post-deploy 20/06).

### A5. Inventaires — `/inventory/mouvements/inventaires`

- [x] Page + état vide + Nouveau.

### A6. Pertes & chutes — `/inventory/mouvements/pertes-chutes`

- [x] Page + KPIs (Pertes ce mois 0 MAD) + état vide « Aucune déclaration de perte » + Nouvelle déclaration (smoke post-deploy 20/06).

---

## B. Suivi & Valorisation

### B1. État du stock — `/inventory/suivi/etat-stock`

- [x] Vue articles/dépôts (6 lignes, 5 articles distincts, valorisation 59 760 MAD).
- [x] **ART-CIM-325** — Ciment CPJ 32,5 R : Palmiers 150 u (12 750 MAD) + Dépôt QA csh4tq 50 u (4 250 MAD).

### B2. Valorisation — `/inventory/suivi/valorisation`

- [x] KPIs : Valeur stock total **59 760 MAD**, Valeur dépôts **59 760 MAD**, Valeur chantiers 0 MAD ; export + date de valorisation (smoke post-deploy 20/06).

### B3. Alertes — `/inventory/suivi/alertes`

- [x] « Aucune alerte » — cohérent dashboard.

---

## C. Catalogue & Configuration

### C1. Articles — `/inventory/catalogue/articles`

- [x] 8 articles + Nouveau.

### C2–C4, D1–D3

- [x] Dépôts : 5 dépôts listés.
- [ ] Familles, Types, UoM, Motifs, Costing — non visités.

---

## Jeux de données

Voir écarts seed dans README audit 2026-06-19.
