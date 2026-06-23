# 11 — Design System & polish visuel

> **Sévérité** : P1/P2
> **Estimation** : 1 sprint MVP (S1–S2 en parallèle de 01-foundations) + 1 sprint finalisation (S11)
> **Dépendances** : aucune pour le MVP, mais `01-foundations` (locale) pour MoneyInput

## Findings traités

- [ ] **F-15** Boutons création hétérogènes (déjà partiellement traité dans 03-shell-ux Task 3.5)
- [ ] **F-26** Typographie & hiérarchie visuelle faibles
- [ ] **F-30** Statuts en couleurs incohérentes
- [ ] **DS-01, DS-02** (audit §7) Design system complet

## Goal

Design system Figma + tokens CSS variables + ~20 composants réutilisables couvrant 100% des besoins UI ERP. Cohérence visuelle parfaite entre les 13 modules.

## Tokens CSS (à créer)

**Fichier** : `app/platform/lib/anatomy/styles/tokens.scss`

```scss
:root {
  // Couleurs primaires (à valider avec branding Nafura)
  --nf-color-primary-50: #eff6ff;
  --nf-color-primary-500: #2563eb;
  --nf-color-primary-700: #1d4ed8;

  // Sémantique
  --nf-color-success: #16a34a;
  --nf-color-success-bg: #dcfce7;
  --nf-color-warning: #f59e0b;
  --nf-color-warning-bg: #fef9c3;
  --nf-color-danger: #dc2626;
  --nf-color-danger-bg: #fee2e2;
  --nf-color-info: #0284c7;
  --nf-color-info-bg: #e0f2fe;

  // Texte
  --nf-text-primary: #0f172a;     // 17.5:1 contrast vs white
  --nf-text-secondary: #475569;
  --nf-text-tertiary: #64748b;
  --nf-text-disabled: #94a3b8;

  // Surfaces
  --nf-surface-base: #ffffff;
  --nf-surface-raised: #f8fafc;
  --nf-surface-overlay: rgba(15, 23, 42, 0.04);
  --nf-border-subtle: #e2e8f0;
  --nf-border-default: #cbd5e1;
  --nf-border-strong: #94a3b8;

  // Échelle typo (rem, base 16px)
  --nf-text-xs: 0.75rem;          // 12
  --nf-text-sm: 0.8125rem;        // 13
  --nf-text-base: 0.875rem;       // 14
  --nf-text-md: 1rem;             // 16
  --nf-text-lg: 1.125rem;         // 18
  --nf-text-xl: 1.25rem;          // 20
  --nf-text-2xl: 1.5rem;          // 24
  --nf-text-3xl: 2rem;            // 32
  --nf-text-4xl: 2.5rem;          // 40

  // Line-heights
  --nf-leading-tight: 1.25;
  --nf-leading-normal: 1.5;
  --nf-leading-relaxed: 1.625;

  // Espacement (4px base)
  --nf-space-1: 0.25rem;          // 4
  --nf-space-2: 0.5rem;           // 8
  --nf-space-3: 0.75rem;          // 12
  --nf-space-4: 1rem;             // 16
  --nf-space-6: 1.5rem;           // 24
  --nf-space-8: 2rem;             // 32

  // Rayons
  --nf-radius-sm: 4px;
  --nf-radius-md: 6px;
  --nf-radius-lg: 8px;
  --nf-radius-xl: 12px;
  --nf-radius-full: 9999px;

  // Ombres
  --nf-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --nf-shadow-md: 0 2px 6px rgba(15, 23, 42, 0.06);
  --nf-shadow-lg: 0 4px 12px rgba(15, 23, 42, 0.08);

  // Durées animation
  --nf-duration-fast: 80ms;
  --nf-duration-base: 160ms;
  --nf-duration-slow: 240ms;
}

@media (prefers-color-scheme: dark) {
  // Tokens dark mode (cf F-40)
  // ... à compléter en S11
}
```

---

## Composants à livrer (MVP S1–S2)

### Atomes
- [ ] `<nf-button>` — variants `primary | secondary | tertiary | danger | ghost`, sizes `sm | md | lg`, loading state, icon support
- [ ] `<nf-input>` — text, email, password, number ; états error/success ; helper text
- [ ] `<nf-textarea>`
- [ ] `<nf-select>` — single + multi
- [ ] `<nf-checkbox>`, `<nf-radio>`, `<nf-switch>`
- [ ] `<nf-datepicker>` — fr-MA, range support
- [ ] `<nf-money-input>` — MAD format (cf 04-Task 4.6)
- [ ] `<nf-ice-input>`, `<nf-rib-input>`, `<nf-phone-ma-input>` (cf 04-Task 4.6)
- [ ] `<nf-status-badge>` — 5 variants + tooltip explicatif (résoud F-30)
- [ ] `<nf-icon>` — wrapper Lucide
- [ ] `<nf-spinner>`, `<nf-skeleton>`
- [ ] `<nf-tag>`

### Molécules
- [ ] `<nf-page-header>` — titre + sous-titre + breadcrumb + actions (résoud F-15 + F-10)
- [ ] `<nf-table>` — déjà partiel, à finir avec virtualisation (cf 04-Task 4.1)
- [ ] `<nf-pagination>`
- [ ] `<nf-empty-state>`, `<nf-error-state>`, `<nf-data-state>` (cf 04-Task 4.2)
- [ ] `<nf-toast>` (cf 04-Task 4.3)
- [ ] `<nf-modal>`, `<nf-drawer>`, `<nf-popover>`
- [ ] `<nf-tabs>` — résoud onglets fiches détail
- [ ] `<nf-stepper>` — pour wizards (création marché, paie)
- [ ] `<nf-kpi-card>` — pour dashboards
- [ ] `<nf-breadcrumb>` (cf 03-Task 3.1)
- [ ] `<nf-form-field>` — wrapper label + input + error
- [ ] `<nf-form-error-summary>` (cf 04-Task 4.7)

