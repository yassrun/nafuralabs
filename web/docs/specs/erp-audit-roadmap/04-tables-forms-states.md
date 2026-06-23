# 04 — Tables, formulaires & états (loading/empty/error)

> **Sévérité** : P1
> **Estimation** : 1.5 sprint (parallèle de 03-shell-ux)
> **Dépendances** : `01-foundations`, `03-shell-ux` (page-header standardisé)

## Findings traités

- [ ] **F-19** Tableaux denses sans virtualisation ni pagination claire
- [ ] **F-20** Aucun feedback utilisateur sur les actions critiques (toast/snackbar)
- [ ] **F-21** Aucun garde-fou navigation pour saisies non sauvegardées (CanDeactivateGuard)
- [ ] **F-22** Pas de gestion d'état vide / loading / erreur
- [ ] **F-23** Filtres affichés en chips horizontaux non scrollables sur petits écrans
- [ ] **F-33** Champs / formulaires non testés (masques MA : ICE 15 chiffres, RIB 24 chars, tél `+212 6 XX XX XX XX`)

## Goal

UX qualité production sur la couche données : tableaux performants même à 10k lignes, feedback clair, sécurité des saisies, états « pas de données / chargement / erreur » uniformes, formulaires validés correctement.

## Context to read first

```
app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts   # table actuelle
app/platform/lib/anatomy/components/organisms/entity-listing/                       # listing config-driven
app/platform/lib/anatomy/components/molecules/empty-state/empty-state.component.ts  # existant ?
app/platform/lib/anatomy/components/molecules/skeleton/                              # existant ?
app/platform/lib/anatomy/components/molecules/toast/                                 # existant ?
app/platform/lib/anatomy/services/toast.service.ts                                   # existant ?
```

---

## Task 4.1 — Virtualisation tableaux > 50 lignes (F-19)

**Approche** : `cdk-virtual-scroll-viewport` du CDK Angular sur le `data-table` quand > 50 rows.

**Fichier** : `app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts`

**Patch architecture** :

```html
@if (rows().length > 50) {
  <cdk-virtual-scroll-viewport [itemSize]="44" class="virtual-table">
    <table>
      <thead> ... </thead>
      <tbody>
        <tr *cdkVirtualFor="let row of rows()">
          ...
        </tr>
      </tbody>
    </table>
  </cdk-virtual-scroll-viewport>
} @else {
  <!-- table classique sans virtualisation -->
}
```

**Pagination uniforme** : composant `<nf-pagination>` avec :
- `<< < 1 2 3 ... 42 > >>`
- Sélecteur `Items per page` : 25 / 50 / 100 / 250
- Compteur : « 51-100 sur 1 234 »

**Sticky header** : déjà partiellement présent. Garantir avec `position: sticky; top: 0; z-index: 1`.

