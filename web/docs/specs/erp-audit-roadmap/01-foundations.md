# 01 — Fondations (PRÉREQUIS DE TOUT)

> **Sévérité** : P0
> **Estimation** : 2 sprints (S1–S2)
> **Dépendances** : aucune. **TOUT le reste dépend de ce dossier.**

## Findings traités

- [x] **F-03** Devise `$` au lieu de MAD (situations, biblio prix, devis) *(2026-05-10 : `LOCALE_ID=fr-MA`+`MadCurrencyPipe`+migration 21 fichiers)*
- [~] **F-04** 3 formats de codes chantiers en parallèle (`CH-2025-XXX` / `CH-2026-XXX` / `PROJ-2024-XXX`) *(seed unifié, format `CH-2025-XXX`)*
- [x] **F-06** Clés i18n `inventory.materiel.fields.*` non traduites
- [x] **F-14** `<html lang="en">` alors que UI en français *(`LocaleService.applyLang` + `index.html`)*
- [x] **F-16** Formats nombres incohérents *(`fr-MA` locale + pipe `mad`)*
- [x] **F-25** Accents manquants module Planning (« consolidee », « dependances », « edition ») *(2026-05-10 : tous les résidus Planning corrigés + nettoyage Budget : Révisé/Engagé/Réalisé/Écart/Référence/Période/Équipe)*
- [x] **F-31** Dashboard KPI « Avancement moyen 0% » faux *(calcul pondéré budget)*
- [x] **F-35** Clé `core.ai.assistant.title` non traduite

## Goal

Une UI cohérente : **toutes les devises en MAD**, **format `1 234 567,89 MAD`**, **dates en `JJ/MM/AAAA`**, **un seul jeu de données chantiers**, aucune clé i18n manquante, `<html lang>` correct.

## Context to read first

```
app/app.config.ts                                              # bootstrap providers
app/main.ts                                                     # entrée
app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts:157,186  # CAUSE-RACINE F-03
app/platform/lib/anatomy/components/organisms/widgets/list-widget.component.ts:130-145    # bon exemple Intl MAD
app/applications/erp/chantiers/mock/chantiers-mock.service.ts  # mock seed actuel CH-2026
app/applications/erp/chantiers/mock/seeds.ts                   # seed unique attendu
app/applications/erp/pages/inventory/catalogue/materiel/config/detail/fields.ts  # clés i18n
public/assets/i18n/applications/erp/fr.json                    # traductions FR
public/assets/i18n/applications/core/fr.json                   # traductions core
```

---

## Task 1.1 — Configurer LOCALE_ID `fr-MA` et pipes globaux

**Fichiers** :
- `app/app.config.ts` (ajouter providers)
- `src/main.ts` ou équivalent

**Patch** :

```ts
// app/app.config.ts
import { LOCALE_ID, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeFrMA from '@angular/common/locales/fr-MA';
import localeFrMaExtra from '@angular/common/locales/extra/fr-MA';

registerLocaleData(localeFr);
registerLocaleData(localeFrMA, 'fr-MA', localeFrMaExtra);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-MA' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'MAD' },
    // …
  ],
};
```

**Acceptance criteria** :
- [ ] `LOCALE_ID === 'fr-MA'` au runtime (ajouter `console.assert` en dev)
- [ ] Tout `| currency` Angular affiche `MAD` et symbol `MAD` (pas `$`)
- [ ] Tout `| date` affiche `JJ/MM/AAAA`
- [ ] Tout `| number` utilise `1 234,56` (espace fine + virgule)
- [ ] Aucun changement requis dans les composants existants après ce patch

---

## Task 1.2 — Pipe `madCurrency` réutilisable + remplacement `data-table`

**Fichiers** :
- `app/platform/lib/anatomy/pipes/mad-currency.pipe.ts` (créer)
- `app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts:157,186` (remplacer)
- `app/platform/lib/anatomy/components/organisms/widgets/list-widget.component.ts:134` (factoriser)

**Pipe** :

```ts
@Pipe({ name: 'mad', standalone: true, pure: true })
export class MadCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, decimals = 0): string {
    if (value == null || value === '') return '—';
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }
}
```

**Acceptance criteria** :
- [x] `data-table.component.ts` lignes 157 et 186 : `| currency` remplacé par `| mad`
- [ ] `list-widget.component.ts` ligne 134 : utilise le pipe `mad` au lieu de `Intl.NumberFormat` inline
- [x] Tout nouveau code utilise `| mad` jamais `| currency` *(migration 2026-05-10 : 21 fichiers, 0 occurrence `| currency` restante)*
- [ ] ESLint rule custom (ou grep CI) qui bloque `| currency` dans `*.html` et `*.ts`

---

## Task 1.3 — Bloquer `$` en CI

**Fichier** : `.github/workflows/ci.yml` ou `package.json` (script `lint:no-dollar`)

```bash
# package.json
"lint:no-dollar": "node scripts/check-no-dollar.mjs",
```

