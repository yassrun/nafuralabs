# Nafura Sektor — Plan d'homogénisation & rebrand (pour agents)

> **But** : rendre l'app ERP cohérente en (1) appliquant le rebrand **Nafura Sektor** (cobalt + jaune hi-vis) et (2) en faisant adopter partout la bibliothèque de composants `nf-` (anatomy) au lieu des composants ad-hoc, Material bruts et couleurs en dur.
>
> **Audience** : agents d'exécution autonomes. Chaque *work package* (WP) ci-dessous est autonome, mesurable et vérifiable. Travaillez **un dossier de feature à la fois**.

---

## 0. Contexte & décisions figées

| Élément | Valeur |
|---|---|
| Nom produit | **Nafura Sektor** (toujours accolé au descripteur « ERP Construction ») |
| Marque mère | Nafura Labs |
| Sous-domaine staging | `sektor.nafuralabs.staging` / `api.sektor.nafuralabs.staging` |
| Sous-domaine prod | `sektor.nafuralabs.com` / `api.sektor.nafuralabs.com` |
| Couleur primaire | **Cobalt `#1B3FAE`** → token `--nf-color-primary-500` |
| Accent | **Jaune hi-vis `#F2D544`** → token `--nf-color-accent-400` (usage parcimonieux) |
| Texte sur jaune | **Encre `#131415`** (`--nf-color-accent-contrast`) — jamais de blanc |
| Police UI | Plus Jakarta Sans (existante) ; Space Grotesk réservé au logo |
| Source de vérité couleur | `products/sektor-btp/web/app/styles/brand-sektor.scss` |

Le rebrand **centralisé** est déjà fait (tokens, titre, favicon, assets `/assets/branding/sektor-*.svg`). Ce qui reste est **distribué** dans les features.

---

## 1. Les 5 règles d'or (constitution UI)

1. **Composant avant HTML.** Tout élément d'UI doit passer par un atome/molécule/organisme `nf-` s'il existe. Pas de `<button>`, `<input>`, `mat-form-field` bruts dans les features.
2. **Token avant valeur en dur.** Aucune couleur hexadécimale dans les features. Toujours une variable `--nf-color-*`. Idem espacements (`--nf-space-*`) et typo (`--nf-text-*`).
3. **Un seul système d'icônes.** `nf-icon` (lucide) partout. Plus de `mat-icon`, FontAwesome ou primeicons dans les features.
4. **Zéro chaîne en dur.** Tout texte visible passe par i18n (`ngx-translate`). Les lints i18n existants font foi.
5. **Placement des actions selon le type d’écran** (voir §1.1). Ne pas inventer une position ad hoc.

### 1.1 Placement des actions (haut vs bas)

| Type d’écran | Où vont les actions | Composant |
|---|---|---|
| **Listing** | **Haut** — CTA création / export | `nf-page-header` (`primaryAction` / slot `[actions]`) |
| **Détail / workspace** | **Haut** — CTA workflow (valider, refuser, avancer) | `nf-page-header` ou bandeau summary (ex. `dossier-summary-header`) |
| **Formulaire create/edit court** | **Bas** du form — Annuler + Enregistrer | `nf-action-bar align="right"` |
| **Formulaire long / scroll** | **Bas sticky** | `nf-action-bar` sticky |
| **Dialog / modal** | **Footer** uniquement | footer `nf-modal` / dialog anatomy — pas de CTA primaire flottant dans le body |
| **Filtres** | Sous le header, **jamais** mélangés au CTA primaire | `nf-filter-bar` / `nf-select` |

**Ordre dans une barre** : ghost/secondary → primary (primary **toujours à droite**). Danger isolé (pas collé au primary sans séparation).

---

## 2. Dette — baseline

> ⚠️ **STATUT (mis à jour 2026-07-27)** : la passe de masse de juin 2026 a **régressé**. Mesure sur `products/sektor-btp/web/app` :

| Symptôme | Baseline initiale (pré-juin) | Juin 2026 (claim) | **Actuel 2026-07-27** | Reste à faire |
|---|---:|---:|---:|---|
| Couleurs hex en dur (hors tokens / fallbacks) | ~2 950 | ~31 | hotspot **études/dossiers** + shell notifs | tokens `--nf-*` |
| Balises `<button>` brutes | 336 | 4 | **~57** / 15 fichiers | → `nf-button` |
| `<select>` natifs | — | 0 `mat-select` | **~132** / 73 fichiers | → `nf-select` |
| `mat-icon` bruts | 33 | 0 | **~16** (études) | → `nf-icon` |
| `MatDialog` (UI interne) | — | — | **~54** / 20 fichiers | footer `nf-button` ; migration `nf-modal` plus tard |

