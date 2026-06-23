# 08 — Ressources Humaines

> **Audit 2026-06-20** · browser + API QA · build **`dev-20260620130151`** · backend deploy OK (payer endpoint actif).
>
> **Post-deploy 20/06** `dev-20260620104816` · congé **Approuver** API OK · payer **200** sur `paie-002`.
>
> **Audit 2026-06-19** · données QA créées via ERP (tenant Siège).

Base : `/rh`. Hérite du **socle liste/détail** (voir [README](README.md)).

---

## A1. Employés — `/rh/employes`

- [x] Liste charge sans erreur (2 employés seed).
- [x] Boutons **Nouveau** / **Nouvel employé** présents (route création : `/rh/employes/new`).
- [x] **Formulaire création** — champs requis visibles : nom, prénom, CIN, type contrat, catégorie, poste, date d'embauche, salaire base (section Rémunération) ; boutons **Retour** + **Enregistrer** (icône save) présents (QA `dev-20260620112100`).
- [x] **Création API** — `POST /api/v1/rh/employes` minimal → **201** (`MAT-003`, QA 20/06).
- [ ] **Création UI** — soumission formulaire non validée E2E (champs OK, save non rejoué en browser).
- [ ] Champs optionnels / édition / suppression (CIN/CNSS validation, affectation chantier).
- [x] **Karim Benali** présent (`MAT-001`, chef chantier, 9 000 MAD, `emp-qa-karim`).
- [x] **Said Amrani** présent (`MAT-002`, conducteur travaux, 14 000 MAD, `emp-qa-said`).

## A2. Pointage — `/rh/pointage`

- [x] Page + filtres chantier/période chargent.
- [x] Lien saisie `/rh/pointage/saisie` + validation/cumuls.
- [ ] État vide « Aucun pointage sur cette période » (non testé — données juin 2026 présentes).
- [x] Saisie heures normales/sup (batch créé API : 8h + 2h sup Karim, CH-2026-004, 18/06/2026).
- [x] Pointage Karim Benali sur CH-2026-004 — UI : 1j présent, **10h**, jour **18** ✅ (batch `pb-2026-06-18-ch-004`).

## A3. Planning des équipes — `/rh/planning-equipes`

- [x] Page charge (« Planning équipes »).
- [ ] Affectation équipes / détection conflits (pas de données).

## A4. Congés — `/rh/conges`

- [x] Liste + bouton **Nouvelle demande**.
- [x] Workflow **approuver** — API `POST …/conges/cng-001/approve` → **APPROUVE** (QA antérieur).
- [x] **Démarrer** — API `PUT …/conges/cng-001` `{ status: EN_COURS }` → **200** (QA `dev-20260620112100`).
- [x] **Solder** — API `PUT …/conges/cng-001` `{ status: SOLDE }` → **200** ; `cng-001` final **SOLDE**.
- [x] **Refuser** — bouton + dialog visibles sur congé **DEMANDE** (`cng-qa-refuse-ui`) ; API `POST …/reject` disponible.
- [x] **Transitions UI** (Approuver / Refuser / Démarrer / Solder) — `(transitionRequest)` + `handleTransition` sur `conge-detail` · QA `dev-20260620130151` (`cng-ui-*` DEMANDE → **APPROUVE** au clic).
- [x] **CNG-2026-0001** — demande seed présente ; workflow complet **APPROUVE → EN_COURS → SOLDE** validé API.

## A5. Paie — `/rh/paie`

- [x] Liste charge (`PAI-2026-0002` · Karim · 06/2026 · net 7 384 MAD).
- [x] Détail `paie-002` : base 9 000 MAD, ind. transport 500 MAD, badge **Payée** (statut **PAYEE**).
- [x] Bouton **Marquer payée** masqué quand **PAYEE** (comportement attendu).
- [x] **Imprimer** — impression navigateur (`window.print`) OK.
- [x] Payer — `paie-002` déjà **PAYEE** (deploy 20/06) ; re-test `POST …/payer` → **409** « Only validated fiches can be paid » (garde OK).
- [x] PDF bulletin — `GET /api/v1/rh/fiches-paie/paie-002/pdf` → **200** `application/pdf` (~1,6 Ko · deploy `dev-20260620222605`).

## A6. Journal paie — `/rh/paie/journal`

- [x] Page charge + état vide propre.

## A7. Déclarations sociales

- [x] DAMANCOM — page + export CSV.
- [x] IGR / État 9421 — page + export.
- [x] État 1208 — page + export.

---

## Jeux de données

| Entité | Valeur |
|--------|--------|
| Karim Benali | `MAT-001` · chef chantier · CH-2026-004 |
| Said Amrani | `MAT-002` · conducteur travaux · congé CNG-2026-0001 |
| Pointage | 18/06/2026 · CH-2026-004 · 8h + 2h sup |
| Fiche paie Karim | `PAI-2026-0002` · juin 2026 · base 9 000 MAD · **PAYEE** |
| Congé seed | `CNG-2026-0001` · `cng-001` · **SOLDE** (workflow QA 20/06) |

Création : `node web/tests/e2e/scripts/seed-qa-ref-data.mjs` · paie : `node web/tests/e2e/scripts/seed-qa-rh-paie.mjs`

### Écarts produit (2026-06-20 · reconfirmé `dev-20260620112100`)

| Écart | Couche | Statut |
|-------|--------|--------|
| Transitions congé UI | `conge-detail` — `(transitionRequest)` + `handleTransition` | **OK** — Approuver UI → **APPROUVE** (`dev-20260620130151`) |
| Transition PAYEE | `POST …/fiches-paie/paie-002/payer` | **OK** — `paie-002` **PAYEE** ; re-payer → **409** |
| PDF fiche paie | `GET …/fiches-paie/paie-002/pdf` | **OK** — **200** PDF (~1,6 Ko) |
| Création employé UI | `/rh/employes/new` | Formulaire OK · **save E2E non validé** |
