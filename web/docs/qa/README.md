# QA — Cas de test & jeux de données par module

Référentiel de test fonctionnel de **Nafura Sektor — ERP Construction**.
Un fichier `.md` par module métier. Chaque fichier liste, **par sous-menu**, une **checklist des features à tester** suivie d'une section **jeux de données** prête à saisir.

App de référence : http://erp.nafura.local/ — tenant **nafura · Siège**.

**Déploiement local QA** : `api.erp.nafura.local` et `erp.nafura.local` routent vers le namespace Kubernetes **`nafura-erp-dev`** (image `erp-backend:dev` / `erp-web:dev`), pas `nafura-erp-staging`. Rebuild + restart :

```bash
docker build --no-cache -t erp-backend:dev -f backend/applications/erp/Dockerfile backend
kubectl -n nafura-erp-dev rollout restart deployment/erp-backend

NAFOPS_INFRA_BACKEND=kubernetes NAFOPS_OVERLAY_ENV=dev node tools/naf/ops/nafops.mjs build app --app erp --web
kubectl -n nafura-erp-dev set image deployment/erp-web erp-web=erp-web:$(cat .naf/state/erp-web-image.tag)
kubectl -n nafura-erp-dev rollout restart deployment/erp-web
```

Pipeline seed + crawl : `node web/tests/e2e/scripts/seed-qa-all.mjs` puis `node web/tests/e2e/scripts/crawl-qa-routes.mjs`.

> **Browser QA automatisé** : les tours onboarding (`nafura-tour-seen-*` dans localStorage) peuvent rediriger la première visite (ex. `/chantiers/situations` → liste chantiers, `/marches/avenants` → factures). Pré-marquer les tours vus ou les fermer avant les checks Playwright. Captures : `web/test-results/qa-browser-run/`.

> **Routes finance (réelles)** : plan CGNC → `/finance/plans-comptables` · écritures → `/finance/journaux/ecritures` · FF → `/finance/factures-fournisseurs` · règlements → `/finance/reglements` (pas `/finance/comptabilite/*`).

## Index des modules

| # | Module | Fichier | Sous-menus couverts |
|---|--------|---------|---------------------|
| 00 | Tableau de bord | [00-tableau-de-bord.md](00-tableau-de-bord.md) | Direction · Conducteur travaux · Comptabilité |
| 01 | Chantiers | [01-chantiers.md](01-chantiers.md) | Exécution · Pilotage · Documentation |
| 02 | Achats & Approvisionnement | [02-achats.md](02-achats.md) | Expression du besoin · Engagements · Référentiel |
| 03 | Stock & Logistique | [03-stock-logistique.md](03-stock-logistique.md) | Mouvements · Suivi · Catalogue · Configuration |
| 04 | Matériel & Équipements | [04-materiel-equipements.md](04-materiel-equipements.md) | Exploitation · Maintenance |
| 05 | Études & Devis | [05-etudes-devis.md](05-etudes-devis.md) | Chiffrage · Soumissions |
| 06 | Marchés & Facturation | [06-marches-facturation.md](06-marches-facturation.md) | Marchés publics · Cycle client · Facturation · Référentiel |
| 07 | Finance & Comptabilité | [07-finance-comptabilite.md](07-finance-comptabilite.md) | Comptabilité · Trésorerie · Déclarations · Configuration |
| 08 | Ressources Humaines | [08-ressources-humaines.md](08-ressources-humaines.md) | Employés · Pointage · Planning · Congés · Paie · Déclarations |
| 09 | Qualité & HSE | [09-qualite-hse.md](09-qualite-hse.md) | Incidents · NC · Inspections · Formations · EPI · Registres |
| 10 | Pilotage & Analyses | [10-pilotage-analyses.md](10-pilotage-analyses.md) | Pilotage décisionnel · Analyses avancées · Rapports |

## Légende des statuts

- `[ ]` à tester · `[x]` testé OK · `[!]` anomalie (référencer le ticket)

## Socle « liste standard » (anatomy)

La plupart des pages de liste sont **config-driven** (framework *anatomy*) et partagent le même socle. Pour éviter la répétition, chaque page hérite implicitement de ce socle ; seules les **spécificités** (filtres, colonnes, actions métier) sont détaillées dans les fichiers module.

Socle liste :

