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
| Sous-domaine prod | `sektor.nafuralabs.com` (inchangé) |
| Couleur primaire | **Cobalt `#1B3FAE`** → token `--nf-color-primary-500` |
| Accent | **Jaune hi-vis `#F2D544`** → token `--nf-color-accent-400` (usage parcimonieux) |
| Texte sur jaune | **Encre `#131415`** (`--nf-color-accent-contrast`) — jamais de blanc |
| Police UI | Plus Jakarta Sans (existante) ; Space Grotesk réservé au logo |
| Source de vérité couleur | `app/applications/erp/styles/brand-sektor.scss` |

Le rebrand **centralisé** est déjà fait (tokens, titre, favicon, assets `/assets/branding/sektor-*.svg`). Ce qui reste est **distribué** dans les features.

---

## 1. Les 4 règles d'or (constitution UI)

1. **Composant avant HTML.** Tout élément d'UI doit passer par un atome/molécule/organisme `nf-` s'il existe. Pas de `<button>`, `<input>`, `mat-form-field` bruts dans les features.
2. **Token avant valeur en dur.** Aucune couleur hexadécimale dans les features. Toujours une variable `--nf-color-*`. Idem espacements (`--nf-space-*`) et typo (`--nf-text-*`).
3. **Un seul système d'icônes.** `nf-icon` (lucide) partout. Plus de `mat-icon`, FontAwesome ou primeicons dans les features.
4. **Zéro chaîne en dur.** Tout texte visible passe par i18n (`ngx-translate`). Les lints i18n existants font foi.

---

## 2. Dette — baseline initiale vs état actuel

> ✅ **STATUT (mis à jour 2026-06-17) : la passe d'homogénisation de masse est FAITE.** Mesuré sur `app/applications/erp` :

| Symptôme | Baseline initiale | Actuel | Reste à faire |
|---|---:|---:|---|
| Lignes avec couleur hex en dur | ~2 950 | **31** | rien — ce sont des définitions de tokens, des fallbacks `var(--x, #hex)` (pattern correct) et un template email HSE |
| Balises `<button>` brutes | 336 | **4** | rien — les 4 sont un `mat-menu` légitime (`mat-menu-item` exige `<button>`) |
| `mat-form-field` bruts | 35 | **0** | ✔ terminé |
| `mat-select` bruts | 13 | **0** | ✔ terminé |
| `mat-icon` bruts | 33 | **0** | ✔ terminé |

> La fondation est saine : `nf-page-shell` / `nf-page-header` adoptés partout, aucun `p-*` PrimeNG brut dans les features. Les WP ci-dessous restent comme **référence/garde-fou** pour le code futur, pas comme backlog actif.

### Bugs de rendu corrigés (audit live 2026-06-17)
- **Box parasite du compteur complétude** : `completeness-meter.component.ts` utilisait `<nf-button variant="secondary">` (bordure cobalt 1px). Corrigé en `variant="ghost" size="sm"`. Règle : un indicateur cliquable mais non-bouton = variante `ghost`, jamais `secondary`/`stroked`.
- **Débordement horizontal 10px** : `app.component.ts` avait `width: 100vw` (inclut la gouttière de scrollbar). Corrigé en `width: 100%` + `overflow-x: hidden`. Règle : jamais `100vw` sur un conteneur racine.

---

## 3. Catalogue canonique (mapping « brut → nf- »)