### Organismes
- [ ] `<nf-data-table>` — finalisation
- [ ] `<nf-form-renderer>` — config-driven (existant à compléter)
- [ ] `<nf-filter-bar>` — chips + search + advanced (cf F-23)
- [ ] `<nf-command-palette>` (cf 03-Task 3.2)
- [ ] `<nf-notification-center>` (cf 03-Task 3.3)
- [ ] `<nf-language-switcher>` (cf 03-Task 3.4)

### Layout
- [ ] `<nf-page-shell>` (existant)
- [ ] `<nf-section>` — section avec titre + actions
- [ ] `<nf-card>` — variants `outlined | elevated | flat`
- [ ] `<nf-grid>` — wrapper layout

---

## Task 11.1 — StatusBadge centralisé (résoud F-30)

**Bug actuel** : « En cours » vert chantier vs « Brouillon » jaune BC vs « Soumise » bleu DA — pas de mapping centralisé, légende absente.

**Fichier** : `app/platform/lib/anatomy/components/atoms/status-badge/status-badge.component.ts`

```ts
@Component({
  selector: 'nf-status-badge',
  standalone: true,
  template: `
    <span class="nf-badge nf-badge--{{ variant() }}" [title]="tooltip()">
      @if (icon()) { <nf-icon [name]="icon()!" size="xs" /> }
      <ng-content />{{ label() }}
    </span>
  `,
  // ...
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly entityType = input<string>();   // 'BC', 'FACTURE', 'CHANTIER'
  // computed à partir de mapping centralisé
}
```

**Mapping centralisé** : `app/platform/lib/anatomy/components/atoms/status-badge/status-mapping.ts`

```ts
export const STATUS_MAPPING: Record<string, Record<string, { label: string; variant: BadgeVariant; icon?: string; tooltip: string }>> = {
  BC: {
    BROUILLON: { label: 'Brouillon', variant: 'default', tooltip: 'Bon de commande en saisie, non envoyé' },
    EN_APPROBATION: { label: 'À valider', variant: 'warning', tooltip: 'En attente de validation hiérarchique' },
    APPROUVE: { label: 'Approuvé', variant: 'info', tooltip: 'Validé, prêt à être envoyé au fournisseur' },
    ENVOYE: { label: 'Envoyé', variant: 'info', tooltip: 'Transmis au fournisseur' },
    PARTIELLEMENT_LIVRE: { label: 'Part. livré', variant: 'warning', tooltip: 'Réception partielle' },
    LIVRE: { label: 'Livré', variant: 'success', tooltip: 'Totalement réceptionné' },
    FACTURE: { label: 'Facturé', variant: 'success', tooltip: 'Facture fournisseur reçue' },
    PAYE: { label: 'Payé', variant: 'success', tooltip: 'Règlement effectué' },
    ANNULE: { label: 'Annulé', variant: 'danger', tooltip: 'BC annulé' },
  },
  CHANTIER: {
    PROSPECT: { label: 'Prospect', variant: 'default', tooltip: 'Avant signature marché' },
    EN_COURS: { label: 'En cours', variant: 'success', tooltip: 'Travaux en cours' },
    SUSPENDU: { label: 'Suspendu', variant: 'warning', tooltip: 'Travaux temporairement arrêtés' },
    TERMINE: { label: 'Terminé', variant: 'info', tooltip: 'Travaux terminés' },
    RECEPTIONNE: { label: 'Réceptionné', variant: 'success', tooltip: 'Réception définitive prononcée' },
    CLOTURE: { label: 'Clôturé', variant: 'default', tooltip: 'DGD signé, dossier clos' },
    ANNULE: { label: 'Annulé', variant: 'danger', tooltip: 'Marché résilié' },
  },
  // ... tous les autres types d'entités
};
```

**Migration** : remplacer toutes les implémentations ad-hoc dans les listings et détails.

**Acceptance criteria** :
- [ ] Mapping centralisé pour 15+ entités
- [ ] Tooltip cohérent partout
- [ ] Légende automatique sur chaque listing (composant `<nf-status-legend>`)
- [ ] Test : « Brouillon » sur BC et sur Devis a la même couleur (variant `default`)

---

## Task 11.2 — Audit accessibilité WCAG AA

**Outils** :
- `npm run lint:a11y` avec `eslint-plugin-jsx-a11y` adapté Angular
- Tests e2e avec `@axe-core/playwright`

**Cibles** :
- Contraste texte/fond ≥ 4.5:1 (normal), ≥ 3:1 (large)
- Focus ring visible sur tous les éléments interactifs
- ARIA labels complets
- Navigation 100% clavier
- Live region pour annoncer changements de page

**Acceptance criteria** :
- [ ] 0 violation critique axe-core sur 10 pages clés
- [ ] Test e2e Playwright clavier-only : login → BC → save (sans souris)

---

## Task 11.3 — Pluriels ICU (F-37)

**Convention** : `{count, plural, =0 {Aucun chantier} one {1 chantier} other {# chantiers}}`

**Migration** : remplacer toutes les chaînes `« 12 chantier(s) »` par ICU via ngx-translate.

**Acceptance criteria** :
- [ ] 0 occurrence `(s)` parenthèses dans i18n FR
- [ ] Test affiche correct selon count (0/1/n)

---

## Dépendances

- 04-tables-forms-states (composants formulaires utilisés ici)
- 03-shell-ux (page-header, breadcrumb, command palette)

## Dépendances inverses

- Tous les autres modules consomment ces composants
