# 06 — Marchés & Facturation

> **Audit 2026-06-19** · routes crawl **OK** · `/ventes/retenues-garantie` charge sans erreur icône.
> **Browser QA 2026-06-19** · tenant nafura Siège · listes + formulaires création testés.
> **Browser QA 2026-06-20** · auth `erp-audit.json` · seeds `seed-qa-marches.mjs` · script `verify-marches-qa-20260620.mjs` · résultats `docs/qa/erp-audit-2026-06-19/marches-qa-verify-20260620.json`.

Bases : `/marches` et `/ventes`.
Fusion marchés publics BTP + cycle client / facturation.

---

## A. Marchés publics

### A1. Contrats / Marchés — `/marches/contrats`

- [x] Liste des marchés + détail (objet, MOA, montant, délai, RG, TVA) — **MARCHE-2026-001** et **MARCHE-2026-002** ↔ CH-2026-004 (seed Al Manar).
- [x] **Créer** un marché : formulaire **Nouveau contrat de marché** (sélecteur chantier incl. CH-2026-004).
- [x] **Créer** via URL `/marches/contrats/new` — formulaire création (guard redirect si `:id=new` · deploy `dev-20260620222605`).
- [!] Articles du marché, lots, conditions de paiement — non visibles dans le formulaire création.

### A2. Avenants — `/marches/avenants`

- [x] Liste des avenants — **AV-MARCHE-2026-002-01** visible (lien **MARCHE-2026-002**, +420 k HT VRD), re-validé live 19/06 soir après `seed-qa-marches.mjs`.
- [x] **Créer** un avenant — seed **AVT** sur **MARCHE-2026-002** (+420 k HT VRD).
- [x] Recalcul du nouveau montant marché — **MARCHE-2026-002** à **5 420 000 MAD HT** (5 M + avenant VRD +420 k) ; avenant **AV-MARCHE-2026-002-01** statut **APPLIQUE** ; API `GET …/avenants/{id}/impact-simulation` → `dejaPropage: true`, `montantHtActuel: 5420000`.

### A3. Factures (marché) — `/marches/factures`

- [x] Liste + KPI (Total émis, Net à payer, Retard) + état vide « Aucune facture ».
- [x] Génération depuis situations validées — workflow **SIT-2026-004-01** → **FAC-2026-0002** OK (`/ventes/factures`, 633 600 TTC) ; **`/marches/factures`** miroir QA via `seed-qa-marches.mjs` → **FAC-2026-0002** (`fm-qa-manar-002`, MARCHE-2026-002) · API `GET /api/v1/marches/factures` → 1.

### A4. Cautions — `/marches/cautions`

- [x] Liste des cautions (provisoire, définitive, RG, restitution) + KPI — seed **CB-2026-001** (**150 000 MAD** définitive, BMCE Bank QA) visible (20/06).
- [!] Échéances, mainlevée, suivi bancaire — dates seed OK ; **mainlevée / restitution** non testées.

### A5. Révisions de prix — `/marches/revisions-prix`

- [x] Formule de révision (index BTP BTP01/BTP18/MO) + tableau coefficients K.
- [!] « Aucun marché révisable » — calcul coefficient non testé.

### A6. Pénalités — `/marches/penalites`

- [x] Page calcul pénalités CCAG-T + état vide « Aucun marché en retard ».

### A7. DGD (décompte général définitif) — `/marches/dgd`

- [x] Établissement DGD (tableau + formule) + état vide « Aucun DGD ».

### A8. Ordres de service (OS) — `/marches/os`

- [x] Liste des OS + état vide « Aucun ordre de service ».

---

## B. Cycle client (ventes)

### B1. Offres — `/ventes/offres`

- [x] Liste + état vide « Aucune offre commerciale » + **Nouvelle offre**.
- [!] **Convertir en BC client** / **Ouvrir le BC** — pas de données.

### B2. Commandes clients — `/ventes/commandes` → `/ventes/bons-commandes-clients`

- [x] Liste + état vide « Aucun bon de commande client » + **Nouveau BCC**.
- [x] Lignes, montant, lien chantier — seed **BCC** Al Manar (250 k HT forfait VRD).

### B3. Situations (ventes) — `/ventes/situations`

- [x] Redirige vers `/chantiers/situations` — même liste (SIT-2026-005-01 visible).

---

## C. Facturation

### C1. Factures client — `/ventes/factures`