| Si tu vois… | Remplace par | Notes |
|---|---|---|
| `<button mat-button>` / `<button>` | `<nf-button>` | variants: `primary` `secondary` `ghost` `danger`; input `[loading]`, `[icon]` |
| `<input>` / `mat-form-field` + `matInput` | `<nf-input>` | ou directive `[nfField]` sur control existant |
| `<mat-select>` | `<nf-select>` | options via `[options]` |
| `<mat-icon>fav</mat-icon>` | `<nf-icon name="…">` | noms lucide |
| montant / argent | `<nf-money-input>` / `--nf-color-amount-*` | MAD |
| téléphone / ICE / RIB | `<nf-phone-ma-input>` `<nf-ice-input>` `<nf-rib-input>` | métier Maroc |
| badge / statut | `<nf-badge>` / `<nf-status-badge>` | mappe les tokens `--nf-status-*` |
| carte stat | `<nf-stat-card>` / `<nf-kpi-strip>` | |
| tableau | `<nf-data-table>` / `<nf-entity-listing>` | |
| modale / dialog | `<nf-modal>` / `<nf-confirm-dialog>` | |
| toast / alerte | `<nf-toast>` / `<nf-alert>` | |
| état vide / chargement / erreur | `<nf-empty-state>` `<nf-loading-state>` `<nf-error-state>` | |

Référentiel complet : `app/platform/lib/anatomy/components/COMPONENTS.md`.

---

## 4. Work packages

> Pour **chaque** WP : créer une branche `homog/<wp>-<feature>`, limiter le diff à **un dossier de feature**, faire passer les *acceptance gates* (§5), ouvrir une PR par feature.

### WP1 — Vérifier la propagation du rebrand
**Objectif** : confirmer que le cobalt remonte via les tokens.
- Lancer l'app, vérifier : tuile sidebar « S », boutons primaires, liens, focus, barres de progression = cobalt ; titre onglet = « Nafura Sektor » ; favicon = glyphe.
- **Détection** des bleus en dur qui ne suivront PAS le token (à corriger en WP4) :
  ```bash
  grep -rEn "#2563eb|#1d4ed8|#3b82f6|#1e40af|#1e3a8a|#93c5fd" app/applications/erp
  ```
- **DoD** : aucune zone « bleue » résiduelle à côté du cobalt sur les écrans clés (dashboard, listing chantiers, détail chantier).

### WP2 — Migration des boutons (336 → `nf-button`)
- **Détection** :
  ```bash
  grep -rEn "<button" app/applications/erp/pages/<feature> --include=*.html --include=*.ts
  ```
- **Règles de transformation** :
  - Action principale → `<nf-button variant="primary">`
  - Action secondaire → `variant="secondary"`
  - Action discrète (icône, lien) → `variant="ghost"`
  - Suppression/destructif → `variant="danger"`
  - `(click)` conservé ; spinner → `[loading]` au lieu d'un `*ngIf` manuel ; icône → `[icon]="'plus'"`.
- **Exemple** :
  ```html
  <!-- AVANT -->
  <button class="btn btn-primary" (click)="save()"><mat-icon>save</mat-icon> Enregistrer</button>
  <!-- APRÈS -->
  <nf-button variant="primary" icon="save" (click)="save()">{{ 'common.save' | translate }}</nf-button>
  ```