- [ ] **Chargement** : la liste se charge sans erreur console, en-tête + colonnes corrects.
- [ ] **Recherche** plein-texte sur les colonnes indexées.
- [ ] **Filtres** : chaque filtre déclaré applique/réinitialise correctement le résultat.
- [ ] **Tri** par colonne (asc/desc) + tri par défaut respecté.
- [ ] **Affichage colonnes** (column toggle) : masquer/afficher persiste sur la vue.
- [ ] **Pagination** : taille de page, navigation, total cohérent.
- [ ] **Rafraîchir** recharge les données.
- [ ] **État vide** : message + CTA de création quand 0 résultat.
- [ ] **Sélection multiple** (si activée) → actions de masse (suppression).
- [ ] **Export CSV** de la vue/filtré (si exposé sur la page).

Socle détail / création :

- [ ] **Créer** : bouton `+` ou CTA état vide → formulaire vierge.
- [ ] **Champs requis** : validation bloque l'enregistrement, messages clairs.
- [ ] **Enregistrer** (disquette) : persistance, toast succès, retour liste/détail.
- [ ] **Éditer** un enregistrement existant : pré-remplissage, modification, save.
- [ ] **Supprimer** : confirmation (dialog DS), suppression effective.
- [ ] **Actions métier** : transitions de statut spécifiques (détaillées par page).
- [ ] **Audit** : l'action est tracée (CREATE/UPDATE/DELETE/APPROVE…).

## Jeux de données de référence (seed réel observé)

Données réellement présentes dans le tenant **nafura · Siège**, réutilisables comme contexte :

| Entité | Valeurs |
|--------|---------|
| Chantiers | CH-2026-001 *Chantier QA csh4tq*, CH-2026-002 *Chantier QA cu7cqa*, CH-2026-003 *Chantier audit CRUD test*, **CH-2026-004 *Résidence Al Manar*** |
| CH-2026-004 | Budget 5 000 000 MAD HT · TVA 20 % · Caution garantie 7 % · Casablanca · R+4, 24 logements · OS 01/07/2026 → fin 30/06/2027 · Marché **MARCHE-2026-001** |
| Intervenants CH-004 | Client *Client QA csh4tq* · Chef chantier *Karim Benali* (`MAT-001`) · Conducteur travaux *Said Amrani* (`MAT-002`) |
| Fournisseur achats | **Sika Maroc SARL** (`FRN-SIKA-QA`) |
| Parc matériel | **ENG-PEL-01**, **ENG-CAM-04**, **ENG-GRU-02** |

> Données QA créées via ERP le 2026-06-19 : `node web/tests/e2e/scripts/seed-qa-all.mjs`

Scripts par module (indépendants, idempotents) :

| Script | Module |
|--------|--------|
| `seed-qa-ref-data.mjs` | RH base, Sika, parc matériel |
| `seed-qa-achats.mjs` | DA, BC, réception |
| `seed-qa-etudes.mjs` | BPU, métré, DPGF, devis |
| `seed-qa-materiel-ext.mjs` | Affectations, notes GMAO |
| `seed-qa-finance.mjs` | Conditions paiement, taux, écritures |
| `seed-qa-marches.mjs` | Client Al Manar, MARCHE-2026-002, avenant VRD, BCC |
| `seed-qa-rh-paie.mjs` | Fiches paie |
| `seed-qa-hse.mjs` | NC qualité enrobage acier |
| Lots CH-004 | **L01** *Gros œuvre* (sans BPU) · **L10** *Fondations* — 1000 m³ × 1 500 MAD = **1 500 000 MAD HT** — avancement 0 % |

> ⚠️ **Audit 2026-06-19** : L10 CH-2026-004 a un avancement **40 %** saisi (400 m³). KPI dashboard **40 %** moyen, **5** chantiers en cours. Seed RH + paie OK (Karim `MAT-001`, `PAI-2026-0002`). Rapport crawl : `docs/qa/erp-audit-2026-06-19/route-crawl.json` (**119 routes, 119 OK** navigation).

> **Redéploiement 2026-06-19 (soir)** : web `dev-20260619222244` (fix transitions situation) · backend `erp-backend:dev` (DPGF buildTree) · seed-all **7/7 OK** · crawl **119/119 OK**. Si pod backend bloqué en `Init:0/1` (Vault `namespace not authorized`), relancer `provisionVault('erp')` via nafops puis `kubectl -n nafura-erp-dev delete pod -l app=erp-backend`.

## Conventions de données (contexte Maroc / BTP)

- Devise **MAD**, locale `fr-MA`, TVA standard **20 %**, retenue de garantie **7 %**.
- Identifiants : ICE (15 chiffres), IF, RC, CNSS, patente.
- Téléphones `+212 6XX-XXXXXX`, villes Casablanca / Rabat / Tanger / Marrakech.
- Unités BTP : m³, m², ml, U, T, kg, h, j, forfait (fft).