- [x] Liste avec **FAC-2026-0001** (CH-2026-005, 3 168 000 TTC, Brouillon) et **FAC-2026-0002** (CH-2026-004, 633 600 TTC, issue **SIT-2026-004-01**).
- [x] **Navigation détail** — clic simple sur FAC-2026-0001 ouvre `/ventes/factures/{id}` (`selectionMode: 'none'`, re-validé 2026-06-19).
- [x] **Deep link** `/ventes/factures/{id}` — charge le détail (id `efc7f1b6-…`).
- [x] **Imprimer facture** — visible sur détail (Brouillon).
- [!] **Créer un avoir** — masqué sur Brouillon (attendu ; visible si EMISE / partiellement payée / payée / litige).
- [x] **Ajouter un encaissement** — masqué sur Brouillon (attendu) ; sur **FAC-2026-0002** (**Partiellement payée**) bouton **+ Encaissement** visible, dialogue (date / mode / montant TTC) OK ; encaissement seed **100 000 MAD** virement `QA-ENC-20260620`.
- [x] Statut affiché (Brouillon sur FAC-2026-0001).

### C2. Avoirs — `/ventes/avoirs`

- [x] Liste + état vide « Aucun avoir » + **Nouvel avoir**.
- [!] Imputation sur facture d'origine — pas de données.

### C3. Retenues de garantie — `/ventes/retenues-garantie`

- [x] Suivi RG (KPI Total bloqué / À libérer / Caution / Libérée) + état vide.
- [!] Libération à réception/délai — pas de données seed.

---

## D. Référentiel

### D1. Clients — `/ventes/clients`

- [x] Liste (4 clients QA : CLI-csh4tq, CLI-cu7cqa, CLI-l5iyd8, CLI-CUR-QA) + **Nouveau**.
- [!] **Créer/éditer/supprimer** — formulaires non testés.
- [x] Client seed **Société Al Manar Immobilier** (`CLI-MANAR-QA`).

---

## Jeux de données

### Marché

| Champ | Valeur |
|-------|--------|
| N° | MARCHE-2026-001 *(live)* · **MARCHE-2026-002** *(seed `seed-qa-marches.mjs`)* |
| Objet | Chantier Résidence Al Manar · Travaux VRD Résidence Al Manar |
| Chantier | CH-2026-004 |
| MOA | Client QA csh4tq *(001)* · **Société Al Manar Immobilier** `CLI-MANAR-QA` *(002)* |
| Montant | 5 000 000 MAD HT initial → **5 420 000 MAD HT** après avenant VRD |
| TVA / RG | 20 % / 7 % |
| Délai | OS 01/07/2026 |
| Script | `node web/tests/e2e/scripts/seed-qa-marches.mjs` |

### Avenant

| Champ | Valeur |
|-------|--------|
| Marché | MARCHE-2026-002 |
| Objet | Travaux supplémentaires VRD |
| Montant | +420 000 MAD HT |
| Délai | +30 j |
| Nouveau montant | 5 420 000 MAD HT |
| Id seed | `avt-qa-manar-001` |
| Statut | **APPLIQUE** *(impact propagé 20/06)* |

### Facture client (issue situation)

| Champ | Valeur |
|-------|--------|
| N° *(live CH-2026-004)* | **FAC-2026-0002** |
| Situation | SIT-2026-004-01 — CH-2026-004 |
| Net TTC | 633 600 MAD |
| Encaissement | 100 000 MAD virement (`QA-ENC-20260620`) — reste 533 600 |
| Autre seed doc | SIT-2026-005-01 — CH-2026-005 · 3 168 000 TTC *(FAC-2026-0001 brouillon)* |

### Client

| Champ | Valeur |
|-------|--------|
| Raison sociale | **Société Al Manar Immobilier** `CLI-MANAR-QA` *(seed)* · Client QA csh4tq *(live, MARCHE-2026-001)* |
| ICE | 002456789012345 *(Al Manar seed)* |
| Conditions paiement | — |
| RIB | — |

### Bon de commande client

| Champ | Valeur |
|-------|--------|
| N° client | BC-MANAR-VRD-2026 |
| N° ERP | **CMD-2026-0001** *(seed live)* |
| Client | CLI-MANAR-QA |
| Chantier | CH-2026-004 |
| Montant HT | 250 000 MAD (forfait VRD) |
| Notes | `QA-MARCHES-SEED-2026` |

### Caution

| Champ | Valeur |
|-------|--------|
| N° | **CB-2026-001** *(seed QA 2026-06-20)* |
| Marché | MARCHE-2026-002 |
| Type | Définitive |
| Montant | 150 000 MAD (3 % de 5 M HT initial) |
| Banque | BMCE Bank QA |
| Émission / expiration | 01/07/2026 → 01/07/2027 |
| Statut | ACTIVE |