**Acceptance criteria** :
- [ ] Test perf : table 1000 lignes scroll fluide à 60fps
- [ ] Pagination uniforme sur 100% des listings
- [ ] Sticky header sur 100% des tableaux
- [ ] Recherche/filtre par colonne (champ texte sous l'en-tête)

---

## Task 4.2 — Composant `<nf-data-state>` (F-22)

**Fichier à créer** : `app/platform/lib/anatomy/components/molecules/data-state/data-state.component.ts`

**API** :

```ts
@Component({
  selector: 'nf-data-state',
  standalone: true,
  template: `
    @switch (state()) {
      @case ('loading') {
        <ng-content select="[loading]"></ng-content>
        <nf-skeleton *ngIf="!hasLoadingSlot" [rows]="5"></nf-skeleton>
      }
      @case ('empty') {
        <ng-content select="[empty]"></ng-content>
        <nf-empty-state *ngIf="!hasEmptySlot"
          [icon]="emptyIcon()"
          [title]="emptyTitle()"
          [message]="emptyMessage()"
          [actionLabel]="emptyAction()"
          (action)="emptyActionClick.emit()">
        </nf-empty-state>
      }
      @case ('error') {
        <ng-content select="[error]"></ng-content>
        <nf-error-state *ngIf="!hasErrorSlot"
          [message]="errorMessage()"
          (retry)="retry.emit()">
        </nf-error-state>
      }
      @default {
        <ng-content></ng-content>
      }
    }
  `,
})
export class DataStateComponent {
  readonly state = input.required<'loading' | 'empty' | 'error' | 'loaded'>();
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input('Aucune donnée');
  readonly emptyMessage = input('');
  readonly emptyAction = input('');
  readonly errorMessage = input('Erreur de chargement');
  readonly emptyActionClick = output<void>();
  readonly retry = output<void>();
}
```

**Skeleton component** : `<nf-skeleton [rows]="5">` qui rend des lignes grises animées.

**Usage** :

```html
<nf-data-state [state]="state()" (retry)="reload()" (emptyActionClick)="onCreate()">
  <table>...</table>
</nf-data-state>
```

**Migration** : remplacer toutes les implémentations ad-hoc dans les listings actuels.

**Acceptance criteria** :
- [ ] Composant créé + 3 états visuellement distincts
- [ ] 100% des listings ERP utilisent `<nf-data-state>`
- [ ] Test e2e : couper le réseau → état `error` avec bouton retry

---

## Task 4.3 — Service Toast global (F-20)

**Fichier** : `app/platform/lib/anatomy/services/toast.service.ts` (créer si absent)

**API** :

```ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string, opts?: ToastOptions): void;
  error(message: string, opts?: ToastOptions): void;
  warning(message: string, opts?: ToastOptions): void;
  info(message: string, opts?: ToastOptions): void;
}

interface ToastOptions {
  duration?: number;     // 4000 par défaut, 0 = persistant
  action?: { label: string; onClick: () => void };
  position?: 'bottom-right' | 'top-right';
}
```

**Implémentation** : `cdk-overlay` pour la stack ; chaque toast dans son propre container.

**Usage convention** : tout service qui fait une mutation appelle le toast :

```ts
async save(): Promise<void> {
  try {
    await this.api.update(this.form.value);
    this.toast.success('Modifications enregistrées.');
  } catch (e) {
    this.toast.error('Erreur lors de l\'enregistrement.');
  }
}
```

**Audit** : services existants qui font des mutations sans toast — à patcher.

**Acceptance criteria** :
- [ ] 4 variants visuels distincts (success vert / error rouge / warning ambre / info bleu)
- [ ] Auto-dismiss à 4s sauf erreur (persistant + bouton fermer)
- [ ] Stack si plusieurs toasts simultanés (max 5 visibles, queue après)
- [ ] 100% des actions create/update/delete déclenchent un toast

---

## Task 4.4 — CanDeactivate guards sur formulaires longs (F-21)

**Fichier à créer** : `app/platform/core/guards/unsaved-changes.guard.ts`

```ts
export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  return confirm('Vous avez des modifications non sauvegardées. Quitter quand même ?');
};
```

**Cibles obligatoires** :
- Devis (formulaire long avec lignes)
- Métrés (idem)
- Budget chantier
- Situations (longue saisie d'avancement)
- Paie (saisie variables)
- Contrats achats / sous-traitance

**Pattern** : chaque page-formulaire implémente `hasUnsavedChanges()` en comparant `form.dirty || form.touched`.

**Routing** :

```ts
{
  path: 'devis/:id',
  loadComponent: () => import('./devis-detail/devis-detail.page').then(m => m.DevisDetailPage),
  canDeactivate: [unsavedChangesGuard],
},
```

**Acceptance criteria** :
- [ ] Test e2e : ouvre devis, modifie un champ, click sur autre route → confirm() prompt apparaît
- [ ] Si confirm → annulé : reste sur la page
- [ ] Si confirm → OK : navigue
- [ ] Au moins 6 pages-formulaires ont le guard

---

## Task 4.5 — Filtres scrollables sur mobile (F-23)

**Cibles** : tous les écrans avec onglets-filtres horizontaux (`Tous / À valider / En cours / En retard / À facturer`).

**Patch CSS** : sur le conteneur `.filter-tabs` :

```scss
.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;

  > * { scroll-snap-align: start; flex-shrink: 0; }
}
```

**Alternative pour > 6 filtres** : groupement dans un menu déroulant `<nf-filter-menu>` qui montre 3 filtres + un bouton « Plus ».

**Acceptance criteria** :
- [ ] Sur viewport 375px (mobile) : aucun débordement, scroll horizontal smooth
- [ ] Sur viewport 768px : tous les filtres visibles si possible
- [ ] Test Playwright avec `viewport: { width: 375, height: 667 }`

---

## Task 4.6 — Inputs MA (ICE, RIB, téléphone) (F-33)

**Fichiers à créer** :
- `app/platform/lib/anatomy/components/atoms/ice-input/ice-input.component.ts`
- `app/platform/lib/anatomy/components/atoms/rib-input/rib-input.component.ts`
- `app/platform/lib/anatomy/components/atoms/phone-ma-input/phone-ma-input.component.ts`
- `app/platform/lib/anatomy/components/atoms/money-input/money-input.component.ts`

**Specs** :

### IceInput
- Format **15 chiffres** (ex. `001234567000088`)
- Auto-format avec espaces : `00123 45670 00088`
- Validation : exactement 15 chiffres après strip
- Accepte paste avec espaces/tirets

### RibInput
- Format **24 caractères** (banques marocaines)
- Display formaté : `XXX XXX XXXXXXXXXXXXXXXX XX`
- Validation : 24 caractères numériques après strip
- Optionnel : valider le code banque connu (AWB, BMCE, CIH…)

### PhoneMaInput
- Format `+212 6 XX XX XX XX` ou `+212 7 XX XX XX XX` (mobile) / `+212 5 XX XX XX XX` (fixe)
- Auto-format pendant saisie
- Validation pattern strict
- Mask via `ngx-mask` ou implementation custom

### MoneyInput
- Type `number` mais display avec séparateurs `1 234 567,89`
- Suffix « MAD »
- Pas de saisie de symboles autres que chiffres + virgule
- Valeur stockée en `number` (pas string)

**Forme contrôle** : tous étendent `ControlValueAccessor` pour `[(ngModel)]` ou `formControlName`.

**Acceptance criteria** :
- [ ] 4 composants créés avec tests unitaires (writeValue, registerOnChange, validation)
- [ ] Au moins 5 formulaires existants migrés (fournisseur, client, employé, paie, BC)
- [ ] Storybook ou page demo pour chaque composant

---

## Task 4.7 — Validation formulaires : erreurs visibles + summary

**Convention** :
- Erreur de champ : message rouge sous le champ avec icône
- Erreur de form : summary en haut du form listant tous les champs invalides (cliquables pour focus)
- Bouton submit désactivé tant que `form.invalid`
- Indicateur de submit en cours : bouton avec spinner inline

**Composant** : `<nf-form-error-summary [form]="myForm">` qui rend la liste des erreurs.

**Acceptance criteria** :
- [ ] Submit d'un form invalide → focus sur premier champ invalide + summary visible
- [ ] Au moins 5 forms migrés vers le pattern

---

## Testing

### Tests e2e Playwright

```ts
test('CanDeactivate prompt sur form sale', async ({ page }) => {
  await page.goto('/etudes/devis/new');
  await page.locator('input[name="objet"]').fill('Test');
  page.on('dialog', d => d.dismiss());
  await page.getByRole('link', { name: 'Tableau de bord' }).click();
  await expect(page).toHaveURL(/\/etudes\/devis/); // pas changé
});

test('toast success sur création BC', async ({ page }) => {
  await page.goto('/achats/commandes/new');
  // remplir et soumettre
  await expect(page.getByRole('alert')).toContainText(/enregistré/);
});

test('input ICE rejette < 15 chiffres', async ({ page }) => {
  await page.goto('/achats/fournisseurs/new');
  const ice = page.locator('input[name="ice"]');
  await ice.fill('001234');
  await ice.blur();
  await expect(page.getByText(/15 chiffres/i)).toBeVisible();
});
```

### Tests unitaires

- `ice-input.component.spec.ts` : valide 15 chiffres, rejette autre, formatte au paste
- `rib-input.component.spec.ts`
- `phone-ma-input.component.spec.ts`
- `money-input.component.spec.ts` : separators, valeur numérique exposée
- `unsaved-changes.guard.spec.ts`
- `data-state.component.spec.ts`

## Dépendances

- 01-foundations (locale fr-MA pour formatage nombres dans MoneyInput)
- 03-shell-ux (page-header standardisé)

## Dépendances inverses

- 06-marches-facturation, 07-pilotage-approbations, 08-administration utiliseront ces composants
