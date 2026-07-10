# 03 — Shell UX (breadcrumb, palette, notifs, langue, panneau IA, boutons)

> **Sévérité** : P1
> **Estimation** : 2 sprints (S5–S6)
> **Dépendances** : `01-foundations` (LocaleService pour toggle langue)

## Findings traités

- [ ] **F-10** Pas de fil d'Ariane / breadcrumb dans plusieurs modules
- [ ] **F-11** Recherche globale (Ctrl+K) non fonctionnelle
- [ ] **F-12** Bouton « Notifications » sans contenu
- [ ] **F-13** Toggle de langue non fonctionnel
- [ ] **F-15** Bouton « New » / « + » incohérent (« New » vs « + Nouvelle écriture » vs « + Saisir »…)
- [ ] **F-18** Panneau IA toujours visible occupe 25–30% de l'écran

## Goal

Shell de l'application **professionnel et productif** : breadcrumb piloté par le routing, command palette `Ctrl+K` qui indexe pages + entités, panel notifications, toggle langue avec persistance, panneau IA fermable, conventions sur boutons d'action.

## Context to read first

```
app/platform/core/shell/platform-app-shell.component.ts          # shell principal
app/applications/app/shell/app-shell.component.ts                # shell ERP
app/applications/erp/shell/erp-nav.generated.ts                  # nav source
app/platform/lib/anatomy/components/molecules/page-header/        # PageHeader actuel
app/platform/lib/anatomy/components/atoms/                        # boutons, badge
public/assets/i18n/applications/erp/fr.json                       # i18n
```

---

## Task 3.1 — Breadcrumb global piloté par data routing (F-10)

**Architecture** : composant `<app-breadcrumb>` au top de chaque page, qui :
1. Lit la `Router.events` filtrée sur `NavigationEnd`.
2. Walk les `ActivatedRouteSnapshot` pour collecter `data.breadcrumb` à chaque niveau.
3. Rend un fil cliquable.

**Fichier à créer** : `app/platform/lib/anatomy/components/molecules/breadcrumb/breadcrumb.component.ts`

```ts
@Component({
  selector: 'nf-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        @for (crumb of crumbs(); track crumb.url; let last = $last) {
          <li>
            @if (!last && crumb.url) {
              <a [routerLink]="crumb.url">{{ crumb.label | translate }}</a>
              <span class="sep" aria-hidden="true">›</span>
            } @else {
              <span class="current" aria-current="page">{{ crumb.label | translate }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly crumbs = signal<Array<{ label: string; url?: string }>>([]);
  // logique walk en constructor
}
```

**Convention** : chaque route déclare `data: { breadcrumb: 'i18nKey' }` ou `data: { breadcrumb: (params) => 'string' }` pour les routes `:id`.

**Audit existant** : breadcrumb actuel parfois inline dans la page (`PageHeaderComponent`). À unifier.

**Acceptance criteria** :
- [ ] Breadcrumb visible sur 100% des écrans non-modaux
- [ ] Hiérarchie correcte : `Chantiers › Mes chantiers › CH-2026-003` (pas `Stock › Matériel› ...` qui est faux)
- [ ] Tous les segments non-finaux sont des liens cliquables
- [ ] Test e2e : pour 5 URLs, vérifier le breadcrumb attendu

---

## Task 3.2 — Command palette Ctrl+K (F-11)

**Bibliothèque** : utiliser `cdk-overlay` (déjà inclus avec Angular Material/CDK) + un signal-based store.

**Fichier à créer** : `app/platform/core/command-palette/command-palette.component.ts` + `command-palette.service.ts`

**Sources d'index** :
1. **Pages** : tous les nav items de `erp-nav.generated.ts` (~80 items)
2. **Chantiers** : depuis `ChantiersMockService.getChantiers()`
3. **Fournisseurs** : depuis `FournisseurMockService`
4. **BC** : depuis `BcMockService`
5. **Factures** : depuis `FactureMockService`

**Pattern UX** (Linear/Notion) :
- Modal centrée, fond flou
- Input de recherche en haut
- Liste filtrée en temps réel (fuzzy match)
- Sections (Pages / Chantiers / BC / Factures…)
- Navigation clavier : `↑↓` pour bouger, `Enter` pour ouvrir, `Esc` pour fermer
- Raccourcis affichés à droite (kbd)

**Wiring** :

```ts
@HostListener('document:keydown.control.k', ['$event'])
@HostListener('document:keydown.meta.k', ['$event'])
onCmdK(e: KeyboardEvent) {
  e.preventDefault();
  this.commandPalette.open();
}
```

Ajouter dans le shell.

**Acceptance criteria** :
- [ ] `Ctrl+K` (ou `Cmd+K`) ouvre la palette
- [ ] Tape « chantier » → liste de pages contenant chantier
- [ ] Tape « CH-2026-003 » → propose le chantier en navigation directe
- [ ] `Esc` ferme la palette
- [ ] Test e2e Playwright : `await page.keyboard.press('Control+K')` → modal visible

---

## Task 3.3 — Centre de notifications (F-12)

**Fichier à créer** : `app/platform/core/notifications/notification-center.component.ts` + `notification-center.service.ts`

**Catégories** :
1. **Approbations en attente** (DA, BC, factures)
2. **Échéances** (factures clients, factures fournisseurs)
3. **Alertes budget** (chantier en dépassement)
4. **Alertes HSE** (NC critique, AT déclarable)
5. **Saisies en retard** (situations, avancements)

