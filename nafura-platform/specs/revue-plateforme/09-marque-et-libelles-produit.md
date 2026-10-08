# 09 — Marque et libellés du produit

> Revue 2026-10-07, axes extensibilité et UX. Taille **M** (front). Le lot 1 dépend du lot 1 de la spec [11](11-formulaires-et-design-system.md) (jetons uniques, thème Material alimenté par les jetons).
> Recoupe « surcharge du design par produit » et « i18n par BC » (ROADMAP 5).

## Objectif

Un produit déclare dans `app.nafura.json` ses couleurs, et un BC ses libellés, sans fichier de style ni code. Les organisations gardent leur propre marque par-dessus.

## Besoin

- Le produit n'a que `spec.product.name`, `mark` et `logo`. Tous les produits ont donc la même couleur (`DEFAULT_PRIMARY = '#1b3fae'` dans `core/theme/theme.service.ts`), sauf si une organisation saisit la sienne.
- La marque d'**organisation** existe déjà (`TenantBranding` : logo, favicon, couleurs primaire, secondaire et d'accent, via l'identité d'organisation). Il manque l'étage **produit** entre la plateforme et l'organisation.
- Libellés :
  - la plateforme utilise ngx-translate (`platform/host/i18n/fr.json`, `public/assets/i18n/core/fr.json`) ;
  - les BCs écrivent leurs libellés en dur dans les configurations et les manifestes ;
  - `spec.i18n` ne déclare que `locales` et `namespace`.
- Conséquences :
  - pas d'arabe ni d'anglais possibles pour un BC ;
  - un produit ne peut pas renommer un terme de la plateforme (« Organisation » → « Société », « Approbations » → « Validations »).
- La clé de stockage du mode sombre s'appelle encore `seyrura:theme` (`theme-mode.service.ts`) : c'est un reste d'un ancien nom de produit.

## Existant

- `core/theme/theme.service.ts` (`ThemeService`, `TenantBranding`, `lighten` / `darken` / `contrastText`) et `theme-mode.service.ts`.
- `core/i18n/` (service, chargeur de modules, locale, pluriels ICU, chiffres arabes, calendrier hégirien).
- `platform/host/provide-nafura-host.ts` : charge `platformFr` et la locale depuis `spec.i18n.locales[0]`.
- Schéma : `platform/schemas/app.nafura.schema.json` (`$defs.i18n`).

## Contrat

### Lot 1 — Thème du produit

```json
"spec": {
  "theme": {
    "primary": "#0f766e",
    "accent": "#f59e0b",
    "radius": "md",
    "density": "comfortable",
    "font": "Plus Jakarta Sans"
  }
}
```

- Ordre d'application : jetons de la plateforme → `spec.theme` → `TenantBranding` de l'organisation (si l'organisation a le droit de personnaliser : `spec.theme.tenantOverride`, `true` par défaut).
- `ThemeService` écrit `--nf-brand-primary` et `--nf-brand-accent` ; les variantes (`-hover`, `-subtle`…) en dérivent en CSS et `--nf-primary-contrast` reste calculé par `contrastText` (spec 11, lot 1). `radius` choisit `--nf-radius-control` et `--nf-radius-card` dans l'échelle, `density` pose `nf-density-compact`, `font` remplace `--nf-font-family` (police embarquée, pas de CDN).
- Uniquement des jetons : pas de CSS libre dans le produit. Le garde-fou continue de refuser tout `.scss` dans un produit ou un BC.
- Contrôle de contraste au build : `architecture:check` refuse un `primary` dont le contraste avec le texte est inférieur à 4,5:1 (le texte est calculé par `contrastText`).

### Lot 2 — Libellés d'un BC

- `bcs/<bc>/web/i18n/<locale>.json`, sous l'espace de noms du BC (`demo.*`), chargé à la première visite du BC, avec son `index.ts`.
- Configurations et manifeste : un libellé peut être une clé (`'demo.suppliers.title'`) ou un texte. Les archétypes passent déjà par `translate` : vérifier que toutes les propriétés de libellé (`label`, `title`, `createTitle`, `messages`, `confirm`, `emptyMessage`, `navigation`) le font.
- `architecture:check` signale (avertissement, pas erreur) les textes en dur dans un BC dont `spec.i18n.locales` déclare plus d'une langue.

### Lot 3 — Surcharge de libellés par le produit

```json
"spec": {
  "i18n": {
    "locales": ["fr", "ar"],
    "overrides": { "fr": { "core.topbar.tenantMenu": "Société", "administration.approvals.title": "Validations" } }
  }
}
```

- Appliqué après les fichiers de la plateforme et des BCs.
- Une clé inconnue fait échouer le build : on ne surcharge pas une clé qui n'existe pas.

### Lot 4 — Nettoyage

- Renommer la clé `seyrura:theme` en `nafura:theme`, avec lecture de l'ancienne clé une seule fois.

## Règles

- Pas de surcharge d'**écran** ni de composant par un produit : seulement des jetons et des libellés.
- Le nom du produit reste uniquement dans `app.nafura.json` (garde-fou existant).

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. `platform-host` : `spec.theme.primary` changé → le lab prend la couleur ; une organisation avec sa propre couleur la garde.
3. BC démo en clés i18n ; `overrides` renomme « Organisation » ; une clé inconnue fait échouer `check`.
4. Mode sombre : contraste correct avec la couleur du produit.

## Critères d'acceptation

- [ ] `spec.theme` dans le schéma, appliqué, contrôlé (contraste).
- [ ] Fichiers i18n par BC chargés à la demande ; BC démo migré.
- [ ] `spec.i18n.overrides` livré et contrôlé.
- [ ] Clé `seyrura:theme` renommée.

## Documentation

- `docs/PLATFORM.md` § Manifestes : `spec.theme`, `spec.i18n.overrides`, `bcs/<bc>/web/i18n/`.
- `docs/ARCHITECTURE.md` (État et écarts) : retirer « i18n par BC ».
- `ROADMAP.md` 5 : retirer « i18n par BC » et « surcharge du design par produit ».

## Décisions ouvertes

1. L'organisation peut-elle surcharger la marque du produit (défaut `true`) ? Pour un produit en marque blanche vendu à un client, probablement `false`.
2. Arabe : la mise en page RTL fait-elle partie de ce chantier ou d'un chantier « mobile et RTL » séparé ? Recommandation : séparé.