```js
// scripts/check-no-dollar.mjs — fail si '$' détecté dans un .html/.ts hors string literal connue
import { globby } from 'globby';
import { readFile } from 'fs/promises';

const files = await globby(['app/**/*.{ts,html,scss}', '!**/node_modules/**']);
const offenders = [];
for (const f of files) {
  const c = await readFile(f, 'utf8');
  // Autorisé : `$any(...)`, `$event`, `${...}` template literal, jQuery `$()`, RxJS `$`
  const lines = c.split('\n');
  lines.forEach((line, i) => {
    if (/\$[\d,.\s]/.test(line) || /:\s*'\$'/.test(line) || /currency:\s*'USD'/.test(line)) {
      offenders.push(`${f}:${i + 1} ${line.trim()}`);
    }
  });
}
if (offenders.length) {
  console.error('USD/$ detected in source:\n' + offenders.join('\n'));
  process.exit(1);
}
```

**Acceptance criteria** :
- [ ] Script existe et tourne en CI avant le build
- [ ] Build CI fail si un nouveau `$` numérique est introduit
- [ ] Test e2e Playwright qui scrape `document.body.innerText` et fail si match `/\$[\d,]/`

---

## Task 1.4 — Mock chantiers unifié (F-04)

**Goal** : un seul `SEED_CHANTIERS` consommé par TOUS les modules.

**État actuel** :
- `app/applications/erp/chantiers/mock/seeds.ts` → `SEED_CHANTIERS` (canon, 6 chantiers `CH-2026-001..006`)
- Mais : `Mes chantiers` page legacy semble avoir d'autres seeds (`CH-2025-XXX`, `PROJ-2024-XXX`) — **rechercher et purger**.

**Fichiers à auditer** :

```bash
grep -rn "CH-2025\|CH-2024\|PROJ-2024\|PROJ-2025" app/applications/erp/
grep -rn "SEED_\|MOCK_\|seed[A-Z]" app/applications/erp/ | grep -v "node_modules"
```

**Action** :

1. Lister tous les datasets mock chantiers détectés.
2. Pour chaque dataset détecté : remplacer son contenu par un import depuis `app/applications/erp/chantiers/mock/seeds.ts`.
3. Si un dataset a des champs spécifiques (ex. `surface`, `materielAffecte`), les ajouter au seed canonique.
4. Supprimer les anciens seeds dupliqués.

**Convention codes** : `CH-YYYY-NNN` (ex. `CH-2026-001`). Aucun autre format autorisé.

**Acceptance criteria** :
- [ ] `grep -rn "CH-2025\|PROJ-2024\|PROJ-2025" app/applications/erp/` retourne 0 résultats hors tests historiques explicitement nommés
- [ ] Toutes les pages chantier consomment `import { SEED_CHANTIERS } from '@applications/erp/chantiers/mock'`
- [ ] Liste « Mes chantiers » et Planning montrent les **mêmes** codes/noms
- [ ] Détail chantier accessible depuis `/chantiers` ET depuis `/chantiers/planning` avec le même id
- [ ] Module `Achats / Demandes` montre des chantiers présents dans le seed unique
- [ ] Module `Matériel / Affectations` montre des chantiers présents dans le seed unique

---

## Task 1.5 — i18n keys manquantes Matériel (F-06)

**Fichier source des clés** : `app/applications/erp/pages/inventory/catalogue/materiel/config/detail/fields.ts` (lignes 12, 21, 29, 41, 50…)

**Clés à ajouter** dans `public/assets/i18n/applications/erp/fr.json` :

```json
{
  "inventory": {
    "materiel": {
      "fields": {
        "code": "Code",
        "designation": "Désignation",
        "famille": "Famille",
        "marqueModele": "Marque / Modèle",
        "numeroSerie": "N° série",
        "status": "Statut",
        "chantierActuel": "Chantier actuel",
        "description": "Description",
        "marque": "Marque",
        "modele": "Modèle",
        "anneeAcquisition": "Année d'acquisition",
        "valeurAcquisition": "Valeur d'acquisition",
        "tauxAmortissement": "Taux d'amortissement",
        "carburantType": "Type carburant",
        "consommationMoyenne": "Consommation moyenne (L/h)",
        "kilometrageActuel": "Kilométrage actuel",
        "compteurHeures": "Compteur heures"
      }
    }
  }
}
```

**Action** :
1. Lire `fields.ts` pour lister TOUTES les clés `inventory.materiel.fields.*` utilisées.
2. Ajouter les traductions dans `fr.json`.
3. Ajouter les mêmes clés (en arabe + anglais) dans `ar.json` et `en.json` (peut être stub initial).
4. Activer un `MissingTranslationHandler` qui log en dev, fail en CI.

**MissingTranslationHandler** :

```ts
// app/platform/core/i18n/missing-translation-handler.ts
import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

export class StrictMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    const msg = `[i18n] Missing key: ${params.key}`;
    if (location.hostname === 'localhost') console.warn(msg);
    if ((window as any).__CI__) throw new Error(msg);
    return params.key;
  }
}
```

**Acceptance criteria** :
- [ ] Aucune clé `inventory.materiel.fields.*` ne s'affiche brute dans l'UI Matériel
- [ ] Le handler missing-translation est wired dans `TranslateModule.forRoot()`
- [ ] CI grep : `grep -rn "params.key" application | grep "missing"` n'a pas d'occurrences au runtime de la suite e2e

