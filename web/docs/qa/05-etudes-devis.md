# 05 — Études & Devis

> **Audit 2026-06-19** · routes crawl **OK** · **QA browser+API 19/06 soir** · **post-deploy 20/06** `dev-20260619230406` · **workflow QA 20/06** 12/12 PASS (`docs/qa/erp-audit-2026-06-19/etudes-workflow-verify-20260620.json`).
>
> **Post-deploy 20/06** `dev-20260620112100` · fix tour onboarding (plus de hijack `/chantiers/new`) · `showInModes edit+view` + `applyDevisPrefill` déployés.

Base : `/etudes`.
Avant-vente : bibliothèque de prix → métré (DPGF) → devis → conversion en chantier ; appels d'offres clients.

---

## A. Chiffrage

### A1. Bibliothèque de prix — `/etudes/bibliotheque-prix`

- [x] Liste des prix unitaires de référence + détail (3 ouvrages seed : BPU-BA-001, BPU-MAC-002, BPU-ENL-003).
- [ ] **Créer/éditer/supprimer** un article de prix (ouvrage, sous-détail).
- [x] Recherche par code/désignation (ex. `BPU-BA-001` filtre correctement).
- [ ] Filtre par lot/famille.
- [x] Sous-détail de prix (déboursé sec : main d'œuvre, matériaux, matériel) — détail BPU-BA-001 : DS 1 180 / PU 1 500 MAD.

### A2. Métrés (DPGF) — `/etudes/metres`

- [x] Liste des métrés + détail (MET-2026-001, 3 postes qté 1 000 / 3 200 / 2 800).
- [x] **Ouvrir DPGF** / **Générer devis** visibles sur détail MET-2026-001 (`showInModes: edit+view`, deploy `dev-20260619230406`).
- [x] **Générer le devis** (`generate_devis`) — clic navigue vers `/etudes/devis/new?metreId=…` (QA 20/06) ; formulaire création **non prérempli** depuis le métré (gap).
- [x] Saisie des quantités par poste, rattachement bibliothèque de prix (lookup BPU sur les 3 lignes).

### A3. Devis — `/etudes/devis`

- [x] Liste des devis + détail (DV-2026-0001 v2 visible).
- [ ] **Créer** un devis (lignes, quantités, PU, remises, TVA).
- [x] **Nouvelle version** (`new_version`) — bouton visible sur détail DV-2026-0001 (QA `dev-20260620104816`, fix `showInModes: edit+view`).
- [x] **Imprimer PDF** — bouton en-tête **Imprimer** ouvre l’aperçu (`printDevis` + zone `[data-print-area="devis"]`, QA 20/06).
- [x] Action bar **Émettre PDF** (`print_pdf`) — visible sur détail DV-2026-0001 (QA `dev-20260620104816`).
- [x] **Convertir en chantier** (`convert_chantier`) — visible si statut **APPROUVE** ; clic navigue vers `/chantiers/new?devisId=a06010d8-…` (browser QA **20/06** · **dev-20260620112100** · DV-2026-0001 v2).
- [x] Wizard création chantier — préremplissage **OK** (objet, ref marché, client par code/nom, budget/ville) ; `nf-select` client affiche le libellé (fix OnPush + option fallback · deploy `dev-20260620222605`).
- [x] API **Convertir en chantier** — `POST /api/v1/etudes/devis/{id}/convert-to-chantier` → **200** + `chantierGenereId` (ex. `CH-2026-463` sur DV-2026-0001).
- [x] Totaux HT / TVA / TTC (6 750 000 / 1 350 000 / 8 100 000 MAD — champs `money-ma` + pied DPGF lignes).
- [x] Client sur fiche devis DV-2026-0001 : select affiche **Commune urbaine de Rabat** (`DevisFacade.ensureLookups`, deploy `dev-20260619230406`).
- [ ] Marge prévisionnelle (non exposée API/UI sur le seed v2).

---

## B. Soumissions

### B1. Appels d'offres clients — `/etudes/appels-offres-clients`

- [ ] Liste des AO clients + détail.
- [ ] **Créer** un AO client (maître d'ouvrage, objet, date limite, caution).
- [ ] **Convertir en chantier** (`convert_chantier`) à l'attribution.
- [ ] Suivi statut (en cours, soumis, attribué, perdu).

---

## Jeux de données

> **Seed API** · `node web/tests/e2e/scripts/seed-qa-etudes.mjs` (idempotent, auth Playwright requise).

### Références créées (tenant dev)

| Entité | Code / clé | ID |
|--------|------------|-----|
| Ouvrage | BPU-BA-001 | `8297a6cf-7790-4273-af06-a17c18cc6739` |
| Ouvrage | BPU-MAC-002 | `b2e64792-55c4-4b7d-bd71-2714ba2ec9dc` |
| Ouvrage | BPU-ENL-003 | `359fd0d1-e809-4ce8-80a1-747c1427f45d` |
| Client | CLI-CUR-QA — Commune urbaine de Rabat | `a34ea959-5cc1-46e8-ad11-c76b095cf058` |
| Métré | MET-2026-001 | `1d11c135-2a4f-43ed-99e0-6936b0c98bde` |
| DPGF | DPGF-2026-002 | `6673b558-ea3f-4476-8a23-162b196ba745` |
| Devis | DV-2026-0001 (v2) | `a06010d8-145b-40e5-909d-9232de2274fc` |

**Note QA 20/06** : le seed est passé en **APPROUVE** via `POST …/devis/{id}/marquer-gagne` pour tester la conversion chantier. Re-seed ou repasser en `NEGOCIATION` si besoin d’un état initial.

**Endpoints utilisés** : `POST/GET /api/v1/etudes/ouvrages`, `GET /api/v1/etudes/bibliotheque-prix`, `POST/GET /api/v1/etudes/metres`, `POST/GET /api/v1/etudes/dpgf`, `POST /api/v1/etudes/dpgf/{id}/noeuds`, `PUT /api/v1/etudes/dpgf-noeuds/{id}`, `POST/PUT /api/v1/etudes/devis`, `POST /api/v1/etudes/devis/{id}/versions`, `POST /api/v1/etudes/devis/{id}/marquer-gagne`, `POST/GET /api/v1/partners`.

**Note seed** : le devis inclut les 3 postes métré (2,13 M MAD) + une ligne forfait « lots complémentaires » pour atteindre **6 750 000 MAD HT**. Le DPGF est complété via `POST …/noeuds` si la génération auto depuis le métré ne crée que les lots.

**DPGF totaux lots** (API seed 19/06 soir, fix `buildTree`) :

| Lot | Total HT |
|-----|----------|
| Lot 1 — Gros œuvre | 4 500 020 |
| Lot 2 — Maçonnerie | 5 616 000 |
| Lot 3 — Façades | 2 620 800 |
| **Total DPGF** | **12 736 820 HT** |

### Article bibliothèque de prix

| Code | Désignation | Unité | Déboursé sec | PU vente |
|------|-------------|-------|--------------|----------|
| BPU-BA-001 | Béton armé pour fondations | m³ | 1 180 | 1 500 |
| BPU-MAC-002 | Maçonnerie agglos 20 | m² | 95 | 135 |
| BPU-ENL-003 | Enduit extérieur | m² | 48 | 72 |

### Métré (DPGF)

| Poste | Désignation | Qté | Unité |
|-------|-------------|-----|-------|
| 1.1 | Fondations BA | 1 000 | m³ |
| 2.1 | Murs agglos | 3 200 | m² |
| 3.1 | Enduits façade | 2 800 | m² |

### Devis

| Champ | Valeur |
|-------|--------|
| Client | Commune urbaine de Rabat |
| Objet | Construction groupe scolaire (12 classes) |
| Total HT | 6 750 000 MAD |
| TVA 20 % | 1 350 000 |
| TTC | 8 100 000 |
| Marge prévisionnelle | 14 % |
| Version | v2 (révision quantités lot terrassement) |

### Appel d'offres client

| Champ | Valeur |
|-------|--------|
| Maître d'ouvrage | Ministère de l'Équipement |
| Objet | Réfection voirie RN1 PK45-PK60 |
| Date limite | 15/07/2026 |
| Caution provisoire | 1,5 % du montant estimé |