**UX** :
- Click sur cloche → drawer à droite (largeur 400px)
- Compteur sur la cloche (badge rouge avec nombre)
- Onglets par catégorie
- Chaque notif : icône + titre + sous-titre + horodatage relatif + action principale

**Mock provider** : `NotificationMockService.getNotifications()` retournant ~10 notifications mixtes.

**Acceptance criteria** :
- [ ] Click cloche → drawer s'ouvre avec liste
- [ ] Badge rouge sur cloche affiche le compteur des non-lues
- [ ] Click sur une notification → navigue vers l'entité concernée
- [ ] Bouton « Marquer toutes comme lues »
- [ ] Persiste l'état lu dans localStorage

---

## Task 3.4 — Toggle de langue + persistance (F-13)

**Fichier à créer/compléter** : `app/platform/core/i18n/language-switcher.component.ts`

**UX** :
- Bouton « FR » dans le header → dropdown avec FR / AR / EN (drapeaux + nom)
- Click sur un item → `TranslateService.use(lang)` + `LocaleService.applyLang(lang)` + `localStorage.setItem('app.lang', lang)`
- Au boot : lire `localStorage`, fallback sur `navigator.language`, fallback sur `fr`

**RTL pour AR** :
- `LocaleService.applyLang('ar')` → `html.dir = 'rtl'`
- Préparer `tailwind.config.js` avec plugin `tailwindcss-rtl` ou utiliser `rtl:` natif Tailwind v3+

**Acceptance criteria** :
- [ ] Click sur FR → dropdown apparaît avec 3 options
- [ ] Switch sur AR → toute l'UI bascule en arabe + RTL (sidebar à droite)
- [ ] Recharge page → langue persistée
- [ ] Au moins 50% des clés `nav.*` traduites en AR (stub acceptable au début)

---

## Task 3.5 — Standardiser les boutons d'action (F-15)

**Convention unique** :
- **Création** : `+ <Verbe métier>` ex. `+ Nouveau bon de commande`, `+ Nouvelle facture`, `+ Saisir avancement`
- **Édition** : icône crayon + `Modifier`
- **Suppression** : icône poubelle + `Supprimer` (destructif, rouge)
- **Action métier** : verbe à l'infinitif + icône (`Valider`, `Refuser`, `Soumettre`, `Émettre`)

**Composant centralisateur** : `<nf-page-header>` doit accepter une prop `actions` :

```ts
interface PageHeaderAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  shortcut?: string;     // ex. 'n' pour création
  permission?: string;
  onClick: () => void;
}
```

**Audit existant** : grep tous les boutons `New`, `+ Nouvelle`, `Saisir`, `Voir planning` :

```bash
grep -rn '"New"\|+ Nouvelle\|+ Saisir\|+ Saisir\|Saisir avancement' app/applications/erp/pages/
```

Renommer pour matcher la convention.

**Acceptance criteria** :
- [ ] Aucun bouton intitulé « New » ne reste
- [ ] Sur 13 modules, le bouton de création primaire est `+ <verbe métier>` cohérent
- [ ] `<nf-page-header>` accepte `actions` et les rend uniformément

---

## Task 3.6 — Panneau IA fermable + persistance (F-18)

**Fichier** : `app/platform/core/shell/platform-app-shell.component.ts` (cherche `conversationOpen`)

**Action** :
1. Par défaut : panneau **fermé** (`conversationOpen.set(false)`).
2. Bouton flottant en bas-droite (déjà présent : 🤖 emoji à remplacer cf F-36) ouvre/ferme.
3. Raccourci `?` pour toggle.
4. Persister l'état : `localStorage.setItem('shell.aiPanel.open', '0|1')`.
5. Sur écran `< 1280px` : forcer fermé par défaut (responsive).

**Acceptance criteria** :
- [ ] Au boot : panneau IA fermé par défaut
- [ ] Click bouton flottant → panneau s'ouvre
- [ ] Touche `?` → toggle
- [ ] Recharge → état préservé
- [ ] Sur largeur 1024px : panneau forcé fermé (occupe trop)

---

## Testing

### Tests e2e Playwright

```ts
test('Ctrl+K ouvre la command palette', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+K');
  await expect(page.getByRole('dialog', { name: /command/i })).toBeVisible();
});

test('breadcrumb cohérent sur fiche chantier', async ({ page }) => {
  await page.goto('/chantiers/CH-2026-003');
  await expect(page.locator('nf-breadcrumb')).toContainText('Chantiers');
  await expect(page.locator('nf-breadcrumb')).toContainText('CH-2026-003');
});

test('toggle langue fonctionne', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'FR' }).click();
  await page.getByRole('menuitem', { name: /Arabe/ }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('panneau IA fermé par défaut', async ({ page }) => {
  await page.goto('/');
  // le main content occupe quasi 100% du viewport
  const main = await page.locator('main').boundingBox();
  expect(main!.width).toBeGreaterThan(900); // pas amputé
});
```

## Dépendances

- 01-foundations (LocaleService, MissingTranslationHandler)
- Pour le command palette : besoin de `MockApiService` qui expose une recherche fuzzy (à factoriser)

## Dépendances inverses

- 11-design-system (les boutons primaires définis ici sont la base du DS)
- 04-tables-forms-states (le `<nf-page-header>` standardisé est utilisé partout)