**Priorité vague 1** : `pages/etudes/dossiers/**` + `pages/chantiers/documents/**`.  
**Vagues suivantes** : Finance selects → Chantiers create/edit/gantt → RH/HSE filtres → ventes/shell/dashboard.

### Bugs de rendu corrigés (audit live 2026-06-17)
- **Box parasite du compteur complétude** : `completeness-meter.component.ts` utilisait `<nf-button variant="secondary">` (bordure cobalt 1px). Corrigé en `variant="ghost" size="sm"`. Règle : un indicateur cliquable mais non-bouton = variante `ghost`, jamais `secondary`/`stroked`.
- **Débordement horizontal 10px** : `app.component.ts` avait `width: 100vw` (inclut la gouttière de scrollbar). Corrigé en `width: 100%` + `overflow-x: hidden`. Règle : jamais `100vw` sur un conteneur racine.

---

## 3. Catalogue canonique (mapping « brut → nf- »)

| Si tu vois… | Remplace par | Notes |
|---|---|---|
| `<button mat-button>` / `<button>` | `<nf-button>` | variants: `primary` `secondary` `ghost` `danger`; input `[loading]`, `[icon]` ; event `(clicked)` |
| `<input>` / `mat-form-field` + `matInput` | `<nf-input>` | ou directive `[nfField]` sur control existant |
| `<select>` / `<mat-select>` | `<nf-select>` | options via `[options]` |
| `<mat-icon>fav</mat-icon>` | `<nf-icon name="…">` | noms lucide |
| montant / argent | `<nf-money-input>` / `--nf-color-amount-*` | MAD |
| téléphone / ICE / RIB | `<nf-phone-ma-input>` `<nf-ice-input>` `<nf-rib-input>` | métier Maroc |
| badge / statut | `<nf-badge>` / `<nf-status-badge>` | mappe les tokens `--nf-status-*` |
| carte stat | `<nf-stat-card>` / `<nf-kpi-strip>` | |
| tableau | `<nf-data-table>` / `<nf-entity-listing>` | |
| modale / dialog | `<nf-modal>` / `<nf-confirm-dialog>` / `ConfirmDialogService` | |
| toast / alerte | `<nf-toast>` / `<nf-alert>` | |
| état vide / chargement / erreur | `<nf-empty-state>` `<nf-loading-state>` `<nf-error-state>` | |
| barre d’actions form | `<nf-action-bar align="right">` | bas de formulaire |

Référentiel complet : `platform/web/lib/anatomy/components/COMPONENTS.md`.

---

## 4. Work packages

> Pour **chaque** WP : créer une branche `homog/<wp>-<feature>`, limiter le diff à **un dossier de feature**, faire passer les *acceptance gates* (§5), ouvrir une PR par feature.

### WP1 — Vérifier la propagation du rebrand
**Objectif** : confirmer que le cobalt remonte via les tokens.
- Lancer l'app, vérifier : tuile sidebar « S », boutons primaires, liens, focus, barres de progression = cobalt ; titre onglet = « Nafura Sektor » ; favicon = glyphe.
- **Détection** des bleus en dur qui ne suivront PAS le token (à corriger en WP4) :
  ```bash
  rg -n "#2563eb|#1d4ed8|#3b82f6|#1e40af|#1e3a8a|#93c5fd" products/sektor-btp/web/app
  ```
- **DoD** : aucune zone « bleue » résiduelle à côté du cobalt sur les écrans clés (dashboard, listing chantiers, détail chantier).

### WP2 — Migration des boutons → `nf-button`
- **Détection** :
  ```bash
  rg -n "<button" products/sektor-btp/web/app/pages/<feature> -g '*.html' -g '*.ts'
  ```
- **Règles de transformation** :
  - Action principale → `<nf-button variant="primary">`
  - Action secondaire → `variant="secondary"`
  - Action discrète (icône, lien) → `variant="ghost"`
  - Suppression/destructif → `variant="danger"`
  - `(click)` → `(clicked)` ; spinner → `[loading]` ; icône → `icon="plus"` + `iconLibrary="lucide"` si besoin.
  - Respecter le **placement** §1.1 (listing/détail en haut, form en bas).
- **DoD** : `rg -c "<button" <feature>` = 0 (hors mat-menu-item légitime) ; labels i18n ; placement conforme.

