# 🌐 RTL (Right-to-Left) — Nafura ERP

> Squelette Round 2 Phase 2 (sub-B). La traduction massive FR → AR est traitée
> séparément en Round 2 Phase 6 (vagues `R2-T1` → `R2-T6`).

## 1. Activer AR + RTL en local

```js
// dans la console DevTools
localStorage.setItem('seyrura:language', 'ar');
location.reload();
```

Au boot, `LocaleService.syncFromLang('ar')` injecte `<html dir="rtl" lang="ar">`
et le sélecteur de langue dans le shell affiche l'option العربية 🇲🇦. La couche
AR ngx-translate charge les packs `**/ar.json` (placeholders vides en Round 2
Phase 2, traduits en Phase 6) ; les clés non traduites tombent en fallback FR
via `USE_DEFAULT_LANG = true` + `DEFAULT_LANGUAGE = 'fr'` (cf.
`web/app/platform/core/i18n/i18n.config.ts`).

Pour revenir en FR : `localStorage.setItem('seyrura:language', 'fr'); location.reload();`
ou utiliser directement le `LanguageSelectorComponent` dans la topbar.

## 2. Convention CSS — propriétés logiques uniquement

| ❌ Physique (à bannir) | ✅ Logique (à utiliser) |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left: 0` (`position: absolute`) | `inset-inline-start: 0` |
| `right: 0` (`position: absolute`) | `inset-inline-end: 0` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |
| `float: right` | `float: inline-end` |

Les transformations `translateX(...)` restent **physiques** (axe X au sens du
viewport) — si tu utilises `translateX` pour positionner un drawer/menu
ancré sur le bord trailing, ajoute une règle `:host-context([dir="rtl"])`
pour inverser le signe (voir `drawer.component.ts` pour l'exemple).

## 3. Icônes directionnelles — directive `[appFlipIconRtl]`

Pour les icônes liées au sens de lecture (chevron-right, arrow-forward,
arrow-back, undo/redo, sort indicators…), utiliser la directive standalone :

```html
<mat-icon appFlipIconRtl>arrow_forward</mat-icon>
<lucide-icon name="chevron-right" appFlipIconRtl></lucide-icon>
```

Implémentation : `web/app/platform/lib/anatomy/directives/flip-icon-rtl.directive.ts`
— observe `<html dir>` via `MutationObserver` et applique
`transform: scaleX(-1)` quand RTL.

**Ne PAS** appliquer la directive sur les icônes symétriques (close, menu,
search, settings, home…). **Ne PAS** appliquer non plus sur des icônes dont
l'élément hôte porte déjà un autre `transform` (rotate par état actif) :
gérer alors le flip via une règle CSS `:host-context([dir="rtl"])` ciblée
(voir `platform-app-shell.component.ts § .naf-shell__domain-chevron`).

## 4. Audit checklist pour les nouveaux composants

Avant de merger un nouveau composant qui contient de la CSS positionnelle,
vérifier :

1. **Aucun `margin-left/right`, `padding-left/right`** en dur — remplacer
   par les variantes `inline-start` / `inline-end`.
2. **`left:` / `right:`** absolus → `inset-inline-start` / `inset-inline-end`.
3. **`text-align: left|right`** → `start` / `end`.
4. **Icônes directionnelles** : directive `[appFlipIconRtl]` OU règle
   `:host-context([dir="rtl"])` si conflit transform.
5. **Smoke test** : `localStorage.setItem('seyrura:language', 'ar')` +
   reload, vérifier que le layout n'est ni cassé ni illisible.

## 5. Frameworks UI — stratégie RTL native

### Material Angular (`@angular/material@19`)

Material lit `dir` sur l'ancêtre commun via le `Directionality` service.
Quand `<html dir="rtl">` est positionné par `LocaleService.syncFromLang('ar')`
au bootstrap, **tous les composants Material adoptent automatiquement la
direction RTL** : `mat-form-field` (label/error padding), `mat-menu` (anchor
trigger), `mat-drawer`, `mat-tab-group`, `mat-paginator`, etc. Aucun code
applicatif requis.

### PrimeNG (`primeng@19`)

PrimeNG suit la même convention `dir` sur l'élément racine. Les composants
`p-table`, `p-dropdown`, `p-calendar`, `p-dialog`, etc. basculent
automatiquement en RTL via les sélecteurs CSS `[dir="rtl"]` de leur thème.

### Lucide / Material icons

Symétriques par défaut, sauf icônes directionnelles → directive
`[appFlipIconRtl]` (cf. §3).

## 6. Couverture actuelle (Round 2 Phase 2 sub-B)

Composants UX critiques globaux migrés :

- **Shell platform** (`platform-app-shell.component.ts`) : topbar, search
  trigger, user panel, sidebar header, nav links, conversation panel,
  chevron-domain (CSS `:host-context`).
- **Drawer** (`anatomy/components/organisms/drawer/drawer.component.ts`) :
  position `right`/`left` migrée vers `inset-inline-end`/`inset-inline-start` +
  inversion `translateX` en RTL via `:host-context`.
- **Data-table** (`anatomy/components/organisms/data-table/data-table.component.ts`) :
  alignement colonnes actions + cell-action.
- **Page-header** (`anatomy/components/molecules/page-header/page-header.component.ts`) :
  padding + actions slot.
- **Notification bell** + **panneau ERP** : badge, dropdown, footer, alert-item
  border.
- **Language selector** : déjà en logical properties (audité, OK).
- **Breadcrumb** (anatomy + core) : aucune propriété physique détectée.

Hors scope sub-B (RTL pages deep ERP — Round 2 Phase 6 ou PR mini ciblée) :
- Pages `pages/finance/**`, `pages/chantiers/**`, `pages/inventory/**`, etc.
- Print A4 components (`facture-print`, `decompte-print`) — sortie figée
  FR-MA par requirement légal BTP MA.

## 7. Liens utiles

- Specs i18n complètes : `web/docs/specs/i18n-roadmap/00-PROGRESS.md`
- Glossaire BTP MA : `web/docs/specs/i18n-roadmap/GLOSSARY.md`
- Loader Angular : `web/app/platform/core/i18n/i18n.module-loader.ts`
- Service direction : `web/app/platform/core/i18n/locale.service.ts`
- Calendrier hijri (Phase 4.3) : `web/app/platform/core/i18n/hijri-calendar.service.ts`