- **DoD** : `grep -c "<button" <feature>` = 0 (hors la définition de l'atome lui-même) ; aucune régression de comportement ; labels i18n.

### WP3 — Champs de formulaire (`mat-form-field`/`mat-select` → `nf-input`/`nf-select`)
- **Détection** : `grep -rEn "mat-form-field|mat-select|matInput" app/applications/erp/pages/<feature>`
- **Règles** : remplacer le couple `mat-form-field`+`matInput` par `<nf-input>` (label, hint, error en inputs) ; `mat-select` → `<nf-select [options]>`. Conserver la liaison `formControlName`.
- **Garde-fou** : valider l'intégration `ReactiveForms` (validators, états `touched/dirty`, `nf-form-error-summary`).
- **DoD** : 0 `mat-form-field`/`mat-select` dans la feature ; formulaires testés (submit + erreurs).

### WP4 — Couleurs en dur → tokens (le gros morceau : ~2 950)
- **Détection** : `grep -rEn "#[0-9a-fA-F]{3,6}\b" app/applications/erp/pages/<feature> --include=*.html --include=*.scss --include=*.ts`
- **Table de correspondance** (hex Tailwind fréquents → token sémantique) :

  | Hex en dur | Token cible |
  |---|---|
  | `#2563eb` `#1d4ed8` `#3b82f6` | `--nf-color-primary-600/700/500` |
  | `#93c5fd` `#dbeafe` `#eff6ff` | `--nf-color-primary-300/100/50` |
  | `#0f172a` `#1e293b` | `--nf-text-primary` |
  | `#475569` `#64748b` | `--nf-color-text-secondary` |
  | `#94a3b8` `#cbd5e1` | `--nf-color-text-muted` / `--nf-color-border` |
  | `#e2e8f0` `#f1f5f9` | `--nf-color-border` / `--nf-color-bg-muted` |
  | `#f8fafc` `#ffffff` | `--nf-color-bg-subtle` / `--nf-color-surface` |
  | `#16a34a` `#15803d` | `--nf-color-success-600/700` |
  | `#dc2626` `#b91c1c` | `--nf-color-danger-600/700` |
  | `#f59e0b` `#d97706` | `--nf-color-warning-500/600` |
  | statut chantier | `--nf-color-chantier-*` (déjà défini) |
- **Principe** : préférer le **token sémantique** (text/border/surface) au token de teinte brut. En cas de doute, choisir le rôle, pas la couleur.
- **DoD** : 0 hex dans la feature ; `npm run lint:no-hardcoded-string` ne régresse pas (idéalement baisse le ratchet).

### WP5 — Unifier les icônes (`mat-icon` → `nf-icon`)
- **Détection** : `grep -rEn "<mat-icon" app/applications/erp/pages/<feature>`
- **Règle** : `<mat-icon>name</mat-icon>` → `<nf-icon name="<lucide-equivalent>">`. Table de correspondance Material→lucide à maintenir dans `nf-icon` (ex. `save`→`save`, `delete`→`trash-2`, `edit`→`pencil`, `add`→`plus`, `more_vert`→`more-vertical`).
- **DoD** : 0 `mat-icon` dans la feature ; icônes visuellement équivalentes.

### WP6 — Styles inline & espacements
- **Détection** : `grep -rEn "style=\"" app/applications/erp/pages/<feature> --include=*.html`
- **Règle** : déplacer vers la feuille de style du composant en utilisant `--nf-space-*` ; supprimer les `style="color:…"` (→ tokens).
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

---

## 6. Garde-fous (ne PAS faire)

- ❌ Ne pas modifier `app/platform/lib/anatomy/**` (la lib) pour « contourner » — corriger le site d'appel, pas l'atome. Exception : ajouter un variant manquant, avec story + revue.
- ❌ Ne pas réintroduire de couleur en dur « juste pour ce cas ».
- ❌ Ne pas toucher au sous-domaine ni à `environment.prod.ts` (`sektor.nafuralabs.com` reste).
- ❌ Ne pas mettre de jaune hi-vis en aplat de fond large, ni sous du texte blanc.
- ❌ Ne pas mélanger plusieurs WP dans une même PR.
- ⚠️ Garder le jaune marque **distinct** du `warning` (ambre `#f59e0b`) : le jaune = accent de marque, l'ambre = avertissement.

---

## 7. Protocole agent (boucle d'exécution)

1. Choisir **une** feature non traitée dans `app/applications/erp/pages/` (tenir un tableau d'avancement en tête de PR).
2. Pour cette feature, exécuter WP2 → WP3 → WP5 → WP4 → WP6 (boutons et champs d'abord, couleurs ensuite).
3. Faire passer **toutes** les gates §5.
4. PR `homog/<feature>` avec : avant/après (captures), commandes de détection retournant 0, gates vertes.
5. Passer à la feature suivante.

**Ordre de priorité des features** (impact visuel décroissant) : `dashboard` → `chantiers` (listing + détail) → `marches`/facturation → `achats` → `stock` → `administration` → le reste.

---

## 8. Definition of Done global

- `grep -rEn "<button|mat-form-field|mat-select|mat-icon|#[0-9a-fA-F]{6}" app/applications/erp` → **0** (hors lib anatomy).
- Toutes les gates §5 vertes sur `main`.
- Captures dashboard + détail chantier : 100 % cobalt/jaune, plus aucun bleu Tailwind résiduel.