### WP3 — Champs de formulaire (`<select>` / inputs → `nf-input`/`nf-select`)
- **Détection** : `rg -n "<select\b|mat-form-field|mat-select|matInput" products/sektor-btp/web/app/pages/<feature>`
- **Règles** : `<select>` → `<nf-select [options]>` ; inputs texte form → `<nf-input>`. Conserver la liaison forms.
- **Exception** : grilles denses (DPGF / mètres) — inputs natifs tolérés jusqu’à un atome grille dédié.
- **DoD** : 0 `<select>` dans la feature (hors exception documentée) ; formulaires testés.

### WP4 — Couleurs en dur → tokens
- **Détection** : `rg -n "#[0-9a-fA-F]{3,6}\b" products/sektor-btp/web/app/pages/<feature>`
- Préférer le **token sémantique** (text/border/surface) au token de teinte brut.
- **DoD** : 0 hex injustifié dans la feature.

### WP5 — Unifier les icônes (`mat-icon` → `nf-icon`)
- **Détection** : `rg -n "<mat-icon" products/sektor-btp/web/app/pages/<feature>`
- **Règle** : Material → lucide (`edit`→`pencil`, `delete`→`trash-2`, `add`→`plus`, `content_copy`→`copy`, etc.).
- **DoD** : 0 `mat-icon` dans la feature.

### WP6 — Styles inline & espacements
- **Détection** : `rg -n 'style="' products/sektor-btp/web/app/pages/<feature> -g '*.html'`
- **DoD** : 0 `style="…"` lié à couleur/espacement.

---

## 5. Acceptance gates (à passer pour chaque PR)

```bash
npm run lint                       # ESLint + règles maison
npm run lint:no-hardcoded-string   # couleurs/strings en dur (ne doit pas régresser)
npm run i18n:check                 # parité des traductions fr/en/ar
npm run build:prod                 # build SSR/prod OK
npm run e2e:a11y                   # accessibilité (axe) sur pages critiques
```
- Storybook : si un atome/molécule est modifié, mettre à jour son *story* et `npm run build-storybook`.
- **Contraste** : tout texte sur cobalt = blanc (OK) ; tout texte sur jaune hi-vis = encre `#131415` (jamais blanc).
- **Placement** : listing CTA haut ; form save bas ; detail workflow haut ; dialog footer.

---

## 6. Garde-fous (ne PAS faire)

- ❌ Ne pas modifier `platform/web/lib/anatomy/**` (la lib) pour « contourner » — corriger le site d'appel, pas l'atome. Exception : ajouter un variant manquant, avec story + revue.
- ❌ Ne pas réintroduire de couleur en dur « juste pour ce cas ».
- ❌ Ne pas toucher au sous-domaine ni à `environment.prod.ts` (`sektor.nafuralabs.com` reste).
- ❌ Ne pas mettre de jaune hi-vis en aplat de fond large, ni sous du texte blanc.
- ❌ Ne pas mélanger plusieurs WP dans une même PR (sauf vague inventaire documentée, ex. `homog/etudes-documents`).
- ⚠️ Garder le jaune marque **distinct** du `warning` (ambre `#f59e0b`) : le jaune = accent de marque, l'ambre = avertissement.

---

## 7. Protocole agent (boucle d'exécution)

1. Choisir **une** feature non traitée dans `products/sektor-btp/web/app/pages/` (tenir un tableau d'avancement en tête de PR).
2. Pour cette feature, exécuter WP2 → WP3 → WP5 → WP4 → WP6 (boutons et champs d'abord, couleurs ensuite) **en appliquant §1.1**.
3. Faire passer **toutes** les gates §5.
4. PR `homog/<feature>` avec : avant/après (captures), commandes de détection retournant 0, gates vertes.
5. Passer à la feature suivante.

**Ordre de priorité (vague 1+)** : `etudes/dossiers` → `chantiers/documents` → `finance` (selects) → `chantiers` create/edit → `rh`/`hse` → reste.

---

## 8. Definition of Done global

- `rg -n "<button\b|<select\b|mat-form-field|mat-select|mat-icon" products/sektor-btp/web/app/pages` → **0** (hors exceptions documentées : mat-menu-item, grilles denses).
- Toutes les gates §5 vertes sur `main`.
- Placement conforme §1.1 sur les écrans clés.
- Captures dashboard + détail chantier : 100 % cobalt/jaune, plus aucun bleu Tailwind résiduel.
