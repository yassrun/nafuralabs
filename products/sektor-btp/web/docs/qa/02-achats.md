# 02 — Achats & Approvisionnement

> **Audit 2026-06-19** · listes DA/BC peuplées via `seed-qa-achats.mjs`. Tenant **nafura Siège** (`erp.nafura.local`). **Browser QA 20/06** : BC réception smoke (auth `erp-audit.json`).

Base : `/achats`. Hérite du **socle liste/détail** (voir [README](README.md)).

---

## A. Expression du besoin

### A1. Demandes d'achat — `/achats/demandes`

- [x] Liste DA + filtres (statut, chantier, demandeur) + recherche.
- [x] Boutons création présents.
- [x] Liste peuplée (**DA-2026-0001** — ciment CH-2026-004).
- [x] **Créer** une demande (UI — formulaire `/achats/demandes/new` : chantier, date besoin, justification).
- [x] **Rejeter** / **Convertir en BC** / validation champs — détail DA-2026-0001 : statut Approuvée, bouton **Créer un BC** visible ; Rejeter absent (statut non SOUMISE, attendu) ; champs requis marqués `*`.

### A2. Appels d'offres — `/achats/appels-offres`

- [x] Liste + état vide.
- [x] Créer — formulaire `/achats/appels-offres/new` charge.
- [ ] Attribuer / comparatif — aucun AO seedé, non testable.

---

## B. Engagements

### B1. Bons de commande — `/achats/commandes`

- [x] Liste + filtres + **BC-2026-00001** (Sika × CH-2026-004, livraison 25 %).
- [x] **Créer** — formulaire `/achats/commandes/new` charge (fournisseur, chantier).
- [x] **Imprimer** / suivi reçu — détail BC-2026-00001 : sections **Réceptions enregistrées** (REC-2026-00001), **matching 3-way** (ECART_BLOQUE, table lignes), action **Imprimer BC** visible (mode `edit`).
- [x] **Enregistrer réception** — bouton visible ; clic ouvre formulaire **Nouvelle réception** (lignes restantes, BL) — QA 20/06.
- [x] **Valider réception** — select destination peuplé (types `WAREHOUSE`/`ENTREPOT`/`DEPOT`/`CHANTIER` · **9 options** · QA `dev-20260620125246`).

### B2. Contrats — `/achats/contrats`

- [x] Liste vide + filtres + bouton Nouveau (visité).

---

## C. Référentiel

### C1. Fournisseurs — `/achats/fournisseurs`

- [x] Liste fournisseurs (incl. **Sika Maroc SARL** créé via ERP).
- [x] CRUD / validation ICE-RIB — détail Sika : onglets Informations / Attestations / **Catalogue** ; hints ICE 15 chiffres & RIB 24 chiffres ; catalogue seed **SIKA-CIM-QA** 148 MAD/sac visible ; formulaire ajout ligne présent (création fournisseur non exécutée).
- [x] **Sika Maroc SARL** présent (`FRN-SIKA-QA`).

---

## Jeux de données

| Entité | Numéro / ref | ID | Chantier / lien |
|--------|--------------|-----|-----------------|
| Fournisseur Sika Maroc SARL | `FRN-SIKA-QA` | `924ca59b-9a7d-4d5b-beaa-9eec39d3bc70` | ICE `002345678901234` |
| Article ciment | `ART-CIM-325` | `6d227a31-3275-4562-96d7-076369cec934` | 200 sacs |
| Catalogue fournisseur Sika | `SIKA-CIM-QA` | `b5cd5b1c-ce2d-4a1e-87d5-ddebdf757f6b` | 148 MAD/sac HT |
| Demande d'achat | **DA-2026-0001** | `ef5050f7-0881-471b-b914-30c0794b1249` | `ch-004` / CH-2026-004 — APPROUVEE |
| Bon de commande | **BC-2026-00001** | `4a2a7c5d-503e-4ac9-89b2-33e955d0b0ce` | Sika → CH-2026-004 — PARTIELLEMENT_LIVRE |
| Réception achat | **REC-2026-00001** | `09b53e01-00f2-44d9-a4e6-ac7dd346d43f` | 50 sacs — BL `BL-SIKA-QA-001` |

Seed : `node tests/e2e/scripts/seed-qa-achats.mjs` (idempotent, marqueur `QA-ACHATS-SEED-CH-004`).
