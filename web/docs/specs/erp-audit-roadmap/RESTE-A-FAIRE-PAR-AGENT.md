# Reste à faire — par agent (ERP web)

> **Source de vérité :** [`00-PROGRESS.md`](00-PROGRESS.md) (snapshot **2026-05-13**).  
> **Carte agents :** [`AGENT_COMPLETION_PROMPTS.md`](AGENT_COMPLETION_PROMPTS.md) (R01–R07).  
> Mettre à jour ce fichier quand une tâche est bouclée ou réaffectée.

---

## R01 — Foundations & chantiers (§01–02)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| 01.x | Foundations (locale, MAD, i18n, seeds, dashboard…) | ✅ | Veille non-régression (`lint:no-dollar`, `\| currency`, seeds `SEED_CHANTIERS` / codes `ch-00x` + `CH-2025-00x`). |
| 02.x | Bugs chantiers (fiche, drill-down, routes ST/docs, Gantt) | ✅ | Idem veille si PR touche planning / mocks chantiers. |
| — | **Spec produit chantiers** (`erp-frontend-agents/02-chantiers/01-chantiers-liste.md`) | Hors §02 checklist | **Création chantier** : CTA « + Nouveau chantier » sur liste `/chantiers`, route **`/chantiers/new`**, assistant 3 étapes (identité / client & marché / localisation & financier) sur fiche ou composant dédié ; brancher mock + `erpAudit` si création sensible. |
| — | Navigation conversion devis → chantier | Bug | Corriger `navigate(['/chantiers/chantiers/new', …])` → chemin aligné sur `CHANTIERS_ROUTES` (ex. `['/chantiers', 'new']` + `queryParams`), fichiers études type `devis-detail` / `aoc-detail`. |

---

## R02 — Shell / UX & tables / formulaires (§03–04)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| 03.x | Shell (breadcrumbs, palette, notifs, RTL, création standard…) | ✅ | Veille si nouvelles routes sans `data.breadcrumb` ou sans pattern bouton création. |
| **4.6** | Inputs MA (`ice` / `rib` / `phone-ma` / `money-ma` + `buildForm`) | 🟡 | Finaliser **détail sous-traitant** plein `entity-detail` si page dédiée ; **compteurs non monétaires** ; généraliser `buildForm` sur formulaires restants achats / ventes / RH au fil de l’eau. |
| 4.2 | États loading / empty / error | ✅ (caveat) | Optionnel : harmoniser pages **liste ad hoc** hors `nf-entity-listing` (cf. colonne évidence **4.2** dans `00-PROGRESS.md`). |

---

## R03 — Stock (§05)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| 05.x | Magasins, articles, mouvements (dont sorties), inventaires, valorisation, alertes, liaison budget V2 | ✅ | **Veille** : un écran liste **non paginé** très volumineux pourrait nécessiter virtualisation `mat-table` (cf. note **4.1**). Pas de tâche §05 ouverte dans le snapshot. |

---

## R04 — Marchés, pilotage, administration (§06–08)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| 06–08.x | Marchés / facturation, pilotage / approbations, admin (IAM, sociétés, audit log, reset, login démo) | ✅ (sauf backlog transversal) | **Backlog** (fin `00-PROGRESS.md`) : filtrer les **datasets mock par `currentSocieteId`** où pertinent ; tracer la **société courante** dans `erpAudit.log()` pour traçabilité multi-société. |

---

## R05 — HSE & paie / fiscal MA (§09–10)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| 09.x | HSE (incidents, NC, inspections, formations, EPI, DUER, PPSPS, visites, registres, TB) | ✅ | Veille + compléments métier si MOA impose de nouveaux champs / exports. |
| **10.5** | Engine fiscal centralisé (TVA autoliquidation, etc.) | ✅ (nuance) | **Reste possible** (doc) : extraire d’autres briques **hors TVA** (ex. logique **IGR** encore dans `PaieEngineService`) si objectif « tout fiscal sous services dédiés ». |
| 10.x | Reste paie / DGI / tests PaieEngine | ✅ | Maintenir tests et seeds si évolution barème ou déclarations. |

---

## R06 — Design system, exports, tests & audit (§11, §12, §14)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| **(typo)** §11 | Hiérarchie typographique `--nf-text-*` | 🟡 | Variables posées dans `styles.scss` + shell ; **migrer progressivement les pages métier** hors `nf-page-shell` / `nf-page-header`. |
| **12.1** | Export listings | 🟡 | Poursuivre généralisation / cohérence **export CSV** + audit (`LISTING_EXPORT_AUDIT`) ; garder `<nf-export-button>` pour cas ad hoc documentés. |
| **12.2** | Templates imprimables | 🟡 | Gabarits déjà : devis, fiche paie (cf. évidence). **Manquent** notamment : contrat marché, BR, DGD, etc. (liste **§12.2** spec audit). |
| **12.3** | PDF côté serveur | 🟡 | Démo **Playwright** + doc existante ; monter en charge vers **pipeline PDF** minimal prod si besoin (contrat URL/HTML → PDF). |
| **14.1** | Audit log centralisé | 🟡 | Poursuivre `erpAudit` sur **facades / exports ad hoc** restants (mutations + exports légaux en priorité). |
| **14.2** | Tests unitaires moteurs | 🟡 | Étendre **couverture** et mesure ; autres moteurs métier au-delà de Paie / pilotage / K / RG / avancement déjà couverts. |

**Coordination avec R07 :** ne pas faire deux PR en parallèle sur les mêmes **fichiers SCSS globaux** pour la typo — ordre conseillé : **R06** fige / étend les tokens, **R07** applique sur écrans polish.

---

## R07 — RH terrain & polish (§13, §15)

| ID | Tâche | Statut roadmap | Reste / actions |
|----|--------|----------------|-----------------|
| **13.6** | PWA / offline-first | ✅ (demo) | **Prod** : vrai **backend**, sync / **résolution de conflits** serveur (au-delà du mock `localStorage` + fingerprint). |
| **15.4** | Tooltips | 🟡 | Étendre **`nfTooltip`** aux barres d’outils **icônes seules** sur davantage d’écrans **prioritaires** (mesurable). |
| **15.6** | Réinitialiser filtres | 🟡 | `nf-entity-listing` OK ; rapprocher le **ratio global** listings ad hoc vs attente spec. |
| **15.8** | Polish typographique | 🟡 | Aligner composants métier sur l’échelle **§11** (cf. coordination **R06**). |

---

## Backlog transversal (tout agent, hors tableau détaillé)

- **NumberingService** : vérifier le câblage sur entités encore hors scope si de nouveaux flux métiers apparaissent (le plan historique mentionnait DA/AO/CT/FF/FM/SIT/AVN — recouper avec l’état réel du code avant d’investir).
- **E2E / perf** : conserver verts les jobs documentés (`e2e`, `e2e:a11y`, Lighthouse, charge) après chaque lot touchant shell ou RH.

---

## Mise à jour

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | Agent | Création depuis `00-PROGRESS.md` + écarts spec création chantier / route devis. |