---

## Task 1.6 — `<html lang>` dynamique (F-14)

**Fichiers** :
- `app/platform/core/i18n/locale.service.ts` (ou créer si absent)
- `index.html` : `<html lang="fr">` initial (pas `en`)

**Action** :

```ts
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  init(): void {
    this.applyLang(this.translate.currentLang ?? 'fr');
    this.translate.onLangChange.subscribe(({ lang }) => this.applyLang(lang));
  }

  private applyLang(lang: string): void {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
```

Wirer dans `app.config.ts` via `APP_INITIALIZER`.

**Acceptance criteria** :
- [ ] `index.html` initial : `<html lang="fr">`
- [ ] Au switch FR → AR, `document.documentElement.lang === 'ar'` et `dir === 'rtl'`
- [ ] Test e2e : `expect(page.locator('html').getAttribute('lang')).toBe('fr')` à load
- [ ] Préparation RTL : ajouter quelques classes Tailwind `rtl:` sur le shell pour valider l'inversion (sidebar à droite en AR)

---

## Task 1.7 — Accents corrects Planning (F-25)

**Fichier** : `public/assets/i18n/applications/erp/fr.json` (chercher `consolidee`, `dependances`, `edition`)

**Patch** : remplacer par `consolidée`, `dépendances`, `édition`.

**Lint** : ajouter une règle qui bloque les mots français connus sans accents :

```js
// scripts/check-fr-accents.mjs
const FORBIDDEN = ['consolidee', 'dependances', 'reference', 'precedent', 'donnees', 'modele', 'systeme', 'creer', 'depot'];
// ... grep dans i18n/*.json + UI strings
```

**Acceptance criteria** :
- [x] Module Planning : « Vue Gantt **consolidée** multi-chantiers avec **dépendances** et **édition** des dates » *(corrigé 2026-05-10 : `phase-drawer`, `chantiers-planning`, `gantt-toolbar`, budget-chantier-detail/listing)*
- [ ] Lint CI bloque toute regression *(à faire avec script `check-fr-accents.mjs`)*

---

## Task 1.8 — Clé manquante `core.ai.assistant.title` (F-35)

**Fichier** : `public/assets/i18n/applications/core/fr.json`

```json
{
  "ai": {
    "assistant": {
      "title": "Assistant IA",
      "subtitle": "Posez une question sur l'ERP",
      "placeholder": "Ex. créer un BC pour le chantier CH-2026-003"
    }
  }
}
```

**Acceptance criteria** :
- [ ] Bouton flottant en bas-droite affiche **Assistant IA** au lieu de la clé brute

---

## Task 1.9 — Dashboard KPI cohérents (F-31)

**Fichier** : `app/applications/erp/pages/dashboard/dashboard.page.ts`

**Bug** : « Avancement moyen 0% » alors que les chantiers individuels affichent 18–62%.

**Cause probable** : le KPI agrège un dataset différent du seed unifié (cf F-04).

**Action** :
1. Connecter le KPI au seed unique (`SEED_CHANTIERS` ou `ChantiersMockService.getChantiers()`).
2. Calcul pondéré par budget : `Σ(budgetHt × avancement) / Σ(budgetHt)`.
3. Afficher la formule en tooltip pour transparence.

**Acceptance criteria** :
- [ ] KPI Dashboard `Avancement moyen` ≠ 0 quand au moins un chantier est en cours
- [ ] La valeur match l'agrégation manuelle des chantiers visibles dans `/chantiers`
- [ ] Tooltip explicite : « Pondéré par budget »

---

## Testing global pour ce dossier

### Tests e2e Playwright à ajouter (dans `e2e/specs/foundations/`)

```ts
test('aucun symbole $ dans toute l\'app', async ({ page }) => {
  for (const url of ['/chantiers', '/chantiers/situations', '/etudes/devis', '/etudes/bibliotheque-prix']) {
    await page.goto(url);
    await expect(page.locator('body')).not.toContainText(/\$[\d,]/);
  }
});

test('html lang=fr et dir=ltr au démarrage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('mock chantiers cohérent multi-modules', async ({ page }) => {
  await page.goto('/chantiers');
  const codesListing = await page.locator('table tbody tr td:first-child').allTextContents();
  await page.goto('/chantiers/planning');
  // les codes du Gantt doivent être un sous-ensemble du listing
  // ...
});
```

### Tests unitaires services

- `mad-currency.pipe.spec.ts` : `0 → '0 MAD'`, `1234567 → '1 234 567 MAD'`, `null → '—'`, `'abc' → '—'`
- `locale.service.spec.ts` : `applyLang('ar')` → `html.dir === 'rtl'`

## Dépendances inverses

Cette tâche est PRÉREQUIS de :
- 02-chantiers-bugs (a besoin du mock unifié)
- 03-shell-ux (toggle langue dépend de LocaleService)
- 04-tables-forms-states (formats nombres dépend de pipe MAD)
- toutes les autres
